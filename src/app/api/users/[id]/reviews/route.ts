import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Review from '@/lib/models/Review';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const userId = params.id;

    // Get reviews for this user (where they received the review)
    const reviews = await Review.find({
      toUserId: userId
    })
    .populate('fromUserId', 'name')
    .populate('taskId', 'title')
    .select('rating comment createdAt fromUserId taskId')
    .sort({ createdAt: -1 })
    .limit(10);

    // Format the reviews
    const formattedReviews = reviews.map((review, index) => {
      const reviewDate = new Date(review.createdAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - reviewDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let timeAgo;
      if (diffDays === 1) {
        timeAgo = '1 hari yang lalu';
      } else if (diffDays < 7) {
        timeAgo = `${diffDays} hari yang lalu`;
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        timeAgo = weeks === 1 ? '1 minggu yang lalu' : `${weeks} minggu yang lalu`;
      } else {
        const months = Math.floor(diffDays / 30);
        timeAgo = months === 1 ? '1 bulan yang lalu' : `${months} bulan yang lalu`;
      }

      return {
        id: review._id,
        reviewer: (review.fromUserId as any)?.name || 'Pemberi Kerja',
        date: timeAgo,
        rating: review.rating,
        comment: review.comment,
        taskTitle: (review.taskId as any)?.title || '',
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedReviews,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}