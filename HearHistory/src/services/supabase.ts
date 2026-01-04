// 听见历史 - Supabase 客户端

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Supabase 配置 (与 history_river 共享同一后端)
const SUPABASE_URL = 'https://zhvczrrcwpxgrifshhmh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpodmN6cnJjd3B4Z3JpZnNoaG1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MDg5NzUsImV4cCI6MjA3OTI4NDk3NX0.aSa9aWHsNxghJhGj91l1bU_vwAMPp9ZIDTQnm-OG-go';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// 数据库表名常量
export const TABLES = {
  DYNASTIES: 'dynasties',
  HISTORICAL_EVENTS: 'historical_events',
  RIVER_PINS: 'river_pins',
  EVENT_CACHE: 'timeline_event_cache',
} as const;

// 检查连接状态
export const checkConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from(TABLES.DYNASTIES).select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
};
