import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';
import { AiService, ChatHistoryItem } from './ai.service';
import { Public } from '../common/decorators/public.decorator';

export class AiChatDto {
  @IsNotEmpty({ message: 'Please enter your health question or symptoms' })
  @IsString()
  message: string;

  @IsOptional()
  @IsArray()
  history?: ChatHistoryItem[];
}

@ApiTags('AI Health Assistant')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Public()
  @Post('chat')
  @ApiOperation({ summary: 'Chat with Gemini AI medical assistant and get doctor recommendations' })
  chat(@Body() dto: AiChatDto) {
    return this.aiService.chatWithAssistant(dto.message, dto.history);
  }
}
