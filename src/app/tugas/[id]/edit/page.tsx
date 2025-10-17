'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Header } from '@/components/layouts/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { ProfileGuard } from '@/components/guards/ProfileGuard';
import { WorkerRecommendation } from '@/components/features/tasks/WorkerRecommendation';

const categories = [
  { value: 'kebersihan', label: 'Kebersihan & Perawatan' },
  { value: 'teknisi', label: 'Teknisi & Perbaikan' },
  { value: 'renovasi', label: 'Renovasi & Konstruksi' },
  { value: 'tukang', label: 'Tukang & Pertukangan' },
  { value: 'angkut', label: 'Angkut & Pindahan' },
  { value: 'taman', label: 'Taman & Landscaping' },
  { value: 'lainnya', label: 'Lainnya' },
];

interface EditTaskPageProps {
  params: { id: string };
}

export default function EditTaskPage({ params }: EditTaskPageProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [task, setTask] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    locationCoordinates: { lat: 0, lng: 0 },
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    budget: '',
    pricingType: 'fixed' as 'fixed' | 'hourly' | 'daily' | 'weekly' | 'monthly',
    searchMethod: 'publication' as 'publication' | 'find_worker',
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [showMapModal, setShowMapModal] = useState(false);
  const [tempCoordinates, setTempCoordinates] = useState({ lat: 0, lng: 0 });

  useEffect(() => {
    if (session) {
      fetchTask();
    }
  }, [session]);

  const fetchTask = async () => {
    try {
      const response = await fetch(`/api/tasks/${params.id}`);
      const data = await response.json();
      
      if (data.success) {
        const taskData = data.data;
        setTask(taskData);
        
        // Populate form with existing data
        setFormData({
          title: taskData.title || '',
          description: taskData.description || '',
          category: taskData.category || '',
          location: taskData.location || '',
          locationCoordinates: taskData.locationCoordinates || { lat: 0, lng: 0 },
          startDate: taskData.startDate ? new Date(taskData.startDate).toISOString().split('T')[0] : '',
          startTime: taskData.startTime || '',
          endDate: taskData.endDate ? new Date(taskData.endDate).toISOString().split('T')[0] : '',
          endTime: taskData.endTime || '',
          budget: taskData.budget?.toString() || '',
          pricingType: taskData.pricingType || 'fixed',
          searchMethod: taskData.searchMethod || 'publication',
        });
        
        // Load existing photos
        if (taskData.photos && taskData.photos.length > 0) {
          setPhotoPreviews(taskData.photos);
        }
      }
    } catch (error) {
      console.error('Error fetching task:', error);
      toast.error('Gagal memuat data tugas');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 5) {
      toast.error('Maksimal 5 foto');
      return;
    }

    setPhotos([...photos, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
    setPhotoPreviews(photoPreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.category || !formData.budget || !formData.description || !formData.location || !formData.startDate || !formData.startTime || !formData.endDate || !formData.endTime) {
      toast.error('Mohon lengkapi semua field yang wajib');
      return;
    }

    setIsSaving(true);

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'locationCoordinates') {
          data.append(key, JSON.stringify(value));
        } else {
          data.append(key, value.toString());
        }
      });

      photos.forEach((photo) => {
        data.append('photos', photo);
      });

      // Add existing photos to preserve them
      photoPreviews.forEach((photoUrl) => {
        data.append('existingPhotos', photoUrl);
      });

      const response = await fetch(`/api/tasks/${params.id}`, {
        method: 'PUT',
        body: data,
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Tugas berhasil diperbarui!');
        
        // Arahkan berdasarkan metode pencarian yang dipilih
        if (formData.searchMethod === 'find_worker') {
          // Jika pilih "Cari Pekerja", arahkan ke halaman cari pekerja
          router.push(`/tugas/${params.id}/cari-pekerja`);
        } else {
          // Jika pilih "Publikasikan", ke surat perjanjian
          router.push(`/tugas/${params.id}/perjanjian`);
        }
      } else {
        toast.error(result.error || 'Gagal menyimpan perubahan');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Terjadi kesalahan saat menyimpan');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 pt-20">
          <div className="container mx-auto px-4 py-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Memuat data tugas...</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!task) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 pt-20">
          <div className="container mx-auto px-4 py-6">
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-500">Tugas tidak ditemukan</p>
                <Button onClick={() => router.back()} className="mt-4">
                  Kembali
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </>
    );
  }

  // Check if task can be edited
  const canEdit = ['draft', 'open', 'pending'].includes(task.status);

  if (!canEdit) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 pt-20">
          <div className="container mx-auto px-4 py-6">
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-500">Tugas ini tidak dapat diedit karena sudah dalam proses atau selesai</p>
                <Button onClick={() => router.back()} className="mt-4">
                  Kembali
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </>
    );
  }

  return (
    <ProfileGuard
      requiresVerification={true}
      requiresBasicProfile={true}
      fallbackUrl="/dashboard"
    >
      <Header />
      <main className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="container mx-auto max-w-3xl">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Edit Tugas</CardTitle>
                  <p className="text-gray-600">Perbarui detail pekerjaan</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informasi Dasar */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <span>📝</span>
                    <span>Informasi Dasar</span>
                  </h3>

                  <div>
                    <Label htmlFor="title">
                      Judul Tugas <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      placeholder="Contoh: Bersihkan Rumah 2 Lantai"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">
                      Kategori <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="category"
                      className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                    >
                      <option value="">Pilih kategori</option>
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="description">
                      Deskripsi Detail <span className="text-red-500">*</span>
                    </Label>
                    <textarea
                      id="description"
                      className="w-full min-h-[120px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Jelaskan detail pekerjaan yang dibutuhkan..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Foto Referensi */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <span>📸</span>
                    <span>Foto Referensi</span>
                  </h3>

                  <div className="grid grid-cols-3 gap-4">
                    {photoPreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    ))}

                    {photos.length < 5 && (
                      <label className="border-2 border-dashed border-gray-300 rounded-lg h-24 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 transition-colors">
                        <Upload className="h-6 w-6 text-gray-400" />
                        <span className="text-xs text-gray-500 mt-1">Tambah</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start space-x-2">
                    <span className="text-blue-500">💡</span>
                    <div className="text-sm text-blue-700">
                      <p>Foto yang jelas akan membantu pekerja memahami tugas dengan lebih baik</p>
                    </div>
                  </div>
                </div>

                {/* Lokasi & Jadwal */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <span>📍</span>
                    <span>Lokasi & Jadwal</span>
                  </h3>

                  <div>
                    <Label htmlFor="location">
                      Alamat Lokasi <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="location"
                        placeholder="Contoh: Jl. T. Nyak Arief No. 123, Banda Aceh"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        required
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setTempCoordinates(formData.locationCoordinates || { lat: 0, lng: 0 });
                          setShowMapModal(true);
                        }}
                        className="px-3"
                      >
                        📍 Maps
                      </Button>
                    </div>
                    {(formData.locationCoordinates && formData.locationCoordinates.lat !== 0 && formData.locationCoordinates.lng !== 0) && (
                      <div className="text-xs text-green-600 mt-1">
                        ✓ Koordinat: {formData.locationCoordinates.lat.toFixed(6)}, {formData.locationCoordinates.lng.toFixed(6)}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">
                        Tanggal Mulai <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">
                        Tanggal Berakhir <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        min={formData.startDate}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startTime">
                        Waktu Masuk <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime">
                        Waktu Pulang <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start space-x-2">
                    <span className="text-blue-500">💡</span>
                    <div className="text-sm text-blue-700">
                      <p>• Koordinat GPS membantu pekerja menemukan lokasi dengan akurat</p>
                      <p>• Pastikan waktu masuk dan pulang sesuai dengan kebutuhan pekerjaan</p>
                    </div>
                  </div>
                </div>

                {/* Budget */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <span>💰</span>
                    <span>Budget & Pembayaran</span>
                  </h3>

                  <div>
                    <Label>
                      Tipe Pembayaran <span className="text-red-500">*</span>
                    </Label>
                    <select
                      className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 mt-2"
                      value={formData.pricingType}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        pricingType: e.target.value as 'fixed' | 'hourly' | 'daily' | 'weekly' | 'monthly'
                      })}
                      required
                    >
                      <option value="fixed">Harga Tetap</option>
                      <option value="hourly">Per Jam</option>
                      <option value="daily">Per Hari</option>
                      <option value="weekly">Per Minggu</option>
                      <option value="monthly">Per Bulan</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="budget">
                      Budget{' '}
                      {formData.pricingType === 'hourly' && '(per jam)'}
                      {formData.pricingType === 'daily' && '(per hari)'}
                      {formData.pricingType === 'weekly' && '(per minggu)'}
                      {formData.pricingType === 'monthly' && '(per bulan)'}
                      {' '}<span className="text-red-500">*</span>
                    </Label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        Rp
                      </span>
                      <Input
                        id="budget"
                        type="number"
                        placeholder={
                          formData.pricingType === 'hourly' ? '50000' :
                          formData.pricingType === 'daily' ? '300000' :
                          formData.pricingType === 'weekly' ? '1500000' :
                          formData.pricingType === 'monthly' ? '5000000' :
                          '150000'
                        }
                        className="rounded-l-none"
                        value={formData.budget}
                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                        required
                      />
                    </div>
                    {formData.pricingType !== 'fixed' && (
                      <div className="text-xs text-gray-600 mt-1">
                        {formData.pricingType === 'hourly' && 'Total akan dihitung berdasarkan jam kerja aktual'}
                        {formData.pricingType === 'daily' && 'Total akan dihitung berdasarkan hari kerja'}
                        {formData.pricingType === 'weekly' && 'Total akan dihitung berdasarkan minggu kerja'}
                        {formData.pricingType === 'monthly' && 'Total akan dihitung berdasarkan bulan kerja'}
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start space-x-2">
                    <span className="text-blue-500">ℹ️</span>
                    <p className="text-sm text-blue-700">
                      Budget yang Anda masukkan akan ditahan dan dibayarkan ke pekerja setelah tugas selesai
                    </p>
                  </div>
                </div>

                {/* Cara Mencari Pekerja */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <span>🔍</span>
                    <span>Cara Mencari Pekerja</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div
                      onClick={() => setFormData({ ...formData, searchMethod: 'publication' })}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        formData.searchMethod === 'publication'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-2">📢</div>
                        <h4 className="font-semibold mb-1">Publikasikan</h4>
                        <p className="text-xs text-gray-600">
                          Tugas ditampilkan dan pekerja bisa melamar
                        </p>
                      </div>
                    </div>

                    <div
                      onClick={() => setFormData({ ...formData, searchMethod: 'find_worker' })}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        formData.searchMethod === 'find_worker'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-2">🔎</div>
                        <h4 className="font-semibold mb-1">Cari Pekerja</h4>
                        <p className="text-xs text-gray-600">
                          Pilih pekerja langsung dari daftar
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start space-x-2">
                    <span className="text-blue-500">💡</span>
                    <div className="text-sm text-blue-700">
                      <p className="font-medium mb-1">
                        {formData.searchMethod === 'publication' ? 'Publikasikan' : 'Cari Pekerja'}:
                      </p>
                      <p>
                        {formData.searchMethod === 'publication'
                          ? 'Tugas akan ditampilkan dan pekerja bisa melamar. Anda bisa memilih dari pelamar yang tersedia.'
                          : 'Anda bisa memilih pekerja langsung dari daftar pekerja yang tersedia berdasarkan rating dan pengalaman.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* AI Worker Recommendation - Only show when find_worker is selected */}
                {formData.searchMethod === 'find_worker' && formData.title && formData.description && formData.category && (
                  <WorkerRecommendation
                    jobData={{
                      title: formData.title,
                      description: formData.description,
                      category: formData.category,
                      location: formData.location,
                      locationCoordinates: formData.locationCoordinates
                    }}
                    onWorkerSelect={(worker) => {
                      // Redirect to cari-pekerja page with selected worker
                      router.push(`/tugas/${params.id}/cari-pekerja?workerId=${worker._id}`);
                    }}
                  />
                )}

                <div className="flex space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.back()}
                  >
                    Batal
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isSaving}>
                    {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Koordinat Lokasi Modal */}
        {showMapModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Pilih Lokasi</h3>
                    <p className="text-sm text-gray-500 mt-1">Tentukan koordinat lokasi pekerjaan</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMapModal(false)}
                    className="h-8 w-8 p-0 rounded-full"
                  >
                    ✕
                  </Button>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="text-center mb-6">
                    <div className="text-4xl mb-3">📍</div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Koordinat Lokasi</h4>
                    <p className="text-sm text-gray-600">Masukkan koordinat atau gunakan lokasi saat ini</p>
                  </div>
                  
                  <div className="space-y-4 max-w-sm mx-auto">
                    <div>
                      <Label htmlFor="tempLat">Latitude</Label>
                      <Input
                        id="tempLat"
                        type="number"
                        step="any"
                        placeholder="Contoh: 5.5577"
                        value={tempCoordinates.lat || ''}
                        onChange={(e) => setTempCoordinates({
                          ...tempCoordinates,
                          lat: parseFloat(e.target.value) || 0
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="tempLng">Longitude</Label>
                      <Input
                        id="tempLng"
                        type="number"
                        step="any"
                        placeholder="Contoh: 95.3222"
                        value={tempCoordinates.lng || ''}
                        onChange={(e) => setTempCoordinates({
                          ...tempCoordinates,
                          lng: parseFloat(e.target.value) || 0
                        })}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Button Gunakan Lokasi */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-4 py-3 border-2 border-dashed border-blue-300 hover:border-blue-400 hover:bg-blue-50 text-blue-600 font-medium"
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          setTempCoordinates({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                          });
                          toast.success('Lokasi berhasil dideteksi!');
                        },
                        (error) => {
                          console.error('Error getting location:', error);
                          toast.error('Tidak dapat mengakses lokasi. Pastikan izin lokasi telah diberikan.');
                        }
                      );
                    } else {
                      toast.error('Geolocation tidak didukung oleh browser ini.');
                    }
                  }}
                >
                  <span className="mr-2">📍</span>
                  Gunakan Lokasi Saat Ini
                </Button>
                
                {/* Preview koordinat jika sudah ada */}
                {(tempCoordinates.lat !== 0 && tempCoordinates.lng !== 0) && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                    <div className="flex items-center">
                      <span className="text-green-600 mr-2">✓</span>
                      <div>
                        <p className="text-sm font-medium text-green-800">Koordinat tersimpan</p>
                        <p className="text-xs text-green-600">
                          {tempCoordinates.lat.toFixed(6)}, {tempCoordinates.lng.toFixed(6)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Footer */}
              <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowMapModal(false)}
                    className="px-6"
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={() => {
                      setFormData({
                        ...formData,
                        locationCoordinates: tempCoordinates
                      });
                      setShowMapModal(false);
                      toast.success('Koordinat lokasi berhasil disimpan!');
                    }}
                    disabled={tempCoordinates.lat === 0 || tempCoordinates.lng === 0}
                    className="px-6 bg-blue-600 hover:bg-blue-700"
                  >
                    Simpan Lokasi
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </ProfileGuard>
  );
}