import { describe, it, expect, beforeEach } from 'vitest';
import { gpsTrackerService } from '../src/services/gpsTrackerService';

describe('GpsTrackerService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Pembangkitan Kode Ruang Kriptografis 12-Karakter Aman', () => {
    it('menghasilkan kode berformat KMP- dengan 12 karakter alfanumerik non-ambigu', () => {
      const code = gpsTrackerService.generateRoomCode();
      
      expect(code.startsWith('KMP-')).toBe(true);
      expect(code.length).toBe(16); // 'KMP-' (4) + 12 = 16

      // Karakter 12 digit setelah 'KMP-' tidak mengandung karakter ambigu (0, O, 1, I)
      const randomSuffix = code.substring(4);
      expect(randomSuffix).toMatch(/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{12}$/);
    });

    it('menghasilkan kode acak unik di setiap pemanggilan', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 50; i++) {
        codes.add(gpsTrackerService.generateRoomCode());
      }
      // Semua 50 kode harus unik (kombinasi 32^12 sangat besar)
      expect(codes.size).toBe(50);
    });

    it('memperbarui roomId aktif di dalam state', () => {
      const code = gpsTrackerService.generateRoomCode();
      const state = gpsTrackerService.getState();
      expect(state.roomId).toBe(code);
    });
  });

  describe('Manajemen Pengaturan & State GPS', () => {
    it('mengubah mode konsumsi baterai GPS (smart, high_accuracy, eco)', () => {
      gpsTrackerService.setPowerMode('eco');
      expect(gpsTrackerService.getState().powerMode).toBe('eco');

      gpsTrackerService.setPowerMode('high_accuracy');
      expect(gpsTrackerService.getState().powerMode).toBe('high_accuracy');

      gpsTrackerService.setPowerMode('smart');
      expect(gpsTrackerService.getState().powerMode).toBe('smart');
    });

    it('menyimpan dan memperbarui catatan status lokasi terkini', () => {
      gpsTrackerService.setStatusNote('Di Perpustakaan Lantai 2');
      expect(gpsTrackerService.getState().statusNote).toBe('Di Perpustakaan Lantai 2');
      expect(localStorage.getItem('kampuskit_gps_status_note')).toBe('Di Perpustakaan Lantai 2');
    });
  });
});
