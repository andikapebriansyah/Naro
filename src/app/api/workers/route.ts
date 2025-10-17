import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');

    const query: any = {
      role: { $in: ['tasker', 'user', 'admin'] }, // Include admin role
      isVerified: true,
      // Add profile completeness check
      phone: { $exists: true, $ne: "" },
      about: { $exists: true, $ne: "" },
      workCategories: { $exists: true, $not: { $size: 0 } }
    };

    // Add category filter if specified
    if (category) {
      query.workCategories = { $in: [category] };
    }

    const workers = await User.find(query)
      .select('name email image rating completedTasks location isVerified workCategories phone about isAvailable')
      .limit(50)
      .sort({ rating: -1, completedTasks: -1 });

    // Add isAvailable field and format the response
    const formattedWorkers = workers.map(worker => ({
      ...worker.toObject(),
      isAvailable: worker.isAvailable !== undefined ? worker.isAvailable : true
    }));

    // If no workers found in database, return mock data for testing
    if (formattedWorkers.length === 0) {
      const mockWorkers = [
        {
          _id: 'mock1',
          name: 'Ahmad Subandi',
          email: 'ahmad@example.com',
          image: null,
          rating: 4.8,
          completedTasks: 25,
          location: 'Jakarta Pusat',
          isVerified: true,
          workCategories: ['kebersihan', 'renovasi'],
          phone: '08123456789',
          about: 'Berpengalaman 5 tahun dalam bidang kebersihan dan renovasi rumah. Saya memiliki tim yang solid dan peralatan lengkap untuk memastikan hasil kerja yang memuaskan. Sudah menangani berbagai proyek mulai dari rumah tinggal hingga perkantoran.',
          isAvailable: true,
          reviews: [
            { rating: 5, comment: 'Kerja sangat rapi dan profesional', date: '2024-10-10' },
            { rating: 4, comment: 'Selesai tepat waktu, hasil bagus', date: '2024-10-05' }
          ]
        },
        {
          _id: 'mock2',
          name: 'Budi Santoso',
          email: 'budi@example.com',
          image: null,
          rating: 4.6,
          completedTasks: 18,
          location: 'Jakarta Selatan',
          isVerified: true,
          workCategories: ['teknisi', 'renovasi'],
          phone: '08234567890',
          about: 'Teknisi listrik dan AC berpengalaman lebih dari 8 tahun. Spesialis instalasi listrik rumah, perbaikan AC split dan central, serta maintenance elektronik rumah tangga. Berlisensi resmi dan berpengalaman menangani proyek besar.',
          isAvailable: true,
          reviews: [
            { rating: 5, comment: 'Teknisi handal, AC jadi dingin lagi', date: '2024-10-08' },
            { rating: 4, comment: 'Instalasi listrik rapi dan aman', date: '2024-10-01' }
          ]
        },
        {
          _id: 'mock3',
          name: 'Sari Indah',
          email: 'sari@example.com',
          image: null,
          rating: 4.9,
          completedTasks: 32,
          location: 'Jakarta Barat',
          isVerified: true,
          workCategories: ['kebersihan', 'taman'],
          phone: '08345678901',
          about: 'Spesialis kebersihan rumah dan perawatan taman dengan standar tinggi. Menggunakan produk pembersih ramah lingkungan dan teknik yang tidak merusak permukaan. Juga ahli dalam desain taman minimalis dan perawatan tanaman hias.',
          isAvailable: true,
          reviews: [
            { rating: 5, comment: 'Rumah jadi bersih banget, taman juga cantik', date: '2024-10-12' },
            { rating: 5, comment: 'Sangat detail dan teliti, recommended!', date: '2024-10-07' }
          ]
        },
        {
          _id: 'mock4',
          name: 'Dedi Kurniawan',
          email: 'dedi@example.com',
          image: null,
          rating: 4.7,
          completedTasks: 22,
          location: 'Jakarta Timur',
          isVerified: true,
          workCategories: ['tukang', 'renovasi'],
          phone: '08456789012',
          about: 'Tukang kayu dan bangunan dengan pengalaman renovasi rumah selama 10 tahun. Ahli dalam pembuatan furniture custom, renovasi kamar mandi, kitchen set, dan perbaikan struktur rumah. Mengutamakan kualitas dan detail finishing.',
          isAvailable: false,
          reviews: [
            { rating: 5, comment: 'Kitchen set buatannya bagus dan kuat', date: '2024-10-06' },
            { rating: 4, comment: 'Renovasi kamar mandi jadi modern', date: '2024-09-28' }
          ]
        },
        {
          _id: 'mock5',
          name: 'Lisa Permata',
          email: 'lisa@example.com',
          image: null,
          rating: 4.5,
          completedTasks: 15,
          location: 'Jakarta Utara',
          isVerified: true,
          workCategories: ['angkut', 'kebersihan'],
          phone: '08567890123',
          about: 'Spesialis jasa angkut barang dan pembersihan pasca renovasi. Memiliki kendaraan pickup dan tim yang terlatih untuk mengangkut barang dengan aman. Juga menyediakan layanan deep cleaning untuk rumah yang baru selesai direnovasi.',
          isAvailable: true,
          reviews: [
            { rating: 5, comment: 'Angkut barang hati-hati, tidak ada yang rusak', date: '2024-10-09' },
            { rating: 4, comment: 'Pembersihan pasca renovasi sangat bersih', date: '2024-10-03' }
          ]
        },
        {
          _id: 'mock6',
          name: 'Rudi Hermawan',
          email: 'rudi@example.com',
          image: null,
          rating: 4.4,
          completedTasks: 12,
          location: 'Tangerang',
          isVerified: true,
          workCategories: ['teknisi', 'lainnya'],
          phone: '08678901234',
          about: 'Teknisi komputer dan elektronik rumah tangga. Melayani service laptop, PC, TV, kulkas, mesin cuci dan perangkat elektronik lainnya. Juga menyediakan jasa instalasi CCTV dan smart home system untuk keamanan rumah.',
          isAvailable: true,
          reviews: [
            { rating: 4, comment: 'Laptop jadi cepat lagi setelah diservice', date: '2024-10-11' },
            { rating: 4, comment: 'Instalasi CCTV rapi dan berfungsi baik', date: '2024-10-04' }
          ]
        }
      ];

      // Filter mock data by category if specified
      const filteredMockWorkers = category 
        ? mockWorkers.filter(worker => worker.workCategories.includes(category))
        : mockWorkers;

      return NextResponse.json({
        success: true,
        data: filteredMockWorkers,
        message: 'Menampilkan data demo - belum ada pekerja terdaftar di database'
      });
    }

    return NextResponse.json({
      success: true,
      data: formattedWorkers,
    });
  } catch (error) {
    console.error('Get workers error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
