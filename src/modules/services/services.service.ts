import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { Service, ServiceDocument } from './schemas/service.schema';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ImageUploadService } from '../../common/services/image-upload.service';

@Injectable()
export class ServicesService implements OnModuleInit {
  private readonly logger = new Logger(ServicesService.name);

  constructor(
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
    private readonly imageUploadService: ImageUploadService,
  ) {}

  async onModuleInit() {
    await this.seedDefaults();
  }

  /**
   * Helper to parse field if passed as stringified JSON or plain text
   */
  private parseJsonField<T = any>(val: any, fallback: T): T {
    if (val === undefined || val === null || val === '') return fallback;
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        return val as unknown as T;
      }
    }
    return val;
  }

  private parseStringArray(val: any): string[] {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
      return val
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  }

  /**
   * List all services with search & filter
   */
  async findAll(query: { search?: string; category?: string; status?: string; isPublished?: string }) {
    const filter: any = {};

    if (query.status && query.status !== 'all') {
      filter.status = query.status;
    }

    if (query.isPublished !== undefined && query.isPublished !== '') {
      filter.isPublished = query.isPublished === 'true';
    }

    if (query.category && query.category !== 'all') {
      if (query.category === 'Industry Accounting' || query.category === 'Industry Services') {
        filter.category = { $in: ['Industry Accounting', 'Industry Services'] };
      } else {
        filter.category = query.category;
      }
    }

    if (query.search && query.search.trim()) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { title: regex },
        { heroTitle: regex },
        { slug: regex },
        { category: regex },
        { shortDescription: regex },
      ];
    }

    const items = await this.serviceModel
      .find(filter)
      .sort({ displayOrder: 1, createdAt: -1 })
      .exec();

    return {
      success: true,
      count: items.length,
      data: items,
    };
  }

  /**
   * Find single service by slug or _id
   */
  async findOne(identifier: string) {
    const conditions: any[] = [{ slug: identifier.toLowerCase() }];
    if (Types.ObjectId.isValid(identifier)) {
      conditions.unshift({ _id: identifier });
    }

    const service = await this.serviceModel.findOne({ $or: conditions }).exec();
    if (!service) {
      throw new NotFoundException(`Service "${identifier}" not found`);
    }

    return {
      success: true,
      data: service,
    };
  }

  /**
   * Create a new service
   */
  async create(
    dto: CreateServiceDto,
    files?: {
      showcase1Image?: Express.Multer.File[];
      showcase2Image?: Express.Multer.File[];
      icon?: Express.Multer.File[];
    },
  ) {
    let slug = dto.slug;
    if (!slug) {
      slug = dto.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    } else {
      slug = slug
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    // Check unique slug
    const existing = await this.serviceModel.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    let showcase1Img = dto.showcase1Image || '';
    let showcase2Img = dto.showcase2Image || '';
    let iconImg = dto.icon || '';

    if (files?.showcase1Image?.[0]) {
      showcase1Img = await this.imageUploadService.processAndSaveImage(files.showcase1Image[0]);
    }
    if (files?.showcase2Image?.[0]) {
      showcase2Img = await this.imageUploadService.processAndSaveImage(files.showcase2Image[0]);
    }
    if (files?.icon?.[0]) {
      iconImg = await this.imageUploadService.processAndSaveImage(files.icon[0]);
    }

    const newService = new this.serviceModel({
      title: dto.title,
      slug,
      heroTitle: dto.heroTitle || dto.title.toUpperCase(),
      heroSubtitle: dto.heroSubtitle || '',
      category: dto.category || 'Core Services',
      shortDescription: dto.shortDescription || '',
      introBadge: dto.introBadge || 'Specialized Industry Practice',
      introHeading: dto.introHeading || `${dto.title} Excellence`,
      introParagraphs: this.parseStringArray(dto.introParagraphs),
      solutionsBadge: dto.solutionsBadge || 'Comprehensive Deliverables',
      solutionsTitle: dto.solutionsTitle || `Bookkeeping and Accounting Services for ${dto.title}`,
      leftCol: this.parseJsonField(dto.leftCol, []),
      rightCol: this.parseJsonField(dto.rightCol, []),
      showcase1Badge: dto.showcase1Badge || 'Strategic Scope',
      showcase1Title: dto.showcase1Title || '',
      showcase1Description: dto.showcase1Description || '',
      showcase1Checklist: this.parseStringArray(dto.showcase1Checklist),
      showcase1Note: dto.showcase1Note || '',
      showcase1Image: showcase1Img,
      showcase2Badge: dto.showcase2Badge || 'Operational Advantages',
      showcase2Title: dto.showcase2Title || '',
      showcase2Paragraphs: this.parseStringArray(dto.showcase2Paragraphs),
      showcase2Image: showcase2Img,
      whyBadge: dto.whyBadge || 'Value Driven Assurance',
      whyTitle: dto.whyTitle || `Benefits of Opting for Our ${dto.title} Services`,
      whyReasons: this.parseStringArray(dto.whyReasons),
      whyClosingNote: dto.whyClosingNote || '',
      icon: iconImg,
      displayOrder: Number(dto.displayOrder) || 0,
      isPublished: dto.isPublished !== undefined ? !!dto.isPublished : true,
      status: dto.status || 'published',
      metaTitle: dto.metaTitle || `${dto.title} – Support Help`,
      metaDescription: dto.metaDescription || dto.shortDescription || '',
      metaKeywords: this.parseStringArray(dto.metaKeywords),
      canonicalUrl: dto.canonicalUrl || `https://supporthelp.online/services/${slug}`,
    });

    const saved = await newService.save();
    return {
      success: true,
      message: 'Service created successfully',
      data: saved,
    };
  }

  /**
   * Update an existing service
   */
  async update(
    identifier: string,
    dto: UpdateServiceDto,
    files?: {
      showcase1Image?: Express.Multer.File[];
      showcase2Image?: Express.Multer.File[];
      icon?: Express.Multer.File[];
    },
  ) {
    const conditions: any[] = [{ slug: identifier.toLowerCase() }];
    if (Types.ObjectId.isValid(identifier)) {
      conditions.unshift({ _id: identifier });
    }

    const service = await this.serviceModel.findOne({ $or: conditions }).exec();
    if (!service) {
      throw new NotFoundException(`Service "${identifier}" not found`);
    }

    if (files?.showcase1Image?.[0]) {
      const oldImg = service.showcase1Image;
      service.showcase1Image = await this.imageUploadService.processAndSaveImage(files.showcase1Image[0]);
      if (oldImg) this.imageUploadService.deleteImageFile(oldImg);
    } else if (dto.showcase1Image !== undefined) {
      service.showcase1Image = dto.showcase1Image;
    }

    if (files?.showcase2Image?.[0]) {
      const oldImg = service.showcase2Image;
      service.showcase2Image = await this.imageUploadService.processAndSaveImage(files.showcase2Image[0]);
      if (oldImg) this.imageUploadService.deleteImageFile(oldImg);
    } else if (dto.showcase2Image !== undefined) {
      service.showcase2Image = dto.showcase2Image;
    }

    if (files?.icon?.[0]) {
      const oldIcon = service.icon;
      service.icon = await this.imageUploadService.processAndSaveImage(files.icon[0]);
      if (oldIcon) this.imageUploadService.deleteImageFile(oldIcon);
    } else if (dto.icon !== undefined) {
      service.icon = dto.icon;
    }

    if (dto.title) service.title = dto.title;
    if (dto.slug) service.slug = dto.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (dto.heroTitle !== undefined) service.heroTitle = dto.heroTitle;
    if (dto.heroSubtitle !== undefined) service.heroSubtitle = dto.heroSubtitle;
    if (dto.category) service.category = dto.category;
    if (dto.shortDescription !== undefined) service.shortDescription = dto.shortDescription;
    if (dto.introBadge !== undefined) service.introBadge = dto.introBadge;
    if (dto.introHeading !== undefined) service.introHeading = dto.introHeading;
    if (dto.introParagraphs !== undefined) service.introParagraphs = this.parseStringArray(dto.introParagraphs);
    if (dto.solutionsBadge !== undefined) service.solutionsBadge = dto.solutionsBadge;
    if (dto.solutionsTitle !== undefined) service.solutionsTitle = dto.solutionsTitle;
    if (dto.leftCol !== undefined) service.leftCol = this.parseJsonField(dto.leftCol, []);
    if (dto.rightCol !== undefined) service.rightCol = this.parseJsonField(dto.rightCol, []);
    if (dto.showcase1Badge !== undefined) service.showcase1Badge = dto.showcase1Badge;
    if (dto.showcase1Title !== undefined) service.showcase1Title = dto.showcase1Title;
    if (dto.showcase1Description !== undefined) service.showcase1Description = dto.showcase1Description;
    if (dto.showcase1Checklist !== undefined) service.showcase1Checklist = this.parseStringArray(dto.showcase1Checklist);
    if (dto.showcase1Note !== undefined) service.showcase1Note = dto.showcase1Note;
    if (dto.showcase2Badge !== undefined) service.showcase2Badge = dto.showcase2Badge;
    if (dto.showcase2Title !== undefined) service.showcase2Title = dto.showcase2Title;
    if (dto.showcase2Paragraphs !== undefined) service.showcase2Paragraphs = this.parseStringArray(dto.showcase2Paragraphs);
    if (dto.whyBadge !== undefined) service.whyBadge = dto.whyBadge;
    if (dto.whyTitle !== undefined) service.whyTitle = dto.whyTitle;
    if (dto.whyReasons !== undefined) service.whyReasons = this.parseStringArray(dto.whyReasons);
    if (dto.whyClosingNote !== undefined) service.whyClosingNote = dto.whyClosingNote;
    if (dto.displayOrder !== undefined) service.displayOrder = Number(dto.displayOrder) || 0;
    if (dto.isPublished !== undefined) service.isPublished = !!dto.isPublished;
    if (dto.status) service.status = dto.status;
    if (dto.metaTitle !== undefined) service.metaTitle = dto.metaTitle;
    if (dto.metaDescription !== undefined) service.metaDescription = dto.metaDescription;
    if (dto.metaKeywords !== undefined) service.metaKeywords = this.parseStringArray(dto.metaKeywords);
    if (dto.canonicalUrl !== undefined) service.canonicalUrl = dto.canonicalUrl;

    const saved = await service.save();
    return {
      success: true,
      message: 'Service updated successfully',
      data: saved,
    };
  }

  /**
   * Remove a service
   */
  async remove(identifier: string) {
    const conditions: any[] = [{ slug: identifier.toLowerCase() }];
    if (Types.ObjectId.isValid(identifier)) {
      conditions.unshift({ _id: identifier });
    }

    const service = await this.serviceModel.findOneAndDelete({ $or: conditions }).exec();
    if (!service) {
      throw new NotFoundException(`Service "${identifier}" not found`);
    }

    if (service.showcase1Image) this.imageUploadService.deleteImageFile(service.showcase1Image);
    if (service.showcase2Image) this.imageUploadService.deleteImageFile(service.showcase2Image);
    if (service.icon) this.imageUploadService.deleteImageFile(service.icon);

    return {
      success: true,
      message: 'Service deleted successfully',
      data: service,
    };
  }

  /**
   * Seed default 13 services if collection is empty
   */
  async seedDefaults() {
    try {
      // 1. Seed 13 Core & Specialized Services from allServicesData.json
      let allServicesData: any = {};
      const servPaths = [
        path.join(process.cwd(), 'src', 'data', 'allServicesData.json'),
        path.join(process.cwd(), 'dist', 'data', 'allServicesData.json'),
        path.resolve(__dirname, '../../data/allServicesData.json'),
        path.resolve(process.cwd(), '../support_help_frontend/src/data/allServicesData.json'),
      ];
      for (const p of servPaths) {
        if (fs.existsSync(p)) {
          try {
            allServicesData = JSON.parse(fs.readFileSync(p, 'utf-8'));
            this.logger.log(`Loaded allServicesData from: ${p}`);
            break;
          } catch (e) {
            this.logger.warn(`Could not parse JSON from: ${p}`);
          }
        }
      }

      const CORE_SERVICES: Array<{
        slug: string;
        title: string;
        category: string;
        order: number;
      }> = [
        { slug: 'bookkeeping', title: 'Bookkeeping', category: 'Core Services', order: 1 },
        { slug: 'accounting', title: 'Accounting Services', category: 'Core Services', order: 2 },
        { slug: 'accounts-receivable', title: 'Accounts Receivable', category: 'Core Services', order: 3 },
        { slug: 'accounts-payable', title: 'Accounts Payable', category: 'Core Services', order: 4 },
        { slug: 'payroll-management', title: 'Payroll Management Services', category: 'Core Services', order: 5 },
        { slug: 'cleanup-catchup-work', title: 'Cleanup/Catch Up Work', category: 'Core Services', order: 6 },
        { slug: 'quickbooks-to-zoho-books-migration', title: 'QuickBooks To Zoho Books Migration', category: 'Core Services', order: 7 },
        { slug: 'financial-reporting', title: 'Financial Reporting', category: 'Specialized Services', order: 8 },
        { slug: 'cpa-firms', title: 'Accounting Service To CPA Firms', category: 'Specialized Services', order: 9 },
        { slug: 'virtual-accountant-bookkeeper', title: 'Virtual Bookkeeping Services', category: 'Specialized Services', order: 10 },
        { slug: 'back-office-operations', title: 'Back Office Operations', category: 'Specialized Services', order: 11 },
        { slug: 'para-planning-services', title: 'Para-Planning Services', category: 'Specialized Services', order: 12 },
        { slug: 'migration-services', title: 'Migration Services', category: 'Specialized Services', order: 13 },
      ];

      const servicesMap = allServicesData.services || {};
      for (const item of CORE_SERVICES) {
        const raw = servicesMap[item.slug] || {};
        const exists = await this.serviceModel.findOne({ slug: item.slug }).exec();
        if (!exists) {
          await this.serviceModel.create({
            title: item.title,
            slug: item.slug,
            heroTitle: raw.heroTitle || item.title.toUpperCase(),
            heroSubtitle: raw.heroSubtitle || `Professional ${item.title} tailored for growing businesses.`,
            category: item.category,
            shortDescription: raw.introParagraphs?.[0]?.slice(0, 160) || '',
            introBadge: 'Specialized Practice',
            introHeading: raw.introHeading || `${item.title} Solutions`,
            introParagraphs: Array.isArray(raw.introParagraphs) ? raw.introParagraphs : [],
            solutionsBadge: 'Comprehensive Deliverables',
            solutionsTitle: raw.solutionsSection?.title || `Our ${item.title} Services`,
            leftCol: raw.solutionsSection?.leftCol?.map((c: any) => ({ title: c.title, desc: c.desc })) || [],
            rightCol: raw.solutionsSection?.rightCol?.map((c: any) => ({ title: c.title, desc: c.desc })) || [],
            showcase1Badge: 'Strategic Focus',
            showcase1Title: raw.showcase1?.title || '',
            showcase1Description: raw.showcase1?.description || '',
            showcase1Image: raw.showcase1?.image || '',
            showcase1Checklist: Array.isArray(raw.showcase1?.checklist) ? raw.showcase1.checklist : [],
            showcase2Badge: 'Tailored Compliance',
            showcase2Title: raw.showcase2?.title || '',
            showcase2Paragraphs: Array.isArray(raw.showcase2?.paragraphs) ? raw.showcase2.paragraphs : [],
            showcase2Image: raw.showcase2?.image || '',
            whyTitle: 'Why Opt for Our Services?',
            whyReasons: [
              'Dedicated certified accountants & CPAs',
              'Automated transaction handling & 100% accuracy',
              'Real-time access to financial statements',
              'Cost savings up to 50% on operational overhead',
            ],
            whyClosingNote: 'Contact Support Help today to schedule your consultation.',
            metaTitle: `${item.title} – Professional Accounting & Bookkeeping | Support Help`,
            metaDescription: raw.introParagraphs?.[0]?.slice(0, 160) || `Avail top-quality ${item.title} at affordable prices.`,
            canonicalUrl: `https://supporthelp.online/services/${item.slug}`,
            displayOrder: item.order,
            isPublished: true,
            status: 'published',
          });
          this.logger.log(`Seeded core service: ${item.slug} (${item.title})`);
        }
      }

      const totalCount = await this.serviceModel.countDocuments();
      this.logger.log(`Total services in database after seeding: ${totalCount}`);
    } catch (err) {
      this.logger.error('Error seeding default services:', err.message);
    }
  }
}
