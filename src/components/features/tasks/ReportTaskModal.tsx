'use client';

import { useState } from 'react';
import { X, AlertTriangle, Upload, Trash2, Loader } from 'lucide-react';

interface ReportTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, description: string, evidence: File[]) => Promise<void>;
  taskTitle: string;
  isLoading: boolean;
  userType: 'worker' | 'employer';
}

export function ReportTaskModal({
  isOpen,
  onClose,
  onConfirm,
  taskTitle,
  isLoading,
  userType,
}: ReportTaskModalProps) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const employerReasonOptions = [
    { value: 'worker_no_show', label: '❌ Pekerja Tidak Datang' },
    { value: 'work_quality_poor', label: '⚠️ Kualitas Pekerjaan Buruk' },
    { value: 'work_incomplete', label: '📋 Pekerjaan Tidak Selesai' },
    { value: 'unprofessional', label: '😠 Sikap Tidak Profesional' },
    { value: 'damage_property', label: '💔 Merusak Properti' },
    { value: 'late_arrival', label: '⏰ Datang Terlambat' },
    { value: 'contract_breach', label: '📄 Melanggar Perjanjian' },
    { value: 'safety_violation', label: '⚠️ Pelanggaran Keselamatan' },
    { value: 'other', label: '📝 Lainnya' },
  ];

  const workerReasonOptions = [
    { value: 'payment_not_received', label: '💰 Pembayaran Tidak Diterima' },
    { value: 'payment_less', label: '💸 Pembayaran Kurang dari Kesepakatan' },
    { value: 'unsafe_workplace', label: '⚠️ Tempat Kerja Tidak Aman' },
    { value: 'job_not_match', label: '📋 Pekerjaan Tidak Sesuai Deskripsi' },
    { value: 'harassment', label: '😠 Pelecehan atau Intimidasi' },
    { value: 'unreasonable_demand', label: '❗ Permintaan Tidak Masuk Akal' },
    { value: 'contract_breach', label: '📄 Pemberi Kerja Melanggar Perjanjian' },
    { value: 'no_show_employer', label: '❌ Pemberi Kerja Tidak Ada di Lokasi' },
    { value: 'other', label: '📝 Lainnya' },
  ];

  const reasonOptions = userType === 'employer' ? employerReasonOptions : workerReasonOptions;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (selectedFiles.length + files.length > 5) {
      alert('Maksimal 5 file bukti');
      return;
    }

    const validFiles: File[] = [];
    files.forEach(file => {
      if (!['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'].includes(file.type)) {
        alert(`File ${file.name} tidak valid. Hanya JPG, PNG, dan PDF yang diizinkan.`);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} terlalu besar. Maksimal 5MB per file.`);
        return;
      }

      validFiles.push(file);
    });

    validFiles.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewUrls(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrls(prev => [...prev, '']);
      }
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!reason || !description.trim()) {
      alert('Mohon pilih alasan dan isi deskripsi laporan');
      return;
    }

    if (description.length < 20) {
      alert('Deskripsi minimal 20 karakter');
      return;
    }

    await onConfirm(reason, description, selectedFiles);
    
    setReason('');
    setDescription('');
    setSelectedFiles([]);
    setPreviewUrls([]);
  };

  const handleClose = () => {
    if (!isLoading) {
      setReason('');
      setDescription('');
      setSelectedFiles([]);
      setPreviewUrls([]);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Laporkan Tugas</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Tugas:</strong> {taskTitle}
            </p>
            <p className="text-xs text-yellow-700 mt-2">
              Laporan akan ditinjau oleh tim kami dalam 1-3 hari kerja
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Alasan Laporan <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">Pilih alasan...</option>
              {reasonOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Deskripsi Masalah <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              placeholder="Jelaskan masalah yang Anda alami secara detail..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none disabled:bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimal 20 karakter ({description.length}/20)
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Bukti Pendukung (Opsional) 
              <span className="text-gray-500 text-xs font-normal ml-1">Maks 5 file, 5MB per file</span>
            </label>
            
            <div className="relative">
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                onChange={handleFileSelect}
                disabled={isLoading || selectedFiles.length >= 5}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-500 hover:bg-primary-50 transition-colors">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Klik atau drag file di sini
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG, atau PDF
                </p>
              </div>
            </div>

            {selectedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                    <div className="flex-1 min-w-0">
                      {file.type.startsWith('image/') ? (
                        <div className="flex items-center gap-2">
                          {previewUrls[index] && (
                            <img 
                              src={previewUrls[index]} 
                              alt={`preview-${index}`}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-12 bg-red-100 rounded flex items-center justify-center">
                            <span className="text-xs font-bold text-red-600">PDF</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveFile(index)}
                      disabled={isLoading}
                      className="text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {selectedFiles.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                {selectedFiles.length} file terpilih ({5 - selectedFiles.length} file lagi tersisa)
              </p>
            )}
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-xs text-red-700">
              ⚠️ <strong>Peringatan:</strong> Laporan palsu dapat mengakibatkan penangguhan akun Anda.
              Pastikan informasi yang Anda berikan akurat dan jujur.
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3 rounded-b-2xl border-t">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !reason || description.length < 20}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Mengirim...
              </>
            ) : (
              'Kirim Laporan'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}