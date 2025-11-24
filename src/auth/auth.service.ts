// // File: src/auth/auth.service.ts

// import {
//   Injectable,
//   BadRequestException,
//   UnauthorizedException,
// } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { JwtService } from '@nestjs/jwt';
// import { ConfigService } from '@nestjs/config';
// import { User } from './entities/user.entity';
// import { Company } from '../company/entities/company.entity';
// import { SendOtpDto } from './dto/send-otp.dto';
// import { VerifyOtpDto } from './dto/verify-otp.dto';
// import { DeleteAccountDto } from './dto/delete-account.dto';
// import { S3Service } from '../core/services/s3.service';
// import { Msg91Service } from '../core/services/msg91.service';

// @Injectable()
// export class AuthService {
//   private readonly useRealOtp: boolean;
//   private readonly STATIC_OTP = '1234';

//   constructor(
//     @InjectRepository(User)
//     private userRepository: Repository<User>,
//     @InjectRepository(Company)
//     private companyRepository: Repository<Company>,
//     private jwtService: JwtService,
//     private s3Service: S3Service,
//     private msg91Service: Msg91Service,
//     private configService: ConfigService,
//   ) {
//     // Use real OTP in production, simulated OTP in development
//     this.useRealOtp = this.configService.get('NODE_ENV') === 'production';
//   }

//   async sendOtp(sendOtpDto: SendOtpDto) {
//     const { mobileNumber } = sendOtpDto;

//     let user = await this.userRepository.findOne({ where: { mobileNumber } });

//     if (!user) {
//       user = this.userRepository.create({
//         mobileNumber,
//         isVerified: false,
//       });
//     }

//     let otpCode: string;
//     let otpSent = false;

//     if (this.useRealOtp) {
//       // Send real OTP via MSG91
//       const result = await this.msg91Service.sendOtp(mobileNumber);

//       if (result.success && result.otp) {
//         otpCode = result.otp;
//         otpSent = true;
//       } else {
//         // Fallback to Flow API if OTP API fails
//         const flowResult = await this.msg91Service.sendOtpViaFlow(mobileNumber);
        
//         if (flowResult.success && flowResult.otp) {
//           otpCode = flowResult.otp;
//           otpSent = true;
//         } else {
//           throw new BadRequestException(
//             result.error || 'Failed to send OTP. Please try again.',
//           );
//         }
//       }
//     } else {
//       // Use static OTP for development
//       otpCode = this.STATIC_OTP;
//       otpSent = true;
//       console.log(`📱 DEV MODE - OTP for ${mobileNumber}: ${this.STATIC_OTP}`);
//     }

//     if (otpSent) {
//       user.lastOtp = otpCode;
//       user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
//       await this.userRepository.save(user);
//     }

//     return {
//       message: 'OTP sent successfully',
//       data: {
//         mobileNumber,
//         expiresIn: '10 minutes',
//         ...(this.useRealOtp ? {} : { otp: otpCode }), // Include OTP only in dev mode
//       },
//     };
//   }

//   async verifyOtp(verifyOtpDto: VerifyOtpDto) {
//     const { mobileNumber, otp } = verifyOtpDto;

//     const user = await this.userRepository.findOne({
//       where: { mobileNumber },
//       relations: ['company'],
//     });

//     if (!user) {
//       throw new BadRequestException('User not found');
//     }

//     if (!user.lastOtp || !user.otpExpiresAt) {
//       throw new BadRequestException('No OTP found. Please request a new OTP');
//     }

//     if (user.otpExpiresAt < new Date()) {
//       throw new BadRequestException('OTP has expired');
//     }

//     if (user.lastOtp !== otp) {
//       throw new UnauthorizedException('Invalid OTP');
//     }

//     user.isVerified = true;
//     user.lastOtp = null;
//     user.otpExpiresAt = null;
//     await this.userRepository.save(user);

//     const payload = { sub: user.id, mobileNumber: user.mobileNumber };
//     const accessToken = this.jwtService.sign(payload);

//     const isNewUser = !user.company;

//     let companyData: any = null;
//     if (user.company) {
//       companyData = {
//         ...user.company,
//         profileImage: await this.s3Service.getAccessibleUrl(
//           user.company.profileImage,
//         ),
//         companyLogo: await this.s3Service.getAccessibleUrl(
//           user.company.companyLogo,
//         ),
//       };
//     }

//     return {
//       message: 'OTP verified successfully',
//       data: {
//         accessToken,
//         user: {
//           id: user.id,
//           mobileNumber: user.mobileNumber,
//           isVerified: user.isVerified,
//         },
//         isNewUser,
//         company: companyData,
//       },
//     };
//   }

//   async getProfile(userId: string) {
//     const user = await this.userRepository.findOne({
//       where: { id: userId },
//       relations: ['company'],
//     });

//     if (!user) {
//       throw new BadRequestException('User not found');
//     }

//     let companyData: any = null;
//     if (user.company) {
//       companyData = {
//         ...user.company,
//         profileImage: await this.s3Service.getAccessibleUrl(
//           user.company.profileImage,
//         ),
//         companyLogo: await this.s3Service.getAccessibleUrl(
//           user.company.companyLogo,
//         ),
//       };
//     }

//     return {
//       message: 'Profile retrieved successfully',
//       data: {
//         user: {
//           id: user.id,
//           mobileNumber: user.mobileNumber,
//           isVerified: user.isVerified,
//           createdAt: user.createdAt,
//         },
//         company: companyData,
//       },
//     };
//   }

//   /**
//    * Send OTP for account deletion
//    */
//   async sendDeleteAccountOtp(userId: string) {
//     const user = await this.userRepository.findOne({
//       where: { id: userId },
//     });

//     if (!user) {
//       throw new BadRequestException('User not found');
//     }

//     let otpCode: string;
//     let otpSent = false;

//     if (this.useRealOtp) {
//       // Send real OTP via MSG91
//       const result = await this.msg91Service.sendOtp(user.mobileNumber);

//       if (result.success && result.otp) {
//         otpCode = result.otp;
//         otpSent = true;
//       } else {
//         // Fallback to Flow API
//         const flowResult = await this.msg91Service.sendOtpViaFlow(
//           user.mobileNumber,
//         );
        
//         if (flowResult.success && flowResult.otp) {
//           otpCode = flowResult.otp;
//           otpSent = true;
//         } else {
//           throw new BadRequestException(
//             result.error || 'Failed to send OTP for account deletion.',
//           );
//         }
//       }
//     } else {
//       // Use static OTP for development
//       otpCode = this.STATIC_OTP;
//       otpSent = true;
//       console.log(
//         `📱 DEV MODE - DELETE ACCOUNT OTP for ${user.mobileNumber}: ${this.STATIC_OTP}`,
//       );
//     }

//     if (otpSent) {
//       user.lastOtp = otpCode;
//       user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
//       await this.userRepository.save(user);
//     }

//     return {
//       message: 'OTP sent successfully for account deletion',
//       data: {
//         mobileNumber: user.mobileNumber,
//         expiresIn: '10 minutes',
//         ...(this.useRealOtp ? {} : { otp: otpCode }), // Include OTP only in dev mode
//       },
//     };
//   }

//   /**
//    * Delete user account and associated company
//    * With cascade delete configured, we only need to delete images and the user
//    */
//   async deleteAccount(userId: string, deleteAccountDto: DeleteAccountDto) {
//     const { otp } = deleteAccountDto;

//     const user = await this.userRepository.findOne({
//       where: { id: userId },
//       relations: ['company', 'company.leads'],
//     });

//     if (!user) {
//       throw new BadRequestException('User not found');
//     }

//     if (!user.lastOtp || !user.otpExpiresAt) {
//       throw new BadRequestException(
//         'No OTP found. Please request a new OTP for deletion',
//       );
//     }

//     if (user.otpExpiresAt < new Date()) {
//       throw new BadRequestException('OTP has expired');
//     }

//     if (user.lastOtp !== otp) {
//       throw new UnauthorizedException('Invalid OTP');
//     }

//     // Delete S3 files before deleting the database records
//     if (user.company) {
//       // Delete company images
//       if (user.company.profileImage) {
//         try {
//           await this.s3Service.deleteFile(user.company.profileImage);
//         } catch (error) {
//           console.error('Error deleting profile image:', error);
//         }
//       }
//       if (user.company.companyLogo) {
//         try {
//           await this.s3Service.deleteFile(user.company.companyLogo);
//         } catch (error) {
//           console.error('Error deleting company logo:', error);
//         }
//       }

//       // Delete all lead images
//       if (user.company.leads && user.company.leads.length > 0) {
//         for (const lead of user.company.leads) {
//           if (lead.imageKey) {
//             try {
//               await this.s3Service.deleteFile(lead.imageKey);
//             } catch (error) {
//               console.error(
//                 `Error deleting lead image ${lead.imageKey}:`,
//                 error,
//               );
//             }
//           }
//         }
//       }
//     }

//     // Delete the user - cascade will handle company, leads, consumptions, reports, and referrals
//     await this.userRepository.remove(user);

//     return {
//       message: 'Account and associated data deleted successfully',
//       data: null,
//     };
//   }
// }



// File: src/auth/auth.service.ts

import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { Company } from '../company/entities/company.entity';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { S3Service } from '../core/services/s3.service';
import { Msg91Service } from '../core/services/msg91.service';

@Injectable()
export class AuthService {
  private readonly useRealOtp: boolean;
  private readonly STATIC_OTP = '123456';
  private readonly ADMIN_MOBILE = '919003388830'; // Admin mobile with country code
  private readonly ADMIN_STATIC_OTP = '123456';

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    private jwtService: JwtService,
    private s3Service: S3Service,
    private msg91Service: Msg91Service,
    private configService: ConfigService,
  ) {
    // Use real OTP in production, simulated OTP in development
    this.useRealOtp = this.configService.get('NODE_ENV') === 'production';
  }

  /**
   * Check if the mobile number is admin
   */
  private isAdminMobile(mobileNumber: string): boolean {
    const formatted = mobileNumber.startsWith('91') ? mobileNumber : `91${mobileNumber}`;
    return formatted === this.ADMIN_MOBILE;
  }

  async sendOtp(sendOtpDto: SendOtpDto) {
    const { mobileNumber } = sendOtpDto;

    let user = await this.userRepository.findOne({ where: { mobileNumber } });

    if (!user) {
      user = this.userRepository.create({
        mobileNumber,
        isVerified: false,
      });
    }

    let otpCode: string;
    let otpSent = false;

    // Check if admin mobile
    if (this.isAdminMobile(mobileNumber)) {
      otpCode = this.ADMIN_STATIC_OTP;
      otpSent = true;
      console.log(`🔐 ADMIN ACCESS - Static OTP for ${mobileNumber}: ${this.ADMIN_STATIC_OTP}`);
    } else if (this.useRealOtp) {
      // Send real OTP via MSG91
      const result = await this.msg91Service.sendOtp(mobileNumber);

      if (result.success && result.otp) {
        otpCode = result.otp;
        otpSent = true;
      } else {
        // Fallback to Flow API if OTP API fails
        const flowResult = await this.msg91Service.sendOtpViaFlow(mobileNumber);
        
        if (flowResult.success && flowResult.otp) {
          otpCode = flowResult.otp;
          otpSent = true;
        } else {
          throw new BadRequestException(
            result.error || 'Failed to send OTP. Please try again.',
          );
        }
      }
    } else {
      // Use static OTP for development
      otpCode = this.STATIC_OTP;
      otpSent = true;
      console.log(`📱 DEV MODE - OTP for ${mobileNumber}: ${this.STATIC_OTP}`);
    }

    if (otpSent) {
      user.lastOtp = otpCode;
      user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await this.userRepository.save(user);
    }

    return {
      message: 'OTP sent successfully',
      data: {
        mobileNumber,
        expiresIn: '10 minutes',
        ...(this.useRealOtp ? {} : { otp: otpCode }), // Include OTP only in dev mode or admin
        ...(this.isAdminMobile(mobileNumber) ? { otp: otpCode, isAdmin: true } : {}),
      },
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { mobileNumber, otp } = verifyOtpDto;

    const user = await this.userRepository.findOne({
      where: { mobileNumber },
      relations: ['company'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.lastOtp || !user.otpExpiresAt) {
      throw new BadRequestException('No OTP found. Please request a new OTP');
    }

    if (user.otpExpiresAt < new Date()) {
      throw new BadRequestException('OTP has expired');
    }

    if (user.lastOtp !== otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    user.isVerified = true;
    user.lastOtp = null;
    user.otpExpiresAt = null;
    await this.userRepository.save(user);

    const payload = { sub: user.id, mobileNumber: user.mobileNumber };
    const accessToken = this.jwtService.sign(payload);

    const isNewUser = !user.company;

    let companyData: any = null;
    if (user.company) {
      companyData = {
        ...user.company,
        profileImage: await this.s3Service.getAccessibleUrl(
          user.company.profileImage,
        ),
        companyLogo: await this.s3Service.getAccessibleUrl(
          user.company.companyLogo,
        ),
      };
    }

    return {
      message: 'OTP verified successfully',
      data: {
        accessToken,
        user: {
          id: user.id,
          mobileNumber: user.mobileNumber,
          isVerified: user.isVerified,
          isAdmin: this.isAdminMobile(user.mobileNumber),
        },
        isNewUser,
        company: companyData,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['company'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    let companyData: any = null;
    if (user.company) {
      companyData = {
        ...user.company,
        profileImage: await this.s3Service.getAccessibleUrl(
          user.company.profileImage,
        ),
        companyLogo: await this.s3Service.getAccessibleUrl(
          user.company.companyLogo,
        ),
      };
    }

    return {
      message: 'Profile retrieved successfully',
      data: {
        user: {
          id: user.id,
          mobileNumber: user.mobileNumber,
          isVerified: user.isVerified,
          isAdmin: this.isAdminMobile(user.mobileNumber),
          createdAt: user.createdAt,
        },
        company: companyData,
      },
    };
  }

  /**
   * Send OTP for account deletion
   */
  async sendDeleteAccountOtp(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    let otpCode: string;
    let otpSent = false;

    // Check if admin mobile
    if (this.isAdminMobile(user.mobileNumber)) {
      otpCode = this.ADMIN_STATIC_OTP;
      otpSent = true;
      console.log(
        `🔐 ADMIN ACCESS - DELETE ACCOUNT Static OTP for ${user.mobileNumber}: ${this.ADMIN_STATIC_OTP}`,
      );
    } else if (this.useRealOtp) {
      // Send real OTP via MSG91
      const result = await this.msg91Service.sendOtp(user.mobileNumber);

      if (result.success && result.otp) {
        otpCode = result.otp;
        otpSent = true;
      } else {
        // Fallback to Flow API
        const flowResult = await this.msg91Service.sendOtpViaFlow(
          user.mobileNumber,
        );
        
        if (flowResult.success && flowResult.otp) {
          otpCode = flowResult.otp;
          otpSent = true;
        } else {
          throw new BadRequestException(
            result.error || 'Failed to send OTP for account deletion.',
          );
        }
      }
    } else {
      // Use static OTP for development
      otpCode = this.STATIC_OTP;
      otpSent = true;
      console.log(
        `📱 DEV MODE - DELETE ACCOUNT OTP for ${user.mobileNumber}: ${this.STATIC_OTP}`,
      );
    }

    if (otpSent) {
      user.lastOtp = otpCode;
      user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await this.userRepository.save(user);
    }

    return {
      message: 'OTP sent successfully for account deletion',
      data: {
        mobileNumber: user.mobileNumber,
        expiresIn: '10 minutes',
        ...(this.useRealOtp ? {} : { otp: otpCode }), // Include OTP only in dev mode
        ...(this.isAdminMobile(user.mobileNumber) ? { otp: otpCode, isAdmin: true } : {}),
      },
    };
  }

  /**
   * Delete user account and associated company
   * With cascade delete configured, we only need to delete images and the user
   */
  async deleteAccount(userId: string, deleteAccountDto: DeleteAccountDto) {
    const { otp } = deleteAccountDto;

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['company', 'company.leads'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.lastOtp || !user.otpExpiresAt) {
      throw new BadRequestException(
        'No OTP found. Please request a new OTP for deletion',
      );
    }

    if (user.otpExpiresAt < new Date()) {
      throw new BadRequestException('OTP has expired');
    }

    if (user.lastOtp !== otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Delete S3 files before deleting the database records
    if (user.company) {
      // Delete company images
      if (user.company.profileImage) {
        try {
          await this.s3Service.deleteFile(user.company.profileImage);
        } catch (error) {
          console.error('Error deleting profile image:', error);
        }
      }
      if (user.company.companyLogo) {
        try {
          await this.s3Service.deleteFile(user.company.companyLogo);
        } catch (error) {
          console.error('Error deleting company logo:', error);
        }
      }

      // Delete all lead images
      if (user.company.leads && user.company.leads.length > 0) {
        for (const lead of user.company.leads) {
          if (lead.imageKey) {
            try {
              await this.s3Service.deleteFile(lead.imageKey);
            } catch (error) {
              console.error(
                `Error deleting lead image ${lead.imageKey}:`,
                error,
              );
            }
          }
        }
      }
    }

    // Delete the user - cascade will handle company, leads, consumptions, reports, and referrals
    await this.userRepository.remove(user);

    return {
      message: 'Account and associated data deleted successfully',
      data: null,
    };
  }
}