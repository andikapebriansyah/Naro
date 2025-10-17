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
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const location = searchParams.get('location');
    const searchMethod = searchParams.get('searchMethod');
    const limit = parseInt(searchParams.get('limit') || '50');

    await dbConnect();

    // Build query to find available tasks (excluding user's own tasks)
    const query: any = {
      posterId: { $ne: session.user.id }, // Exclude user's own tasks
    };

    // Status filter based on searchMethod
    if (searchMethod === 'publication') {
      // Publikasi jobs: status harus 'open'
      query.status = 'open';
    } else if (searchMethod === 'find_worker') {
      // Permintaan jobs: status bisa 'open', 'buka', atau 'draft' (show all find_worker requests)
      query.status = { $in: ['open', 'buka', 'draft'] };
    } else {
      // Default: hanya yang open
      query.status = 'open';
    }

    // Add filters
    if (category) {
      query.category = category;
    }

    if (searchMethod) {
      query.searchMethod = searchMethod;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Find tasks with poster information
    const tasks = await Task.find(query)
      .populate('posterId', 'name image isVerified rating')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Format the response
    const formattedTasks = tasks.map((task) => ({
      _id: task._id,
      title: task.title,
      description: task.description,
      category: task.category,
      location: task.location,
      // ✅ FIXED: Add complete schedule information
      scheduledDate: task.scheduledDate,
      scheduledTime: task.scheduledTime,
      startDate: task.startDate,
      startTime: task.startTime,
      endDate: task.endDate,
      endTime: task.endTime,
      estimatedDuration: task.estimatedDuration,
      budget: task.budget,
      pricingType: task.pricingType,
      searchMethod: task.searchMethod,
      status: task.status,
      photos: task.photos || [],
      postedBy: task.posterId, // ✅ Changed from 'poster' to 'postedBy' for consistency
      assignedTo: task.assignedTo,
      createdAt: task.createdAt,
      applicants: task.applicants?.length || 0,
    }));

    return NextResponse.json({
      success: true,
      data: formattedTasks,
      count: formattedTasks.length,
    });

  } catch (error) {
    console.error('Available jobs error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat mengambil data pekerjaan' },
      { status: 500 }
    );
  }
}