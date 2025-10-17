import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
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

    // Upload images to Cloudinary
    const ktpUrl = await uploadToCloudinary(ktpImage);
    const selfieUrl = await uploadToCloudinary(selfieImage);

    await dbConnect();

    // Update user verification status
    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      {
        $set: {
          ktpVerification: {
            status: 'pending',
            ktpImage: ktpUrl,
            selfieImage: selfieUrl,
            submittedAt: new Date(),
          },
        },
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      data: user,
      message: 'Verifikasi berhasil diajukan',
    });
  } catch (error) {
    console.error('Verification submission error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}