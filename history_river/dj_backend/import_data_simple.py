#!/usr/bin/env python3
"""
导入历史数据到 Django 模型
手动解析 TypeScript 数据
"""

import os
import sys
import re

# 设置 Django 环境
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "dj_backend.settings")

import django
django.setup()

from timeline.models import Dynasty, HistoricalEvent


def parse_dynasty_line(line):
    """解析朝代数据行"""
    # 匹配格式: { id: 'xia', name: 'Xia', chineseName: '夏', startYear: -2070, endYear: -1600, color: '#57534e', description: '...' }
    pattern = r"\{\s*id:\s*['"]([^'"]+)["'][^}]+name:\s*['"]([^'"]+)["'][^}]+chineseName:\s*['"]([^'"]+)["'][^}]+startYear:\s*(-?\d+)[^}]+endYear:\s*(-?\d+)[^}]+color:\s*['"](#[0-9a-fA-F]{6})["'][^}]+description:\s*['"]([^'"]+)["']\s*\}"
    match = re.search(pattern, line)
    if match:
        return {
            'id': match.group(1),
            'name': match.group(2),
            'chineseName': match.group(3),
            'startYear': int(match.group(4)),
            'endYear': int(match.group(5)),
            'color': match.group(6),
            'description': match.group(7)
        }
    return None


def parse_event_line(line):
    """解析历史事件行"""
    # 匹配格式: { year: -2070, title: '夏朝建立', type: 'politics', importance: 1 }
    pattern = r"\{\s*year:\s*(-?\d+)[^}]+title:\s*['"]([^'"]+)["'][^}]+type:\s*['"]([^'"]+)["'][^}]+importance:\s*(\d+)\s*\}"
    match = re.search(pattern, line)
    if match:
        return {
            'year': int(match.group(1)),
            'title': match.group(2),
            'type': match.group(3),
            'importance': int(match.group(4))
        }
    
    # 处理逗号在行尾的情况
    pattern2 = r"\{\s*year:\s*(-?\d+)[^}]+title:\s*['"]([^'"]+)["'][^}]+type:\s*['"]([^'"]+)["'][^}]+importance:\s*(\d+)[^}]+\}"
    match2 = re.search(pattern2, line)
    if match2:
        return {
            'year': int(match2.group(1)),
            'title': match2.group(2),
            'type': match2.group(3),
            'importance': int(match2.group(4))
        }
    return None


def extract_dynasties(content):
    """提取朝代数组"""
    # 查找 DYNASTIES 数组
    start = content.find('export const DYNASTIES: Dynasty[] = [')
    if start == -1:
        return []
    
    start = content.find('[', start)
    end = content.find('];', start)
    
    if start == -1 or end == -1:
        return []
    
    array_content = content[start+1:end]
    
    # 按行分割并解析
    dynasties = []
    lines = array_content.split('\n')
    
    for line in lines:
        line = line.strip()
        if line.startswith('{') and 'id:' in line:
            dynasty = parse_dynasty_line(line)
            if dynasty:
                dynasties.append(dynasty)
    
    return dynasties


def extract_events(content):
    """提取历史事件数组"""
    # 查找 KEY_EVENTS 数组
    start = content.find('export const KEY_EVENTS: HistoricalEvent[] = [')
    if start == -1:
        return []
    
    start = content.find('[', start)
    end = content.find('];', start)
    
    if start == -1 or end == -1:
        return []
    
    array_content = content[start+1:end]
    
    # 按行分割并解析
    events = []
    lines = array_content.split('\n')
    
    for line in lines:
        line = line.strip()
        if line.startswith('{') and 'year:' in line:
            event = parse_event_line(line)
            if event:
                events.append(event)
    
    return events


def import_dynasties(dynasties):
    """导入朝代数据"""
    print(f"📊 找到 {len(dynasties)} 个朝代，开始导入...")
    
    imported_count = 0
    for dynasty in dynasties:
        try:
            # 检查是否已存在
            if Dynasty.objects.filter(id=dynasty['id']).exists():
                print(f"⚠️  朝代 {dynasty['chineseName']} 已存在，跳过")
                continue
            
            # 创建朝代对象
            Dynasty.objects.create(
                id=dynasty['id'],
                name=dynasty['name'],
                chinese_name=dynasty['chineseName'],
                start_year=dynasty['startYear'],
                end_year=dynasty['endYear'],
                color=dynasty['color'],
                description=dynasty['description']
            )
            
            imported_count += 1
            print(f"✅ 导入朝代: {dynasty['chineseName']} ({dynasty['name']})")
            
        except Exception as e:
            print(f"❌ 导入朝代 {dynasty['id']} 失败: {e}")
            continue
    
    print(f"\n🎉 朝代导入完成！成功导入 {imported_count} 个朝代")
    return imported_count


def import_events(events):
    """导入历史事件数据"""
    print(f"\n📊 找到 {len(events)} 个历史事件，开始导入...")
    
    imported_count = 0
    for event in events:
        try:
            # 检查是否已存在
            if HistoricalEvent.objects.filter(
                year=event['year'],
                title=event['title']
            ).exists():
                print(f"⚠️  事件 {event['title']} ({event['year']}) 已存在，跳过")
                continue
            
            # 查找对应的朝代
            dynasty = None
            matching_dynasties = Dynasty.objects.filter(
                start_year__lte=event['year'],
                end_year__gte=event['year']
            ).order_by('-start_year')
            
            if matching_dynasties.exists():
                dynasty = matching_dynasties.first()
            
            # 创建历史事件对象
            HistoricalEvent.objects.create(
                year=event['year'],
                title=event['title'],
                event_type=event['type'],
                importance=event['importance'],
                dynasty=dynasty,
                description=f"{event['title']}（{dict(HistoricalEvent.EVENT_TYPES)[event['type']]}）"
            )
            
            imported_count += 1
            dynasty_info = f" - {dynasty.chinese_name}" if dynasty else ""
            print(f"✅ 导入事件: {event['title']} ({event['year']}年){dynasty_info}")
            
        except Exception as e:
            print(f"❌ 导入事件 {event['title']} 失败: {e}")
            continue
    
    print(f"\n🎉 历史事件导入完成！成功导入 {imported_count} 个事件")
    return imported_count


def main():
    """主函数"""
    # 数据文件路径
    data_file = '/root/history_river_2025/history_river_November_2025/history_river/data/historyData.ts'
    
    if not os.path.exists(data_file):
        print(f"❌ 数据文件不存在: {data_file}")
        sys.exit(1)
    
    print("🚀 开始导入历史数据到 Django...")
    print("=" * 60)
    
    # 读取文件内容
    with open(data_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 提取朝代数据
    dynasties = extract_dynasties(content)
    
    # 提取历史事件数据
    events = extract_events(content)
    
    try:
        # 导入朝代
        dynasty_count = import_dynasties(dynasties)
        
        # 导入历史事件
        event_count = import_events(events)
        
        print("\n" + "=" * 60)
        print(f"✨ 数据导入完成总结:")
        print(f"   - 朝代: {dynasty_count} 个")
        print(f"   - 历史事件: {event_count} 个")
        print(f"   - 总计: {dynasty_count + event_count} 条记录")
        
        # 显示一些统计信息
        print(f"\n📊 数据库当前统计:")
        print(f"   - 朝代总数: {Dynasty.objects.count()} 个")
        print(f"   - 事件总数: {HistoricalEvent.objects.count()} 个")
        
    except Exception as e:
        print(f"\n❌ 导入过程中发生错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
