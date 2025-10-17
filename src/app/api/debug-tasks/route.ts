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

    await dbConnect();

    // Get all tasks to debug
    const allTasks = await Task.find({}).select('_id title status posterId createdAt').lean();
    
    const debugInfo = {
      sessionUserId: session.user.id,
      sessionUserIdType: typeof session.user.id,
      totalTasksInDb: allTasks.length,
      tasks: allTasks.map(task => ({
        id: task._id,
        title: task.title,
        status: task.status,
        posterId: task.posterId,
        posterIdType: typeof task.posterId,
        posterIdString: String(task.posterId),
        matchesUser: String(task.posterId) === session.user.id,
        exactMatch: task.posterId === session.user.id,
        createdAt: task.createdAt
      }))
    };

    return NextResponse.json({
      success: true,
      debug: debugInfo
    });

  } catch (error) {
    console.error('Debug tasks error:', error);
    return NextResponse.json(
      { success: false, error: 'Debug failed' },
      { status: 500 }
    );
  }
}