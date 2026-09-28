import {
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  SoftwareExpertise,
  SoftwareExpertiseDocument,
} from './schemas/software-expertise.schema';
import { CreateSoftwareDto } from './dto/create-software.dto';
import { UpdateSoftwareDto } from './dto/update-software.dto';
import { ImageUploadService } from '../../common/services/image-upload.service';
import { INITIAL_STATIC_SOFTWARES } from './data/initial-software.data';

@Injectable()
export class SoftwareExpertiseService implements OnModuleInit {
  constructor(
    @InjectModel(SoftwareExpertise.name)
    private readonly softwareModel: Model<SoftwareExpertiseDocument>,
    private readonly imageUploadService: ImageUploadService,
  ) {}

  /**
   * Seed static software items into MongoDB on startup
   */
  async onModuleInit() {
    try {
      const count = await this.softwareModel.countDocuments();
      if (count === 0) {
        console.log('🌱 Seeding initial software expertise into MongoDB...');
        await this.softwareModel.insertMany(INITIAL_STATIC_SOFTWARES);
        console.log(
          `✅ Successfully seeded ${INITIAL_STATIC_SOFTWARES.length} software items into MongoDB!`,
        );
      } else {
        await this.softwareModel.updateMany(
          { highlights: { $exists: false } },
          {
            $set: {
              highlights: [
                'Automated Daily Feeds',
                'Multi-Currency Ledgers',
                'Real-Time MIS Reports',
              ],
              badgeTag: 'Platform Proficiency & Advisory',
            },
          },
        );

        // Sanitize any existing slugs with leading slashes (e.g. /saif -> saif)
        const itemsWithLeadingSlash = await this.softwareModel.find({
          slug: { $regex: '^/' },
        });
        for (const doc of itemsWithLeadingSlash) {
          doc.slug = doc.slug.replace(/^\/+|\/+$/g, '');
          await doc.save();
          console.log(`Cleaned slug for ${doc.name}: ${doc.slug}`);
        }
      }
    } catch (err: any) {
      console.error('Error seeding software expertise:', err.message);
    }
  }

  /**
   * Get all softwares (for Header dropdown and listings)
   */
  async findAll(query: {
    search?: string;
    isPublished?: boolean | string;
    page?: number;
    limit?: number;
  }) {
    const filter: Record<string, any> = {};

    if (query.isPublished !== undefined && query.isPublished !== 'All') {
      filter.isPublished =
        query.isPublished === true || query.isPublished === 'true';
    }

    if (query.search && query.search.trim()) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { name: regex },
        { heroTitle: regex },
        { slug: regex },
        { desc: regex },
      ];
    }

    const items = await this.softwareModel
      .find(filter)
      .sort({ displayOrder: 1, createdAt: 1 })
      .exec();

    return {
      success: true,
      message: 'Software expertise items retrieved successfully',
      data: items,
      total: items.length,
    };
  }

  /**
   * Get single software by slug or _id
   */
  async findOne(identifier: string) {
    const raw = (identifier || '').trim().toLowerCase();
    const clean = raw.replace(/^\/+|\/+$/g, '');
    const conditions: any[] = [
      { slug: clean },
      { slug: `/${clean}` },
      { slug: raw },
    ];
    if (Types.ObjectId.isValid(identifier)) {
      conditions.unshift({ _id: identifier });
    }

    const item = await this.softwareModel.findOne({ $or: conditions }).exec();
    if (!item) {
      throw new NotFoundException(
        `Software expertise with identifier "${identifier}" not found`,
      );
    }

    return {
      success: true,
      message: 'Software expertise retrieved successfully',
      data: item,
    };
  }

  /**
   * Create a new software expertise
   */
  async create(
    createDto: CreateSoftwareDto,
    files?: {
      badge?: Express.Multer.File[];
      showcaseImage?: Express.Multer.File[];
    },
  ) {
    let slug = createDto.slug;
    if (!slug) {
      slug = createDto.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    } else {
      slug = slug
        .toLowerCase()
        .trim()
        .replace(/^\/+|\/+$/g, '')
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    // Ensure unique slug
    const existing = await this.softwareModel.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    let badgeUrl = createDto.badge || '/software/zohobooks_badge.png';
    const badgeFile = files?.badge?.[0];
    if (badgeFile) {
      badgeUrl = await this.imageUploadService.processAndSaveImage(badgeFile);
    }

    // Parse introParagraphs if string
    let paragraphs = createDto.introParagraphs;
    if (typeof paragraphs === 'string') {
      try {
        paragraphs = JSON.parse(paragraphs);
      } catch {
        paragraphs = [paragraphs];
      }
    }
    if (!Array.isArray(paragraphs) || paragraphs.length === 0) {
      paragraphs = [
        createDto.desc ||
          `Professional ${createDto.name} accounting and bookkeeping solutions by Support Help.`,
      ];
    }

    // Parse highlights if string
    let highlights = createDto.highlights;
    if (typeof highlights === 'string') {
      try {
        highlights = JSON.parse(highlights);
      } catch {
        highlights = [highlights];
      }
    }
    if (!Array.isArray(highlights) || highlights.length === 0) {
      highlights = [
        'Automated Daily Feeds',
        'Multi-Currency Ledgers',
        'Real-Time MIS Reports',
      ];
    }

    // Parse featuresSection if string
    let featuresSection = createDto.featuresSection;
    if (typeof featuresSection === 'string') {
      try {
        featuresSection = JSON.parse(featuresSection);
      } catch {
        featuresSection = {};
      }
    }

    // Parse showcases if string
    let showcases = createDto.showcases;
    if (typeof showcases === 'string') {
      try {
        showcases = JSON.parse(showcases);
      } catch {
        showcases = [];
      }
    }
    if (!Array.isArray(showcases)) {
      showcases = [];
    }

    const showcaseImageFile = files?.showcaseImage?.[0];
    if (showcaseImageFile) {
      const showcaseImageUrl =
        await this.imageUploadService.processAndSaveImage(showcaseImageFile);
      if (showcases.length === 0) {
        showcases.push({
          title: `Benefits of Outsourcing ${createDto.name} Bookkeeping to Us`,
          image: showcaseImageUrl,
          imagePosition: 'right',
          bullets: [],
          paragraphs: [],
        });
      } else {
        showcases[0].image = showcaseImageUrl;
      }
    }

    const newItem = new this.softwareModel({
      name: createDto.name,
      slug,
      heroTitle: createDto.heroTitle || createDto.name.toUpperCase(),
      heroSubtitle: createDto.heroSubtitle || '',
      desc:
        createDto.desc ||
        `Certified ${createDto.name} partner & bookkeeping services`,
      badge: badgeUrl,
      badgeTag: createDto.badgeTag || 'Platform Proficiency & Advisory',
      introHeading:
        createDto.introHeading ||
        `Tailored ${(createDto.heroTitle || createDto.name).toUpperCase()} Accounting & Advisory`,
      introParagraphs: paragraphs,
      highlights,
      featuresSection: featuresSection || {},
      showcases,
      displayOrder: createDto.displayOrder || 0,
      isPublished:
        createDto.isPublished !== undefined ? !!createDto.isPublished : true,
      metaTitle:
        createDto.metaTitle || `${createDto.name} Bookkeeping Services`,
      metaDescription: createDto.metaDescription || createDto.desc,
    });

    const saved = await newItem.save();

    return {
      success: true,
      message: 'Software expertise created successfully',
      data: saved,
    };
  }

  /**
   * Update software expertise
   */
  async update(
    identifier: string,
    updateDto: UpdateSoftwareDto,
    files?: {
      badge?: Express.Multer.File[];
      showcaseImage?: Express.Multer.File[];
    },
  ) {
    const raw = (identifier || '').trim().toLowerCase();
    const clean = raw.replace(/^\/+|\/+$/g, '');
    const conditions: any[] = [
      { slug: clean },
      { slug: `/${clean}` },
      { slug: raw },
    ];
    if (Types.ObjectId.isValid(identifier)) {
      conditions.unshift({ _id: identifier });
    }

    let software = await this.softwareModel.findOne({ $or: conditions });
    if (!software) {
      if (updateDto.name) {
        return this.create(updateDto as CreateSoftwareDto, files);
      }
      throw new NotFoundException(
        `Software expertise with identifier "${identifier}" not found`,
      );
    }

    const badgeFile = files?.badge?.[0];
    if (badgeFile) {
      const oldBadge = software.badge;
      const newBadge = await this.imageUploadService.processAndSaveImage(badgeFile);
      software.badge = newBadge;
      if (oldBadge) {
        this.imageUploadService.deleteImageFile(oldBadge);
      }
    } else if (updateDto.badge) {
      software.badge = updateDto.badge;
    }

    if (updateDto.name) software.name = updateDto.name;
    if (updateDto.slug) {
      software.slug = updateDto.slug
        .toLowerCase()
        .trim()
        .replace(/^\/+|\/+$/g, '')
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
    if (updateDto.heroTitle) software.heroTitle = updateDto.heroTitle;
    if (updateDto.heroSubtitle !== undefined)
      software.heroSubtitle = updateDto.heroSubtitle;
    if (updateDto.desc) software.desc = updateDto.desc;
    if (updateDto.badgeTag !== undefined) software.badgeTag = updateDto.badgeTag;
    if (updateDto.introHeading !== undefined)
      software.introHeading = updateDto.introHeading;
    if (updateDto.displayOrder !== undefined)
      software.displayOrder = updateDto.displayOrder;
    if (updateDto.isPublished !== undefined)
      software.isPublished = !!updateDto.isPublished;

    if (updateDto.introParagraphs) {
      let paragraphs = updateDto.introParagraphs;
      if (typeof paragraphs === 'string') {
        try {
          paragraphs = JSON.parse(paragraphs);
        } catch {
          paragraphs = [paragraphs];
        }
      }
      if (Array.isArray(paragraphs)) {
        software.introParagraphs = paragraphs;
      }
    }

    if (updateDto.highlights) {
      let highlights = updateDto.highlights;
      if (typeof highlights === 'string') {
        try {
          highlights = JSON.parse(highlights);
        } catch {
          highlights = [highlights];
        }
      }
      if (Array.isArray(highlights)) {
        software.highlights = highlights;
      }
    }

    if (updateDto.featuresSection) {
      let features = updateDto.featuresSection;
      if (typeof features === 'string') {
        try {
          features = JSON.parse(features);
        } catch {}
      }
      software.featuresSection = features;
    }

    if (updateDto.showcases) {
      let showcases = updateDto.showcases;
      if (typeof showcases === 'string') {
        try {
          showcases = JSON.parse(showcases);
        } catch {}
      }
      if (Array.isArray(showcases)) {
        software.showcases = showcases;
      }
    }

    const showcaseImageFile = files?.showcaseImage?.[0];
    if (showcaseImageFile) {
      const showcaseImageUrl =
        await this.imageUploadService.processAndSaveImage(showcaseImageFile);
      if (!software.showcases || software.showcases.length === 0) {
        software.showcases = [
          {
            title: `Benefits of Outsourcing ${software.name} Bookkeeping to Us`,
            image: showcaseImageUrl,
            imagePosition: 'right',
            bullets: [],
            paragraphs: [],
          },
        ];
      } else {
        const oldShowcaseImage = software.showcases[0].image;
        software.showcases[0].image = showcaseImageUrl;
        if (oldShowcaseImage) {
          this.imageUploadService.deleteImageFile(oldShowcaseImage);
        }
      }
    }

    const updated = await software.save();

    return {
      success: true,
      message: 'Software expertise updated successfully',
      data: updated,
    };
  }

  /**
   * Delete software expertise
   */
  async remove(identifier: string) {
    const conditions: any[] = [{ slug: identifier.toLowerCase() }];
    if (Types.ObjectId.isValid(identifier)) {
      conditions.unshift({ _id: identifier });
    }

    const deleted = await this.softwareModel.findOneAndDelete({
      $or: conditions,
    });
    if (!deleted) {
      return {
        success: true,
        message: 'Software expertise already removed',
        data: { id: identifier },
      };
    }

    if (deleted.badge) {
      this.imageUploadService.deleteImageFile(deleted.badge);
    }

    return {
      success: true,
      message: 'Software expertise deleted successfully',
      data: { id: deleted._id, slug: deleted.slug },
    };
  }
}
