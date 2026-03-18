import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {

    constructor() {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key:    process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    }

  async uploadLogo(file: Express.Multer.File): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder:    'MKP/empresa',
          public_id: 'logo_empresa',
          overwrite: true,
        },
        (error, result: UploadApiResponse) => {
          if (error) {
            console.error('Cloudinary error:', error);
            return reject(error);
          }
          resolve({
            url:      result.secure_url,
            publicId: result.public_id,
          });
        },
      );
      stream.end(file.buffer);
    });
  }

  async deleteLogo(publicId: string): Promise<void> {
    if (!publicId) return;
    await cloudinary.uploader.destroy(publicId);
  }
}