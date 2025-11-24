
// ============ FILE 2: src/auth/dto/delete-account.dto.ts (UPDATED) ============
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class DeleteAccountDto {
  @ApiProperty({
    description: 'OTP for account deletion verification',
    example: '123456',
  })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  otp: string;
}