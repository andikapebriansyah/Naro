import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { extractTextWithTimeout } from '@/lib/ocr';
import { parseKTPData, validateKTPData } from '@/lib/ktpParser';

// Force nodejs runtime for file uploads (tidak pakai edge runtime)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Log environment check
    console.log('🔍 Environment check:', {
      hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
      hasApiKey: !!process.env.CLOUDINARY_API_KEY,
      hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      runtime: 'nodejs'
    });

    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const ktpImage = formData.get('ktpImage') as File;
    const selfieImage = formData.get('selfieImage') as File;

    if (!ktpImage || !selfieImage) {
      return NextResponse.json(
        { success: false, error: 'Kedua foto harus diupload' },
        { status: 400 }
      );
    }

    console.log('📤 Uploading KTP image to Cloudinary...');
    let ktpUrl: string;
    let selfieUrl: string;
    
    try {
      ktpUrl = await uploadToCloudinary(ktpImage, 'naro-app/verifications/ktp');
      console.log('✅ KTP uploaded successfully:', ktpUrl);
    } catch (uploadError: any) {
      console.error('❌ KTP upload failed:', uploadError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Gagal mengupload foto KTP',
          details: uploadError.message
        },
        { status: 503 }
      );
    }
    
    console.log('📤 Uploading selfie image to Cloudinary...');
    try {
      selfieUrl = await uploadToCloudinary(selfieImage, 'naro-app/verifications/selfie');
      console.log('✅ Selfie uploaded successfully:', selfieUrl);
    } catch (uploadError: any) {
      console.error('❌ Selfie upload failed:', uploadError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Gagal mengupload foto selfie',
          details: uploadError.message
        },
        { status: 503 }
      );
    }

    // Perform OCR on KTP image
    let ocrResult = null;
    let extractedData = null;
    let ocrConfidence = 0;

    try {
      console.log('Starting OCR process for uploaded KTP...');
      const ocrResponse = await extractTextWithTimeout(ktpImage, 30000); // Increase timeout untuk OCR yang real
      
      console.log('OCR Response:', {
        textLength: ocrResponse.text?.length || 0,
        confidence: ocrResponse.confidence,
        hasText: !!ocrResponse.text
      });

      if (ocrResponse.text && ocrResponse.text.trim().length > 10) {
        // Parse KTP data
        let parseResult = parseKTPData(ocrResponse.text);

        ocrResult = parseResult;
        extractedData = parseResult.data;
        ocrConfidence = parseResult.confidence || ocrResponse.confidence;

        console.log('OCR completed successfully:', {
          ocrConfidence: ocrResponse.confidence,
          parseConfidence: parseResult.confidence,
          extractedFields: Object.keys(extractedData || {}).length,
          success: parseResult.success,
          missingFields: parseResult.missingFields
        });
      } else {
        console.log('OCR returned empty or insufficient text');
      }
    } catch (ocrError) {
      console.error('OCR processing error:', ocrError);
      // Log error details untuk debugging
      if (ocrError instanceof Error) {
        console.error('Error message:', ocrError.message);
        console.error('Error stack:', ocrError.stack);
      }
      // Continue without OCR data - don't fail the entire process
    }

    await dbConnect();

    // Prepare verification data
    const verificationData = {
      status: 'pending',
      ktpImage: ktpUrl,
      selfieImage: selfieUrl,
      submittedAt: new Date(),
      ocrConfidence,
      extractedData: extractedData || {},
    };

    // Update user verification status
    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      {
        $set: {
          ktpVerification: verificationData,
        },
      },
      { new: true }
    );

    // Prepare response
    const responseData = {
      user,
      extractedData,
      ocrConfidence,
    };

    // Check if OCR was successful and add details
    if (ocrResult) {
      return NextResponse.json({
        success: true,
        data: responseData,
        message: ocrResult.success 
          ? 'Verifikasi berhasil diajukan dan data KTP berhasil dibaca'
          : 'Verifikasi berhasil diajukan, namun beberapa data KTP tidak terbaca dengan jelas',
        details: ocrResult.missingFields ? { missingFields: ocrResult.missingFields } : undefined,
      });
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      message: 'Verifikasi berhasil diajukan',
    });
  } catch (error: any) {
    console.error('Verification submission error:', error);
    
    // Provide more specific error messages to the client
    let errorMessage = 'Internal server error';
    let statusCode = 500;
    
    if (error?.message?.includes('Cloudinary')) {
      errorMessage = error.message;
      statusCode = 503; // Service Unavailable
    } else if (error?.message?.includes('credentials')) {
      errorMessage = 'Image upload service not configured properly';
      statusCode = 503;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: statusCode }
    );
  }
}