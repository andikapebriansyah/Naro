import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Task from '@/lib/models/Task';
import User from '@/lib/models/User';
import type { Types } from 'mongoose';
import { createNotification } from '@/lib/notifications';

interface PopulatedUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
}

export async function POST(
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

    const body = await request.json();
    const { userType } = body;

    const task = await Task.findById(params.id)
      .populate('assignedTo', 'name email phone')
      .populate('posterId', 'name email phone')
      .lean(); // ✅ Add .lean() untuk dapat plain object

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Tugas tidak ditemukan' },
        { status: 404 }
      );
    }

    // ✅ Type cast dengan explicit check
    const assignedTo = task.assignedTo as PopulatedUser | Types.ObjectId | undefined;
    const posterId = task.posterId as PopulatedUser | Types.ObjectId;

    // Helper to get string ID
    const getIdString = (field: PopulatedUser | Types.ObjectId | undefined): string | null => {
      if (!field) return null;
      // Check if it's a populated object with _id
      if (typeof field === 'object' && '_id' in field) {
        return field._id.toString();
      }
      // It's just an ObjectId
      return (field as Types.ObjectId).toString();
    };

    const assignedToId = getIdString(assignedTo);
    const posterIdStr = getIdString(posterId);

    // Verify authorization
    const isWorker = assignedToId === session.user.id;
    const isEmployer = posterIdStr === session.user.id;

    if (!isWorker && !isEmployer) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak memiliki akses untuk menyelesaikan tugas ini' },
        { status: 403 }
      );
    }

    // Check if task is in valid status
    if (!['accepted', 'active', 'proses', 'completed_worker'].includes(task.status)) {
      return NextResponse.json(
        { success: false, error: 'Status tugas tidak valid untuk diselesaikan' },
        { status: 400 }
      );
    }

    const currentTime = new Date();

    // Update task - need to get mongoose document again (not lean)
    const taskDoc = await Task.findById(params.id);
    if (!taskDoc) {
      return NextResponse.json(
        { success: false, error: 'Tugas tidak ditemukan' },
        { status: 404 }
      );
    }

    // WORKER completing the task
    if (userType === 'worker' && isWorker) {
      taskDoc.workerCompletedAt = currentTime;
      taskDoc.status = 'completed_worker';
      await taskDoc.save();

      // ✅ Notify employer that worker completed the task
      if (posterIdStr) {
        await createNotification({
          userId: posterIdStr,
          title: 'Pekerja Menyelesaikan Tugas ⏰',
          message: `Pekerja telah menandai "${taskDoc.title}" sebagai selesai. Silakan periksa dan berikan konfirmasi.`,
          type: 'task_completion_request',
          relatedId: taskDoc._id.toString(),
          relatedModel: 'Task',
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Pekerjaan berhasil ditandai selesai. Menunggu konfirmasi dari pemberi kerja.',
        data: taskDoc,
      });
    }

    // EMPLOYER confirming completion
    if (userType === 'employer' && isEmployer) {
      if (!taskDoc.workerCompletedAt) {
        taskDoc.workerCompletedAt = currentTime;
      }
      
      taskDoc.employerCompletedAt = currentTime;
      taskDoc.employerApprovedAt = currentTime;
      taskDoc.completedAt = currentTime;
      taskDoc.completedBy = session.user.id as any;
      taskDoc.status = 'completed';
      
      if (taskDoc.payment) {
        taskDoc.payment.status = 'released';
        taskDoc.payment.releasedAt = currentTime;
      }
      
      await taskDoc.save();

      // ✅ FIX: Update worker's balance and totalEarnings when employer confirms completion
      if (assignedToId && taskDoc.budget) {
        await User.findByIdAndUpdate(
          assignedToId,
          {
            $inc: { 
              balance: taskDoc.budget,        // Tambah balance
              totalEarnings: taskDoc.budget,  // Tambah total earnings
              completedTasks: 1               // Increment completed tasks
            }
          }
        );
        console.log(`✅ Updated worker ${assignedToId} balance and totalEarnings with ${taskDoc.budget}`);
      }

      // ✅ Notify worker that task is completed and payment released
      console.log('🔔 Creating notifications for worker:', assignedToId);
      if (assignedToId) {
        try {
          await createNotification({
            userId: assignedToId,
            title: 'Pekerjaan Dikonfirmasi Selesai! ✅',
            message: `Pemberi kerja telah mengonfirmasi penyelesaian "${taskDoc.title}". Pembayaran sebesar Rp ${taskDoc.budget?.toLocaleString('id-ID')} telah dilepaskan.`,
            type: 'task_completed',
            relatedId: taskDoc._id.toString(),
            relatedModel: 'Task',
          });
          console.log('✅ Notification 1 created successfully');

          await createNotification({
            userId: assignedToId,
            title: 'Pembayaran Diterima 💰',
            message: `Anda menerima pembayaran sebesar Rp ${taskDoc.budget?.toLocaleString('id-ID')} untuk pekerjaan "${taskDoc.title}".`,
            type: 'payment_received',
            relatedId: taskDoc._id.toString(),
            relatedModel: 'Task',
          });
          console.log('✅ Notification 2 created successfully');
        } catch (notifError) {
          console.error('❌ Error creating notification:', notifError);
        }
      } else {
        console.log('❌ No assignedToId found for notifications');
      }

      return NextResponse.json({
        success: true,
        message: 'Pekerjaan berhasil diselesaikan! Pembayaran akan diproses.',
        data: taskDoc,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Complete task error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat menyelesaikan tugas' },
      { status: 500 }
    );
  }
}