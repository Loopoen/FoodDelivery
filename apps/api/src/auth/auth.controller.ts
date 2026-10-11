import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { GoogleLoginDto } from './dto/google-login.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import type { Request as ExpressRequest, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { JwtPayload } from '@FoodDelivery/types';

const isAllowedReturnUrl = (url?: string) =>
  !!url && (url.startsWith('exp://') || url.startsWith('fooddelivery://'));

const getOAuthClient = () =>
  new OAuth2Client(
    process.env.GOOGLE_WEB_CLIENT_ID,
    process.env.GOOGLE_WEB_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('google')
  google(@Body() dto: GoogleLoginDto) {
    return this.authService.googleLogin(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Request() req: ExpressRequest & { user: JwtPayload }) {
    return req.user;
  }


  @Get('google/start')
  googleStart(
    @Query('role') role: string = 'CUSTOMER',
    @Query('returnUrl') returnUrl: string,
    @Res() res: Response,
  ) {
    if (!isAllowedReturnUrl(returnUrl)) {
      throw new BadRequestException('Invalid returnUrl');
    }

    const state = Buffer.from(JSON.stringify({ role, returnUrl })).toString('base64url');
    const url = getOAuthClient().generateAuthUrl({
      scope: ['openid', 'email', 'profile'],
      state,
      prompt: 'select_account',
    });
    return res.redirect(url);
  }

  // Bước 2: Google redirect về đây
  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    if (!code || !state) throw new BadRequestException('Thiếu code hoặc state');

    const { role, returnUrl } = JSON.parse(Buffer.from(state, 'base64url').toString());
    if (!isAllowedReturnUrl(returnUrl)) {
      throw new BadRequestException('Invalid returnUrl');
    }

    const { tokens } = await getOAuthClient().getToken(code);
    if (!tokens.id_token) throw new BadRequestException('Không nhận được id_token');

 
    const result = await this.authService.googleLogin({
      idToken: tokens.id_token,
      role,
    } as GoogleLoginDto);

    const sep = returnUrl.includes('?') ? '&' : '?';
    return res.redirect(`${returnUrl}${sep}token=${encodeURIComponent(result.token)}`);
  }
}