#!/usr/bin/env python3
"""
导入历史数据到 Django 模型
从 ../../data/historyData.ts 提取朝代和历史事件数据
"""

import os
import sys
import re
import json

# 设置 Django 环境
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "dj_backend.settings")

import django
django.setup()

from timeline.models import Dynasty, HistoricalEvent


def extract_typescript_array(content, array_name):
    """从 TypeScript 内容中提取指定的数组"""
    pattern = rf"export const {array_name}\s*=\s*\[([\s\S]*?)\];"
    match = re.search(pattern, content)
    if not match:
        return []
    
    array_content = match.group(1)
    
    # 将 TypeScript 对象转换为 JSON 可解析格式
    # 1. 移除注释
    array_content = re.sub(r"//.*$", "", array_content, flags=re.MULTILINE)
    array_content = re.sub(r"/\*[\s\S]*?\*/", "", array_content)
    
    # 2. 添加引号到对象键名
    array_content = re.sub(r"(\w+):", r'"\1":', array_content)
    
    # 3. 处理颜色代码（没有引号的十六进制颜色）
    array_content = re.sub(r":\s*#([0-9a-fA-F]{6})", r': "#\1"', array_content)
    
    # 4. 移除尾部逗号
    array_content = re.sub(r",\s*\n\s*\]", "\n]", array_content)
    
    try:
        # 尝试解析为 JSON
        array_content = "[" + array_content + "]"
        result = json.loads(array_content)
        return result
    except json.JSONDecodeError as e:
        print(f"解析 {array_name} 时出错: {e}")
        return []


def import_dynasties(data_file_path):
    """导入朝代数据"""
    print("📖 读取朝代数据...")
    
    with open(data_file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    dynasties_data = extract_typescript_array(content, 'DYNASTIES')
    
    if not dynasties_data:
        print("❌ 无法提取朝代数据")
        return 0
    
    print(f"📊 找到 {len(dynasties_data)} 个朝代，开始导入...")
    
    imported_count = 0
    for dynasty in dynasties_data:
        try:
            # 检查是否已存在
            if Dynasty.objects.filter(id=dynasty['id']).exists():
                print(f"⚠️  朝代 {dynasty.get('chineseName', dynasty['id'])} 已存在，跳过")
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
            print(f"✅ 导入朝代: {dynasty.get('chineseName', dynasty['name'])}")
            
        except Exception as e:
            print(f"❌ 导入朝代 {dynasty.get('id', 'unknown')} 失败: {e}")
            continue
    
    print(f"\n🎉 朝代导入完成！成功导入 {imported_count} 个朝代")
    return imported_count


def import_events(data_file_path):
    """导入历史事件数据"""
    print("\n📖 读取历史事件数据...")
    
    with open(data_file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    events_data = extract_typescript_array(content, 'KEY_EVENTS')
    
    if not events_data:
        print("❌ 无法提取历史事件数据")
        return 0
    
    print(f"📊 找到 {len(events_data)} 个历史事件，开始导入...")
    
    imported_count = 0
    for event in events_data:
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
            print(f"❌ 导入事件 {event.get('title', 'unknown')} 失败: {e}")
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
    
    # 导入朝代
    dynasty_count = import_dynasties(data_file)
    
    # 导入历史事件
    event_count = import_events(data_file)
    
    print("\n" + "=" * 60)
    print(f"✨ 数据导入完成总结:")
    print(f"   - 朝代: {dynasty_count} 个")
    print(f"   - 历史事件: {event_count} 个")
    print(f"   - 总计: {dynasty_count + event_count} 条记录")
    
    # 显示一些统计信息
    print(f"\n📊 数据库当前统计:")
    print(f"   - 朝代总数: {Dynasty.objects.count()} 个")
    print(f"   - 事件总数: {HistoricalEvent.objects.count()} 个")


if __name__ == '__main__':
    main()
