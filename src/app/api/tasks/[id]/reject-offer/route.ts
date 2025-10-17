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

    const taskId = params.id;

    await dbConnect();

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      return NextResponse.json({ success: false, error: 'Pekerjaan tidak ditemukan' }, { status: 404 });
    }

    console.log('Reject offer - Task details:', {
      taskId: task._id,
      searchMethod: task.searchMethod,
      status: task.status,
      assignedTo: task.assignedTo,
      currentUserId: session.user.id
    });

    // Check if this is a find_worker task
    if (task.searchMethod !== 'find_worker') {
      return NextResponse.json({ success: false, error: 'Pekerjaan ini tidak melalui sistem penawaran langsung' }, { status: 400 });
    }

    // Check if task is still available for rejection
    if (!['open', 'pending'].includes(task.status)) {
      return NextResponse.json({ success: false, error: 'Pekerjaan tidak dapat ditolak lagi' }, { status: 400 });
    }

    // Handle two scenarios for rejection:
    // 1. Job is 'open' and no assignedTo yet (user rejects direct offer)
    // 2. Job is 'pending' and user is already assigned (user rejects assigned offer)
    
    if (task.status === 'open' && !task.assignedTo) {
      // Scenario 1: Just reject without any changes (user was not assigned yet)
      console.log('Rejecting direct offer - no changes needed');
      task.status = 'rejected'; // Mark as rejected
    } else if (task.status === 'pending' && task.assignedTo) {
      // Scenario 2: Remove assignment and reset status to open
      if (task.assignedTo.toString() !== session.user.id) {
        return NextResponse.json({ success: false, error: 'Anda tidak ditugaskan untuk pekerjaan ini' }, { status: 400 });
      }
      console.log('Rejecting assigned offer - removing assignment');
      task.assignedTo = null;
      task.status = 'open'; // Reset to open so employer can find another worker
      task.updatedAt = new Date();
      await task.save();
    } else {
      return NextResponse.json({ success: false, error: 'Status pekerjaan tidak valid untuk ditolak' }, { status: 400 });
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Penawaran berhasil ditolak',
      data: {
        taskId: task._id,
        status: task.status,
        assignedTo: task.assignedTo
      }
    });

  } catch (error) {
    console.error('Reject offer error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat menolak pekerjaan' },
      { status: 500 }
    );
  }
}