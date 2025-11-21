// File: src/company/company.service.ts

import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Company } from './entities/company.entity';
import { User } from '../auth/entities/user.entity';
import { Referral } from './entities/referral.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { S3Service } from '../core/services/s3.service';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Referral)
    private referralRepository: Repository<Referral>,
    private configService: ConfigService,
    private s3Service: S3Service,
  ) {}

  /**
   * Generate a unique 6-digit alphanumeric referral code
   */
  private async generateUniqueReferralCode(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    let isUnique = false;

    while (!isUnique) {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const existing = await this.companyRepository.findOne({
        where: { referralCode: code },
      });

      if (!existing) {
        isUnique = true;
      }
    }

    return code;
  }

  /**
   * Check if monthly leads need to be reset
   */
  private shouldResetMonthlyLeads(lastResetDate: Date | null): boolean {
    if (!lastResetDate) return true;

    const now = new Date();
    const lastReset = new Date(lastResetDate);

    // Check if we're in a different month or year
    return (
      now.getMonth() !== lastReset.getMonth() ||
      now.getFullYear() !== lastReset.getFullYear()
    );
  }

  /**
   * Reset monthly leads if needed
   */
  private async resetMonthlyLeadsIfNeeded(company: Company): Promise<void> {
    if (this.shouldResetMonthlyLeads(company.lastLeadResetDate)) {
      company.currentMonthFreeLeads = company.monthlyFreeLeads;
      company.lastLeadResetDate = new Date();
      await this.companyRepository.save(company);
    }
  }

  async createCompany(userId: string, createCompanyDto: CreateCompanyDto) {
    const { gstin, referralCode } = createCompanyDto;

    // Check if user already has a company
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['company'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.company) {
      throw new ConflictException('Company already exists for this user');
    }

    // Check if GSTIN already exists
    const existingCompany = await this.companyRepository.findOne({
      where: { gstin },
    });

    if (existingCompany) {
      throw new ConflictException('GSTIN already registered');
    }

    // Validate referral code if provided
    let referrerCompany: Company | null = null;
    if (referralCode) {
      referrerCompany = await this.companyRepository.findOne({
        where: { referralCode: referralCode.toUpperCase() },
      });

      if (!referrerCompany) {
        throw new BadRequestException('Invalid referral code');
      }
    }

    // Fetch GST data
    const gstData = await this.fetchGstData(gstin);

    if (!gstData.flag) {
      throw new BadRequestException('Invalid GSTIN or GST API error');
    }

    // Generate unique referral code for new company
    const newReferralCode = await this.generateUniqueReferralCode();

    // Create company from GST data
    const company = this.companyRepository.create({
      gstin: gstData.data.gstin,
      legalName: gstData.data.lgnm,
      tradeName: gstData.data.tradeNam,
      status: gstData.data.sts,
      registrationDate: gstData.data.rgdt,
      businessType: gstData.data.dty,
      constitutionOfBusiness: gstData.data.ctb,
      natureOfBusinessActivity: gstData.data.nba,
      centerJurisdiction: gstData.data.ctj,
      stateJurisdiction: gstData.data.stj,
      principalAddress: gstData.data.pradr,
      additionalAddresses: gstData.data.adadr,
      user,
      referralCode: newReferralCode,
      monthlyFreeLeads: 10,
      currentMonthFreeLeads: 10,
      bonusLeads: 0,
      lastLeadResetDate: new Date(),
      referredByCompanyId: referrerCompany?.id || null,
    });

    await this.companyRepository.save(company);

    // If referred, create referral record and award bonus leads
    if (referrerCompany && referralCode) {
      const upperCaseReferralCode = referralCode.toUpperCase();
      
      const referral = this.referralRepository.create({
        referrerId: referrerCompany.id,
        refereeId: company.id,
        referralCode: upperCaseReferralCode,
        bonusLeadsAwarded: 3,
        isActive: true,
      });

      await this.referralRepository.save(referral);

      // Award 3 bonus leads to referrer
      referrerCompany.bonusLeads += 3;
      await this.companyRepository.save(referrerCompany);
    }

    return {
      message: referrerCompany
        ? 'Company created successfully with referral bonus!'
        : 'Company created successfully',
      data: {
        ...company,
        referredBy: referrerCompany
          ? {
              id: referrerCompany.id,
              legalName: referrerCompany.legalName,
              referralCode: referrerCompany.referralCode,
            }
          : null,
      },
    };
  }

  private async fetchGstData(gstin: string) {
    try {
      const apiKey = this.configService.get('GST_API_KEY');
      const baseUrl = this.configService.get('GST_API_BASE_URL');
      const url = `${baseUrl}/${apiKey}/${gstin}`;

      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('GST API Error:', error.message);
      throw new BadRequestException('Failed to fetch GST data');
    }
  }

  async uploadFiles(
    userId: string,
    profileImage?: Express.Multer.File,
    companyLogo?: Express.Multer.File,
  ) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['company'],
    });

    if (!user || !user.company) {
      throw new BadRequestException('Company not found for this user');
    }

    const company = user.company;
    let profileImageData: any = null;
    let companyLogoData: any = null;

    if (profileImage) {
      const result = await this.s3Service.uploadProfileImage(profileImage);
      company.profileImage = result.key;
      profileImageData = {
        key: result.key,
        url: result.signedUrl,
        size: result.size,
        mimeType: result.mimeType,
      };
    } else if (company.profileImage) {
      const signedUrl = await this.s3Service.getAccessibleUrl(company.profileImage);
      if (signedUrl) {
        profileImageData = {
          key: company.profileImage,
          url: signedUrl,
          size: 0,
          mimeType: 'image/*',
        };
      }
    }

    if (companyLogo) {
      const result = await this.s3Service.uploadCompanyLogo(companyLogo);
      company.companyLogo = result.key;
      companyLogoData = {
        key: result.key,
        url: result.signedUrl,
        size: result.size,
        mimeType: result.mimeType,
      };
    } else if (company.companyLogo) {
      const signedUrl = await this.s3Service.getAccessibleUrl(company.companyLogo);
      if (signedUrl) {
        companyLogoData = {
          key: company.companyLogo,
          url: signedUrl,
          size: 0,
          mimeType: 'image/*',
        };
      }
    }

    await this.companyRepository.save(company);

    return {
      message: 'Files uploaded successfully',
      data: {
        profileImage: profileImageData,
        companyLogo: companyLogoData,
      },
    };
  }

  async getCompany(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['company', 'company.referredBy'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.company) {
      return {
        message: 'No company found for this user',
        data: null,
      };
    }

    const company = user.company;

    // Reset monthly leads if needed
    await this.resetMonthlyLeadsIfNeeded(company);

    const companyData = {
      ...company,
      profileImage: await this.s3Service.getAccessibleUrl(company.profileImage),
      companyLogo: await this.s3Service.getAccessibleUrl(company.companyLogo),
      referredBy: company.referredBy
        ? {
            id: company.referredBy.id,
            legalName: company.referredBy.legalName,
            referralCode: company.referredBy.referralCode,
          }
        : null,
    };

    return {
      message: 'Company retrieved successfully',
      data: companyData,
    };
  }

  /**
   * Get referral statistics for a company
   */
  async getReferralStats(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['company'],
    });

    if (!user || !user.company) {
      throw new BadRequestException('Company not found');
    }

    const company = user.company;

    // Get all referrals made by this company
    const referrals = await this.referralRepository.find({
      where: { referrerId: company.id, isActive: true },
      relations: ['referee', 'referee.user'],
      order: { createdAt: 'DESC' },
    });

    // Reset monthly leads if needed
    await this.resetMonthlyLeadsIfNeeded(company);

    const totalReferrals = referrals.length;
    const totalBonusLeadsEarned = referrals.reduce(
      (sum, ref) => sum + ref.bonusLeadsAwarded,
      0,
    );

    return {
      message: 'Referral statistics retrieved successfully',
      data: {
        referralCode: company.referralCode,
        currentMonthFreeLeads: company.currentMonthFreeLeads,
        bonusLeads: company.bonusLeads,
        monthlyFreeLeads: company.monthlyFreeLeads,
        totalReferrals,
        totalBonusLeadsEarned,
        referrals: referrals.map((ref) => ({
          id: ref.id,
          refereeCompanyName: ref.referee.legalName || ref.referee.tradeName,
          refereeMobile: ref.referee.user?.mobileNumber,
          bonusLeadsAwarded: ref.bonusLeadsAwarded,
          createdAt: ref.createdAt,
        })),
      },
    };
  }
}