import { ListRemissionFilterDto } from '../../../application/dto/in/list-remission-filter.dto';
import {
  RemissionListResponseDto,
  RemissionResponseDto,
} from '../../../application/dto/out/remission-response.dto';
import { RemissionSummaryResponseDto } from '../../../application/dto/out/remission-summary-response.dto';

export interface RemissionQueryPortIn {
  executeList(
    filter: ListRemissionFilterDto,
  ): Promise<RemissionListResponseDto>;
  executeFindById(id: string): Promise<RemissionResponseDto>;
  executeGetSummary(): Promise<RemissionSummaryResponseDto>;
}
