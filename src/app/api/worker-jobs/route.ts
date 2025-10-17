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
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    await dbConnect();

    // Find tasks where user is involved:
    // 1. For 'find_worker': ONLY if user is the assigned worker (targeted assignment)
    // 2. For 'publication': if user is assigned OR has applied (open application)
    let query: any = {
      $or: [
        // ✅ FIXED: find_worker method - HANYA untuk pekerja yang dituju
        {
          assignedTo: session.user.id,
          searchMethod: 'find_worker'
        },
        // ✅ publication method - untuk pekerja yang di-assign ATAU sudah apply
        {
          assignedTo: session.user.id,
          searchMethod: 'publication'
        },
        {
          'applicants.userId': session.user.id,
          searchMethod: 'publication'
        }
      ]
    };

    console.log('Worker jobs query:', {
      userId: session.user.id,
      filter: 'assigned or applicant',
      statusParam,
      queryDetails: JSON.stringify(query, null, 2)
    });

    const tasks = await Task.find(query)
      .populate('posterId', 'name phone image isVerified rating')
      .populate('assignedTo', 'name phone image rating')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    console.log('Found worker jobs:', {
      total: tasks.length,
      userId: session.user.id,
      taskDetails: tasks.map(t => ({
        id: t._id.toString(),
        title: t.title,
        searchMethod: t.searchMethod,
        assignedTo: t.assignedTo?._id?.toString(),
        isAssignedToCurrentUser: t.assignedTo?._id?.toString() === session.user.id,
        applicants: t.applicants?.map((a: any) => ({
          userId: a.userId.toString(),
          isCurrentUser: a.userId.toString() === session.user.id
        }))
      }))
    });

    // Fetch reports untuk tasks yang disputed
    const taskIds = tasks.map(t => t._id);
    const reports = await Report.find({
      taskId: { $in: taskIds },
      status: { $in: ['resolved', 'rejected'] }
    })
      .select('taskId status resolution adminNotes action reporterType resolvedAt')
      .lean();

    const reportMap = new Map();
    reports.forEach((report: any) => {
      reportMap.set(report.taskId.toString(), report);
    });

    // ✅ ADDITIONAL SAFETY CHECK: Filter out find_worker tasks that are not assigned to current user
    const validTasks = tasks.filter((task) => {
      const isAssignedWorker = task.assignedTo?._id?.toString() === session.user.id;
      const hasApplication = task.applicants?.some(
        (app: any) => app.userId.toString() === session.user.id
      );

      // For find_worker method: MUST be assigned to current user
      if (task.searchMethod === 'find_worker') {
        if (!isAssignedWorker) {
          console.log(`🚫 FILTERED OUT find_worker task ${task._id} - not assigned to current user`, {
            taskId: task._id.toString(),
            assignedTo: task.assignedTo?._id?.toString(),
            currentUser: session.user.id
          });
          return false; // Filter out this task
        }
      }

      // For publication method: user must be assigned OR have application
      if (task.searchMethod === 'publication') {
        if (!isAssignedWorker && !hasApplication) {
          console.log(`🚫 FILTERED OUT publication task ${task._id} - no relationship to current user`);
          return false; // Filter out this task
        }
      }

      return true; // Include this task
    });

    // Format response dengan logic yang jelas
    const formattedTasks = validTasks.map((task) => {
      // ✅ FIX: assignedTo adalah object (hasil populate), gunakan _id
      const isAssignedWorker = task.assignedTo?._id?.toString() === session.user.id;
      const userApplication = task.applicants?.find(
        (app: any) => app.userId.toString() === session.user.id
      );

      let isOfferPending = false;
      let canAcceptOffer = false;

      if (task.searchMethod === 'find_worker' && isAssignedWorker) {
        // Find worker flow
        isOfferPending = task.status === 'pending';
        canAcceptOffer = task.status === 'pending';
      } else if (task.searchMethod === 'publication' && userApplication) {
        // Publication flow - user sudah apply
        isOfferPending = userApplication.status === 'pending';
        canAcceptOffer = false;
      }

      const report = reportMap.get(task._id.toString());

      console.log('Processing task:', {
        taskId: task._id.toString(),
        title: task.title,
        searchMethod: task.searchMethod,
        taskStatus: task.status,
        isAssignedWorker,
        userApplicationStatus: userApplication?.status,
        isOfferPending,
        canAcceptOffer,
        hasReport: !!report
      });

      return {
        _id: task._id,
        title: task.title,
        description: task.description,
        category: task.category,
        location: task.location,
        locationCoordinates: task.locationCoordinates,
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
        poster: task.posterId,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,

        // ✓ Worker's relationship to task
        isAssignedWorker,
        isOfferPending,
        canAcceptOffer,

        // ✓ Application info (untuk publication flow)
        applicationStatus: userApplication?.status || null,
        appliedAt: userApplication?.appliedAt || null,

        // ✓ Report info
        report: report
          ? {
              status: report.status,
              resolution: report.resolution,
              adminNotes: report.adminNotes,
              reporterType: report.reporterType,
              resolvedAt: report.resolvedAt,
              action: report.action
            }
          : null,
      };
    });

    // Filter berdasarkan status jika diperlukan
    let filteredTasks = formattedTasks;

    if (statusParam) {
      console.log('Filtering by status:', statusParam);

      if (statusParam === 'pending_offers') {
        // Find_worker: penawaran formal yang belum diterima
        filteredTasks = formattedTasks.filter(
          t => t.searchMethod === 'find_worker' && t.isOfferPending
        );
        console.log('Filtered pending_offers:', filteredTasks.length);
      } else if (statusParam === 'pending_applications') {
        // Publication: aplikasi yang menunggu pemberi kerja terima
        filteredTasks = formattedTasks.filter(
          t => t.searchMethod === 'publication' && t.applicationStatus === 'pending'
        );
        console.log('Filtered pending_applications:', filteredTasks.length);
      } else if (statusParam === 'active') {
        // Status task = accepted, active, atau proses
        filteredTasks = formattedTasks.filter(t =>
          ['pending', 'accepted', 'active', 'proses'].includes(t.status)
        );
        console.log('Filtered active:', filteredTasks.length);
      } else if (statusParam === 'in_progress') {
        // Status task = accepted, active, atau proses (alias untuk active)
        filteredTasks = formattedTasks.filter(t =>
          ['accepted', 'active', 'proses'].includes(t.status)
        );
        console.log('Filtered in_progress:', filteredTasks.length);
      } else if (statusParam === 'completed') {
        filteredTasks = formattedTasks.filter(t =>
          ['completed', 'selesai', 'completed_worker'].includes(t.status)
        );
        console.log('Filtered completed:', filteredTasks.length);
      } else if (statusParam === 'cancelled') {
        filteredTasks = formattedTasks.filter(t =>
          ['cancelled', 'dibatalkan', 'rejected'].includes(t.status) ||
          t.applicationStatus === 'rejected'
        );
        console.log('Filtered cancelled:', filteredTasks.length);
      } else if (statusParam === 'disputed') {
        filteredTasks = formattedTasks.filter(t => t.report !== null);
        console.log('Filtered disputed:', filteredTasks.length);
      } else {
        // Filter by exact task status
        filteredTasks = formattedTasks.filter(t => t.status === statusParam);
        console.log(`Filtered by status '${statusParam}':`, filteredTasks.length);
      }
    }

    console.log('Final worker jobs result:', {
      total: filteredTasks.length,
      userId: session.user.id,
      statusFilter: statusParam
    });

    return NextResponse.json({
      success: true,
      data: filteredTasks,
      count: filteredTasks.length,
      meta: {
        userId: session.user.id,
        statusFilter: statusParam,
        limit
      }
    });
  } catch (error) {
    console.error('Worker jobs error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan saat mengambil data pekerjaan worker',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}