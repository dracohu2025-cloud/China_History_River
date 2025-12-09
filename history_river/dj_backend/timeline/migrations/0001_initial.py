# Generated migration for timeline app

from django.db import migrations, models

class Migration(migrations.Migration):
    initial = True
    
    dependencies = []
    
    operations = [
        migrations.CreateModel(
            name='RiverPin',
            fields=[
                ('id', models.CharField(max_length=36, primary_key=True, serialize=False)),
                ('job_id', models.CharField(max_length=36)),
                ('title', models.CharField(max_length=200)),
                ('year', models.IntegerField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'river_pins',
                'ordering': ['year'],
            },
        ),
        migrations.AddIndex(
            model_name='riverpin',
            index=models.Index(fields=['year'], name='river_pins_year_idx'),
        ),
    ]
