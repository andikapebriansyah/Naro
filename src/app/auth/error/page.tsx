'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Suspense } from 'react';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'OAuthAccountNotLinked':
        return {
          title: 'Akun Tidak Dapat Dihubungkan',
          description: 'Email Anda sudah terdaftar dengan metode login lain. Silakan coba lagi atau hubungi dukungan.',
        };
      case 'OAuthCallback':
        return {
          title: 'Kesalahan OAuth',
          description: 'Terjadi kesalahan saat proses login dengan Google. Silakan coba lagi.',
        };
      case 'AccessDenied':
        return {
          title: 'Akses Ditolak',
          description: 'Anda tidak memiliki izin untuk mengakses aplikasi ini.',
        };
      default:
        return {
          title: 'Kesalahan Login',
          description: 'Terjadi kesalahan yang tidak diketahui. Silakan coba lagi.',
        };
    }
  };

  const errorInfo = getErrorMessage(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-red-600 text-white">
              <svg
                className="h-8 w-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
          </div>
          <CardTitle className="text-2xl text-red-600">{errorInfo.title}</CardTitle>
          <CardDescription className="text-gray-600">
            {errorInfo.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link href="/auth/login">
            <Button className="w-full" size="lg">
              Kembali ke Login
            </Button>
          </Link>
          
          {error === 'OAuthAccountNotLinked' && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Solusi:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Coba login dengan metode yang sama seperti sebelumnya</li>
                <li>• Atau hubungi dukungan untuk menggabungkan akun</li>
              </ul>
            </div>
          )}
          
          <p className="text-center text-sm text-gray-500">
            Jika masalah berlanjut, silakan hubungi{' '}
            <a href="mailto:support@naro.app" className="text-primary-600 hover:underline">
              dukungan teknis
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  );
}