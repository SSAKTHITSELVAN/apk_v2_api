// // ============ FILE: src/leads/leads.service.ts (UPDATED) ============
// import {
//   Injectable,
//   BadRequestException,
//   NotFoundException,
// } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository, Not } from 'typeorm';
// import { Lead } from './entities/lead.entity';
// import { Company } from '../company/entities/company.entity';
// import { LeadConsumption, LeadConsumptionType } from './entities/lead-consumption.entity';
// import { LeadReport, LeadReportStatus } from './entities/lead-report.entity';
// import { CreateLeadDto } from './dto/create-lead.dto';
// import { UpdateLeadDto } from './dto/update-lead.dto';
// import { DeactivateLeadDto } from './dto/deactivate-lead.dto';
// import { ConsumeLeadDto } from './dto/consume-lead.dto';
// import { ReportLeadDto } from './dto/report-lead.dto';
// import { PaginationDto } from './dto/pagination.dto';
// import { UpdateReportStatusDto } from './dto/update-report-status.dto';
// import { S3Service } from '../core/services/s3.service';

// @Injectable()
// export class LeadsService {
//   constructor(
//     @InjectRepository(Lead)
//     private leadRepository: Repository<Lead>,
//     @InjectRepository(Company)
//     private companyRepository: Repository<Company>,
//     @InjectRepository(LeadConsumption)
//     private leadConsumptionRepository: Repository<LeadConsumption>,
//     @InjectRepository(LeadReport)
//     private leadReportRepository: Repository<LeadReport>,
//     private s3Service: S3Service,
//   ) {}

//   // ============ LEAD QUOTA METHODS ============

//   /**
//    * Get company's available lead count with detailed split
//    */
//   async getCompanyLeadQuota(companyId: string) {
//     const company = await this.companyRepository.findOne({
//       where: { id: companyId },
//     });

//     if (!company) {
//       throw new NotFoundException('Company not found');
//     }

//     await this.resetMonthlyLeadsIfNeeded(company);

//     // Get consumption stats for current month
//     const now = new Date();
//     const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

//     const monthlyConsumptions = await this.leadConsumptionRepository
//       .createQueryBuilder('consumption')
//       .where('consumption.companyId = :companyId', { companyId })
//       .andWhere('consumption.consumedAt >= :startOfMonth', { startOfMonth })
//       .getCount();

//     const freeLeadsUsedThisMonth = await this.leadConsumptionRepository
//       .createQueryBuilder('consumption')
//       .where('consumption.companyId = :companyId', { companyId })
//       .andWhere('consumption.consumedAt >= :startOfMonth', { startOfMonth })
//       .andWhere('consumption.consumptionType = :type', { type: LeadConsumptionType.FREE })
//       .getCount();

//     const bonusLeadsUsedThisMonth = await this.leadConsumptionRepository
//       .createQueryBuilder('consumption')
//       .where('consumption.companyId = :companyId', { companyId })
//       .andWhere('consumption.consumedAt >= :startOfMonth', { startOfMonth })
//       .andWhere('consumption.consumptionType = :type', { type: LeadConsumptionType.BONUS })
//       .getCount();

//     // Calculate days until reset
//     const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
//     const daysUntilReset = Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

//     return {
//       message: 'Lead quota retrieved successfully',
//       data: {
//         companyId: company.id,
//         companyName: company.legalName || company.tradeName,
//         quota: {
//           monthlyFreeLeads: company.monthlyFreeLeads,
//           currentMonthFreeLeads: company.currentMonthFreeLeads,
//           bonusLeads: company.bonusLeads,
//           totalAvailable: company.currentMonthFreeLeads + company.bonusLeads,
//         },
//         usage: {
//           freeLeadsUsedThisMonth,
//           bonusLeadsUsedThisMonth,
//           totalConsumedThisMonth: monthlyConsumptions,
//         },
//         resetInfo: {
//           lastResetDate: company.lastLeadResetDate,
//           daysUntilNextReset: daysUntilReset,
//           nextResetDate: nextMonth.toISOString().split('T')[0],
//         },
//       },
//     };
//   }

//   // ============ LEAD REPORT METHODS ============

//   /**
//    * Report a lead for inappropriate content
//    */
//   async reportLead(leadId: string, companyId: string | null, reportLeadDto: ReportLeadDto) {
//     const lead = await this.leadRepository.findOne({
//       where: { id: leadId, isDeleted: false },
//     });

//     if (!lead) {
//       throw new NotFoundException('Lead not found');
//     }

//     // Check if already reported by this company
//     if (companyId) {
//       const existingReport = await this.leadReportRepository.findOne({
//         where: { leadId, reportedByCompanyId: companyId },
//       });

//       if (existingReport) {
//         throw new BadRequestException('You have already reported this lead');
//       }
//     }

//     const report = this.leadReportRepository.create({
//       leadId,
//       reportedByCompanyId: companyId,
//       reason: reportLeadDto.reason,
//       description: reportLeadDto.description,
//       status: LeadReportStatus.PENDING,
//     });

//     await this.leadReportRepository.save(report);

//     // Increment report count on lead
//     lead.reportCount += 1;
//     await this.leadRepository.save(lead);

//     return {
//       message: 'Lead reported successfully',
//       data: {
//         reportId: report.id,
//         leadId: report.leadId,
//         reason: report.reason,
//         status: report.status,
//         reportedAt: report.reportedAt,
//       },
//     };
//   }

//   /**
//    * Get all reports (Admin endpoint)
//    */
//   async getAllReports(paginationDto: PaginationDto) {
//     const { page = 1, limit = 10 } = paginationDto;
//     const skip = (page - 1) * limit;

//     const [reports, total] = await this.leadReportRepository.findAndCount({
//       relations: ['lead', 'reportedByCompany'],
//       order: { reportedAt: 'DESC' },
//       skip,
//       take: limit,
//     });

//     const reportsWithDetails = await Promise.all(
//       reports.map(async (report) => ({
//         id: report.id,
//         reason: report.reason,
//         description: report.description,
//         status: report.status,
//         adminNotes: report.adminNotes,
//         reportedAt: report.reportedAt,
//         reviewedAt: report.reviewedAt,
//         lead: {
//           id: report.lead.id,
//           title: report.lead.title,
//           description: report.lead.description,
//           isActive: report.lead.isActive,
//           reportCount: report.lead.reportCount,
//           imageUrl: report.lead.imageKey
//             ? await this.s3Service.generateSignedUrl(report.lead.imageKey)
//             : null,
//         },
//         reportedBy: report.reportedByCompany
//           ? {
//               id: report.reportedByCompany.id,
//               companyName: report.reportedByCompany.legalName || report.reportedByCompany.tradeName,
//             }
//           : null,
//       })),
//     );

//     return {
//       message: 'Reports retrieved successfully',
//       data: reportsWithDetails,
//       pagination: {
//         currentPage: page,
//         itemsPerPage: limit,
//         totalItems: total,
//         totalPages: Math.ceil(total / limit),
//         hasNextPage: page < Math.ceil(total / limit),
//         hasPreviousPage: page > 1,
//       },
//     };
//   }

//   /**
//    * Update report status (Admin endpoint)
//    */
//   async updateReportStatus(reportId: string, updateDto: UpdateReportStatusDto) {
//     const report = await this.leadReportRepository.findOne({
//       where: { id: reportId },
//       relations: ['lead'],
//     });

//     if (!report) {
//       throw new NotFoundException('Report not found');
//     }

//     report.status = updateDto.status;
//     report.adminNotes = updateDto.adminNotes || null;
//     report.reviewedAt = new Date();

//     await this.leadReportRepository.save(report);

//     return {
//       message: 'Report status updated successfully',
//       data: {
//         id: report.id,
//         status: report.status,
//         adminNotes: report.adminNotes,
//         reviewedAt: report.reviewedAt,
//       },
//     };
//   }

//   // ============ UPDATED LEAD FEED WITH PAGINATION ============

//   /**
//    * Get leads feed with pagination (without company details)
//    */
//   async getLeadsFeedPaginated(companyId: string, paginationDto: PaginationDto) {
//     const { page = 1, limit = 10 } = paginationDto;
//     const skip = (page - 1) * limit;

//     const [leads, total] = await this.leadRepository.findAndCount({
//       where: {
//         isActive: true,
//         isDeleted: false,
//         companyId: Not(companyId),
//       },
//       order: { createdAt: 'DESC' },
//       skip,
//       take: limit,
//     });

//     // Transform leads WITHOUT company details
//     const leadsWithoutCompany = await Promise.all(
//       leads.map(async (lead) => this.transformLeadForFeed(lead)),
//     );

//     return {
//       message: 'Leads feed retrieved successfully',
//       data: leadsWithoutCompany,
//       pagination: {
//         currentPage: page,
//         itemsPerPage: limit,
//         totalItems: total,
//         totalPages: Math.ceil(total / limit),
//         hasNextPage: page < Math.ceil(total / limit),
//         hasPreviousPage: page > 1,
//       },
//     };
//   }

//   /**
//    * Transform lead for feed (without company details)
//    */
//   private async transformLeadForFeed(lead: Lead): Promise<any> {
//     const { imageKey, imageName, imageSize, imageMimeType, company, companyId, ...leadData } = lead;

//     const imageUrl = imageKey
//       ? await this.s3Service.generateSignedUrl(imageKey, 7 * 24 * 60 * 60)
//       : null;

//     return {
//       ...leadData,
//       imageUrl,
//       ...(imageKey && { imageName, imageSize, imageMimeType }),
//     };
//   }

//   // ============ HELPER METHODS ============

//   private shouldResetMonthlyLeads(lastResetDate: Date | null): boolean {
//     if (!lastResetDate) return true;
//     const now = new Date();
//     const lastReset = new Date(lastResetDate);
//     return now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();
//   }

//   private async resetMonthlyLeadsIfNeeded(company: Company): Promise<void> {
//     if (this.shouldResetMonthlyLeads(company.lastLeadResetDate)) {
//       company.currentMonthFreeLeads = company.monthlyFreeLeads;
//       company.lastLeadResetDate = new Date();
//       await this.companyRepository.save(company);
//     }
//   }

//   // ============ EXISTING METHODS (unchanged) ============

//   async consumeLead(leadId: string, companyId: string, consumeLeadDto: ConsumeLeadDto) {
//     const company = await this.companyRepository.findOne({ where: { id: companyId } });
//     if (!company) throw new NotFoundException('Company not found');
//     await this.resetMonthlyLeadsIfNeeded(company);

//     const lead = await this.leadRepository.findOne({
//       where: { id: leadId, isActive: true, isDeleted: false },
//       relations: ['company', 'company.user'],
//     });
//     if (!lead) throw new NotFoundException('Lead not found or not active');
//     if (lead.companyId === companyId) throw new BadRequestException('You cannot consume your own lead');

//     const existingConsumption = await this.leadConsumptionRepository.findOne({ where: { leadId, companyId } });
//     if (existingConsumption) throw new BadRequestException('You have already consumed this lead');

//     const { consumptionType, notes } = consumeLeadDto;

//     if (consumptionType === LeadConsumptionType.FREE && company.currentMonthFreeLeads <= 0) {
//       throw new BadRequestException('No free leads remaining this month.');
//     }
//     if (consumptionType === LeadConsumptionType.BONUS && company.bonusLeads <= 0) {
//       throw new BadRequestException('No bonus leads available.');
//     }

//     const consumption = this.leadConsumptionRepository.create({ companyId, leadId, consumptionType, notes: notes || null });
//     await this.leadConsumptionRepository.save(consumption);

//     if (consumptionType === LeadConsumptionType.FREE) company.currentMonthFreeLeads -= 1;
//     else company.bonusLeads -= 1;
//     await this.companyRepository.save(company);

//     lead.consumptionCount += 1;
//     await this.leadRepository.save(lead);

//     return {
//       message: 'Lead consumed successfully',
//       data: {
//         lead: await this.transformLeadWithContactDetails(lead),
//         remainingFreeLeads: company.currentMonthFreeLeads,
//         remainingBonusLeads: company.bonusLeads,
//         consumptionType,
//       },
//     };
//   }

//   async getMyConsumptions(companyId: string) {
//     const consumptions = await this.leadConsumptionRepository.find({
//       where: { companyId },
//       relations: ['lead', 'lead.company'],
//       order: { consumedAt: 'DESC' },
//     });

//     const consumptionsWithDetails = await Promise.all(
//       consumptions.map(async (c) => ({
//         id: c.id,
//         consumptionType: c.consumptionType,
//         notes: c.notes,
//         consumedAt: c.consumedAt,
//         lead: await this.transformLeadWithContactDetails(c.lead),
//       })),
//     );

//     return { message: 'Consumption history retrieved successfully', data: consumptionsWithDetails };
//   }

//   async getLeadAvailability(leadId: string, companyId: string) {
//     const company = await this.companyRepository.findOne({ where: { id: companyId } });
//     if (!company) throw new NotFoundException('Company not found');
//     await this.resetMonthlyLeadsIfNeeded(company);

//     const lead = await this.leadRepository.findOne({ where: { id: leadId, isActive: true, isDeleted: false } });
//     if (!lead) throw new NotFoundException('Lead not found or not active');

//     const alreadyConsumed = await this.leadConsumptionRepository.findOne({ where: { leadId, companyId } });
//     const isOwnLead = lead.companyId === companyId;

//     return {
//       message: 'Lead availability checked',
//       data: { canConsume: !alreadyConsumed && !isOwnLead, alreadyConsumed: !!alreadyConsumed, isOwnLead, availableFreeLeads: company.currentMonthFreeLeads, availableBonusLeads: company.bonusLeads },
//     };
//   }

//   async createLead(companyId: string, createLeadDto: CreateLeadDto, image?: Express.Multer.File) {
//     const company = await this.companyRepository.findOne({ where: { id: companyId } });
//     if (!company) throw new NotFoundException('Company not found');

//     const lead = this.leadRepository.create({ ...createLeadDto, companyId, company });
//     if (image) {
//       const uploadResult = await this.s3Service.uploadFile(image, 'lead-images');
//       lead.imageKey = uploadResult.key;
//       lead.imageName = image.originalname;
//       lead.imageSize = image.size;
//       lead.imageMimeType = image.mimetype;
//     }

//     const savedLead = await this.leadRepository.save(lead);
//     return { message: 'Lead created successfully', data: await this.transformLeadWithSignedUrl(savedLead) };
//   }

//   async getPublicLeads() {
//     const leads = await this.leadRepository.find({
//       where: { isActive: true, isDeleted: false },
//       relations: ['company', 'company.user'],
//       order: { createdAt: 'DESC' },
//     });
//     return { message: 'Active leads retrieved successfully', data: await Promise.all(leads.map((l) => this.transformLeadWithSignedUrl(l))) };
//   }

//   async getPublicLeadById(leadId: string) {
//     const lead = await this.leadRepository.findOne({ where: { id: leadId, isActive: true, isDeleted: false }, relations: ['company', 'company.user'] });
//     if (!lead) throw new NotFoundException('Lead not found or not active');
//     lead.viewCount += 1;
//     await this.leadRepository.save(lead);
//     return { message: 'Lead retrieved successfully', data: await this.transformLeadWithSignedUrl(lead) };
//   }

//   async getLeadsForAuthenticatedUser(companyId: string) {
//     const leads = await this.leadRepository.find({
//       where: { isActive: true, isDeleted: false, companyId: Not(companyId) },
//       relations: ['company', 'company.user'],
//       order: { createdAt: 'DESC' },
//     });
//     return { message: 'Leads retrieved successfully', data: await Promise.all(leads.map((l) => this.transformLeadWithSignedUrl(l))) };
//   }

//   async getLeadById(leadId: string, companyId: string) {
//     const lead = await this.leadRepository.findOne({ where: { id: leadId, companyId, isDeleted: false }, relations: ['company'] });
//     if (!lead) throw new NotFoundException('Lead not found');
//     return { message: 'Lead retrieved successfully', data: await this.transformLeadWithSignedUrl(lead) };
//   }

//   async updateLead(leadId: string, companyId: string, updateLeadDto: UpdateLeadDto, image?: Express.Multer.File) {
//     const lead = await this.leadRepository.findOne({ where: { id: leadId, companyId, isDeleted: false } });
//     if (!lead) throw new NotFoundException('Lead not found');

//     Object.assign(lead, updateLeadDto);
//     if (image) {
//       if (lead.imageKey) await this.s3Service.deleteFile(lead.imageKey);
//       const uploadResult = await this.s3Service.uploadFile(image, 'lead-images');
//       lead.imageKey = uploadResult.key;
//       lead.imageName = image.originalname;
//       lead.imageSize = image.size;
//       lead.imageMimeType = image.mimetype;
//     }

//     return { message: 'Lead updated successfully', data: await this.transformLeadWithSignedUrl(await this.leadRepository.save(lead)) };
//   }

//   async deleteLead(leadId: string, companyId: string) {
//     const lead = await this.leadRepository.findOne({ where: { id: leadId, companyId, isDeleted: false } });
//     if (!lead) throw new NotFoundException('Lead not found');
//     lead.isDeleted = true;
//     lead.isActive = false;
//     await this.leadRepository.save(lead);
//     return { message: 'Lead deleted successfully', data: null };
//   }

//   async deactivateLead(leadId: string, companyId: string, deactivateLeadDto: DeactivateLeadDto) {
//     const lead = await this.leadRepository.findOne({ where: { id: leadId, companyId, isDeleted: false } });
//     if (!lead) throw new NotFoundException('Lead not found');
//     lead.isActive = false;
//     lead.reasonForDeactivation = deactivateLeadDto.reason || undefined;
//     await this.leadRepository.save(lead);
//     return { message: 'Lead deactivated successfully', data: await this.transformLeadWithSignedUrl(lead) };
//   }

//   async getLeadImageUrl(leadId: string) {
//     const lead = await this.leadRepository.findOne({ where: { id: leadId, isDeleted: false } });
//     if (!lead) throw new NotFoundException('Lead not found');
//     if (!lead.imageKey) throw new NotFoundException('No image found for this lead');
//     return { message: 'Image URL generated successfully', data: { imageUrl: await this.s3Service.generateSignedUrl(lead.imageKey), imageName: lead.imageName, imageSize: lead.imageSize, imageMimeType: lead.imageMimeType } };
//   }

//   async toggleLeadStatus(leadId: string, companyId: string) {
//     const lead = await this.leadRepository.findOne({ where: { id: leadId, companyId, isDeleted: false } });
//     if (!lead) throw new NotFoundException('Lead not found');
//     lead.isActive = !lead.isActive;
//     if (lead.isActive) lead.reasonForDeactivation = undefined;
//     await this.leadRepository.save(lead);
//     return { message: `Lead ${lead.isActive ? 'activated' : 'deactivated'} successfully`, data: await this.transformLeadWithSignedUrl(lead) };
//   }

//   async getMyLeads(companyId: string) {
//     const leads = await this.leadRepository.find({ where: { companyId, isDeleted: false }, relations: ['company'], order: { createdAt: 'DESC' } });
//     return { message: 'Your leads retrieved successfully', data: await Promise.all(leads.map((l) => this.transformLeadWithSignedUrl(l))) };
//   }

//   async getMyActiveLeads(companyId: string) {
//     const leads = await this.leadRepository.find({ where: { companyId, isActive: true, isDeleted: false }, relations: ['company'], order: { createdAt: 'DESC' } });
//     return { message: 'Your active leads retrieved successfully', data: await Promise.all(leads.map((l) => this.transformLeadWithSignedUrl(l))) };
//   }

//   async getMyInactiveLeads(companyId: string) {
//     const leads = await this.leadRepository.find({ where: { companyId, isActive: false, isDeleted: false }, relations: ['company'], order: { createdAt: 'DESC' } });
//     return { message: 'Your inactive leads retrieved successfully', data: await Promise.all(leads.map((l) => this.transformLeadWithSignedUrl(l))) };
//   }

//   // ============ TRANSFORM HELPERS ============

//   private async transformCompanyWithSignedUrls(company: Company): Promise<any> {
//     if (!company) return null;
//     const { profileImage, companyLogo, user, ...companyData } = company;
//     return {
//       ...companyData,
//       profileImageUrl: profileImage ? await this.s3Service.getAccessibleUrl(profileImage, 7 * 24 * 60 * 60) : null,
//       companyLogoUrl: companyLogo ? await this.s3Service.getAccessibleUrl(companyLogo, 7 * 24 * 60 * 60) : null,
//       user: user ? { id: user.id, mobileNumber: user.mobileNumber, isVerified: user.isVerified, isActive: user.isActive, createdAt: user.createdAt, updatedAt: user.updatedAt } : undefined,
//     };
//   }

//   private async transformLeadWithSignedUrl(lead: Lead): Promise<any> {
//     const { imageKey, imageName, imageSize, imageMimeType, company, ...leadData } = lead;
//     const imageUrl = imageKey ? await this.s3Service.generateSignedUrl(imageKey, 7 * 24 * 60 * 60) : null;
//     return { ...leadData, imageUrl, ...(imageKey && { imageName, imageSize, imageMimeType }), company: company ? await this.transformCompanyWithSignedUrls(company) : undefined };
//   }

//   private async transformLeadWithContactDetails(lead: Lead): Promise<any> {
//     const { imageKey, imageName, imageSize, imageMimeType, company, ...leadData } = lead;
//     const imageUrl = imageKey ? await this.s3Service.generateSignedUrl(imageKey, 7 * 24 * 60 * 60) : null;
//     const transformedLead: any = { ...leadData, imageUrl, ...(imageKey && { imageName, imageSize, imageMimeType }) };
//     if (company) {
//       transformedLead.company = await this.transformCompanyWithSignedUrls(company);
//       if (company.user) {
//         transformedLead.contactDetails = { mobileNumber: company.user.mobileNumber, companyName: company.legalName || company.tradeName, gstin: company.gstin };
//       }
//     }
//     return transformedLead;
//   }
// }




// ============ FILE: src/leads/leads.service.ts (UPDATED) ============
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Lead } from './entities/lead.entity';
import { Company } from '../company/entities/company.entity';
import { LeadConsumption, LeadConsumptionType } from './entities/lead-consumption.entity';
import { LeadReport, LeadReportStatus } from './entities/lead-report.entity';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { DeactivateLeadDto } from './dto/deactivate-lead.dto';
import { ConsumeLeadDto } from './dto/consume-lead.dto';
import { ReportLeadDto } from './dto/report-lead.dto';
import { PaginationDto } from './dto/pagination.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { S3Service } from '../core/services/s3.service';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(LeadConsumption)
    private leadConsumptionRepository: Repository<LeadConsumption>,
    @InjectRepository(LeadReport)
    private leadReportRepository: Repository<LeadReport>,
    private s3Service: S3Service,
  ) {}

  // ============ LEAD QUOTA METHODS ============

  /**
   * Get company's available lead count with detailed split
   */
  async getCompanyLeadQuota(companyId: string) {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    await this.resetMonthlyLeadsIfNeeded(company);

    // Get consumption stats for current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyConsumptions = await this.leadConsumptionRepository
      .createQueryBuilder('consumption')
      .where('consumption.companyId = :companyId', { companyId })
      .andWhere('consumption.consumedAt >= :startOfMonth', { startOfMonth })
      .getCount();

    const freeLeadsUsedThisMonth = await this.leadConsumptionRepository
      .createQueryBuilder('consumption')
      .where('consumption.companyId = :companyId', { companyId })
      .andWhere('consumption.consumedAt >= :startOfMonth', { startOfMonth })
      .andWhere('consumption.consumptionType = :type', { type: LeadConsumptionType.FREE })
      .getCount();

    const bonusLeadsUsedThisMonth = await this.leadConsumptionRepository
      .createQueryBuilder('consumption')
      .where('consumption.companyId = :companyId', { companyId })
      .andWhere('consumption.consumedAt >= :startOfMonth', { startOfMonth })
      .andWhere('consumption.consumptionType = :type', { type: LeadConsumptionType.BONUS })
      .getCount();

    // Calculate days until reset
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const daysUntilReset = Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      message: 'Lead quota retrieved successfully',
      data: {
        companyId: company.id,
        companyName: company.legalName || company.tradeName,
        quota: {
          monthlyFreeLeads: company.monthlyFreeLeads,
          currentMonthFreeLeads: company.currentMonthFreeLeads,
          bonusLeads: company.bonusLeads,
          totalAvailable: company.currentMonthFreeLeads + company.bonusLeads,
        },
        usage: {
          freeLeadsUsedThisMonth,
          bonusLeadsUsedThisMonth,
          totalConsumedThisMonth: monthlyConsumptions,
        },
        resetInfo: {
          lastResetDate: company.lastLeadResetDate,
          daysUntilNextReset: daysUntilReset,
          nextResetDate: nextMonth.toISOString().split('T')[0],
        },
      },
    };
  }

  // ============ LEAD REPORT METHODS ============

  /**
   * Report a lead for inappropriate content
   */
  async reportLead(leadId: string, companyId: string | null, reportLeadDto: ReportLeadDto) {
    const lead = await this.leadRepository.findOne({
      where: { id: leadId, isDeleted: false },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    // Check if already reported by this company
    if (companyId) {
      const existingReport = await this.leadReportRepository.findOne({
        where: { leadId, reportedByCompanyId: companyId },
      });

      if (existingReport) {
        throw new BadRequestException('You have already reported this lead');
      }
    }

    const report = this.leadReportRepository.create({
      leadId,
      reportedByCompanyId: companyId,
      reason: reportLeadDto.reason,
      description: reportLeadDto.description,
      status: LeadReportStatus.PENDING,
    });

    await this.leadReportRepository.save(report);

    // Increment report count on lead
    lead.reportCount += 1;
    await this.leadRepository.save(lead);

    return {
      message: 'Lead reported successfully',
      data: {
        reportId: report.id,
        leadId: report.leadId,
        reason: report.reason,
        status: report.status,
        reportedAt: report.reportedAt,
      },
    };
  }

  /**
   * Get all reports (Admin endpoint)
   */
  async getAllReports(paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [reports, total] = await this.leadReportRepository.findAndCount({
      relations: ['lead', 'reportedByCompany'],
      order: { reportedAt: 'DESC' },
      skip,
      take: limit,
    });

    const reportsWithDetails = await Promise.all(
      reports.map(async (report) => ({
        id: report.id,
        reason: report.reason,
        description: report.description,
        status: report.status,
        adminNotes: report.adminNotes,
        reportedAt: report.reportedAt,
        reviewedAt: report.reviewedAt,
        lead: {
          id: report.lead.id,
          title: report.lead.title,
          description: report.lead.description,
          isActive: report.lead.isActive,
          reportCount: report.lead.reportCount,
          imageUrl: report.lead.imageKey
            ? await this.s3Service.generateSignedUrl(report.lead.imageKey)
            : null,
        },
        reportedBy: report.reportedByCompany
          ? {
              id: report.reportedByCompany.id,
              companyName: report.reportedByCompany.legalName || report.reportedByCompany.tradeName,
            }
          : null,
      })),
    );

    return {
      message: 'Reports retrieved successfully',
      data: reportsWithDetails,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Update report status (Admin endpoint)
   */
  async updateReportStatus(reportId: string, updateDto: UpdateReportStatusDto) {
    const report = await this.leadReportRepository.findOne({
      where: { id: reportId },
      relations: ['lead'],
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    report.status = updateDto.status;
    report.adminNotes = updateDto.adminNotes || null;
    report.reviewedAt = new Date();

    await this.leadReportRepository.save(report);

    return {
      message: 'Report status updated successfully',
      data: {
        id: report.id,
        status: report.status,
        adminNotes: report.adminNotes,
        reviewedAt: report.reviewedAt,
      },
    };
  }

  // ============ UPDATED LEAD FEED WITH PAGINATION (EXCLUDE CONSUMED LEADS) ============

  /**
   * Get leads feed with pagination (without company details, excluding consumed leads)
   */
  async getLeadsFeedPaginated(companyId: string, paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    // Get all lead IDs that this company has already consumed
    const consumedLeadIds = await this.leadConsumptionRepository
      .createQueryBuilder('consumption')
      .select('consumption.leadId')
      .where('consumption.companyId = :companyId', { companyId })
      .getRawMany()
      .then(results => results.map(r => r.consumption_leadId));

    // Build query to exclude own leads and consumed leads
    const queryBuilder = this.leadRepository.createQueryBuilder('lead')
      .where('lead.isActive = :isActive', { isActive: true })
      .andWhere('lead.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('lead.companyId != :companyId', { companyId });

    // Exclude consumed leads if there are any
    if (consumedLeadIds.length > 0) {
      queryBuilder.andWhere('lead.id NOT IN (:...consumedLeadIds)', { consumedLeadIds });
    }

    // Get total count and paginated results
    const [leads, total] = await queryBuilder
      .orderBy('lead.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Transform leads WITHOUT company details
    const leadsWithoutCompany = await Promise.all(
      leads.map(async (lead) => this.transformLeadForFeed(lead)),
    );

    return {
      message: 'Leads feed retrieved successfully',
      data: leadsWithoutCompany,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Transform lead for feed (without company details)
   */
  private async transformLeadForFeed(lead: Lead): Promise<any> {
    const { imageKey, imageName, imageSize, imageMimeType, company, companyId, ...leadData } = lead;

    const imageUrl = imageKey
      ? await this.s3Service.generateSignedUrl(imageKey, 7 * 24 * 60 * 60)
      : null;

    return {
      ...leadData,
      imageUrl,
      ...(imageKey && { imageName, imageSize, imageMimeType }),
    };
  }

  // ============ HELPER METHODS ============

  private shouldResetMonthlyLeads(lastResetDate: Date | null): boolean {
    if (!lastResetDate) return true;
    const now = new Date();
    const lastReset = new Date(lastResetDate);
    return now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();
  }

  private async resetMonthlyLeadsIfNeeded(company: Company): Promise<void> {
    if (this.shouldResetMonthlyLeads(company.lastLeadResetDate)) {
      company.currentMonthFreeLeads = company.monthlyFreeLeads;
      company.lastLeadResetDate = new Date();
      await this.companyRepository.save(company);
    }
  }

  // ============ EXISTING METHODS ============

  async consumeLead(leadId: string, companyId: string, consumeLeadDto: ConsumeLeadDto) {
    const company = await this.companyRepository.findOne({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');
    await this.resetMonthlyLeadsIfNeeded(company);

    const lead = await this.leadRepository.findOne({
      where: { id: leadId, isActive: true, isDeleted: false },
      relations: ['company', 'company.user'],
    });
    if (!lead) throw new NotFoundException('Lead not found or not active');
    if (lead.companyId === companyId) throw new BadRequestException('You cannot consume your own lead');

    const existingConsumption = await this.leadConsumptionRepository.findOne({ where: { leadId, companyId } });
    if (existingConsumption) throw new BadRequestException('You have already consumed this lead');

    const { consumptionType, notes } = consumeLeadDto;

    if (consumptionType === LeadConsumptionType.FREE && company.currentMonthFreeLeads <= 0) {
      throw new BadRequestException('No free leads remaining this month.');
    }
    if (consumptionType === LeadConsumptionType.BONUS && company.bonusLeads <= 0) {
      throw new BadRequestException('No bonus leads available.');
    }

    const consumption = this.leadConsumptionRepository.create({ companyId, leadId, consumptionType, notes: notes || null });
    await this.leadConsumptionRepository.save(consumption);

    if (consumptionType === LeadConsumptionType.FREE) company.currentMonthFreeLeads -= 1;
    else company.bonusLeads -= 1;
    await this.companyRepository.save(company);

    lead.consumptionCount += 1;
    await this.leadRepository.save(lead);

    return {
      message: 'Lead consumed successfully',
      data: {
        lead: await this.transformLeadWithContactDetails(lead),
        remainingFreeLeads: company.currentMonthFreeLeads,
        remainingBonusLeads: company.bonusLeads,
        consumptionType,
      },
    };
  }

  async getMyConsumptions(companyId: string) {
    const consumptions = await this.leadConsumptionRepository.find({
      where: { companyId },
      relations: ['lead', 'lead.company', 'lead.company.user'],
      order: { consumedAt: 'DESC' },
    });

    const consumptionsWithDetails = await Promise.all(
      consumptions.map(async (c) => ({
        id: c.id,
        consumptionType: c.consumptionType,
        notes: c.notes,
        consumedAt: c.consumedAt,
        lead: await this.transformLeadWithContactDetails(c.lead),
      })),
    );

    return { message: 'Consumption history retrieved successfully', data: consumptionsWithDetails };
  }

  async getLeadAvailability(leadId: string, companyId: string) {
    const company = await this.companyRepository.findOne({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');
    await this.resetMonthlyLeadsIfNeeded(company);

    const lead = await this.leadRepository.findOne({ where: { id: leadId, isActive: true, isDeleted: false } });
    if (!lead) throw new NotFoundException('Lead not found or not active');

    const alreadyConsumed = await this.leadConsumptionRepository.findOne({ where: { leadId, companyId } });
    const isOwnLead = lead.companyId === companyId;

    return {
      message: 'Lead availability checked',
      data: { canConsume: !alreadyConsumed && !isOwnLead, alreadyConsumed: !!alreadyConsumed, isOwnLead, availableFreeLeads: company.currentMonthFreeLeads, availableBonusLeads: company.bonusLeads },
    };
  }

  async createLead(companyId: string, createLeadDto: CreateLeadDto, image?: Express.Multer.File) {
    const company = await this.companyRepository.findOne({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');

    const lead = this.leadRepository.create({ ...createLeadDto, companyId, company });
    if (image) {
      const uploadResult = await this.s3Service.uploadFile(image, 'lead-images');
      lead.imageKey = uploadResult.key;
      lead.imageName = image.originalname;
      lead.imageSize = image.size;
      lead.imageMimeType = image.mimetype;
    }

    const savedLead = await this.leadRepository.save(lead);
    return { message: 'Lead created successfully', data: await this.transformLeadWithSignedUrl(savedLead) };
  }

  async getPublicLeads() {
    const leads = await this.leadRepository.find({
      where: { isActive: true, isDeleted: false },
      relations: ['company', 'company.user'],
      order: { createdAt: 'DESC' },
    });
    return { message: 'Active leads retrieved successfully', data: await Promise.all(leads.map((l) => this.transformLeadWithSignedUrl(l))) };
  }

  async getPublicLeadById(leadId: string) {
    const lead = await this.leadRepository.findOne({ where: { id: leadId, isActive: true, isDeleted: false }, relations: ['company', 'company.user'] });
    if (!lead) throw new NotFoundException('Lead not found or not active');
    lead.viewCount += 1;
    await this.leadRepository.save(lead);
    return { message: 'Lead retrieved successfully', data: await this.transformLeadWithSignedUrl(lead) };
  }

  async getLeadsForAuthenticatedUser(companyId: string) {
    const leads = await this.leadRepository.find({
      where: { isActive: true, isDeleted: false, companyId: Not(companyId) },
      relations: ['company', 'company.user'],
      order: { createdAt: 'DESC' },
    });
    return { message: 'Leads retrieved successfully', data: await Promise.all(leads.map((l) => this.transformLeadWithSignedUrl(l))) };
  }

  async getLeadById(leadId: string, companyId: string) {
    const lead = await this.leadRepository.findOne({ where: { id: leadId, companyId, isDeleted: false }, relations: ['company'] });
    if (!lead) throw new NotFoundException('Lead not found');
    return { message: 'Lead retrieved successfully', data: await this.transformLeadWithSignedUrl(lead) };
  }

  async updateLead(leadId: string, companyId: string, updateLeadDto: UpdateLeadDto, image?: Express.Multer.File) {
    const lead = await this.leadRepository.findOne({ where: { id: leadId, companyId, isDeleted: false } });
    if (!lead) throw new NotFoundException('Lead not found');

    Object.assign(lead, updateLeadDto);
    if (image) {
      if (lead.imageKey) await this.s3Service.deleteFile(lead.imageKey);
      const uploadResult = await this.s3Service.uploadFile(image, 'lead-images');
      lead.imageKey = uploadResult.key;
      lead.imageName = image.originalname;
      lead.imageSize = image.size;
      lead.imageMimeType = image.mimetype;
    }

    return { message: 'Lead updated successfully', data: await this.transformLeadWithSignedUrl(await this.leadRepository.save(lead)) };
  }

  async deleteLead(leadId: string, companyId: string) {
    const lead = await this.leadRepository.findOne({ where: { id: leadId, companyId, isDeleted: false } });
    if (!lead) throw new NotFoundException('Lead not found');
    lead.isDeleted = true;
    lead.isActive = false;
    await this.leadRepository.save(lead);
    return { message: 'Lead deleted successfully', data: null };
  }

  async deactivateLead(leadId: string, companyId: string, deactivateLeadDto: DeactivateLeadDto) {
    const lead = await this.leadRepository.findOne({ where: { id: leadId, companyId, isDeleted: false } });
    if (!lead) throw new NotFoundException('Lead not found');
    lead.isActive = false;
    lead.reasonForDeactivation = deactivateLeadDto.reason || undefined;
    await this.leadRepository.save(lead);
    return { message: 'Lead deactivated successfully', data: await this.transformLeadWithSignedUrl(lead) };
  }

  async getLeadImageUrl(leadId: string) {
    const lead = await this.leadRepository.findOne({ where: { id: leadId, isDeleted: false } });
    if (!lead) throw new NotFoundException('Lead not found');
    if (!lead.imageKey) throw new NotFoundException('No image found for this lead');
    return { message: 'Image URL generated successfully', data: { imageUrl: await this.s3Service.generateSignedUrl(lead.imageKey), imageName: lead.imageName, imageSize: lead.imageSize, imageMimeType: lead.imageMimeType } };
  }

  async toggleLeadStatus(leadId: string, companyId: string) {
    const lead = await this.leadRepository.findOne({ where: { id: leadId, companyId, isDeleted: false } });
    if (!lead) throw new NotFoundException('Lead not found');
    lead.isActive = !lead.isActive;
    if (lead.isActive) lead.reasonForDeactivation = undefined;
    await this.leadRepository.save(lead);
    return { message: `Lead ${lead.isActive ? 'activated' : 'deactivated'} successfully`, data: await this.transformLeadWithSignedUrl(lead) };
  }

  async getMyLeads(companyId: string) {
    const leads = await this.leadRepository.find({ where: { companyId, isDeleted: false }, relations: ['company'], order: { createdAt: 'DESC' } });
    return { message: 'Your leads retrieved successfully', data: await Promise.all(leads.map((l) => this.transformLeadWithSignedUrl(l))) };
  }

  async getMyActiveLeads(companyId: string) {
    const leads = await this.leadRepository.find({ where: { companyId, isActive: true, isDeleted: false }, relations: ['company'], order: { createdAt: 'DESC' } });
    return { message: 'Your active leads retrieved successfully', data: await Promise.all(leads.map((l) => this.transformLeadWithSignedUrl(l))) };
  }

  async getMyInactiveLeads(companyId: string) {
    const leads = await this.leadRepository.find({ where: { companyId, isActive: false, isDeleted: false }, relations: ['company'], order: { createdAt: 'DESC' } });
    return { message: 'Your inactive leads retrieved successfully', data: await Promise.all(leads.map((l) => this.transformLeadWithSignedUrl(l))) };
  }

  // ============ TRANSFORM HELPERS ============

  private async transformCompanyWithSignedUrls(company: Company): Promise<any> {
    if (!company) return null;
    const { profileImage, companyLogo, user, ...companyData } = company;
    return {
      ...companyData,
      profileImageUrl: profileImage ? await this.s3Service.getAccessibleUrl(profileImage, 7 * 24 * 60 * 60) : null,
      companyLogoUrl: companyLogo ? await this.s3Service.getAccessibleUrl(companyLogo, 7 * 24 * 60 * 60) : null,
      user: user ? { id: user.id, mobileNumber: user.mobileNumber, isVerified: user.isVerified, isActive: user.isActive, createdAt: user.createdAt, updatedAt: user.updatedAt } : undefined,
    };
  }

  private async transformLeadWithSignedUrl(lead: Lead): Promise<any> {
    const { imageKey, imageName, imageSize, imageMimeType, company, ...leadData } = lead;
    const imageUrl = imageKey ? await this.s3Service.generateSignedUrl(imageKey, 7 * 24 * 60 * 60) : null;
    return { ...leadData, imageUrl, ...(imageKey && { imageName, imageSize, imageMimeType }), company: company ? await this.transformCompanyWithSignedUrls(company) : undefined };
  }

  private async transformLeadWithContactDetails(lead: Lead): Promise<any> {
    const { imageKey, imageName, imageSize, imageMimeType, company, ...leadData } = lead;
    const imageUrl = imageKey ? await this.s3Service.generateSignedUrl(imageKey, 7 * 24 * 60 * 60) : null;
    const transformedLead: any = { ...leadData, imageUrl, ...(imageKey && { imageName, imageSize, imageMimeType }) };
    if (company) {
      transformedLead.company = await this.transformCompanyWithSignedUrls(company);
      if (company.user) {
        transformedLead.contactDetails = { mobileNumber: company.user.mobileNumber, companyName: company.legalName || company.tradeName, gstin: company.gstin };
      }
    }
    return transformedLead;
  }
}