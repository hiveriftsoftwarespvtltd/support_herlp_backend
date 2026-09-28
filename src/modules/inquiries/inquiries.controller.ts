import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { InquiriesService } from './inquiries.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { InquiryStatus } from './schemas/inquiry.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('inquiries')
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  /**
   * Public endpoint to submit inquiries from any contact form on website
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createInquiryDto: CreateInquiryDto, @Req() req: Request) {
    const ipAddress =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      '';

    const saved = await this.inquiriesService.create(createInquiryDto, ipAddress);

    return {
      success: true,
      message: 'Inquiry submitted successfully. A specialist will contact you shortly.',
      data: {
        id: saved._id,
        fullName: saved.fullName,
        email: saved.email,
        createdAt: (saved as any).createdAt,
      },
    };
  }

  /**
   * Admin: Get all inquiries
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.inquiriesService.findAll({ search, status, page, limit });
    return {
      success: true,
      data: result,
    };
  }

  /**
   * Admin: Get inquiries overview stats
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getStats() {
    const stats = await this.inquiriesService.getStats();
    return {
      success: true,
      data: stats,
    };
  }

  /**
   * Admin: Get single inquiry
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    const item = await this.inquiriesService.findOne(id);
    return {
      success: true,
      data: item,
    };
  }

  /**
   * Admin: Update status
   */
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: InquiryStatus,
    @Body('internalNotes') internalNotes?: string,
  ) {
    const updated = await this.inquiriesService.updateStatus(id, status, internalNotes);
    return {
      success: true,
      message: 'Inquiry status updated successfully',
      data: updated,
    };
  }

  /**
   * Admin: Delete inquiry
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    return this.inquiriesService.remove(id);
  }
}
