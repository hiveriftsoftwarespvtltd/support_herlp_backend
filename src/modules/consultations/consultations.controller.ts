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
import { ConsultationsService } from './consultations.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { ConsultationStatus } from './schemas/consultation.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('consultations')
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  /**
   * Public endpoint to book consultation from /free-consultation page
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createConsultationDto: CreateConsultationDto,
    @Req() req: Request,
  ) {
    const ipAddress =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      '';

    const saved = await this.consultationsService.create(
      createConsultationDto,
      ipAddress,
    );

    return {
      success: true,
      message:
        'Consultation request confirmed! A senior accounting director will reach out during your preferred time.',
      data: {
        id: saved._id,
        name: saved.name,
        workEmail: saved.workEmail,
        preferredTimeSlot: saved.preferredTimeSlot,
        createdAt: (saved as any).createdAt,
      },
    };
  }

  /**
   * Admin: List all consultation bookings
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.consultationsService.findAll({
      search,
      status,
      page,
      limit,
    });
    return {
      success: true,
      data: result,
    };
  }

  /**
   * Admin: Get consultation stats
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getStats() {
    const stats = await this.consultationsService.getStats();
    return {
      success: true,
      data: stats,
    };
  }

  /**
   * Admin: Get single consultation
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    const item = await this.consultationsService.findOne(id);
    return {
      success: true,
      data: item,
    };
  }

  /**
   * Admin: Update consultation status (pending, scheduled, completed)
   */
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ConsultationStatus,
    @Body('internalNotes') internalNotes?: string,
  ) {
    const updated = await this.consultationsService.updateStatus(
      id,
      status,
      internalNotes,
    );
    return {
      success: true,
      message: 'Consultation status updated',
      data: updated,
    };
  }

  /**
   * Admin: Delete consultation
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    return this.consultationsService.remove(id);
  }
}
