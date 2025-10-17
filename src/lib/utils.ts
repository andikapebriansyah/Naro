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

// ✅ FIXED: Added validation for invalid dates
export function formatDate(date: Date | string | null | undefined): string {
  // Return fallback if date is invalid
  if (!date) {
    return 'Tanggal tidak tersedia';
  }

  try {
    const parsedDate = new Date(date);
    
    // Check if date is valid
    if (isNaN(parsedDate.getTime())) {
      return 'Tanggal tidak valid';
    }

    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(parsedDate);
  } catch (error) {
    console.error('Error formatting date:', error, 'Date value:', date);
    return 'Tanggal tidak valid';
  }
}

// ✅ FIXED: Added validation for invalid dates
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) {
    return 'Tanggal tidak tersedia';
  }

  try {
    const parsedDate = new Date(date);
    
    if (isNaN(parsedDate.getTime())) {
      return 'Tanggal tidak valid';
    }

    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(parsedDate);
  } catch (error) {
    console.error('Error formatting datetime:', error, 'Date value:', date);
    return 'Tanggal tidak valid';
  }
}

// ✅ FIXED: Added validation for invalid dates
export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) {
    return 'Waktu tidak tersedia';
  }

  try {
    const now = new Date();
    const then = new Date(date);
    
    if (isNaN(then.getTime())) {
      return 'Waktu tidak valid';
    }

    const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Baru saja';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam lalu`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} hari lalu`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} minggu lalu`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} bulan lalu`;
    return `${Math.floor(diffInSeconds / 31536000)} tahun lalu`;
  } catch (error) {
    console.error('Error formatting relative time:', error, 'Date value:', date);
    return 'Waktu tidak valid';
  }
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
    in_progress: 'Proses',
    accepted: 'Proses',  // ✅ CHANGED: accepted → Proses
    active: 'Proses',     // ✅ CHANGED: active → Proses
    proses: 'Proses',
    completed_worker: 'Menunggu Konfirmasi',  // ✅ NEW: Status worker sudah selesai
    completed: 'Selesai',
    selesai: 'Selesai',
    cancelled: 'Dibatalkan',
    dibatalkan: 'Dibatalkan',
    disputed: 'Bermasalah',
    rejected: 'Ditolak',
  };
  return labels[status] || status;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    open: 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-green-100 text-green-800',
    accepted: 'bg-green-100 text-green-800',
    active: 'bg-green-100 text-green-800',
    proses: 'bg-green-100 text-green-800',
    completed_worker: 'bg-purple-100 text-purple-800',
    completed: 'bg-emerald-100 text-emerald-800',
    selesai: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-red-100 text-red-800',
    dibatalkan: 'bg-red-100 text-red-800',
    disputed: 'bg-orange-100 text-orange-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function calculateTaskProgress(
  startDate: string | Date | null | undefined,
  startTime: string | null | undefined,
  endDate: string | Date | null | undefined,
  endTime: string | null | undefined
) {
  try {
    // ✅ Debug logging
    console.log('=== calculateTaskProgress DEBUG ===');
    console.log('Input values:', {
      startDate,
      startTime,
      endDate,
      endTime,
      startDateType: typeof startDate,
      endDateType: typeof endDate
    });

    // Validate inputs
    if (!startDate || !startTime || !endDate || !endTime) {
      console.log('❌ Missing required fields:', {
        hasStartDate: !!startDate,
        hasStartTime: !!startTime,
        hasEndDate: !!endDate,
        hasEndTime: !!endTime
      });
      return { 
        percentage: 0, 
        remainingHours: 0, 
        remainingMinutes: 0, 
        status: 'invalid' 
      };
    }

    // ✅ Convert dates to ISO format if needed
    let startDateStr = startDate;
    let endDateStr = endDate;

    // If startDate is a Date object, convert to ISO string
    if (startDate instanceof Date) {
      startDateStr = startDate.toISOString().split('T')[0];
    } else if (typeof startDate === 'string') {
      // If it's already a string, just use the date part
      startDateStr = startDate.split('T')[0];
    }

    // Same for endDate
    if (endDate instanceof Date) {
      endDateStr = endDate.toISOString().split('T')[0];
    } else if (typeof endDate === 'string') {
      endDateStr = endDate.split('T')[0];
    }

    console.log('Processed dates:', {
      startDateStr,
      endDateStr
    });

    // Create date objects
    const start = new Date(`${startDateStr}T${startTime}`);
    const end = new Date(`${endDateStr}T${endTime}`);
    const now = new Date();

    console.log('Date objects:', {
      start: start.toISOString(),
      end: end.toISOString(),
      now: now.toISOString(),
      startValid: !isNaN(start.getTime()),
      endValid: !isNaN(end.getTime())
    });

    // Validate date objects
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.log('❌ Invalid date objects created');
      return { 
        percentage: 0, 
        remainingHours: 0, 
        remainingMinutes: 0, 
        status: 'invalid' 
      };
    }

    const totalDuration = end.getTime() - start.getTime();
    console.log('Total duration (ms):', totalDuration);
    
    // ✅ Not started yet
    if (now < start) {
      const timeUntilStart = start.getTime() - now.getTime();
      const hoursUntilStart = Math.floor(timeUntilStart / (1000 * 60 * 60));
      const minutesUntilStart = Math.floor((timeUntilStart % (1000 * 60 * 60)) / (1000 * 60));
      
      console.log('✅ Status: NOT_STARTED');
      return {
        percentage: 0,
        remainingHours: hoursUntilStart,
        remainingMinutes: minutesUntilStart,
        status: 'not_started',
        totalHours: Math.floor(totalDuration / (1000 * 60 * 60)),
        totalMinutes: Math.floor((totalDuration % (1000 * 60 * 60)) / (1000 * 60))
      };
    }
    
    // ✅ Already finished
    if (now > end) {
      console.log('✅ Status: FINISHED');
      return {
        percentage: 100,
        remainingHours: 0,
        remainingMinutes: 0,
        status: 'finished',
        totalHours: Math.floor(totalDuration / (1000 * 60 * 60)),
        totalMinutes: Math.floor((totalDuration % (1000 * 60 * 60)) / (1000 * 60))
      };
    }
    
    // ✅ In progress
    const elapsed = now.getTime() - start.getTime();
    const remaining = end.getTime() - now.getTime();
    
    const percentage = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    const remainingHours = Math.floor(remaining / (1000 * 60 * 60));
    const remainingMinutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    console.log('✅ Status: IN_PROGRESS', {
      percentage: Math.round(percentage),
      remainingHours,
      remainingMinutes
    });

    return {
      percentage: Math.round(percentage),
      remainingHours,
      remainingMinutes,
      status: 'in_progress',
      totalHours: Math.floor(totalDuration / (1000 * 60 * 60)),
      totalMinutes: Math.floor((totalDuration % (1000 * 60 * 60)) / (1000 * 60))
    };
  } catch (error) {
    console.error('❌ Error calculating progress:', error);
    return { 
      percentage: 0, 
      remainingHours: 0, 
      remainingMinutes: 0, 
      status: 'error' 
    };
  }
}

export function formatDuration(hours: number, minutes: number): string {
  if (hours === 0 && minutes === 0) return 'Selesai';
  if (hours === 0) return `${minutes} menit`;
  if (minutes === 0) return `${hours} jam`;
  return `${hours} jam ${minutes} menit`;
}