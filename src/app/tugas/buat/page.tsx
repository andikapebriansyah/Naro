'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Header } from '@/components/layouts/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

export default function CreateTaskPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingTaskId, setExistingTaskId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
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
    searchMethod: 'publication' as 'publication' | 'find_worker',
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [showMapModal, setShowMapModal] = useState(false);
  const [tempCoordinates, setTempCoordinates] = useState({ lat: 0, lng: 0 });
  const [selectedWorker, setSelectedWorker] = useState<any>(null);

  // Fungsi untuk mendapatkan minimum date (hari ini) dengan timezone lokal
  const getMinDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fungsi untuk mendapatkan minimum time (3 jam dari sekarang)
  const getMinTime = (selectedDate: string) => {
    if (!selectedDate) return '00:00';
    
    const now = new Date();
    const today = getMinDate();
    
    // Jika tanggal yang dipilih adalah hari ini
    if (selectedDate === today) {
      const minTime = new Date(now.getTime() + 3 * 60 * 60 * 1000); // 3 jam dari sekarang
      const hours = minTime.getHours().toString().padStart(2, '0');
      const minutes = minTime.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    
    return '00:00'; // Untuk hari lain, bisa mulai kapan saja
  };

  // Validasi waktu real-time
  const validateTime = (startDate: string, startTime: string, endDate: string, endTime: string) => {
    if (!startDate || !startTime || !endDate || !endTime) return true;
    
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    const now = new Date();
    const minStartTime = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    const today = getMinDate();
    
    // Cek apakah waktu mulai minimal 3 jam dari sekarang (hanya untuk hari ini)
    if (startDate === today && start < minStartTime) {
      toast.error('Waktu mulai harus minimal 3 jam dari sekarang');
      return false;
    }
    
    // Cek apakah waktu akhir setelah waktu mulai
    if (end <= start) {
      toast.error('Waktu berakhir harus setelah waktu mulai');
      return false;
    }
    
    return true;
  };

  // Handler untuk perubahan startDate
  const handleStartDateChange = (newDate: string) => {
    const today = getMinDate();
    
    // Prevent selecting past dates
    if (newDate < today) {
      toast.error('Tidak bisa memilih tanggal yang sudah lewat');
      setFormData({ ...formData, startDate: today });
      return;
    }
    
    setFormData({ ...formData, startDate: newDate });
    
    // Auto-adjust startTime jika tanggal hari ini
    if (newDate === today) {
      const minTime = getMinTime(newDate);
      if (!formData.startTime || formData.startTime < minTime) {
        setFormData({ ...formData, startDate: newDate, startTime: minTime });
      }
    }
    
    // Auto-adjust endDate jika lebih kecil dari startDate
    if (formData.endDate && formData.endDate < newDate) {
      setFormData({ ...formData, startDate: newDate, endDate: newDate });
    }
  };

  // Handler untuk perubahan startTime
  const handleStartTimeChange = (newTime: string) => {
    const minTime = getMinTime(formData.startDate);
    const today = getMinDate();
    
    // Jika hari ini dan waktu < minimal, set ke minimal
    if (formData.startDate === today && newTime < minTime) {
      toast.error('Waktu mulai harus minimal 3 jam dari sekarang');
      setFormData({ ...formData, startTime: minTime });
      return;
    }
    
    setFormData({ ...formData, startTime: newTime });
    
    // Auto-adjust endTime jika di hari yang sama dan endTime < startTime
    if (formData.endDate === formData.startDate && formData.endTime && formData.endTime <= newTime) {
      // Set endTime 1 jam setelah startTime sebagai default
      const [hours, minutes] = newTime.split(':');
      const newHour = (parseInt(hours) + 1).toString().padStart(2, '0');
      const suggestedEndTime = `${newHour}:${minutes}`;
      setFormData({ ...formData, startTime: newTime, endTime: suggestedEndTime });
      toast.info('Waktu pulang disesuaikan agar setelah waktu masuk');
    }
  };

  // Handler untuk perubahan endTime
  const handleEndTimeChange = (newTime: string) => {
    // Jika tanggal sama, waktu pulang harus setelah waktu masuk
    if (formData.startDate === formData.endDate && formData.startTime) {
      if (newTime <= formData.startTime) {
        toast.error('Waktu pulang harus setelah waktu masuk');
        // Set minimal 1 jam setelah waktu masuk
        const [hours, minutes] = formData.startTime.split(':');
        const newHour = (parseInt(hours) + 1).toString().padStart(2, '0');
        const minEndTime = `${newHour}:${minutes}`;
        setFormData({ ...formData, endTime: minEndTime });
        return;
      }
    }
    
    setFormData({ ...formData, endTime: newTime });
  };

  // Fungsi untuk mendapatkan minimum end time
  const getMinEndTime = () => {
    if (!formData.startTime || !formData.startDate || !formData.endDate) return '00:00';
    
    // Jika tanggal sama, minimal 1 jam setelah waktu masuk
    if (formData.startDate === formData.endDate) {
      const [hours, minutes] = formData.startTime.split(':');
      const minHour = parseInt(hours) + 1;
      
      // Jika sudah lewat jam 23, set ke 23:59
      if (minHour > 23) {
        return '23:59';
      }
      
      return `${minHour.toString().padStart(2, '0')}:${minutes}`;
    }
    
    return '00:00'; // Jika tanggal berbeda, bebas
  };

  // Check if editing existing task (from URL params)
  useEffect(() => {
    const taskId = searchParams.get('edit');
    if (taskId) {
      setExistingTaskId(taskId);
      setIsEditMode(true);
      loadExistingTask(taskId);
    }
  }, [searchParams]);

  // Load existing task data
  const loadExistingTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`);
      const data = await response.json();
      
      if (data.success) {
        const task = data.data;
        setFormData({
          title: task.title || '',
          description: task.description || '',
          category: task.category || '',
          location: task.location || '',
          locationCoordinates: task.locationCoordinates || { lat: 0, lng: 0 },
          startDate: task.startDate ? task.startDate.split('T')[0] : '',
          startTime: task.startTime || '',
          endDate: task.endDate ? task.endDate.split('T')[0] : '',
          endTime: task.endTime || '',
          budget: task.budget?.toString() || '',
          searchMethod: task.searchMethod || 'publication',
        });
        
        // Load photos if available
        if (task.photos && task.photos.length > 0) {
          setPhotoPreviews(task.photos);
        }
      }
    } catch (error) {
      console.error('Error loading existing task:', error);
      toast.error('Gagal memuat data tugas');
    }
  };

  // Load draft from localStorage only if not in edit mode
  useEffect(() => {
    if (!isEditMode) {
      const savedDraft = localStorage.getItem('taskDraft');
      if (savedDraft) {
        try {
          const draftData = JSON.parse(savedDraft);
          setFormData(draftData.formData || formData);
          if (draftData.photoPreviews) {
            setPhotoPreviews(draftData.photoPreviews);
          }
        } catch (error) {
          console.error('Error loading draft:', error);
        }
      }
    }
  }, [isEditMode]);

  // Save draft to localStorage only if not in edit mode
  useEffect(() => {
    if (!isEditMode) {
      const timeoutId = setTimeout(() => {
        const draftData = {
          formData,
          photoPreviews,
          photoCount: photos.length,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem('taskDraft', JSON.stringify(draftData));
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [formData, photoPreviews, photos.length, isEditMode]);

  // Clear draft function
  const clearDraft = () => {
    localStorage.removeItem('taskDraft');
    setFormData({
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
      searchMethod: 'publication',
    });
    setPhotos([]);
    setPhotoPreviews([]);
  };

  // Handle cancel - delete task if in edit mode
  const handleCancel = async () => {
    if (isEditMode && existingTaskId) {
      const confirmed = confirm('Apakah Anda yakin ingin membatalkan? Task yang sudah dibuat akan dihapus.');
      if (confirmed) {
        try {
          const response = await fetch(`/api/tasks/${existingTaskId}`, {
            method: 'DELETE',
          });
          
          if (response.ok) {
            toast.success('Task berhasil dihapus');
            router.push('/dashboard');
          } else {
            toast.error('Gagal menghapus task');
          }
        } catch (error) {
          console.error('Error deleting task:', error);
          toast.error('Terjadi kesalahan saat menghapus task');
        }
      }
    } else {
      router.back();
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validasi jumlah foto
    if (photos.length + files.length > 5) {
      toast.error('Maksimal 5 foto');
      return;
    }

    // Validasi ukuran dan tipe file
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    for (const file of files) {
      if (file.size > maxSize) {
        toast.error(`File ${file.name} terlalu besar. Maksimal 5MB`);
        return;
      }
      if (!allowedTypes.includes(file.type)) {
        toast.error(`File ${file.name} bukan format gambar yang didukung`);
        return;
      }
    }

    setPhotos([...photos, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.onerror = () => {
        toast.error(`Gagal membaca file ${file.name}`);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
    setPhotoPreviews(photoPreviews.filter((_, i) => i !== index));
  };

  const handleWorkerSelect = (worker: any) => {
    setSelectedWorker(worker);
    toast.success(`🤖 ${worker.name} dipilih! Akan langsung ke halaman kontrak setelah tugas disimpan.`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi field wajib
    if (!formData.title || !formData.category || !formData.budget || !formData.description || !formData.location || !formData.startDate || !formData.startTime || !formData.endDate || !formData.endTime) {
      toast.error('Mohon lengkapi semua field yang wajib');
      return;
    }

    // Validasi budget
    const budgetValue = parseFloat(formData.budget);
    if (isNaN(budgetValue) || budgetValue < 20000) {
      toast.error('Budget minimal Rp 20.000');
      return;
    }

    // Validasi waktu
    if (!validateTime(formData.startDate, formData.startTime, formData.endDate, formData.endTime)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'locationCoordinates') {
          data.append(key, JSON.stringify(value));
        } else {
          data.append(key, value.toString());
        }
      });

      // Tambahkan foto dengan validasi
      if (photos.length > 0) {
        photos.forEach((photo, index) => {
          console.log(`Adding photo ${index}:`, { name: photo.name, size: photo.size, type: photo.type });
          data.append('photos', photo);
        });
        console.log('Total photos to upload:', photos.length);
      }

      let response;
      if (isEditMode && existingTaskId) {
        response = await fetch(`/api/tasks/${existingTaskId}`, {
          method: 'PUT',
          body: data,
        });
      } else {
        response = await fetch('/api/tasks/create', {
          method: 'POST',
          body: data,
        });
      }

      const result = await response.json();

      if (result.success) {
        const taskId = result.data._id;
        toast.success(isEditMode ? 'Tugas berhasil diperbarui!' : 'Tugas berhasil dibuat!');
        
        localStorage.removeItem('taskDraft');
        
        if (selectedWorker) {
          const updateResponse = await fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              assignedTo: selectedWorker._id,
              status: 'pending',
              searchMethod: 'find_worker'
            }),
          });

          if (updateResponse.ok) {
            toast.success(`🤖 Pekerja AI ${selectedWorker.name} berhasil ditugaskan!`);
            router.push(`/tugas/${taskId}/perjanjian`);
          } else {
            toast.error('Gagal menugaskan pekerja');
          }
        } else if (formData.searchMethod === 'find_worker') {
          router.push(`/tugas/${taskId}/cari-pekerja`);
        } else {
          router.push(`/tugas/${taskId}/perjanjian`);
        }
      } else {
        toast.error(result.error || 'Terjadi kesalahan');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Terjadi kesalahan saat menyimpan tugas');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

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
                  <CardTitle className="text-2xl">
                    {isEditMode ? 'Edit Tugas' : 'Buat Tugas Baru'}
                  </CardTitle>
                  <p className="text-gray-600">
                    {isEditMode ? 'Perbarui detail pekerjaan' : 'Isi detail pekerjaan yang dibutuhkan'}
                  </p>
                </div>
                {!isEditMode && (formData.title || formData.description || formData.category) && (
                  <div className="text-right">
                    <p className="text-sm text-green-600 mb-1">✓ Draft tersimpan</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearDraft}
                      className="text-xs"
                    >
                      Hapus Draft
                    </Button>
                  </div>
                )}
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
                    <span>Foto Referensi (Opsional)</span>
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
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
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
                          accept="image/jpeg,image/jpg,image/png,image/webp"
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
                      <p>• Maksimal 5 foto, setiap foto maksimal 5MB</p>
                      <p>• Format yang didukung: JPG, PNG, WEBP</p>
                      <p>• Foto yang jelas akan membantu pekerja memahami tugas dengan lebih baik</p>
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
                        min={getMinDate()}
                        value={formData.startDate}
                        onChange={(e) => handleStartDateChange(e.target.value)}
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
                        min={formData.startDate || getMinDate()}
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        required
                        disabled={!formData.startDate}
                      />
                      {!formData.startDate && (
                        <p className="text-xs text-gray-500 mt-1">Pilih tanggal mulai terlebih dahulu</p>
                      )}
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
                        onChange={(e) => handleStartTimeChange(e.target.value)}
                        required
                        disabled={!formData.startDate}
                      />
                      {formData.startDate && formData.startDate === getMinDate() && (
                        <p className="text-xs text-orange-600 mt-1">
                          ⏰ Minimal: {getMinTime(formData.startDate)} (3 jam dari sekarang)
                        </p>
                      )}
                      {!formData.startDate && (
                        <p className="text-xs text-gray-500 mt-1">Pilih tanggal mulai terlebih dahulu</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="endTime">
                        Waktu Pulang <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => handleEndTimeChange(e.target.value)}
                        required
                        disabled={!formData.startTime}
                      />
                      {formData.startDate === formData.endDate && formData.startTime && (
                        <p className="text-xs text-orange-600 mt-1">
                          ⏰ Minimal: {getMinEndTime()} (1 jam setelah waktu masuk)
                        </p>
                      )}
                      {!formData.startTime && (
                        <p className="text-xs text-gray-500 mt-1">Pilih waktu masuk terlebih dahulu</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start space-x-2">
                    <span className="text-blue-500">💡</span>
                    <div className="text-sm text-blue-700">
                      <p>• Waktu mulai minimal 3 jam dari sekarang</p>
                      <p>• Tanggal tidak bisa dipilih yang sudah lewat</p>
                      <p>• Koordinat GPS membantu pekerja menemukan lokasi dengan akurat</p>
                    </div>
                  </div>
                </div>

                {/* Budget */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <span>💰</span>
                    <span>Budget Pembayaran</span>
                  </h3>

                  <div>
                    <Label htmlFor="budget">
                      Budget <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        Rp
                      </span>
                      <Input
                        id="budget"
                        type="text"
                        inputMode="numeric"
                        placeholder="20.000"
                        className="rounded-l-none"
                        value={formData.budget}
                        onChange={(e) => {
                          // Hanya izinkan angka
                          const value = e.target.value.replace(/\D/g, '');
                          
                          // Format dengan titik ribuan
                          const formatted = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                          
                          setFormData({ ...formData, budget: value }); // Simpan nilai asli tanpa format
                        }}
                        onBlur={(e) => {
                          // Validasi saat blur
                          const numValue = parseInt(formData.budget);
                          if (formData.budget && numValue < 20000) {
                            toast.error('Budget minimal Rp 20.000');
                            setFormData({ ...formData, budget: '20000' });
                          }
                        }}
                        required
                      />
                    </div>
                    {formData.budget && (
                      <p className="text-xs text-gray-600 mt-1">
                        {parseInt(formData.budget) >= 20000 ? (
                          <span className="text-green-600">
                            ✓ Rp {parseInt(formData.budget).toLocaleString('id-ID')}
                          </span>
                        ) : (
                          <span className="text-red-600">
                            ✗ Minimal Rp 20.000
                          </span>
                        )}
                      </p>
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
                      onClick={() => {
                        setFormData({ ...formData, searchMethod: 'publication' });
                        setSelectedWorker(null);
                      }}
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
                          Gunakan AI untuk rekomendasi pekerja terbaik
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start space-x-2">
                    <span className="text-blue-500">💡</span>
                    <div className="text-sm text-blue-700">
                      <p className="font-medium mb-1">
                        {formData.searchMethod === 'publication' ? 'Mode Publikasikan' : 'Mode Cari Pekerja Cerdas'}:
                      </p>
                      <p>
                        {formData.searchMethod === 'publication'
                          ? 'Tugas akan ditampilkan dan pekerja bisa melamar. Anda bisa memilih dari pelamar yang tersedia.'
                          : 'Sistem AI akan menganalisis deskripsi pekerjaan Anda dan memberikan rekomendasi pekerja terbaik berdasarkan keahlian, pengalaman, rating, dan lokasi.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rekomendasi Pekerja Cerdas */}
                {formData.searchMethod === 'find_worker' && (
                  <div className="space-y-4">
                    <WorkerRecommendation
                      jobData={{
                        title: formData.title,
                        description: formData.description,
                        category: formData.category,
                        location: formData.location,
                        locationCoordinates: formData.locationCoordinates
                      }}
                      onWorkerSelect={handleWorkerSelect}
                    />
                    
                    {selectedWorker && (
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-blue-600">🤖</span>
                          <span className="font-medium text-blue-900">
                            Pekerja AI Terpilih: {selectedWorker.name}
                          </span>
                        </div>
                        <p className="text-sm text-blue-700">
                          Tugas akan langsung ditugaskan ke {selectedWorker.name} dan diarahkan ke halaman kontrak.
                          Anda bisa mengubah pilihan dengan memilih pekerja lain dari rekomendasi AI di atas.
                        </p>
                        <div className="mt-2 flex items-center space-x-1 text-xs text-blue-600">
                          <span>🎯</span>
                          <span>Sistem AI telah menganalisis dan merekomendasikan pekerja terbaik</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleCancel}
                  >
                    {isEditMode ? 'Hapus Task' : 'Batal'}
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting 
                      ? 'Menyimpan...' 
                      : selectedWorker
                        ? (isEditMode 
                            ? `🤖 Update & Tugaskan ke ${selectedWorker.name} →`
                            : `🤖 Buat & Tugaskan ke ${selectedWorker.name} →`)
                        : isEditMode
                          ? (formData.searchMethod === 'find_worker' 
                              ? 'Update & Cari Pekerja →' 
                              : 'Update & Publikasikan →')
                          : (formData.searchMethod === 'find_worker' 
                              ? 'Buat & Cari Pekerja →' 
                              : 'Buat & Publikasikan →')
                    }
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Modal Koordinat Lokasi */}
        {showMapModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
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