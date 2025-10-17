import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Task from '@/lib/models/Task';
import Report from '@/lib/models/Report';

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

    const query: any = {
      posterId: session.user.id,
    };

    if (status === 'ongoing') {
      query.$or = [
        {
          status: { $in: ['open', 'pending'] },
          assignedTo: { $ne: null }
        },
        {
          status: { $in: ['accepted', 'active', 'proses', 'completed_worker'] }
        }
      ];
    } else if (status === 'open') {
      query.status = 'open';
      query.assignedTo = null;
    } else if (status === 'completed') {
      query.status = { $in: ['completed', 'selesai'] };
    } else if (status === 'cancelled') {
      query.status = { $in: ['cancelled', 'dibatalkan'] };
    } else if (status) {
      query.status = status;
    }

    console.log('My tasks query:', JSON.stringify({ 
      userId: session.user.id, 
      statusFilter: status, 
      query 
    }, null, 2));

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name image isVerified rating')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    console.log('Found tasks:', tasks.length, 'tasks for user:', session.user.id);

    // ✅ NEW: Fetch all reports related to these tasks
    const taskIds = tasks.map(t => t._id);
    const reports = await Report.find({
      taskId: { $in: taskIds },
      status: { $in: ['resolved', 'rejected'] }
    })
      .select('taskId status resolution adminNotes action reporterType resolvedAt')
      .lean();

    // ✅ NEW: Create a map for easy lookup
    const reportMap = new Map();
    reports.forEach((report: any) => {
      reportMap.set(report.taskId.toString(), report);
    });

    console.log('Task details:', tasks.map(t => ({ 
      id: t._id, 
      title: t.title, 
      status: t.status, 
      hasAssignedTo: !!t.assignedTo,
      assignedToId: t.assignedTo?._id,
      applicantsCount: t.applicants?.length || 0
    })));

    const formattedTasks = tasks.map((task) => {
      // ✅ NEW: Get report data if exists
      const report = reportMap.get(task._id.toString());

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
        assignedTo: task.assignedTo,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        applicants: task.applicants?.length || 0,
        // ✅ NEW: Add report data if task is disputed
        report: report ? {
          status: report.status,
          resolution: report.resolution,
          adminNotes: report.adminNotes,
          reporterType: report.reporterType,
          resolvedAt: report.resolvedAt,
        } : null,
      };
    });

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