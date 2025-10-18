import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Task from '@/lib/models/Task';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await request.json(); // 'accept' or 'reject'
    const taskId = params.id;

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Action tidak valid' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Pekerjaan tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check if user is assigned to this task
    if (task.assignedTo?.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak ditugaskan untuk pekerjaan ini' },
        { status: 403 }
      );
    }

    // Check if task is in waiting status
    if (task.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Status tugas tidak valid untuk konfirmasi' },
        { status: 400 }
      );
    }

    if (action === 'accept') {
      // Worker accepts the task
      task.status = 'active';
    } else {
      // Worker rejects the task
      task.assignedTo = null;
      
      if (task.searchMethod === 'publication') {
        // For publication, return to open status
        task.status = 'open';
        // Reset applicant status to allow re-application
        task.applicants.forEach((app: any) => {
          if (app.userId.toString() === session.user.id) {
            app.status = 'rejected';
          }
        });
      } else {
        // For find_worker, return to draft for employer to find another worker
        task.status = 'draft';
      }
    }

    await task.save();

    return NextResponse.json({
      success: true,
      message: action === 'accept' ? 'Tugas dikonfirmasi dan dimulai' : 'Tugas ditolak'
    });

  } catch (error) {
    console.error('Worker confirmation error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}