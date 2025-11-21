// src/leads/dto/deactivate-lead.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class DeactivateLeadDto {
  @ApiProperty({ 
    example: 'Lead fulfilled - found suitable supplier',
    required: false 
  })
  @IsString()
  @IsOptional()
  reason?: string;
}