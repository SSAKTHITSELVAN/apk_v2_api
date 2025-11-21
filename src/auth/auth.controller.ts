// ============ FILE 1: src/auth/auth.controller.ts (UPDATED) ============
import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-otp')
  @ApiOperation({ summary: 'Send OTP to mobile number' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  async sendOtp(@Body() sendOtpDto: SendOtpDto) {
    return this.authService.sendOtp(sendOtpDto);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP and authenticate user' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.id);
  }

  @Post('send-delete-otp')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Send OTP for account deletion' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  async sendDeleteAccountOtp(@Request() req) {
    return this.authService.sendDeleteAccountOtp(req.user.id);
  }

  @Delete('delete-account')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete account after OTP verification' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  async deleteAccount(@Request() req, @Body() deleteAccountDto: DeleteAccountDto) {
    return this.authService.deleteAccount(req.user.id, deleteAccountDto);
  }
}
