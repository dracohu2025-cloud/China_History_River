// 设置页面

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const colors = {
  primary: '#DC143C',
  white: '#FFFFFF',
  background: '#FAFAFA',
  gray: { 100: '#F5F5F5', 300: '#D4D4D4', 500: '#737373' },
  text: { primary: '#171717' },
};

export default function SettingsScreen() {
  const [showTranscript, setShowTranscript] = React.useState(true);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>设置</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>外观</Text>
          <View style={styles.sectionContent}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>语言</Text>
              <Text style={styles.settingValue}>中文</Text>
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>主题</Text>
              <Text style={styles.settingValue}>跟随系统</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>播放</Text>
          <View style={styles.sectionContent}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>默认播放速度</Text>
              <Text style={styles.settingValue}>1x</Text>
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>显示文稿</Text>
              <Switch
                value={showTranscript}
                onValueChange={setShowTranscript}
                trackColor={{ false: colors.gray[300], true: colors.primary }}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>关于</Text>
          <View style={styles.sectionContent}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>版本</Text>
              <Text style={styles.settingValue}>1.0.0</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>听见历史 • History FM</Text>
          <Text style={styles.footerSubtext}>穿越五千年华夏文明</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 100 },
  header: { paddingHorizontal: 24, paddingVertical: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.text.primary },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, color: colors.gray[500], paddingHorizontal: 24, marginBottom: 8, textTransform: 'uppercase' },
  sectionContent: { backgroundColor: colors.white, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.gray[100] },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  settingLabel: { fontSize: 14, color: colors.text.primary },
  settingValue: { fontSize: 14, color: colors.gray[500] },
  footer: { alignItems: 'center', paddingVertical: 32 },
  footerText: { fontSize: 14, color: colors.gray[500] },
  footerSubtext: { fontSize: 10, color: colors.gray[300], marginTop: 4 },
});
