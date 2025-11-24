// // File: src/core/services/msg91.service.ts

// import { Injectable, Logger } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import axios from 'axios';

// @Injectable()
// export class Msg91Service {
//   private readonly logger = new Logger(Msg91Service.name);
//   private readonly authKey: string;
//   private readonly templateId: string;
//   private readonly senderId: string;
//   private readonly dltTemplateId: string;
//   private readonly baseUrl = 'https://control.msg91.com/api/v5/otp';

//   constructor(private configService: ConfigService) {
//     this.authKey = this.configService.get<string>('MSG91_AUTH_KEY') || '';
//     this.templateId = this.configService.get<string>('MSG91_TEMPLATE_ID') || '';
//     this.senderId = this.configService.get<string>('MSG91_SENDER_ID') || '';
//     this.dltTemplateId = this.configService.get<string>('MSG91_DLT_TEMPLATE_ID') || '';
    
//     // Log warning if config is missing
//     if (!this.authKey) {
//       this.logger.warn('MSG91_AUTH_KEY is not configured');
//     }
//   }

//   /**
//    * Generate a random OTP of specified length
//    */
//   generateOtp(length: number = 6): string {
//     return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
//   }

//   /**
//    * Send OTP via MSG91
//    * @param mobile - Mobile number (with or without country code)
//    * @param otp - OTP to send (generated if not provided)
//    * @param otpExpiry - OTP validity in minutes (default: 10)
//    */
//   async sendOtp(
//     mobile: string,
//     otp?: string,
//     otpExpiry: number = 10,
//   ): Promise<{
//     success: boolean;
//     otp?: string;
//     mobile?: string;
//     message?: string;
//     requestId?: string;
//     error?: string;
//   }> {
//     try {
//       // Add country code if not present
//       const formattedMobile = mobile.startsWith('91') ? mobile : `91${mobile}`;

//       // Generate OTP if not provided
//       const generatedOtp = otp || this.generateOtp(4); // 4 digits as per your current system

//       // Query parameters
//       const params = {
//         template_id: this.templateId,
//         mobile: formattedMobile,
//         authkey: this.authKey,
//         otp_expiry: otpExpiry,
//         realTimeResponse: '1',
//         DLT_TE_ID: this.dltTemplateId,
//       };

//       // Body data - Variables for template placeholders
//       // Template: Dear user, your BIZZAP login OTP is ##var1##. It's valid for ##var2## minutes...
//       const payload = {
//         var1: generatedOtp, // ##var1## = OTP
//         var2: otpExpiry.toString(), // ##var2## = Minutes
//       };

//       this.logger.log(
//         `Sending OTP to ${formattedMobile} with expiry ${otpExpiry} minutes`,
//       );

//       // Make POST request to MSG91
//       const response = await axios.post(this.baseUrl, payload, {
//         params,
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         timeout: 30000,
//       });

//       // Parse response
//       const result = response.data;

//       // Check success
//       if (response.status === 200) {
//         const responseType = result.type?.toLowerCase();

//         if (
//           responseType === 'success' ||
//           result.message === 'OTP sent successfully'
//         ) {
//           this.logger.log(
//             `OTP sent successfully to ${formattedMobile}. Request ID: ${result.request_id}`,
//           );

//           return {
//             success: true,
//             otp: generatedOtp,
//             mobile: formattedMobile,
//             message: 'OTP sent successfully',
//             requestId: result.request_id,
//           };
//         } else {
//           this.logger.warn(
//             `MSG91 responded with unexpected type: ${result.type}`,
//           );
//           return {
//             success: false,
//             error: result.message || 'Unexpected response from MSG91',
//           };
//         }
//       } else {
//         this.logger.error(
//           `MSG91 API failed with status ${response.status}: ${result.message}`,
//         );
//         return {
//           success: false,
//           error: result.message || 'Failed to send OTP',
//         };
//       }
//     } catch (error) {
//       if (axios.isAxiosError(error)) {
//         if (error.code === 'ECONNABORTED') {
//           this.logger.error('MSG91 request timed out');
//           return {
//             success: false,
//             error: 'Request timed out. Please try again.',
//           };
//         } else if (error.response) {
//           this.logger.error(
//             `MSG91 API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
//           );
//           return {
//             success: false,
//             error:
//               error.response.data?.message ||
//               'Failed to send OTP. Please try again.',
//           };
//         } else if (error.request) {
//           this.logger.error('No response from MSG91 API');
//           return {
//             success: false,
//             error: 'Network error. Please check your connection.',
//           };
//         }
//       }

//       this.logger.error(`Unexpected error sending OTP: ${error.message}`);
//       return {
//         success: false,
//         error: 'An unexpected error occurred. Please try again.',
//       };
//     }
//   }

//   /**
//    * Alternative method using Flow API
//    * Use this if the OTP API doesn't work
//    */
//   async sendOtpViaFlow(
//     mobile: string,
//     otp?: string,
//     otpExpiry: number = 10,
//   ): Promise<{
//     success: boolean;
//     otp?: string;
//     mobile?: string;
//     message?: string;
//     error?: string;
//   }> {
//     try {
//       const formattedMobile = mobile.startsWith('91') ? mobile : `91${mobile}`;
//       const generatedOtp = otp || this.generateOtp(4);

//       const url = 'https://control.msg91.com/api/v5/flow/';

//       const payload = {
//         template_id: this.templateId,
//         sender: this.senderId,
//         short_url: '0',
//         mobiles: formattedMobile,
//         var1: generatedOtp,
//         var2: otpExpiry.toString(),
//         DLT_TE_ID: this.dltTemplateId,
//       };

//       this.logger.log(
//         `Sending OTP via Flow API to ${formattedMobile}`,
//       );

//       const response = await axios.post(url, payload, {
//         headers: {
//           authkey: this.authKey,
//           'Content-Type': 'application/json',
//         },
//         timeout: 30000,
//       });

//       if (response.status === 200) {
//         this.logger.log(`OTP sent successfully via Flow API to ${formattedMobile}`);
//         return {
//           success: true,
//           otp: generatedOtp,
//           mobile: formattedMobile,
//           message: 'OTP sent successfully',
//         };
//       } else {
//         this.logger.error(`Flow API failed: ${response.data}`);
//         return {
//           success: false,
//           error: 'Failed to send OTP via Flow API',
//         };
//       }
//     } catch (error) {
//       this.logger.error(`Flow API error: ${error.message}`);
//       return {
//         success: false,
//         error: 'Failed to send OTP. Please try again.',
//       };
//     }
//   }

//   /**
//    * Verify AuthKey by checking balance
//    */
//   async verifyAuthKey(): Promise<boolean> {
//     try {
//       const url = 'https://control.msg91.com/api/v5/user/getBalance';
//       const response = await axios.get(url, {
//         headers: { authkey: this.authKey },
//         timeout: 10000,
//       });

//       if (response.status === 200) {
//         this.logger.log(`MSG91 AuthKey verified. Balance: ${JSON.stringify(response.data)}`);
//         return true;
//       }
//       return false;
//     } catch (error) {
//       this.logger.error(`Failed to verify AuthKey: ${error.message}`);
//       return false;
//     }
//   }
// }




// File: src/core/services/msg91.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class Msg91Service {
  private readonly logger = new Logger(Msg91Service.name);
  private readonly authKey: string;
  private readonly templateId: string;
  private readonly senderId: string;
  private readonly dltTemplateId: string;
  private readonly baseUrl = 'https://control.msg91.com/api/v5/otp';

  constructor(private configService: ConfigService) {
    this.authKey = this.configService.get<string>('MSG91_AUTH_KEY') || '';
    this.templateId = this.configService.get<string>('MSG91_TEMPLATE_ID') || '';
    this.senderId = this.configService.get<string>('MSG91_SENDER_ID') || '';
    this.dltTemplateId = this.configService.get<string>('MSG91_DLT_TEMPLATE_ID') || '';
    
    // Log warning if config is missing
    if (!this.authKey) {
      this.logger.warn('MSG91_AUTH_KEY is not configured');
    }
  }

  /**
   * Generate a random OTP of specified length
   */
  generateOtp(length: number = 6): string {
    return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
  }

  /**
   * Send OTP via MSG91
   * @param mobile - Mobile number (with or without country code)
   * @param otp - OTP to send (generated if not provided)
   * @param otpExpiry - OTP validity in minutes (default: 10)
   */
  async sendOtp(
    mobile: string,
    otp?: string,
    otpExpiry: number = 10,
  ): Promise<{
    success: boolean;
    otp?: string;
    mobile?: string;
    message?: string;
    requestId?: string;
    error?: string;
  }> {
    try {
      // Add country code if not present
      const formattedMobile = mobile.startsWith('91') ? mobile : `91${mobile}`;

      // Generate 6-digit OTP if not provided
      const generatedOtp = otp || this.generateOtp(6);

      // Query parameters
      const params = {
        template_id: this.templateId,
        mobile: formattedMobile,
        authkey: this.authKey,
        otp_expiry: otpExpiry,
        realTimeResponse: '1',
        DLT_TE_ID: this.dltTemplateId,
      };

      // Body data - Variables for template placeholders
      // Template: Dear user, your BIZZAP login OTP is ##var1##. It's valid for ##var2## minutes...
      const payload = {
        var1: generatedOtp, // ##var1## = OTP
        var2: otpExpiry.toString(), // ##var2## = Minutes
      };

      this.logger.log(
        `Sending 6-digit OTP to ${formattedMobile} with expiry ${otpExpiry} minutes`,
      );

      // Make POST request to MSG91
      const response = await axios.post(this.baseUrl, payload, {
        params,
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      // Parse response
      const result = response.data;

      // Check success
      if (response.status === 200) {
        const responseType = result.type?.toLowerCase();

        if (
          responseType === 'success' ||
          result.message === 'OTP sent successfully'
        ) {
          this.logger.log(
            `OTP sent successfully to ${formattedMobile}. Request ID: ${result.request_id}`,
          );

          return {
            success: true,
            otp: generatedOtp,
            mobile: formattedMobile,
            message: 'OTP sent successfully',
            requestId: result.request_id,
          };
        } else {
          this.logger.warn(
            `MSG91 responded with unexpected type: ${result.type}`,
          );
          return {
            success: false,
            error: result.message || 'Unexpected response from MSG91',
          };
        }
      } else {
        this.logger.error(
          `MSG91 API failed with status ${response.status}: ${result.message}`,
        );
        return {
          success: false,
          error: result.message || 'Failed to send OTP',
        };
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          this.logger.error('MSG91 request timed out');
          return {
            success: false,
            error: 'Request timed out. Please try again.',
          };
        } else if (error.response) {
          this.logger.error(
            `MSG91 API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
          );
          return {
            success: false,
            error:
              error.response.data?.message ||
              'Failed to send OTP. Please try again.',
          };
        } else if (error.request) {
          this.logger.error('No response from MSG91 API');
          return {
            success: false,
            error: 'Network error. Please check your connection.',
          };
        }
      }

      this.logger.error(`Unexpected error sending OTP: ${error.message}`);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      };
    }
  }

  /**
   * Alternative method using Flow API
   * Use this if the OTP API doesn't work
   */
  async sendOtpViaFlow(
    mobile: string,
    otp?: string,
    otpExpiry: number = 10,
  ): Promise<{
    success: boolean;
    otp?: string;
    mobile?: string;
    message?: string;
    error?: string;
  }> {
    try {
      const formattedMobile = mobile.startsWith('91') ? mobile : `91${mobile}`;
      const generatedOtp = otp || this.generateOtp(6); // 6 digits

      const url = 'https://control.msg91.com/api/v5/flow/';

      const payload = {
        template_id: this.templateId,
        sender: this.senderId,
        short_url: '0',
        mobiles: formattedMobile,
        var1: generatedOtp,
        var2: otpExpiry.toString(),
        DLT_TE_ID: this.dltTemplateId,
      };

      this.logger.log(
        `Sending 6-digit OTP via Flow API to ${formattedMobile}`,
      );

      const response = await axios.post(url, payload, {
        headers: {
          authkey: this.authKey,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      if (response.status === 200) {
        this.logger.log(`OTP sent successfully via Flow API to ${formattedMobile}`);
        return {
          success: true,
          otp: generatedOtp,
          mobile: formattedMobile,
          message: 'OTP sent successfully',
        };
      } else {
        this.logger.error(`Flow API failed: ${response.data}`);
        return {
          success: false,
          error: 'Failed to send OTP via Flow API',
        };
      }
    } catch (error) {
      this.logger.error(`Flow API error: ${error.message}`);
      return {
        success: false,
        error: 'Failed to send OTP. Please try again.',
      };
    }
  }

  /**
   * Verify AuthKey by checking balance
   */
  async verifyAuthKey(): Promise<boolean> {
    try {
      const url = 'https://control.msg91.com/api/v5/user/getBalance';
      const response = await axios.get(url, {
        headers: { authkey: this.authKey },
        timeout: 10000,
      });

      if (response.status === 200) {
        this.logger.log(`MSG91 AuthKey verified. Balance: ${JSON.stringify(response.data)}`);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(`Failed to verify AuthKey: ${error.message}`);
      return false;
    }
  }
}