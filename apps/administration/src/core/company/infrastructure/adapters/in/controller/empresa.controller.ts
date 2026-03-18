import { Controller, Get, Put, Body, Inject, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { GET_EMPRESA_USE_CASE, GetEmpresaPort } from '../../../../domain/ports/in/get-empresa.port';
import { UPDATE_EMPRESA_USE_CASE, UpdateEmpresaPort } from '../../../../domain/ports/in/update-empresa.port';
import { UpdateEmpresaDto } from '../../../../application/dto/in/update-empresa.dto';
import { EmpresaMapper } from '../../../../application/mapper/empresa.mapper';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '../../../cloudinary/cloudinary.service';

@Controller('empresa')
export class EmpresaController {
  constructor(
    @Inject(GET_EMPRESA_USE_CASE)
    private readonly getEmpresa: GetEmpresaPort,
    @Inject(UPDATE_EMPRESA_USE_CASE)
    private readonly updateEmpresa: UpdateEmpresaPort,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  async get() {
    const empresa = await this.getEmpresa.execute();
    return EmpresaMapper.toResponse(empresa);
  }

  @Put()
  async update(@Body() dto: UpdateEmpresaDto) {
    const empresa = await this.updateEmpresa.execute(dto);
    return EmpresaMapper.toResponse(empresa);
  }

  @Post('logo')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 2 * 1024 * 1024 },  
  }))
  async uploadLogo(@UploadedFile() file: Express.Multer.File) {
    return this.cloudinaryService.uploadLogo(file);
  }
}