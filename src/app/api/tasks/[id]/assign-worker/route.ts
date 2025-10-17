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

    const { workerId } = await request.json();
    const taskId = params.id;

    console.log('=== ASSIGN WORKER REQUEST ===');
    console.log('Task ID:', taskId);
    console.log('Worker ID:', workerId);
    console.log('Poster ID (current user):', session.user.id);

    if (!workerId) {
      return NextResponse.json(
        { success: false, error: 'Worker ID diperlukan' },
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

    console.log('Task found:', {
      id: task._id,
      title: task.title,
      status: task.status,
      searchMethod: task.searchMethod,
      posterId: task.posterId
    });

    // Check if user is the poster
    if (task.posterId.toString() !== session.user.id) {
      console.error('User is not the poster of this task');
      return NextResponse.json(
        { success: false, error: 'Anda tidak memiliki akses untuk melakukan ini' },
        { status: 403 }
      );
    }

    // Check if task is find_worker type
    if (task.searchMethod !== 'find_worker') {
      console.error('Task is not a find_worker type');
      return NextResponse.json(
        { success: false, error: 'Action ini hanya untuk tugas pencarian pekerja' },
        { status: 400 }
      );
    }

    // FIX: Accept both 'draft' and 'open' status (not just 'draft')
    // Because tasks are created with 'open' status by default
    if (!['draft', 'open'].includes(task.status)) {
      console.error('Task status is not draft or open, current status:', task.status);
      return NextResponse.json(
        { success: false, error: 'Tugas sudah memiliki pekerja yang ditugaskan atau status tidak memungkinkan' },
        { status: 400 }
      );
    }

    // Check if task already has an assigned worker
    if (task.assignedTo && task.assignedTo.toString() !== workerId) {
      console.error('Task already has a different assigned worker');
      return NextResponse.json(
        { success: false, error: 'Tugas sudah memiliki pekerja lain yang ditugaskan' },
        { status: 400 }
      );
    }

    // Assign worker and set status to 'pending' (waiting for worker confirmation)
    task.assignedTo = workerId;
    task.status = 'pending'; // Menunggu konfirmasi dari pekerja
    task.searchMethod = 'find_worker'; // Ensure it's marked as direct assignment

    await task.save();

    console.log('Worker assigned successfully:', {
      taskId: task._id,
      assignedTo: task.assignedTo,
      newStatus: task.status
    });

    return NextResponse.json({
      success: true,
      message: 'Pekerja berhasil ditugaskan. Menunggu konfirmasi dari pekerja.',
      data: {
        taskId: task._id,
        assignedTo: task.assignedTo,
        status: task.status
      }
    });

  } catch (error) {
    console.error('Assign worker error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}