import { create } from 'zustand';
import { UserProfile } from '../types';
import { StorageService } from '../services/storage';
import { AppLanguage } from '../utils/translations';

interface StoreState {
  userProfile: UserProfile;
  language: AppLanguage;
  setUserProfile: (profile: UserProfile) => void;
  setLanguage: (lang: AppLanguage) => void;
  gainXp: (amount: number) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  language: StorageService.getItem<AppLanguage>('app_language', 'id'),
  userProfile: {
    name: 'Mahasiswa',
    university: '',
    major: 'D3 Administrasi Bisnis',
    semester: 1,
    targetGpa: 4.00,
    notificationsEnabled: false,
    theme: 'COSMIC',
    uiStyle: { radiusMode: 'MODERN', fontMode: 'SANS' },
    streak: 0,
    lastLogin: '',
    xp: 0,
    level: 1
  },
  setLanguage: (lang: AppLanguage) => {
    set({ language: lang });
    StorageService.setItem('app_language', lang);
  },
  setUserProfile: (profile: UserProfile) => {
    set({ userProfile: profile });
    StorageService.setItem('user_profile', profile);
  },
  gainXp: (amount: number) => {
    const state = get();
    const newXp = (state.userProfile.xp || 0) + amount;
    const newLevel = Math.floor(newXp / 1000) + 1;
    
    const updatedProfile = { 
        ...state.userProfile, 
        xp: newXp, 
        level: newLevel 
    };
    
    set({ userProfile: updatedProfile });
    StorageService.setItem('user_profile', updatedProfile);
    
    if (newLevel > (state.userProfile.level || 1)) {
        try {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('kampuskit_levelup', { detail: { level: newLevel } }));
          }
        } catch {
          // ignore
        }
    }
  }
}));
