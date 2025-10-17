import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Task from '@/lib/models/Task';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { clauses, customClauses } = await request.json();

    await dbConnect();

    const task = await Task.findById(params.id);

    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    if (task.posterId.toString() !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Update agreement
    task.agreement = {
      clauses,
      customClauses,
      acceptedByPoster: true,
      acceptedByTasker: false,
      acceptedByPosterAt: new Date(),
    };

    task.status = 'open';
    await task.save();

    return NextResponse.json({
      success: true,
      data: task,
      message: 'Perjanjian berhasil disimpan',
    });
  } catch (error) {
    console.error('Agreement update error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
