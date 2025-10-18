// ============================================
// NOTED - Database Service Selector
// Uses SQLite for native, localStorage for web
// ============================================

import { Platform } from 'react-native';
import { db as sqliteDb } from './database';
import { webDb } from './webDatabase';

// Export the appropriate database based on platform
export const db = Platform.OS === 'web' ? webDb : sqliteDb;
