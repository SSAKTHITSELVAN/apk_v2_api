// ============ FILE: src/leads/dto/report-lead.dto.ts ============
import { IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LeadReportReason } from '../entities/lead-report.entity';

export class ReportLeadDto {
  @ApiProperty({
    enum: LeadReportReason,
    example: LeadReportReason.SPAM,
    description: 'Reason for reporting the lead',
  })
  @IsEnum(LeadReportReason)
  @IsNotEmpty()
  reason: LeadReportReason;

  @ApiProperty({
    example: 'This lead contains misleading information about pricing',
    description: 'Detailed description of the report',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  description: string;
}
