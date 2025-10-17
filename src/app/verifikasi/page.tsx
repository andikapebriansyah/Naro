'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, CheckCircle, XCircle, Clock, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function VerificationPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [ktpImage, setKtpImage] = useState<File | null>(null);
  const [selfieImage, setSelfieImage] = useState<File | null>(null);
  const [ktpPreview, setKtpPreview] = useState<string>('');
  const [selfiePreview, setSelfiePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);

  const handleKtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 5MB');
        return;
      }

      setKtpImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setKtpPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 5MB');
        return;
      }

      setSelfieImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelfiePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ktpImage || !selfieImage) {
      toast.error('Mohon upload kedua foto');
      return;
    }

    setIsSubmitting(true);
    setExtractedData(null);

    const loadingToast = toast.loading('Memproses verifikasi dan membaca KTP...');

    try {
      const formData = new FormData();
      formData.append('ktpImage', ktpImage);
      formData.append('selfieImage', selfieImage);

      const response = await fetch('/api/verifications/submit', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      toast.dismiss(loadingToast);

      if (data.success) {
        // Show extracted data if available
        const extractedKTPData = data.data?.extractedData;
        console.log('API Response data:', data); // Debug log
        
        if (extractedKTPData && Object.keys(extractedKTPData).length > 0) {
          setExtractedData(extractedKTPData);
          toast.success('Verifikasi berhasil diajukan! Data KTP berhasil dibaca.', {
            duration: 5000,
          });
        } else {
          toast.success('Verifikasi berhasil diajukan!');
        }

        // Redirect after 2 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        toast.error(data.error || 'Terjadi kesalahan', {
          description: data.details?.missingFields 
            ? `Field yang tidak terdeteksi: ${data.details.missingFields.join(', ')}`
            : undefined,
        });
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Terjadi kesalahan saat mengirim verifikasi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="container mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2 mb-2">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <CardTitle>Verifikasi Identitas</CardTitle>
                  <CardDescription>Upload KTP untuk verifikasi akun (dengan OCR otomatis)</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">
                  🔒 Mengapa perlu verifikasi?
                </h3>
                <p className="text-sm text-blue-800 mb-2">
                  Verifikasi identitas diperlukan untuk memastikan keamanan dan kepercayaan semua pengguna Naro. Data Anda akan dijaga kerahasiaannya.
                </p>
                <p className="text-sm text-blue-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>Sistem akan otomatis membaca data KTP Anda menggunakan OCR</span>
                </p>
              </div>

              {/* Extracted Data Display */}
              {extractedData && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Data KTP Berhasil Dibaca
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {extractedData.nik && (
                      <div>
                        <span className="text-gray-600">NIK:</span>
                        <p className="font-medium">{extractedData.nik}</p>
                      </div>
                    )}
                    {extractedData.nama && (
                      <div>
                        <span className="text-gray-600">Nama:</span>
                        <p className="font-medium">{extractedData.nama}</p>
                      </div>
                    )}
                    {extractedData.tempatLahir && (
                      <div>
                        <span className="text-gray-600">Tempat Lahir:</span>
                        <p className="font-medium">{extractedData.tempatLahir}</p>
                      </div>
                    )}
                    {extractedData.tanggalLahir && (
                      <div>
                        <span className="text-gray-600">Tanggal Lahir:</span>
                        <p className="font-medium">{extractedData.tanggalLahir}</p>
                      </div>
                    )}
                    {extractedData.jenisKelamin && (
                      <div>
                        <span className="text-gray-600">Jenis Kelamin:</span>
                        <p className="font-medium">{extractedData.jenisKelamin}</p>
                      </div>
                    )}
                    {extractedData.alamat && (
                      <div className="col-span-2">
                        <span className="text-gray-600">Alamat:</span>
                        <p className="font-medium">{extractedData.alamat}</p>
                      </div>
                    )}
                    {extractedData.rtRw && (
                      <div>
                        <span className="text-gray-600">RT/RW:</span>
                        <p className="font-medium">{extractedData.rtRw}</p>
                      </div>
                    )}
                    {extractedData.agama && (
                      <div>
                        <span className="text-gray-600">Agama:</span>
                        <p className="font-medium">{extractedData.agama}</p>
                      </div>
                    )}
                    {extractedData.statusPerkawinan && (
                      <div>
                        <span className="text-gray-600">Status Perkawinan:</span>
                        <p className="font-medium">{extractedData.statusPerkawinan}</p>
                      </div>
                    )}
                    {extractedData.pekerjaan && (
                      <div>
                        <span className="text-gray-600">Pekerjaan:</span>
                        <p className="font-medium">{extractedData.pekerjaan}</p>
                      </div>
                    )}
                    {extractedData.kewarganegaraan && (
                      <div>
                        <span className="text-gray-600">Kewarganegaraan:</span>
                        <p className="font-medium">{extractedData.kewarganegaraan}</p>
                      </div>
                    )}
                    {extractedData.berlakuHingga && (
                      <div>
                        <span className="text-gray-600">Berlaku Hingga:</span>
                        <p className="font-medium">{extractedData.berlakuHingga}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Upload KTP */}
                <div>
                  <Label className="text-base font-semibold mb-2 block">
                    1. Upload Foto KTP
                  </Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleKtpChange}
                      className="hidden"
                      id="ktp-upload"
                      disabled={isSubmitting}
                    />
                    <label htmlFor="ktp-upload" className="cursor-pointer">
                      {ktpPreview ? (
                        <img
                          src={ktpPreview}
                          alt="KTP Preview"
                          className="max-h-48 mx-auto rounded-lg"
                        />
                      ) : (
                        <>
                          <Upload className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                          <p className="font-medium">Ambil atau pilih foto KTP</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Format: JPG, PNG (Max 5MB)
                          </p>
                        </>
                      )}
                    </label>
                  </div>
                  {ktpImage && (
                    <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Foto KTP siap: {ktpImage.name}
                    </p>
                  )}
                </div>

                {/* Upload Selfie */}
                <div>
                  <Label className="text-base font-semibold mb-2 block">
                    2. Upload Selfie dengan KTP
                  </Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSelfieChange}
                      className="hidden"
                      id="selfie-upload"
                      disabled={isSubmitting}
                    />
                    <label htmlFor="selfie-upload" className="cursor-pointer">
                      {selfiePreview ? (
                        <img
                          src={selfiePreview}
                          alt="Selfie Preview"
                          className="max-h-48 mx-auto rounded-lg"
                        />
                      ) : (
                        <>
                          <Upload className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                          <p className="font-medium">Ambil atau pilih foto selfie</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Pastikan wajah dan KTP terlihat jelas
                          </p>
                        </>
                      )}
                    </label>
                  </div>
                  {selfieImage && (
                    <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Foto Selfie siap: {selfieImage.name}
                    </p>
                  )}
                </div>

                {/* Requirements */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Persyaratan Foto:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start space-x-2 text-sm">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Foto KTP harus jelas dan tidak blur</span>
                    </li>
                    <li className="flex items-start space-x-2 text-sm">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Semua informasi pada KTP dapat terbaca</span>
                    </li>
                    <li className="flex items-start space-x-2 text-sm">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Selfie harus menunjukkan wajah dan KTP dengan jelas</span>
                    </li>
                    <li className="flex items-start space-x-2 text-sm">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Pencahayaan yang cukup</span>
                    </li>
                    <li className="flex items-start space-x-2 text-sm">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Sistem akan otomatis membaca NIK, Nama, dan data lainnya</span>
                    </li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={!ktpImage || !selfieImage || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Memproses & Membaca KTP...
                    </>
                  ) : (
                    'Kirim Verifikasi'
                  )}
                </Button>
              </form>

              {/* Status Info */}
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <p className="text-sm font-medium text-yellow-900">
                    Proses verifikasi membutuhkan waktu 1-2 hari kerja
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}