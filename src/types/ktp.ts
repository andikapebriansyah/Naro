// src/types/ktp.ts

/**
 * Interface untuk data KTP yang diekstrak
 * Struktur ini sesuai dengan format KTP Indonesia yang sebenarnya
 */
export interface KTPData {
  // Data identitas utama
  nik?: string;                    // NIK: 16 digit
  nama?: string;                   // Nama: Full name
  tempatTglLahir?: string;        // Tempat/Tgl Lahir: "SURABAYA, 01-01-1990" (GABUNGAN)
  jenisKelamin?: string;          // Jenis Kelamin: LAKI-LAKI / PEREMPUAN
  golDarah?: string;              // Gol. Darah: A/B/AB/O
  
  // Data alamat
  alamat?: string;                // Alamat: Jalan dan nomor
  rtRw?: string;                  // RT/RW: 001/001
  kelDesa?: string;               // Kel/Desa: Nama kelurahan/desa
  kecamatan?: string;             // Kecamatan: Nama kecamatan
  
  // Data tambahan
  agama?: string;                 // Agama: ISLAM/KRISTEN/KATOLIK/HINDU/BUDDHA/KONGHUCU
  statusPerkawinan?: string;      // Status Perkawinan: BELUM KAWIN/KAWIN/CERAI HIDUP/CERAI MATI
  pekerjaan?: string;             // Pekerjaan: Jenis pekerjaan
  kewarganegaraan?: string;       // Kewarganegaraan: WNI/WNA
  berlakuHingga?: string;         // Berlaku Hingga: SEUMUR HIDUP / tanggal
  
  // Raw text dari OCR
  rawText?: string;
}

/**
 * Result dari parsing KTP
 */
export interface KTPParserResult {
  success: boolean;
  data?: KTPData;
  confidence: number;
  missingFields?: string[];
  rawText: string;
}

/**
 * Field-field yang wajib ada di KTP
 * Sesuai dengan struktur KTP Indonesia
 */
export const REQUIRED_KTP_FIELDS = [
  'nik',
  'nama',
  'tempatTglLahir',      // Ini GABUNGAN, bukan terpisah!
  'jenisKelamin',
  'alamat',
  'rtRw',
  'kelDesa',
  'kecamatan',
  'agama',
  'statusPerkawinan',
  'pekerjaan',
  'kewarganegaraan',
  'berlakuHingga'
];

/**
 * Label untuk setiap field KTP (untuk ditampilkan ke user)
 */
export const KTP_FIELD_LABELS: Record<string, string> = {
  nik: 'NIK',
  nama: 'Nama',
  tempatTglLahir: 'Tempat/Tgl Lahir',
  jenisKelamin: 'Jenis Kelamin',
  golDarah: 'Golongan Darah',
  alamat: 'Alamat',
  rtRw: 'RT/RW',
  kelDesa: 'Kel/Desa',
  kecamatan: 'Kecamatan',
  agama: 'Agama',
  statusPerkawinan: 'Status Perkawinan',
  pekerjaan: 'Pekerjaan',
  kewarganegaraan: 'Kewarganegaraan',
  berlakuHingga: 'Berlaku Hingga'
};

/**
 * Regex patterns untuk extract field KTP
 * TIDAK DIGUNAKAN di parser baru (lebih baik parsing manual)
 */
export const KTP_FIELD_PATTERNS: Record<string, RegExp> = {
  nik: /(?:NIK|nik)\s*:?\s*(\d{16})/i,
  nama: /(?:Nama|nama)\s*:?\s*([A-Z\s]+?)(?:\n|Tempat)/i,
  tempatTglLahir: /(?:Tempat.*?Lahir|tempat.*?lahir)\s*:?\s*(.+?)(?:\n|Jenis)/i,
  jenisKelamin: /(?:Jenis\s*Kelamin|jenis\s*kelamin)\s*:?\s*(LAKI-LAKI|PEREMPUAN|laki-laki|perempuan)/i,
  golDarah: /(?:Gol\.?\s*Darah|gol\.?\s*darah)\s*:?\s*([ABO]{1,2}[+-]?)/i,
  alamat: /(?:Alamat|alamat)\s*:?\s*(.+?)(?:\n|RT)/i,
  rtRw: /(?:RT\/RW|rt\/rw)\s*:?\s*(\d{3}\/\d{3})/i,
  kelDesa: /(?:Kel\/Desa|kel\/desa)\s*:?\s*(.+?)(?:\n|Kecamatan)/i,
  kecamatan: /(?:Kecamatan|kecamatan)\s*:?\s*(.+?)(?:\n|Agama)/i,
  agama: /(?:Agama|agama)\s*:?\s*([A-Z]+)/i,
  statusPerkawinan: /(?:Status\s*Perkawinan|status\s*perkawinan)\s*:?\s*([A-Z\s]+?)(?:\n|Pekerjaan)/i,
  pekerjaan: /(?:Pekerjaan|pekerjaan)\s*:?\s*(.+?)(?:\n|Kewarganegaraan)/i,
  kewarganegaraan: /(?:Kewarganegaraan|kewarganegaraan)\s*:?\s*(WNI|WNA|wni|wna)/i,
  berlakuHingga: /(?:Berlaku\s*Hingga|berlaku\s*hingga)\s*:?\s*(.+?)(?:\n|$)/i,
};

/**
 * Helper function untuk format display KTP data
 */
export function formatKTPDataForDisplay(data: KTPData): Record<string, string> {
  const formatted: Record<string, string> = {};
  
  Object.entries(data).forEach(([key, value]) => {
    if (key !== 'rawText' && value) {
      const label = KTP_FIELD_LABELS[key] || key;
      formatted[label] = value;
    }
  });
  
  return formatted;
}

/**
 * Helper function untuk validasi format tanggal
 */
export function validateDateFormat(dateStr: string): boolean {
  // Format: DD-MM-YYYY atau DD/MM/YYYY
  const pattern = /^\d{2}[-\/]\d{2}[-\/]\d{4}$/;
  return pattern.test(dateStr);
}

/**
 * Helper function untuk extract tempat dan tanggal dari gabungan
 */
export function splitTempatTanggalLahir(tempatTglLahir: string): {
  tempat: string;
  tanggal: string;
} | null {
  const parts = tempatTglLahir.split(',');
  if (parts.length >= 2) {
    return {
      tempat: parts[0].trim(),
      tanggal: parts.slice(1).join(',').trim()
    };
  }
  return null;
}