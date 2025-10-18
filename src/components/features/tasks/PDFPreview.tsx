'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'qrcode';

interface PDFPreviewProps {
  task: any;
  clauses?: any[];
  customClauses?: string;
  posterName?: string;
  onClose?: () => void;
  showDownloadButton?: boolean;
  currentUserName?: string; // Nama user yang sedang login (untuk preview sebelum accept/apply)
}

export function PDFPreview({ 
  task, 
  clauses = [], 
  customClauses = '', 
  posterName = '', 
  onClose,
  showDownloadButton = false,
  currentUserName = '' 
}: PDFPreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDFContent = async (jsPDF: any, isDownload: boolean = false) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = margin;
    
    // Prioritas nama pekerja: 1) assignedTo (sudah accept), 2) currentUserName (preview), 3) fallback
    const workerName = task.assignedTo?.name || currentUserName || '[Akan diisi setelah pekerja menerima tugas]';
    const workerId = task.assignedTo?._id || (currentUserName ? '[Preview Mode]' : '[Pending Assignment]');
    const currentDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const addText = (text: string, fontSize: number = 12, isBold: boolean = false, align: 'left' | 'center' | 'right' = 'left') => {
      if (!text) return;
      
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setTextColor(0, 0, 0);
      
      if (align === 'center') {
        doc.text(text, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += fontSize * 0.5 + 3;
      } else if (align === 'right') {
        doc.text(text, pageWidth - margin, yPosition, { align: 'right' });
        yPosition += fontSize * 0.5 + 3;
      } else {
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, margin, yPosition);
        yPosition += (lines.length) * (fontSize * 0.4) + 5;
      }
    };

    const addSpace = (space: number = 10) => {
      yPosition += space;
    };

    const checkPageBreak = (neededSpace: number = 30) => {
      if (yPosition + neededSpace > pageHeight - 35) {
        doc.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // KOP SURAT
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1.2);
    doc.line(margin, 12, pageWidth - margin, 12);
    
    yPosition = 18;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PT. NARO SEMOGA BERKAH', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition = 24;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Platform Penyedia Jasa & Pekerja Profesional', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition = 29;
    doc.setFontSize(8);
    doc.text('Jl. Teuku Nyak Arief, Kopelma Darussalam, Banda Aceh, Provinsi Aceh, dengan kode pos 23111', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition = 33;
    doc.text('Telp: (021) 123-4567 | Email: naro.co@gmail.com | Website: www.naro.life', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition = 36;
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition = 37.5;
    doc.setLineWidth(1.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    
    yPosition = 50;

    // TITLE
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PERJANJIAN KERJA SAMA', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition = 56;
    doc.setFontSize(11);
    doc.text('(SUB KONTRAKTOR)', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition = 62;
    doc.setLineWidth(0.5);
    doc.line(margin + 40, yPosition, pageWidth - margin - 40, yPosition);
    
    yPosition = 68;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nomor: NARO/SPK/${new Date().getFullYear()}/${task._id.slice(-8).toUpperCase()}/PKS`, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition = 74;
    doc.line(margin + 40, yPosition, pageWidth - margin - 40, yPosition);
    
    yPosition = 85;

    // PEMBUKAAN
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const openingText = `Pada hari ini ${new Date().toLocaleDateString('id-ID', { weekday: 'long' })} tanggal ${new Date().getDate()} bulan ${new Date().toLocaleDateString('id-ID', { month: 'long' })} tahun ${new Date().getFullYear()}, kami yang bertanda tangan di bawah ini:`;
    const openingLines = doc.splitTextToSize(openingText, maxWidth);
    doc.text(openingLines, margin, yPosition);
    yPosition += openingLines.length * 5 + 8;

    // PIHAK PERTAMA
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Nama', margin + 5, yPosition);
    doc.text(':', margin + 35, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(posterName || task.posterId?.name || '[Nama Pemberi Kerja]', margin + 40, yPosition);
    yPosition += 6;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Jabatan', margin + 5, yPosition);
    doc.text(':', margin + 35, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text('Pemberi Kerja / Pengguna Layanan', margin + 40, yPosition);
    yPosition += 6;
    
    doc.setFont('helvetica', 'bold');
    doc.text('ID Pengguna', margin + 5, yPosition);
    doc.text(':', margin + 35, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(String(task.poster || task.posterId?._id || '[ID Pemberi Kerja]'), margin + 40, yPosition);
    yPosition += 8;
    
    doc.setFontSize(10);
    const text1 = 'Bertindak untuk dan atas nama diri sendiri, yang selanjutnya disebut sebagai PIHAK PERTAMA ( Pihak Pertama ).';
    const lines1 = doc.splitTextToSize(text1, maxWidth);
    doc.text(lines1, margin, yPosition);
    yPosition += lines1.length * 5 + 10;

    // PIHAK KEDUA
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Nama', margin + 5, yPosition);
    doc.text(':', margin + 35, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(workerName, margin + 40, yPosition);
    yPosition += 6;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Jabatan', margin + 5, yPosition);
    doc.text(':', margin + 35, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text('Penyedia Jasa / Pekerja', margin + 40, yPosition);
    yPosition += 6;
    
    doc.setFont('helvetica', 'bold');
    doc.text('ID Pengguna', margin + 5, yPosition);
    doc.text(':', margin + 35, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(String(workerId), margin + 40, yPosition);
    yPosition += 8;
    
    doc.setFontSize(10);
    const text2 = 'Bertindak untuk dan atas nama diri sendiri, yang selanjutnya disebut sebagai PIHAK KEDUA ( Pihak Kedua ).';
    const lines2 = doc.splitTextToSize(text2, maxWidth);
    doc.text(lines2, margin, yPosition);
    yPosition += lines2.length * 5 + 10;
    
    const agreementText = 'Dengan ini menerangkan bahwa semua pihak setuju dan sepakat untuk mengadakan Perjanjian Kerjasama (Sub Kontraktor) dengan menggunakan ketentuan - ketentuan dan syarat - syarat sebagai berikut:';
    const agreementLines = doc.splitTextToSize(agreementText, maxWidth);
    doc.text(agreementLines, margin, yPosition);
    yPosition += agreementLines.length * 5 + 12;

    // PASAL 1
    checkPageBreak(60);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('LINGKUP KERJASAMA', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;
    doc.text('Pasal 1', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const scopeText = 'Semua pihak telah sepakat dan setuju untuk mengadakan suatu perjanjian kerjasama dalam pelimpahan proyek milik Pihak Pertama kepada Pihak Kedua (Sub Kontraktor) dalam menjalankan sebuah proyek pekerjaan sebagai berikut:';
    const scopeLines = doc.splitTextToSize(scopeText, maxWidth);
    doc.text(scopeLines, margin, yPosition);
    yPosition += scopeLines.length * 5 + 8;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Nama Paket', margin + 5, yPosition);
    doc.text(':', margin + 45, yPosition);
    doc.setFont('helvetica', 'normal');
    const titleLines = doc.splitTextToSize(task.title, maxWidth - 50);
    doc.text(titleLines, margin + 50, yPosition);
    yPosition += titleLines.length * 5 + 2;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Kategori Pekerjaan', margin + 5, yPosition);
    doc.text(':', margin + 45, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(String(task.category), margin + 50, yPosition);
    yPosition += 6;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Lokasi', margin + 5, yPosition);
    doc.text(':', margin + 45, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(String(task.location), margin + 50, yPosition);
    yPosition += 6;
    
    const scheduledDate = new Date(task.scheduledDate).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    
    doc.setFont('helvetica', 'bold');
    doc.text('Tanggal Kontrak', margin + 5, yPosition);
    doc.text(':', margin + 45, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(scheduledDate, margin + 50, yPosition);
    yPosition += 6;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Waktu Pelaksanaan', margin + 5, yPosition);
    doc.text(':', margin + 45, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(`Pukul ${task.scheduledTime} WIB`, margin + 50, yPosition);
    yPosition += 6;
    
    if (task.estimatedDuration) {
      doc.setFont('helvetica', 'bold');
      doc.text('Durasi', margin + 5, yPosition);
      doc.text(':', margin + 45, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(String(task.estimatedDuration), margin + 50, yPosition);
      yPosition += 6;
    }
    
    const budgetFormatted = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(task.budget);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Nilai Kontrak', margin + 5, yPosition);
    doc.text(':', margin + 45, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(budgetFormatted, margin + 50, yPosition);
    yPosition += 10;
    
    checkPageBreak(20);  // TAMBAHKAN INI
    doc.setFont('helvetica', 'bold');
    doc.text('Ruang Lingkup Pekerjaan:', margin, yPosition);
    yPosition += 6;
    checkPageBreak(15);  // TAMBAHKAN INI
    doc.setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(task.description, maxWidth);
    // TAMBAHKAN pengecekan untuk setiap chunk description
    for (let i = 0; i < descLines.length; i++) {
      checkPageBreak(10);
      doc.text(descLines[i], margin, yPosition);
      yPosition += 5;
    }
    yPosition += 12;

    // PASAL 2
    checkPageBreak(50);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('TATA CARA PEMBAYARAN', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;
    doc.text('Pasal 2', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const payment1 = '1. Pembayaran pekerjaan dilakukan melalui sistem escrow (penahanan dana) di platform Naro, yang akan diproses dalam tahapan sebagai berikut:';
    const payment1Lines = doc.splitTextToSize(payment1, maxWidth);
    doc.text(payment1Lines, margin, yPosition);
    yPosition += payment1Lines.length * 5 + 5;
    
    const payment1a = 'a. Pihak Pertama melakukan deposit dana sejumlah nilai kontrak ke sistem escrow platform.';
    const payment1aLines = doc.splitTextToSize(payment1a, maxWidth - 10);
    doc.text(payment1aLines, margin + 5, yPosition);
    yPosition += payment1aLines.length * 5 + 2;
    
    const payment1b = 'b. Dana akan ditahan oleh platform selama pekerjaan berlangsung.';
    const payment1bLines = doc.splitTextToSize(payment1b, maxWidth - 10);
    doc.text(payment1bLines, margin + 5, yPosition);
    yPosition += payment1bLines.length * 5 + 2;
    
    const payment1c = 'c. Setelah pekerjaan selesai dan diverifikasi oleh Pihak Pertama, dana akan dicairkan kepada Pihak Kedua.';
    const payment1cLines = doc.splitTextToSize(payment1c, maxWidth - 10);
    doc.text(payment1cLines, margin + 5, yPosition);
    yPosition += payment1cLines.length * 5 + 5;
    
    const payment2 = '2. Pencairan dana dilakukan maksimal 1x24 jam setelah konfirmasi penyelesaian pekerjaan dari Pihak Pertama.';
    const payment2Lines = doc.splitTextToSize(payment2, maxWidth);
    doc.text(payment2Lines, margin, yPosition);
    yPosition += payment2Lines.length * 5 + 5;
    
    const payment3 = '3. Apabila terjadi perselisihan terkait penyelesaian pekerjaan, platform Naro akan melakukan mediasi dan keputusan platform bersifat final dan mengikat.';
    const payment3Lines = doc.splitTextToSize(payment3, maxWidth);
    doc.text(payment3Lines, margin, yPosition);
    yPosition += payment3Lines.length * 5 + 5;
    
    const payment4 = `4. Metode pembayaran: ${task.pricingType === 'fixed' ? 'Harga tetap (fixed price)' : 'Berdasarkan tarif per jam'}.`;
    const payment4Lines = doc.splitTextToSize(payment4, maxWidth);
    doc.text(payment4Lines, margin, yPosition);
    yPosition += payment4Lines.length * 5 + 12;

    // PASAL 3
    checkPageBreak(50);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('SYARAT DAN KETENTUAN', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;
    doc.text('Pasal 3', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    clauses.forEach((clause: any, index: number) => {
      checkPageBreak(30);
      doc.setFont('helvetica', 'bold');
      const clauseTitle = `${index + 1}. ${clause.title}`;
      const clauseTitleLines = doc.splitTextToSize(clauseTitle, maxWidth);
      doc.text(clauseTitleLines, margin, yPosition);
      yPosition += clauseTitleLines.length * 5 + 3;
      
      doc.setFont('helvetica', 'normal');
      const clauseDesc = `   ${clause.description}`;
      const clauseDescLines = doc.splitTextToSize(clauseDesc, maxWidth);
      doc.text(clauseDescLines, margin, yPosition);
      yPosition += clauseDescLines.length * 5 + 8;
    });

    // PASAL 4 (Custom)
    if (customClauses && customClauses.trim()) {
      checkPageBreak(50);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('KETENTUAN TAMBAHAN', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 6;
      doc.text('Pasal 4', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const customLines = doc.splitTextToSize(customClauses, maxWidth);
      doc.text(customLines, margin, yPosition);
      yPosition += customLines.length * 5 + 12;
    }
    
    // SANKSI DAN DENDA
    checkPageBreak(60);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    const pasalSanksi = customClauses && customClauses.trim() ? '5' : '4';
    doc.text('SANKSI DAN DENDA', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;
    doc.text(`Pasal ${pasalSanksi}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const sanksi1 = '1. Apabila Pihak Kedua tidak dapat menyelesaikan pekerjaan sesuai dengan waktu yang telah disepakati tanpa alasan yang dapat diterima, maka Pihak Kedua dikenakan denda keterlambatan sebesar 1‰ (satu permil) dari nilai kontrak per hari.';
    const sanksi1Lines = doc.splitTextToSize(sanksi1, maxWidth);
    doc.text(sanksi1Lines, margin, yPosition);
    yPosition += sanksi1Lines.length * 5 + 5;
    
    const sanksi2 = '2. Apabila Pihak Pertama membatalkan kontrak secara sepihak tanpa alasan yang jelas, maka Pihak Pertama wajib membayar kompensasi sebesar 25% dari nilai kontrak kepada Pihak Kedua.';
    const sanksi2Lines = doc.splitTextToSize(sanksi2, maxWidth);
    doc.text(sanksi2Lines, margin, yPosition);
    yPosition += sanksi2Lines.length * 5 + 5;
    
    const sanksi3 = '3. Sanksi maksimal tidak akan melebihi 5% dari nilai total kontrak.';
    const sanksi3Lines = doc.splitTextToSize(sanksi3, maxWidth);
    doc.text(sanksi3Lines, margin, yPosition);
    yPosition += sanksi3Lines.length * 5 + 5;
    
    const sanksi4 = '4. Dalam hal force majeure (bencana alam, wabah penyakit, kerusuhan, perang, atau kebijakan pemerintah), kedua belah pihak dibebaskan dari sanksi dengan bukti yang sah.';
    const sanksi4Lines = doc.splitTextToSize(sanksi4, maxWidth);
    doc.text(sanksi4Lines, margin, yPosition);
    yPosition += sanksi4Lines.length * 5 + 12;
    
    // PENYELESAIAN PERSELISIHAN
    checkPageBreak(60);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    const pasalPerselisihan = customClauses && customClauses.trim() ? '6' : '5';
    doc.text('PENYELESAIAN PERSELISIHAN', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;
    doc.text(`Pasal ${pasalPerselisihan}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const dispute1 = '1. Apabila terjadi perselisihan dalam pelaksanaan perjanjian ini, para pihak sepakat untuk menyelesaikannya terlebih dahulu melalui musyawarah dan mufakat.';
    const dispute1Lines = doc.splitTextToSize(dispute1, maxWidth);
    doc.text(dispute1Lines, margin, yPosition);
    yPosition += dispute1Lines.length * 5 + 5;
    
    const dispute2 = '2. Apabila penyelesaian secara musyawarah tidak tercapai, maka para pihak sepakat untuk menyelesaikan melalui mediasi platform Naro.';
    const dispute2Lines = doc.splitTextToSize(dispute2, maxWidth);
    doc.text(dispute2Lines, margin, yPosition);
    yPosition += dispute2Lines.length * 5 + 5;
    
    const dispute3 = '3. Jika mediasi tidak berhasil, para pihak sepakat untuk menyelesaikan perselisihan melalui Badan Arbitrase Nasional Indonesia (BANI) dan keputusannya bersifat final dan mengikat.';
    const dispute3Lines = doc.splitTextToSize(dispute3, maxWidth);
    doc.text(dispute3Lines, margin, yPosition);
    yPosition += dispute3Lines.length * 5 + 5;
    
    const dispute4 = '4. Perjanjian ini tunduk pada hukum Republik Indonesia.';
    const dispute4Lines = doc.splitTextToSize(dispute4, maxWidth);
    doc.text(dispute4Lines, margin, yPosition);
    yPosition += dispute4Lines.length * 5 + 12;

    // KETENTUAN PENUTUP
    checkPageBreak(90);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    const pasalPenutup = customClauses && customClauses.trim() ? '7' : '6';
    doc.text('KETENTUAN PENUTUP', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;
    doc.text(`Pasal ${pasalPenutup}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const closing1 = '1. Perjanjian ini dibuat dalam rangkap 2 (dua) yang masing-masing bermeterai cukup dan memiliki kekuatan hukum yang sama serta berlaku sejak ditandatangani oleh kedua belah pihak secara digital melalui platform Naro.';
    const closing1Lines = doc.splitTextToSize(closing1, maxWidth);
    doc.text(closing1Lines, margin, yPosition);
    yPosition += closing1Lines.length * 5 + 5;
    
    const closing2 = '2. Perjanjian ini berlaku efektif sejak tanggal penandatanganan hingga pekerjaan dinyatakan selesai dan pembayaran telah dilakukan.';
    const closing2Lines = doc.splitTextToSize(closing2, maxWidth);
    doc.text(closing2Lines, margin, yPosition);
    yPosition += closing2Lines.length * 5 + 5;
    
    const closing3 = '3. Perubahan atau penambahan terhadap perjanjian ini hanya dapat dilakukan atas persetujuan kedua belah pihak secara tertulis dan dicatat dalam addendum perjanjian.';
    const closing3Lines = doc.splitTextToSize(closing3, maxWidth);
    doc.text(closing3Lines, margin, yPosition);
    yPosition += closing3Lines.length * 5 + 5;
    
    const closing4 = '4. Hal-hal yang belum diatur dalam perjanjian ini akan diatur kemudian berdasarkan kesepakatan kedua belah pihak sesuai dengan peraturan perundang-undangan yang berlaku.';
    const closing4Lines = doc.splitTextToSize(closing4, maxWidth);
    doc.text(closing4Lines, margin, yPosition);
    yPosition += closing4Lines.length * 5 + 5;
    
    const closing5 = '5. Dokumen ini ditandatangani secara elektronik dan sah menurut Undang-Undang Nomor 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik (UU ITE) serta perubahannya.';
    const closing5Lines = doc.splitTextToSize(closing5, maxWidth);
    doc.text(closing5Lines, margin, yPosition);
    yPosition += closing5Lines.length * 5 + 15;
    
    const finalText = 'Demikian perjanjian ini dibuat dengan sebenarnya dalam keadaan sehat jasmani dan rohani tanpa adanya paksaan dari pihak manapun, untuk dapat dipergunakan sebagaimana mestinya.';
    const finalLines = doc.splitTextToSize(finalText, maxWidth);
    doc.text(finalLines, margin, yPosition);
    yPosition += finalLines.length * 5 + 20;

    // TANDA TANGAN
    checkPageBreak(120);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${currentDate},`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;
    
    const signatureStartY = yPosition;
    const employerQRData = `NARO-EMPLOYER-${task.poster}-${task._id}-${Date.now()}`;
    const workerQRData = task.assignedWorker 
      ? `NARO-WORKER-${task.assignedWorker._id}-${task._id}-${Date.now()}`
      : `NARO-WORKER-PENDING-${task._id}`;

    try {
      const employerQR = await QRCode.toDataURL(employerQRData, { 
        width: 200, 
        margin: 1,
        color: { dark: '#000000', light: '#FFFFFF' }
      });
      
      const workerQR = await QRCode.toDataURL(workerQRData, { 
        width: 200, 
        margin: 1,
        color: { dark: '#000000', light: '#FFFFFF' }
      });

      const leftCol = margin;
      const rightCol = pageWidth - margin - 60;
      
      yPosition = signatureStartY;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Pihak Pertama,', leftCol, yPosition);
      doc.text('Pihak Kedua,', rightCol, yPosition);
      yPosition += 6;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('(Pemberi Kerja)', leftCol, yPosition);
      doc.text('(Pekerja)', rightCol, yPosition);
      yPosition += 10;
      
      doc.addImage(employerQR, 'PNG', leftCol, yPosition, 28, 28);
      doc.addImage(workerQR, 'PNG', rightCol, yPosition, 28, 28);
      yPosition += 33;
      
      doc.setLineWidth(0.5);
      doc.line(leftCol, yPosition, leftCol + 55, yPosition);
      doc.line(rightCol, yPosition, rightCol + 55, yPosition);
      yPosition += 5;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(posterName || task.posterId?.name || '[Pemberi Kerja]', leftCol, yPosition);
      doc.text(workerName, rightCol, yPosition);
      yPosition += 5;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`ID: ${String(task.poster || task.posterId?._id || '').substring(0, 12)}...`, leftCol, yPosition);
      doc.text(`ID: ${String(workerId).substring(0, 12)}...`, rightCol, yPosition);
      yPosition += 4;
      
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text(`Ditandatangani: ${currentDate}`, leftCol, yPosition);
      
      if (task.assignedTo) {
        // Sudah confirmed - tampilkan tanggal tandatangan
        doc.text(`Ditandatangani: ${currentDate}`, rightCol, yPosition);
      } else if (currentUserName) {
        // Preview mode - user sedang melihat sebelum accept/apply
        doc.setTextColor(0, 100, 200);
        doc.text('Status: Preview (Belum Ditandatangani)', rightCol, yPosition);
      } else {
        // Belum ada worker
        doc.setTextColor(200, 100, 0);
        doc.text('Status: Menunggu Persetujuan', rightCol, yPosition);
      }
      doc.setTextColor(0, 0, 0);
      
      yPosition += 10;
      checkPageBreak(25);
      
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(margin, yPosition, maxWidth, 16, 2, 2, 'FD');
      
      yPosition += 5;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50, 50, 50);
      doc.text('VERIFIKASI DOKUMEN ELEKTRONIK', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text('Dokumen ini ditandatangani secara elektronik dan sah menurut UU ITE No. 11 Tahun 2008', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 3.5;
      doc.text('Verifikasi: Scan QR code atau kunjungi https://naro.id/verify', pageWidth / 2, yPosition, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      
    } catch (qrError) {
      console.error('Error generating QR codes:', qrError);
      toast.error('QR Code gagal dibuat, menggunakan tanda tangan tradisional');
      
      const leftCol = margin;
      const rightCol = pageWidth - margin - 60;
      
      yPosition = signatureStartY;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Pihak Pertama,', leftCol, yPosition);
      doc.text('Pihak Kedua,', rightCol, yPosition);
      yPosition += 6;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('(Pemberi Kerja)', leftCol, yPosition);
      doc.text('(Pekerja)', rightCol, yPosition);
      yPosition += 30;
      
      doc.setLineWidth(0.5);
      doc.line(leftCol, yPosition, leftCol + 55, yPosition);
      doc.line(rightCol, yPosition, rightCol + 55, yPosition);
      yPosition += 5;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(posterName || task.posterId?.name || '[Pemberi Kerja]', leftCol, yPosition);
      doc.text(workerName, rightCol, yPosition);
    }

    // FOOTER
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      const footerY = pageHeight - 18;
      
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.8);
      doc.line(margin, footerY, pageWidth - margin, footerY);
      doc.setLineWidth(0.3);
      doc.line(margin, footerY + 0.8, pageWidth - margin, footerY + 0.8);
      
      doc.setFontSize(7);
      doc.setTextColor(80, 80, 80);
      doc.setFont('helvetica', 'normal');
      doc.text('PT. NARO SEMOGA BERKAH', margin, footerY + 5);
      doc.text('Dokumen Resmi Perjanjian Kerja Sama', margin, footerY + 9);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth / 2, footerY + 7, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(`Tanggal Cetak: ${currentDate}`, pageWidth - margin, footerY + 5, { align: 'right' });
      doc.text(`No. Dok: NARO-SPK-${task._id.slice(-8).toUpperCase()}`, pageWidth - margin, footerY + 9, { align: 'right' });
      
      doc.setFontSize(6);
      doc.setTextColor(120, 120, 120);
      doc.text('© 2025 Naro Platform. Dilindungi Undang-Undang.', pageWidth / 2, footerY + 13, { align: 'center' });
    }

    if (isDownload) {
      doc.save(`Perjanjian_Kerja_${task.title.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
    } else {
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
    }
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const jsPDF = (await import('jspdf')).default;
      await generatePDFContent(jsPDF, false);
      toast.success('PDF berhasil dibuat dan dibuka di tab baru!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(`Gagal membuat PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = async () => {
    setIsGenerating(true);
    try {
      const jsPDF = (await import('jspdf')).default;
      await generatePDFContent(jsPDF, true);
      toast.success('PDF berhasil diunduh!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error(`Gagal mengunduh PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const previewContent = (
    <Card className={onClose ? "w-full max-w-2xl max-h-[90vh] overflow-hidden" : "w-full"}>
      {onClose && (
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600 flex-shrink-0" />
            <div>
              <h2 className="text-lg sm:text-xl font-bold">Preview Perjanjian</h2>
              <p className="text-xs sm:text-sm text-gray-600">Surat Perjanjian Kerja Sama</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="flex-shrink-0">
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      )}

      <CardContent className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
        {/* Info Box - Responsif */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-start space-x-2 sm:space-x-3">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-blue-800">
              <p className="font-semibold mb-1">Tentang Preview PDF</p>
              <ul className="space-y-0.5 sm:space-y-1 text-blue-700">
                <li className="leading-relaxed">• PDF akan dibuat berdasarkan klausul yang Anda pilih</li>
                <li className="leading-relaxed">• Preview akan dibuka di tab baru</li>
                <li className="leading-relaxed hidden sm:block">• Anda dapat menyimpan atau mencetak PDF langsung dari browser</li>
                <li className="leading-relaxed">• Tanda tangan digital akan ditambahkan setelah pekerja menerima tugas</li>
                <li className="leading-relaxed hidden sm:block">• Dokumen dilengkapi QR Code untuk verifikasi keaslian</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Detail Info - Responsif */}
        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2 text-xs sm:text-sm">
          {/* Nomor Perjanjian */}
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
            <span className="text-gray-600 font-medium sm:font-normal">Nomor Perjanjian:</span>
            <span className="font-mono font-medium text-xs sm:text-sm break-all sm:break-normal">
              NARO/SPK/{new Date().getFullYear()}/{task._id.slice(-8).toUpperCase()}/PKS
            </span>
          </div>
          
          {/* Judul Tugas */}
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
            <span className="text-gray-600 font-medium sm:font-normal">Judul Tugas:</span>
            <span className="font-medium break-words sm:truncate sm:ml-2 sm:text-right sm:max-w-[60%]">
              {task.title}
            </span>
          </div>
          
          {/* Kategori */}
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
            <span className="text-gray-600 font-medium sm:font-normal">Kategori:</span>
            <span className="font-medium">{task.category}</span>
          </div>
          
          {/* Nilai Kontrak */}
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
            <span className="text-gray-600 font-medium sm:font-normal">Nilai Kontrak:</span>
            <span className="font-medium text-primary-600">
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
              }).format(task.budget)}
            </span>
          </div>
          
          {/* Jumlah Pasal */}
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
            <span className="text-gray-600 font-medium sm:font-normal">Jumlah Pasal:</span>
            <span className="font-medium">{clauses.length + (customClauses ? 1 : 0) + 3} pasal ketentuan</span>
          </div>
        </div>

        {/* Buttons - Responsif */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4">
          <Button
            onClick={generatePDF}
            disabled={isGenerating}
            className="flex-1 w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                <span className="text-sm sm:text-base">Membuat PDF...</span>
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span className="text-sm sm:text-base">Preview PDF</span>
              </>
            )}
          </Button>
          {showDownloadButton && (
            <Button
              onClick={downloadPDF}
              disabled={isGenerating}
              variant="outline"
              className="flex-1 w-full"
              size="lg"
            >
              <Download className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span className="text-sm sm:text-base">Download PDF</span>
            </Button>
          )}
        </div>

        {/* Footer Text - Responsif */}
        <p className="text-[10px] sm:text-xs text-gray-500 text-center leading-relaxed px-2 sm:px-0">
          PDF ini merupakan draft perjanjian. Perjanjian final akan dibuat setelah pekerja menerima tugas dan menandatangani secara digital.
        </p>
      </CardContent>
    </Card>
  );

  return onClose ? (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {previewContent}
    </div>
  ) : (
    previewContent
  );
}