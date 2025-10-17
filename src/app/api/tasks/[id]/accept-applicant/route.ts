import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Task from '@/lib/models/Task';
import { createNotification, createMultipleNotifications } from '@/lib/notifications';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { applicantUserId } = await request.json();
    if (!applicantUserId) {
      return NextResponse.json({ success: false, error: 'Applicant user ID is required' }, { status: 400 });
    }

    await dbConnect();

    const task = await Task.findById(params.id);
    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    // Check if user is the task owner
    if (task.posterId.toString() !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Only task owner can accept applicants' }, { status: 403 });
    }

    // Check if task already has an assigned worker
    if (task.assignedTo) {
      return NextResponse.json({ success: false, error: 'Task already has an assigned worker' }, { status: 400 });
    }

    // Find the applicant
    const applicantIndex = task.applicants.findIndex(
      (app: any) => app.userId.toString() === applicantUserId
    );

    if (applicantIndex === -1) {
      return NextResponse.json({ success: false, error: 'Applicant not found' }, { status: 404 });
    }

    // Update applicant status to accepted
    task.applicants[applicantIndex].status = 'accepted';
    
    // Assign the worker to the task
    task.assignedTo = applicantUserId;
    task.status = 'pending'; // Set to pending, waiting for worker confirmation

    // Reject all other pending applicants
    task.applicants.forEach((app: any, index: number) => {
      if (index !== applicantIndex && app.status === 'pending') {
        app.status = 'rejected';
      }
    });

    await task.save();

    // ✅ Send notification to accepted worker
    await createNotification({
      userId: applicantUserId,
      title: 'Lamaran Diterima! 🎉',
      message: `Selamat! Lamaran Anda untuk "${task.title}" telah diterima. Anda sekarang ditugaskan untuk pekerjaan ini.`,
      type: 'application_accepted',
      relatedId: task._id.toString(),
      relatedModel: 'Task',
    });

    // ✅ Send notifications to rejected applicants
    const rejectedNotifications = task.applicants
      .filter((app: any, index: number) => index !== applicantIndex && app.status === 'rejected')
      .map((app: any) => ({
        userId: app.userId.toString(),
        title: 'Lamaran Tidak Diterima',
        message: `Maaf, lamaran Anda untuk "${task.title}" tidak diterima. Tetap semangat mencari pekerjaan lainnya!`,
        type: 'application_rejected' as const,
        relatedId: task._id.toString(),
        relatedModel: 'Task' as const,
      }));

    if (rejectedNotifications.length > 0) {
      await createMultipleNotifications(rejectedNotifications);
    }

    return NextResponse.json({
      success: true,
      message: 'Applicant accepted successfully'
    });

  } catch (error) {
    console.error('Accept applicant error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}