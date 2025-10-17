'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Header } from '@/components/layouts/Header';
import { BottomNav } from '@/components/layouts/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useProfileValidation } from '@/lib/hooks/useProfileValidation';
import { useRefreshSession } from '@/lib/hooks/useRefreshSession';
import { 
  User, 
  Phone, 
  MapPin, 
  Star, 
  CheckCircle, 
  AlertCircle,
  Edit3,
  Save,
  X
} from 'lucide-react';

const workCategories = [
  { id: 'kebersihan', label: 'Kebersihan' },
  { id: 'teknisi', label: 'Teknisi' },
  { id: 'renovasi', label: 'Renovasi' },
  { id: 'tukang', label: 'Tukang' },
  { id: 'angkut', label: 'Angkut Barang' },
  { id: 'taman', label: 'Taman & Kebun' },
  { id: 'lainnya', label: 'Lainnya' },
];

interface MockReview {
  id: number;
  rating: number;
  comment: string;
  tasker?: string;
  client?: string;
}

interface ProfileData {
  nik: string;
  name: string;
  address: string;
  phone: string;
  about: string;
  workCategories: string[];
  isVerified: boolean;
}

interface ProfileData {
  nik: string;
  name: string;
  address: string;
  phone: string;
  about: string;
  workCategories: string[];
  isVerified: boolean;
}

export default function ProfilPage() {
  const { session, refreshSession } = useRefreshSession();
  const { status } = useSession();
  const router = useRouter();
  const { canAccessFeatures, missingFields, isTaskerProfileComplete } = useProfileValidation();
  const [activeTab, setActiveTab] = useState<'pemberi-kerja' | 'pencari-kerja'>('pemberi-kerja');
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingCategories, setIsEditingCategories] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    nik: '3201234567890123', // Mock data dari verifikasi admin
    name: session?.user?.name || '',
    address: 'Jl. Sudirman No. 123, Jakarta Pusat', // Mock data dari verifikasi admin
    phone: session?.user?.phone || '',
    about: session?.user?.about || '',
    workCategories: session?.user?.workCategories || [],
    isVerified: true, // Mock: sudah diverifikasi admin
  });

  const [editData, setEditData] = useState<Partial<ProfileData>>({});
  const [editCategories, setEditCategories] = useState<string[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
    
    // Load profile data from database
    if (session?.user) {
      loadProfileData();
    }
  }, [status, router, session]);

  const loadProfileData = async () => {
    try {
      const response = await fetch('/api/users/profile');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setProfileData(prev => ({
            ...prev,
            phone: result.data.phone || prev.phone,
            about: result.data.about || prev.about,
            workCategories: result.data.workCategories || prev.workCategories,
          }));
        }
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
      // Fallback to session data
      if (session?.user) {
        setProfileData(prev => ({
          ...prev,
          name: session.user.name || prev.name,
          phone: session.user.phone || prev.phone,
          about: session.user.about || prev.about,
          workCategories: session.user.workCategories || prev.workCategories,
        }));
      }
    }
  };

  const isProfileComplete = () => {
    if (activeTab === 'pencari-kerja') {
      return profileData.phone && 
             profileData.about && 
             profileData.workCategories.length > 0;
    }
    return true; // Untuk pemberi kerja tidak ada requirement khusus
  };

  const handleEdit = () => {
    setEditData({ ...profileData });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        const result = await response.json();
        setProfileData({ ...profileData, ...editData });
        setIsEditing(false);
        setEditData({});
        // Refresh session to get updated data
        await refreshSession();
      } else {
        console.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelGeneral = () => {
    setEditData({});
    setIsEditing(false);
  };

  const handleEditCategories = () => {
    setEditCategories([...profileData.workCategories]);
    setIsEditingCategories(true);
  };

  const handleSaveCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workCategories: editCategories }),
      });

      if (response.ok) {
        const result = await response.json();
        setProfileData({ ...profileData, workCategories: editCategories });
        setIsEditingCategories(false);
        setEditCategories([]);
        // Refresh session to get updated data
        await refreshSession();
      } else {
        console.error('Failed to update categories');
      }
    } catch (error) {
      console.error('Error updating categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelCategories = () => {
    setEditCategories([]);
    setIsEditingCategories(false);
  };

  const toggleWorkCategory = (categoryId: string) => {
    const current = editCategories;
    const updated = current.includes(categoryId)
      ? current.filter((id: string) => id !== categoryId)
      : [...current, categoryId];
    
    setEditCategories(updated);
  };

  const mockHistoryData = {
    'pemberi-kerja': {
      completed: 12,
      rating: 4.8,
      reviews: [
        { id: 1, rating: 5, comment: 'Pemberi kerja yang baik, pembayaran tepat waktu', tasker: 'Ahmad S.' },
        { id: 2, rating: 4, comment: 'Instruksi jelas dan komunikatif', tasker: 'Budi P.' },
      ]
    },
    'pencari-kerja': {
      completed: 8,
      rating: 4.6,
      reviews: [
        { id: 1, rating: 5, comment: 'Pekerja sangat teliti dan hasil memuaskan', client: 'Sarah M.' },
        { id: 2, rating: 4, comment: 'Datang tepat waktu dan profesional', client: 'Andi T.' },
      ]
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
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pb-20">
        <div className="container mx-auto max-w-4xl px-4 py-6">
          {/* Profile Header */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="h-10 w-10 text-primary-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      {profileData.name}
                      {profileData.isVerified && (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      )}
                    </h1>
                    <p className="text-gray-600">NIK: {profileData.nik}</p>
                    <div className="flex items-center text-gray-600 mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="text-sm">{profileData.address}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Verification Status */}
              <div className="mb-4">
                <Badge variant={profileData.isVerified ? "default" : "secondary"}>
                  {profileData.isVerified ? "Terverifikasi Admin" : "Belum Diverifikasi"}
                </Badge>
              </div>

              {/* Profile Completion Warning */}
              {!isProfileComplete() && activeTab === 'pencari-kerja' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                    <span className="text-yellow-800 font-medium">
                      Lengkapi profil untuk mengakses semua fitur
                    </span>
                  </div>
                  <p className="text-yellow-700 text-sm mt-1">
                    Isi nomor HP, tentang diri, dan pilih kategori pekerjaan
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* General Profile Information */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Informasi Umum</CardTitle>
                {!isEditing && (
                  <Button variant="outline" onClick={handleEdit}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  {/* Phone */}
                  <div>
                    <Label htmlFor="phone">Nomor HP *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={editData.phone || profileData.phone}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditData({ ...editData, phone: e.target.value })}
                      placeholder="08xxxxxxxxxx"
                      className="mt-1"
                    />
                  </div>

                  {/* About */}
                  <div>
                    <Label htmlFor="about">Tentang *</Label>
                    <Textarea
                      id="about"
                      value={editData.about || profileData.about}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditData({ ...editData, about: e.target.value })}
                      placeholder="Ceritakan tentang diri Anda..."
                      className="mt-1"
                      rows={4}
                    />
                  </div>

                  <div className="flex space-x-2 pt-4">
                    <Button onClick={handleSave} disabled={loading}>
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Menyimpan...' : 'Simpan'}
                    </Button>
                    <Button variant="outline" onClick={handleCancelGeneral} disabled={loading}>
                      <X className="h-4 w-4 mr-2" />
                      Batal
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label>Nomor HP</Label>
                    <div className="flex items-center mt-1">
                      <Phone className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{profileData.phone || 'Belum diisi'}</span>
                    </div>
                  </div>

                  <div>
                    <Label>Tentang</Label>
                    <p className="mt-1 text-gray-700">
                      {profileData.about || 'Belum diisi'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tab Navigation */}
          <div className="flex space-x-2 mb-6 bg-white p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('pemberi-kerja')}
              className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${
                activeTab === 'pemberi-kerja'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Sebagai Pemberi Kerja
            </button>
            <button
              onClick={() => setActiveTab('pencari-kerja')}
              className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${
                activeTab === 'pencari-kerja'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Sebagai Pencari Kerja
            </button>
          </div>

          {/* Profile Content */}
          {activeTab === 'pencari-kerja' && (
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Kategori Pekerjaan</CardTitle>
                  {!isEditingCategories && (
                    <Button variant="outline" onClick={handleEditCategories} disabled={loading}>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isEditingCategories ? (
                  <div className="space-y-4">
                    {/* Work Categories */}
                    <div>
                      <Label>Bidang/Kategori Pekerjaan * (bisa lebih dari 1)</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {workCategories.map((category) => (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => toggleWorkCategory(category.id)}
                            disabled={loading}
                            className={`p-3 rounded-lg border text-left transition-colors ${
                              editCategories.includes(category.id)
                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                : 'border-gray-200 hover:border-gray-300'
                            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {category.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex space-x-2 pt-4">
                      <Button onClick={handleSaveCategories} disabled={loading}>
                        <Save className="h-4 w-4 mr-2" />
                        {loading ? 'Menyimpan...' : 'Simpan'}
                      </Button>
                      <Button variant="outline" onClick={handleCancelCategories} disabled={loading}>
                        <X className="h-4 w-4 mr-2" />
                        Batal
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label>Kategori Pekerjaan</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profileData.workCategories.length > 0 ? (
                          profileData.workCategories.map((categoryId: string) => {
                            const category = workCategories.find(cat => cat.id === categoryId);
                            return (
                              <Badge key={categoryId} variant="secondary">
                                {category?.label}
                              </Badge>
                            );
                          })
                        ) : (
                          <span className="text-gray-500">Belum dipilih</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Statistics */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Statistik {activeTab === 'pemberi-kerja' ? 'Pemberi Kerja' : 'Pencari Kerja'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">
                    {mockHistoryData[activeTab].completed}
                  </div>
                  <div className="text-sm text-gray-600">Tugas Selesai</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center">
                    <Star className="h-5 w-5 text-yellow-500 mr-1" />
                    <span className="text-2xl font-bold text-yellow-600">
                      {mockHistoryData[activeTab].rating}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">Rating</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reviews */}
          <Card>
            <CardHeader>
              <CardTitle>Ulasan & Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockHistoryData[activeTab].reviews.map((review) => (
                  <div key={review.id} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating 
                                  ? 'text-yellow-500 fill-current' 
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="ml-2 font-medium">
                          {activeTab === 'pemberi-kerja' 
                            ? (review as any).tasker 
                            : (review as any).client}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <BottomNav />
    </>
  );
}