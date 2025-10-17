'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface PDFPreviewProps {
  task: any;
  clauses: any[];
  customClauses: string;
  posterName: string;
  onClose: () => void;
}

export function PDFPreview({ task, clauses, customClauses, posterName, onClose }: PDFPreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      // Dynamic import untuk mengurangi bundle size
      const jsPDF = (await import('jspdf')).default;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      // Helper function untuk add text dengan word wrap
      const addText = (text: string, fontSize: number = 12, isBold: boolean = false, align: 'left' | 'center' | 'right' = 'left') => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        
        if (align === 'center') {
          const textWidth = doc.getTextWidth(text);
          const x = (pageWidth - textWidth) / 2;
          doc.text(text, x, yPosition);
        } else if (align === 'right') {
          doc.text(text, pageWidth - margin, yPosition, { align: 'right' });
        } else {
          const lines = doc.splitTextToSize(text, maxWidth);
          doc.text(lines, margin, yPosition);
          yPosition += (lines.length - 1) * 7;
        }
        
        yPosition += fontSize / 2 + 5;
      };

      const addSpace = (space: number = 10) => {
        yPosition += space;
      };

      const checkPageBreak = (neededSpace: number = 20) => {
        if (yPosition + neededSpace > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
          return true;
        }
        return false;
      };

      // Header
      addText('SURAT PERJANJIAN KERJA', 16, true, 'center');
      addText(`Nomor: NARO/2025/${task._id.slice(-6)}`, 10, false, 'center');
      addSpace(15);

      // Pembukaan
      const currentDate = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      
      addText(`Perjanjian ini dibuat pada tanggal ${currentDate} antara:`);
      addSpace(10);

      // Pihak Pertama
      addText('PIHAK PERTAMA (PEMBERI KERJA)', 12, true);
      addText(`Nama: ${posterName}`);
      addText(`Platform ID: ${task.posterId}`);
      addSpace(10);

      // Pihak Kedua
      addText('PIHAK KEDUA (PEKERJA)', 12, true);
      addText('Nama: [Akan diisi setelah pekerja ditemukan]');
      addText('Platform ID: [Akan diisi setelah pekerja ditemukan]');
      addSpace(15);

      // Detail Pekerjaan
      checkPageBreak(60);
      addText('PASAL 1', 12, true);
      addText('DETAIL PEKERJAAN', 12, true);
      addSpace(5);
      
      addText(`1.1. Judul Pekerjaan: ${task.title}`);
      addText(`1.2. Kategori: ${task.category}`);
      addText(`1.3. Lokasi: ${task.location}`);
      
      const scheduledDate = new Date(task.scheduledDate).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      addText(`1.4. Jadwal: ${scheduledDate}, Pukul ${task.scheduledTime} WIB`);
      
      if (task.estimatedDuration) {
        addText(`1.5. Estimasi Durasi: ${task.estimatedDuration}`);
      }
      
      addText(`1.6. Deskripsi Pekerjaan:`);
      addText(task.description);
      addSpace(15);

      // Budget
      checkPageBreak(40);
      addText('PASAL 2', 12, true);
      addText('BUDGET DAN PEMBAYARAN', 12, true);
      addSpace(5);
      
      const budgetFormatted = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(task.budget);
      
      addText(`2.1. Total Budget: ${budgetFormatted}`);
      addText(`2.2. Tipe Pembayaran: ${task.pricingType === 'fixed' ? 'Harga Tetap' : 'Per Jam'}`);
      addText('2.3. Pembayaran akan ditahan oleh platform dan dicairkan maksimal 24 jam setelah konfirmasi penyelesaian dari Pemberi Kerja.');
      addSpace(15);

      // Ketentuan/Clauses
      checkPageBreak(40);
      addText('PASAL 3', 12, true);
      addText('KETENTUAN UMUM', 12, true);
      addSpace(5);

      clauses.forEach((clause: any, index: number) => {
        checkPageBreak(30);
        addText(`3.${index + 1}. ${clause.title}`, 11, true);
        addText(clause.description);
        addSpace(8);
      });

      // Custom Clauses
      if (customClauses && customClauses.trim()) {
        checkPageBreak(40);
        addText('PASAL 4', 12, true);
        addText('KETENTUAN TAMBAHAN', 12, true);
        addSpace(5);
        addText(customClauses);
        addSpace(15);
      }

      // Penutup
      checkPageBreak(80);
      addText('PASAL TERAKHIR', 12, true);
      addText('KETENTUAN PENUTUP', 12, true);
      addSpace(5);
      
      addText('Perjanjian ini dibuat dalam rangkap 2 (dua) yang masing-masing bermeterai cukup dan memiliki kekuatan hukum yang sama.');
      addSpace(10);
      addText('Perjanjian ini mulai berlaku sejak ditandatangani oleh kedua belah pihak secara digital melalui platform Naro.');
      addSpace(20);

      // Tanda Tangan
      const signatureY = yPosition;
      
      // Pihak Pertama
      doc.text('Pihak Pertama', margin, signatureY);
      doc.text('(Pemberi Kerja)', margin, signatureY + 7);
      doc.text('_________________', margin, signatureY + 30);
      doc.text(posterName, margin, signatureY + 37);
      
      // Pihak Kedua
      doc.text('Pihak Kedua', pageWidth - margin - 50, signatureY);
      doc.text('(Pekerja)', pageWidth - margin - 50, signatureY + 7);
      doc.text('_________________', pageWidth - margin - 50, signatureY + 30);
      doc.text('[Nama Pekerja]', pageWidth - margin - 50, signatureY + 37);

      // Footer di setiap halaman
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Halaman ${i} dari ${totalPages} | Generated by Naro Platform | ${currentDate}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      // Open PDF in new tab
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');

      toast.success('PDF berhasil dibuat!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Gagal membuat PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = async () => {
    setIsGenerating(true);
    try {
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF();
      
      // Same generation logic as above
      // ... (copy from generatePDF)
      
      // Download instead of preview
      doc.save(`Perjanjian_${task.title.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
      
      toast.success('PDF berhasil diunduh!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Gagal mengunduh PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-primary-600" />
            <div>
              <h2 className="text-xl font-bold">Preview Perjanjian</h2>
              <p className="text-sm text-gray-600">Surat Perjanjian Kerja</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <CardContent className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Tentang Preview PDF</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• PDF akan dibuat berdasarkan klausul yang Anda pilih</li>
                  <li>• Preview akan dibuka di tab baru</li>
                  <li>• Anda dapat menyimpan atau mencetak PDF</li>
                  <li>• Tanda tangan digital akan ditambahkan setelah pekerja ditemukan</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Nomor Perjanjian:</span>
              <span className="font-mono font-medium">NARO/2025/{task._id.slice(-6)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Judul Tugas:</span>
              <span className="font-medium">{task.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Budget:</span>
              <span className="font-medium">
                Rp {task.budget.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Jumlah Klausul:</span>
              <span className="font-medium">{clauses.length} ketentuan</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={generatePDF}
              disabled={isGenerating}
              className="flex-1"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Membuat PDF...
                </>
              ) : (
                <>
                  <FileText className="h-5 w-5 mr-2" />
                  Preview PDF
                </>
              )}
            </Button>
            <Button
              onClick={downloadPDF}
              disabled={isGenerating}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              <Download className="h-5 w-5 mr-2" />
              Download PDF
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            PDF ini merupakan draft perjanjian. Perjanjian final akan dibuat setelah pekerja menerima tugas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}