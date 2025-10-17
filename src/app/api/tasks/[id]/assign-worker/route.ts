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

    // Check if user is the poster
    if (task.posterId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak memiliki akses untuk melakukan ini' },
        { status: 403 }
      );
    }

    // Check if task is find_worker type
    if (task.searchMethod !== 'find_worker') {
      return NextResponse.json(
        { success: false, error: 'Action ini hanya untuk tugas pencarian pekerja' },
        { status: 400 }
      );
    }

    // Check if task is still in valid status (draft or open)
    if (!['draft', 'open'].includes(task.status)) {
      return NextResponse.json(
        { success: false, error: 'Tugas sudah memiliki pekerja yang ditugaskan' },
        { status: 400 }
      );
    }

    // Assign worker and set status to pending (waiting for worker confirmation)
    task.assignedTo = workerId;
    task.status = 'pending'; // ✅ FIX: Gunakan 'pending' bukan 'menunggu'
    task.searchMethod = 'find_worker'; // Ensure it's marked as direct assignment

    await task.save();

    console.log(`✅ Task ${taskId} assigned to worker ${workerId}, status changed to 'pending'`);

    return NextResponse.json({
      success: true,
      message: 'Pekerja berhasil ditugaskan. Menunggu konfirmasi dari pekerja.',
      data: {
        taskId: task._id,
        status: task.status,
        assignedTo: task.assignedTo
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