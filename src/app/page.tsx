'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layouts/Header';
import { ChevronRight, CheckCircle, Shield, FileText, Sparkles } from 'lucide-react';

export default function HomePage() {
  const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[data-animate]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const categories = [
    { name: 'Kebersihan', icon: '🧹', color: 'from-blue-400 to-blue-600' },
    { name: 'Teknisi', icon: '🔧', color: 'from-purple-400 to-purple-600' },
    { name: 'Renovasi', icon: '🏗️', color: 'from-orange-400 to-orange-600' },
    { name: 'Tukang', icon: '🔨', color: 'from-green-400 to-green-600' },
    { name: 'Angkut', icon: '📦', color: 'from-red-400 to-red-600' },
    { name: 'Taman', icon: '🌱', color: 'from-emerald-400 to-emerald-600' },
    { name: 'Pengiriman', icon: '🚚', color: 'from-indigo-400 to-indigo-600' },
    { name: 'Lainnya', icon: '✨', color: 'from-pink-400 to-pink-600' },
  ];

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center">
            {/* Logo with animation */}
            <div 
              className="flex justify-center mb-8"
              style={{
                animation: 'float 3s ease-in-out infinite',
              }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-xl opacity-50 animate-pulse"></div>
                <div className="relative h-24 w-24 rounded-full overflow-hidden bg-white shadow-2xl flex items-center justify-center">
                  <Image 
                    src="/logo/image.png"
                    alt="Naro Logo"
                    width={96}
                    height={96}
                    className="object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Title with gradient and animation */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent animate-gradient">
                Naro
              </span>
            </h1>

            {/* Subtitle with fade-in */}
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Platform Digital Aman dan Adil untuk Pekerja Informal
            </p>

            {/* CTA Buttons with hover effects */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/auth/login">
                <button className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold text-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden w-full sm:w-auto">
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Mulai Sekarang
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </Link>
              <Link href="/pekerja">
                <button className="px-8 py-4 bg-white text-gray-900 rounded-full font-semibold text-lg border-2 border-gray-200 hover:border-purple-600 hover:shadow-lg transition-all duration-300 hover:scale-105 w-full sm:w-auto">
                  Cari Pekerja
                </button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 md:gap-12 text-center">
              <div className="group">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform">
                  10K+
                </div>
                <div className="text-gray-600 text-sm md:text-base">Pekerja Aktif</div>
              </div>
              <div className="group">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform">
                  50K+
                </div>
                <div className="text-gray-600 text-sm md:text-base">Pekerjaan Selesai</div>
              </div>
              <div className="group">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform">
                  4.9★
                </div>
                <div className="text-gray-600 text-sm md:text-base">Rating Pengguna</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white" id="features" data-animate>
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full mb-4">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-purple-900 font-semibold text-sm">Keunggulan Kami</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Mengapa Pilih Naro?
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Kami menyediakan platform yang aman, transparan, dan mudah digunakan
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <CheckCircle className="w-8 h-8" />,
                title: 'Verifikasi Terpercaya',
                desc: 'Semua pekerja telah diverifikasi KTP untuk keamanan Anda',
                gradient: 'from-green-400 to-emerald-600',
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: 'Pembayaran Aman',
                desc: 'Sistem escrow melindungi pembayaran Anda hingga pekerjaan selesai',
                gradient: 'from-blue-400 to-indigo-600',
              },
              {
                icon: <FileText className="w-8 h-8" />,
                title: 'Surat Perjanjian',
                desc: 'Setiap pekerjaan dilindungi dengan surat perjanjian yang jelas',
                gradient: 'from-purple-400 to-pink-600',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="group relative p-8 rounded-3xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                style={{
                  animation: isVisible.features ? `fadeInUp 0.6s ease-out ${idx * 0.2}s both` : 'none',
                }}
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-gray-100" id="categories" data-animate>
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Kategori Pekerjaan
            </h2>
            <p className="text-gray-600 text-lg">
              Temukan pekerja profesional untuk berbagai kebutuhan Anda
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((category, idx) => (
              <div
                key={idx}
                className="group relative bg-white p-8 rounded-2xl hover:shadow-2xl transition-all duration-500 cursor-pointer hover:-translate-y-2 overflow-hidden"
                style={{
                  animation: isVisible.categories ? `fadeInUp 0.5s ease-out ${idx * 0.1}s both` : 'none',
                }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                <div className="relative text-center">
                  <div className="text-5xl mb-4 group-hover:scale-125 transition-transform duration-300">
                    {category.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    {category.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        </div>
        
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 border border-white/20 shadow-2xl">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Siap Memulai?
            </h2>
            <p className="text-xl text-white/90 mb-10 leading-relaxed">
              Bergabunglah dengan ribuan pengguna yang telah merasakan kemudahan dan keamanan platform Naro
            </p>
            <Link href="/auth/login">
              <button className="group relative px-10 py-5 bg-white text-purple-600 rounded-full font-bold text-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Daftar Gratis Sekarang
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="relative h-10 w-10 rounded-full overflow-hidden bg-white shadow-lg flex items-center justify-center">
                  <Image 
                    src="/logo/image.png"
                    alt="Naro Logo"
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
                <span className="text-2xl font-bold">Naro</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Platform digital aman dan adil untuk pekerja informal
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-lg">Tentang</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 inline-block">Tentang Kami</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 inline-block">Cara Kerja</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 inline-block">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-lg">Bantuan</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 inline-block">Pusat Bantuan</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 inline-block">Syarat & Ketentuan</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 inline-block">Kebijakan Privasi</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-lg">Hubungi Kami</h4>
              <ul className="space-y-3 text-gray-400">
                <li>Email: info@naro.id</li>
                <li>WhatsApp: +62 812-3456-7890</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Naro. Hak Cipta Dilindungi.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
