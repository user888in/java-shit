import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ProspectService } from '../services/ProspectService';
import { IntelligenceService } from '../services/IntelligenceService';
import { CreateProspectDto } from '../services/dto/create-prospect.dto';
import { UpdateProspectDto } from '../services/dto/update-prospect.dto';

@Controller('prospects')
export class ProspectController {
  constructor(
    private prospectService: ProspectService,
    private intelligenceService: IntelligenceService,
  ) {}

  @Get()
  async findAll(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('activeOnly') activeOnly?: boolean,
    @Query('canContactOnly') canContactOnly?: boolean,
    @Query('specialization') specialization?: string,
    @Query('minListings') minListings?: number
  ) {
    const [prospects, total] = await this.prospectService.findAll({
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      activeOnly: activeOnly === 'true',
      canContactOnly: canContactOnly === 'true',
      specialization,
      minListings: minListings ? parseInt(minListings) : undefined
    });

    return {
      prospects,
      total,
      limit: limit ? parseInt(limit) : 100,
      offset: offset ? parseInt(offset) : 0
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return await this.prospectService.findOne(id);
  }

  @Post()
  async create(@Body() createProspectDto: CreateProspectDto) {
    return await this.prospectService.create(createProspectDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateProspectDto: UpdateProspectDto
  ) {
    return await this.prospectService.update(id, updateProspectDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    await this.prospectService.remove(id);
    return { message: 'Prospect removed successfully' };
  }

  @Get(':id/enrich')
  async enrich(@Param('id') id: number) {
    return await this.prospectService.enrichProspectData(id);
  }

  @Post('search')
  async searchByCriteria(@Body() criteria: any) {
    return await this.prospectService.searchByCriteria(criteria);
  }
}