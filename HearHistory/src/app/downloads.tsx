// 下载页面

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const colors = {
  primary: '#DC143C',
  background: '#FAFAFA',
  gray: { 500: '#737373' },
  text: { primary: '#171717' },
};

export default function DownloadsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>我的下载</Text>
      </View>

      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📥</Text>
        <Text style={styles.emptyText}>暂无下载内容</Text>
        <Text style={styles.emptySubtext}>
          在播放页面点击下载按钮{'\n'}即可离线收听
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 24, paddingVertical: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.text.primary },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyIcon: { fontSize: 64, marginBottom: 20 },
  emptyText: { fontSize: 20, fontWeight: '600', color: colors.text.primary, marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: colors.gray[500], textAlign: 'center' },
});
