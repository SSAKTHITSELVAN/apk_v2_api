// ============ FILE 1: src/company/company.module.ts (UPDATED) ============
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { Company } from './entities/company.entity';
import { Referral } from './entities/referral.entity';
import { User } from '../auth/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { S3Service } from '../core/services/s3.service';

@Module({
  imports: [TypeOrmModule.forFeature([Company, Referral, User]), AuthModule],
  controllers: [CompanyController],
  providers: [CompanyService, S3Service],
  exports: [CompanyService, S3Service],
})
export class CompanyModule {}
