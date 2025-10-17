'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { BottomNav } from '@/components/layouts/BottomNav';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Star, Clock, DollarSign, User, Calendar, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { getInitials } from '@/lib/utils';

export default function AvailableJobsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'publikasi' | 'permintaan'>('publikasi');

  useEffect(() => {
    fetchJobs();
  }, [category, activeTab]);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (searchQuery) params.append('search', searchQuery);
      
      // Filter by searchMethod based on active tab
      if (activeTab === 'publikasi') {
        params.append('searchMethod', 'publication');
      } else {
        params.append('searchMethod', 'find_worker');
      }

      const response = await fetch(`/api/jobs?${params}`);
      const data = await response.json();

      if (data.success) {
        setJobs(data.data);
      } else {
        toast.error('Gagal memuat pekerjaan');
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Terjadi kesalahan saat memuat pekerjaan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    fetchJobs();
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const getCategoryLabel = (cat: string) => {
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
  };

  const filteredJobs = jobs.filter((job) =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!session) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 pb-20">
          <div className="container mx-auto px-4 py-12 text-center">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Silakan Login</h2>
            <p className="text-gray-600 mb-4">Login untuk melihat pekerjaan yang tersedia</p>
            <Link href="/auth/login">
              <Button>Login Sekarang</Button>
            </Link>
          </div>
        </main>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-white border-b sticky top-16 z-40">
          <div className="container mx-auto px-4 py-4">
            {/* Back to Dashboard Button */}
            <div className="mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Dashboard
              </Button>
            </div>

            <h1 className="text-2xl font-bold mb-4">Pekerjaan Tersedia</h1>

            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-4 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('publikasi')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'publikasi'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Publikasi
              </button>
              <button
                onClick={() => setActiveTab('permintaan')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'permintaan'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Dari Permintaan
              </button>
            </div>

            {/* Tab Description */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                {activeTab === 'publikasi' 
                  ? '📢 Pekerjaan yang dipublikasikan dan mencari pelamar. Anda bisa langsung melamar.'
                  : '🔍 Permintaan pencarian pekerja. Pemberi kerja akan menghubungi Anda jika tertarik.'
                }
              </p>
            </div>

            {/* Search Bar */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Cari pekerjaan..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch}>Cari</Button>
            </div>

            {/* Filter Chips */}
            <div className="flex space-x-2 overflow-x-auto pb-2">
              <button
                onClick={() => setCategory('')}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                  category === ''
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setCategory('kebersihan')}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                  category === 'kebersihan'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Kebersihan
              </button>
              <button
                onClick={() => setCategory('teknisi')}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                  category === 'teknisi'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Teknisi
              </button>
              <button
                onClick={() => setCategory('renovasi')}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                  category === 'renovasi'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Renovasi
              </button>
              <button
                onClick={() => setCategory('tukang')}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                  category === 'tukang'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Tukang
              </button>
              <button
                onClick={() => setCategory('angkut')}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                  category === 'angkut'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Angkut
              </button>
              <button
                onClick={() => setCategory('taman')}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                  category === 'taman'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Taman
              </button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Ditemukan <strong>{filteredJobs.length} pekerjaan</strong>
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Memuat pekerjaan...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <Search className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Tidak ada pekerjaan ditemukan
                </h3>
                <p className="text-gray-500">
                  {searchQuery || category 
                    ? 'Coba ubah kata kunci atau kategori pencarian'
                    : 'Belum ada pekerjaan yang tersedia saat ini'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredJobs.map((job) => (
                <Link key={job._id} href={`/pekerjaan/${job._id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Job Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{job.title}</h3>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="inline-block px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                                {getCategoryLabel(job.category)}
                              </span>
                              <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                job.searchMethod === 'publication' 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : 'bg-purple-100 text-purple-700'
                              }`}>
                                {job.searchMethod === 'publication' ? '📢 Publikasi' : '🔍 Permintaan'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg text-primary-600">
                              {formatCurrency(job.budget)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {job.pricingType === 'fixed' ? 'Total' : 'Per jam'}
                            </div>
                          </div>
                        </div>

                        {/* Job Description */}
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {job.description}
                        </p>

                        {/* Job Details */}
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span className="truncate">{job.location}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(job.scheduledDate)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{job.scheduledTime} WIB</span>
                          </div>
                          {job.estimatedDuration && (
                            <div className="flex items-center space-x-1">
                              <span>⏱️</span>
                              <span>{job.estimatedDuration}</span>
                            </div>
                          )}
                        </div>

                        {/* Poster Info */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="flex items-center space-x-2">
                            <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {getInitials(job.postedBy?.name || job.poster?.name || 'Pengguna')}
                            </div>
                            <div>
                              <div className="flex items-center space-x-1">
                                <span className="text-sm font-medium">{job.postedBy?.name || job.poster?.name}</span>
                                {(job.postedBy?.isVerified || job.poster?.isVerified) && (
                                  <span className="text-blue-500 text-sm">✓</span>
                                )}
                              </div>
                              {(job.postedBy?.rating || job.poster?.rating) && (
                                <div className="flex items-center space-x-1">
                                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                  <span className="text-xs text-gray-600">{job.postedBy?.rating || job.poster?.rating}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            {job.applicants > 0 && (
                              <div className="text-xs text-gray-500">
                                {job.applicants} pelamar
                              </div>
                            )}
                            <div className="text-xs text-gray-400">
                              {new Date(job.createdAt).toLocaleDateString('id-ID')}
                            </div>
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