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
      query.searchMethod = 'publication'; // Explicit filter
    } else if (searchMethod === 'find_worker') {
      // Permintaan jobs: status bisa 'open', 'buka', atau 'draft' (show all find_worker requests)
      query.status = { $in: ['open', 'buka', 'draft'] };
      query.searchMethod = 'find_worker'; // Explicit filter
    } else {
      // Default: hanya yang open
      query.status = 'open';
    }

    // Add filters
    if (category) {
      query.category = category;
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

    console.log('=== JOBS API QUERY ===');
    console.log('Query:', JSON.stringify(query, null, 2));
    console.log('Limit:', limit);

    // Find tasks with poster information
    const tasks = await Task.find(query)
      .populate('posterId', 'name image isVerified rating')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    console.log('=== TASKS FOUND ===');
    console.log('Count:', tasks.length);
    if (tasks.length > 0) {
      console.log('Sample task posterId:', tasks[0].posterId);
    }

    // Format the response - FIXED: Consistent field naming
    const formattedTasks = tasks.map((task) => ({
      _id: task._id,
      title: task.title,
      description: task.description,
      category: task.category,
      location: task.location,
      scheduledDate: task.scheduledDate,
      scheduledTime: task.scheduledTime,
      estimatedDuration: task.estimatedDuration,
      budget: task.budget,
      pricingType: task.pricingType,
      searchMethod: task.searchMethod,
      status: task.status,
      photos: task.photos || [],
      // FIX: Provide both field names for consistency
      poster: task.posterId,      // For /pekerjaan/[id] page
      postedBy: task.posterId,    // For dashboard compatibility
      posterId: task.posterId,    // Keep original field
      assignedTo: task.assignedTo,
      createdAt: task.createdAt,
      applicants: task.applicants?.length || 0,
    }));

    console.log('=== FORMATTED TASKS ===');
    if (formattedTasks.length > 0) {
      console.log('Sample formatted task poster:', formattedTasks[0].poster);
      console.log('Sample formatted task postedBy:', formattedTasks[0].postedBy);
    }

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