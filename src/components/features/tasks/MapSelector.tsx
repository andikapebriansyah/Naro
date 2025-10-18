'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

// Fix untuk default marker icons di Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (coordinates: { lat: number; lng: number }) => void;
  initialCoordinates?: { lat: number; lng: number };
  address?: string;
}

// Komponen untuk menangani click pada peta
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Custom marker component yang bisa dipindah
function DraggableMarker({ 
  position, 
  onPositionChange 
}: { 
  position: [number, number]; 
  onPositionChange: (lat: number, lng: number) => void;
}) {
  const [dragging, setDragging] = useState(false);

  const eventHandlers = {
    dragstart: () => {
      setDragging(true);
    },
    dragend: (e: any) => {
      setDragging(false);
      const marker = e.target;
      const newPos = marker.getLatLng();
      onPositionChange(newPos.lat, newPos.lng);
    },
  };

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
    />
  );
}

export default function MapSelector({
  isOpen,
  onClose,
  onLocationSelect,
  initialCoordinates = { lat: 5.5577, lng: 95.3222 }, // Default ke Banda Aceh
  address = ''
}: MapSelectorProps) {
  const [selectedPosition, setSelectedPosition] = useState<[number, number]>([
    initialCoordinates.lat || 5.5577,
    initialCoordinates.lng || 95.3222
  ]);
  const [searchQuery, setSearchQuery] = useState(address);
  const [isSearching, setIsSearching] = useState(false);

  // Update position ketika initialCoordinates berubah
  useEffect(() => {
    if (initialCoordinates.lat !== 0 && initialCoordinates.lng !== 0) {
      setSelectedPosition([initialCoordinates.lat, initialCoordinates.lng]);
    }
  }, [initialCoordinates]);

  // Fungsi untuk mencari lokasi berdasarkan alamat menggunakan Nominatim
  const searchLocation = async () => {
    if (!searchQuery.trim()) {
      toast.error('Masukkan alamat untuk dicari');
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setSelectedPosition([lat, lng]);
        toast.success('Lokasi ditemukan!');
      } else {
        toast.error('Lokasi tidak ditemukan. Coba dengan alamat yang lebih spesifik.');
      }
    } catch (error) {
      console.error('Error searching location:', error);
      toast.error('Gagal mencari lokasi. Periksa koneksi internet Anda.');
    } finally {
      setIsSearching(false);
    }
  };

  // Fungsi untuk menggunakan lokasi saat ini
  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setSelectedPosition([lat, lng]);
          toast.success('Lokasi saat ini berhasil dideteksi!');
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Tidak dapat mengakses lokasi. Pastikan izin lokasi telah diberikan.');
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      toast.error('Geolocation tidak didukung oleh browser ini.');
    }
  };

  // Handler untuk click pada peta
  const handleMapClick = (lat: number, lng: number) => {
    setSelectedPosition([lat, lng]);
  };

  // Handler untuk drag marker
  const handleMarkerDrag = (lat: number, lng: number) => {
    setSelectedPosition([lat, lng]);
  };

  // Handler untuk menyimpan lokasi
  const handleSaveLocation = () => {
    onLocationSelect({
      lat: selectedPosition[0],
      lng: selectedPosition[1]
    });
    onClose();
    toast.success('Lokasi berhasil dipilih!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                🗺️ Pilih Lokasi di Peta
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Klik pada peta atau seret marker untuk memilih lokasi yang tepat
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
            >
              ✕
            </Button>
          </div>
        </div>

        {/* Search Section */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Label htmlFor="search" className="text-sm font-medium text-gray-700">
                Cari Alamat
              </Label>
              <Input
                id="search"
                type="text"
                placeholder="Contoh: Jl. T. Nyak Arief, Banda Aceh"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2 items-end">
              <Button
                type="button"
                onClick={searchLocation}
                disabled={isSearching}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSearching ? '🔍' : '🔍'} Cari
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={useCurrentLocation}
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                📍 Lokasi Saya
              </Button>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="h-96 relative">
          <MapContainer
            center={selectedPosition}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            key={`${selectedPosition[0]}-${selectedPosition[1]}`} // Force re-render when position changes
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapClickHandler onLocationSelect={handleMapClick} />
            
            <DraggableMarker 
              position={selectedPosition} 
              onPositionChange={handleMarkerDrag}
            />
          </MapContainer>
        </div>

        {/* Coordinates Display */}
        <div className="p-4 bg-gray-50/50 border-b border-gray-100">
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">Koordinat:</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg font-mono">
                {selectedPosition[0].toFixed(6)}, {selectedPosition[1].toFixed(6)}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              💡 Klik peta atau seret marker merah untuk mengubah posisi
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-white flex justify-between items-center">
          <div className="text-xs text-gray-500">
            Pastikan lokasi sudah tepat sebelum menyimpan
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-6"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleSaveLocation}
              className="px-6 bg-green-600 hover:bg-green-700"
            >
              ✓ Pilih Lokasi Ini
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}