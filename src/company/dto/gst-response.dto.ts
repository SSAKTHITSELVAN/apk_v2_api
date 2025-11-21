
// File: src/company/dto/gst-response.dto.ts


import { ApiProperty} from '@nestjs/swagger';

export class GstResponseDto {
  @ApiProperty()
  flag: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data: {
    gstin: string;
    lgnm: string;
    tradeNam: string;
    sts: string;
    rgdt: string;
    ctb: string;
    dty: string;
    nba: string[];
    pradr: any;
    adadr: any[];
    ctj: string;
    stj: string;
  };
}