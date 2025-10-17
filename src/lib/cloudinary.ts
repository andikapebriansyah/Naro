import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  // Tambah timeout lebih panjang untuk upload
  timeout: 120000, // 120 detik untuk upload
});

export async function uploadToCloudinary(
  file: File,
  folder: string = 'naro-app/tasks'
): Promise<string> {
  try {
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`Starting upload: ${file.name} (${buffer.length} bytes)`);

    // Upload menggunakan Cloudinary SDK dengan proper error handling
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary callback error:', error);
            reject(error);
          } else {
            console.log('Cloudinary callback success:', result?.public_id);
            resolve(result);
          }
        }
      );

      // Event listeners untuk stream
      uploadStream.on('error', (error) => {
        console.error('Stream error:', error);
        reject(error);
      });

      uploadStream.on('timeout', () => {
        console.error('Stream timeout');
        reject(new Error('Upload stream timeout'));
      });

      uploadStream.on('close', () => {
        console.log('Stream closed');
      });

      // End stream dengan buffer
      uploadStream.end(buffer);
    });

    if (!result?.secure_url) {
      throw new Error('No secure_url returned from Cloudinary');
    }

    console.log(`Upload successful: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to upload image: ${errorMsg}`);
  }
}