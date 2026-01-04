// 听见历史 - 下载管理页面

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, spacing, typography, borderRadius, shadow } from '../theme';
import { useDownloadStore, useSettingsStore } from '../stores';
import type { RootStackParamList, DownloadTask } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function DownloadsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { tasks, removeDownload, pauseDownload, resumeDownload, cancelDownload, clearCompleted } = useDownloadStore();
  const maxStorageSize = useSettingsStore(s => s.maxStorageSize);
  const totalDownloadedSize = useDownloadStore(s => s.totalDownloadedSize);

  const taskList = useMemo(() => Array.from(tasks.values()), [tasks]);

  const downloadingTasks = useMemo(
    () => taskList.filter(t => t.status === 'downloading' || t.status === 'pending'),
    [taskList]
  );

  const completedTasks = useMemo(
    () => taskList.filter(t => t.status === 'completed'),
    [taskList]
  );

  const usedPercentage = (totalDownloadedSize / (maxStorageSize * 1024 * 1024)) * 100;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const handleTaskPress = (task: DownloadTask) => {
    if (task.status === 'completed') {
      navigation.navigate('Player', { podcastId: task.podcastId });
    }
  };

  const handleDelete = (task: DownloadTask) => {
    Alert.alert(
      '删除下载',
      `确定要删除「${task.podcast.eventTitle}」吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => removeDownload(task.podcastId),
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      '清除已完成',
      '确定要清除所有已完成的下载记录吗？音频文件将被删除。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清除',
          style: 'destructive',
          onPress: clearCompleted,
        },
      ]
    );
  };

  const renderDownloadingItem = ({ item }: { item: DownloadTask }) => (
    <View style={styles.taskItem}>
      <View style={styles.taskInfo}>
        <Text style={styles.taskTitle} numberOfLines={1}>
          {item.podcast.eventTitle}
        </Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{item.progress}%</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => {
          if (item.status === 'downloading') {
            pauseDownload(item.podcastId);
          } else if (item.status === 'paused') {
            resumeDownload(item.podcastId);
          } else {
            cancelDownload(item.podcastId);
          }
        }}
      >
        <Text style={styles.actionButtonText}>
          {item.status === 'downloading' ? '⏸' : item.status === 'paused' ? '▶' : '✕'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderCompletedItem = ({ item }: { item: DownloadTask }) => (
    <TouchableOpacity
      style={styles.taskItem}
      onPress={() => handleTaskPress(item)}
      onLongPress={() => handleDelete(item)}
      activeOpacity={0.7}
    >
      <View style={styles.taskInfo}>
        <Text style={styles.taskTitle} numberOfLines={1}>
          ✓ {item.podcast.eventTitle}
        </Text>
        <Text style={styles.taskMeta}>
          {item.podcast.eventYear}年 • {formatSize(item.fileSize || 0)}
        </Text>
      </View>
      <Text style={styles.playIcon}>▶</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 标题 */}
      <View style={styles.header}>
        <Text style={styles.title}>我的下载</Text>
      </View>

      {/* 存储空间 */}
      <View style={styles.storageSection}>
        <View style={styles.storageHeader}>
          <Text style={styles.storageTitle}>存储空间</Text>
          <Text style={styles.storageText}>
            {formatSize(totalDownloadedSize)} / {(maxStorageSize / 1024).toFixed(1)} GB
          </Text>
        </View>
        <View style={styles.storageBar}>
          <View
            style={[
              styles.storageBarFill,
              {
                width: `${Math.min(usedPercentage, 100)}%`,
                backgroundColor: usedPercentage > 90 ? colors.error : colors.primary,
              },
            ]}
          />
        </View>
      </View>

      {/* 下载中 */}
      {downloadingTasks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>下载中 ({downloadingTasks.length})</Text>
          <FlashList
            data={downloadingTasks}
            renderItem={renderDownloadingItem}
            estimatedItemSize={72}
            keyExtractor={item => item.podcastId}
          />
        </View>
      )}

      {/* 已下载 */}
      <View style={[styles.section, { flex: 1 }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>已下载 ({completedTasks.length})</Text>
          {completedTasks.length > 0 && (
            <TouchableOpacity onPress={handleClearAll}>
              <Text style={styles.clearButton}>清除</Text>
            </TouchableOpacity>
          )}
        </View>

        {completedTasks.length > 0 ? (
          <FlashList
            data={completedTasks}
            renderItem={renderCompletedItem}
            estimatedItemSize={72}
            keyExtractor={item => item.podcastId}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📥</Text>
            <Text style={styles.emptyText}>暂无下载内容</Text>
            <Text style={styles.emptySubtext}>
              在播放页面点击下载按钮{'\n'}即可离线收听
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
  },
  storageSection: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    ...shadow.sm,
  },
  storageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  storageTitle: {
    ...typography.label,
    color: colors.text.primary,
  },
  storageText: {
    ...typography.bodySmall,
    color: colors.gray[500],
  },
  storageBar: {
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  storageBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  clearButton: {
    ...typography.bodySmall,
    color: colors.primary,
  },
  listContent: {
    paddingBottom: 100,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '500',
  },
  taskMeta: {
    ...typography.caption,
    color: colors.gray[500],
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.gray[200],
    borderRadius: 2,
    marginRight: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressText: {
    ...typography.caption,
    color: colors.gray[500],
    width: 36,
    textAlign: 'right',
  },
  actionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 18,
  },
  playIcon: {
    fontSize: 16,
    color: colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyText: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.gray[500],
    textAlign: 'center',
  },
});
