'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layouts/Header';
import { ChevronRight, CheckCircle, Shield, FileText, Sparkles, Users, Briefcase, Star, ArrowRight, TrendingUp, ShieldCheck, CreditCard, Search, MessageSquare, Clock } from 'lucide-react';

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
        {/* Animated Background Elements - Dashboard colors */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50/30 to-primary-50/40">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
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
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-blue-600 rounded-full blur-xl opacity-50 animate-pulse"></div>
                <div className="relative h-24 w-24 rounded-2xl overflow-hidden bg-white shadow-2xl flex items-center justify-center p-3">
                  <Image 
                    src="/logo/image.png"
                    alt="Naro Logo"
                    width={72}
                    height={72}
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            </div>

            {/* Title with gradient and animation */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-gray-900 via-primary-700 to-blue-800 bg-clip-text text-transparent animate-gradient">
                Naro
              </span>
            </h1>

            {/* Subtitle with fade-in */}
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Platform Digital Aman dan Adil untuk Pekerja Informal
            </p>

            {/* CTA Buttons with hover effects */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/auth/login">
                <button className="group relative px-8 py-4 bg-gradient-to-r from-primary-600 to-blue-600 text-white rounded-xl font-semibold text-lg hover:shadow-2xl hover:shadow-primary-200/50 transition-all duration-300 hover:scale-105 overflow-hidden w-full sm:w-auto">
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Mulai Sekarang
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-primary-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </Link>
              <Link href="/pekerja">
                <button className="px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold text-lg border-2 border-gray-200 hover:border-primary-600 hover:shadow-lg transition-all duration-300 hover:scale-105 w-full sm:w-auto">
                  Cari Pekerja
                </button>
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Features Section */}
      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-br from-gray-50 to-primary-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-primary-700 to-blue-800 bg-clip-text text-transparent mb-4">
              Mengapa Memilih Naro?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Platform yang dirancang untuk memudahkan semua aspek dalam mencari dan menyediakan layanan pekerjaan
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: ShieldCheck,
                title: "Keamanan Terjamin",
                description: "Sistem verifikasi ketat dan perlindungan pembayaran yang aman"
              },
              {
                icon: CreditCard,
                title: "Pembayaran Mudah",
                description: "Berbagai metode pembayaran dengan sistem escrow yang aman"
              },
              {
                icon: Search,
                title: "Pencarian Cerdas",
                description: "Temukan pekerja atau pekerjaan yang sesuai dengan kebutuhan Anda"
              },
              {
                icon: MessageSquare,
                title: "Komunikasi Langsung",
                description: "Chat real-time dengan sistem notifikasi yang responsif"
              },
              {
                icon: Star,
                title: "Sistem Rating",
                description: "Review dan rating untuk membantu memilih layanan terbaik"
              },
              {
                icon: Clock,
                title: "24/7 Support",
                description: "Tim support yang siap membantu kapan saja Anda membutuhkan"
              }
            ].map((feature, index) => (
              <div key={index} className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl hover:shadow-primary-200/30 transition-all duration-300 hover:-translate-y-2 border border-gray-100 hover:border-primary-200">
                <feature.icon className="w-12 h-12 text-primary-600 mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>      {/* Categories Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary-50/50 to-blue-50/50" id="categories" data-animate>
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary-700 to-blue-800 bg-clip-text text-transparent mb-4">
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
                className="group relative bg-white p-8 rounded-2xl hover:shadow-2xl hover:shadow-primary-200/30 transition-all duration-500 cursor-pointer hover:-translate-y-2 overflow-hidden border border-gray-100 hover:border-primary-200"
                style={{
                  animation: isVisible.categories ? `fadeInUp 0.5s ease-out ${idx * 0.1}s both` : 'none',
                }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br from-primary-500 to-blue-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
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
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-blue-600 to-primary-700">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        </div>
        
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 border border-white/20 shadow-2xl">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Siap Memulai?
            </h2>
            <p className="text-xl text-white/90 mb-10 leading-relaxed">
              Bergabunglah dengan komunitas terpercaya untuk menemukan peluang kerja terbaik dan pekerja profesional di Indonesia
            </p>
            <Link href="/auth/login">
              <button className="group relative px-10 py-5 bg-white text-primary-600 rounded-full font-bold text-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Mulai Sekarang Gratis
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
