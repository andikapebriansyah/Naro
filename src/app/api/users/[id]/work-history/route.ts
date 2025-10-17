import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Task from '@/lib/models/Task';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const userId = params.id;

    // Get completed tasks where the user was the assigned worker
    const completedTasks = await Task.find({
      assignedTo: userId,
      status: 'completed',
      completedAt: { $exists: true }
    })
    .populate('posterId', 'name')
    .select('title description budget completedAt posterId')
    .sort({ completedAt: -1 })
    .limit(10);

    // Format the work history
    const workHistory = completedTasks.map((task, index) => {
      const completedDate = new Date(task.completedAt || new Date());
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - completedDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let timeAgo;
      if (diffDays === 1) {
        timeAgo = '1 hari yang lalu';
      } else if (diffDays < 7) {
        timeAgo = `${diffDays} hari yang lalu`;
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        timeAgo = weeks === 1 ? '1 minggu yang lalu' : `${weeks} minggu yang lalu`;
      } else {
        const months = Math.floor(diffDays / 30);
        timeAgo = months === 1 ? '1 bulan yang lalu' : `${months} bulan yang lalu`;
      }

      return {
        id: task._id,
        date: timeAgo,
        title: task.title,
        employer: (task.posterId as any)?.name || 'Pemberi Kerja',
        description: task.description,
        payment: task.budget,
      };
    });

    return NextResponse.json({
      success: true,
      data: workHistory,
    });
  } catch (error) {
    console.error('Error fetching work history:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}