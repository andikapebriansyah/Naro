'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Header } from '@/components/layouts/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, CheckCircle, AlertTriangle, FileText, Scale } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function WorkerAgreementPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const jobId = params.id as string;
  
  // Get action type: 'apply' or 'accept'
  const action = searchParams.get('action') || 'apply';
  const from = searchParams.get('from') || 'job-detail';

  const [job, setJob] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState(''); // ✅ State untuk pesan lamaran

  useEffect(() => {
    fetchJobDetail();
    
    // ✅ Ambil pesan dari sessionStorage jika action adalah apply
    if (action === 'apply') {
      const savedMessage = sessionStorage.getItem('applicationMessage');
      if (savedMessage) {
        setApplicationMessage(savedMessage);
        // Hapus dari sessionStorage setelah diambil
        sessionStorage.removeItem('applicationMessage');
      }
    }
  }, [jobId, action]);

  const fetchJobDetail = async () => {
    try {
      const response = await fetch(`/api/tasks/${jobId}`);
      const data = await response.json();
      if (data.success) {
        setJob(data.data);
      } else {
        toast.error(data.error || 'Gagal memuat detail pekerjaan');
        router.back();
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat memuat data');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!hasAgreed || !hasReadTerms) {
      toast.error('Anda harus menyetujui semua ketentuan sebelum melanjutkan');
      return;
    }

    // ✅ Validasi message untuk action apply
    if (action === 'apply' && !applicationMessage.trim()) {
      toast.error('Silakan tulis pesan lamaran Anda');
      return;
    }

    setIsSubmitting(true);

    try {
      let endpoint = '';
      let method = 'POST';
      let successMessage = '';
      let requestBody: any = {
        agreedToTerms: true,
        agreedAt: new Date().toISOString(),
      };

      if (action === 'apply') {
        endpoint = `/api/tasks/${jobId}/apply`;
        successMessage = 'Lamaran berhasil dikirim!';
        // ✅ Gunakan message dari input user
        requestBody.message = applicationMessage.trim();
      } else if (action === 'accept') {
        endpoint = `/api/tasks/${jobId}/accept-offer`;
        successMessage = 'Pekerjaan berhasil diterima!';
      }

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(successMessage);
        // ✅ Redirect ke dashboard untuk kedua action (apply dan accept)
        router.push('/dashboard');
      } else {
        toast.error(data.error || 'Terjadi kesalahan');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat memproses permintaan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary-600" />
            <p className="text-gray-600">Memuat perjanjian kerja...</p>
          </div>
        </div>
      </>
    );
  }

  if (!job) {
    return null;
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-6">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="mb-6">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>

            <div className="text-center mb-6">
              <Scale className="w-12 h-12 text-primary-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Perjanjian Kerja
              </h1>
              <p className="text-gray-600">
                {action === 'apply' 
                  ? 'Baca dan setujui ketentuan sebelum melamar pekerjaan'
                  : 'Baca dan setujui ketentuan sebelum menerima pekerjaan'
                }
              </p>
            </div>
          </div>

          {/* Job Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Detail Pekerjaan</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{job.title}</h3>
                  <p className="text-gray-600 mb-3">{job.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <span className="font-medium text-gray-700 w-24">Pemberi Kerja:</span>
                      <span>{job.postedBy?.name || 'Tidak tersedia'}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="font-medium text-gray-700 w-24">Lokasi:</span>
                      <span>{job.location || 'Tidak tersedia'}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="font-medium text-gray-700 w-24">Jadwal:</span>
                      <span>{job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString('id-ID') : 'Fleksibel'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-600">
                      {formatCurrency(job.budget)}
                    </div>
                    <div className="text-sm text-gray-500">Total Bayaran</div>
                  </div>

                  {job.category && (
                    <div className="text-right">
                      <Badge variant="outline">{job.category}</Badge>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contract Terms */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-700">
                <AlertTriangle className="w-5 h-5" />
                <span>Syarat dan Ketentuan Perjanjian Kerja</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Employer's Clauses */}
              {job.agreement && job.agreement.clauses && job.agreement.clauses.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-4 text-gray-900">
                    Klausul Khusus dari Pemberi Kerja
                  </h3>
                  <div className="space-y-4">
                    {job.agreement.clauses.map((clause: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 bg-blue-50">
                        <h4 className="font-semibold text-blue-900 mb-2">
                          {clause.title}
                        </h4>
                        <p className="text-sm text-blue-800">{clause.description}</p>
                      </div>
                    ))}
                  </div>

                  {job.agreement.customClauses && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-blue-50 mt-4">
                      <h4 className="font-semibold text-blue-900 mb-2">
                        Ketentuan Tambahan
                      </h4>
                      <p className="text-sm text-blue-800 whitespace-pre-wrap">
                        {job.agreement.customClauses}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Standard Platform Terms */}
              <div>
                <h3 className="font-semibold text-lg mb-4 text-gray-900">
                  Ketentuan Umum Platform Naro
                </h3>
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      1. Kewajiban Pekerja
                    </h4>
                    <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                      <li>Menyelesaikan pekerjaan sesuai deskripsi dan standar kualitas yang diminta</li>
                      <li>Mematuhi jadwal yang telah disepakati</li>
                      <li>Berkomunikasi secara profesional dengan pemberi kerja</li>
                      <li>Melaporkan kendala atau perubahan kondisi pekerjaan</li>
                      <li>Menjaga kerahasiaan informasi yang diperoleh selama bekerja</li>
                    </ul>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      2. Hak Pekerja
                    </h4>
                    <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                      <li>Menerima pembayaran sesuai kesepakatan setelah pekerjaan selesai</li>
                      <li>Bekerja dalam lingkungan yang aman dan sehat</li>
                      <li>Mendapat informasi yang jelas mengenai pekerjaan</li>
                      <li>Mengajukan komplain jika terjadi pelanggaran</li>
                    </ul>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      3. Sistem Pembayaran
                    </h4>
                    <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                      <li>Pembayaran ditahan oleh platform hingga pekerjaan dikonfirmasi selesai</li>
                      <li>Pencairan dana maksimal 24 jam setelah konfirmasi pemberi kerja</li>
                      <li>Platform akan memotong biaya layanan sesuai ketentuan</li>
                    </ul>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      4. Kebijakan Pembatalan dan Sanksi
                    </h4>
                    <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                      <li>Pembatalan tanpa alasan kuat akan mempengaruhi rating dan reputasi</li>
                      <li>Keterlambatan berulang dapat menyebabkan suspensi akun</li>
                      <li>Pelanggaran berat dapat menyebabkan pemblokiran permanen</li>
                      <li>Sengketa diselesaikan melalui mediasi platform terlebih dahulu</li>
                    </ul>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      5. Tanggung Jawab Hukum
                    </h4>
                    <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                      <li>Pekerja bertanggung jawab atas kerusakan yang disebabkan oleh kelalaian</li>
                      <li>Pelanggaran kontrak dapat dikenakan sanksi hukum sesuai peraturan yang berlaku</li>
                      <li>Platform bertindak sebagai mediator dan tidak bertanggung jawab atas sengketa langsung</li>
                      <li>Hukum Republik Indonesia berlaku untuk semua perjanjian</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Agreement Checkboxes */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="readTerms"
                    checked={hasReadTerms}
                    onChange={(e) => setHasReadTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="readTerms" className="text-sm text-gray-700">
                    Saya telah membaca dan memahami seluruh syarat dan ketentuan di atas
                  </label>
                </div>

                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    checked={hasAgreed}
                    onChange={(e) => setHasAgreed(e.target.checked)}
                    className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="agreeTerms" className="text-sm text-gray-700">
                    <strong>Saya menyetujui untuk terikat dengan perjanjian ini</strong> dan memahami bahwa 
                    pelanggaran terhadap ketentuan dapat berakibat pada konsekuensi hukum sesuai 
                    peraturan perundang-undangan yang berlaku di Republik Indonesia.
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-8">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="flex-1"
            >
              Batalkan
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={!hasAgreed || !hasReadTerms || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {action === 'apply' ? 'Setuju & Lamar Pekerjaan' : 'Setuju & Terima Pekerjaan'}
                </>
              )}
            </Button>
          </div>

          {/* Legal Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mx-auto mb-2" />
            <p className="text-sm text-yellow-800">
              <strong>Pemberitahuan Hukum:</strong> Dengan menyetujui perjanjian ini, Anda terikat secara hukum 
              untuk memenuhi semua kewajiban yang tercantum. Pelanggaran dapat berakibat pada tindakan hukum.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}