import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageService } from '../src/services/storage';
import { 
  STORAGE_KEYS, 
  USER_DATA_KEYS, 
  DEVICE_PREFERENCE_KEYS_SET, 
  EPHEMERAL_DEVICE_KEYS_SET 
} from '../src/services/storageKeys';

describe('StorageService & Storage Keys Registry', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Registry Key Terpusat', () => {
    it('memiliki seluruh key penting di USER_DATA_KEYS', () => {
      expect(USER_DATA_KEYS).toContain(STORAGE_KEYS.TASKS);
      expect(USER_DATA_KEYS).toContain(STORAGE_KEYS.COURSES);
      expect(USER_DATA_KEYS).toContain(STORAGE_KEYS.NOTES);
      expect(USER_DATA_KEYS).toContain(STORAGE_KEYS.FLASHCARDS);
      expect(USER_DATA_KEYS).toContain(STORAGE_KEYS.HABITS);
      expect(USER_DATA_KEYS).toContain(STORAGE_KEYS.TRANSACTIONS);
      expect(USER_DATA_KEYS).toContain(STORAGE_KEYS.USER_PROFILE);
    });

    it('membedakan key data user dan preferensi perangkat', () => {
      // Data keys tidak boleh bercampur dengan device preference keys
      expect(DEVICE_PREFERENCE_KEYS_SET.has(STORAGE_KEYS.APP_LANGUAGE)).toBe(true);
      expect(DEVICE_PREFERENCE_KEYS_SET.has(STORAGE_KEYS.SIDEBAR_COLLAPSED)).toBe(true);
      expect(DEVICE_PREFERENCE_KEYS_SET.has(STORAGE_KEYS.TASKS)).toBe(false);

      // Ephemeral hardware keys tidak disinkronkan ke cloud
      expect(EPHEMERAL_DEVICE_KEYS_SET.has(STORAGE_KEYS.GEMINI_CUSTOM_API_KEY)).toBe(true);
      expect(EPHEMERAL_DEVICE_KEYS_SET.has(STORAGE_KEYS.OWNER_UID)).toBe(true);
    });
  });

  describe('Isolasi Akun Berbeda & Keamanan Logout', () => {
    it('mendeteksi kepemilikan akun (checkAccountOwnership)', () => {
      // Kasus 1: Belum ada pemilik sebelumnya (first time / clean device)
      expect(StorageService.checkAccountOwnership('user_123')).toBe('first');

      // Kasus 2: Login kembali dengan akun yang sama
      expect(StorageService.checkAccountOwnership('user_123')).toBe('same');

      // Kasus 3: Login dengan akun berbeda (mismatch)
      expect(StorageService.checkAccountOwnership('user_other')).toBe('mismatch');
    });

    it('clearUserData membersihkan data akun namun mempertahankan preferensi perangkat', () => {
      // Simpan data operasional
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([{ id: '1' }]));
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify([{ id: 'n1' }]));
      localStorage.setItem(STORAGE_KEYS.OWNER_UID, 'user_A');

      // Simpan preferensi perangkat
      localStorage.setItem(STORAGE_KEYS.APP_LANGUAGE, 'id');
      localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, 'true');

      // Jalankan pembersihan saat logout / ganti akun
      StorageService.clearUserData();

      // Data operasional terhapus
      expect(localStorage.getItem(STORAGE_KEYS.TASKS)).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.NOTES)).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.OWNER_UID)).toBeNull();

      // Preferensi perangkat tetap aman
      expect(localStorage.getItem(STORAGE_KEYS.APP_LANGUAGE)).toBe('id');
      expect(localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED)).toBe('true');
    });
  });

  describe('Validasi & Ekspor/Impor Cadangan JSON', () => {
    it('menghasilkan cadangan JSON valid dengan schemaVersion 2 dan signature kampuskit', () => {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([{ id: 't1', title: 'Belajar Kalkulus' }]));
      
      const exported = StorageService.exportBackupJson();
      const parsed = JSON.parse(exported);

      expect(parsed.app).toBe('kampuskit');
      expect(parsed.schemaVersion).toBe(2);
      expect(parsed.data[STORAGE_KEYS.TASKS]).toEqual([{ id: 't1', title: 'Belajar Kalkulus' }]);
      expect(parsed.exportedAt).toBeDefined();
    });

    it('menolak impor file cadangan yang tidak valid atau bukan dari KampusKit', () => {
      // File dari aplikasi lain
      const foreignBackup = JSON.stringify({ app: 'other_app', data: {} });
      const res1 = StorageService.importBackupJson(foreignBackup);
      expect(res1.valid).toBe(false);
      expect(res1.error).toContain('bukan berasal dari KampusKit');

      // JSON rusak
      const brokenJson = '{ app: kampuskit, bad json }';
      const res2 = StorageService.importBackupJson(brokenJson);
      expect(res2.valid).toBe(false);
      expect(res2.error).toContain('Format JSON');
    });

    it('menerima file cadangan KampusKit dan menghitung ringkasan modul', () => {
      const validBackup = JSON.stringify({
        app: 'kampuskit',
        schemaVersion: 2,
        exportedAt: new Date().toISOString(),
        data: {
          tasks: [{ id: '1' }, { id: '2' }],
          notes: [{ id: 'n1' }],
          user_profile: { name: 'Ahmad' }
        }
      });

      const res = StorageService.importBackupJson(validBackup);
      expect(res.valid).toBe(true);
      expect(res.summary.tasks).toBe(2);
      expect(res.summary.notes).toBe(1);
    });

    it('mengabaikan key cadangan yang tidak dikenal dan menolak schema yang tidak didukung', () => {
      const backup = JSON.stringify({
        app: 'kampuskit',
        schemaVersion: 2,
        data: {
          tasks: [{ id: '1' }],
          arbitrary_key: 'must_not_be_restored'
        }
      });
      const imported = StorageService.importBackupJson(backup);
      expect(imported.valid).toBe(true);
      expect(imported.data).toEqual({ tasks: [{ id: '1' }] });

      const unsupported = StorageService.importBackupJson(JSON.stringify({
        app: 'kampuskit',
        schemaVersion: 999,
        data: { tasks: [] }
      }));
      expect(unsupported.valid).toBe(false);
      expect(unsupported.error).toContain('schema');
    });
  });

  describe('Debounce & Penyimpanan Lokal', () => {
    it('menyimpan dan membaca data bertipe objek secara transparan', () => {
      const profile = { name: 'Rafi', semester: 4 };
      StorageService.setItem(STORAGE_KEYS.USER_PROFILE, profile);

      const read = StorageService.getItem(STORAGE_KEYS.USER_PROFILE, null);
      expect(read).toEqual(profile);
    });

    it('mengembalikan fallback ketika data storage rusak atau bertipe salah', () => {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify({ id: 'bukan-array' }));
      expect(StorageService.getItem(STORAGE_KEYS.TASKS, [])).toEqual([]);

      localStorage.setItem(STORAGE_KEYS.APP_LANGUAGE, JSON.stringify(['id']));
      expect(StorageService.getItem(STORAGE_KEYS.APP_LANGUAGE, 'id')).toBe('id');

      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify([]));
      expect(StorageService.getItem(STORAGE_KEYS.USER_PROFILE, null)).toBeNull();
    });

    it('menghasilkan ID unik untuk entri baru', () => {
      const id1 = StorageService.generateId();
      const id2 = StorageService.generateId();
      expect(id1).not.toBe(id2);
      expect(id1.length).toBeGreaterThan(6);
    });
  });
});
