import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Consultation,
  ConsultationDocument,
  ConsultationStatus,
} from './schemas/consultation.schema';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { MailService } from '../../common/services/mail.service';

@Injectable()
export class ConsultationsService {
  private readonly logger = new Logger(ConsultationsService.name);

  constructor(
    @InjectModel(Consultation.name)
    private readonly consultationModel: Model<ConsultationDocument>,
    private readonly mailService: MailService,
  ) {}

  async create(dto: CreateConsultationDto, ipAddress?: string): Promise<Consultation> {
    const newConsultation = new this.consultationModel({
      ...dto,
      ipAddress,
      status: ConsultationStatus.PENDING,
    });

    const saved = await newConsultation.save();
    this.logger.log(`New consultation booked: ID ${saved._id} by ${saved.workEmail}`);

    // Trigger Email Notification (non-blocking)
    this.mailService
      .sendConsultationNotification(saved)
      .then((success) => {
        if (success) {
          this.logger.log(`Consultation notification email dispatched for ${saved.workEmail}`);
        }
      })
      .catch((err) => {
        this.logger.error(`Error sending consultation email: ${err.message}`);
      });

    return saved;
  }

  async findAll(params?: { search?: string; status?: string; page?: number; limit?: number }) {
    const page = Number(params?.page) || 1;
    const limit = Number(params?.limit) || 50;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (params?.status && params.status !== 'all') {
      filter.status = params.status;
    }

    if (params?.search) {
      const regex = new RegExp(params.search, 'i');
      filter.$or = [
        { name: regex },
        { companyName: regex },
        { workEmail: regex },
        { phone: regex },
        { primaryService: regex },
        { preferredTimeSlot: regex },
        { overview: regex },
      ];
    }

    const [items, total] = await Promise.all([
      this.consultationModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.consultationModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Consultation> {
    const item = await this.consultationModel.findById(id).exec();
    if (!item) {
      throw new NotFoundException(`Consultation #${id} not found`);
    }
    return item;
  }

  async updateStatus(
    id: string,
    status: ConsultationStatus,
    internalNotes?: string,
  ): Promise<Consultation> {
    const updateData: any = { status };
    if (internalNotes !== undefined) {
      updateData.internalNotes = internalNotes;
    }

    const updated = await this.consultationModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Consultation #${id} not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const result = await this.consultationModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Consultation #${id} not found`);
    }
    return { success: true, message: 'Consultation deleted successfully' };
  }

  async getStats() {
    const total = await this.consultationModel.countDocuments().exec();
    const pending = await this.consultationModel
      .countDocuments({ status: ConsultationStatus.PENDING })
      .exec();
    const scheduled = await this.consultationModel
      .countDocuments({ status: ConsultationStatus.SCHEDULED })
      .exec();
    const completed = await this.consultationModel
      .countDocuments({ status: ConsultationStatus.COMPLETED })
      .exec();

    return {
      total,
      pending,
      scheduled,
      completed,
    };
  }
}
