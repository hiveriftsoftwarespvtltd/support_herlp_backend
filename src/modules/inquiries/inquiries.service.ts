import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Inquiry, InquiryDocument, InquiryStatus } from './schemas/inquiry.schema';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { MailService } from '../../common/services/mail.service';

@Injectable()
export class InquiriesService {
  private readonly logger = new Logger(InquiriesService.name);

  constructor(
    @InjectModel(Inquiry.name)
    private readonly inquiryModel: Model<InquiryDocument>,
    private readonly mailService: MailService,
  ) {}

  async create(dto: CreateInquiryDto, ipAddress?: string): Promise<Inquiry> {
    const newInquiry = new this.inquiryModel({
      ...dto,
      ipAddress,
      status: InquiryStatus.NEW,
    });

    const savedInquiry = await newInquiry.save();
    this.logger.log(`New inquiry saved with ID: ${savedInquiry._id} from ${savedInquiry.email}`);

    // Trigger Email Notification in background (non-blocking)
    this.mailService
      .sendNewInquiryNotification(savedInquiry)
      .then((success) => {
        if (success) {
          this.logger.log(`Inquiry email notification dispatched for ${savedInquiry.email}`);
        } else {
          this.logger.warn(`Email notification could not be dispatched for ${savedInquiry.email}`);
        }
      })
      .catch((err) => {
        this.logger.error(`Failed to send email notification: ${err.message}`);
      });

    return savedInquiry;
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
        { fullName: regex },
        { email: regex },
        { phone: regex },
        { company: regex },
        { service: regex },
        { softwarePreference: regex },
        { message: regex },
      ];
    }

    const [items, total] = await Promise.all([
      this.inquiryModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.inquiryModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Inquiry> {
    const item = await this.inquiryModel.findById(id).exec();
    if (!item) {
      throw new NotFoundException(`Inquiry with ID ${id} not found`);
    }
    return item;
  }

  async updateStatus(id: string, status: InquiryStatus, internalNotes?: string): Promise<Inquiry> {
    const updateData: any = { status };
    if (internalNotes !== undefined) {
      updateData.internalNotes = internalNotes;
    }

    const updated = await this.inquiryModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Inquiry with ID ${id} not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const result = await this.inquiryModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Inquiry with ID ${id} not found`);
    }
    return { success: true, message: 'Inquiry deleted successfully' };
  }

  async getStats() {
    const total = await this.inquiryModel.countDocuments().exec();
    const newCount = await this.inquiryModel.countDocuments({ status: InquiryStatus.NEW }).exec();
    const inProgress = await this.inquiryModel
      .countDocuments({ status: InquiryStatus.IN_PROGRESS })
      .exec();
    const replied = await this.inquiryModel.countDocuments({ status: InquiryStatus.REPLIED }).exec();

    return {
      total,
      newCount,
      inProgress,
      replied,
    };
  }
}
