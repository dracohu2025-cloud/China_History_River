#!/usr/bin/env python
"""
Migrate event cache from JSON file to Django/PostgreSQL

Usage:
    python manage.py migrate_event_cache
    
This command will:
1. Read eventsCache.json from history_river/server/storage/
2. Parse each entry and extract metadata
3. Save to EventCache model in PostgreSQL
4. Report statistics
"""

import json
import os
import sys
import hashlib
from django.core.management.base import BaseCommand
from timeline.models import EventCache
from django.utils import timezone
from datetime import datetime
import re

class Command(BaseCommand):
    help = 'Migrate event cache from JSON file to PostgreSQL'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be migrated without actually doing it'
        )
        parser.add_argument(
            '--clear-existing',
            action='store_true',
            help='Clear existing EventCache entries before migration'
        )
    
    def extract_year_from_content(self, content: str) -> int:
        """Extract year from content text"""
        # Try to find year in the first line or from patterns like "约公元前1600年"
        year_patterns = [
            r'约?公元前?(\d+)年',  # BCE years: 公元前1600年
            r'(\d{3,4})年',         # CE years: 2024年
            r'公元(\d+)年',         # 公元25年
        ]
        
        for pattern in year_patterns:
            match = re.search(pattern, content[:200])  # Search in first 200 chars
            if match:
                year = int(match.group(1))
                # Check for BCE indicators
                if '公元前' in content[:match.start()]:
                    return -year
                return year
        
        # If no year found, use current year
        self.stdout.write(self.style.WARNING(f"  Could not extract year from content: {content[:50]}..."))
        return datetime.now().year
    
    def extract_title_from_content(self, content: str) -> str:
        """Extract event title from content - more lenient for real events"""
        # If content describes a specific event (not just a year), extract a title
        # Year overviews typically start with just the year and describe general period
        # Real events mention specific people, battles, events
        
        first_100 = content[:100]
        
        # Check if it looks like a year overview (just describing the era)
        year_overview_patterns = [
            r'^\d{3,4}年，?(正值|是|处于)',
            r'^约?前?\d{3,4}年，?(正值|是|处于)',
            r'这[一|个]时期',
            r'这[一|个]年[，。]',
            r'此时',
            r'这[个|一]阶段',
        ]
        
        for pattern in year_overview_patterns:
            if re.match(pattern, first_100):
                return ''  # It's a year overview
        
        # Looks like a real event - extract first sentence as title
        sentences = content.split('。')
        if sentences and sentences[0]:
            title = sentences[0].strip()
            # Clean up title: remove year prefix if present
            title = re.sub(r'^约?前?\d+年，?', '', title)
            return title[:200]  # Limit length but be generous
        
        return ''  # Default to year overview if uncertain
    
    def handle(self, *args, **options):
        # Path to JSON file - hardcoded from known location
        json_path = '/Users/dracohu/REPO/history_river_November_2025/history_river/server/storage/eventsCache.json'
        
        self.stdout.write(f"Looking for cache file: {json_path}")
        
        if not os.path.exists(json_path):
            self.stdout.write(self.style.ERROR(f"Cache file not found: {json_path}"))
            sys.exit(1)
        
        # Clear existing if requested
        if options['clear_existing']:
            count = EventCache.objects.all().count()
            if not options['dry_run']:
                EventCache.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"Cleared {count} existing entries"))
        
        # Load JSON
        with open(json_path, 'r', encoding='utf-8') as f:
            cache_data = json.load(f)
        
        self.stdout.write(f"Found {len(cache_data)} cache entries")
        
        # Statistics
        stats = {
            'total': len(cache_data),
            'migrated': 0,
            'skipped': 0,
            'errors': 0,
            'year_overview': 0,  # __year__ entries (should be 0 after our fix)
            'event_entries': 0,
        }
        
        # Process each entry
        for uuid, content in cache_data.items():
            try:
                # Skip test entries
                if uuid == 'test' or uuid.startswith('test-'):
                    self.stdout.write(self.style.WARNING(f"Skipping test entry: {uuid}"))
                    stats['skipped'] += 1
                    continue
                
                # Skip entries that look like year overviews (no longer used)
                if '__year__' in uuid:
                    stats['year_overview'] += 1
                    self.stdout.write(self.style.WARNING(f"Skipping year overview (no longer used): {uuid}"))
                    continue
                
                # Extract metadata
                year = self.extract_year_from_content(content)
                title = self.extract_title_from_content(content)
                
                if not title:
                    stats['year_overview'] += 1
                    self.stdout.write(self.style.WARNING(f"Skipping (likely year overview): {uuid}"))
                    continue
                else:
                    stats['event_entries'] += 1
                
                # Check if already exists
                if EventCache.objects.filter(uuid=uuid).exists():
                    self.stdout.write(self.style.WARNING(f"Skipping existing: {uuid}"))
                    stats['skipped'] += 1
                    continue
                
                # Create EventCache entry
                if not options['dry_run']:
                    EventCache.objects.create(
                        uuid=uuid,
                        year=year,
                        event_title=title,
                        context='',  # Not available in JSON
                        content=content,
                        is_cached=True,
                        is_deleted=False
                    )
                
                stats['migrated'] += 1
                
                # Progress indicator
                if stats['migrated'] % 10 == 0:
                    self.stdout.write(f"  Processed {stats['migrated']} entries...")
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"Error processing {uuid}: {str(e)}")
                )
                stats['errors'] += 1
        
        # Print summary
        self.stdout.write("\n" + "="*60)
        self.stdout.write(self.style.SUCCESS("Migration Summary"))
        self.stdout.write("="*60)
        self.stdout.write(f"Total entries in JSON: {stats['total']}")
        self.stdout.write(f"Successfully migrated: {stats['migrated']}")
        self.stdout.write(f"Skipped: {stats['skipped']}")
        self.stdout.write(f"Errors: {stats['errors']}")
        self.stdout.write(f"Event entries: {stats['event_entries']}")
        self.stdout.write(f"Year overviews (skipped): {stats['year_overview']}")
        
        if options['dry_run']:
            self.stdout.write(self.style.WARNING("\nThis was a DRY RUN. No data was actually migrated."))
        else:
            self.stdout.write(self.style.SUCCESS(f"\nMigration completed! {stats['migrated']} entries saved to PostgreSQL."))
            
            # Verify count
            db_count = EventCache.objects.all().count()
            self.stdout.write(f"Total EventCache entries in DB: {db_count}")
