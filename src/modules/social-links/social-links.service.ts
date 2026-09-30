import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { SocialLink, SocialLinkDocument } from './schemas/social-link.schema';
import { CreateSocialLinkDto } from './dto/create-social-link.dto';
import { UpdateSocialLinkDto } from './dto/update-social-link.dto';

@Injectable()
export class SocialLinksService {
  constructor(
    @InjectModel(SocialLink.name)
    private readonly socialLinkModel: Model<SocialLinkDocument>,
  ) {}

  async findAll(query: { isActive?: string | boolean; search?: string }) {
    const filter: any = {};

    if (query.isActive !== undefined && query.isActive !== '') {
      filter.isActive =
        query.isActive === 'true' || query.isActive === true;
    }

    if (query.search) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ title: regex }, { platform: regex }, { url: regex }];
    }

    const items = await this.socialLinkModel
      .find(filter)
      .sort({ displayOrder: 1, createdAt: -1 })
      .exec();

    return {
      success: true,
      data: items,
      total: items.length,
    };
  }

  async findOne(id: string) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException(`Invalid Social Link ID: ${id}`);
    }

    const item = await this.socialLinkModel.findById(id).exec();
    if (!item) {
      throw new NotFoundException(`Social Link with ID ${id} not found`);
    }

    return {
      success: true,
      data: item,
    };
  }

  async create(createDto: CreateSocialLinkDto) {
    const created = new this.socialLinkModel({
      platform: (createDto.platform || 'other').toLowerCase().trim(),
      title: createDto.title.trim(),
      url: createDto.url.trim(),
      icon: (createDto.icon || createDto.platform || 'globe').toLowerCase().trim(),
      isActive: createDto.isActive !== undefined ? createDto.isActive : true,
      displayOrder: createDto.displayOrder || 1,
    });

    const saved = await created.save();
    return {
      success: true,
      message: 'Social link created successfully',
      data: saved,
    };
  }

  async update(id: string, updateDto: UpdateSocialLinkDto) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException(`Invalid Social Link ID: ${id}`);
    }

    const updateData: any = {};
    if (updateDto.platform !== undefined) {
      updateData.platform = updateDto.platform.toLowerCase().trim();
    }
    if (updateDto.title !== undefined) {
      updateData.title = updateDto.title.trim();
    }
    if (updateDto.url !== undefined) {
      updateData.url = updateDto.url.trim();
    }
    if (updateDto.icon !== undefined) {
      updateData.icon = updateDto.icon.toLowerCase().trim();
    }
    if (updateDto.isActive !== undefined) {
      updateData.isActive = updateDto.isActive;
    }
    if (updateDto.displayOrder !== undefined) {
      updateData.displayOrder = updateDto.displayOrder;
    }

    const updated = await this.socialLinkModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Social Link with ID ${id} not found`);
    }

    return {
      success: true,
      message: 'Social link updated successfully',
      data: updated,
    };
  }

  async remove(id: string) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException(`Invalid Social Link ID: ${id}`);
    }

    const deleted = await this.socialLinkModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException(`Social Link with ID ${id} not found`);
    }

    return {
      success: true,
      message: 'Social link deleted successfully',
      data: deleted,
    };
  }
}
