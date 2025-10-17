// src/lib/ktpParser.ts
import { 
  KTPData, 
  KTPParserResult, 
  REQUIRED_KTP_FIELDS,
  KTP_FIELD_LABELS 
} from '@/types/ktp';

/**
 * Normalize teks untuk meningkatkan akurasi parsing
 */
function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
}

/**
 * Validate NIK format (16 digits)
 */
function validateNIK(nik: string): boolean {
  const cleanNik = nik.replace(/\D/g, '');
  return cleanNik.length === 16 && /^\d{16}$/.test(cleanNik);
}

/**
 * Extract NIK dari text
 */
function extractNIK(text: string): string | null {
  // Cari pattern 16 digit angka
  const nikPattern = /\b(\d{16})\b/;
  const match = text.match(nikPattern);
  
  if (match && match[1]) {
    return match[1];
  }
  
  // Coba cari dengan format yang lebih loose
  const loosePattern = /(\d{4}\s*\d{4}\s*\d{4}\s*\d{4})/;
  const looseMatch = text.match(loosePattern);
  if (looseMatch) {
    const cleanNik = looseMatch[1].replace(/\s/g, '');
    if (validateNIK(cleanNik)) {
      return cleanNik;
    }
  }
  
  return null;
}

/**
 * Extract value dari line dengan pattern "Label : Value"
 */
function extractValueFromLine(line: string, label: string): string | null {
  const lower = line.toLowerCase();
  const labelLower = label.toLowerCase();
  
  if (lower.includes(labelLower)) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > -1) {
      const value = line.substring(colonIndex + 1).trim();
      // Pastikan value tidak kosong dan bukan line berikutnya
      if (value && value.length > 0 && value.length < 150) {
        return value;
      }
    }
  }
  return null;
}

/**
 * Extract nama dari text
 */
function extractNama(lines: string[]): string | null {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    
    // Cari line yang mengandung "nama" tapi bukan "tempat"
    if (lower.includes('nama') && !lower.includes('tempat') && !lower.includes('kelamin')) {
      const value = extractValueFromLine(line, 'nama');
      if (value && !/\d{10,}/.test(value) && value.length < 100) {
        console.log('Found Nama:', value, 'from line:', line);
        return value;
      }
    }
    
    // Coba format alternatif: line terpisah
    if (lower.trim() === 'nama' && i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      if (nextLine.startsWith(':')) {
        const value = nextLine.substring(1).trim();
        if (value && !/\d{10,}/.test(value) && value.length < 100) {
          console.log('Found Nama (next line):', value);
          return value;
        }
      }
    }
  }
  return null;
}

/**
 * Extract tempat/tgl lahir (gabungan dalam satu field)
 */
function extractTempatTglLahir(lines: string[]): string | null {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    
    // Cari "Tempat/Tgl Lahir" atau variasinya (termasuk typo seperti "Tgi")
    if ((lower.includes('tempat') && lower.includes('lahir')) || 
        lower.includes('tempat/tgl') || 
        lower.includes('tempat/tgi')) {
      
      const value = extractValueFromLine(line, 'tempat');
      if (value) {
        // Format: "SURABAYA, 01-01-1990"
        return value;
      }
    }
  }
  return null;
}

/**
 * Extract jenis kelamin
 */
function extractJenisKelamin(lines: string[]): string | null {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    
    if (lower.includes('jenis kelamin')) {
      const value = extractValueFromLine(line, 'jenis kelamin');
      if (value) {
        const valueLower = value.toLowerCase();
        if (valueLower.includes('laki') || valueLower.includes('pria')) {
          return 'LAKI-LAKI';
        } else if (valueLower.includes('perempuan') || valueLower.includes('wanita')) {
          return 'PEREMPUAN';
        }
      }
    }
    
    // Coba format alternatif: line terpisah
    if (lower.trim() === 'jenis kelamin' && i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      if (nextLine.startsWith(':')) {
        const value = nextLine.substring(1).trim();
        const valueLower = value.toLowerCase();
        if (valueLower.includes('laki') || valueLower.includes('pria')) {
          return 'LAKI-LAKI';
        } else if (valueLower.includes('perempuan') || valueLower.includes('wanita')) {
          return 'PEREMPUAN';
        }
      }
    }
  }
  return null;
}

/**
 * Extract gol darah
 */
function extractGolDarah(lines: string[]): string | null {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    
    if (lower.includes('gol') && lower.includes('darah')) {
      const value = extractValueFromLine(line, 'gol');
      if (value && value.length < 10) {
        // Extract only blood type (A, B, AB, O, dengan atau tanpa +/-)
        const bloodMatch = value.match(/\b(A|B|AB|O)([+-])?\b/i);
        if (bloodMatch) {
          return bloodMatch[0].toUpperCase();
        }
        return value;
      }
    }
  }
  return null;
}

/**
 * Extract alamat
 */
function extractAlamat(lines: string[]): string | null {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    
    if (lower.includes('alamat')) {
      const value = extractValueFromLine(line, 'alamat');
      if (value && value.length < 100) {
        return value;
      }
    }
    
    // Coba format alternatif: line terpisah
    if (lower.trim() === 'alamat' && i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      if (nextLine.startsWith(':')) {
        const value = nextLine.substring(1).trim();
        if (value && value.length < 100) {
          return value;
        }
      }
    }
  }
  return null;
}

/**
 * Extract RT/RW
 */
function extractRtRw(lines: string[]): string | null {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    
    if (lower.includes('rt') && lower.includes('rw')) {
      const value = extractValueFromLine(line, 'rt');
      if (value && value.length < 20) {
        return value;
      }
    }
    
    // Coba format alternatif: line terpisah
    if (lower.trim() === 'rt/rw' && i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      if (nextLine.startsWith(':')) {
        const value = nextLine.substring(1).trim();
        if (value && value.length < 20) {
          return value;
        }
      }
    }
  }
  return null;
}

/**
 * Extract Kel/Desa
 */
function extractKelDesa(lines: string[]): string | null {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    
    if ((lower.includes('kel') || lower.includes('desa')) && !lower.includes('kelamin')) {
      const value = extractValueFromLine(line, 'kel');
      if (value && value.length < 100) {
        return value;
      }
    }
    
    // Coba format alternatif: line terpisah
    if ((lower.trim() === 'kel/desa' || lower.trim() === 'kelurahan') && i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      if (nextLine.startsWith(':')) {
        const value = nextLine.substring(1).trim();
        if (value && value.length < 100) {
          return value;
        }
      }
    }
  }
  return null;
}

/**
 * Extract Kecamatan
 */
function extractKecamatan(lines: string[]): string | null {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    
    if (lower.includes('kecamatan')) {
      const value = extractValueFromLine(line, 'kecamatan');
      if (value && value.length < 100) {
        return value;
      }
    }
  }
  return null;
}

/**
 * Extract Agama
 */
function extractAgama(lines: string[]): string | null {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    
    if (lower.includes('agama')) {
      const value = extractValueFromLine(line, 'agama');
      if (value && value.length < 50) {
        return value;
      }
    }
    
    // Coba format alternatif: line terpisah
    if (lower.trim() === 'agama' && i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      if (nextLine.startsWith(':')) {
        const value = nextLine.substring(1).trim();
        if (value && value.length < 50) {
          return value;
        }
      }
    }
  }
  return null;
}

/**
 * Extract Status Perkawinan
 */
function extractStatusPerkawinan(lines: string[]): string | null {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    
    if (lower.includes('status') && lower.includes('perkawinan')) {
      const value = extractValueFromLine(line, 'status');
      if (value && value.length < 50) {
        return value;
      }
    }
  }
  return null;
}

/**
 * Extract Pekerjaan
 */
function extractPekerjaan(lines: string[]): string | null {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    
    if (lower.includes('pekerjaan')) {
      const value = extractValueFromLine(line, 'pekerjaan');
      if (value && value.length < 100) {
        return value;
      }
    }
    
    // Coba format alternatif: line terpisah
    if (lower.trim() === 'pekerjaan' && i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      if (nextLine.startsWith(':')) {
        const value = nextLine.substring(1).trim();
        if (value && value.length < 100) {
          return value;
        }
      }
    }
  }
  return null;
}

/**
 * Extract Kewarganegaraan
 */
function extractKewarganegaraan(lines: string[]): string | null {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    
    if (lower.includes('kewarganegaraan')) {
      const value = extractValueFromLine(line, 'kewarganegaraan');
      if (value && value.length < 50) {
        return value;
      }
    }
  }
  return null;
}

/**
 * Extract Berlaku Hingga
 */
function extractBerlakuHingga(lines: string[]): string | null {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    
    if (lower.includes('berlaku') && lower.includes('hingga')) {
      const value = extractValueFromLine(line, 'berlaku');
      if (value && value.length < 50) {
        return value;
      }
    }
    
    // Coba format alternatif: line terpisah
    if ((lower.trim() === 'berlaku hingga' || lower.trim() === 'berlaku') && i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      if (nextLine.startsWith(':')) {
        const value = nextLine.substring(1).trim();
        if (value && value.length < 50) {
          return value;
        }
      }
    }
  }
  return null;
}

/**
 * Clean dan format extracted data
 */
function cleanExtractedData(data: KTPData): KTPData {
  const cleaned: KTPData = {};

  // Clean NIK
  if (data.nik) {
    const cleanNik = data.nik.replace(/\D/g, '');
    if (validateNIK(cleanNik)) {
      cleaned.nik = cleanNik;
    }
  }

  // Clean nama
  if (data.nama) {
    cleaned.nama = data.nama.trim().toUpperCase();
  }

  // Clean tempat/tgl lahir
  if (data.tempatTglLahir) {
    cleaned.tempatTglLahir = data.tempatTglLahir.trim().toUpperCase();
  }

  // Clean jenis kelamin
  if (data.jenisKelamin) {
    cleaned.jenisKelamin = data.jenisKelamin.toUpperCase();
  }

  // Clean gol darah
  if (data.golDarah) {
    cleaned.golDarah = data.golDarah.trim().toUpperCase();
  }

  // Clean alamat
  if (data.alamat) {
    cleaned.alamat = data.alamat.trim().toUpperCase();
  }

  // Clean RT/RW
  if (data.rtRw) {
    cleaned.rtRw = data.rtRw.trim();
  }

  // Clean Kel/Desa
  if (data.kelDesa) {
    cleaned.kelDesa = data.kelDesa.trim().toUpperCase();
  }

  // Clean Kecamatan
  if (data.kecamatan) {
    cleaned.kecamatan = data.kecamatan.trim().toUpperCase();
  }

  // Clean other fields
  ['agama', 'statusPerkawinan', 'pekerjaan', 'kewarganegaraan', 'berlakuHingga'].forEach(field => {
    if (data[field as keyof KTPData]) {
      cleaned[field as keyof KTPData] = (data[field as keyof KTPData] as string).trim().toUpperCase();
    }
  });

  return cleaned;
}

/**
 * Parse KTP data dari OCR text
 */
export function parseKTPData(ocrText: string): KTPParserResult {
  try {
    console.log('=== Starting KTP Parsing ===');
    console.log('Raw OCR Text length:', ocrText.length);
    
    const normalizedText = normalizeText(ocrText);
    const lines = normalizedText.split('\n').filter(line => line.trim());
    
    console.log('Total lines:', lines.length);

    const extractedData: KTPData = {};

    // Extract NIK
    const nik = extractNIK(normalizedText);
    if (nik) {
      extractedData.nik = nik;
      console.log('✓ NIK:', nik);
    }

    // Extract Nama
    const nama = extractNama(lines);
    if (nama) {
      extractedData.nama = nama;
      console.log('✓ Nama:', nama);
    }

    // Extract Tempat/Tgl Lahir (gabungan)
    const tempatTglLahir = extractTempatTglLahir(lines);
    if (tempatTglLahir) {
      extractedData.tempatTglLahir = tempatTglLahir;
      console.log('✓ Tempat/Tgl Lahir:', tempatTglLahir);
    }

    // Extract Jenis Kelamin
    const jenisKelamin = extractJenisKelamin(lines);
    if (jenisKelamin) {
      extractedData.jenisKelamin = jenisKelamin;
      console.log('✓ Jenis Kelamin:', jenisKelamin);
    }

    // Extract Gol Darah
    const golDarah = extractGolDarah(lines);
    if (golDarah) {
      extractedData.golDarah = golDarah;
      console.log('✓ Gol. Darah:', golDarah);
    }

    // Extract Alamat
    const alamat = extractAlamat(lines);
    if (alamat) {
      extractedData.alamat = alamat;
      console.log('✓ Alamat:', alamat);
    }

    // Extract RT/RW
    const rtRw = extractRtRw(lines);
    if (rtRw) {
      extractedData.rtRw = rtRw;
      console.log('✓ RT/RW:', rtRw);
    }

    // Extract Kel/Desa
    const kelDesa = extractKelDesa(lines);
    if (kelDesa) {
      extractedData.kelDesa = kelDesa;
      console.log('✓ Kel/Desa:', kelDesa);
    }

    // Extract Kecamatan
    const kecamatan = extractKecamatan(lines);
    if (kecamatan) {
      extractedData.kecamatan = kecamatan;
      console.log('✓ Kecamatan:', kecamatan);
    }

    // Extract Agama
    const agama = extractAgama(lines);
    if (agama) {
      extractedData.agama = agama;
      console.log('✓ Agama:', agama);
    }

    // Extract Status Perkawinan
    const statusPerkawinan = extractStatusPerkawinan(lines);
    if (statusPerkawinan) {
      extractedData.statusPerkawinan = statusPerkawinan;
      console.log('✓ Status Perkawinan:', statusPerkawinan);
    }

    // Extract Pekerjaan
    const pekerjaan = extractPekerjaan(lines);
    if (pekerjaan) {
      extractedData.pekerjaan = pekerjaan;
      console.log('✓ Pekerjaan:', pekerjaan);
    }

    // Extract Kewarganegaraan
    const kewarganegaraan = extractKewarganegaraan(lines);
    if (kewarganegaraan) {
      extractedData.kewarganegaraan = kewarganegaraan;
      console.log('✓ Kewarganegaraan:', kewarganegaraan);
    }

    // Extract Berlaku Hingga
    const berlakuHingga = extractBerlakuHingga(lines);
    if (berlakuHingga) {
      extractedData.berlakuHingga = berlakuHingga;
      console.log('✓ Berlaku Hingga:', berlakuHingga);
    }

    // Clean extracted data
    const cleanedData = cleanExtractedData(extractedData);
    cleanedData.rawText = ocrText;

    console.log('=== Cleaned Data ===');
    console.log(JSON.stringify(cleanedData, null, 2));

    // Check required fields
    const missingFields: string[] = [];
    REQUIRED_KTP_FIELDS.forEach(field => {
      if (!cleanedData[field as keyof KTPData]) {
        missingFields.push(KTP_FIELD_LABELS[field as keyof typeof KTP_FIELD_LABELS]);
      }
    });

    // Calculate confidence
    const allFields = ['nik', 'nama', 'tempatTglLahir', 'jenisKelamin',
                       'alamat', 'rtRw', 'kelDesa', 'kecamatan', 'agama', 
                       'statusPerkawinan', 'pekerjaan', 'kewarganegaraan', 'berlakuHingga'];
    const foundFields = allFields.filter(
      field => cleanedData[field as keyof KTPData]
    ).length;
    const confidence = Math.round((foundFields / allFields.length) * 100);

    console.log('=== Parsing Complete ===');
    console.log('Found fields:', foundFields, '/', allFields.length);
    console.log('Missing required fields:', missingFields);
    console.log('Confidence:', confidence);

    return {
      success: missingFields.length === 0,
      data: cleanedData,
      confidence: confidence,
      missingFields: missingFields.length > 0 ? missingFields : undefined,
      rawText: ocrText,
    };

  } catch (error) {
    console.error('KTP parsing error:', error);
    return {
      success: false,
      confidence: 0,
      rawText: ocrText,
    };
  }
}

/**
 * Validate parsed KTP data
 */
export function validateKTPData(data: KTPData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate NIK
  if (!data.nik || !validateNIK(data.nik)) {
    errors.push('NIK tidak valid (harus 16 digit)');
  }

  // Validate required fields
  REQUIRED_KTP_FIELDS.forEach(field => {
    if (!data[field as keyof KTPData]) {
      errors.push(`${KTP_FIELD_LABELS[field as keyof typeof KTP_FIELD_LABELS]} wajib diisi`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get missing fields untuk user feedback
 */
export function getMissingFields(data: KTPData): string[] {
  const missing: string[] = [];
  
  REQUIRED_KTP_FIELDS.forEach(field => {
    if (!data[field as keyof KTPData]) {
      missing.push(KTP_FIELD_LABELS[field as keyof typeof KTP_FIELD_LABELS]);
    }
  });

  return missing;
}