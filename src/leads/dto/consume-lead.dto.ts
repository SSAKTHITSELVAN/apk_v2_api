
// ============ FILE 2: src/leads/dto/consume-lead.dto.ts ============
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { LeadConsumptionType } from '../entities/lead-consumption.entity';

export class ConsumeLeadDto {
  @ApiProperty({
    description: 'Type of lead consumption',
    enum: LeadConsumptionType,
    example: LeadConsumptionType.FREE,
  })
  @IsEnum(LeadConsumptionType)
  consumptionType: LeadConsumptionType;

  @ApiProperty({
    description: 'Optional notes about the consumption',
    example: 'Interested in this lead for Q4 project',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
