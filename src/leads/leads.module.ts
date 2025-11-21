// ============ FILE: src/leads/leads.module.ts (UPDATED) ============
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { Lead } from './entities/lead.entity';
import { LeadConsumption } from './entities/lead-consumption.entity';
import { LeadReport } from './entities/lead-report.entity';
import { Company } from '../company/entities/company.entity';
import { AuthModule } from '../auth/auth.module';
import { S3Service } from '../core/services/s3.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lead, LeadConsumption, LeadReport, Company]),
    AuthModule,
  ],
  controllers: [LeadsController],
  providers: [LeadsService, S3Service],
  exports: [LeadsService],
})
export class LeadsModule {}