// src/app/admin/page.tsx - UPDATED VERSION
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layouts/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Shield,
  Users,
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface DashboardStats {
  totalUsers: number;
  totalTasks: number;
  pendingVerifications: number;
  pendingReports: number;
  verifiedUsers: number;
  activeTasks: number;
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalTasks: 0,
    pendingVerifications: 0,
    pendingReports: 0,
    verifiedUsers: 0,
    activeTasks: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is admin
  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user || session.user.role !== 'admin') {
      toast.error('Akses ditolak - Hanya admin yang bisa mengakses halaman ini');
      router.push('/dashboard');
    }
  }, [session, status, router]);

  // Fetch dashboard stats
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      
      // Fetch verifications
      const verificationsRes = await fetch('/api/admin/verifications?status=all');
      const verificationsData = await verificationsRes.json();
      
      // ✅ Fetch reports
      const reportsRes = await fetch('/api/admin/reports?status=all');
      const reportsData = await reportsRes.json();
      
      if (verificationsData.success) {
        const verifications = verificationsData.data;
        const reports = reportsData.success ? reportsData.data : [];
        
        setStats({
          totalUsers: verifications.length,
          totalTasks: 0, // TODO: Implement when tasks API is ready
          pendingVerifications: verifications.filter(
            (v: any) => v.ktpVerification?.status === 'pending'
          ).length,
          pendingReports: reports.filter(
            (r: any) => r.status === 'pending'
          ).length,
          verifiedUsers: verifications.filter(
            (v: any) => v.ktpVerification?.status === 'approved'
          ).length,
          activeTasks: 0, // TODO: Implement when tasks API is ready
        });
      }
    } catch (error) {
      console.error('Fetch stats error:', error);
      toast.error('Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-3 bg-primary-100 rounded-lg">
                <Shield className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Admin Dashboard
                </h1>
                <p className="text-gray-600">
                  Selamat datang, {session?.user.name}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Total Users */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Pengguna</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
                  <span>Terdaftar di sistem</span>
                </div>
              </CardContent>
            </Card>

            {/* Verified Users */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Pengguna Terverifikasi</p>
                    <p className="text-3xl font-bold text-green-600">{stats.verifiedUsers}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span>
                    {stats.totalUsers > 0
                      ? Math.round((stats.verifiedUsers / stats.totalUsers) * 100)
                      : 0}
                    % dari total pengguna
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Pending Verifications */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Verifikasi Pending</p>
                    <p className="text-3xl font-bold text-yellow-600">
                      {stats.pendingVerifications}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span>Memerlukan review</span>
                </div>
              </CardContent>
            </Card>

            {/* Total Tasks */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Tugas</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalTasks}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <ClipboardList className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span>Semua tugas di sistem</span>
                </div>
              </CardContent>
            </Card>

            {/* Active Tasks */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Tugas Aktif</p>
                    <p className="text-3xl font-bold text-primary-600">{stats.activeTasks}</p>
                  </div>
                  <div className="p-3 bg-primary-100 rounded-lg">
                    <ClipboardList className="h-6 w-6 text-primary-600" />
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span>Dalam proses</span>
                </div>
              </CardContent>
            </Card>

            {/* Pending Reports */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Laporan Pending</p>
                    <p className="text-3xl font-bold text-red-600">{stats.pendingReports}</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span>Memerlukan review</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Verifications */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Shield className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <CardTitle>Verifikasi KTP</CardTitle>
                    <CardDescription>
                      Kelola verifikasi identitas pengguna
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Menunggu review:</span>
                    <span className="font-semibold text-yellow-600">
                      {stats.pendingVerifications} verifikasi
                    </span>
                  </div>
                  <Link href="/admin/verifications">
                    <Button className="w-full">
                      Lihat Verifikasi
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Reports - ✅ UPDATED */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <CardTitle>Laporan & Sengketa</CardTitle>
                    <CardDescription>
                      Kelola laporan dari pengguna
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Menunggu review:</span>
                    <span className="font-semibold text-red-600">
                      {stats.pendingReports} laporan
                    </span>
                  </div>
                  {/* ✅ UPDATED: Remove disabled, add proper link */}
                  <Link href="/admin/reports">
                    <Button className="w-full bg-red-600 hover:bg-red-700">
                      Lihat Laporan
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Users Management */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Kelola Pengguna</CardTitle>
                    <CardDescription>
                      Lihat dan kelola data semua pengguna
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total pengguna:</span>
                    <span className="font-semibold text-blue-600">
                      {stats.totalUsers} pengguna
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Terverifikasi:</span>
                    <span className="font-semibold text-green-600">
                      {stats.verifiedUsers} pengguna
                    </span>
                  </div>
                  <Link href="/admin/users">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      Kelola Pengguna
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info Box */}
          <Card className="mt-6 bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <Shield className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Tanggung Jawab Admin
                  </h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Verifikasi identitas pengguna dengan teliti</li>
                    <li>• Review dan selesaikan laporan dengan adil</li>
                    <li>• Jaga privasi dan keamanan data pengguna</li>
                    <li>• Pastikan platform aman dan terpercaya</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}