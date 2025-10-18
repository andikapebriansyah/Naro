import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Review from '@/lib/models/Review';

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
    const userId = searchParams.get('userId') || session.user.id;
    const limit = parseInt(searchParams.get('limit') || '10');

    await dbConnect();

    // Get reviews for this user (as worker)
    const reviews = await Review.find({ toUserId: userId })
      .populate('fromUserId', 'name image isVerified')
      .populate('taskId', 'title category')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Calculate average rating
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;

    // Get rating distribution
    const ratingDistribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    };

    return NextResponse.json({
      success: true,
      data: {
        reviews: reviews.map(review => ({
          _id: review._id,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
          fromUser: {
            _id: review.fromUserId._id,
            name: review.fromUserId.name,
            image: review.fromUserId.image,
            isVerified: review.fromUserId.isVerified,
          },
          task: {
            _id: review.taskId._id,
            title: review.taskId.title,
            category: review.taskId.category,
          }
        })),
        stats: {
          totalReviews,
          averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
          ratingDistribution
        }
      }
    });

  } catch (error) {
    console.error('Reviews fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}