// Expo Router 入口 - 使用 Tab 布局

import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';

const colors = {
  primary: '#DC143C',
  gray400: '#A3A3A3',
  white: '#FFFFFF',
  gray200: '#E5E5E5',
};

// Tab 图标
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    index: '🏠',
    timeline: '📜',
    downloads: '⬇️',
    settings: '⚙️',
  };

  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.6 }}>
      {icons[name] || '📌'}
    </Text>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray400,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.gray200,
          paddingTop: 4,
          paddingBottom: 20,
          height: 80,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: '首页',
          tabBarIcon: ({ focused }) => <TabIcon name="index" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          tabBarLabel: '时间线',
          tabBarIcon: ({ focused }) => <TabIcon name="timeline" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="downloads"
        options={{
          tabBarLabel: '下载',
          tabBarIcon: ({ focused }) => <TabIcon name="downloads" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarLabel: '设置',
          tabBarIcon: ({ focused }) => <TabIcon name="settings" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
