import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

// Send verification code (Demo - auto verify)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { phone, code } = await request.json();

    await dbConnect();
    const user = await User.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If code is provided, verify it
    if (code) {
      // Demo mode: accept any 6-digit code
      if (code.length === 6 && /^\d+$/.test(code)) {
        await User.findByIdAndUpdate(session.user.id, {
          phoneVerified: true,
          phoneVerificationCode: null,
          phoneVerificationExpiry: null,
        });

        return NextResponse.json({
          success: true,
          message: 'Nomor HP berhasil diverifikasi',
        });
      } else {
        return NextResponse.json(
          { error: 'Kode verifikasi tidak valid' },
          { status: 400 }
        );
      }
    }

    // If no code, send verification code (Demo mode)
    // In production, integrate with SMS gateway like Twilio, Nexmo, etc.
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await User.findByIdAndUpdate(session.user.id, {
      phone,
      phoneVerificationCode: verificationCode,
      phoneVerificationExpiry: expiry,
    });

    // Demo: Return code in response (DON'T DO THIS IN PRODUCTION!)
    return NextResponse.json({
      success: true,
      message: 'Kode verifikasi telah dikirim',
      demoCode: verificationCode, // Only for demo!
    });

  } catch (error) {
    console.error('Phone verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}