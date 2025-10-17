import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string | any): string {
  try {
    if (!date) return 'Tanggal tidak valid';
    
    let actualDate: Date;
    
    // Handle MongoDB date format { $date: { $numberLong: "..." } }
    if (typeof date === 'object' && '$date' in date) {
      const timestamp = parseInt(date.$date.$numberLong || date.$date);
      actualDate = new Date(timestamp);
    } 
    // Handle Date object
    else if (typeof date === 'object' && date instanceof Date) {
      actualDate = date;
    }
    // Handle ISO string or other string formats
    else if (typeof date === 'string') {
      actualDate = new Date(date);
    }
    // Handle number (timestamp)
    else if (typeof date === 'number') {
      actualDate = new Date(date);
    }
    else {
      return 'Tanggal tidak valid';
    }

    if (isNaN(actualDate.getTime())) {
      console.warn('Invalid date after conversion:', date);
      return 'Tanggal tidak valid';
    }

    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(actualDate);
  } catch (error) {
    console.error('Error formatting date:', error, 'Input:', date);
    return 'Tanggal tidak valid';
  }
}

export function formatDateTime(date: Date | string | any): string {
  try {
    let actualDate: Date;
    
    // Handle MongoDB date format { $date: { $numberLong: "..." } }
    if (date && typeof date === 'object' && '$date' in date) {
      const timestamp = parseInt(date.$date.$numberLong || date.$date);
      actualDate = new Date(timestamp);
    } else if (date && typeof date === 'object' && 'getTime' in date) {
      actualDate = new Date(date);
    } else {
      actualDate = new Date(date);
    }

    if (isNaN(actualDate.getTime())) {
      return 'Tanggal tidak valid';
    }

    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(actualDate);
  } catch (error) {
    console.error('Error formatting datetime:', error, 'Input:', date);
    return 'Tanggal tidak valid';
  }
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Baru saja';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit lalu`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam lalu`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} hari lalu`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} minggu lalu`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} bulan lalu`;
  return `${Math.floor(diffInSeconds / 31536000)} tahun lalu`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function calculateServiceFee(amount: number, percentage: number = 7.5): number {
  return Math.round(amount * (percentage / 100));
}

export function calculateTotalPayment(
  amount: number,
  serviceFee: number,
  adminFee: number = 2500
): number {
  return amount + serviceFee + adminFee;
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    kebersihan: 'Kebersihan & Perawatan',
    teknisi: 'Teknisi & Perbaikan',
    renovasi: 'Renovasi & Konstruksi',
    tukang: 'Tukang & Pertukangan',
    angkut: 'Angkut & Pindahan',
    taman: 'Taman & Landscaping',
    lainnya: 'Lainnya',
  };
  return labels[category] || category;
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Draft',
    open: 'Terbuka',
    pending: 'Menunggu',
    in_progress: 'Dalam Proses',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
    disputed: 'Bermasalah',
  };
  return labels[status] || status;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    open: 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-green-100 text-green-800',
    completed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-red-100 text-red-800',
    disputed: 'bg-orange-100 text-orange-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Hitung progress pekerjaan berdasarkan waktu
 * @param startDate - Tanggal mulai
 * @param startTime - Waktu mulai (format HH:mm)
 * @param endDate - Tanggal selesai
 * @param endTime - Waktu selesai (format HH:mm)
 * @returns Object dengan percentage (0-100), remaining time, dan status
 */
export function calculateTaskProgress(
  startDate: string | Date | any,
  startTime: string,
  endDate: string | Date | any,
  endTime: string
) {
  try {
    // Handle MongoDB date format for startDate
    let start: Date;
    if (startDate && typeof startDate === 'object' && '$date' in startDate) {
      const timestamp = parseInt(startDate.$date.$numberLong || startDate.$date);
      start = new Date(timestamp);
    } else {
      start = new Date(startDate);
    }

    // Handle MongoDB date format for endDate
    let end: Date;
    if (endDate && typeof endDate === 'object' && '$date' in endDate) {
      const timestamp = parseInt(endDate.$date.$numberLong || endDate.$date);
      end = new Date(timestamp);
    } else {
      end = new Date(endDate);
    }

    // Parse times and set them on the dates
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    start.setHours(startHour, startMin, 0, 0);
    end.setHours(endHour, endMin, 0, 0);

    const now = new Date();
    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();

    // Calculate percentage
    let percentage = 0;
    if (totalDuration > 0) {
      percentage = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
    }

    // Calculate remaining time
    const remainingMs = Math.max(0, end.getTime() - now.getTime());
    const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
    const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

    // Determine status
    let status: 'not_started' | 'in_progress' | 'completed' | 'overdue' = 'not_started';
    if (now < start) {
      status = 'not_started';
    } else if (now >= start && now < end) {
      status = 'in_progress';
    } else if (now >= end) {
      status = 'completed';
    }

    return {
      percentage: Math.round(percentage),
      remainingHours,
      remainingMinutes,
      status,
      startTime: start,
      endTime: end,
      isOverdue: now > end,
    };
  } catch (error) {
    console.error('Error calculating task progress:', error);
    return {
      percentage: 0,
      remainingHours: 0,
      remainingMinutes: 0,
      status: 'not_started' as const,
      startTime: new Date(),
      endTime: new Date(),
      isOverdue: false,
    };
  }
}

/**
 * Format durasi dalam format yang readable
 * @param hours - Jam
 * @param minutes - Menit
 * @returns String format "X jam Y menit" atau hanya "X jam" atau "Y menit"
 */
export function formatDuration(hours: number, minutes: number): string {
  if (hours === 0 && minutes === 0) return '0 menit';
  if (hours === 0) return `${minutes} menit`;
  if (minutes === 0) return `${hours} jam`;
  return `${hours} jam ${minutes} menit`;
}

/**
 * Generate WhatsApp link
 * @param phoneNumber - Nomor telepon (bisa dengan atau tanpa +62)
 * @param message - Pesan (optional)
 * @returns URL untuk WhatsApp
 */
export function generateWhatsAppLink(phoneNumber: string, message?: string): string {
  if (!phoneNumber) return '#';
  
  // Normalize phone number - remove spaces, dashes, and +
  let normalized = phoneNumber.replace(/[\s\-()]/g, '');
  
  // If starts with 0, replace with 62
  if (normalized.startsWith('0')) {
    normalized = '62' + normalized.slice(1);
  }
  
  // If doesn't start with 62, add it
  if (!normalized.startsWith('62')) {
    normalized = '62' + normalized;
  }

  const baseUrl = `https://wa.me/${normalized}`;
  
  if (message) {
    const encodedMessage = encodeURIComponent(message);
    return `${baseUrl}?text=${encodedMessage}`;
  }
  
  return baseUrl;
}

/**
 * Generate Phone call link
 * @param phoneNumber - Nomor telepon
 * @returns Tel URI
 */
export function generatePhoneLink(phoneNumber: string): string {
  if (!phoneNumber) return '#';
  
  // Normalize phone number
  let normalized = phoneNumber.replace(/[\s\-()]/g, '');
  
  // If starts with 0, replace with +62
  if (normalized.startsWith('0')) {
    normalized = '+62' + normalized.slice(1);
  }
  
  // If doesn't start with +, add it
  if (!normalized.startsWith('+')) {
    normalized = '+' + normalized;
  }

  return `tel:${normalized}`;
}