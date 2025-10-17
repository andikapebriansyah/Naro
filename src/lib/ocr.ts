// src/lib/ocr.ts
export interface OCRResult {
  text: string;
  confidence: number;
}

interface OCRSpaceResponse {
  ParsedResults?: Array<{
    TextOverlay?: {
      Lines?: Array<{
        LineText: string;
      }>;
    };
    ParsedText: string;
    ErrorMessage?: string;
    ErrorDetails?: string;
  }>;
  OCRExitCode: number;
  IsErroredOnProcessing: boolean;
  ErrorMessage?: string;
  ErrorDetails?: string;
}

/**
 * Convert File to Base64 untuk OCR.space API (server-side compatible)
 */
async function fileToBase64(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    return base64;
  } catch (error) {
    console.error('Error converting file to base64:', error);
    throw new Error('Failed to convert file to base64');
  }
}

/**
 * Extract text dari gambar KTP menggunakan OCR.space API
 */
export async function extractTextFromKTP(file: File): Promise<OCRResult> {
  try {
    console.log('Starting OCR processing with OCR.space API...');
    
    const apiKey = process.env.OCR_SPACE_API_KEY;
    if (!apiKey) {
      throw new Error('OCR_SPACE_API_KEY tidak ditemukan di environment variables');
    }

    console.log('File size:', file.size, 'bytes');
    console.log('File type:', file.type);

    const base64Image = await fileToBase64(file);
    console.log('File converted to base64, length:', base64Image.length);

    console.log('Sending request to OCR.space API...');

    // Prepare request body dengan parameter optimal untuk KTP
    const requestBody = new URLSearchParams();
    requestBody.append('base64Image', `data:${file.type};base64,${base64Image}`);
    // Hapus language parameter karena 'ind' tidak didukung
    requestBody.append('isOverlayRequired', 'false');
    requestBody.append('detectOrientation', 'true');
    requestBody.append('scale', 'true'); // Better quality
    requestBody.append('OCREngine', '2'); // Engine 2 untuk akurasi lebih baik

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: requestBody.toString(),
      signal: AbortSignal.timeout(25000), // 25 detik timeout untuk request
    });

    if (!response.ok) {
      throw new Error(`OCR.space API error: ${response.status} ${response.statusText}`);
    }

    const result: OCRSpaceResponse = await response.json();
    console.log('OCR.space API response received');

    if (result.IsErroredOnProcessing) {
      throw new Error(`OCR processing error: ${result.ErrorMessage || 'Unknown error'}`);
    }

    if (!result.ParsedResults || result.ParsedResults.length === 0) {
      throw new Error('No text found in the image');
    }

    const parsedResult = result.ParsedResults[0];
    
    if (parsedResult.ErrorMessage) {
      throw new Error(`OCR parsing error: ${parsedResult.ErrorMessage}`);
    }

    let extractedText = parsedResult.ParsedText || '';
    
    // Clean dan normalize text
    extractedText = cleanOCRText(extractedText);
    
    console.log('OCR completed successfully');
    console.log('Extracted text length:', extractedText.length);
    console.log('Raw extracted text:', extractedText);

    const confidence = estimateConfidence(extractedText);

    return {
      text: extractedText,
      confidence: confidence,
    };
  } catch (error) {
    console.error('OCR extraction error:', error);
    throw new Error(`Gagal mengekstrak teks dari KTP: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Clean OCR text untuk hasil yang lebih baik
 */
function cleanOCRText(text: string): string {
  return text
    .replace(/\r\n/g, '\n') // Normalize line breaks
    .replace(/\r/g, '\n')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
}

/**
 * Estimate confidence based on text quality and KTP-specific patterns
 */
function estimateConfidence(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0;
  }

  let score = 0;
  const textLower = text.toLowerCase();

  // Check for KTP-specific keywords (sesuai format baru dengan tempat/tgl lahir gabungan)
  const ktpKeywords = [
    'nik', 'nama', 'tempat/tgl', 'tempat/tgi', 'lahir', 
    'jenis kelamin', 'gol', 'darah', 'alamat', 'rt/rw', 
    'kel/desa', 'kecamatan', 'agama', 
    'status perkawinan', 'pekerjaan', 
    'kewarganegaraan', 'berlaku hingga'
  ];
  
  const foundKeywords = ktpKeywords.filter(keyword => textLower.includes(keyword));
  score += (foundKeywords.length / ktpKeywords.length) * 35;

  // Check for 16-digit NIK pattern
  if (/\d{16}/.test(text)) {
    score += 20;
  }

  // Check for tempat/tgl lahir pattern (format gabungan seperti "SURABAYA, 01-01-1990")
  if (/[A-Z\s]+,\s*\d{1,2}[-\/]\d{1,2}[-\/]\d{4}/.test(text)) {
    score += 20; // Higher score for complete tempat/tgl format
  } else if (/\d{1,2}[-\/]\d{1,2}[-\/]\d{4}/.test(text) || /\d{1,2}\s*-\s*\d{1,2}\s*-\s*\d{4}/.test(text)) {
    score += 10; // Lower score for date only
  }

  // Check text length (reasonable amount of text for KTP)
  if (text.length > 150 && text.length < 2000) {
    score += 15;
  } else if (text.length > 100) {
    score += 10;
  }

  // Check for common Indonesian location words
  const locationWords = ['provinsi', 'kota', 'kabupaten', 'kecamatan', 'kelurahan', 'jakarta', 'jawa'];
  const foundLocation = locationWords.filter(word => textLower.includes(word));
  score += (foundLocation.length / locationWords.length) * 10;

  // Check for gender keywords
  if (textLower.includes('laki') || textLower.includes('perempuan')) {
    score += 5;
  }

  // Check for blood type pattern (A, B, AB, O)
  if (/gol.*darah.*:\s*(a|b|ab|o)/i.test(text)) {
    score += 5;
  }

  // Check for RT/RW pattern
  if (/rt\/rw.*:\s*\d{3}\/\d{3}/i.test(text)) {
    score += 5;
  }

  // Check for specific KTP format patterns
  if (textLower.includes('provinsi') && textLower.includes('dki')) {
    score += 3;
  }

  return Math.min(Math.round(score), 100);
}

/**
 * Extract text dengan retry mechanism untuk stabilitas API
 */
export async function extractTextWithRetry(
  file: File,
  maxRetries: number = 2
): Promise<OCRResult> {
  console.log(`Starting OCR.space API with retry mechanism (max: ${maxRetries})`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`OCR attempt ${attempt}/${maxRetries}`);
      const result = await extractTextFromKTP(file);
      console.log(`OCR succeeded on attempt ${attempt}`);
      return result;
    } catch (error) {
      console.log(`OCR attempt ${attempt} failed:`, error instanceof Error ? error.message : 'Unknown error');
      
      if (attempt === maxRetries) {
        throw error; // Throw pada attempt terakhir
      }
      
      // Wait 2 detik sebelum retry
      console.log(`Retrying in 2 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  throw new Error('All OCR attempts failed');
}

/**
 * Extract text dengan timeout untuk API calls
 */
export async function extractTextWithTimeout(
  file: File,
  timeoutMs: number = 30000 // 30 detik untuk API call yang lebih stable
): Promise<OCRResult> {
  console.log(`Starting OCR.space API with timeout: ${timeoutMs}ms`);
  
  return Promise.race([
    extractTextWithRetry(file),
    new Promise<OCRResult>((_, reject) =>
      setTimeout(() => {
        console.log('OCR API timeout reached');
        reject(new Error('OCR API timeout - silakan coba lagi dalam beberapa saat'));
      }, timeoutMs)
    ),
  ]);
}