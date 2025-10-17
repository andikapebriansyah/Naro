import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Report from '@/lib/models/Report';
import Task from '@/lib/models/Task';
import User from '@/lib/models/User';
import mongoose from 'mongoose';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const { resolution, adminNotes, action } = body;

    if (!resolution?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Resolusi wajib diisi' },
        { status: 400 }
      );
    }

    const report = await Report.findById(params.id);
    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    // ✅ NEW: Update report with action field
    report.status = 'resolved';
    report.resolution = resolution;
    report.adminNotes = adminNotes;
    report.action = action; // ✅ Store the action taken
    report.resolvedAt = new Date();
    report.reviewedBy = new mongoose.Types.ObjectId(session.user.id);
    await report.save();

    // Take action based on admin decision
    if (action === 'suspend_reported') {
      await User.findByIdAndUpdate(report.reportedUserId, {
        isVerified: false,
      });
    }

    if (action === 'refund') {
      await Task.findByIdAndUpdate(report.taskId, {
        status: 'cancelled',
        paymentStatus: 'refunded',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Laporan berhasil diselesaikan',
      data: report,
    });
  } catch (error) {
    console.error('Resolve report error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to resolve report' },
      { status: 500 }
    );
  }
}