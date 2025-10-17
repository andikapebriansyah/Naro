'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Header } from '@/components/layouts/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PDFPreview } from '@/components/features/tasks/PDFPreview';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const defaultClauses = [
  {
    id: 'working_hours',
    title: 'Jam Kerja',
    description:
      'Pekerjaan dilaksanakan sesuai jadwal yang telah ditentukan. Keterlambatan lebih dari 30 menit harus dikonfirmasi sebelumnya.',
    isRequired: true,
  },
  {
    id: 'scope',
    title: 'Ruang Lingkup Pekerjaan',
    description:
      'Pekerjaan mencakup seluruh area yang disebutkan dalam deskripsi tugas. Penambahan pekerjaan di luar scope memerlukan persetujuan terpisah.',
    isRequired: true,
  },
  {
    id: 'payment',
    title: 'Ketentuan Pembayaran',
    description:
      'Pembayaran akan ditahan oleh platform dan akan dicairkan ke pekerja maksimal 24 jam setelah pemberi kerja mengkonfirmasi penyelesaian tugas.',
    isRequired: true,
  },
  {
    id: 'cancellation',
    title: 'Kebijakan Pembatalan',
    description:
      'Pembatalan oleh pemberi kerja 24 jam sebelum jadwal akan dikenakan biaya admin. Pembatalan oleh pekerja tanpa alasan kuat akan mempengaruhi rating.',
    isRequired: true,
  },
  {
    id: 'liability',
    title: 'Tanggung Jawab & Liabilitas',
    description:
      'Pekerja bertanggung jawab atas kerusakan yang disebabkan oleh kelalaian dalam bekerja. Pemberi kerja wajib menyediakan lingkungan kerja yang aman.',
    isRequired: false,
  },
  {
    id: 'equipment',
    title: 'Peralatan & Bahan',
    description:
      'Pekerja wajib membawa peralatan kerja sendiri kecuali disebutkan lain. Bahan habis pakai disediakan oleh pemberi kerja atau dibebankan terpisah.',
    isRequired: false,
  },
  {
    id: 'confidentiality',
    title: 'Kerahasiaan',
    description:
      'Pekerja tidak diperkenankan membagikan informasi pribadi atau kondisi properti pemberi kerja kepada pihak ketiga tanpa izin.',
    isRequired: false,
  },
];

export default function AgreementPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const taskId = params.id as string;

  const [task, setTask] = useState<any>(null);
  const [selectedClauses, setSelectedClauses] = useState<string[]>(
    defaultClauses.filter((c) => c.isRequired).map((c) => c.id)
  );
  const [customClauses, setCustomClauses] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`);
      const data = await response.json();
      if (data.success) {
        setTask(data.data);
      }
    } catch (error) {
      toast.error('Gagal memuat data tugas');
    }
  };

  const toggleClause = (clauseId: string) => {
    const clause = defaultClauses.find((c) => c.id === clauseId);
    if (clause?.isRequired) return;

    setSelectedClauses((prev) =>
      prev.includes(clauseId) ? prev.filter((id) => id !== clauseId) : [...prev, clauseId]
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const clauses = defaultClauses.filter((c) => selectedClauses.includes(c.id));

      const response = await fetch(`/api/tasks/${taskId}/agreement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clauses,
          customClauses,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Perjanjian berhasil disimpan!');
        
        // ROUTING LOGIC BERDASARKAN SEARCH METHOD DAN APAKAH ADA PEKERJA YANG ASSIGNED
        if (task.assignedTo) {
          // Jika sudah ada pekerja yang ditugaskan (dari cari pekerja), langsung ke konfirmasi
          router.push(`/tugas/${taskId}/konfirmasi`);
        } else if (task.searchMethod === 'publish') {
          // Jika pilih "Publikasikan" dan belum ada pekerja, langsung ke konfirmasi
          router.push(`/tugas/${taskId}/konfirmasi`);
        } else {
          // Fallback case - seharusnya tidak terjadi jika flow sudah benar
          router.push(`/tugas/${taskId}/konfirmasi`);
        }
      } else {
        toast.error(data.error || 'Terjadi kesalahan');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat menyimpan perjanjian');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!task) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 border-b-2 border-primary-600 mx-auto animate-spin" />
            <p className="mt-4 text-gray-600">Memuat...</p>
          </div>
        </div>
      </>
    );
  }

  const getSelectedClausesData = () => {
    return defaultClauses.filter((c) => selectedClauses.includes(c.id));
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Surat Perjanjian</CardTitle>
              <p className="text-gray-600">Atur ketentuan pekerjaan</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Task Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center space-x-2">
                  <span>📋</span>
                  <span>Ringkasan Tugas</span>
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Judul:</span>
                    <span className="font-medium">{task.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kategori:</span>
                    <span className="font-medium">{task.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lokasi:</span>
                    <span className="font-medium">{task.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Budget:</span>
                    <span className="font-medium">Rp {task.budget.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Metode:</span>
                    <span className="font-medium">
                      {task.searchMethod === 'publish' ? '📢 Publikasikan' : '🔎 Cari Pekerja'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Clauses */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Klausul Perjanjian</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowPDFPreview(true)}
                  >
                    👁️ Lihat PDF
                  </Button>
                </div>

                <div className="space-y-3">
                  {defaultClauses.map((clause) => {
                    const isSelected = selectedClauses.includes(clause.id);
                    const isDisabled = clause.isRequired;

                    return (
                      <div
                        key={clause.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                        } ${isDisabled ? 'opacity-75' : ''}`}
                        onClick={() => !isDisabled && toggleClause(clause.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isDisabled}
                            onChange={() => {}}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold mb-1">{clause.title}</h4>
                              {clause.isRequired && (
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                                  Wajib
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{clause.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Clauses */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center space-x-2">
                  <span>✏️</span>
                  <span>Klausul Tambahan (Opsional)</span>
                </h3>
                <textarea
                  className="w-full min-h-[100px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Tambahkan ketentuan khusus lainnya yang ingin Anda masukkan..."
                  value={customClauses}
                  onChange={(e) => setCustomClauses(e.target.value)}
                />
              </div>

              {/* Preview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Preview Perjanjian</h3>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowPDFPreview(true)}
                  >
                    👁️ Lihat PDF Lengkap
                  </Button>
                </div>
                <div className="bg-white rounded p-4 text-sm space-y-2 max-h-64 overflow-y-auto">
                  <h4 className="font-bold text-center">SURAT PERJANJIAN KERJA</h4>
                  <p>
                    <strong>Nomor:</strong> NARO/2025/{taskId.slice(-6)}
                  </p>
                  <p className="mt-2">
                    Perjanjian ini dibuat pada tanggal{' '}
                    {new Date().toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}{' '}
                    antara:
                  </p>
                  <p className="mt-2">
                    <strong>Pemberi Kerja:</strong>
                    <br />
                    {session?.user.name || '[Nama akan diisi otomatis]'}
                  </p>
                  <p className="mt-2">
                    <strong>Pekerja:</strong>
                    <br />
                    [Akan diisi setelah pekerja ditemukan]
                  </p>
                  <p className="mt-2 text-gray-500">
                    ... [Ketentuan lengkap akan ditampilkan di dokumen final]
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-4">
                <Button variant="outline" className="flex-1" onClick={() => router.back()}>
                  Kembali
                </Button>
                <Button className="flex-1" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      Lanjut ke Konfirmasi →
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* PDF Preview Modal */}
      {showPDFPreview && (
        <PDFPreview
          task={task}
          clauses={getSelectedClausesData()}
          customClauses={customClauses}
          posterName={session?.user.name || 'Nama Pemberi Kerja'}
          onClose={() => setShowPDFPreview(false)}
        />
      )}
    </>
  );
}