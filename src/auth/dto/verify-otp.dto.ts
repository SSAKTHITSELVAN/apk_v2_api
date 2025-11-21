
// File: src/auth/dto/verify-otp.dto.ts

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
    description: 'OTP (4 digits)',
    example: '1234',
  })
  @IsNotEmpty()
  @IsString()
  @Length(4, 4)
  otp: string;
}
