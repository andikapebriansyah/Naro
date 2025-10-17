'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layouts/Header';
import { BottomNav } from '@/components/layouts/BottomNav';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Star } from 'lucide-react';
import Link from 'next/link';
import { getInitials } from '@/lib/utils';

export default function WorkersPage() {
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
        <div className="bg-white border-b sticky top-16 z-40">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold mb-4">Cari Pekerja</h1>

            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Cari nama pekerja..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
              Ditemukan <strong>{filteredWorkers.length} pekerja</strong>
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Memuat pekerja...</p>
            </div>
          ) : filteredWorkers.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-500">Tidak ada pekerja ditemukan</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredWorkers.map((worker) => (
                <Link key={worker._id} href={`/pekerja/${worker._id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-white font-medium flex-shrink-0">
                          {getInitials(worker.name)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold truncate">{worker.name}</h3>
                            {worker.isVerified && (
                              <span className="text-blue-500">✓</span>
                            )}
                          </div>

                          <p className="text-sm text-gray-600 mb-2">
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
                                }).join(', ')
                              : 'Pekerja Umum'
                            }
                          </p>

                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="font-medium">{worker.rating || 0}</span>
                              <span>({worker.completedTasks || 0})</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span>✓</span>
                              <span>{worker.completedTasks || 0} tugas</span>
                            </div>
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center space-x-1 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span>{worker.location || 'Tidak diketahui'}</span>
                            </div>
                            {worker.isAvailable && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                Tersedia
                              </span>
                            )}
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
