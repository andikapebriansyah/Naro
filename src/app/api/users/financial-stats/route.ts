import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Task from '@/lib/models/Task';
import User from '@/lib/models/User';
import Review from '@/lib/models/Review';

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

    const user = await User.findById(userId).select('balance totalEarnings');
    const currentBalance = user?.balance || 0;
    const totalEarnings = user?.totalEarnings || 0;

    let stats;

    if (role === 'worker') {
      const workerTasks = await Task.find({
        assignedTo: userId,
      });

      // ✅ FIX: Use same completed status logic as dashboard
      const completed = workerTasks.filter(task => 
        ['completed', 'selesai'].includes(task.status)
      );
      const active = workerTasks.filter(task => 
        ['accepted', 'active', 'proses'].includes(task.status)
      );
      const pending = workerTasks.filter(task => 
        ['pending', 'completed_worker'].includes(task.status)
      );

      // Calculate total earnings from completed tasks
      const calculatedEarnings = completed.reduce((sum, task) => sum + (task.budget || 0), 0);

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const monthlyCompleted = completed.filter(task => {
        if (!task.completedAt && !task.updatedAt) return false;
        const completedDate = new Date(task.completedAt || task.updatedAt);
        return completedDate.getMonth() === currentMonth && completedDate.getFullYear() === currentYear;
      });
      
      const monthlyEarnings = monthlyCompleted.reduce((sum, task) => sum + (task.budget || 0), 0);

      // Update totalEarnings in database if it's different
      if (calculatedEarnings !== totalEarnings) {
        await User.findByIdAndUpdate(userId, { totalEarnings: calculatedEarnings });
      }

      // ✅ Calculate real rating based on reviews received as worker
      const reviews = await Review.find({ toUserId: userId });
      const averageRating = reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;

      stats = {
        active: active.length,
        completed: completed.length,
        pending: pending.length,
        total: workerTasks.length,
        earning: calculatedEarnings,
        monthlyEarning: monthlyEarnings,
        balance: currentBalance,
        totalEarnings: calculatedEarnings, // Total earnings (tidak berkurang)
        rating: averageRating
      };

    } else {
      // Employer stats
      const employerTasks = await Task.find({
        posterId: userId
      });

      const active = employerTasks.filter((task: any) => {
        const isInProgress = ['pending', 'accepted', 'active', 'proses', 'completed_worker'].includes(task.status) && task.assignedTo !== null;
        return isInProgress;
      });

      const pending = employerTasks.filter((task: any) => 
        task.status === 'open' && !task.assignedTo
      );

      // ✅ FIX: Use same completed status logic as dashboard
      const completed = employerTasks.filter((task: any) => 
        ['completed', 'selesai'].includes(task.status)
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

      // ✅ Calculate real rating based on reviews received as employer
      const reviews = await Review.find({ toUserId: userId });
      const averageRating = reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;

      stats = {
        active: active.length,
        completed: completed.length,
        pending: pending.length,
        total: employerTasks.length,
        earning: totalSpent,
        rating: averageRating,
        balance: currentBalance,
        totalEarnings: totalEarnings // For employer, this might be 0
      };
    }

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