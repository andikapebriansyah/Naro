import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Task from '@/lib/models/Task';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'draft', 'open', 'in_progress', 'completed', etc.
    const limit = parseInt(searchParams.get('limit') || '50');

    await dbConnect();

    // Build query to find user's own tasks
    const query: any = {
      posterId: session.user.id, // Only user's own tasks
    };

    console.log('My tasks query:', { userId: session.user.id, query });

    console.log('User ID:', session.user.id);
    console.log('Status filter:', status);

    // Add status filter if specified
    if (status) {
      if (status === 'active') {
        // Active includes tasks that are pending, accepted and in progress (have assignedTo)
        query.status = { $in: ['pending', 'accepted', 'active', 'proses'] };
        query.assignedTo = { $ne: null }; // Must have assigned worker
      } else if (status === 'ongoing') {
        // Ongoing includes all active tasks: open (waiting for applicants), pending (waiting for worker confirmation), and in-progress
        query.status = { $in: ['open', 'pending', 'accepted', 'active', 'proses'] };
      } else {
        query.status = status;
      }
    }

    console.log('Query:', query);

    // Find tasks with assignee information if any - FIXED: Added 'phone' field
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name image isVerified rating phone')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    console.log('Found tasks:', tasks.length, 'tasks for user:', session.user.id);

    console.log('Found tasks:', tasks.length);
    console.log('Tasks:', tasks.map(t => ({ id: t._id, title: t.title, status: t.status, assignedTo: t.assignedTo })));

    // Format the response - FIXED: Added all date/time fields
    const formattedTasks = tasks.map((task) => ({
      _id: task._id,
      title: task.title,
      description: task.description,
      category: task.category,
      location: task.location,
      scheduledDate: task.scheduledDate,
      scheduledTime: task.scheduledTime,
      startDate: task.startDate,
      startTime: task.startTime,
      endDate: task.endDate,
      endTime: task.endTime,
      estimatedDuration: task.estimatedDuration,
      budget: task.budget,
      pricingType: task.pricingType,
      status: task.status,
      searchMethod: task.searchMethod,
      photos: task.photos || [],
      assignedTo: task.assignedTo,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      applicants: task.applicants?.length || 0,
    }));

    return NextResponse.json({
      success: true,
      data: formattedTasks,
      count: formattedTasks.length,
    });

  } catch (error) {
    console.error('My tasks error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat mengambil data tugas' },
      { status: 500 }
    );
  }
}