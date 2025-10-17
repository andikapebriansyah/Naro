'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface CancelTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  taskTitle: string;
  isLoading?: boolean;
}

export function CancelTaskModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  taskTitle, 
  isLoading = false 
}: CancelTaskModalProps) {
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(reason);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Batalkan Tugas</h2>
          <p className="text-gray-600 mb-4">
            Apakah Anda yakin ingin membatalkan tugas <strong>"{taskTitle}"</strong>?
          </p>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <Label htmlFor="reason">Alasan Pembatalan (Opsional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Jelaskan alasan pembatalan..."
                rows={3}
              />
            </div>
            
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Membatalkan...' : 'Ya, Batalkan'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}