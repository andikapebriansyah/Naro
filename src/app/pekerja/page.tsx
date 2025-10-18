'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { BottomNav } from '@/components/layouts/BottomNav';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  MapPin, 
  Star, 
  ArrowLeft, 
  Users, 
  CheckCircle, 
  Clock,
  Wrench,
  Hammer,
  Truck,
  TreePine,
  Sparkles,
  Settings,
  MoreHorizontal,
  Filter,
  Award,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { getInitials } from '@/lib/utils';

// Category Button Component
function CategoryButton({ 
  icon, 
  label, 
  isActive, 
  onClick 
}: { 
  icon: React.ReactNode; 
  label: string; 
  isActive: boolean; 
  onClick: () => void; 
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 ${
        isActive
          ? 'bg-primary-600 text-white shadow-lg transform scale-105'
          : 'bg-white text-gray-700 hover:bg-gray-50 hover:shadow-md border border-gray-200'
      }`}
    >
      <div className={`${isActive ? 'text-white' : 'text-gray-500'} shrink-0`}>
        {icon}
      </div>
      <span className="truncate">{label}</span>
    </button>
  );
}

export default function WorkersPage() {
  const router = useRouter();
  const [workers, setWorkers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWorkers();
  }, [category]);

  const fetchWorkers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);

      const response = await fetch(`/api/workers?${params}`);
      const data = await response.json();

      if (data.success) {
        setWorkers(data.data);
      }
    } catch (error) {
      console.error('Error fetching workers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredWorkers = workers.filter((worker) =>
    worker.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pb-20">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 right-0 w-48 h-48 sm:w-96 sm:h-96 bg-white/10 rounded-full -translate-y-24 translate-x-24 sm:-translate-y-48 sm:translate-x-48"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 sm:w-64 sm:h-64 bg-white/5 rounded-full translate-y-16 -translate-x-16 sm:translate-y-32 sm:-translate-x-32"></div>
          
          <div className="container mx-auto px-4 py-6 sm:py-8 relative z-10">
            {/* Header with Back Button */}
            <div className="flex items-start sm:items-center mb-6 gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="text-white hover:bg-white/10 p-2 rounded-xl shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Temukan Pekerja Terbaik</h1>
                <p className="text-primary-100 text-sm sm:text-base">Dapatkan bantuan profesional untuk semua kebutuhan Anda</p>
              </div>
              <div className="shrink-0">
                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm">
                  <Users className="h-4 w-4 text-primary-200" />
                  <span className="text-sm font-medium">{workers.length}</span>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Cari nama pekerja atau keahlian..."
                className="pl-12 h-12 sm:h-14 bg-white/95 backdrop-blur-sm text-gray-900 placeholder-gray-500 border-0 shadow-xl rounded-xl text-sm sm:text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white shadow-sm border-b sticky top-16 z-40">
          <div className="container mx-auto px-4 py-4 sm:py-6">
            <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                <span className="text-xs sm:text-sm font-semibold text-gray-900">Kategori:</span>
              </div>
            </div>
            
            <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
              <CategoryButton
                icon={<Users className="h-3 w-3 sm:h-4 sm:w-4" />}
                label="Semua"
                isActive={category === ''}
                onClick={() => setCategory('')}
              />
              <CategoryButton
                icon={<Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />}
                label="Kebersihan"
                isActive={category === 'kebersihan'}
                onClick={() => setCategory('kebersihan')}
              />
              <CategoryButton
                icon={<Settings className="h-3 w-3 sm:h-4 sm:w-4" />}
                label="Teknisi"
                isActive={category === 'teknisi'}
                onClick={() => setCategory('teknisi')}
              />
              <CategoryButton
                icon={<Wrench className="h-3 w-3 sm:h-4 sm:w-4" />}
                label="Renovasi"
                isActive={category === 'renovasi'}
                onClick={() => setCategory('renovasi')}
              />
              <CategoryButton
                icon={<Hammer className="h-3 w-3 sm:h-4 sm:w-4" />}
                label="Tukang"
                isActive={category === 'tukang'}
                onClick={() => setCategory('tukang')}
              />
              <CategoryButton
                icon={<Truck className="h-3 w-3 sm:h-4 sm:w-4" />}
                label="Angkut"
                isActive={category === 'angkut'}
                onClick={() => setCategory('angkut')}
              />
              <CategoryButton
                icon={<TreePine className="h-3 w-3 sm:h-4 sm:w-4" />}
                label="Taman"
                isActive={category === 'taman'}
                onClick={() => setCategory('taman')}
              />
              <CategoryButton
                icon={<MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />}
                label="Lainnya"
                isActive={category === 'lainnya'}
                onClick={() => setCategory('lainnya')}
              />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          {/* Quick Stats */}
          {!isLoading && workers.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 text-center shadow-sm border border-gray-100">
                <div className="flex items-center justify-center mb-1 sm:mb-2">
                  <Users className="h-4 w-4 sm:h-6 sm:w-6 text-primary-600" />
                </div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">{workers.length}</div>
                <div className="text-xs text-gray-600">Total Pekerja</div>
              </div>
              <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 text-center shadow-sm border border-gray-100">
                <div className="flex items-center justify-center mb-1 sm:mb-2">
                  <Award className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
                </div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">4.8</div>
                <div className="text-xs text-gray-600">Rating Rata-rata</div>
              </div>
              <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 text-center shadow-sm border border-gray-100">
                <div className="flex items-center justify-center mb-1 sm:mb-2">
                  <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">98%</div>
                <div className="text-xs text-gray-600">Tingkat Penyelesaian</div>
              </div>
            </div>
          )}

          {/* Results Header */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  {category ? 
                    `Pekerja ${category.charAt(0).toUpperCase() + category.slice(1)}` : 
                    'Semua Pekerja Tersedia'
                  }
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {searchQuery ? (
                    <>Hasil pencarian untuk "<span className="font-semibold text-primary-600">{searchQuery}</span>"</>
                  ) : (
                    'Pilih pekerja profesional terbaik untuk kebutuhan Anda'
                  )}
                </p>
              </div>
              <div className="shrink-0 self-start sm:self-auto">
                <div className="flex items-center gap-2 bg-primary-50 text-primary-700 px-3 sm:px-4 py-2 rounded-lg">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-semibold">{filteredWorkers.length}</span>
                  <span className="text-sm hidden sm:inline">dari {workers.length}</span>
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12 sm:py-20">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 sm:h-20 sm:w-20 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4 sm:mb-6"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary-400" />
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Mencari Pekerja Terbaik</h3>
              <p className="text-sm sm:text-base text-gray-600 px-4">Mohon tunggu sebentar, kami sedang memuat pekerja profesional untuk Anda</p>
            </div>
          ) : filteredWorkers.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 sm:p-16 text-center">
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <Search className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                  {searchQuery ? 'Pencarian Tidak Ditemukan' : 'Belum Ada Pekerja'}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 max-w-md mx-auto px-4">
                  {searchQuery 
                    ? `Maaf, tidak ada pekerja yang cocok dengan pencarian "${searchQuery}". Coba gunakan kata kunci yang berbeda.`
                    : 'Belum ada pekerja yang terdaftar untuk kategori ini. Silakan pilih kategori lain atau coba lagi nanti.'
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {searchQuery && (
                    <Button
                      variant="outline"
                      onClick={() => setSearchQuery('')}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Search className="h-4 w-4" />
                      Hapus Pencarian
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setCategory('');
                      setSearchQuery('');
                    }}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Users className="h-4 w-4" />
                    Lihat Semua Pekerja
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredWorkers.map((worker) => (
                <Link key={worker._id} href={`/pekerja/${worker._id}`}>
                  <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-md hover:scale-[1.02] bg-white overflow-hidden">
                    <CardContent className="p-0">
                      {/* Header Section */}
                      <div className="p-4 sm:p-6 pb-3 sm:pb-4">
                        <div className="flex items-start space-x-3 sm:space-x-4 mb-3 sm:mb-4">
                          <div className="relative shrink-0">
                            <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white font-bold text-sm sm:text-xl shadow-lg group-hover:shadow-xl transition-shadow">
                              {getInitials(worker.name)}
                            </div>
                            {worker.isVerified && (
                              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 shadow-md">
                                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg sm:text-xl text-gray-900 truncate mb-1 group-hover:text-primary-600 transition-colors">
                              {worker.name}
                            </h3>
                            
                            <div className="flex items-center flex-wrap gap-2 sm:gap-3 mb-2">
                              <div className="flex items-center space-x-1">
                                <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 fill-current" />
                                <span className="font-semibold text-gray-900 text-sm sm:text-base">{worker.rating || 4.8}</span>
                                <span className="text-gray-500 text-xs sm:text-sm">({worker.completedTasks || 0})</span>
                              </div>
                              {worker.isAvailable ? (
                                <div className="flex items-center space-x-1">
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                  <span className="text-xs text-green-600 font-medium">Tersedia</span>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3 text-gray-400" />
                                  <span className="text-xs text-gray-500">Offline</span>
                                </div>
                              )}
                            </div>

                            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-3">
                              {worker.workCategories && worker.workCategories.length > 0 
                                ? worker.workCategories.map((cat: string) => {
                                    const categoryMap: { [key: string]: string } = {
                                      kebersihan: 'Kebersihan',
                                      teknisi: 'Teknisi',
                                      renovasi: 'Renovasi',
                                      tukang: 'Tukang',
                                      angkut: 'Angkut Barang',
                                      taman: 'Taman & Kebun',
                                      lainnya: 'Lainnya'
                                    };
                                    return categoryMap[cat] || cat;
                                  }).join(' • ')
                                : 'Pekerja Umum'
                              }
                            </p>

                            <div className="flex items-center space-x-1 text-xs sm:text-sm text-gray-600">
                              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                              <span className="truncate">{worker.location || 'Jakarta'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stats Section */}
                      <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100">
                        <div className="flex items-center justify-center text-xs sm:text-sm">
                          <div className="flex items-center space-x-1 text-green-700">
                            <Award className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="font-medium">{worker.completedTasks || 0} Tugas Selesai</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </>
  );
}
