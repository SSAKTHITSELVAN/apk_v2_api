
// ============ FILE 3: src/auth/auth.module.ts (UPDATED) ============
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { Company } from '../company/entities/company.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { S3Service } from '../core/services/s3.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Company]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, S3Service],
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
