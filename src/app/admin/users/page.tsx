'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import {
  Users,
  Search,
  Filter,
  Trash2,
  Eye,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Shield,
  CheckCircle,
  Clock,
  XCircle,
  Star,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Wallet,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'tasker' | 'admin';
  isVerified: boolean;
  balance: number;
  completedTasks: number;
  rating: number;
  location?: string;
  createdAt: string;
  ktpVerification?: {
    status: 'pending' | 'approved' | 'rejected' | 'not_submitted';
  };
}

interface UserStats {
  totalUsers: number;
  verifiedUsers: number;
  pendingVerifications: number;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    verifiedUsers: 0,
    pendingVerifications: 0,
  });
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Check if user is admin
  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user || session.user.role !== 'admin') {
      toast.error('Akses ditolak - Hanya admin yang bisa mengakses halaman ini');
      router.push('/dashboard');
      return;
    }
  }, [session, status, router]);

  // Fetch users data
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchQuery && { search: searchQuery }),
        ...(roleFilter !== 'all' && { role: roleFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.data);
        setPagination(data.pagination);
        setStats(data.stats);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Gagal memuat data pengguna');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, roleFilter, statusFilter]);

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    fetchUsers();
  };

  // Handle delete user
  const handleDeleteUser = async (userId: string, userName: string) => {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus pengguna "${userName}"? Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait termasuk tugas, ulasan, dan notifikasi.`
    );

    if (!confirmed) return;

    setIsDeleting(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Pengguna ${userName} berhasil dihapus`);
        fetchUsers(); // Refresh data
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus pengguna');
    } finally {
      setIsDeleting(null);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get role badge
  const getRoleBadge = (role: string) => {
    const variants: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
      admin: 'destructive',
      tasker: 'default',
      user: 'secondary',
    };

    const labels: { [key: string]: string } = {
      admin: 'Admin',
      tasker: 'Pekerja',
      user: 'Pengguna',
    };

    return (
      <Badge variant={variants[role] || 'outline'}>
        {labels[role] || role}
      </Badge>
    );
  };

  // Get verification status badge
  const getVerificationBadge = (user: User) => {
    if (user.isVerified) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Terverifikasi
        </Badge>
      );
    }

    if (user.ktpVerification?.status === 'pending') {
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="bg-gray-100 text-gray-800">
        <XCircle className="w-3 h-3 mr-1" />
        Belum Verifikasi
      </Badge>
    );
  };

  if (status === 'loading' || isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary-600" />
            <p className="text-gray-600">Memuat data pengguna...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Users className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Kelola Pengguna</h1>
                  <p className="text-gray-600">Lihat dan kelola semua data pengguna</p>
                </div>
              </div>
              <Button
                onClick={() => router.push('/admin')}
                variant="outline"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Dashboard
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Pengguna</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                    </div>
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Terverifikasi</p>
                      <p className="text-3xl font-bold text-green-600">{stats.verifiedUsers}</p>
                    </div>
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Verifikasi</p>
                      <p className="text-3xl font-bold text-yellow-600">{stats.pendingVerifications}</p>
                    </div>
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="w-5 h-5" />
                <span>Filter & Pencarian</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="md:col-span-2">
                  <Label htmlFor="search">Cari Pengguna</Label>
                  <div className="flex space-x-2 mt-1">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="search"
                        placeholder="Cari nama atau email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      />
                    </div>
                    <Button onClick={handleSearch}>
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Role Filter */}
                <div>
                  <Label>Role</Label>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">Semua Role</option>
                    <option value="user">Pengguna</option>
                    <option value="tasker">Pekerja</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <Label>Status Verifikasi</Label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">Semua Status</option>
                    <option value="verified">Terverifikasi</option>
                    <option value="pending">Pending</option>
                    <option value="unverified">Belum Verifikasi</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Daftar Pengguna</CardTitle>
                <div className="text-sm text-gray-500">
                  Menampilkan {users.length} dari {pagination.totalUsers} pengguna
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Pengguna</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Role</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Statistik</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Bergabung</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            {user.phone && (
                              <div className="text-sm text-gray-500 flex items-center mt-1">
                                <Phone className="w-3 h-3 mr-1" />
                                {user.phone}
                              </div>
                            )}
                            {user.location && (
                              <div className="text-sm text-gray-500 flex items-center mt-1">
                                <MapPin className="w-3 h-3 mr-1" />
                                {user.location}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {getRoleBadge(user.role)}
                        </td>
                        <td className="py-4 px-4">
                          {getVerificationBadge(user)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <div className="text-sm flex items-center">
                              <Wallet className="w-3 h-3 mr-1 text-green-600" />
                              <span className="font-medium text-green-600">
                                {formatCurrency(user.balance)}
                              </span>
                            </div>
                            <div className="text-sm flex items-center">
                              <TrendingUp className="w-3 h-3 mr-1 text-blue-600" />
                              <span>{user.completedTasks} tugas selesai</span>
                            </div>
                            {user.rating > 0 && (
                              <div className="text-sm flex items-center">
                                <Star className="w-3 h-3 mr-1 text-yellow-500" />
                                <span>{user.rating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-500 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(user.createdAt)}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex justify-end space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/pekerja/${user._id}`)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Lihat
                            </Button>
                            
                            {user.role !== 'admin' && (
                              <Button
                                size="sm"
                                variant="danger"
                                disabled={isDeleting === user._id}
                                onClick={() => handleDeleteUser(user._id, user.name)}
                              >
                                {isDeleting === user._id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-4">
                {users.map((user) => (
                  <Card key={user._id} className="p-4">
                    <div className="space-y-3">
                      {/* User Info */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{user.name}</h3>
                          <p className="text-sm text-gray-500 flex items-center mt-1">
                            <Mail className="w-3 h-3 mr-1" />
                            {user.email}
                          </p>
                          {user.phone && (
                            <p className="text-sm text-gray-500 flex items-center mt-1">
                              <Phone className="w-3 h-3 mr-1" />
                              {user.phone}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1">
                          {getRoleBadge(user.role)}
                          {getVerificationBadge(user)}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="flex items-center text-green-600">
                            <Wallet className="w-3 h-3 mr-1" />
                            <span className="font-medium">{formatCurrency(user.balance)}</span>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center">
                            <TrendingUp className="w-3 h-3 mr-1 text-blue-600" />
                            <span>{user.completedTasks} tugas</span>
                          </div>
                        </div>
                        {user.rating > 0 && (
                          <div>
                            <div className="flex items-center">
                              <Star className="w-3 h-3 mr-1 text-yellow-500" />
                              <span>{user.rating.toFixed(1)} rating</span>
                            </div>
                          </div>
                        )}
                        <div>
                          <div className="flex items-center text-gray-500">
                            <Calendar className="w-3 h-3 mr-1" />
                            <span>{formatDate(user.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2 pt-2 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => router.push(`/pekerja/${user._id}`)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Lihat
                        </Button>
                        
                        {user.role !== 'admin' && (
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={isDeleting === user._id}
                            onClick={() => handleDeleteUser(user._id, user.name)}
                          >
                            {isDeleting === user._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Empty State */}
              {users.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Tidak ada pengguna ditemukan
                  </h3>
                  <p className="text-gray-600">
                    Coba ubah filter pencarian atau hapus kata kunci pencarian.
                  </p>
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <div className="text-sm text-gray-700">
                    Halaman {pagination.currentPage} dari {pagination.totalPages}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={!pagination.hasPrevPage}
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Sebelumnya
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                    >
                      Selanjutnya
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}