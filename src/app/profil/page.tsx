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
import { toast } from 'sonner';
import { 
  User, 
  Phone, 
  MapPin, 
  Star, 
  CheckCircle, 
  AlertCircle,
  Edit3,
  Save,
  X,
  Wallet,
  TrendingUp,
  ArrowRight,
  Shield
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

// Reviews Section Component
function ReviewsSection({ userId }: { userId: string }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, [userId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/reviews?userId=${userId}&limit=5`);
      const data = await response.json();

      if (data.success) {
        setReviews(data.data.reviews);
        setReviewStats(data.data.stats);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating
            ? 'text-yellow-500 fill-current'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="text-center py-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 round w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!reviewStats || reviewStats.totalReviews === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <div className="text-3xl mb-2">⭐</div>
        <div className="text-sm font-medium">Belum ada ulasan</div>
        <div className="text-xs text-gray-400 mt-1">Selesaikan pekerjaan untuk mendapatkan ulasan pertama</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Rating Summary */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold text-yellow-600">
              {reviewStats.averageRating}
            </div>
            <div>
              <div className="flex items-center gap-1">
                {renderStars(Math.round(reviewStats.averageRating))}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {reviewStats.totalReviews} ulasan
              </div>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="text-right">
            <div className="text-xs text-gray-500 space-y-1">
              {[5, 4, 3, 2, 1].map(star => (
                <div key={star} className="flex items-center gap-2">
                  <span>{star}★</span>
                  <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-500 rounded-full"
                      style={{ 
                        width: `${reviewStats.totalReviews > 0 
                          ? (reviewStats.ratingDistribution[star] / reviewStats.totalReviews) * 100 
                          : 0}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-xs">{reviewStats.ratingDistribution[star]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Reviews */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Ulasan Terbaru</h4>
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review._id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {review.fromUser.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-sm text-gray-900">
                      {review.fromUser.name}
                      {review.fromUser.isVerified && (
                        <span className="text-primary-500 ml-1">✓</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {review.task.title}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    {renderStars(review.rating)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(review.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {review.comment}
              </p>
            </div>
          ))}
        </div>

        {reviewStats.totalReviews > 5 && (
          <div className="text-center mt-4">
            <button className="text-sm text-primary-600 font-medium hover:text-primary-700">
              Lihat Semua Ulasan ({reviewStats.totalReviews} ulasan)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface ProfileData {
  nik: string;
  name: string;
  address: string;
  phone: string;
  phoneVerified: boolean;
  location: string;
  locationCoordinates: { lat: number; lng: number };
  about: string;
  workCategories: string[];
  isVerified: boolean;
  balance: number;
  totalEarnings: number;
  withdrawalMethod: any;
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
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showWithdrawalMethodModal, setShowWithdrawalMethodModal] = useState(false);
  const [tempCoordinates, setTempCoordinates] = useState({ lat: 0, lng: 0 });
  const [verificationCode, setVerificationCode] = useState('');
  const [demoCode, setDemoCode] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState({
    type: 'bank',
    bankName: 'bca',
    accountNumber: '',
    accountName: '',
    ewalletType: 'gopay',
    ewalletNumber: '',
  });

  const [profileData, setProfileData] = useState<ProfileData>({
    nik: '3201234567890123',
    name: session?.user?.name || '',
    address: 'Jl. Sudirman No. 123, Jakarta Pusat',
    phone: session?.user?.phone || '',
    phoneVerified: false,
    location: '',
    locationCoordinates: { lat: 0, lng: 0 },
    about: session?.user?.about || '',
    workCategories: session?.user?.workCategories || [],
    isVerified: true,
    balance: 0,
    totalEarnings: 0,
    withdrawalMethod: null,
  });

  const [editData, setEditData] = useState<Partial<ProfileData>>({});
  const [editCategories, setEditCategories] = useState<string[]>([]);
  const [completedTasks, setCompletedTasks] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalCompletedTasks, setTotalCompletedTasks] = useState<number>(0);
  
  // Employer stats
  const [employerTasks, setEmployerTasks] = useState<any[]>([]);
  const [totalEmployerTasks, setTotalEmployerTasks] = useState<number>(0);
  const [totalSpentAsEmployer, setTotalSpentAsEmployer] = useState<number>(0);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
    
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
            phoneVerified: result.data.phoneVerified || false,
            location: result.data.location || prev.location,
            locationCoordinates: result.data.locationCoordinates || prev.locationCoordinates,
            about: result.data.about || prev.about,
            workCategories: result.data.workCategories || prev.workCategories,
            balance: result.data.balance || 0,
            totalEarnings: result.data.totalEarnings || 0,
            withdrawalMethod: result.data.withdrawalMethod || null,
          }));
        }
      }
      
      // Fetch real-time earnings calculation (same as dashboard)
      await loadWorkerEarnings();
      
      // Load employer stats
      await loadEmployerStats();
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };

  const loadWorkerEarnings = async () => {
    try {
      console.log('Fetching real-time worker earnings...');
      const response = await fetch('/api/worker-jobs');
      const data = await response.json();

      if (data.success) {
        const workerJobs = data.data;
        
        // Calculate earnings using same logic as dashboard
        const completedJobs = workerJobs.filter((job: any) =>
          ['completed', 'selesai'].includes(job.status)
        );

        const calculatedEarnings = completedJobs.reduce((total: number, job: any) => {
          return total + (job.budget || 0);
        }, 0);

        console.log('💰 Calculated earnings from completed jobs:', {
          completedJobs: completedJobs.length,
          totalEarnings: calculatedEarnings,
          jobs: completedJobs.map((j: any) => ({
            title: j.title,
            budget: j.budget,
            status: j.status
          }))
        });

        // Update totalEarnings dengan perhitungan real-time
        setProfileData(prev => ({
          ...prev,
          totalEarnings: calculatedEarnings
        }));

        // Set completed tasks for history display with enriched data
        const enrichedTasks = await enrichTasksWithReviews(completedJobs.slice(0, 5));
        setCompletedTasks(enrichedTasks);
        setTotalCompletedTasks(completedJobs.length);
        
        // Fetch real rating data
        await loadUserRating();
      }
    } catch (error) {
      console.error('Error fetching worker earnings:', error);
    }
  };

  const enrichTasksWithReviews = async (tasks: any[]) => {
    try {
      // Get all reviews for this user
      const response = await fetch('/api/users/reviews?limit=100');
      const reviewData = await response.json();
      
      const reviewsMap = new Map();
      if (reviewData.success && reviewData.data.reviews) {
        reviewData.data.reviews.forEach((review: any) => {
          reviewsMap.set(review.task._id, review);
        });
      }

      // Enrich tasks with review data
      const enrichedTasks = tasks.map(task => {
        const review = reviewsMap.get(task._id);
        return {
          ...task,
          review: review ? {
            rating: review.rating,
            comment: review.comment,
            reviewedAt: review.createdAt
          } : null
        };
      });

      return enrichedTasks;
    } catch (error) {
      console.error('Error enriching tasks with reviews:', error);
      return tasks; // Return original tasks if enrichment fails
    }
  };

  const loadUserRating = async () => {
    try {
      const response = await fetch('/api/users/reviews');
      const data = await response.json();

      if (data.success) {
        const rating = data.data.stats.averageRating || 0;
        setAverageRating(rating);
        console.log('📊 User rating loaded:', rating);
      }
    } catch (error) {
      console.error('Error fetching user rating:', error);
      // Fallback to mock rating if API fails
      setAverageRating(totalCompletedTasks > 0 ? 4.8 : 0);
    }
  };

  const loadEmployerStats = async () => {
    try {
      console.log('Fetching employer stats...');
      const response = await fetch('/api/my-tasks');
      const data = await response.json();

      if (data.success) {
        const allTasks = data.data;
        
        // Filter completed tasks as employer
        const completedEmployerTasks = allTasks.filter((task: any) =>
          ['completed', 'selesai'].includes(task.status)
        );

        // Calculate total spent
        const totalSpent = completedEmployerTasks.reduce((total: number, task: any) => {
          return total + (task.budget || 0);
        }, 0);

        console.log('💼 Employer stats:', {
          totalTasks: allTasks.length,
          completedTasks: completedEmployerTasks.length,
          totalSpent: totalSpent
        });

        setEmployerTasks(completedEmployerTasks.slice(0, 5)); // Last 5 completed tasks
        setTotalEmployerTasks(completedEmployerTasks.length);
        setTotalSpentAsEmployer(totalSpent);
      }
    } catch (error) {
      console.error('Error fetching employer stats:', error);
    }
  };

  const handlePhoneVerification = async () => {
    if (!profileData.phone) {
      toast.error('Masukkan nomor HP terlebih dahulu');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/users/phone-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: profileData.phone }),
      });

      const result = await response.json();
      if (response.ok) {
        setDemoCode(result.demoCode);
        setShowPhoneModal(true);
        toast.success('Kode verifikasi telah dikirim (Mode Demo)');
      } else {
        toast.error(result.error || 'Gagal mengirim kode');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users/phone-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCode }),
      });

      const result = await response.json();
      if (response.ok) {
        toast.success('Nomor HP berhasil diverifikasi!');
        setShowPhoneModal(false);
        setVerificationCode('');
        setDemoCode('');
        await loadProfileData();
        await refreshSession();
      } else {
        toast.error(result.error || 'Kode verifikasi salah');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWithdrawalMethod = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users/withdrawal-method', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(withdrawalMethod),
      });

      const result = await response.json();
      if (response.ok) {
        toast.success('Metode penarikan berhasil disimpan');
        setShowWithdrawalMethodModal(false);
        await loadProfileData();
      } else {
        toast.error(result.error || 'Gagal menyimpan metode penarikan');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        setProfileData({ ...profileData, ...editData });
        setIsEditing(false);
        setEditData({});
        await refreshSession();
        toast.success('Profil berhasil diperbarui');
      } else {
        toast.error('Gagal memperbarui profil');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workCategories: editCategories }),
      });

      if (response.ok) {
        setProfileData({ ...profileData, workCategories: editCategories });
        setIsEditingCategories(false);
        setEditCategories([]);
        await refreshSession();
        toast.success('Kategori pekerjaan berhasil diperbarui');
      } else {
        toast.error('Gagal memperbarui kategori');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkCategory = (categoryId: string) => {
    const current = editCategories;
    const updated = current.includes(categoryId)
      ? current.filter((id: string) => id !== categoryId)
      : [...current, categoryId];
    
    setEditCategories(updated);
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  const banks = [
    { id: 'bca', name: 'BCA' },
    { id: 'mandiri', name: 'Mandiri' },
    { id: 'bni', name: 'BNI' },
    { id: 'bri', name: 'BRI' },
  ];

  const ewallets = [
    { id: 'gopay', name: 'GoPay' },
    { id: 'ovo', name: 'OVO' },
    { id: 'dana', name: 'DANA' },
    { id: 'shopeepay', name: 'ShopeePay' },
  ];

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

              <div className="mb-4">
                <Badge variant={profileData.isVerified ? "default" : "secondary"}>
                  {profileData.isVerified ? "Terverifikasi Admin" : "Belum Diverifikasi"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Wallet className="h-8 w-8 opacity-80" />
                </div>
                <div className="text-sm opacity-90 mb-1">Saldo Saat Ini</div>
                <div className="text-2xl font-bold">{formatCurrency(profileData.balance)}</div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3 bg-white text-blue-600 hover:bg-blue-50"
                  onClick={(e) => {
                    e.preventDefault();
                    console.log('Navigating to /profil/penarikan');
                    router.push('/profil/penarikan');
                  }}
                >
                  Tarik Saldo
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="h-8 w-8 opacity-80" />
                </div>
                <div className="text-sm opacity-90 mb-1">Total Pendapatan</div>
                <div className="text-2xl font-bold">{formatCurrency(profileData.totalEarnings)}</div>
                <div className="text-xs opacity-75 mt-1">Tidak dapat ditarik</div>
              </CardContent>
            </Card>
          </div>

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
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="phone"
                        type="tel"
                        value={editData.phone || profileData.phone}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditData({ ...editData, phone: e.target.value })}
                        placeholder="08xxxxxxxxxx"
                        className="flex-1"
                      />
                      {!profileData.phoneVerified && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handlePhoneVerification}
                          disabled={loading}
                          className="whitespace-nowrap"
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Verifikasi
                        </Button>
                      )}
                    </div>
                    {profileData.phoneVerified && (
                      <div className="text-xs text-green-600 mt-1 flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Nomor HP terverifikasi
                      </div>
                    )}
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
                    <Button variant="outline" onClick={() => { setEditData({}); setIsEditing(false); }} disabled={loading}>
                      <X className="h-4 w-4 mr-2" />
                      Batal
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label>Nomor HP</Label>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{profileData.phone || 'Belum diisi'}</span>
                        {profileData.phoneVerified && (
                          <CheckCircle className="h-4 w-4 ml-2 text-green-500" />
                        )}
                      </div>
                      {!profileData.phoneVerified && profileData.phone && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handlePhoneVerification}
                          disabled={loading}
                        >
                          Verifikasi
                        </Button>
                      )}
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

          {/* Withdrawal Method */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Metode Penarikan</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    if (profileData.withdrawalMethod) {
                      setWithdrawalMethod(profileData.withdrawalMethod);
                    }
                    setShowWithdrawalMethodModal(true);
                  }}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  {profileData.withdrawalMethod ? 'Ubah' : 'Atur'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {profileData.withdrawalMethod ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm text-gray-600">Tipe</div>
                      <div className="font-semibold">
                        {profileData.withdrawalMethod.type === 'bank' ? '🏦 Bank Transfer' : '📱 E-Wallet'}
                      </div>
                    </div>
                  </div>
                  {profileData.withdrawalMethod.type === 'bank' ? (
                    <>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="text-sm text-gray-600">Bank</div>
                          <div className="font-semibold">{profileData.withdrawalMethod.bankName?.toUpperCase()}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="text-sm text-gray-600">Nomor Rekening</div>
                          <div className="font-semibold">{profileData.withdrawalMethod.accountNumber}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="text-sm text-gray-600">Nama Pemilik</div>
                          <div className="font-semibold">{profileData.withdrawalMethod.accountName}</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="text-sm text-gray-600">Jenis E-Wallet</div>
                          <div className="font-semibold capitalize">{profileData.withdrawalMethod.ewalletType}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="text-sm text-gray-600">Nomor</div>
                          <div className="font-semibold">{profileData.withdrawalMethod.ewalletNumber}</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Wallet className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>Belum ada metode penarikan</p>
                  <p className="text-sm">Atur metode penarikan untuk menarik saldo</p>
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
                      <Button variant="outline" onClick={() => { setEditCategories([]); setIsEditingCategories(false); }} disabled={loading}>
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
              {activeTab === 'pencari-kerja' ? (
                // Worker Statistics
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{totalCompletedTasks}</div>
                    <div className="text-sm text-gray-600">Pekerjaan Selesai</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center">
                      <Star className="h-5 w-5 text-yellow-500 mr-1" />
                      <span className="text-2xl font-bold text-yellow-600">{averageRating}</span>
                    </div>
                    <div className="text-sm text-gray-600">Rating dari Klien</div>
                  </div>
                </div>
              ) : (
                // Employer Statistics
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{totalEmployerTasks}</div>
                    <div className="text-sm text-gray-600">Tugas Diselesaikan</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatCurrency(totalSpentAsEmployer)}
                    </div>
                    <div className="text-sm text-gray-600">Total Dikeluarkan</div>
                  </div>
                </div>
              )}

              {/* Recent Completed Tasks - Worker */}
              {activeTab === 'pencari-kerja' && completedTasks.length > 0 && (
                <div>
                  <div className="text-sm font-semibold text-gray-900 mb-3">Riwayat Pekerjaan Terakhir</div>
                  <div className="space-y-3">
                    {completedTasks.map((task) => (
                      <div key={task._id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
                            <p className="text-xs text-gray-600">
                              {task.poster?.name || task.postedBy?.name || 'Anonymous'}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-green-600">
                              {formatCurrency(task.budget)}
                            </div>
                            {task.review ? (
                              <div className="flex items-center text-xs text-yellow-600">
                                <Star className="h-3 w-3 mr-1 fill-current" />
                                <span>{task.review.rating}</span>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-400">
                                Belum di-review
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {task.location || 'Lokasi tidak tersedia'}
                          </span>
                          <span>
                            {task.completedAt 
                              ? new Date(task.completedAt).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })
                              : task.updatedAt
                              ? new Date(task.updatedAt).toLocaleDateString('id-ID', {
                                  day: 'numeric', 
                                  month: 'short',
                                  year: 'numeric'
                                })
                              : new Date(task.createdAt).toLocaleDateString('id-ID', {
                                  day: 'numeric', 
                                  month: 'short',
                                  year: 'numeric'
                                })
                            }
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {totalCompletedTasks > 5 && (
                    <div className="text-center mt-4">
                      <button
                        onClick={() => router.push('/riwayat?mode=worker')}
                        className="text-sm text-primary-600 font-medium hover:text-primary-700"
                      >
                        Lihat Semua Riwayat ({totalCompletedTasks} pekerjaan)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Recent Completed Tasks - Employer */}
              {activeTab === 'pemberi-kerja' && employerTasks.length > 0 && (
                <div>
                  <div className="text-sm font-semibold text-gray-900 mb-3">Riwayat Tugas yang Diselesaikan</div>
                  <div className="space-y-3">
                    {employerTasks.map((task) => (
                      <div key={task._id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
                            <p className="text-xs text-gray-600">
                              Dikerjakan oleh: {task.assignedTo?.name || 'Anonymous'}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-blue-600">
                              {formatCurrency(task.budget)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Dibayarkan
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {task.location || 'Lokasi tidak tersedia'}
                          </span>
                          <span>
                            {task.completedAt 
                              ? new Date(task.completedAt).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })
                              : task.updatedAt
                              ? new Date(task.updatedAt).toLocaleDateString('id-ID', {
                                  day: 'numeric', 
                                  month: 'short',
                                  year: 'numeric'
                                })
                              : new Date(task.createdAt).toLocaleDateString('id-ID', {
                                  day: 'numeric', 
                                  month: 'short',
                                  year: 'numeric'
                                })
                            }
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {totalEmployerTasks > 5 && (
                    <div className="text-center mt-4">
                      <button
                        onClick={() => router.push('/riwayat?mode=employer')}
                        className="text-sm text-primary-600 font-medium hover:text-primary-700"
                      >
                        Lihat Semua Riwayat ({totalEmployerTasks} tugas)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Empty State for No Completed Tasks - Worker */}
              {activeTab === 'pencari-kerja' && completedTasks.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <div className="text-3xl mb-2">📝</div>
                  <div className="text-sm font-medium">Belum ada pekerjaan yang diselesaikan</div>
                  <div className="text-xs text-gray-400 mt-1">Mulai ambil pekerjaan untuk membangun riwayat</div>
                </div>
              )}

              {/* Empty State for No Completed Tasks - Employer */}
              {activeTab === 'pemberi-kerja' && employerTasks.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <div className="text-3xl mb-2">🏢</div>
                  <div className="text-sm font-medium">Belum ada tugas yang diselesaikan</div>
                  <div className="text-xs text-gray-400 mt-1">Buat tugas baru untuk memulai</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reviews Section - Only for Pencari Kerja */}
          {activeTab === 'pencari-kerja' && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Ulasan & Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ReviewsSection userId={session.user.id} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Phone Verification Modal */}
        {showPhoneModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md p-6">
              <h3 className="text-xl font-bold mb-4">Verifikasi Nomor HP</h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Kode verifikasi telah dikirim ke <strong>{profileData.phone}</strong>
                </p>
                {demoCode && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Mode Demo:</strong> Kode verifikasi Anda adalah <strong className="text-lg">{demoCode}</strong>
                    </p>
                  </div>
                )}
                <Label htmlFor="code">Masukkan Kode (6 digit)</Label>
                <Input
                  id="code"
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="123456"
                  className="mt-1 text-center text-2xl tracking-widest"
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleVerifyCode} disabled={loading || verificationCode.length !== 6} className="flex-1">
                  {loading ? 'Memverifikasi...' : 'Verifikasi'}
                </Button>
                <Button variant="outline" onClick={() => { setShowPhoneModal(false); setVerificationCode(''); setDemoCode(''); }} className="flex-1">
                  Batal
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Withdrawal Method Modal */}
        {showWithdrawalMethodModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h3 className="text-xl font-bold">Atur Metode Penarikan</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <Label>Tipe Metode</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      onClick={() => setWithdrawalMethod({ ...withdrawalMethod, type: 'bank' })}
                      className={`p-3 rounded-lg border text-center ${
                        withdrawalMethod.type === 'bank' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                      }`}
                    >
                      🏦 Bank
                    </button>
                    <button
                      onClick={() => setWithdrawalMethod({ ...withdrawalMethod, type: 'ewallet' })}
                      className={`p-3 rounded-lg border text-center ${
                        withdrawalMethod.type === 'ewallet' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                      }`}
                    >
                      📱 E-Wallet
                    </button>
                  </div>
                </div>

                {withdrawalMethod.type === 'bank' ? (
                  <>
                    <div>
                      <Label>Bank</Label>
                      <select
                        value={withdrawalMethod.bankName}
                        onChange={(e) => setWithdrawalMethod({ ...withdrawalMethod, bankName: e.target.value })}
                        className="w-full mt-1 p-2 border rounded-lg"
                      >
                        {banks.map(bank => (
                          <option key={bank.id} value={bank.id}>{bank.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Nomor Rekening</Label>
                      <Input
                        value={withdrawalMethod.accountNumber}
                        onChange={(e) => setWithdrawalMethod({ ...withdrawalMethod, accountNumber: e.target.value })}
                        placeholder="1234567890"
                      />
                    </div>
                    <div>
                      <Label>Nama Pemilik Rekening</Label>
                      <Input
                        value={withdrawalMethod.accountName}
                        onChange={(e) => setWithdrawalMethod({ ...withdrawalMethod, accountName: e.target.value })}
                        placeholder="Nama sesuai rekening"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label>Jenis E-Wallet</Label>
                      <select
                        value={withdrawalMethod.ewalletType}
                        onChange={(e) => setWithdrawalMethod({ ...withdrawalMethod, ewalletType: e.target.value })}
                        className="w-full mt-1 p-2 border rounded-lg"
                      >
                        {ewallets.map(ew => (
                          <option key={ew.id} value={ew.id}>{ew.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Nomor E-Wallet</Label>
                      <Input
                        value={withdrawalMethod.ewalletNumber}
                        onChange={(e) => setWithdrawalMethod({ ...withdrawalMethod, ewalletNumber: e.target.value })}
                        placeholder="08xxxxxxxxxx"
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="p-6 border-t flex space-x-2">
                <Button onClick={handleSaveWithdrawalMethod} disabled={loading} className="flex-1">
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </Button>
                <Button variant="outline" onClick={() => setShowWithdrawalMethodModal(false)} className="flex-1">
                  Batal
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Map Modal */}
        {showMapModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">Pilih Lokasi</h3>
                  <Button variant="outline" size="sm" onClick={() => setShowMapModal(false)} className="h-8 w-8 p-0 rounded-full">
                    ✕
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tempLat">Latitude</Label>
                    <Input
                      id="tempLat"
                      type="number"
                      step="any"
                      placeholder="5.5577"
                      value={tempCoordinates.lat || ''}
                      onChange={(e) => setTempCoordinates({ ...tempCoordinates, lat: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tempLng">Longitude</Label>
                    <Input
                      id="tempLng"
                      type="number"
                      step="any"
                      placeholder="95.3222"
                      value={tempCoordinates.lng || ''}
                      onChange={(e) => setTempCoordinates({ ...tempCoordinates, lng: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
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
                          () => toast.error('Tidak dapat mengakses lokasi')
                        );
                      }
                    }}
                  >
                    📍 Gunakan Lokasi Saat Ini
                  </Button>
                </div>
              </div>
              <div className="p-6 border-t flex space-x-2">
                <Button
                  onClick={() => {
                    setEditData({ ...editData, locationCoordinates: tempCoordinates });
                    setShowMapModal(false);
                  }}
                  disabled={tempCoordinates.lat === 0 || tempCoordinates.lng === 0}
                  className="flex-1"
                >
                  Simpan Lokasi
                </Button>
                <Button variant="outline" onClick={() => setShowMapModal(false)} className="flex-1">
                  Batal
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
      <BottomNav />
    </>
  );
}