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
    const { reason } = await request.json();

    console.log('=== REJECT OFFER REQUEST ===');
    console.log('Task ID:', taskId);
    console.log('Worker ID (current user):', session.user.id);
    console.log('Rejection reason:', reason);

    await dbConnect();

    // Find the task
    const task = await Task.findById(taskId)
      .populate('posterId', 'name email');
    
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
      assignedTo: task.assignedTo,
      posterId: task.posterId?._id
    });

    // Check if this is a find_worker task
    if (task.searchMethod !== 'find_worker') {
      console.error('Task is not a find_worker type, searchMethod:', task.searchMethod);
      return NextResponse.json(
        { success: false, error: 'Tugas ini bukan penawaran langsung' },
        { status: 400 }
      );
    }

    // Check if task is in 'pending' or 'draft' status
    // Allow rejection from pending (waiting confirmation) or draft (not yet confirmed by either party)
    if (!['pending', 'draft'].includes(task.status)) {
      console.error('Task status is invalid for rejection, current status:', task.status);
      return NextResponse.json(
        { success: false, error: `Pekerjaan tidak dapat ditolak dengan status ${task.status}. Hanya status menunggu yang dapat ditolak.` },
        { status: 400 }
      );
    }

    // Check if assignedTo exists and matches current user
    if (!task.assignedTo || task.assignedTo.toString() !== session.user.id) {
      console.error('User is not the assigned worker, assignedTo:', task.assignedTo);
      return NextResponse.json(
        { success: false, error: 'Tugas ini bukan untuk Anda atau belum ada penugasan' },
        { status: 403 }
      );
    }

    // Store rejection reason (optional: for audit trail)
    const rejectionRecord = {
      rejectedBy: session.user.id,
      rejectedAt: new Date(),
      reason: reason || 'Tidak ada alasan diberikan'
    };

    // Reset task to 'open' status and clear assignedTo
    // This allows the employer to assign another worker
    task.status = 'open';
    task.assignedTo = undefined;
    
    // Optional: Store rejection record in task (if you have a field for this)
    // Uncomment if you add 'rejectionHistory' field to Task schema
    // if (!task.rejectionHistory) {
    //   task.rejectionHistory = [];
    // }
    // task.rejectionHistory.push(rejectionRecord);

    await task.save();

    console.log('Offer rejected successfully:', {
      taskId: task._id,
      newStatus: task.status,
      assignedTo: task.assignedTo,
      rejectionReason: reason
    });

    return NextResponse.json({
      success: true,
      message: 'Penawaran pekerjaan berhasil ditolak. Pemberi kerja dapat memilih pekerja lain.',
      data: {
        taskId: task._id,
        status: task.status,
        assignedTo: task.assignedTo,
        rejectionReason: reason,
        rejectedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Reject offer error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server saat menolak penawaran' },
      { status: 500 }
    );
  }
}