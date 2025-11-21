
// ============ FILE 4: src/database/database.module.ts (UPDATED) ============
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../auth/entities/user.entity';
import { Company } from '../company/entities/company.entity';
import { Referral } from '../company/entities/referral.entity';
import { Lead } from '../leads/entities/lead.entity';
import { LeadConsumption } from '../leads/entities/lead-consumption.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const password = configService.get('DB_PASSWORD');
        console.log('Password type:', typeof password, 'Value:', password);
        
        return {
          type: 'postgres',
          host: configService.get('DB_HOST'),
          port: parseInt(configService.get('DB_PORT') || '5432', 10),
          username: configService.get('DB_USERNAME'),
          password: password?.toString() || '',
          database: configService.get('DB_NAME'),
          entities: [User, Company, Referral, Lead, LeadConsumption],
          synchronize: true,
          autoLoadEntities: true,
          logging: configService.get('NODE_ENV') === 'development',
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}