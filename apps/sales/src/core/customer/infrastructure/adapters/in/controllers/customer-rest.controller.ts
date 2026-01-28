
/* ============================================
   sales/src/core/customer/infrastructure/adapters/in/controllers/customer-rest.controller.ts
   ============================================ */

import {
  Controller,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Inject,
  Get,
  Query,
} from '@nestjs/common';
import { ICustomerCommandPort, ICustomerQueryPort } from '../../../../domain/ports/in/cunstomer-port-in';
import {
  RegisterCustomerDto,
  UpdateCustomerDto,
  ChangeCustomerStatusDto,
  ListCustomerFilterDto,
} from '../../../../application/dto/in';
import {
  CustomerResponseDto,
  CustomerListResponse,
  CustomerDeletedResponseDto,
} from '../../../../application/dto/out';

@Controller('customers')
export class CustomerRestController {
  constructor(
    @Inject('ICustomerQueryPort')
    private readonly customerQueryService: ICustomerQueryPort,
    @Inject('ICustomerCommandPort')
    private readonly customerCommandService: ICustomerCommandPort,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async registerCustomer(
    @Body() registerDto: RegisterCustomerDto,
  ): Promise<CustomerResponseDto> {
    return this.customerCommandService.registerCustomer(registerDto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateCustomer(
    @Param('id') id: string,
    @Body() updateDto: Omit<UpdateCustomerDto, 'id_cliente'>,
  ): Promise<CustomerResponseDto> {
    const fullUpdateDto: UpdateCustomerDto = {
      ...updateDto,
      id_cliente: id,
    };
    return this.customerCommandService.updateCustomer(fullUpdateDto);
  }

  @Put(':id/status')
  @HttpCode(HttpStatus.OK)
  async changeCustomerStatus(
    @Param('id') id: string,
    @Body() statusDto: { estado: boolean },
  ): Promise<CustomerResponseDto> {
    const changeStatusDto: ChangeCustomerStatusDto = {
      id_cliente: id,
      estado: statusDto.estado,
    };
    return this.customerCommandService.changeCustomerStatus(changeStatusDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteCustomer(
    @Param('id') id: string,
  ): Promise<CustomerDeletedResponseDto> {
    return this.customerCommandService.deleteCustomer(id);
  }

  @Get(':id')
  async getCustomer(@Param('id') id: string): Promise<CustomerResponseDto | null> {
    return this.customerQueryService.getCustomerById(id);
  }

  @Get('document/:num_doc')
  async getCustomerByDocument(
    @Param('num_doc') num_doc: string,
  ): Promise<CustomerResponseDto | null> {
    return this.customerQueryService.getCustomerByDocument(num_doc);
  }

  @Get()
  async listCustomers(
    @Query() filters: ListCustomerFilterDto,
  ): Promise<CustomerListResponse> {
    return this.customerQueryService.listCustomers(filters);
  }
}
