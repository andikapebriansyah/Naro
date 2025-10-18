import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Task from '@/lib/models/Task';
import mongoose from 'mongoose';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { agreedToTerms, agreedAt } = await request.json();
    const taskId = params.id;

    await dbConnect();

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      return NextResponse.json({ success: false, error: 'Pekerjaan tidak ditemukan' }, { status: 404 });
    }

    console.log('Accept offer - Task details:', {
      taskId: task._id,
      searchMethod: task.searchMethod,
      status: task.status,
      assignedTo: task.assignedTo,
      currentUserId: session.user.id
    });

    // Check if task is still available for offers
    if (!['open', 'pending'].includes(task.status)) {
      return NextResponse.json({ success: false, error: 'Pekerjaan tidak lagi tersedia' }, { status: 400 });
    }

    // Check if this is a find_worker task (offered directly) 
    if (task.searchMethod !== 'find_worker') {
      return NextResponse.json({ success: false, error: 'Pekerjaan ini tidak melalui sistem penawaran langsung' }, { status: 400 });
    }

    // Handle three scenarios:
    // 1. Job is 'open' and no assignedTo yet (direct application)
    // 2. Job is 'open' and user is already assigned (user was assigned via cari-pekerja)
    // 3. Job is 'pending' and user is already assigned (formal offer acceptance)
    
    console.log('Checking scenarios:', {
      scenario1: task.status === 'open' && !task.assignedTo,
      scenario2: task.status === 'open' && task.assignedTo,
      scenario3: task.status === 'pending' && task.assignedTo,
      status: task.status,
      hasAssignedTo: !!task.assignedTo,
      assignedToString: task.assignedTo?.toString(),
      currentUser: session.user.id,
      isAssignedToCurrentUser: task.assignedTo?.toString() === session.user.id
    });
    
    if (task.status === 'open' && !task.assignedTo) {
      // Scenario 1: Direct application to find_worker job
      console.log('Applying scenario 1: Direct application');
      task.assignedTo = new mongoose.Types.ObjectId(session.user.id);
      task.status = 'accepted'; // User accepted, waiting for start date
    } else if (task.status === 'open' && task.assignedTo) {
      // Scenario 2: User was assigned via cari-pekerja, now accepting
      console.log('Applying scenario 2: Accept assigned job (status still open)');
      if (task.assignedTo.toString() !== session.user.id) {
        return NextResponse.json({ success: false, error: 'Anda tidak ditugaskan untuk pekerjaan ini' }, { status: 400 });
      }
      task.status = 'accepted'; // Accept the assigned job
    } else if (task.status === 'pending' && task.assignedTo) {
      // Scenario 3: Accept formal offer (status was properly updated to 'pending')
      console.log('Applying scenario 3: Accept formal offer');
      if (task.assignedTo.toString() !== session.user.id) {
        return NextResponse.json({ success: false, error: 'Anda tidak ditugaskan untuk pekerjaan ini' }, { status: 400 });
      }
      task.status = 'accepted'; // Accept the offer
    } else {
      console.log('No valid scenario matched - returning error');
      console.log('Current state:', { status: task.status, assignedTo: !!task.assignedTo });
      return NextResponse.json({ success: false, error: 'Status pekerjaan tidak valid untuk diterima' }, { status: 400 });
    }

    // Accept the offer - worker confirms acceptance
    task.updatedAt = new Date();
    
    // Store agreement details
    task.workerAgreement = {
      agreedToTerms: agreedToTerms || false,
      agreedAt: agreedAt ? new Date(agreedAt) : new Date()
    };

    await task.save();

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Pekerjaan berhasil diterima',
      data: {
        taskId: task._id,
        status: task.status,
        assignedTo: task.assignedTo
      }
    });

  } catch (error) {
    console.error('Accept offer error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat menerima pekerjaan' },
      { status: 500 }
    );
  }
}