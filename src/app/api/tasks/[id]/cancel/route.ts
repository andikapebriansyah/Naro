import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Task from '@/lib/models/Task';
import { createNotification, createMultipleNotifications } from '@/lib/notifications';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { reason } = await request.json();

    // Find the task and verify ownership
    const task = await Task.findById(params.id);

    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    // Verify that the current user is the poster
    if (task.posterId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to cancel this task' },
        { status: 403 }
      );
    }

    // Check if task can be cancelled
    if (!['draft', 'open', 'pending'].includes(task.status)) {
      return NextResponse.json(
        { success: false, error: 'Task cannot be cancelled at this stage' },
        { status: 400 }
      );
    }
    
    if (['accepted', 'active', 'proses', 'completed_worker', 'completed'].includes(task.status)) {
      return NextResponse.json(
        { success: false, error: 'Tidak dapat membatalkan tugas yang sudah dalam proses atau selesai' },
        { status: 400 }
      );
    }
    // Update task status to cancelled
    const updatedTask = await Task.findByIdAndUpdate(
      params.id,
      {
        status: 'cancelled',
        cancellationReason: reason,
        cancelledAt: new Date()
      },
      { new: true }
    ).populate('posterId', 'name email image rating isVerified')
      .populate('assignedTo', 'name email image rating isVerified');

    if (!updatedTask) {
      return NextResponse.json(
        { success: false, error: 'Failed to cancel task' },
        { status: 500 }
      );
    }

    // ✅ Send notification to assigned worker if exists
    if (updatedTask.assignedTo) {
      await createNotification({
        userId: updatedTask.assignedTo._id.toString(),
        title: 'Pekerjaan Dibatalkan ❌',
        message: `Pekerjaan "${updatedTask.title}" telah dibatalkan oleh pemberi kerja.${reason ? ` Alasan: ${reason}` : ''}`,
        type: 'task_cancelled',
        relatedId: updatedTask._id.toString(),
        relatedModel: 'Task',
      });
    }

    // ✅ Send notifications to all pending applicants
    if (updatedTask.applicants && updatedTask.applicants.length > 0) {
      const applicantNotifications = updatedTask.applicants
        .filter((app: any) => app.status === 'pending')
        .map((app: any) => ({
          userId: app.userId.toString(),
          title: 'Pekerjaan Dibatalkan',
          message: `Pekerjaan "${updatedTask.title}" yang Anda lamar telah dibatalkan oleh pemberi kerja.`,
          type: 'task_cancelled' as const,
          relatedId: updatedTask._id.toString(),
          relatedModel: 'Task' as const,
        }));

      if (applicantNotifications.length > 0) {
        await createMultipleNotifications(applicantNotifications);
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedTask,
      message: 'Tugas berhasil dibatalkan'
    });
  } catch (error) {
    console.error('Cancel task error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}