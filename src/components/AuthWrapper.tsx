import React, { useEffect, useState } from 'react';
import { auth } from '../services/firebase';
import { StorageService } from '../services/storage';

export const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // If the device is currently offline, don't show initial loading screen at all
  const isCurrentlyOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  const [loading, setLoading] = useState(!isCurrentlyOffline);
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    let resolved = false;

    // Safety fallback: Never block the user for more than 1 second on startup
    const safetyTimer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        setLoading(false);
      }
    }, 1000);

    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      resolved = true;
      clearTimeout(safetyTimer);
      setUser(currentUser);

      if (currentUser) {
        const ownership = StorageService.checkAccountOwnership(currentUser.uid);
        if (ownership === 'mismatch') {
          const shouldImport = window.confirm(
            "Perhatian Keamanan: Data di perangkat ini tercatat milik akun lain.\n\n" +
            "Klik 'OK' jika Anda ingin MENGIMPOR data lokal ke akun baru ini.\n" +
            "Klik 'Batal' untuk MENGHAPUS data lama di perangkat dan memuat data bersih dari akun ini."
          );
          if (shouldImport) {
            StorageService.setOwnerUid(currentUser.uid);
            StorageService.setUserId(currentUser.uid);
            StorageService.syncToFirebase(currentUser.uid).catch(() => {});
          } else {
            StorageService.clearUserData(true);
            StorageService.setOwnerUid(currentUser.uid);
            StorageService.setUserId(currentUser.uid);
            await StorageService.syncFromFirebase(currentUser.uid);
            window.location.reload();
            return;
          }
        } else {
          StorageService.setUserId(currentUser.uid);
        }

        // Only attempt cloud sync if device is online
        if (typeof navigator !== 'undefined' && navigator.onLine) {
          try {
            // Use unified sync engine from StorageService
            await StorageService.syncFromFirebase(currentUser.uid);
            
            // Merge Google profile data if missing
            const profileStr = localStorage.getItem('user_profile');
            const profile = profileStr ? JSON.parse(profileStr) : {};
            let profileUpdated = false;
            
            if (!profile.name || profile.name === 'Mahasiswa') {
               profile.name = currentUser.displayName || profile.name;
               profileUpdated = true;
            }
            if (!profile.photo && currentUser.photoURL) {
               profile.photo = currentUser.photoURL;
               profile.usePhotoAsLogo = true;
               profileUpdated = true;
            }
            if (profileUpdated) {
               StorageService.setItem('user_profile', profile);
            }

            // Sync any local data changes to cloud in background
            StorageService.syncToFirebase(currentUser.uid).catch(() => {});
          } catch (error) {
            console.warn("Background sync skipped (offline/cached mode):", error);
          }
        }
      } else {
        StorageService.setUserId(null);
      }

      setLoading(false);
    });

    return () => {
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, []);

  // Only show loading screen if device is online and initial auth check is fast
  if (loading && typeof navigator !== 'undefined' && navigator.onLine) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <p className="text-zinc-400">Menyiapkan KampusKit...</p>
        </div>
      </div>
    );
  }

  const authKey = user ? user.uid : 'guest';

  return <React.Fragment key={authKey}>{children}</React.Fragment>;
};
