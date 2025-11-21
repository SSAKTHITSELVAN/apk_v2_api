
// ============ FILE 3: src/auth/dto/delete-account.dto.ts ============
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class DeleteAccountDto {
  @ApiProperty({
    description: 'OTP for account deletion verification',
    example: '1234',
  })
  @IsNotEmpty()
  @IsString()
  @Length(4, 4, { message: 'OTP must be exactly 4 digits' })
  otp: string;
}