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
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    await dbConnect();

    // Simplified query: Find tasks where user is either assigned worker OR applicant
    let query: any = {
      $or: [
        { assignedTo: session.user.id }, // User is assigned as worker
        { 'applicants.userId': session.user.id } // User has applied
      ]
    };

    console.log('Worker jobs query (step 1):', { userId: session.user.id, query });

    // Find tasks where user is the assigned worker
    const tasks = await Task.find(query)
      .populate('posterId', 'name image isVerified rating phone')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    console.log('Found worker jobs:', tasks.length, 'tasks for worker:', session.user.id);

    // Format the response with detailed logging
    const formattedTasks = tasks.map((task) => {
      // Check if user is assigned worker or applicant
      const isAssignedWorker = task.assignedTo?.toString() === session.user.id;
      const userApplication = task.applicants?.find((app: any) => app.userId.toString() === session.user.id);
      
      console.log('Processing task:', {
        taskId: task._id,
        title: task.title,
        status: task.status,
        isAssignedWorker,
        hasApplication: !!userApplication,
        applicationStatus: userApplication?.status
      });
      
      return {
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
        poster: task.posterId, // The person who created the task
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        // Worker-specific fields
        isAssignedWorker,
        applicationStatus: userApplication?.status || null,
        appliedAt: userApplication?.appliedAt || null,
      };
    });

    // Filter based on status if requested
    let filteredTasks = formattedTasks;
    if (status) {
      if (status === 'active') {
        // Active includes pending, accepted, and active for applicants/workers
        filteredTasks = formattedTasks.filter(task => 
          ['pending', 'accepted', 'active'].includes(task.status)
        );
      } else {
        filteredTasks = formattedTasks.filter(task => task.status === status);
      }
      console.log(`Filtered for status '${status}':`, filteredTasks.length, 'tasks');
    }

    console.log('Final worker jobs result:', filteredTasks.length, 'tasks');

    return NextResponse.json({
      success: true,
      data: filteredTasks,
      count: filteredTasks.length,
    });

  } catch (error) {
    console.error('Worker jobs error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat mengambil data pekerjaan worker' },
      { status: 500 }
    );
  }
}