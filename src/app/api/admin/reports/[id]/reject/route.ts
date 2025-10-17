import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Report from '@/lib/models/Report';
import Task from '@/lib/models/Task';
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
    const { adminNotes } = body;

    if (!adminNotes?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Alasan penolakan wajib diisi' },
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

    // Get current task status before updating
    const task = await Task.findById(report.taskId);
    const previousStatus = task?.status || 'active';

    report.status = 'rejected';
    report.resolution = 'Laporan ditolak - tidak valid';
    report.adminNotes = adminNotes;
    report.resolvedAt = new Date();
    report.reviewedBy = new mongoose.Types.ObjectId(session.user.id);
    await report.save();

    // Restore task status from disputed to previous status
    if (task && task.status === 'disputed') {
      await Task.findByIdAndUpdate(report.taskId, {
        status: 'active', // or could store previous status
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Laporan ditolak (tidak valid)',
      data: report,
    });
  } catch (error) {
    console.error('Reject report error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reject report' },
      { status: 500 }
    );
  }
}