// File: src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { CompanyModule } from './company/company.module';
import { S3Service } from './core/services/s3.service';
import { LeadsModule } from './leads/leads.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    AuthModule,
    CompanyModule,
    LeadsModule,
  ],
  controllers: [AppController],
  providers: [AppService, S3Service],
})
export class AppModule {}