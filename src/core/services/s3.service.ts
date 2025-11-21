// File: src/core/services/s3.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

export enum AssetType {
  COMPANY_LOGO = 'company-logos',
  PROFILE_IMAGE = 'profile-images',
  COVER_IMAGE = 'cover-images',
  CHAT_FILE = 'chat-files',
  PRODUCT_IMAGE = 'product-images',
}

export interface UploadResult {
  key: string;
  signedUrl: string;
  size: number;
  mimeType: string;
}

@Injectable()
export class S3Service {
  private s3: AWS.S3;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.s3 = new AWS.S3({
      region: this.configService.get<string>('AWS_REGION'),
      accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
    });

    const bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');
    if (!bucketName) {
      throw new Error(
        'AWS_S3_BUCKET_NAME is not configured in environment variables',
      );
    }
    this.bucketName = bucketName;
  }

  /**
   * Upload file to S3 and return signed URL
   * @param file - Multer file object
   * @param folder - S3 folder path or AssetType enum
   * @param expiresIn - Signed URL expiration in seconds (default 7 days)
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: AssetType | string,
    expiresIn: number = 7 * 24 * 60 * 60, // 7 days default
  ): Promise<UploadResult> {
    try {
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

      const uploadParams: AWS.S3.PutObjectRequest = {
        Bucket: this.bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        // Removed ACL parameter - bucket doesn't allow ACLs
      };

      await this.s3.upload(uploadParams).promise();

      // Generate signed URL for the uploaded file
      const signedUrl = await this.generateSignedUrl(fileName, expiresIn);

      return {
        key: fileName,
        signedUrl,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      console.error('S3 Upload Error:', error);
      throw new BadRequestException(
        `Failed to upload file to S3: ${error.message}`,
      );
    }
  }

  /**
   * Upload company logo to S3
   */
  async uploadCompanyLogo(
    file: Express.Multer.File,
  ): Promise<UploadResult> {
    this.validateImageFile(file);
    return this.uploadFile(file, AssetType.COMPANY_LOGO);
  }

  /**
   * Upload profile image to S3
   */
  async uploadProfileImage(
    file: Express.Multer.File,
  ): Promise<UploadResult> {
    this.validateImageFile(file);
    return this.uploadFile(file, AssetType.PROFILE_IMAGE);
  }

  /**
   * Upload cover image to S3
   */
  async uploadCoverImage(
    file: Express.Multer.File,
  ): Promise<UploadResult> {
    this.validateImageFile(file);
    return this.uploadFile(file, AssetType.COVER_IMAGE);
  }

  /**
   * Upload product image to S3
   */
  async uploadProductImage(
    file: Express.Multer.File,
  ): Promise<UploadResult> {
    this.validateImageFile(file);
    return this.uploadFile(file, AssetType.PRODUCT_IMAGE);
  }

  /**
   * Validate that file is an image and within size limits
   */
  private validateImageFile(file: Express.Multer.File): void {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, and WebP images are allowed',
      );
    }

    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }
  }

  /**
   * Generate signed URL for private S3 files
   * @param key - S3 key (path)
   * @param expiresIn - Expiration time in seconds (default 1 hour)
   */
  async generateSignedUrl(
    key: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    try {
      return this.s3.getSignedUrl('getObject', {
        Bucket: this.bucketName,
        Key: key,
        Expires: expiresIn,
      });
    } catch (error) {
      console.error('S3 Signed URL Error:', error);
      throw new BadRequestException(
        `Failed to generate signed URL: ${error.message}`,
      );
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      await this.s3
        .deleteObject({
          Bucket: this.bucketName,
          Key: key,
        })
        .promise();
    } catch (error) {
      console.error('S3 Delete Error:', error);
      throw new BadRequestException(
        `Failed to delete file from S3: ${error.message}`,
      );
    }
  }

  /**
   * Check if a string is an S3 key (not a full URL)
   */
  isS3Key(path: string): boolean {
    if (!path) return false;

    // If it's a full URL (http/https), it's not an S3 key
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return false;
    }

    // Check if it matches our S3 key pattern
    const s3KeyPattern =
      /^(company-logos|profile-images|cover-images|chat-files|product-images)\/.+\..+$/;
    return s3KeyPattern.test(path);
  }

  /**
   * Generate signed URL if path is S3 key, otherwise return as-is
   */
  async getAccessibleUrl(
    path: string | null | undefined,
    expiresIn: number = 3600,
  ): Promise<string | null> {
    if (!path) return null;

    if (this.isS3Key(path)) {
      try {
        return await this.generateSignedUrl(path, expiresIn);
      } catch (error) {
        console.error(`Failed to generate signed URL for ${path}:`, error);
        return null;
      }
    }

    // Return existing URL as-is (backward compatibility)
    return path;
  }

  /**
   * Get file type from MIME type
   */
  getFileTypeFromMime(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType === 'application/pdf') return 'pdf';
    return 'file';
  }

  /**
   * Test S3 connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.s3
        .listObjectsV2({
          Bucket: this.bucketName,
          MaxKeys: 1,
        })
        .promise();
      return true;
    } catch (error) {
      console.error('S3 Connection Test Failed:', error);
      return false;
    }
  }

  /**
   * Upload multiple files at once
   */
  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: AssetType | string,
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map((file) =>
      this.uploadFile(file, folder),
    );
    return Promise.all(uploadPromises);
  }
}