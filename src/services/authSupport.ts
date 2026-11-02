import { isNativeShell } from './apiClient';

export const CLOUD_WEB_URL = 'https://kampuskit.ai.studio';

export const CLOUD_LOGIN_NATIVE_MESSAGE =
  'Login Google dan sinkronisasi cloud tersedia di versi web KampusKit. Data yang tersimpan di perangkat ini tetap lengkap dan bisa dipakai tanpa login.';

export function isElectronShell(): boolean {
  return typeof navigator !== 'undefined' && /electron/i.test(navigator.userAgent);
}

export function isCloudLoginAvailable(): boolean {
  return !isNativeShell() && !isElectronShell();
}

export function describeAuthError(error: unknown): string {
  const code =
    typeof (error as { code?: unknown })?.code === 'string'
      ? (error as { code: string }).code
      : '';
  const message = error instanceof Error ? error.message : String(error ?? '');

  switch (code) {
    case 'auth/unauthorized-domain':
      return 'Domain aplikasi ini belum diizinkan di Firebase Authentication. Tambahkan domain tersebut ke Authorized domains, atau login melalui versi web resmi KampusKit.';
    case 'auth/popup-blocked':
      return 'Popup login diblokir oleh browser. Izinkan popup untuk situs ini lalu coba lagi.';
    case 'auth/popup-closed-by-user':
      return 'Login dibatalkan sebelum selesai. Silakan coba lagi.';
    case 'auth/cancelled-popup-request':
      return 'Permintaan login sebelumnya masih berjalan. Tunggu sebentar lalu coba lagi.';
    case 'auth/operation-not-supported-in-this-environment':
      return 'Google menolak login dari dalam aplikasi tertanam. Silakan login melalui versi web KampusKit.';
    case 'auth/network-request-failed':
      return 'Tidak dapat menghubungi server login. Periksa koneksi internet Anda lalu coba lagi.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan login. Tunggu beberapa menit lalu coba lagi.';
    default:
      break;
  }

  if (/disallowed_useragent|403/i.test(message)) {
    return 'Google menolak login dari dalam aplikasi tertanam. Silakan login melalui versi web KampusKit.';
  }

  return message || 'Login Google gagal. Silakan coba lagi.';
}
