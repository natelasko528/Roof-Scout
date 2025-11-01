import json

with open('/home/natelasko/Roof-Scout/dist/stats.json', 'r') as f:
    stats = json.load(f)

print("=== Bundle Stats Analysis ===\n")
print(f"Total input modules: {len(stats['inputs'])}")

total_bytes = sum(m['bytes'] for m in stats['inputs'].values())
print(f"Total raw size: {total_bytes / 1024 / 1024:.2f} MB")
print(f"Total gzipped (est): {total_bytes / 1024 / 1024 * 0.3:.2f} MB\n")

sorted_modules = sorted(stats['inputs'].items(), 
                       key=lambda x: x[1]['bytes'], 
                       reverse=True)

print("Top 20 Largest Modules:")
for i, (name, data) in enumerate(sorted_modules[:20], 1):
    size_kb = data['bytes'] / 1024
    size_mb = data['bytes'] / 1024 / 1024
    percent = (data['bytes'] / total_bytes) * 100
    short_name = name.split('/')[-1][:50]
    print(f"{i:2d}. {short_name:50s} {size_mb:6.2f} MB ({percent:5.1f}%)")

print("\n=== Key Dependencies ===")
angular_core = sum(v['bytes'] for k, v in stats['inputs'].items() if '/core/' in k)
angular_compiler = sum(v['bytes'] for k, v in stats['inputs'].items() if '/compiler/' in k)
rxjs = sum(v['bytes'] for k, v in stats['inputs'].items() if 'rxjs' in k)
genai = sum(v['bytes'] for k, v in stats['inputs'].items() if 'genai' in k or '@google' in k)

print(f"Angular Core: {angular_core / 1024:.2f} KB")
print(f"Angular Compiler: {angular_compiler / 1024:.2f} KB")
print(f"RxJS: {rxjs / 1024:.2f} KB")
print(f"Google GenAI: {genai / 1024:.2f} KB")
