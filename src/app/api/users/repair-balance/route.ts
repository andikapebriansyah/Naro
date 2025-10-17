import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Task from '@/lib/models/Task';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Starting balance repair API...');
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('❌ Unauthorized access');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated:', session.user.id);
    
    await dbConnect();
    console.log('✅ Database connected');

    // Get current user balance
    const currentUser = await User.findById(session.user.id);
    const currentBalance = currentUser?.balance || 0;
    console.log('Current user found:', !!currentUser);
    console.log('Current user balance field exists:', currentUser?.balance !== undefined);
    
    // Find all completed tasks for this user
    const completedTasks = await Task.find({
      assignedTo: session.user.id,
      status: 'completed',
      budget: { $exists: true, $gt: 0 }
    });

    console.log(`User ${session.user.id} current balance: ${currentBalance}`);
    console.log(`Found ${completedTasks.length} completed tasks`);

    // Calculate what the balance should be
    const totalEarningsFromCompleted = completedTasks.reduce((sum, task) => sum + (task.budget || 0), 0);
    console.log(`Total earnings from completed tasks: ${totalEarningsFromCompleted}`);

    // Always fix balance to match earnings (even if already correct)
    console.log(`Setting balance from ${currentBalance} to ${totalEarningsFromCompleted}`);
    
    // First, ensure user has balance field (some users might not have it)
    if (currentUser && currentUser.balance === undefined) {
      console.log('User missing balance field, initializing...');
      currentUser.balance = 0;
      await currentUser.save();
    }
    
    // Set balance to correct amount using direct query
    const updateResult = await User.findByIdAndUpdate(
      session.user.id,
      { 
        $set: { balance: totalEarningsFromCompleted },
        $setOnInsert: { balance: 0 }  // Fallback if field doesn't exist
      },
      { 
        new: true, 
        upsert: false,
        runValidators: true 
      }
    );
    
    console.log('✅ User update result exists:', !!updateResult);
    console.log('✅ User balance after update:', updateResult?.balance);
    
    // Double-check by querying again
    const verifyUser = await User.findById(session.user.id).select('balance');
    console.log('✅ Verification query balance:', verifyUser?.balance);

    // Mark all completed tasks as paid if they aren't already
    const taskUpdateResult = await Task.updateMany(
      {
        assignedTo: session.user.id,
        status: 'completed',
        $or: [
          { paymentProcessed: { $exists: false } },
          { paymentProcessed: false }
        ]
      },
      {
        $set: {
          paymentProcessed: true,
          paidAt: new Date()
        }
      }
    );
    
    console.log('✅ Tasks updated:', taskUpdateResult.modifiedCount);

    const balanceDifference = totalEarningsFromCompleted - currentBalance;
    
    return NextResponse.json({
      success: true,
      message: `Balance repaired! Set to ${totalEarningsFromCompleted.toLocaleString('id-ID')}`,
      data: {
        tasksProcessed: completedTasks.length,
        oldBalance: currentBalance,
        newBalance: totalEarningsFromCompleted,
        balanceDifference: balanceDifference,
        tasksMarkedAsPaid: taskUpdateResult.modifiedCount
      }
    });



  } catch (error) {
    console.error('❌ Repair balance error:', error);
    
    let errorMessage = 'Failed to repair balance';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}