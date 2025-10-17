import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Task from '@/lib/models/Task';
import Report from '@/lib/models/Report';
import { uploadToCloudinary } from '@/lib/cloudinary';

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

    // ✅ Parse FormData untuk handle file upload
    const formData = await request.formData();
    const reason = formData.get('reason') as string;
    const description = formData.get('description') as string;
    const files = formData.getAll('evidence') as File[];

    // Validate required fields
    if (!reason || !description) {
      return NextResponse.json(
        { success: false, error: 'Alasan dan deskripsi laporan wajib diisi' },
        { status: 400 }
      );
    }

    if (description.length < 20) {
      return NextResponse.json(
        { success: false, error: 'Deskripsi minimal 20 karakter' },
        { status: 400 }
      );
    }

    const task = await Task.findById(params.id)
      .populate('assignedTo', '_id name email phone')
      .populate('posterId', '_id name email phone')
      .lean();

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Tugas tidak ditemukan' },
        { status: 404 }
      );
    }

    // Type cast
    const assignedTo = task.assignedTo as any;
    const posterId = task.posterId as any;

    // Helper to get string ID
    const getIdString = (field: any): string | null => {
      if (!field) return null;
      if (typeof field === 'object' && '_id' in field) {
        return field._id.toString();
      }
      return field.toString();
    };

    const assignedToId = getIdString(assignedTo);
    const posterIdStr = getIdString(posterId);

    // Verify user involvement
    const isWorker = assignedToId === session.user.id;
    const isEmployer = posterIdStr === session.user.id;

    if (!isWorker && !isEmployer) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak memiliki akses untuk melaporkan tugas ini' },
        { status: 403 }
      );
    }

    // Determine who is being reported
    const reportedUserId = isWorker ? posterIdStr : assignedToId;
    const reporterType = isWorker ? 'worker' : 'employer';

    if (!reportedUserId) {
      return NextResponse.json(
        { success: false, error: 'Tidak ada pengguna yang dapat dilaporkan' },
        { status: 400 }
      );
    }

    // ✅ Upload files to Cloudinary
    const evidenceUrls: string[] = [];
    
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const uploadedUrl = await uploadToCloudinary(file, 'naro-app/reports');
          evidenceUrls.push(uploadedUrl);
        } catch (uploadError) {
          console.error('Error uploading file:', uploadError);
          // Continue with other files jika ada error di satu file
        }
      }
    }

    // ✅ Create report dengan evidence URLs
    const report = await Report.create({
      taskId: params.id,
      reporterId: session.user.id,
      reportedUserId,
      reporterType,
      reason,
      description,
      evidence: evidenceUrls, // ✅ Simpan URLs bukan files
      status: 'pending',
    });

    // Update task status to disputed
    await Task.findByIdAndUpdate(params.id, { status: 'disputed' });

    return NextResponse.json({
      success: true,
      message: 'Laporan berhasil dikirim dengan bukti pendukung. Tim kami akan meninjau laporan Anda.',
      data: report,
    });
  } catch (error) {
    console.error('Report task error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat mengirim laporan' },
      { status: 500 }
    );
  }
}