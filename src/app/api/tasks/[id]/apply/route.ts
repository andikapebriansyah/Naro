import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Task from '@/lib/models/Task';
import { createNotification } from '@/lib/notifications';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { message, agreedToTerms, agreedAt } = await request.json();
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

    // Check if task is still open
    if (task.status !== 'open') {
      return NextResponse.json(
        { success: false, error: 'Pekerjaan ini sudah tidak tersedia' },
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

    // Add application
    task.applicants.push({
      userId: session.user.id,
      appliedAt: new Date(),
      status: 'pending',
      message: message?.trim() || 'Saya tertarik dengan pekerjaan ini',
      agreedToTerms: agreedToTerms || false,
      agreedAt: agreedAt ? new Date(agreedAt) : null
    });

    // PERBAIKAN: Task TETAP 'open' meskipun ada yang apply
    // Status baru berubah ke 'pending' setelah pemberi kerja menerima salah satu pelamar
    
    console.log('=== APPLY API SAVE ===');
    console.log('Task ID:', task._id);
    console.log('User ID:', session.user.id);
    console.log('Status remains:', task.status); // Tetap 'open'
    console.log('Total applicants after add:', task.applicants.length);
    console.log('Applicants:', task.applicants.map((app: any) => ({
      userId: app.userId,
      status: app.status,
      appliedAt: app.appliedAt
    })));

    await task.save();

    console.log('Task saved successfully - status remains open');

    // ✅ Notify employer about new applicant
    await createNotification({
      userId: task.posterId.toString(),
      title: 'Lamaran Baru Masuk! 👤',
      message: `Ada pelamar baru untuk pekerjaan "${task.title}". Periksa profil dan terima pelamar yang sesuai.`,
      type: 'new_applicant',
      relatedId: task._id.toString(),
      relatedModel: 'Task',
    });

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