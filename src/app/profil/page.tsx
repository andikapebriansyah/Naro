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
  location: string;
  locationCoordinates: { lat: number; lng: number };
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
  const [showMapModal, setShowMapModal] = useState(false);
  const [tempCoordinates, setTempCoordinates] = useState({ lat: 0, lng: 0 });
  const [profileData, setProfileData] = useState<ProfileData>({
    nik: '3201234567890123', // Mock data dari verifikasi admin
    name: session?.user?.name || '',
    address: 'Jl. Sudirman No. 123, Jakarta Pusat', // Mock data dari verifikasi admin
    phone: session?.user?.phone || '',
    location: '',
    locationCoordinates: { lat: 0, lng: 0 },
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
            location: result.data.location || prev.location,
            locationCoordinates: result.data.locationCoordinates || prev.locationCoordinates,
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
          location: prev.location, // Keep existing location from API
          locationCoordinates: prev.locationCoordinates, // Keep existing coordinates from API
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
                <div className="flex space-x-2">
                  {!isEditing && (
                    <Button variant="outline" onClick={handleEdit}>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}

                </div>
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

                  {/* Location */}
                  <div>
                    <Label htmlFor="location">
                      Alamat Lokasi <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="location"
                        placeholder="Contoh: Jl. T. Nyak Arief No. 123, Banda Aceh"
                        value={editData.location || profileData.location}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditData({ ...editData, location: e.target.value })}
                        required
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setTempCoordinates((editData.locationCoordinates || profileData.locationCoordinates) || { lat: 0, lng: 0 });
                          setShowMapModal(true);
                        }}
                        className="px-3"
                      >
                        📍 Maps
                      </Button>
                    </div>
                    {((editData.locationCoordinates || profileData.locationCoordinates) && 
                      (editData.locationCoordinates || profileData.locationCoordinates).lat !== 0 && 
                      (editData.locationCoordinates || profileData.locationCoordinates).lng !== 0) && (
                      <div className="text-xs text-green-600 mt-1">
                        ✓ Koordinat: {(editData.locationCoordinates || profileData.locationCoordinates).lat.toFixed(6)}, {(editData.locationCoordinates || profileData.locationCoordinates).lng.toFixed(6)}
                      </div>
                    )}
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
                    <Label>Lokasi</Label>
                    <div className="flex items-center mt-1">
                      <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                      <div className="flex flex-col">
                        <span>{profileData.location || 'Belum diisi'}</span>
                        {profileData.locationCoordinates && 
                         profileData.locationCoordinates.lat !== 0 && 
                         profileData.locationCoordinates.lng !== 0 && (
                          <span className="text-xs text-green-600">
                            📍 {profileData.locationCoordinates.lat.toFixed(6)}, {profileData.locationCoordinates.lng.toFixed(6)}
                          </span>
                        )}
                      </div>
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

        {/* Koordinat Lokasi Modal */}
        {showMapModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Pilih Lokasi</h3>
                    <p className="text-sm text-gray-500 mt-1">Tentukan koordinat lokasi Anda</p>
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
                          // toast.success('Lokasi berhasil dideteksi!');
                        },
                        (error) => {
                          console.error('Error getting location:', error);
                          // toast.error('Tidak dapat mengakses lokasi. Pastikan izin lokasi telah diberikan.');
                        }
                      );
                    } else {
                      // toast.error('Geolocation tidak didukung oleh browser ini.');
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
                      setEditData({
                        ...editData,
                        locationCoordinates: tempCoordinates
                      });
                      setShowMapModal(false);
                      // toast.success('Koordinat lokasi berhasil disimpan!');
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
      <BottomNav />
    </>
  );
}