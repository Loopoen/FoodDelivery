import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import * as schema from '../db/schema/index.js';
import { JwtPayload } from '@FoodDelivery/types';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { GoogleLoginDto } from './dto/google-login.dto.js';

@Injectable()
export class AuthService {
  private googleClient = new OAuth2Client();

  constructor(
    @Inject('DB') private db: NeonHttpDatabase<typeof schema>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const [existing] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, dto.email));

    if (existing) throw new ConflictException('Email already in use');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const [user] = await this.db
      .insert(schema.users)
      .values({
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        password: hashedPassword,
        role: dto.role,
      })
      .returning();

    return {
      user: this.sanitizeUser(user),
      token: this.generateToken(user),
    };
  }

  async login(dto: LoginDto) {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, dto.email));

    if (!user) throw new UnauthorizedException('Invalid Credentials');

    // Tài khoản tạo bằng Google chưa có mật khẩu
    if (!user.password) {
      throw new UnauthorizedException(
        'This account uses Google sign-in. Please continue with Google.',
      );
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);

    if (!passwordMatch) throw new UnauthorizedException('Invalid Credentials');

    return {
      user: this.sanitizeUser(user),
      token: this.generateToken(user),
    };
  }

  async googleLogin(dto: GoogleLoginDto) {
    // GOOGLE_CLIENT_IDS = "webClientId,iosClientId,androidClientId"
    const audience = (process.env.GOOGLE_CLIENT_IDS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    let payload;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: dto.idToken,
        audience,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Invalid Google token');
    }

    if (!payload?.sub || !payload.email || !payload.email_verified) {
      throw new UnauthorizedException('Google account email not verified');
    }

    // 1. Đã từng đăng nhập Google
    let [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.googleId, payload.sub));

    if (!user) {
      const [byEmail] = await this.db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, payload.email));

      if (byEmail) {
        // 2. Email đã đăng ký bằng mật khẩu -> liên kết với Google
        [user] = await this.db
          .update(schema.users)
          .set({ googleId: payload.sub, updatedAt: new Date() })
          .where(eq(schema.users.id, byEmail.id))
          .returning();
      } else {
        // 3. Người dùng mới -> tạo tài khoản
        [user] = await this.db
          .insert(schema.users)
          .values({
            firstName: payload.given_name ?? payload.name ?? 'User',
            lastName: payload.family_name ?? '',
            email: payload.email,
            googleId: payload.sub,
            password: null,
            role: dto.role ?? 'CUSTOMER',
          })
          .returning();
      }
    }

    return {
      user: this.sanitizeUser(user),
      token: this.generateToken(user),
    };
  }

  private generateToken(user: schema.NewUser) {
    const payload: JwtPayload = {
      sub: user.id!,
      email: user.email,
      role: user.role!,
    };
    return this.jwtService.sign(payload);
  }

  private sanitizeUser(user: schema.User) {
    const { password, ...safeUser } = user;
    void password;
    return safeUser;
  }
}