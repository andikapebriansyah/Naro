import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

// POST - Create test notifications (for development only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const testNotifications = [
      {
        userId: session.user.id,
        title: 'Selamat Datang! 🎉',
        message: 'Terima kasih telah bergabung dengan Naro! Mulai cari pekerjaan atau buat tugas pertama Anda.',
        type: 'system' as const,
      },
      {
        userId: session.user.id,
        title: 'Pekerjaan Baru Tersedia',
        message: 'Ada pekerjaan baru di kategori yang Anda minati. Segera lamar sebelum terlambat!',
        type: 'new_applicant' as const,
      },
      {
        userId: session.user.id,
        title: 'Pembayaran Diterima 💰',
        message: 'Pembayaran sebesar Rp 150,000 untuk pekerjaan "Bersih-bersih rumah" telah diterima.',
        type: 'payment_received' as const,
      },
      {
        userId: session.user.id,
        title: 'Tugas Selesai ✅',
        message: 'Tugas "Pengiriman dokumen" telah diselesaikan oleh pekerja. Silakan berikan review.',
        type: 'task_completed' as const,
      },
      {
        userId: session.user.id,
        title: 'Lamaran Diterima! 🎊',
        message: 'Selamat! Lamaran Anda untuk "Jasa cleaning service" telah diterima. Hubungi pemberi kerja untuk detail lebih lanjut.',
        type: 'application_accepted' as const,
      },
    ];

    // Create all test notifications
    const promises = testNotifications.map(notif => createNotification(notif));
    await Promise.all(promises);

    return NextResponse.json({
      success: true,
      message: 'Test notifications created successfully',
      count: testNotifications.length,
    });
  } catch (error) {
    console.error('Create test notifications error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create test notifications' },
      { status: 500 }
    );
  }
}