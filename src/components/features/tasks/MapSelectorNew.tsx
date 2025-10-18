'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface MapSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (coordinates: { lat: number; lng: number }) => void;
  initialCoordinates?: { lat: number; lng: number };
  address?: string;
}

export default function MapSelector({
  isOpen,
  onClose,
  onLocationSelect,
  initialCoordinates = { lat: 5.5577, lng: 95.3222 }, // Default ke Banda Aceh
  address = ''
}: MapSelectorProps) {
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [selectedPosition, setSelectedPosition] = useState<[number, number]>([
    initialCoordinates.lat || 5.5577,
    initialCoordinates.lng || 95.3222
  ]);
  const [searchQuery, setSearchQuery] = useState(address);
  const [isSearching, setIsSearching] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  // Update position ketika initialCoordinates berubah
  useEffect(() => {
    if (initialCoordinates.lat !== 0 && initialCoordinates.lng !== 0) {
      setSelectedPosition([initialCoordinates.lat, initialCoordinates.lng]);
    }
  }, [initialCoordinates]);

  // Initialize map when component mounts and isOpen is true
  useEffect(() => {
    if (isOpen && !mapLoaded && !mapError) {
      initializeMap();
    }
  }, [isOpen, mapLoaded, mapError]);

  const initializeMap = async () => {
    try {
      // Dynamically import Leaflet modules
      const L = (await import('leaflet')).default;
      
      // Import CSS - handled in globals.css or next.config.js

      // Fix for default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      // Create map
      const mapContainer = document.getElementById('leaflet-map');
      if (mapContainer && !mapRef.current) {
        const map = L.map(mapContainer).setView(selectedPosition, 13);
        
        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Add marker
        const marker = L.marker(selectedPosition, { draggable: true }).addTo(map);
        
        // Handle marker drag
        marker.on('dragend', (e: any) => {
          const newPos = e.target.getLatLng();
          setSelectedPosition([newPos.lat, newPos.lng]);
        });

        // Handle map click
        map.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          setSelectedPosition([lat, lng]);
          marker.setLatLng([lat, lng]);
        });

        mapRef.current = map;
        markerRef.current = marker;
        
        // Invalidate size after a short delay to ensure proper rendering
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize();
          }
        }, 100);
        
        setMapLoaded(true);
        toast.success('Peta berhasil dimuat!');
      }
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError(true);
      toast.error('Gagal memuat peta. Silakan refresh halaman.');
    }
  };

  // Update marker position when selectedPosition changes
  useEffect(() => {
    if (mapRef.current && markerRef.current && mapLoaded) {
      markerRef.current.setLatLng(selectedPosition);
      mapRef.current.setView(selectedPosition);
    }
  }, [selectedPosition, mapLoaded]);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
        setMapLoaded(false);
      }
    };
  }, []);

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

  if (mapError) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Gagal Memuat Peta</h3>
          <p className="text-gray-600 mb-4">Terjadi kesalahan saat memuat peta. Silakan refresh halaman dan coba lagi.</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Halaman
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-4xl max-h-[98vh] sm:max-h-[95vh] overflow-y-auto shadow-2xl flex flex-col">
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
        <div className="h-80 sm:h-96 relative flex-shrink-0">
          {!mapLoaded && !mapError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Memuat peta...</p>
              </div>
            </div>
          )}
          <div id="leaflet-map" className="h-full w-full"></div>
        </div>

        {/* Coordinates Display */}
        <div className="p-3 sm:p-4 bg-gray-50/50 border-b border-gray-100 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2 sm:gap-6 text-sm">
            <div className="flex items-center justify-center gap-2">
              <span className="font-medium text-gray-700">Koordinat:</span>
              <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 rounded-lg font-mono text-xs sm:text-sm">
                {selectedPosition[0].toFixed(6)}, {selectedPosition[1].toFixed(6)}
              </span>
            </div>
            <div className="text-xs text-gray-500 text-center">
              💡 Klik peta atau seret marker merah untuk mengubah posisi
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 bg-white border-t border-gray-100 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="text-xs text-gray-500 text-center sm:text-left">
              Pastikan lokasi sudah tepat sebelum menyimpan
            </div>
            <div className="flex gap-3 justify-center sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="px-4 sm:px-6 flex-1 sm:flex-none"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleSaveLocation}
                className="px-4 sm:px-6 bg-green-600 hover:bg-green-700 text-white font-semibold flex-1 sm:flex-none shadow-lg hover:shadow-xl transition-all duration-200 ring-2 ring-green-500/20"
              >
                ✓ Pilih Lokasi Ini
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}