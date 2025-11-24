// ============ FILE 1: src/auth/dto/verify-otp.dto.ts (UPDATED) ============
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Mobile number',
    example: '9876543210',
  })
  @IsNotEmpty()
  @IsString()
  @Length(10, 10)
  mobileNumber: string;

  @ApiProperty({
    description: 'OTP (6 digits)',
    example: '123456',
  })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  otp: string;
}
