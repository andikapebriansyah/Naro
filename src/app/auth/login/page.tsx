'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Shield, Star, Briefcase, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary-500/5 via-transparent to-purple-500/5"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-16 h-16 bg-blue-200/30 rounded-full animate-float"></div>
      <div className="absolute top-40 right-20 w-12 h-12 bg-purple-200/30 rounded-full animate-bounce-gentle" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-20 left-20 w-20 h-20 bg-indigo-200/30 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-40 right-10 w-8 h-8 bg-pink-200/30 rounded-full animate-bounce-gentle" style={{ animationDelay: '0.5s' }}></div>

      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Branding & Features */}
        <div className="hidden lg:flex lg:flex-1 flex-col justify-center px-12 xl:px-16">
          <div className="max-w-lg animate-slide-in-from-left">
            {/* Logo & Brand */}
            <div className="flex items-center space-x-4 mb-8">
              <div className="relative w-16 h-16 bg-white rounded-2xl shadow-xl p-2">
                <Image
                  src="/logo/image.png"
                  alt="Naro Logo"
                  width={48}
                  height={48}
                  className="w-12 h-12 object-contain"
                  priority
                />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Naro
                </h1>
                <p className="text-lg text-gray-600 font-medium">Platform Kerja Terpercaya</p>
              </div>
            </div>

            {/* Hero Text */}
            <div className="mb-10">
              <h2 className="text-3xl xl:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                Temukan Pekerja Terpercaya atau Pekerjaan Impian Anda
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Bergabunglah dengan ribuan profesional dan klien yang telah mempercayai Naro untuk kebutuhan pekerjaan mereka.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-6 mb-10">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Aman & Terpercaya</h3>
                  <p className="text-gray-600 text-sm">Semua pengguna telah diverifikasi dengan KTP untuk keamanan maksimal</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Beragam Kategori</h3>
                  <p className="text-gray-600 text-sm">Dari kebersihan hingga teknisi, temukan atau tawarkan berbagai jenis pekerjaan</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Rating & Review</h3>
                  <p className="text-gray-600 text-sm">Sistem rating yang transparan untuk membantu Anda memilih yang terbaik</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">1000+</div>
                <div className="text-sm text-gray-600">Pengguna Aktif</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">500+</div>
                <div className="text-sm text-gray-600">Pekerjaan Selesai</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">4.8★</div>
                <div className="text-sm text-gray-600">Rating Rata-rata</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-8">
          <div className="w-full max-w-md animate-slide-in-from-right">
            {/* Mobile Logo */}
            <div className="flex justify-center mb-8 lg:hidden">
              <div className="relative w-20 h-20 bg-white rounded-2xl shadow-xl p-3">
                <Image
                  src="/logo/image.png"
                  alt="Naro Logo"
                  width={56}
                  height={56}
                  className="w-14 h-14 object-contain"
                  priority
                />
              </div>
            </div>

            <Card className="w-full backdrop-blur-sm bg-white/90 border-0 shadow-2xl shadow-blue-500/10">
              <CardHeader className="text-center pb-8">
                <div className="lg:hidden mb-4">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Naro</h1>
                  <p className="text-gray-600">Platform Kerja Terpercaya</p>
                </div>
                <CardTitle className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Selamat Datang Kembali
                </CardTitle>
                <CardDescription className="text-base text-gray-600 mt-2">
                  Masuk untuk mengakses dashboard dan mulai bekerja
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6 px-8 pb-8">
                <Button
                  onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                  className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  size="lg"
                >
                  <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Masuk dengan Google
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                {/* Benefits */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 space-y-3">
                  <h4 className="font-semibold text-gray-800 text-center mb-3">Keuntungan Bergabung:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Akses ke ribuan pekerjaan & pekerja</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Sistem pembayaran yang aman</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Dukungan customer service 24/7</span>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Dengan masuk, Anda menyetujui{' '}
                    <Link href="#" className="text-primary-600 hover:text-primary-700 font-medium hover:underline transition-colors">
                      Syarat & Ketentuan
                    </Link>{' '}
                    dan{' '}
                    <Link href="#" className="text-primary-600 hover:text-primary-700 font-medium hover:underline transition-colors">
                      Kebijakan Privasi
                    </Link>{' '}
                    kami
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* CTA Footer */}
            <div className="text-center mt-8">
              <p className="text-gray-600">
                Belum punya akun?{' '}
                <span className="text-primary-600 font-semibold">Daftar otomatis saat login pertama!</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
