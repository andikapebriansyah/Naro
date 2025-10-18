import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Task from '@/lib/models/Task';
import User from '@/lib/models/User';
import { createNotification } from '@/lib/notifications';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const taskId = params.id;

    await dbConnect();

    const task = await Task.findById(taskId);

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Tugas tidak ditemukan' },
        { status: 404 }
      );
    }

    // Verify user is the task poster
    if (task.posterId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Hanya pemberi tugas yang dapat menyetujui penyelesaian' },
        { status: 403 }
      );
    }

    // Verify task is in completed_worker status
    if (task.status !== 'completed_worker') {
      return NextResponse.json(
        { success: false, error: 'Tugas belum ditandai selesai oleh pekerja' },
        { status: 400 }
      );
    }

    // Update task status to completed
    task.status = 'completed';
    task.completedAt = new Date();
    await task.save();

    // **FIX: Update worker's balance and totalEarnings**
    if (task.assignedTo) {
      await User.findByIdAndUpdate(
        task.assignedTo,
        {
          $inc: { 
            balance: task.budget,        // Tambah balance
            totalEarnings: task.budget,  // Tambah total earnings
            completedTasks: 1            // Increment completed tasks
          }
        }
      );

      // Send notification to worker
      await createNotification({
        userId: task.assignedTo.toString(),
        title: 'Pembayaran Diterima',
        message: `Selamat! Anda menerima Rp ${task.budget.toLocaleString('id-ID')} untuk tugas "${task.title}"`,
        type: 'payment_received',
        relatedId: taskId,
      });
    }

    // Send notification to poster
    await createNotification({
      userId: session.user.id,
      title: 'Tugas Selesai',
      message: `Tugas "${task.title}" telah diselesaikan`,
      type: 'task_completed',
      relatedId: taskId,
    });

    return NextResponse.json({
      success: true,
      message: 'Tugas berhasil diselesaikan dan pembayaran telah dikirim',
      data: task,
    });
  } catch (error) {
    console.error('Approve completion error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat menyetujui penyelesaian tugas' },
      { status: 500 }
    );
  }
}