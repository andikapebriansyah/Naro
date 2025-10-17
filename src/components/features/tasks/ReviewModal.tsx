'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, X } from 'lucide-react';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (rating: number, comment: string) => Promise<void>;
  taskTitle: string;
  revieweeName: string;
  isLoading: boolean;
  userType: 'worker' | 'employer';
}

export function ReviewModal({
  isOpen,
  onClose,
  onConfirm,
  taskTitle,
  revieweeName,
  isLoading,
  userType,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState<{ rating?: string; comment?: string }>({});

  if (!isOpen) return null;

  const handleSubmit = async () => {
    const newErrors: { rating?: string; comment?: string } = {};

    if (rating === 0) {
      newErrors.rating = 'Silakan pilih rating';
    }

    if (comment.trim().length < 10) {
      newErrors.comment = 'Ulasan minimal 10 karakter';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    await onConfirm(rating, comment);
    handleClose();
  };

  const handleClose = () => {
    setRating(0);
    setHoverRating(0);
    setComment('');
    setErrors({});
    onClose();
  };

  const getRatingLabel = (value: number) => {
    const labels = ['', 'Sangat Buruk', 'Buruk', 'Cukup', 'Baik', 'Sangat Baik'];
    return labels[value] || '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Beri Ulasan</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Task Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Tugas</p>
            <p className="font-semibold text-gray-900">{taskTitle}</p>
            <p className="text-sm text-gray-600 mt-2">
              {userType === 'employer' ? 'Pekerja' : 'Pemberi Kerja'}
            </p>
            <p className="font-medium text-primary-600">{revieweeName}</p>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoverRating(value)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      value <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {(hoverRating > 0 || rating > 0) && (
              <p className="text-sm font-medium text-gray-600">
                {getRatingLabel(hoverRating || rating)}
              </p>
            )}
            {errors.rating && (
              <p className="text-sm text-red-500 mt-1">{errors.rating}</p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ulasan <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                if (errors.comment && e.target.value.trim().length >= 10) {
                  setErrors({ ...errors, comment: undefined });
                }
              }}
              placeholder={
                userType === 'employer'
                  ? 'Ceritakan pengalaman Anda dengan pekerja ini...'
                  : 'Ceritakan pengalaman Anda dengan pemberi kerja ini...'
              }
              rows={5}
              className={errors.comment ? 'border-red-500' : ''}
              disabled={isLoading}
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-gray-500">Minimal 10 karakter</p>
              <p
                className={`text-xs ${
                  comment.length < 10 ? 'text-red-500' : 'text-gray-500'
                }`}
              >
                {comment.length} karakter
              </p>
            </div>
            {errors.comment && (
              <p className="text-sm text-red-500 mt-1">{errors.comment}</p>
            )}
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-900 mb-2">
              💡 Tips memberi ulasan yang baik:
            </p>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li>Jelaskan pengalaman Anda secara spesifik</li>
              <li>Berikan feedback yang konstruktif</li>
              <li>Hindari kata-kata kasar atau tidak pantas</li>
              <li>Fokus pada kualitas kerja dan profesionalisme</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1"
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || rating === 0}
            className="flex-1"
          >
            {isLoading ? 'Mengirim...' : 'Kirim Ulasan'}
          </Button>
        </div>
      </div>
    </div>
  );
}