import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Task from '@/lib/models/Task';
import Review from '@/lib/models/Review';
import User from '@/lib/models/User';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { rating, comment } = await request.json();

    // Validasi input
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating harus antara 1-5' },
        { status: 400 }
      );
    }

    if (!comment || comment.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: 'Ulasan minimal 10 karakter' },
        { status: 400 }
      );
    }

    // Cari task
    const task = await Task.findById(params.id);

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Tugas tidak ditemukan' },
        { status: 404 }
      );
    }

    // Cek apakah task sudah selesai
    if (!['completed', 'selesai'].includes(task.status)) {
      return NextResponse.json(
        { success: false, error: 'Hanya tugas yang selesai yang bisa direview' },
        { status: 400 }
      );
    }

    // Tentukan siapa yang memberi review dan siapa yang menerima
    const fromUserId = session.user.id;
    let toUserId: string;

    if (task.posterId.toString() === fromUserId) {
      // Pemberi kerja memberi review ke pekerja
      if (!task.assignedTo) {
        return NextResponse.json(
          { success: false, error: 'Tidak ada pekerja yang ditugaskan' },
          { status: 400 }
        );
      }
      toUserId = task.assignedTo.toString();
    } else if (task.assignedTo && task.assignedTo.toString() === fromUserId) {
      // Pekerja memberi review ke pemberi kerja
      toUserId = task.posterId.toString();
    } else {
      return NextResponse.json(
        { success: false, error: 'Anda tidak berhak memberi review untuk tugas ini' },
        { status: 403 }
      );
    }

    // Cek apakah sudah pernah review
    const existingReview = await Review.findOne({
      taskId: params.id,
      fromUserId: fromUserId,
    });

    if (existingReview) {
      return NextResponse.json(
        { success: false, error: 'Anda sudah memberikan review untuk tugas ini' },
        { status: 400 }
      );
    }

    // Buat review baru
    const review = await Review.create({
      taskId: params.id,
      fromUserId,
      toUserId,
      rating,
      comment: comment.trim(),
    });

    // Update rating user yang menerima review
    const reviews = await Review.find({ toUserId });
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / reviews.length;

    await User.findByIdAndUpdate(toUserId, {
      rating: parseFloat(averageRating.toFixed(2)),
      totalReviews: reviews.length,
    });

    return NextResponse.json({
      success: true,
      message: 'Review berhasil dikirim',
      data: review,
    });
  } catch (error: any) {
    console.error('Submit review error:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Anda sudah memberikan review untuk tugas ini' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat mengirim review' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Ambil semua review untuk task ini
    const reviews = await Review.find({ taskId: params.id })
      .populate('fromUserId', 'name image')
      .populate('toUserId', 'name image');

    // Cek apakah user sudah review
    const userReview = reviews.find(
      (r: any) => r.fromUserId._id.toString() === session.user.id
    );

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        hasReviewed: !!userReview,
        userReview: userReview || null,
      },
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat mengambil review' },
      { status: 500 }
    );
  }
}