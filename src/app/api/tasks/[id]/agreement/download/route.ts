import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Task from '@/lib/models/Task';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const taskId = params.id;

    await dbConnect();

    // Find the task
    const task = await Task.findById(taskId).populate('posterId', 'name email');
    if (!task) {
      return NextResponse.json({ success: false, error: 'Pekerjaan tidak ditemukan' }, { status: 404 });
    }

    // Check if user has permission to download (offered worker)
    if (task.searchMethod !== 'find_worker') {
      return NextResponse.json({ success: false, error: 'Akses ditolak' }, { status: 403 });
    }

    // Generate simple PDF content (in real app, use proper PDF library like jsPDF or Puppeteer)
    const pdfContent = generatePDFContent(task, session.user);

    // Return PDF download response
    return new NextResponse(pdfContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Surat_Perjanjian_${task.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Download agreement error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat mengunduh surat perjanjian' },
      { status: 500 }
    );
  }
}

function generatePDFContent(task: any, user: any) {
  // This is a simplified approach - in production, use proper PDF generation library
  // For now, return a text-based "PDF" (HTML that can be saved as PDF)
  
  const content = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Surat Perjanjian Kerja</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 20px; }
        .parties { display: flex; justify-content: space-between; margin: 20px 0; }
        .party { width: 45%; }
        .clause { margin-bottom: 15px; padding: 10px; border-left: 3px solid #007bff; }
        .signature { margin-top: 50px; display: flex; justify-content: space-between; }
        .signature-box { width: 45%; text-align: center; border-top: 1px solid #333; padding-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>SURAT PERJANJIAN KERJA</h1>
        <p>Nomor: NARO/2025/${task._id.toString().slice(-6)}</p>
        <p>Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    </div>

    <div class="section">
        <p>Perjanjian ini dibuat antara:</p>
        <div class="parties">
            <div class="party">
                <strong>PEMBERI KERJA</strong><br>
                Nama: ${task.posterId?.name || '[Nama Pemberi Kerja]'}<br>
                (Selanjutnya disebut "Pihak Pertama")
            </div>
            <div class="party">
                <strong>PEKERJA</strong><br>
                Nama: ${user.name || '[Nama Pekerja]'}<br>
                (Selanjutnya disebut "Pihak Kedua")
            </div>
        </div>
    </div>

    <div class="section">
        <h3>DETAIL PEKERJAAN</h3>
        <p><strong>Judul Pekerjaan:</strong> ${task.title}</p>
        <p><strong>Kategori:</strong> ${task.category}</p>
        <p><strong>Lokasi:</strong> ${task.location}</p>
        <p><strong>Jadwal:</strong> ${new Date(task.scheduledDate).toLocaleDateString('id-ID')} - ${task.scheduledTime}</p>
        <p><strong>Nilai Kontrak:</strong> Rp ${task.budget.toLocaleString('id-ID')}</p>
        <p><strong>Deskripsi:</strong> ${task.description}</p>
    </div>

    <div class="section">
        <h3>KETENTUAN PERJANJIAN</h3>
        
        <div class="clause">
            <h4>1. JAM KERJA</h4>
            <p>Pekerjaan dilaksanakan sesuai jadwal yang telah ditentukan. Keterlambatan lebih dari 30 menit harus dikonfirmasi sebelumnya.</p>
        </div>

        <div class="clause">
            <h4>2. RUANG LINGKUP PEKERJAAN</h4>
            <p>Pekerjaan mencakup seluruh area yang disebutkan dalam deskripsi tugas. Penambahan pekerjaan di luar scope memerlukan persetujuan terpisah.</p>
        </div>

        <div class="clause">
            <h4>3. KETENTUAN PEMBAYARAN</h4>
            <p>Pembayaran akan ditahan oleh platform dan akan dicairkan ke pekerja maksimal 24 jam setelah pemberi kerja mengkonfirmasi penyelesaian tugas.</p>
        </div>

        <div class="clause">
            <h4>4. KEBIJAKAN PEMBATALAN</h4>
            <p>Pembatalan oleh pemberi kerja 24 jam sebelum jadwal akan dikenakan biaya admin. Pembatalan oleh pekerja tanpa alasan kuat akan mempengaruhi rating.</p>
        </div>

        <div class="clause">
            <h4>5. TANGGUNG JAWAB & LIABILITAS</h4>
            <p>Pekerja bertanggung jawab atas kerusakan yang disebabkan oleh kelalaian dalam bekerja. Pemberi kerja wajib menyediakan lingkungan kerja yang aman.</p>
        </div>
    </div>

    <div class="section">
        <p>Perjanjian ini berlaku sejak ditandatangani oleh kedua belah pihak dan diatur oleh hukum yang berlaku di Indonesia.</p>
    </div>

    <div class="signature">
        <div class="signature-box">
            <p>Pemberi Kerja</p>
            <br><br>
            <p>${task.posterId?.name || '[Nama Pemberi Kerja]'}</p>
        </div>
        <div class="signature-box">
            <p>Pekerja</p>
            <br><br>
            <p>${user.name || '[Nama Pekerja]'}</p>
        </div>
    </div>

    <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
        <p>Dokumen ini dihasilkan secara elektronik oleh Platform Naro</p>
    </div>
</body>
</html>`;

  return content;
}