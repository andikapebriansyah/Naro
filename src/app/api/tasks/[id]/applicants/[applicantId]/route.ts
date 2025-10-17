import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Task from '@/lib/models/Task';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; applicantId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await request.json(); // 'accept' or 'reject'
    const taskId = params.id;
    const applicantId = params.applicantId;

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Action tidak valid' },
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

    // Check if user is the poster
    if (task.posterId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak memiliki akses untuk melakukan ini' },
        { status: 403 }
      );
    }

    // Check if task is publication type
    if (task.searchMethod !== 'publication') {
      return NextResponse.json(
        { success: false, error: 'Action ini hanya untuk tugas publikasi' },
        { status: 400 }
      );
    }

    // Find the applicant
    const applicantIndex = task.applicants.findIndex(
      (app: any) => app.userId.toString() === applicantId
    );

    if (applicantIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Pelamar tidak ditemukan' },
        { status: 404 }
      );
    }

    if (action === 'accept') {
      // Accept this applicant
      task.applicants[applicantIndex].status = 'accepted';
      task.assignedTo = applicantId;
      task.status = 'menunggu'; // Menunggu konfirmasi dari pekerja
      
      // Reject all other applicants
      task.applicants.forEach((app: any, index: number) => {
        if (index !== applicantIndex && app.status === 'pending') {
          app.status = 'rejected';
        }
      });
    } else {
      // Reject this applicant
      task.applicants[applicantIndex].status = 'rejected';
    }

    await task.save();

    return NextResponse.json({
      success: true,
      message: action === 'accept' ? 'Pelamar diterima' : 'Pelamar ditolak'
    });

  } catch (error) {
    console.error('Applicant action error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}