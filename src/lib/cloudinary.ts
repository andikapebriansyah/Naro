import { v2 as cloudinary } from 'cloudinary';

// Validate and sanitize environment variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

console.log('🔧 Cloudinary initialization:', {
  hasCloudName: !!cloudName,
  hasApiKey: !!apiKey,
  hasApiSecret: !!apiSecret,
  cloudNameValue: cloudName || 'MISSING',
  apiKeyPrefix: apiKey ? `${apiKey.substring(0, 8)}...` : 'MISSING',
  secretPrefix: apiSecret ? `${apiSecret.substring(0, 8)}...` : 'MISSING',
  nodeEnv: process.env.NODE_ENV
});

if (!cloudName || !apiKey || !apiSecret) {
  console.error('❌ Cloudinary credentials missing! Please check environment variables.');
  console.error('Required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
}

// Configure Cloudinary only if all credentials are present
if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
    timeout: 60000,
  });
  console.log('✅ Cloudinary configured successfully for cloud:', cloudName);
} else {
  console.warn('⚠️ Cloudinary not configured - uploads will fail');
}

export async function uploadToCloudinary(
  file: File,
  folder: string = 'naro-app/tasks'
): Promise<string> {
  // Check if Cloudinary is configured
  if (!cloudName || !apiKey || !apiSecret) {
    const missingVars = [];
    if (!cloudName) missingVars.push('CLOUDINARY_CLOUD_NAME');
    if (!apiKey) missingVars.push('CLOUDINARY_API_KEY');
    if (!apiSecret) missingVars.push('CLOUDINARY_API_SECRET');
    
    throw new Error(
      `Cloudinary not configured. Missing: ${missingVars.join(', ')}. ` +
      `Please set these environment variables in Vercel Dashboard.`
    );
  }

  try {
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`📤 Uploading: ${file.name} (${buffer.length} bytes) to ${folder}`);
    console.log(`🔑 Cloud: ${cloudName}, API Key: ${apiKey.substring(0, 8)}...`);

    // Convert buffer to base64 data URI
    const mimeType = file.type || 'image/jpeg';
    const base64String = `data:${mimeType};base64,${buffer.toString('base64')}`;

    console.log(`📊 Base64 prepared: ${base64String.substring(0, 50)}... (${base64String.length} chars)`);

    // Build the upload URL for logging
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    console.log(`🌐 Upload URL: ${uploadUrl}`);

    // Upload directly using base64
    console.log('⏳ Calling cloudinary.uploader.upload...');
    const result = await cloudinary.uploader.upload(base64String, {
      folder,
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto:good' },
      ],
      timeout: 60000,
    });

    if (!result?.secure_url) {
      console.error('❌ No secure_url in response:', JSON.stringify(result, null, 2));
      throw new Error('Cloudinary did not return a secure_url');
    }

    console.log(`✅ Upload successful!`);
    console.log(`📝 Public ID: ${result.public_id}`);
    console.log(`🔗 URL: ${result.secure_url}`);
    
    return result.secure_url;
  } catch (error: any) {
    // Enhanced error logging
    console.error('❌ CLOUDINARY UPLOAD FAILED:', {
      errorName: error?.name,
      errorMessage: error?.message,
      httpCode: error?.http_code,
      errorCode: error?.error?.code,
      apiErrorMessage: error?.error?.message,
      fileName: file?.name,
      fileSize: file?.size,
      folder: folder,
      cloudName: cloudName,
      hasResult: !!error?.result,
      fullError: JSON.stringify(error, null, 2)
    });
    
    // Provide detailed error messages
    let errorMsg = 'Unknown error';
    
    // Check for authentication errors
    if (error?.message?.includes('Invalid API Key') || 
        error?.message?.includes('Invalid Signature') ||
        error?.http_code === 401) {
      errorMsg = '🔒 Unauthorized (401) - Invalid Cloudinary credentials. ' +
                 'Please verify CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in Vercel environment variables.';
    } 
    // Check for server errors
    else if (error?.http_code === 500) {
      errorMsg = '🚨 Cloudinary server error (500). This usually means:\n' +
                 '1. Invalid credentials (API Key or Secret)\n' +
                 '2. Cloudinary service is down\n' +
                 '3. Cloud name is incorrect\n' +
                 `Current cloud name: "${cloudName}"`;
    }
    // Check for bad request
    else if (error?.http_code === 400) {
      errorMsg = `⚠️ Bad request (400): ${error?.error?.message || 'Invalid file format or parameters'}`;
    }
    // Check for timeout
    else if (error?.message?.includes('timeout') || error?.message?.includes('ETIMEDOUT')) {
      errorMsg = '⏱️ Upload timeout - file may be too large or connection is slow';
    }
    // Generic error with message
    else if (error?.message) {
      errorMsg = error.message;
    }
    
    throw new Error(`Failed to upload to Cloudinary: ${errorMsg}`);
  }
}