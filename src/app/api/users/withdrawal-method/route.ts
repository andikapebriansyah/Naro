import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

// Get withdrawal method
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();
    const user = await User.findById(session.user.id).select('withdrawalMethod');
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user.withdrawalMethod || null,
    });
  } catch (error) {
    console.error('Get withdrawal method error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Set/Update withdrawal method
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, bankName, accountNumber, accountName, ewalletType, ewalletNumber } = body;

    // Validate required fields
    if (!type || !['bank', 'ewallet'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipe metode penarikan tidak valid' },
        { status: 400 }
      );
    }

    if (type === 'bank') {
      if (!bankName || !accountNumber || !accountName) {
        return NextResponse.json(
          { error: 'Data bank tidak lengkap' },
          { status: 400 }
        );
      }
    } else if (type === 'ewallet') {
      if (!ewalletType || !ewalletNumber) {
        return NextResponse.json(
          { error: 'Data e-wallet tidak lengkap' },
          { status: 400 }
        );
      }
    }

    await dbConnect();

    const withdrawalMethod = {
      type,
      ...(type === 'bank' ? { bankName, accountNumber, accountName } : {}),
      ...(type === 'ewallet' ? { ewalletType, ewalletNumber } : {}),
    };

    await User.findByIdAndUpdate(session.user.id, {
      withdrawalMethod,
    });

    return NextResponse.json({
      success: true,
      message: 'Metode penarikan berhasil disimpan',
      data: withdrawalMethod,
    });

  } catch (error) {
    console.error('Update withdrawal method error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}