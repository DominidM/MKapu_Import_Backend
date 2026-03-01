import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  Param, 
  Patch,
  Delete,
  Inject, 
  ParseIntPipe, 
  Query,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { IQuoteCommandPort, IQuoteQueryPort } from '../../../../domain/ports/in/quote-ports-in';
import { CreateQuoteDto } from '../../../../application/dto/in/create-quote.dto';
import { QuoteResponseDto, QuotePagedResponseDto } from '../../../../application/dto/out/quote-response.dto';
import { QuoteQueryFiltersDto } from '../../../../application/dto/in/quote-query-filters.dto';

@Controller('quote')
export class QuoteController {
  constructor(
    @Inject('IQuoteCommandPort')
    private readonly commandPort: IQuoteCommandPort,
    @Inject('IQuoteQueryPort')
    private readonly queryPort: IQuoteQueryPort,
  ) {}

  @Post()
  async create(@Body() dto: CreateQuoteDto): Promise<QuoteResponseDto> {
    return await this.commandPort.create(dto);
  }

  @Patch(':id/approve')
  async approve(@Param('id', ParseIntPipe) id: number): Promise<QuoteResponseDto> {
    return await this.commandPort.approve(id);
  }

  @Patch(':id/status')
  async changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { estado: string },
  ): Promise<QuoteResponseDto> {
    return await this.commandPort.changeStatus(id, body.estado);
  }

  // ── Eliminar permanentemente ──────────────────────────────────────────────
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.commandPort.delete(id);
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number): Promise<QuoteResponseDto | null> {
    return await this.queryPort.getById(id);
  }

  @Get('customer/:valor_doc')
  async getByCustomer(@Param('valor_doc') valor_doc: string): Promise<QuoteResponseDto[]> {
    return await this.queryPort.getByCustomerDocument(valor_doc);
  }

  @Get()
  async listQuotes(@Query() filters: QuoteQueryFiltersDto): Promise<QuotePagedResponseDto> {
    console.log('🔍 Controller filters:', JSON.stringify(filters));
    return this.queryPort.findAllPaged(filters);
  }
}