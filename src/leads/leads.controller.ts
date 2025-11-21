// ============ FILE: src/leads/leads.controller.ts (UPDATED) ============
import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { DeactivateLeadDto } from './dto/deactivate-lead.dto';
import { ConsumeLeadDto } from './dto/consume-lead.dto';
import { ReportLeadDto } from './dto/report-lead.dto';
import { PaginationDto } from './dto/pagination.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Leads')
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  // ============ PUBLIC ENDPOINTS ============

  @Get('public')
  @ApiOperation({ 
    summary: 'Get all active leads (PUBLIC - No contact details)',
    description: 'Returns all active leads without contact information.'
  })
  @ApiResponse({ status: 200, description: 'Active leads retrieved successfully' })
  async getPublicLeads() {
    return this.leadsService.getPublicLeads();
  }

  @Get('public/:id')
  @ApiOperation({ 
    summary: 'Get a single lead by ID (PUBLIC - No contact details)',
  })
  @ApiResponse({ status: 200, description: 'Lead retrieved successfully' })
  async getPublicLeadById(@Param('id') id: string) {
    return this.leadsService.getPublicLeadById(id);
  }

  // ============ NEW: LEAD QUOTA ENDPOINT ============

  @Get('quota/:companyId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Get company lead quota details',
    description: 'Returns detailed breakdown of available free leads, bonus leads, and usage stats'
  })
  @ApiResponse({ status: 200, description: 'Lead quota retrieved successfully' })
  async getCompanyLeadQuota(@Param('companyId') companyId: string) {
    return this.leadsService.getCompanyLeadQuota(companyId);
  }

  // ============ NEW: REPORT ENDPOINTS ============

  @Post(':id/report')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Report a lead for inappropriate content',
    description: 'Submit a report for a lead with reason and description'
  })
  @ApiResponse({ status: 201, description: 'Lead reported successfully' })
  async reportLead(
    @Param('id') id: string,
    @Request() req,
    @Body() reportLeadDto: ReportLeadDto,
  ) {
    return this.leadsService.reportLead(id, req.user.company.id, reportLeadDto);
  }

  @Post('public/:id/report')
  @ApiOperation({ 
    summary: 'Report a lead (PUBLIC - without authentication)',
    description: 'Submit a report for a lead without being logged in'
  })
  @ApiResponse({ status: 201, description: 'Lead reported successfully' })
  async reportLeadPublic(
    @Param('id') id: string,
    @Body() reportLeadDto: ReportLeadDto,
  ) {
    return this.leadsService.reportLead(id, null, reportLeadDto);
  }

  // ============ ADMIN: REPORT MANAGEMENT ============

  @Get('admin/reports')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Get all lead reports (ADMIN)',
    description: 'Returns all reports with lead details and reported text for admin review'
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Reports retrieved successfully' })
  async getAllReports(@Query() paginationDto: PaginationDto) {
    return this.leadsService.getAllReports(paginationDto);
  }

  @Patch('admin/reports/:reportId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Update report status (ADMIN)',
    description: 'Update the status of a report and add admin notes'
  })
  @ApiResponse({ status: 200, description: 'Report status updated successfully' })
  async updateReportStatus(
    @Param('reportId') reportId: string,
    @Body() updateReportStatusDto: UpdateReportStatusDto,
  ) {
    return this.leadsService.updateReportStatus(reportId, updateReportStatusDto);
  }

  // ============ UPDATED: LEAD FEED WITH PAGINATION ============

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Get paginated leads feed (without company details)',
    description: 'Returns active leads from other companies with pagination. Company details hidden.'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'Leads feed retrieved successfully' })
  async getLeadsFeed(@Request() req, @Query() paginationDto: PaginationDto) {
    return this.leadsService.getLeadsFeedPaginated(req.user.company.id, paginationDto);
  }

  // ============ PROTECTED ENDPOINTS ============

  @Post(':id/consume')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Consume a lead to view contact details',
    description: 'Uses one free lead or bonus lead to reveal company contact information'
  })
  @ApiResponse({ status: 200, description: 'Lead consumed successfully' })
  async consumeLead(
    @Param('id') id: string,
    @Request() req,
    @Body() consumeLeadDto: ConsumeLeadDto,
  ) {
    return this.leadsService.consumeLead(id, req.user.company.id, consumeLeadDto);
  }

  @Get(':id/availability')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Check if lead can be consumed' })
  @ApiResponse({ status: 200, description: 'Lead availability checked' })
  async getLeadAvailability(@Param('id') id: string, @Request() req) {
    return this.leadsService.getLeadAvailability(id, req.user.company.id);
  }

  @Get('my-consumptions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get your lead consumption history' })
  @ApiResponse({ status: 200, description: 'Consumption history retrieved' })
  async getMyConsumptions(@Request() req) {
    return this.leadsService.getMyConsumptions(req.user.company.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new lead with optional image' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'description'],
      properties: {
        title: { type: 'string', example: 'Need 1000 units of Steel Rods' },
        description: { type: 'string', example: 'Looking for high-quality steel rods' },
        budget: { type: 'string', example: '₹50,000 - ₹1,00,000' },
        quantity: { type: 'string', example: '1000 units' },
        location: { type: 'string', example: 'Mumbai, Maharashtra' },
        image: { type: 'string', format: 'binary', description: 'Lead image (optional)' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Lead created successfully' })
  async createLead(
    @Request() req,
    @Body() createLeadDto: CreateLeadDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.leadsService.createLead(req.user.company.id, createLeadDto, image);
  }

  @Get('my-leads')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all leads (active + inactive) created by authenticated company' })
  @ApiResponse({ status: 200, description: 'Your leads retrieved successfully' })
  async getMyLeads(@Request() req) {
    return this.leadsService.getMyLeads(req.user.company.id);
  }

  @Get('my-leads/active')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get only active leads created by authenticated company' })
  @ApiResponse({ status: 200, description: 'Your active leads retrieved successfully' })
  async getMyActiveLeads(@Request() req) {
    return this.leadsService.getMyActiveLeads(req.user.company.id);
  }

  @Get('my-leads/inactive')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get only inactive/deactivated leads' })
  @ApiResponse({ status: 200, description: 'Your inactive leads retrieved successfully' })
  async getMyInactiveLeads(@Request() req) {
    return this.leadsService.getMyInactiveLeads(req.user.company.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get a single lead by ID (PROTECTED - for owner)' })
  @ApiResponse({ status: 200, description: 'Lead retrieved successfully' })
  async getLeadById(@Param('id') id: string, @Request() req) {
    return this.leadsService.getLeadById(id, req.user.company.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update a lead with optional new image' })
  @ApiResponse({ status: 200, description: 'Lead updated successfully' })
  async updateLead(
    @Param('id') id: string,
    @Request() req,
    @Body() updateLeadDto: UpdateLeadDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.leadsService.updateLead(id, req.user.company.id, updateLeadDto, image);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a lead (soft delete)' })
  @ApiResponse({ status: 200, description: 'Lead deleted successfully' })
  async deleteLead(@Param('id') id: string, @Request() req) {
    return this.leadsService.deleteLead(id, req.user.company.id);
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Deactivate a lead with optional reason' })
  @ApiResponse({ status: 200, description: 'Lead deactivated successfully' })
  async deactivateLead(
    @Param('id') id: string,
    @Request() req,
    @Body() deactivateLeadDto: DeactivateLeadDto,
  ) {
    return this.leadsService.deactivateLead(id, req.user.company.id, deactivateLeadDto);
  }

  @Get(':id/image')
  @ApiOperation({ summary: 'Get signed URL for lead image' })
  @ApiResponse({ status: 200, description: 'Image URL generated successfully' })
  async getLeadImageUrl(@Param('id') id: string) {
    return this.leadsService.getLeadImageUrl(id);
  }

  @Patch(':id/toggle-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Toggle lead active/inactive status' })
  @ApiResponse({ status: 200, description: 'Lead status toggled successfully' })
  async toggleLeadStatus(@Param('id') id: string, @Request() req) {
    return this.leadsService.toggleLeadStatus(id, req.user.company.id);
  }
}