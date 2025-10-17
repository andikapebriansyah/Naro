import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Task from '@/lib/models/Task';
import User from '@/lib/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const userId = session.user.id;

    await dbConnect();

    const user = await User.findById(userId).select('balance');
    const currentBalance = user?.balance || 0;

    let stats;

    if (role === 'worker') {
      const workerTasks = await Task.find({
        assignedTo: userId,
      });

      const completed = workerTasks.filter(task => 
        task.status === 'completed' || task.status === 'selesai'
      );
      const active = workerTasks.filter(task => 
        ['accepted', 'active', 'proses'].includes(task.status)
      );
      const pending = workerTasks.filter(task => 
        ['pending', 'completed_worker'].includes(task.status)
      );

      const totalEarnings = completed.reduce((sum, task) => sum + (task.budget || 0), 0);

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const monthlyCompleted = completed.filter(task => {
        if (!task.completedAt && !task.updatedAt) return false;
        const completedDate = new Date(task.completedAt || task.updatedAt);
        return completedDate.getMonth() === currentMonth && completedDate.getFullYear() === currentYear;
      });
      
      const monthlyEarnings = monthlyCompleted.reduce((sum, task) => sum + (task.budget || 0), 0);

      console.log(`Worker stats for ${userId}:`, {
        completed: completed.length,
        active: active.length, 
        pending: pending.length,
        total: workerTasks.length,
      });

      const averageRating = completed.length > 0 ? 4.5 : 0;

      stats = {
        active: active.length,
        completed: completed.length,
        pending: pending.length,
        total: workerTasks.length,
        earning: totalEarnings,
        monthlyEarning: monthlyEarnings,
        balance: currentBalance,
        rating: averageRating
      };

    } else {
      // Employer stats - MATCH RIWAYAT LOGIC
      const employerTasks = await Task.find({
        posterId: userId
      });

      console.log(`Processing employer stats for user ${userId}`);
      console.log(`Total tasks found: ${employerTasks.length}`);

      // MATCH RIWAYAT: in_progress filter
      const active = employerTasks.filter((task: any) => {
        const isInProgress = ['pending', 'accepted', 'active', 'proses', 'completed_worker'].includes(task.status) && task.assignedTo !== null;
        return isInProgress;
      });

      // MATCH RIWAYAT: pending filter (publication open tanpa assigned)
      const pending = employerTasks.filter((task: any) => 
        task.status === 'open' && !task.assignedTo
      );

      const completed = employerTasks.filter((task: any) => 
        task.status === 'selesai' || task.status === 'completed'
      );

      const totalSpent = completed.reduce((sum, task) => sum + (task.budget || 0), 0);

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const monthlyCompleted = completed.filter(task => {
        if (!task.completedAt && !task.updatedAt) return false;
        const completedDate = new Date(task.completedAt || task.updatedAt);
        return completedDate.getMonth() === currentMonth && completedDate.getFullYear() === currentYear;
      });
      
      const monthlySpending = monthlyCompleted.reduce((sum, task) => sum + (task.budget || 0), 0);

      console.log(`Employer stats summary for ${userId}:`);
      console.log(`Completed: ${completed.length}`);
      console.log(`Active: ${active.length}`);
      console.log(`Pending: ${pending.length}`);
      console.log(`Total: ${employerTasks.length}`);

      const averageRating = completed.length > 0 ? 4.3 : 0;

      stats = {
        active: active.length,
        completed: completed.length,
        pending: pending.length,
        total: employerTasks.length,
        earning: totalSpent,
        rating: averageRating,
        balance: currentBalance
      };
    }

    console.log(`Final stats response:`, stats);

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Financial stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get financial stats' },
      { status: 500 }
    );
  }
}