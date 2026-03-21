import os
import sys
import yaml
import hashlib
from datetime import datetime
from pathlib import Path

def calculate_hash(filepath, algorithm='sha1'):
    h = hashlib.new(algorithm)
    with open(filepath, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            h.update(chunk)
    return h.hexdigest()

def scan_iso(iso_path):
    try:
        import pycdlib
    except ImportError:
        print("请先安装 pycdlib: pip install pycdlib")
        sys.exit(1)

    iso = pycdlib.PyCdlib()
    iso.open(iso_path)

    file_tree = []

    try:
        for root, dirs, files in iso.walk(iso_path='/'):
            for f in files:
                # Remove the ';1' suffix common in ISO9660
                filename = f.split(';')[0]
                
                # Construct the path
                if root == '/':
                    file_path = f"/{filename}"
                    iso_query_path = f"/{f}"
                else:
                    file_path = f"{root}/{filename}"
                    iso_query_path = f"{root}/{f}"
                
                try:
                    record = iso.get_record(iso_path=iso_query_path)
                    lba = record.extent_location()
                    size = record.get_data_length()
                    
                    # 提取文件修改时间
                    try:
                        year = 1900 + record.date.years_since_1900
                        month = record.date.month
                        day = record.date.day_of_month
                        hour = record.date.hour
                        minute = record.date.minute
                        second = record.date.second
                        mtime_str = f"{year:04d}-{month:02d}-{day:02d} {hour:02d}:{minute:02d}:{second:02d}"
                    except Exception as date_e:
                        mtime_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

                    file_tree.append({
                        'path': file_path,
                        'lba': lba,
                        'size': size,
                        'modified': False,
                        'mtime': mtime_str
                    })
                except Exception as e:
                    print(f"Error getting record for {iso_query_path}: {e}")
    except Exception as e:
        print(f"Error walking ISO: {e}")

    iso.close()
    return file_tree

def generate_iso_info(iso_path, output_path=None):
    iso_path = Path(iso_path)
    if not iso_path.exists():
        print(f"ISO文件不存在: {iso_path}")
        return

    iso_size = iso_path.stat().st_size
    iso_hash = calculate_hash(iso_path)

    print(f"扫描 ISO: {iso_path.name}")
    print(f"  大小: {iso_size} bytes ({iso_size / 1024 / 1024:.2f} MB)")
    print(f"  SHA1: {iso_hash}")

    print("正在扫描文件结构...")
    file_tree = scan_iso(iso_path)
    print(f"  共扫描到 {len(file_tree)} 个文件/目录")

    iso_info = {
        'archive_info': {
            'filename': iso_path.name,
            'size': iso_size,
            'hashes': {
                'sha1': iso_hash
            }
        },
        'file_tree': file_tree
    }

    if output_path is None:
        output_path = iso_path.with_suffix('.yml')
    else:
        output_path = Path(output_path)

    with open(output_path, 'w', encoding='utf-8') as f:
        yaml.dump(iso_info, f, allow_unicode=True, default_flow_style=False, sort_keys=False)

    print(f"已生成: {output_path}")
    return output_path

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("用法: python iso_info.py <iso文件路径> [输出路径]")
        print("示例: python iso_info.py 'game.iso' 'L9001_files.yml'")
        sys.exit(1)

    iso_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None

    generate_iso_info(iso_path, output_path)
