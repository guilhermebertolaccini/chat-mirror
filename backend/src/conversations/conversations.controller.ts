import { Controller, Get, Param, Query } from '@nestjs/common';
import { ConversationsService } from './conversations.service';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) { }

  @Get()
  findAll(@Query('lineId') lineId: string) {
    return this.conversationsService.findAll(lineId);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('limit') limit?: number,
    @Query('before') before?: string,
    @Query('after') after?: string
  ) {
    return this.conversationsService.findOne(id, limit, before, after);
  }
}
