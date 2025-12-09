"""
Django管理命令：导入历史数据
使用方法：python manage.py import_history_data
"""

import os
import json
import sys
from pathlib import Path
from django.core.management.base import BaseCommand
from django.db import transaction
from django.core.exceptions import ValidationError

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent.parent.parent.parent.parent
sys.path.insert(0, str(project_root))

from timeline.models import Dynasty, HistoricalEvent


class Command(BaseCommand):
    help = '从historyData.ts导入朝代和历史事件数据'

    def handle(self, *args, **options):
        self.stdout.write('开始导入历史数据...')
        
        # 读取historyData.ts文件
        history_data_path = Path('/Users/dracohu/REPO/history_river_November_2025/history_river/data/historyData.ts')
        
        if not history_data_path.exists():
            self.stdout.write(
                self.style.ERROR(f'找不到文件: {history_data_path}')
            )
            return
        
        try:
            # 解析数据
            dynasties_data, events_data = self.parse_history_data(history_data_path)
            
            # 导入朝代数据
            dynasty_count = self.import_dynasties(dynasties_data)
            self.stdout.write(
                self.style.SUCCESS(f'成功导入 {dynasty_count} 个朝代')
            )
            
            # 导入历史事件数据
            event_count = self.import_events(events_data)
            self.stdout.write(
                self.style.SUCCESS(f'成功导入 {event_count} 个历史事件')
            )
            
            # 验证数据
            self.validate_import()
            
            self.stdout.write(
                self.style.SUCCESS('历史数据导入完成！')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'导入失败: {str(e)}')
            )
            raise

    def parse_history_data(self, file_path):
        """解析historyData.ts文件"""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 提取DYNASTIES数据
        dynasties_start = content.find('export const DYNASTIES: Dynasty[] = [')
        dynasties_end = content.find('];', dynasties_start) + 2
        
        if dynasties_start == -1 or dynasties_end == -1:
            raise ValueError('无法找到DYNASTIES数据')
        
        dynasties_section = content[dynasties_start:dynasties_end]
        
        # 提取KEY_EVENTS数据
        events_start = content.find('export const KEY_EVENTS: HistoricalEvent[] = [')
        events_end = content.find('];', events_start) + 2
        
        if events_start == -1 or events_end == -1:
            raise ValueError('无法找到KEY_EVENTS数据')
        
        events_section = content[events_start:events_end]
        
        # 解析数据
        dynasties_data = self.parse_dynasties(dynasties_section)
        events_data = self.parse_events(events_section)
        
        return dynasties_data, events_data

    def parse_dynasties(self, dynasties_section):
        """解析朝代数据"""
        dynasties = []
        
        # 使用正则表达式提取每个朝代对象
        import re
        
        # 匹配朝代对象的模式
        pattern = r'\{[^}]+\}'
        matches = re.findall(pattern, dynasties_section)
        
        for match in matches:
            dynasty = {}
            
            # 提取字段
            id_match = re.search(r"id:\s*'([^']+)'", match)
            name_match = re.search(r"name:\s*'([^']+)'", match)
            chinese_name_match = re.search(r"chineseName:\s*'([^']+)'", match)
            start_year_match = re.search(r"startYear:\s*(-?\d+)", match)
            end_year_match = re.search(r"endYear:\s*(-?\d+)", match)
            color_match = re.search(r"color:\s*'([^']+)'", match)
            desc_match = re.search(r"description:\s*'([^']+)'", match)
            
            if all([id_match, name_match, chinese_name_match, start_year_match, end_year_match, color_match]):
                dynasty['id'] = id_match.group(1)
                dynasty['name'] = name_match.group(1)
                dynasty['chinese_name'] = chinese_name_match.group(1)
                dynasty['start_year'] = int(start_year_match.group(1))
                dynasty['end_year'] = int(end_year_match.group(1))
                dynasty['color'] = color_match.group(1)
                dynasty['description'] = desc_match.group(1) if desc_match else ''
                
                dynasties.append(dynasty)
        
        return dynasties

    def parse_events(self, events_section):
        """解析历史事件数据"""
        events = []
        
        import re
        
        # 匹配事件对象的模式
        pattern = r'\{[^}]+\}'
        matches = re.findall(pattern, events_section)
        
        for match in matches:
            event = {}
            
            # 提取字段
            year_match = re.search(r"year:\s*(-?\d+)", match)
            title_match = re.search(r"title:\s*'([^']+)'", match)
            type_match = re.search(r"type:\s*'([^']+)'", match)
            importance_match = re.search(r"importance:\s*(\d+)", match)
            
            if all([year_match, title_match, type_match, importance_match]):
                event['year'] = int(year_match.group(1))
                event['title'] = title_match.group(1)
                event['event_type'] = type_match.group(1)
                event['importance'] = int(importance_match.group(1))
                
                events.append(event)
        
        return events

    def import_dynasties(self, dynasties_data):
        """导入朝代数据"""
        count = 0
        dynasty_map = {}
        
        with transaction.atomic():
            for dynasty_data in dynasties_data:
                dynasty, created = Dynasty.objects.update_or_create(
                    id=dynasty_data['id'],
                    defaults={
                        'name': dynasty_data['name'],
                        'chinese_name': dynasty_data['chinese_name'],
                        'start_year': dynasty_data['start_year'],
                        'end_year': dynasty_data['end_year'],
                        'color': dynasty_data['color'],
                        'description': dynasty_data['description'],
                    }
                )
                
                dynasty_map[dynasty_data['id']] = dynasty
                
                if created:
                    count += 1
        
        return count

    def import_events(self, events_data):
        """导入历史事件数据"""
        count = 0
        
        # 首先导入所有朝代，以便关联
        dynasties = {d.id: d for d in Dynasty.objects.all()}
        
        with transaction.atomic():
            for event_data in events_data:
                # 确定所属朝代
                dynasty = None
                for dynasty_id, dynasty_obj in dynasties.items():
                    if dynasty_obj.contains_year(event_data['year']):
                        dynasty = dynasty_obj
                        break
                
                event, created = HistoricalEvent.objects.update_or_create(
                    year=event_data['year'],
                    title=event_data['title'],
                    event_type=event_data['event_type'],
                    importance=event_data['importance'],
                    defaults={
                        'dynasty': dynasty,
                        'description': '',  # 暂时为空，后续可以在Admin中添加
                    }
                )
                
                if created:
                    count += 1
        
        return count

    def validate_import(self):
        """验证导入的数据"""
        dynasty_count = Dynasty.objects.count()
        event_count = HistoricalEvent.objects.count()
        
        self.stdout.write(f'数据库中现有 {dynasty_count} 个朝代')
        self.stdout.write(f'数据库中现有 {event_count} 个历史事件')
        
        # 按类型统计事件
        type_stats = {}
        for event in HistoricalEvent.objects.all():
            event_type = event.get_event_type_display_name()
            type_stats[event_type] = type_stats.get(event_type, 0) + 1
        
        self.stdout.write('事件类型统计:')
        for event_type, count in type_stats.items():
            self.stdout.write(f'  {event_type}: {count} 个')
        
        # 按重要性统计事件
        importance_stats = {}
        for event in HistoricalEvent.objects.all():
            importance = event.get_importance_display_name()
            importance_stats[importance] = importance_stats.get(importance, 0) + 1
        
        self.stdout.write('重要性等级统计:')
        for importance, count in importance_stats.items():
            self.stdout.write(f'  {importance}: {count} 个')
        
        # 检查是否有关联朝代的事件
        events_with_dynasty = HistoricalEvent.objects.filter(dynasty__isnull=False).count()
        self.stdout.write(f'已关联朝代的事件: {events_with_dynasty} 个')
        
        return True