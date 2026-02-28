import {
  Controller,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Inject,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  IUserCommandPort,
  IUserQueryPort,
} from '../../../../domain/ports/in/user-port-in';
import { UserWebSocketGateway } from '../../out/user-websocket.gateway';
import {
  ChangeUserStatusDto,
  ListUserFilterDto,
  RegisterUserDto,
  UpdateUserDto,
} from '../../../../application/dto/in';
import {
  UserDeletedResponseDto,
  UserListResponse,
  UserResponseDto,
} from '../../../../application/dto/out';
import { Roles } from 'libs/common/src/infrastructure/decorators/roles.decorators';
import { RoleGuard } from 'libs/common/src/infrastructure/guard/roles.guard';
import { CuentaUsuarioOrmEntity } from '../../../entity/cuenta-usuario-orm.entity';
import { CuentaRolOrmEntity } from '../../../entity/cuenta-rol-orm.entity';
import { RoleOrmEntity } from '../../../../../role/infrastructure/entity/role-orm.entity';
import { HeadquartersOrmEntity } from '../../../../../headquarters/infrastructure/entity/headquarters-orm.entity';


@Controller('users')
//@UseGuards(RoleGuard)
//@Roles('Administrador')
export class UserRestController {
  constructor(
    @Inject('IUserQueryPort')
    private readonly userQueryService: IUserQueryPort,
    @Inject('IUserCommandPort')
    private readonly userCommandService: IUserCommandPort,
    private readonly userGateway: UserWebSocketGateway,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async registerUser(
    @Body() registerDto: RegisterUserDto,
  ): Promise<UserResponseDto> {
    const newUser = await this.userCommandService.registerUser(registerDto);
    this.userGateway.notifyUserCreated(newUser);
    return newUser;
  }
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: Omit<UpdateUserDto, 'id_usuario'>,
  ): Promise<UserResponseDto> {
    const fullUpdateDto: UpdateUserDto = {
      ...updateDto,
      id_usuario: id,
    };
    const updatedUser = await this.userCommandService.updateUser(fullUpdateDto);
    this.userGateway.notifyUserUpdated(updatedUser);
    return updatedUser;
  }

  @Put(':id/status')
  @HttpCode(HttpStatus.OK)
  async changeUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() statusDto: { activo: boolean },
  ): Promise<UserResponseDto> {
    const changeStatusDto: ChangeUserStatusDto = {
      id_usuario: id,
      activo: statusDto.activo,
    };

    const updatedUser =
      await this.userCommandService.changeUserStatus(changeStatusDto);
    this.userGateway.notifyUserStatusChanged(updatedUser);

    return updatedUser;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserDeletedResponseDto> {
    const deletedUser = await this.userCommandService.deleteUser(id);
    this.userGateway.notifyUserDeleted(id);
    return deletedUser;
  }
  
  @Get()
  async listUsers(@Query() filters: ListUserFilterDto): Promise<UserListResponse> {
    return this.userQueryService.listUsers(filters);
  }

  @Get('all')
  async getAllUsers(): Promise<UserResponseDto[]> {
    return this.userQueryService.getAllUsers();
  }

  @Get(':id')
  async getUser(@Param('id') id: number) {
    return this.userQueryService.getUserById(id);
  }

  @Get(':id/full')
  async getUserWithAccount(@Param('id') id: number) {
    return await this.userQueryService.getUserWithAccount(id);
  }
}
