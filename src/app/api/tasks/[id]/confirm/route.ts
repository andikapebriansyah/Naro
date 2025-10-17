import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Task from '@/lib/models/Task';
import User from '@/lib/models/User';
import { createNotification } from '@/lib/notifications';

export async function POST(
  req: NextRequest,
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

    const taskId = params.id;
    const body = await req.json();
    const { workerId, payment } = body;

    // Find task
    const task = await Task.findById(taskId);

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Tugas tidak ditemukan' },
        { status: 404 }
      );
    }

    // Verify poster
    if (task.posterId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak memiliki akses ke tugas ini' },
        { status: 403 }
      );
    }

    // Check if task already confirmed
    if (task.status !== 'draft') {
      return NextResponse.json(
        { success: false, error: 'Tugas sudah dikonfirmasi sebelumnya' },
        { status: 400 }
      );
    }

    // Validate payment data
    if (!payment || !payment.amount || !payment.totalAmount) {
      return NextResponse.json(
        { success: false, error: 'Data pembayaran tidak lengkap' },
        { status: 400 }
      );
    }

    // If direct search, verify worker exists and assign
    if (task.searchMethod === 'find_worker' && workerId) {
      const worker = await User.findById(workerId);
      
      if (!worker) {
        return NextResponse.json(
          { success: false, error: 'Pekerja tidak ditemukan' },
          { status: 404 }
        );
      }

      if (worker.role !== 'tasker') {
        return NextResponse.json(
          { success: false, error: 'User bukan pekerja' },
          { status: 400 }
        );
      }

      // Assign worker to task
      task.assignedTo = workerId;
      task.status = 'pending'; // Pending worker acceptance
    } else {
      // Publish method - task will be open for applications
      task.status = 'open';
    }

    // Set payment information
    task.payment = {
      amount: payment.amount,
      serviceFee: payment.serviceFee,
      adminFee: payment.adminFee || 2500,
      totalAmount: payment.totalAmount,
      status: 'pending',
    };

    await task.save();

    // ✅ Send notification to worker if find_worker search
    if (task.searchMethod === 'find_worker' && workerId) {
      await createNotification({
        userId: workerId,
        title: 'Tawaran Pekerjaan Baru! 📋',
        message: `Anda mendapat tawaran pekerjaan "${task.title}" dari sistem rekomendasi AI. Lihat detail dan terima pekerjaan.`,
        type: 'task_assigned',
        relatedId: task._id.toString(),
        relatedModel: 'Task',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Tugas berhasil dikonfirmasi',
      data: task,
    });
  } catch (error) {
    console.error('Error confirming task:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}