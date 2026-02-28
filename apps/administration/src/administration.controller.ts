import { Controller, Get } from '@nestjs/common';
import { AdministrationService } from './administration.service';

@Controller()
export class AdministrationController {
  constructor(private readonly administrationService: AdministrationService) {}
}
