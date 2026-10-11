import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '@FoodDelivery/types';

export class GoogleLoginDto {
  @IsString()
  idToken!: string;


  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}