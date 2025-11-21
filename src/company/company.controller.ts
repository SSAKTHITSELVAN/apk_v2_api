
// ============ FILE 2: src/company/company.controller.ts (UPDATED) ============
import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Company')
@Controller('company')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @ApiOperation({ summary: 'Create company from GSTIN with optional referral code' })
  @ApiResponse({ status: 201, description: 'Company created successfully' })
  async createCompany(
    @Request() req,
    @Body() createCompanyDto: CreateCompanyDto,
  ) {
    return this.companyService.createCompany(req.user.id, createCompanyDto);
  }

  @Post('upload-files')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'profileImage', maxCount: 1 },
      { name: 'companyLogo', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload profile image and company logo' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        profileImage: {
          type: 'string',
          format: 'binary',
          description: 'Profile image (optional)',
        },
        companyLogo: {
          type: 'string',
          format: 'binary',
          description: 'Company logo (optional)',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Files uploaded successfully' })
  async uploadFiles(
    @Request() req,
    @UploadedFiles()
    files: {
      profileImage?: Express.Multer.File[];
      companyLogo?: Express.Multer.File[];
    },
  ) {
    return this.companyService.uploadFiles(
      req.user.id,
      files.profileImage?.[0],
      files.companyLogo?.[0],
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get company details' })
  @ApiResponse({ status: 200, description: 'Company retrieved successfully' })
  async getCompany(@Request() req) {
    return this.companyService.getCompany(req.user.id);
  }

  @Get('referral-stats')
  @ApiOperation({ summary: 'Get referral statistics and referred companies' })
  @ApiResponse({ status: 200, description: 'Referral stats retrieved successfully' })
  async getReferralStats(@Request() req) {
    return this.companyService.getReferralStats(req.user.id);
  }
}
