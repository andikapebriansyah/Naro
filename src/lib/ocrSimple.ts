// src/lib/ocrSimple.ts
// Simplified OCR implementation for development/testing

import { KTPData } from '../types/ktp';
import { parseKTPData } from './ktpParser';

export interface OCRResult {
  text: string;
  confidence: number;
}

export interface SimpleOCRResult {
  text: string;
  confidence: number;
  extractedData?: KTPData;
}

/**
 * Mock OCR untuk testing - returns sample KTP text
 */
function getMockKTPText(): string {
  return `
    REPUBLIK INDONESIA
    PROVINSI DKI JAKARTA
    KOTA JAKARTA PUSAT
    
    NIK : 3171071234567890
    Nama : BUDI SANTOSO
    Tempat/Tgl Lahir : JAKARTA, 15-08-1990
    Jenis Kelamin : LAKI-LAKI
    Alamat : JL. SUDIRMAN NO. 123
    RT/RW : 001/002
    Kel/Desa : MENTENG
    Kecamatan : MENTENG
    Agama : ISLAM
    Status Perkawinan : BELUM KAWIN
    Pekerjaan : KARYAWAN SWASTA
    Kewarganegaraan : WNI
    Berlaku Hingga : SEUMUR HIDUP
  `;
}

/**
 * Simplified OCR yang bisa digunakan untuk development
 */
export async function extractTextSimple(file: File): Promise<SimpleOCRResult> {
  try {
    console.log('Using simple OCR for file:', file.name);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Use mock text for now
    const mockText = getMockKTPText();
    
    // Parse the text
    const parseResult = parseKTPData(mockText);
    
    return {
      text: mockText,
      confidence: parseResult.confidence,
      extractedData: parseResult.data,
    };
  } catch (error) {
    console.error('Simple OCR error:', error);
    throw new Error('Gagal memproses OCR');
  }
}

/**
 * Try to extract text using real OCR, fallback to simple OCR
 */
export async function extractTextWithFallback(file: File): Promise<SimpleOCRResult> {
  // Check if we're in development mode
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    console.log('Development mode: using simple OCR');
    return extractTextSimple(file);
  }
  
  try {
    // Try to import and use real OCR
    const { extractTextWithTimeout } = await import('./ocr');
    const result = await extractTextWithTimeout(file, 20000);
    
    // Parse the result
    const parseResult = parseKTPData(result.text);
    
    return {
      text: result.text,
      confidence: parseResult.confidence,
      extractedData: parseResult.data,
    };
  } catch (error) {
    console.error('Real OCR failed, falling back to simple OCR:', error);
    return extractTextSimple(file);
  }
}
