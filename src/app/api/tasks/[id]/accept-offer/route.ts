import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Task from '@/lib/models/Task';
import { Types } from 'mongoose';

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

    console.log('=== ACCEPT OFFER REQUEST ===');
    console.log('Task ID:', taskId);
    console.log('Worker ID (current user):', session.user.id);

    await dbConnect();

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      console.error('Task not found:', taskId);
      return NextResponse.json(
        { success: false, error: 'Pekerjaan tidak ditemukan' },
        { status: 404 }
      );
    }

    console.log('Task found:', {
      id: task._id,
      title: task.title,
      status: task.status,
      searchMethod: task.searchMethod,
      assignedTo: task.assignedTo
    });

    // Check if this is a find_worker task
    if (task.searchMethod !== 'find_worker') {
      console.error('Task is not a find_worker type');
      return NextResponse.json(
        { success: false, error: 'Tugas ini bukan penawaran langsung' },
        { status: 400 }
      );
    }

    // Check if task is in 'pending' status (waiting for worker confirmation)
    if (task.status !== 'pending') {
      console.error('Task status is not pending, current status:', task.status);
      return NextResponse.json(
        { success: false, error: 'Tugas tidak dalam status menunggu konfirmasi' },
        { status: 400 }
      );
    }

    // Check if assignedTo exists and matches current user
    if (!task.assignedTo || task.assignedTo.toString() !== session.user.id) {
      console.error('User is not the assigned worker');
      return NextResponse.json(
        { success: false, error: 'Tugas ini bukan untuk Anda' },
        { status: 403 }
      );
    }

    // Update task status to 'accepted' (worker confirmed, ready to start)
    task.status = 'accepted';

    await task.save();

    console.log('Offer accepted successfully:', {
      taskId: task._id,
      assignedTo: task.assignedTo,
      newStatus: task.status
    });

    return NextResponse.json({
      success: true,
      message: 'Penawaran pekerjaan diterima. Siap untuk dimulai!',
      data: {
        taskId: task._id,
        status: task.status,
        assignedTo: task.assignedTo
      }
    });

  } catch (error) {
    console.error('Accept offer error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}