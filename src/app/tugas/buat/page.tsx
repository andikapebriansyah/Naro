'use client';

import { useState, useEffect, Suspense } from 'react';
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
import dynamic from 'next/dynamic';

// Dynamic import untuk MapSelector agar tidak error di SSR
const MapSelectorWrapper = dynamic(
  () => import('@/components/features/tasks/MapSelectorWrapper'),
  { 
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Memuat peta...</p>
        </div>
      </div>
    )
  }
);

const categories = [
  { value: 'kebersihan', label: 'Kebersihan & Perawatan' },
  { value: 'teknisi', label: 'Teknisi & Perbaikan' },
  { value: 'renovasi', label: 'Renovasi & Konstruksi' },
  { value: 'tukang', label: 'Tukang & Pertukangan' },
  { value: 'angkut', label: 'Angkut & Pindahan' },
  { value: 'taman', label: 'Taman & Landscaping' },
  { value: 'lainnya', label: 'Lainnya' },
];

function CreateTaskPageContent() {
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
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component is mounted (for client-side only features)
  useEffect(() => {
    setIsMounted(true);
  }, []);

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
          console.log('Loading draft data:', draftData);
          console.log('Draft coordinates:', draftData.formData?.locationCoordinates);
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

    // Validasi koordinat (opsional tapi akan memberi peringatan)
    if (!formData.locationCoordinates || formData.locationCoordinates.lat === 0 || formData.locationCoordinates.lng === 0) {
      const confirmSubmit = confirm('Lokasi belum dipilih di peta. Apakah Anda yakin ingin melanjutkan tanpa koordinat peta?');
      if (!confirmSubmit) {
        toast.error('Silakan pilih lokasi di peta terlebih dahulu');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      console.log('Submitting form with data:', formData);
      console.log('Location coordinates to send:', formData.locationCoordinates);
      
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'locationCoordinates') {
          const coordinatesString = JSON.stringify(value);
          console.log('Serialized coordinates:', coordinatesString);
          data.append(key, coordinatesString);
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
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/40 py-4 px-4 pb-20">
        <div className="container mx-auto max-w-3xl animate-fade-in">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/60 animate-card-pop overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/80 to-indigo-50/80">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-800 to-blue-800 bg-clip-text text-transparent">
                    {isEditMode ? 'Edit Tugas' : 'Buat Tugas Baru'}
                  </h1>
                  <p className="text-gray-600 mt-1 text-sm sm:text-base">
                    {isEditMode ? 'Perbarui detail pekerjaan' : 'Isi detail pekerjaan yang dibutuhkan'}
                  </p>
                </div>
                {!isEditMode && (formData.title || formData.description || formData.category) && (
                  <div className="text-right">
                    <p className="text-xs text-green-600 mb-2 flex items-center justify-end gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Draft tersimpan
                    </p>
                    <button
                      onClick={clearDraft}
                      className="text-xs text-red-600 hover:text-red-700 bg-white/70 hover:bg-white/90 px-2 py-1 rounded-md border border-red-200 hover:border-red-300 transition-all duration-200 font-medium"
                    >
                      Hapus Draft
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Informasi Dasar */}
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-gray-200/50 space-y-4 animate-slide-up">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800 border-b border-gray-100 pb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span>Informasi Dasar</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Label htmlFor="title" className="text-sm font-semibold text-gray-700 mb-2 block">
                        Judul Tugas <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="title"
                        placeholder="Contoh: Bersihkan Rumah 2 Lantai"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        className="bg-white/70 backdrop-blur-sm border-gray-200/50 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg transition-all duration-200"
                      />
                    </div>

                    <div>
                      <Label htmlFor="category" className="text-sm font-semibold text-gray-700 mb-2 block">
                        Kategori <span className="text-red-500">*</span>
                      </Label>
                      <select
                        id="category"
                        className="w-full h-11 rounded-lg border border-gray-200/50 bg-white/70 backdrop-blur-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
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
                      <Label htmlFor="budget" className="text-sm font-semibold text-gray-700 mb-2 block">
                        Budget <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-200/50 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold text-sm shadow-sm">
                          Rp
                        </span>
                        <Input
                          id="budget"
                          type="text"
                          inputMode="numeric"
                          placeholder="20.000"
                          className="rounded-l-none rounded-r-lg bg-white/70 backdrop-blur-sm border-gray-200/50 focus:border-yellow-500 focus:ring-yellow-500/20 transition-all duration-200"
                          value={formData.budget}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            setFormData({ ...formData, budget: value });
                          }}
                          onBlur={(e) => {
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

                    <div className="sm:col-span-2">
                      <Label htmlFor="description" className="text-sm font-semibold text-gray-700 mb-2 block">
                        Deskripsi Detail <span className="text-red-500">*</span>
                      </Label>
                      <textarea
                        id="description"
                        className="w-full min-h-[100px] rounded-lg border border-gray-200/50 bg-white/70 backdrop-blur-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 resize-none"
                        placeholder="Jelaskan detail pekerjaan yang dibutuhkan..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Foto Referensi */}
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-gray-200/50 space-y-3 animate-slide-up" style={{animationDelay: '100ms'}}>
                  <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800 border-b border-gray-100 pb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span>Foto Referensi (Opsional)</span>
                  </h3>

                  <div className="flex flex-wrap gap-3">
                    {photoPreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 transition-colors text-xs font-bold shadow-sm"
                        >
                          ×
                        </button>
                      </div>
                    ))}

                    {photos.length < 5 && (
                      <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-200 bg-gray-50/50">
                        <Upload className="h-4 w-4 text-gray-400" />
                        <span className="text-xs text-gray-500 mt-1 font-medium">Tambah</span>
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
                  
                  <div className="bg-gradient-to-r from-blue-50/60 to-indigo-50/60 backdrop-blur-sm border border-blue-200/30 rounded-lg p-3 flex items-start gap-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-xs text-blue-700">
                      <p className="font-medium mb-1">Tips Foto:</p>
                      <p>• Maksimal 5 foto, setiap foto maksimal 5MB • Format: JPG, PNG, WEBP</p>
                    </div>
                  </div>
                </div>

                {/* Lokasi & Jadwal */}
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-gray-200/50 space-y-4 animate-slide-up" style={{animationDelay: '200ms'}}>
                  <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800 border-b border-gray-100 pb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-600 to-green-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span>Lokasi & Jadwal</span>
                  </h3>

                  <div>
                    <Label htmlFor="location" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Alamat Lokasi <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="location"
                        placeholder="Contoh: Jl. T. Nyak Arief No. 123, Banda Aceh"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        required
                        className="flex-1 bg-white/70 backdrop-blur-sm border-gray-200/50 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            console.log('Opening map modal...');
                            // Only show map if we're on client side
                            if (typeof window !== 'undefined') {
                              setShowMapModal(true);
                            } else {
                              toast.error('Peta hanya bisa dibuka di browser. Silakan refresh halaman.');
                            }
                          } catch (error) {
                            console.error('Error opening map:', error);
                            toast.error('Gagal membuka peta. Silakan coba lagi.');
                          }
                        }}
                        className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold rounded-lg hover:shadow-md hover:shadow-emerald-500/25 transition-all duration-300 flex items-center gap-1 text-sm whitespace-nowrap"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Peta
                      </button>
                    </div>
                    {(formData.locationCoordinates && formData.locationCoordinates.lat !== 0 && formData.locationCoordinates.lng !== 0) && (
                      <div className="text-xs text-green-600 mt-2 bg-green-50 px-2 py-1 rounded">
                        ✓ Koordinat: {formData.locationCoordinates.lat.toFixed(6)}, {formData.locationCoordinates.lng.toFixed(6)}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="startDate" className="text-sm font-semibold text-gray-700 mb-2 block">
                        Mulai <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="startDate"
                        type="date"
                        min={getMinDate()}
                        value={formData.startDate}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        required
                        className="bg-white/70 backdrop-blur-sm border-gray-200/50 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg transition-all duration-200"
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate" className="text-sm font-semibold text-gray-700 mb-2 block">
                        Berakhir <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="endDate"
                        type="date"
                        min={formData.startDate || getMinDate()}
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        required
                        disabled={!formData.startDate}
                        className="bg-white/70 backdrop-blur-sm border-gray-200/50 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg transition-all duration-200 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="startTime" className="text-sm font-semibold text-gray-700 mb-2 block">
                        Jam Masuk <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => handleStartTimeChange(e.target.value)}
                        required
                        disabled={!formData.startDate}
                        className="bg-white/70 backdrop-blur-sm border-gray-200/50 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg transition-all duration-200 disabled:opacity-50"
                      />
                      {formData.startDate && formData.startDate === getMinDate() && (
                        <p className="text-xs text-orange-600 mt-1 bg-orange-50 px-2 py-1 rounded">
                          Min: {getMinTime(formData.startDate)}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="endTime" className="text-sm font-semibold text-gray-700 mb-2 block">
                        Jam Pulang <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => handleEndTimeChange(e.target.value)}
                        required
                        disabled={!formData.startTime}
                        className="bg-white/70 backdrop-blur-sm border-gray-200/50 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg transition-all duration-200 disabled:opacity-50"
                      />
                      {formData.startDate === formData.endDate && formData.startTime && (
                        <p className="text-xs text-orange-600 mt-1 bg-orange-50 px-2 py-1 rounded">
                          Min: {getMinEndTime()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cara Mencari Pekerja */}
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-gray-200/60 space-y-4 animate-slide-up" style={{animationDelay: '300ms'}}>
                  <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800 border-b border-gray-100 pb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <span>Cara Mencari Pekerja</span>
                  </h3>

                  <div className="space-y-3">
                    <div
                      onClick={() => {
                        setFormData({ ...formData, searchMethod: 'publication' });
                        setSelectedWorker(null);
                      }}
                      className={`w-full border-2 rounded-lg p-3 cursor-pointer transition-all duration-200 ${
                        formData.searchMethod === 'publication'
                          ? 'border-blue-400 bg-blue-50/70'
                          : 'border-gray-200 bg-white/70 hover:border-blue-300 hover:bg-blue-50/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          formData.searchMethod === 'publication' ? 'bg-blue-500' : 'bg-gray-400'
                        }`}>
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1">Publikasikan Tugas</h4>
                          <p className="text-xs text-gray-600">
                            Tugas ditampilkan dan pekerja bisa melamar
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 ${
                          formData.searchMethod === 'publication' 
                            ? 'border-blue-500 bg-blue-500' 
                            : 'border-gray-300'
                        }`}>
                          {formData.searchMethod === 'publication' && (
                            <svg className="w-3 h-3 text-white ml-0.5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>

                    <div
                      onClick={() => setFormData({ ...formData, searchMethod: 'find_worker' })}
                      className={`w-full border-2 rounded-lg p-3 cursor-pointer transition-all duration-200 ${
                        formData.searchMethod === 'find_worker'
                          ? 'border-purple-400 bg-purple-50/70'
                          : 'border-gray-200 bg-white/70 hover:border-purple-300 hover:bg-purple-50/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          formData.searchMethod === 'find_worker' ? 'bg-purple-500' : 'bg-gray-400'
                        }`}>
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1">Cari Pekerja AI</h4>
                          <p className="text-xs text-gray-600">
                            Gunakan AI untuk rekomendasi pekerja terbaik
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 ${
                          formData.searchMethod === 'find_worker' 
                            ? 'border-purple-500 bg-purple-500' 
                            : 'border-gray-300'
                        }`}>
                          {formData.searchMethod === 'find_worker' && (
                            <svg className="w-3 h-3 text-white ml-0.5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rekomendasi Pekerja Cerdas */}
                {formData.searchMethod === 'find_worker' && (
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-gray-200/60 space-y-4 animate-slide-up" style={{animationDelay: '400ms'}}>
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
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-blue-600">🤖</span>
                          <span className="font-medium text-blue-900 text-sm">
                            Pekerja AI Terpilih: {selectedWorker.name}
                          </span>
                        </div>
                        <p className="text-xs text-blue-700">
                          Tugas akan langsung ditugaskan ke {selectedWorker.name} dan diarahkan ke halaman kontrak.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex space-x-3">
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
                            ? `🤖 Update & Tugaskan →`
                            : `🤖 Buat & Tugaskan →`)
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
            </div>
          </div>
        </div>

        {/* Map Selector Modal */}
        {typeof window !== 'undefined' && isMounted && showMapModal && (
          <MapSelectorWrapper
            isOpen={showMapModal}
            onClose={() => setShowMapModal(false)}
            onLocationSelect={(coordinates) => {
              try {
                console.log('Received coordinates from MapSelector:', coordinates);
                const newFormData = {
                  ...formData,
                  locationCoordinates: coordinates
                };
                console.log('Updating formData with coordinates:', newFormData.locationCoordinates);
                setFormData(newFormData);
                setShowMapModal(false);
                toast.success(`Lokasi berhasil dipilih! (${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)})`);
              } catch (error) {
                console.error('Error setting location:', error);
                toast.error('Gagal menyimpan lokasi. Silakan coba lagi.');
              }
            }}
            initialCoordinates={formData.locationCoordinates}
            address={formData.location}
          />
        )}
      </main>
    </ProfileGuard>
  );
}

export default function CreateTaskPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    }>
      <CreateTaskPageContent />
    </Suspense>
  );
}