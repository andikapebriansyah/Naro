import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import Task from '@/lib/models/Task';
import Review from '@/lib/models/Review';
import Report from '@/lib/models/Report';
import Notification from '@/lib/models/Notification';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const userId = params.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent deleting admin users (safety measure)
    if (user.role === 'admin') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete admin users' },
        { status: 403 }
      );
    }

    // Check for active tasks
    const activeTasks = await Task.countDocuments({
      $or: [
        { creator: userId, status: { $in: ['pending', 'in_progress'] } },
        { assignedWorker: userId, status: { $in: ['pending', 'in_progress'] } }
      ]
    });

    if (activeTasks > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete user with ${activeTasks} active tasks. Please complete or cancel them first.` 
        },
        { status: 400 }
      );
    }

    // Start deletion process
    console.log(`Starting deletion process for user ${userId} (${user.name})`);

    // 1. Update tasks where user is referenced (set to null or handle appropriately)
    await Task.updateMany(
      { creator: userId },
      { $unset: { creator: 1 } }
    );

    await Task.updateMany(
      { assignedWorker: userId },
      { $unset: { assignedWorker: 1 } }
    );

    // 2. Delete user's reviews (both given and received)
    await Review.deleteMany({
      $or: [
        { reviewer: userId },
        { reviewee: userId }
      ]
    });

    // 3. Delete reports involving this user
    await Report.deleteMany({
      $or: [
        { reporter: userId },
        { reportedUser: userId }
      ]
    });

    // 4. Delete notifications for this user
    await Notification.deleteMany({
      $or: [
        { userId: userId },
        { fromUser: userId }
      ]
    });

    // 5. Finally, delete the user
    await User.findByIdAndDelete(userId);

    console.log(`Successfully deleted user ${userId} and all related data`);

    return NextResponse.json({
      success: true,
      message: `User ${user.name} and all related data have been deleted successfully`
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}