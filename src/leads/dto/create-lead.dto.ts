// src/leads/dto/create-lead.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateLeadDto {
  @ApiProperty({ example: 'Need 1000 units of Steel Rods' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'Looking for high-quality steel rods for construction project' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: '₹50,000 - ₹1,00,000', required: false })
  @IsString()
  @IsOptional()
  budget?: string;

  @ApiProperty({ example: '1000 units', required: false })
  @IsString()
  @IsOptional()
  quantity?: string;

  @ApiProperty({ example: 'Mumbai, Maharashtra', required: false })
  @IsString()
  @IsOptional()
  location?: string;
}