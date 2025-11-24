
// File: src/auth/dto/auth-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  user: {
    id: string;
    mobileNumber: string;
    isVerified: boolean;
  };

  @ApiProperty()
  isNewUser: boolean;

  @ApiProperty({ required: false })
  company?: any;
}
