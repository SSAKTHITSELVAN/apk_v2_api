// File: src/auth/dto/send-otp.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, Length } from 'class-validator';

export class SendOtpDto {
  @ApiProperty({
    description: 'Mobile number (10 digits)',
    example: '9876543210',
  })
  @IsNotEmpty()
  @IsString()
  @Length(10, 10, { message: 'Mobile number must be exactly 10 digits' })
  @Matches(/^[6-9]\d{9}$/, {
    message: 'Invalid mobile number format',
  })
  mobileNumber: string;
}
