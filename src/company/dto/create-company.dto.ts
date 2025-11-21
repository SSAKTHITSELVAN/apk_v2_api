// ============ FILE 1: src/company/dto/create-company.dto.ts (UPDATED) ============
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches, IsOptional } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({
    description: 'GSTIN number (15 characters)',
    example: '06AACCG0527D1Z8',
  })
  @IsNotEmpty()
  @IsString()
  @Length(15, 15, { message: 'GSTIN must be exactly 15 characters' })
  @Matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, {
    message: 'Invalid GSTIN format',
  })
  gstin: string;

  @ApiProperty({
    description: 'Referral code (optional, 6 characters)',
    example: 'ABC123',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(6, 6, { message: 'Referral code must be exactly 6 characters' })
  referralCode?: string;
}
