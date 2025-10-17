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
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { message } = await request.json();
    const taskId = params.id;

    if (!message?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Pesan lamaran diperlukan' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Pekerjaan tidak ditemukan' },
        { status: 404 }
      );
    }

    console.log('=== APPLY API ===');
    console.log('Task ID:', taskId);
    console.log('Task Status:', task.status);
    console.log('Search Method:', task.searchMethod);
    console.log('User ID:', session.user.id);
    console.log('Task Poster ID:', task.posterId.toString());

    // FIX: Check if task is available for application
    // For publication jobs: allow apply if status is 'open' OR 'pending' (pending means waiting for poster to choose)
    // For find_worker jobs: cannot apply, must be offered
    if (task.searchMethod === 'find_worker') {
      return NextResponse.json(
        { success: false, error: 'Pekerjaan ini menggunakan metode pencarian pekerja langsung. Anda tidak bisa melamar.' },
        { status: 400 }
      );
    }

    if (!['open', 'pending'].includes(task.status)) {
      return NextResponse.json(
        { success: false, error: 'Pekerjaan ini sudah tidak tersedia untuk lamaran' },
        { status: 400 }
      );
    }

    // Check if user is not the poster
    if (task.posterId.toString() === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak dapat melamar pekerjaan sendiri' },
        { status: 400 }
      );
    }

    // Check if user already applied
    const existingApplication = task.applicants.find(
      (app: any) => app.userId.toString() === session.user.id
    );

    if (existingApplication) {
      return NextResponse.json(
        { success: false, error: 'Anda sudah melamar pekerjaan ini' },
        { status: 400 }
      );
    }

    // Check if task already has assigned worker
    if (task.assignedTo) {
      return NextResponse.json(
        { success: false, error: 'Pekerjaan ini sudah memiliki pekerja yang ditugaskan' },
        { status: 400 }
      );
    }

    // Add application
    task.applicants.push({
      userId: session.user.id,
      appliedAt: new Date(),
      status: 'pending',
      message: message.trim()
    });

    // Update task status to pending when first application is received (if still open)
    const oldStatus = task.status;
    if (task.status === 'open' && task.applicants.length === 1) {
      task.status = 'pending';
    }

    console.log('=== APPLY API SAVE ===');
    console.log('Old status:', oldStatus);
    console.log('New status:', task.status);
    console.log('Total applicants after add:', task.applicants.length);
    console.log('Applicants:', task.applicants.map((app: any) => ({
      userId: app.userId,
      status: app.status,
      appliedAt: app.appliedAt
    })));

    await task.save();

    console.log('Task saved successfully');

    return NextResponse.json({
      success: true,
      message: 'Lamaran berhasil dikirim'
    });

  } catch (error) {
    console.error('Apply error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat mengirim lamaran' },
      { status: 500 }
    );
  }
}