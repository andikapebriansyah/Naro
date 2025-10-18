import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Task from '@/lib/models/Task';

// Simple payment processor (in production, use real payment gateway)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId, method, amount, details } = await request.json();

    if (!taskId || !method || !amount) {
      return NextResponse.json(
        { success: false, error: 'Data pembayaran tidak lengkap' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verify task exists and belongs to user
    const task = await Task.findById(taskId);
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Tugas tidak ditemukan' },
        { status: 404 }
      );
    }

    if (task.posterId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Tidak memiliki akses ke tugas ini' },
        { status: 403 }
      );
    }

    // Generate payment ID
    const paymentId = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // In a real application, you would:
    // 1. Process payment with payment gateway (Midtrans, Xendit, etc.)
    // 2. Handle different payment methods (card, bank transfer, e-wallet)
    // 3. Store payment records in database
    // 4. Handle payment callbacks/webhooks

    // For demo purposes, we'll simulate successful payment
    const paymentRecord = {
      paymentId,
      taskId,
      userId: session.user.id,
      method,
      amount,
      details: method === 'card' ? {
        // Mask card number for security
        cardNumber: `****-****-****-${details.cardNumber.slice(-4)}`,
        cardName: details.cardName
      } : details,
      status: 'completed',
      createdAt: new Date(),
      completedAt: new Date()
    };

    // Update task with payment information
    await Task.findByIdAndUpdate(taskId, {
      status: 'open', // Change status to open after payment
      paymentId,
      paymentStatus: 'completed',
      paymentMethod: method,
      paymentAmount: amount,
      paymentDate: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Pembayaran berhasil diproses',
      paymentId,
      payment: paymentRecord
    });

  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat memproses pembayaran' },
      { status: 500 }
    );
  }
}

// Get payment details
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // In a real application, you would fetch from payments collection
    // For demo, we'll get task with payment info
    const task = await Task.findOne({ paymentId }).select('paymentId paymentStatus paymentMethod paymentAmount paymentDate');

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      payment: {
        paymentId: task.paymentId,
        status: task.paymentStatus,
        method: task.paymentMethod,
        amount: task.paymentAmount,
        date: task.paymentDate
      }
    });

  } catch (error) {
    console.error('Get payment error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat mengambil data pembayaran' },
      { status: 500 }
    );
  }
}