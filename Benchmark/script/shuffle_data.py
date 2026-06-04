import json
import random
import os

input_file = r"f:\IT project\JAVA\Project\Benchmark\data\Fine-tune\java_augmented_dataset.json"
output_file = r"f:\IT project\JAVA\Project\Benchmark\data\Fine-tune\final_train_data_shuffled.json"

if not os.path.exists(input_file):
    print(f"Không tìm thấy file: {input_file}")
    exit(1)

with open(input_file, "r", encoding="utf-8") as f:
    data = json.load(f)

print(f"Đã load {len(data)} câu hỏi từ {input_file}")

# Trộn ngẫu nhiên 100% vị trí các cặp Q&A
random.seed(42) # Đặt seed cố định để dễ tái lập
random.shuffle(data)

with open(output_file, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"🎲 Đã tráo trộn ngẫu nhiên toàn bộ {len(data)} câu thành công!")
print(f"Đã lưu file tại: {output_file}")
