import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import mongoose from 'mongoose';

const MINIMUM_WITHDRAWAL = 10000; // Rp 10.000

// Withdrawal Transaction Schema (in production, create separate model)
const withdrawalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  method: {
    type: { type: String, enum: ['bank', 'ewallet'] },
    bankName: String,
    accountNumber: String,
    accountName: String,
    ewalletType: String,
    ewalletNumber: String,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  processedAt: Date,
  completedAt: Date,
  notes: String,
  createdAt: { type: Date, default: Date.now },
});

const Withdrawal = mongoose.models.Withdrawal || mongoose.model('Withdrawal', withdrawalSchema);

// Get withdrawal history
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
    
    const withdrawals = await Withdrawal.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({
      success: true,
      data: withdrawals,
    });
  } catch (error) {
    console.error('Get withdrawals error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create withdrawal request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { amount } = await request.json();

    if (!amount || amount < MINIMUM_WITHDRAWAL) {
      return NextResponse.json(
        { error: `Minimal penarikan Rp ${MINIMUM_WITHDRAWAL.toLocaleString('id-ID')}` },
        { status: 400 }
      );
    }

    await dbConnect();
    
    const user = await User.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has withdrawal method
    if (!user.withdrawalMethod) {
      return NextResponse.json(
        { error: 'Atur metode penarikan terlebih dahulu' },
        { status: 400 }
      );
    }

    // Check if user has sufficient balance
    if (user.balance < amount) {
      return NextResponse.json(
        { error: 'Saldo tidak mencukupi' },
        { status: 400 }
      );
    }

    // Create withdrawal record
    const withdrawal = new Withdrawal({
      userId: session.user.id,
      amount,
      method: user.withdrawalMethod,
      status: 'pending',
    });

    await withdrawal.save();

    // Deduct balance (in production, do this after admin approval)
    // For demo, we auto-complete
    await User.findByIdAndUpdate(session.user.id, {
      $inc: { balance: -amount },
    });

    // Auto-complete for demo
    withdrawal.status = 'completed';
    withdrawal.completedAt = new Date();
    await withdrawal.save();

    return NextResponse.json({
      success: true,
      message: 'Penarikan berhasil diproses',
      data: withdrawal,
    });

  } catch (error) {
    console.error('Withdrawal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}