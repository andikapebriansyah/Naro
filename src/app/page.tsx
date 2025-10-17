import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layouts/Header';

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-50 to-primary-100 py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Temukan Pekerja Terpercaya<br />atau Dapatkan Pekerjaan
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Platform yang menghubungkan pemberi kerja dengan pekerja profesional untuk berbagai jenis pekerjaan
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/login">
                  <Button size="lg" className="w-full sm:w-auto">
                    Mulai Sekarang
                  </Button>
                </Link>
                <Link href="/pekerja">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Cari Pekerja
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">Mengapa Pilih Naro?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">✓</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Verifikasi Terpercaya</h3>
                <p className="text-gray-600">Semua pekerja telah diverifikasi KTP untuk keamanan Anda</p>
              </div>
              <div className="text-center">
                <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">💰</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Pembayaran Aman</h3>
                <p className="text-gray-600">Sistem escrow melindungi pembayaran Anda hingga pekerjaan selesai</p>
              </div>
              <div className="text-center">
                <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📋</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Surat Perjanjian</h3>
                <p className="text-gray-600">Setiap pekerjaan dilindungi dengan surat perjanjian yang jelas</p>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="bg-gray-50 py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">Kategori Pekerjaan</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Kebersihan', 'Teknisi', 'Renovasi', 'Tukang', 'Angkut', 'Taman', 'Pengiriman', 'Lainnya'].map(
                (category) => (
                  <div
                    key={category}
                    className="bg-white p-6 rounded-lg text-center hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className="text-4xl mb-2">🔧</div>
                    <h3 className="font-semibold">{category}</h3>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-6">Siap Memulai?</h2>
            <p className="text-xl text-gray-600 mb-8">
              Bergabunglah dengan ribuan pengguna yang telah merasakan kemudahan Naro
            </p>
            <Link href="/auth/login">
              <Button size="lg">Daftar Gratis Sekarang</Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Naro</h3>
              <p className="text-gray-400">Platform penyedia jasa dan pekerja lepas terpercaya</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Tentang</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Tentang Kami</a></li>
                <li><a href="#" className="hover:text-white">Cara Kerja</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Bantuan</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Pusat Bantuan</a></li>
                <li><a href="#" className="hover:text-white">Syarat & Ketentuan</a></li>
                <li><a href="#" className="hover:text-white">Kebijakan Privasi</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Hubungi Kami</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Email: info@naro.id</li>
                <li>WhatsApp: +62 812-3456-7890</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Naro. Hak Cipta Dilindungi.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
