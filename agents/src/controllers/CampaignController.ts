import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { OutreachService } from '../services/OutreachService';
import { ResponseService } from '../services/ResponseService';

@Controller('campaigns')
export class CampaignController {
  constructor(
    private outreachService: OutreachService,
    private responseService: ResponseService,
  ) {}

  @Post()
  async createCampaign(
    @Body('name') name: string,
    @Body('description') description: string,
    @Body('prospectIds') prospectIds: number[]
  ) {
    return await this.outreachService.createCampaign(name, description, prospectIds);
  }

  @Put(':id/start')
  async startCampaign(@Param('id') id: number) {
    return await this.outreachService.startCampaign(id);
  }

  @Put(':id/pause')
  async pauseCampaign(@Param('id') id: number) {
    return await this.outreachService.pauseCampaign(id);
  }

  @Put(':id/complete')
  async completeCampaign(@Param('id') id: number) {
    return await this.outreachService.completeCampaign(id);
  }

  @Put(':id/cancel')
  async cancelCampaign(@Param('id') id: number) {
    return await this.outreachService.cancelCampaign(id);
  }

  @Get(':id')
  async getCampaignDetails(@Param('id') id: number) {
    return await this.outreachService.getCampaignDetails(id);
  }

  @Get(':id/analytics')
  async getCampaignAnalytics(@Param('id') id: number) {
    return await this.responseService.getCampaignResponseAnalytics(id);
  }

  @Post(':id/outreach')
  async sendOutreach(
    @Param('id') campaignId: number,
    @Body('prospectId') prospectId: number,
    @Body('sequenceStep') sequenceStep: number,
    @Body('channel') channel: 'email' | 'linkedin' = 'email'
  ) {
    return await this.outreachService.sendOutreach(
      prospectId,
      campaignId,
      sequenceStep,
      channel
    );
  }

  @Post('inbound')
  async processInbound(
    @Body('prospectId') prospectId: number,
    @Body('channel') channel: 'email' | 'linkedin',
    @Body('subject') subject: string,
    @Body('content') content: string,
    @Body('receivedAt') receivedAt?: string
  ) {
    const date = receivedAt ? new Date(receivedAt) : new Date();
    return await this.responseService.processInboundInteraction(
      prospectId,
      channel,
      subject,
      content,
      date
    );
  }
}