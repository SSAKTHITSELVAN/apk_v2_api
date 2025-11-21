
// File: src/company/dto/update-company.dto.ts


import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCompanyDto {
  @ApiPropertyOptional({
    description: 'Profile image file',
    type: 'string',
    format: 'binary',
  })
  profileImage?: any;

  @ApiPropertyOptional({
    description: 'Company logo file',
    type: 'string',
    format: 'binary',
  })
  companyLogo?: any;
}
