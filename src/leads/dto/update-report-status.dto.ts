
// ============ FILE: src/leads/dto/update-report-status.dto.ts ============
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeadReportStatus } from '../entities/lead-report.entity';

export class UpdateReportStatusDto {
  @ApiProperty({
    enum: LeadReportStatus,
    example: LeadReportStatus.REVIEWED,
  })
  @IsEnum(LeadReportStatus)
  status: LeadReportStatus;

  @ApiPropertyOptional({
    example: 'Reviewed and found to be valid complaint',
  })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}