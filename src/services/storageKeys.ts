/**
 * Centralized Storage Keys Registry for KampusKit
 * 
 * Segregates keys into:
 * 1. DATA_KEYS: User operational data that is synchronized to Firebase Cloud and exported in backups.
 * 2. DEVICE_PREF_KEYS: Local user preferences (language, sound, theme) preserved across account switches.
 * 3. DEVICE_EPHEMERAL_KEYS: Device hardware states, caches, GPS tracking, and offline queues (never synced).
 */

export const STORAGE_KEYS = {
  // --- Operational User Data (Synced & Backed Up) ---
  TASKS: 'tasks',
  COURSES: 'courses',
  NOTES: 'notes',
  LIBRARY_BOOKS: 'library_books',
  LEARNING_MATERIALS: 'learning_materials',
  GRADE_DATA_V2: 'grade_data_v2',
  GRADE_DATA_LEGACY: 'grade_data',
  USER_PROFILE: 'user_profile',
  FLASHCARDS: 'flashcards',
  HABITS: 'habits',
  TRANSACTIONS: 'transactions',
  JOURNAL_ENTRIES: 'journal_entries',
  MEAL_PLANS: 'meal_plans',
  LIKED_QUOTES: 'liked_quotes',
  NOTE_FOLDERS: 'note_folders',
  CALENDAR_EVENTS: 'calendar_events',
  LIFE_COMPASS_PINS: 'life_compass_pins',
  CAMPUS_EVENTS: 'campus_events',
  TEAMMATES: 'teammates',
  STUDENT_SKILLS_V4: 'student_skills_v4',
  USER_GOALS: 'user_goals',
  SPORTS_ROUTINE: 'sports_routine',
  GYM_WORKOUT_HISTORY: 'gym_workout_history',
  ATTENDANCE_V2: 'attendance_v2',
  SAVED_CITATIONS: 'saved_citations',
  SAVED_LEARNING_PATHS: 'saved_learning_paths',
  LEARNING_PATH_ACTIONS: 'learning_path_actions',
  FREELANCE_INVOICES: 'freelance_invoices',
  CUSTOM_CURRICULUMS: 'custom_curriculums',
  INTERVIEW_PREP: 'interview_prep',
  CV_CHECKLIST: 'cv_checklist',
  AI_CHAT_HISTORY: 'ai_chat_history',
  CODING_ROADMAP: 'coding_roadmap',
  MY_PROJECTS: 'my_projects',
  SCHULTE_BEST: 'schulte_best',
  STROOP_BEST: 'stroop_best',
  MATHRUSH_BEST: 'mathrush_best',
  VISUALSEARCH_BEST: 'visualsearch_best',

  // --- Interconnected Academic Core (Poros Mata Kuliah, Planner, Ujian, Nilai) ---
  FOCUS_SESSIONS: 'focus_sessions',
  STUDY_PLAN_BLOCKS: 'study_plan_blocks',
  PLANNER_SETTINGS: 'planner_settings',
  EXAMS: 'exams',
  COURSE_GRADE_PLANS: 'course_grade_plans',
  SCHEMA_COURSE_LINKS_V1: 'schema_course_links_v1',
  PRE_COURSE_LINK_SNAPSHOT: 'pre_course_link_snapshot',

  // --- Device Preferences (Kept across logouts) ---
  APP_LANGUAGE: 'app_language',
  PREFERRED_CURRENCY: 'preferred_currency',
  ACADEMIC_GRADING_SCALE: 'academic_grading_scale',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
  NOTIFICATION_SOUND: 'notificationSound',
  APP_SOUND_MUTED: 'app_sound_muted',
  KAMPUSKIT_THEME: 'kampuskit_theme',
  KAMPUSKIT_FONT: 'kampuskit_font',
  TIME_FORMAT: 'time_format',
  FIRST_DAY_OF_WEEK: 'first_day_of_week',

  // --- Ephemeral Device / Hardware / GPS Caches ---
  OWNER_UID: 'owner_uid',
  GEMINI_CUSTOM_API_KEY: 'gemini_custom_api_key',
  FOCUS_TASK_ID: 'focus_task_id',
  LIBRARY_FILE_ACCESS: 'library_file_access',
  GEOFENCE_ZONES_CACHE: 'geofence_zones_cache',
  KAMPUSKIT_BACKGROUND_KEEPALIVE: 'kampuskit_background_keepalive',
  KAMPUSKIT_GPS_ACTIVE: 'kampuskit_gps_active',
  KAMPUSKIT_GPS_POWERMODE: 'kampuskit_gps_powermode',
  KAMPUSKIT_GPS_ROOM_ID: 'kampuskit_gps_room_id',
  KAMPUSKIT_GPS_STATUS_NOTE: 'kampuskit_gps_status_note',
  LOC_PRIMARY_CACHE: 'loc_primary_cache',
  LOC_SECONDARY_CACHE: 'loc_secondary_cache',
  PARTNER_CHAT_CACHE: 'partner_chat_cache',
  PARTNER_PRIMARY_NAME: 'partner_primary_name',
  PARTNER_SECONDARY_NAME: 'partner_secondary_name',
  PARTNER_TRACKER_ROLE: 'partner_tracker_role',

  // --- Sync Internal Metadatas ---
  META_UPDATED_AT: '__meta_updatedAt',
  OFFLINE_SYNC_QUEUE: '__offline_sync_queue',
  LAST_SYNC_TIMESTAMP: '__last_sync_timestamp'
} as const;

/**
 * Array of keys that store core user application data.
 * These are synchronized with Firestore and included in user backup exports.
 */
export const USER_DATA_KEYS: readonly string[] = [
  STORAGE_KEYS.TASKS,
  STORAGE_KEYS.COURSES,
  STORAGE_KEYS.NOTES,
  STORAGE_KEYS.LIBRARY_BOOKS,
  STORAGE_KEYS.LEARNING_MATERIALS,
  STORAGE_KEYS.GRADE_DATA_V2,
  STORAGE_KEYS.GRADE_DATA_LEGACY,
  STORAGE_KEYS.USER_PROFILE,
  STORAGE_KEYS.FLASHCARDS,
  STORAGE_KEYS.HABITS,
  STORAGE_KEYS.TRANSACTIONS,
  STORAGE_KEYS.JOURNAL_ENTRIES,
  STORAGE_KEYS.MEAL_PLANS,
  STORAGE_KEYS.LIKED_QUOTES,
  STORAGE_KEYS.NOTE_FOLDERS,
  STORAGE_KEYS.CALENDAR_EVENTS,
  STORAGE_KEYS.LIFE_COMPASS_PINS,
  STORAGE_KEYS.CAMPUS_EVENTS,
  STORAGE_KEYS.TEAMMATES,
  STORAGE_KEYS.STUDENT_SKILLS_V4,
  STORAGE_KEYS.USER_GOALS,
  STORAGE_KEYS.SPORTS_ROUTINE,
  STORAGE_KEYS.GYM_WORKOUT_HISTORY,
  STORAGE_KEYS.ATTENDANCE_V2,
  STORAGE_KEYS.SAVED_CITATIONS,
  STORAGE_KEYS.SAVED_LEARNING_PATHS,
  STORAGE_KEYS.LEARNING_PATH_ACTIONS,
  STORAGE_KEYS.FREELANCE_INVOICES,
  STORAGE_KEYS.CUSTOM_CURRICULUMS,
  STORAGE_KEYS.INTERVIEW_PREP,
  STORAGE_KEYS.CV_CHECKLIST,
  STORAGE_KEYS.AI_CHAT_HISTORY,
  STORAGE_KEYS.CODING_ROADMAP,
  STORAGE_KEYS.MY_PROJECTS,
  STORAGE_KEYS.SCHULTE_BEST,
  STORAGE_KEYS.STROOP_BEST,
  STORAGE_KEYS.MATHRUSH_BEST,
  STORAGE_KEYS.VISUALSEARCH_BEST,
  STORAGE_KEYS.FOCUS_SESSIONS,
  STORAGE_KEYS.STUDY_PLAN_BLOCKS,
  STORAGE_KEYS.PLANNER_SETTINGS,
  STORAGE_KEYS.EXAMS,
  STORAGE_KEYS.COURSE_GRADE_PLANS,
];

/**
 * Device-level preferences that survive account logout.
 */
export const DEVICE_PREFERENCE_KEYS_SET: ReadonlySet<string> = new Set([
  STORAGE_KEYS.APP_LANGUAGE,
  STORAGE_KEYS.PREFERRED_CURRENCY,
  STORAGE_KEYS.ACADEMIC_GRADING_SCALE,
  STORAGE_KEYS.SIDEBAR_COLLAPSED,
  STORAGE_KEYS.NOTIFICATION_SOUND,
  STORAGE_KEYS.APP_SOUND_MUTED,
  STORAGE_KEYS.KAMPUSKIT_THEME,
  STORAGE_KEYS.KAMPUSKIT_FONT,
  STORAGE_KEYS.TIME_FORMAT,
  STORAGE_KEYS.FIRST_DAY_OF_WEEK,
]);

/**
 * Ephemeral keys that must NEVER be synced to the cloud or exported in data backups.
 */
export const EPHEMERAL_DEVICE_KEYS_SET: ReadonlySet<string> = new Set([
  STORAGE_KEYS.OWNER_UID,
  STORAGE_KEYS.GEMINI_CUSTOM_API_KEY,
  STORAGE_KEYS.FOCUS_TASK_ID,
  STORAGE_KEYS.LIBRARY_FILE_ACCESS,
  STORAGE_KEYS.GEOFENCE_ZONES_CACHE,
  STORAGE_KEYS.KAMPUSKIT_BACKGROUND_KEEPALIVE,
  STORAGE_KEYS.KAMPUSKIT_GPS_ACTIVE,
  STORAGE_KEYS.KAMPUSKIT_GPS_POWERMODE,
  STORAGE_KEYS.KAMPUSKIT_GPS_ROOM_ID,
  STORAGE_KEYS.KAMPUSKIT_GPS_STATUS_NOTE,
  STORAGE_KEYS.LOC_PRIMARY_CACHE,
  STORAGE_KEYS.LOC_SECONDARY_CACHE,
  STORAGE_KEYS.PARTNER_CHAT_CACHE,
  STORAGE_KEYS.PARTNER_PRIMARY_NAME,
  STORAGE_KEYS.PARTNER_SECONDARY_NAME,
  STORAGE_KEYS.PARTNER_TRACKER_ROLE,
  STORAGE_KEYS.META_UPDATED_AT,
  STORAGE_KEYS.OFFLINE_SYNC_QUEUE,
  STORAGE_KEYS.LAST_SYNC_TIMESTAMP,
  STORAGE_KEYS.SCHEMA_COURSE_LINKS_V1,
  STORAGE_KEYS.PRE_COURSE_LINK_SNAPSHOT
]);
