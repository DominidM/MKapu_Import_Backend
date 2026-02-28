import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AdminTcpProxy {
  constructor(@Inject('ADMIN_SERVICE') private readonly client: ClientProxy) {}

  async getHeadquartersNames(ids: number[]): Promise<Record<number, string>> {
    return await firstValueFrom(this.client.send('get_sedes_nombres', ids));
  }
}
