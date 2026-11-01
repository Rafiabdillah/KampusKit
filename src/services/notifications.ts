import { messaging, getToken, onMessage } from './firebase';
import { StorageService } from './storage';
import { playNotificationSound } from '../utils/sound';
import { getSmartMotivationByTime, MOTIVATION_DATABASE } from '../data/motivationData';

// VAPID key is usually required for web push. If you don't have one, 
// you can still request permission and use basic Notification API.
// Note: To fully receive background pushes, a VAPID key from Firebase Console is needed.

const triggerNotification = async (
  id: string, 
  title: string, 
  body: string, 
  registration: ServiceWorkerRegistration | null, 
  triggerTime?: Date,
  customData?: any
) => {
  const triggered = StorageService.getItem<string[]>(`triggered_notifs`, []);
  if (!triggered.includes(id)) {
     const options: any = {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200, 100, 200],
        tag: id, // Prevent duplicates and allow replacement
        data: customData || { url: '/' }
     };
     
     // Offline Background Scheduling using Notification Triggers API (Chromium / PWA standard)
     if (triggerTime && triggerTime.getTime() > Date.now()) {
        if (registration && 'showTrigger' in Notification.prototype) {
           options.showTrigger = new (window as any).TimestampTrigger(triggerTime.getTime());
           try {
              await registration.showNotification(title, options);
              StorageService.setItem(`triggered_notifs`, [...triggered, id]);
           } catch(e) {
              console.warn("Failed to schedule background trigger:", e);
           }
        }
        return; // Scheduled, exit early
     }

     // Play sound notification for immediate foreground alerts
     try {
       const userProfile = StorageService.getItem<any>('user_profile', {});
       
       let soundId = userProfile?.notificationSound || 'bell';
       if (id.startsWith('course_')) {
         soundId = userProfile?.classRingtone || soundId;
       } else if (id.startsWith('task_')) {
         soundId = userProfile?.taskRingtone || soundId;
       } else if (id.startsWith('motivation_')) {
         soundId = userProfile?.notificationSound || 'chime';
       }
       
       playNotificationSound(soundId, userProfile?.customRingtones);
     } catch (e) {
       console.warn('Could not play notification sound:', e);
     }

     if (registration) {
        registration.showNotification(title, options);
     } else {
        new Notification(title, options);
     }
     StorageService.setItem(`triggered_notifs`, [...triggered, id]);
  }
};

const plannerTimers = new Map<string, ReturnType<typeof setTimeout>>();

export const NotificationService = {
  scheduleLocalNotification: async (opts: { id: string; title: string; body: string; scheduledTime: Date }) => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const delay = opts.scheduledTime.getTime() - Date.now();
    if (delay <= 0) return;
    const registration = 'serviceWorker' in navigator ? await navigator.serviceWorker.ready : null;
    const data = { url: '/?view=planner' };
    if (registration && 'showTrigger' in Notification.prototype) {
      await triggerNotification(opts.id, opts.title, opts.body, registration, opts.scheduledTime, data);
      return;
    }
    // Tanpa Notification Triggers API, timer hanya hidup selama aplikasi terbuka.
    const previous = plannerTimers.get(opts.id);
    if (previous) clearTimeout(previous);
    plannerTimers.set(opts.id, setTimeout(() => {
      plannerTimers.delete(opts.id);
      void triggerNotification(opts.id, opts.title, opts.body, registration, undefined, data);
    }, delay));
  },

  requestPermission: async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('Browser ini tidak mendukung notifikasi.');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        if (messaging) {
          const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
          if (vapidKey) {
            try {
              const token = await getToken(messaging, { vapidKey });
              if (token) {
                console.log('FCM Push Token aktif');
              }
            } catch (e) {
              console.warn("FCM getToken gagal. Menggunakan Notifikasi Lokal PWA.", e);
            }
          } else {
            console.info("VITE_FIREBASE_VAPID_KEY tidak dikonfigurasi. Menggunakan Notifikasi Lokal PWA.");
          }
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  },

  isPushSupported: (): boolean => {
    return Boolean(import.meta.env.VITE_FIREBASE_VAPID_KEY && 'serviceWorker' in navigator && messaging);
  },

  sendTestMotivationNotification: async () => {
    if (Notification.permission !== 'granted') {
      const granted = await NotificationService.requestPermission();
      if (!granted) return false;
    }

    let registration: ServiceWorkerRegistration | null = null;
    if ('serviceWorker' in navigator) {
      registration = await navigator.serviceWorker.ready;
    }

    const quote = getSmartMotivationByTime();
    const prefixMap: Record<string, string> = {
      'SCIENCE': '🧠 Neuro-Insight',
      'AHLULBAYT': '🌙 Hikmah Spiritual',
      'BUSINESS': '💼 High Performance',
      'STOICISM': '⚓ Stoic Resilience',
      'PSYCHOLOGY': '❤️ Mindset & Grit',
      'TOUGH_LOVE': '🔥 Tamparan Disiplin'
    };

    const title = `${prefixMap[quote.type] || '💡 Inspirasi'}: ${quote.source}`;
    const body = `"${quote.text}"\n\n📌 Aksi: ${quote.actionStep}`;
    const testId = `motivation_test_${Date.now()}`;

    await triggerNotification(testId, title, body, registration, undefined, { url: '/?view=motivation' });
    return true;
  },

  startLocalReminders: async () => {
    if (Notification.permission !== 'granted') return;
    
    let registration: ServiceWorkerRegistration | null = null;
    if ('serviceWorker' in navigator) {
      registration = await navigator.serviceWorker.ready;
    }
    
    // Clear existing interval if any
    if ((window as any)._reminderInterval) {
      clearInterval((window as any)._reminderInterval);
    }

    const checkAndSchedule = () => {
       const now = new Date();
       const currentHour = now.getHours();
       const currentMinute = now.getMinutes();
       const dateStr = now.toDateString();
       const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
       const currentDay = days[now.getDay()];
       
       // Load fresh user data
       const userProfile = StorageService.getItem<any>('user_profile', {});
       const courses = StorageService.getItem<any[]>('courses', []);
       const tasks = StorageService.getItem<any[]>('tasks', []);
       const events = StorageService.getItem<any[]>('calendar_events', []);
       const habits = StorageService.getItem<any[]>('habits', []);
       const goals = StorageService.getItem<any[]>('user_goals', []);
       
       // ===================================================================
       // 0. CHECK NEURO-SPIRITUAL MOTIVATION SCHEDULE
       // ===================================================================
       const motivationEnabled = userProfile.motivationNotifEnabled !== false; // Default ON
       const motivationFrequency = userProfile.motivationFrequency || 'DAILY_4X';
       const preferredCategories = userProfile.motivationPreferredCategories || [];

       if (motivationEnabled) {
          let slotId = '';

          switch (motivationFrequency) {
            case 'DAILY_4X':
              // 06:30 (Morning Primer), 12:30 (Midday Focus), 17:00 (Evening Grit), 21:00 (Night Stoic/Reflection)
              if (currentHour === 6 && currentMinute >= 30) slotId = 'morn_630';
              else if (currentHour === 12 && currentMinute >= 30) slotId = 'mid_1230';
              else if (currentHour === 17 && currentMinute >= 0) slotId = 'eve_1700';
              else if (currentHour === 21 && currentMinute >= 0) slotId = 'night_2100';
              break;

            case 'DAILY_2X':
              // 07:00 & 20:30
              if (currentHour === 7 && currentMinute >= 0) slotId = 'morn_700';
              else if (currentHour === 20 && currentMinute >= 30) slotId = 'night_2030';
              break;

            case 'EVERY_2_HOURS':
              // Active working hours: 08:00 to 22:00, even hours
              if (currentHour >= 8 && currentHour <= 22 && currentHour % 2 === 0 && currentMinute < 15) {
                slotId = `interval_2h_${currentHour}`;
              }
              break;

            case 'EVERY_4_HOURS':
              // 08:00, 12:00, 16:00, 20:00
              if ([8, 12, 16, 20].includes(currentHour) && currentMinute < 15) {
                slotId = `interval_4h_${currentHour}`;
              }
              break;

            case 'MORNING_ONLY':
              if (currentHour === 6 && currentMinute >= 30) slotId = 'morn_only_630';
              break;
          }

          if (slotId) {
            const notifId = `motivation_${slotId}_${dateStr}`;
            const triggered = StorageService.getItem<string[]>('triggered_notifs', []);
            
            if (!triggered.includes(notifId)) {
              const quote = getSmartMotivationByTime(preferredCategories);
              const headerMap: Record<string, string> = {
                'SCIENCE': '🧠 Neurosains & Biohacking',
                'AHLULBAYT': '🌙 Hikmah Spiritual & Keikhlasan',
                'BUSINESS': '💼 Mindset High Performance',
                'STOICISM': '⚓ Stoikisme & Ketahanan',
                'PSYCHOLOGY': '❤️ Psikologi & Flow State',
                'TOUGH_LOVE': '🔥 Tamparan Disiplin'
              };

              const title = `${headerMap[quote.type] || '💡 Motivasi Harian'}: ${quote.source}`;
              const body = `"${quote.text}"\n\n📌 Langkah Aksi: ${quote.actionStep}`;

              triggerNotification(notifId, title, body, registration, undefined, { url: '/?view=motivation' });
            }
          }
       }
       
       // ===================================================================
       // 1. Check Courses
       // ===================================================================
       courses.forEach(course => {
          if (course.day === currentDay && course.startTime) {
             const [hours, minutes] = course.startTime.split(':').map(Number);
             const classTime = new Date(now);
             classTime.setHours(hours, minutes, 0, 0);
             const diffMinutes = Math.floor((classTime.getTime() - now.getTime()) / 60000);
             
             // Check if within 15 minutes before class
             if (diffMinutes <= 15 && diffMinutes >= 0) {
                const notifId = `course_${course.id}_${now.toDateString()}`;
                triggerNotification(notifId, `Kelas ${course.name} dimulai ${diffMinutes > 0 ? diffMinutes + ' menit lagi' : 'sekarang'}!`, `Persiapkan dirimu untuk kelas di ruang ${course.room}.`, registration);
             }
             
             // Schedule for future (offline Notification Triggers)
             if (registration && 'showTrigger' in Notification.prototype) {
                const futureTime = new Date(classTime);
                futureTime.setMinutes(futureTime.getMinutes() - 15);
                if (futureTime.getTime() > now.getTime()) {
                   const futureId = `course_future_${course.id}_${futureTime.toDateString()}`;
                   triggerNotification(futureId, `Kelas ${course.name} dimulai 15 menit lagi!`, `Persiapkan dirimu untuk kelas di ruang ${course.room}.`, registration, futureTime);
                }
             }
          }
       });

       // ===================================================================
       // 2. Check Tasks (Deadlines or Reminders)
       // ===================================================================
       tasks.forEach(task => {
          if (task.status !== 'DONE' && task.deadline) {
             const deadlineDate = new Date(task.deadline);
             
             if (task.reminder) {
                const reminderTime = new Date(task.reminder);
                const diffMinutes = Math.floor((reminderTime.getTime() - now.getTime()) / 60000);
                if (diffMinutes <= 0 && diffMinutes >= -30) {
                   const notifId = `task_remind_${task.id}_${now.toDateString()}`;
                   triggerNotification(notifId, `Pengingat Tugas: ${task.title}`, `Mata Kuliah: ${task.subject}. Jangan lupa dikerjakan!`, registration);
                }
                
                // Future trigger
                if (registration && 'showTrigger' in Notification.prototype && reminderTime.getTime() > now.getTime()) {
                   const futureId = `task_future_remind_${task.id}_${reminderTime.toDateString()}`;
                   triggerNotification(futureId, `Pengingat Tugas: ${task.title}`, `Mata Kuliah: ${task.subject}. Jangan lupa dikerjakan!`, registration, reminderTime);
                }
             } else {
                // Default reminder for deadline today
                if (deadlineDate.toDateString() === now.toDateString()) {
                   if (currentHour >= 8 && currentHour < 9) {
                      const notifId = `task_deadline_8_${task.id}_${now.toDateString()}`;
                      triggerNotification(notifId, `Deadline Hari Ini: ${task.title}`, `Tugas ${task.subject} belum selesai. Segera kerjakan!`, registration);
                   }
                   if (currentHour >= 19 && currentHour < 20) {
                      const notifId = `task_deadline_19_${task.id}_${now.toDateString()}`;
                      triggerNotification(notifId, `Deadline Hari Ini: ${task.title}`, `Malam ini tugas ${task.subject} harus selesai!`, registration);
                   }
                }
                
                // Remind 1 day before at 19:00 PM
                const oneDayBefore = new Date(deadlineDate);
                oneDayBefore.setDate(oneDayBefore.getDate() - 1);
                if (oneDayBefore.toDateString() === now.toDateString()) {
                   if (currentHour >= 19 && currentHour < 20) {
                      const notifId = `task_deadline_1d_${task.id}_${now.toDateString()}`;
                      triggerNotification(notifId, `Besok Deadline: ${task.title}`, `Tugas ${task.subject} besok deadline. Jangan ditunda!`, registration);
                   }
                }
             }
          }
       });

       // ===================================================================
       // 3. Check Calendar Events
       // ===================================================================
       events.forEach(ev => {
          if (ev.date && ev.time) {
             const [hours, minutes] = ev.time.split(':').map(Number);
             const eventTime = new Date(ev.date);
             eventTime.setHours(hours, minutes, 0, 0);
             
             const diffMinutes = Math.floor((eventTime.getTime() - now.getTime()) / 60000);
             
             if (diffMinutes <= 30 && diffMinutes >= 0) {
                const notifId = `event_${ev.id}_${now.toDateString()}`;
                triggerNotification(notifId, `Acara Segera Mulai: ${ev.title}`, ev.description || 'Jangan lupa hadir ya!', registration);
             }
             
             if (registration && 'showTrigger' in Notification.prototype) {
                const futureTime = new Date(eventTime);
                futureTime.setMinutes(futureTime.getMinutes() - 30);
                if (futureTime.getTime() > now.getTime()) {
                   const futureId = `event_future_${ev.id}_${futureTime.toDateString()}`;
                   triggerNotification(futureId, `Acara Segera Mulai: ${ev.title}`, ev.description || 'Jangan lupa hadir ya!', registration, futureTime);
                }
             }
          } else if (ev.date && !ev.time) {
             const eventDate = new Date(ev.date);
             if (eventDate.toDateString() === now.toDateString()) {
                if (currentHour >= 7 && currentHour < 8) {
                   const notifId = `event_allday_${ev.id}_${now.toDateString()}`;
                   triggerNotification(notifId, `Agenda Hari Ini: ${ev.title}`, ev.description || 'Semoga harimu menyenangkan!', registration);
                }
             }
          }
       });

       // ===================================================================
       // 4. Check Habits
       // ===================================================================
       habits.forEach(habit => {
          const todayStr = now.toISOString().split('T')[0];
          if (!habit.completedDates?.includes(todayStr)) {
             if (currentHour >= 20 && currentHour < 21) {
                const notifId = `habit_${habit.id}_${now.toDateString()}`;
                triggerNotification(notifId, `Habit Belum Selesai: ${habit.title}`, `Pertahankan streak kamu! Lakukan sekarang: ${habit.trigger || habit.title}`, registration);
             }
          }
       });

       // ===================================================================
       // 5. Check Goals
       // ===================================================================
       goals.forEach(goal => {
          if (!goal.completed && goal.deadline) {
             const deadlineDate = new Date(goal.deadline);
             const threeDaysBefore = new Date(deadlineDate);
             threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);
             if (threeDaysBefore.toDateString() === now.toDateString()) {
                if (currentHour >= 10 && currentHour < 11) {
                   const notifId = `goal_3d_${goal.id}_${now.toDateString()}`;
                   triggerNotification(notifId, `Target 3 Hari Lagi: ${goal.title}`, `Apakah progress kamu sudah mencapai target? Semangat!`, registration);
                }
             }
             
             if (deadlineDate.toDateString() === now.toDateString()) {
                if (currentHour >= 10 && currentHour < 11) {
                   const notifId = `goal_deadline_${goal.id}_${now.toDateString()}`;
                   triggerNotification(notifId, `Batas Waktu Target: ${goal.title}`, `Hari ini adalah batas waktu targetmu. Selesaikan segera!`, registration);
                }
             }
          }
       });
    };

    // Run once immediately
    checkAndSchedule();

    // Periodic check every minute
    (window as any)._reminderInterval = setInterval(checkAndSchedule, 60000);
  },

  setupForegroundListener: () => {
    if (messaging) {
      onMessage(messaging, (payload) => {
        console.log('Message received in foreground: ', payload);
        const notificationTitle = payload.notification?.title || 'Neuro-Spiritual KampusKit';
        const notificationOptions = {
          body: payload.notification?.body || 'Anda memiliki pesan inspirasi baru.',
          icon: '/icon-192.png'
        };
        new Notification(notificationTitle, notificationOptions);
      });
    }
  }
};
