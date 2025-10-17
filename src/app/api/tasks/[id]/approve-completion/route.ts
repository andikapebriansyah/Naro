import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Task from '@/lib/models/Task';
import User from '@/lib/models/User';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { approve } = await request.json();
    const taskId = params.id;

    await dbConnect();

    // Get the task
    const task = await Task.findById(taskId).populate('posterId assignedTo');
    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    const userId = session.user.id;
    const isOwner = task.posterId._id.toString() === userId;

    // Only task owner can approve completion
    if (!isOwner) {
      return NextResponse.json({ success: false, error: 'Only task owner can approve completion' }, { status: 403 });
    }

    // Task must be in completed_worker state
    if (task.status !== 'completed_worker') {
      return NextResponse.json({ success: false, error: 'Task is not waiting for approval' }, { status: 400 });
    }

    let updateData: any = {
      employerApprovedAt: new Date(),
      approvedBy: userId
    };

    if (approve) {
      // Approve completion
      updateData.status = 'completed';
      
      // Process payment to worker
      if (task.assignedTo && task.budget) {
        await User.findByIdAndUpdate(
          task.assignedTo._id,
          { $inc: { balance: task.budget } }
        );
        
        await User.findByIdAndUpdate(
          task.posterId._id,
          { $inc: { balance: -task.budget } }
        );

        updateData.paymentProcessed = true;
        updateData.paymentAmount = task.budget;
        updateData.paidAt = new Date();
      }
    } else {
      // Reject completion - back to active
      updateData.status = 'active';
      updateData.rejectedAt = new Date();
    }

    // Update the task
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      updateData,
      { new: true }
    ).populate('posterId assignedTo');

    return NextResponse.json({
      success: true,
      data: updatedTask,
      message: approve 
        ? 'Task completion approved! Payment processed.' 
        : 'Task completion rejected. Task is back to active status.'
    });

  } catch (error) {
    console.error('Approve completion error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process approval' },
      { status: 500 }
    );
  }
}