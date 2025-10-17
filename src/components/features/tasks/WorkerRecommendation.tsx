'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Star, 
  MapPin, 
  CheckCircle,
  Brain,
  Target,
  TrendingUp,
  Users
} from 'lucide-react';

interface RecommendedWorker {
  _id: string;
  name: string;
  email: string;
  image?: string;
  rating: number;
  completedTasks: number;
  location?: string;
  isVerified: boolean;
  workCategories: string[];
  phone?: string;
  about?: string;
  semanticScore: number;
  categoryScore: number;
  distanceScore: number;
  ratingScore: number;
  experienceScore?: number;
  reliabilityScore?: number;
  totalScore: number;
}

interface WorkerRecommendationProps {
  jobData: {
    title: string;
    description: string;
    category: string;
    location?: string;
    locationCoordinates?: { lat: number; lng: number };
  };
  onWorkerSelect?: (worker: RecommendedWorker) => void;
}

const categoryLabels: Record<string, string> = {
  kebersihan: 'Kebersihan',
  teknisi: 'Teknisi',
  renovasi: 'Renovasi',
  tukang: 'Tukang',
  angkut: 'Angkut Barang',
  taman: 'Taman & Kebun',
  lainnya: 'Lainnya'
};

export function WorkerRecommendation({ jobData, onWorkerSelect }: WorkerRecommendationProps) {
  const [workers, setWorkers] = useState<RecommendedWorker[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const fetchRecommendations = async () => {
    if (!jobData.title || !jobData.description || !jobData.category) {
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await fetch('/api/workers/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: jobData.title,
          description: jobData.description,
          category: jobData.category,
          location: jobData.location,
          locationCoordinates: jobData.locationCoordinates,
          limit: 5
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setWorkers(result.data || []);
      } else {
        throw new Error(result.error || 'Failed to fetch recommendations');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-gray-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return 'Sangat Cocok';
    if (score >= 0.6) return 'Cocok';
    if (score >= 0.4) return 'Cukup Cocok';
    return 'Kurang Cocok';
  };

  // Always show the component, but with different states
  if (!hasSearched) {
    const isFormComplete = jobData.title && jobData.description && jobData.category;
    
    return (
      <Card className="border-2 border-dashed border-blue-200 bg-blue-50">
        <CardContent className="p-4 sm:p-6 text-center">
          <Brain className="h-10 w-10 sm:h-12 sm:w-12 text-blue-500 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-2">
            <span className="hidden sm:inline">🤖 Rekomendasi Pekerja Cerdas</span>
            <span className="sm:hidden">🤖 Rekomendasi AI</span>
          </h3>
          
          {!isFormComplete ? (
            <div>
              <p className="text-blue-700 mb-3 sm:mb-4 text-sm sm:text-base">
                <span className="hidden sm:inline">Lengkapi informasi berikut untuk mendapatkan rekomendasi AI:</span>
                <span className="sm:hidden">Lengkapi form untuk rekomendasi AI:</span>
              </p>
              <div className="text-xs sm:text-sm text-blue-600 mb-3 sm:mb-4">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
                  <span className={jobData.title ? 'text-green-600' : 'text-gray-500'}>
                    {jobData.title ? '✅' : '❌'} 
                    <span className="hidden sm:inline"> Judul Pekerjaan</span>
                    <span className="sm:hidden"> Judul</span>
                  </span>
                  <span className={jobData.description ? 'text-green-600' : 'text-gray-500'}>
                    {jobData.description ? '✅' : '❌'} Deskripsi
                  </span>
                  <span className={jobData.category ? 'text-green-600' : 'text-gray-500'}>
                    {jobData.category ? '✅' : '❌'} Kategori
                  </span>
                </div>
              </div>
              <Button
                onClick={fetchRecommendations}
                disabled={true}
                className="bg-gray-400 cursor-not-allowed text-sm w-full sm:w-auto"
              >
                <Brain className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                <span className="hidden sm:inline">Lengkapi Form Dulu</span>
                <span className="sm:hidden">Form Belum Lengkap</span>
              </Button>
            </div>
          ) : (
            <div>
              <p className="text-blue-700 mb-3 sm:mb-4 text-sm sm:text-base">
                <span className="hidden sm:inline">Form sudah lengkap! Sistem AI siap menganalisis dan memberikan rekomendasi 
                pekerja terbaik berdasarkan keahlian, pengalaman, rating, dan lokasi.</span>
                <span className="sm:hidden">Form lengkap! AI siap memberikan rekomendasi terbaik.</span>
              </p>
              <Button
                onClick={fetchRecommendations}
                className="bg-blue-600 hover:bg-blue-700 text-sm w-full sm:w-auto"
              >
                <Brain className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                <span className="hidden sm:inline">🚀 Cari Rekomendasi Pekerja</span>
                <span className="sm:hidden">🚀 Cari Rekomendasi</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 sm:p-6 text-center">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto mb-3 sm:mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">
            <span className="hidden sm:inline">Mencari pekerja terbaik untuk Anda...</span>
            <span className="sm:hidden">Mencari pekerja...</span>
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6 text-center">
          <div className="text-red-600 mb-4">❌ {error}</div>
          <Button
            onClick={fetchRecommendations}
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            Coba Lagi
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            <span className="text-base sm:text-lg">
              <span className="hidden sm:inline">Rekomendasi Pekerja Terbaik</span>
              <span className="sm:hidden">Rekomendasi AI</span>
            </span>
          </CardTitle>
          <Button
            onClick={fetchRecommendations}
            variant="outline"
            size="sm"
            className="text-blue-600 border-blue-300 hover:bg-blue-50 text-xs sm:text-sm px-2 sm:px-3"
          >
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">↻</span>
          </Button>
        </div>
        <p className="text-xs sm:text-sm text-gray-600">
          <span className="hidden sm:inline">Algoritma seimbang: Rating & Lokasi (40%) + AI, Kategori & Pengalaman (60%)</span>
          <span className="sm:hidden">Rating/Lokasi (40%) + AI/Kategori/Exp (60%)</span>
        </p>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {workers.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <Users className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <p className="text-gray-600 mb-2 text-sm sm:text-base">
              <span className="hidden sm:inline">Tidak ada pekerja yang ditemukan</span>
              <span className="sm:hidden">Tidak ada pekerja</span>
            </p>
            <p className="text-xs sm:text-sm text-gray-500">
              <span className="hidden sm:inline">Coba ubah kategori atau kriteria pekerjaan</span>
              <span className="sm:hidden">Coba ubah kriteria</span>
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {workers.map((worker, index) => (
              <div
                key={worker._id}
                className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow bg-white"
              >
                {/* Mobile: Stack score on top, Desktop: Score on right */}
                <div className="flex items-start justify-between mb-3 sm:mb-3">
                  <div className="flex items-start space-x-2 sm:space-x-3 flex-1">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      {worker.image ? (
                        <img
                          src={worker.image}
                          alt={worker.name}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between sm:items-center sm:justify-start mb-1">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{worker.name}</h4>
                          {worker.isVerified && (
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                          )}
                          <Badge
                            variant="outline"
                            className={`text-xs ${index === 0 ? 'bg-gold-50 text-gold-700 border-gold-200' : ''}`}
                          >
                            #{index + 1}
                          </Badge>
                        </div>
                        {/* Mobile score display */}
                        <div className="text-right sm:hidden ml-2">
                          <div className={`text-base font-bold ${getScoreColor(worker.totalScore)}`}>
                            {Math.round(worker.totalScore * 100)}%
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {getScoreLabel(worker.totalScore)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Stats row - responsive layout */}
                      <div className="flex items-center flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-2">
                        <div className="flex items-center">
                          <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 mr-1 fill-current" />
                          <span>{worker.rating.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center">
                          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1" />
                          <span className="hidden sm:inline">{worker.completedTasks} tugas</span>
                          <span className="sm:hidden">{worker.completedTasks}</span>
                        </div>
                        {worker.location && (
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 mr-1" />
                            <span className="truncate max-w-20 sm:max-w-none">{worker.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Categories - responsive layout */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {worker.workCategories.slice(0, 3).map((cat) => (
                          <Badge key={cat} variant="secondary" className="text-[10px] sm:text-xs">
                            {categoryLabels[cat] || cat}
                          </Badge>
                        ))}
                        {worker.workCategories.length > 3 && (
                          <Badge variant="secondary" className="text-[10px] sm:text-xs">
                            +{worker.workCategories.length - 3}
                          </Badge>
                        )}
                      </div>
                      
                      {worker.about && (
                        <p className="text-xs sm:text-sm text-gray-700 line-clamp-2">
                          {worker.about}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Desktop score display */}
                  <div className="text-right hidden sm:block ml-4">
                    <div className={`text-lg font-bold ${getScoreColor(worker.totalScore)}`}>
                      {Math.round(worker.totalScore * 100)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {getScoreLabel(worker.totalScore)}
                    </div>
                  </div>
                </div>

                {/* Score Breakdown - Responsive Layout */}
                <div className="mb-3">
                  {/* Mobile: 2 rows of scores */}
                  <div className="grid grid-cols-3 gap-1 sm:hidden text-xs">
                    <div className="text-center">
                      <div className="text-red-600 font-bold">
                        {Math.round(worker.ratingScore * 100)}%
                      </div>
                      <div className="text-gray-500 text-[9px]">Rating</div>
                    </div>
                    <div className="text-center">
                      <div className="text-orange-600 font-bold">
                        {Math.round(worker.distanceScore * 100)}%
                      </div>
                      <div className="text-gray-500 text-[9px]">Lokasi</div>
                    </div>
                    <div className="text-center">
                      <div className="text-purple-600 font-medium">
                        {Math.round(worker.semanticScore * 100)}%
                      </div>
                      <div className="text-gray-500 text-[9px]">AI</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1 sm:hidden text-xs mt-1">
                    <div className="text-center">
                      <div className="text-blue-600 font-medium">
                        {Math.round(worker.categoryScore * 100)}%
                      </div>
                      <div className="text-gray-500 text-[9px]">Kategori</div>
                    </div>
                    <div className="text-center">
                      <div className="text-green-600 font-medium">
                        {Math.round((worker as any).experienceScore * 100)}%
                      </div>
                      <div className="text-gray-500 text-[9px]">Exp</div>
                    </div>
                  </div>
                  
                  {/* Desktop: Single row */}
                  <div className="hidden sm:grid grid-cols-5 gap-1 text-xs">
                    <div className="text-center">
                      <div className="text-red-600 font-bold">
                        {Math.round(worker.ratingScore * 100)}%
                      </div>
                      <div className="text-gray-500 text-[10px]">Rating (20%)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-orange-600 font-bold">
                        {Math.round(worker.distanceScore * 100)}%
                      </div>
                      <div className="text-gray-500 text-[10px]">Lokasi (20%)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-purple-600 font-medium">
                        {Math.round(worker.semanticScore * 100)}%
                      </div>
                      <div className="text-gray-500 text-[10px]">AI (20%)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-blue-600 font-medium">
                        {Math.round(worker.categoryScore * 100)}%
                      </div>
                      <div className="text-gray-500 text-[10px]">Kategori (20%)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-green-600 font-medium">
                        {Math.round((worker as any).experienceScore * 100)}%
                      </div>
                      <div className="text-gray-500 text-[10px]">Exp (20%)</div>
                    </div>
                  </div>
                </div>
                
                {/* Rating & Experience Details - Responsive */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-gray-600 mb-2">
                  <div className="flex items-center space-x-1">
                    <span className="text-red-500">⭐</span>
                    <span className="hidden sm:inline">Rating: {worker.rating.toFixed(1)}/5.0</span>
                    <span className="sm:hidden">{worker.rating.toFixed(1)}/5.0</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-green-500">🏆</span>
                    <span className="hidden sm:inline">{worker.completedTasks} tugas selesai</span>
                    <span className="sm:hidden">{worker.completedTasks} selesai</span>
                  </div>
                  {worker.reliabilityScore && (
                    <div className="flex items-center space-x-1">
                      <span className="text-purple-500">🛡️</span>
                      <span className="hidden sm:inline">Reliability: {Math.round(worker.reliabilityScore * 100)}%</span>
                      <span className="sm:hidden">{Math.round(worker.reliabilityScore * 100)}%</span>
                    </div>
                  )}
                </div>

                {onWorkerSelect && (
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Button
                      size="sm"
                      onClick={() => onWorkerSelect(worker)}
                      className="w-full sm:flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-sm"
                    >
                      <Target className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      <span className="hidden sm:inline">🚀 Pilih & Buat Kontrak</span>
                      <span className="sm:hidden">🚀 Pilih</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`/pekerja/${worker._id}`, '_blank')}
                      className="w-full sm:w-auto text-sm"
                    >
                      <span className="hidden sm:inline">Lihat Profil</span>
                      <span className="sm:hidden">Profil</span>
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}