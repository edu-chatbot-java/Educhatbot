"""
Script: convert_to_chat_format.py
Muc dich: Convert java_augmented_dataset.json sang JSONL chat format
          de dung cho QLoRA Fine-tuning voi Llama-3.1-8B-Instruct

Cach dung:
    python convert_to_chat_format.py

Output: train_chat_format.jsonl (cung thu muc)
"""

import io
import json
import os
import random
import sys

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

# ─── Cấu hình ─────────────────────────────────────────────────────────────────
INPUT_FILE  = os.path.join(os.path.dirname(__file__), "../data/Fine-tune/java_augmented_dataset.json")
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), "../data/Fine-tune/train_chat_format.jsonl")
SEED = 42

SYSTEM_PROMPT = (
    "Bạn là trợ lý học thuật thông minh chuyên về lập trình Java. "
    "Nhiệm vụ của bạn là trả lời câu hỏi của sinh viên dựa trên ngữ cảnh tài liệu được cung cấp. "
    "Hãy trả lời bằng tiếng Việt, chính xác, rõ ràng và dễ hiểu. "
    "Nếu ngữ cảnh không đủ thông tin, hãy nói rõ điều đó thay vì đoán mò."
)

# ─── Hàm convert ──────────────────────────────────────────────────────────────
def convert_to_chat_format(input_path: str, output_path: str) -> None:
    print(f"[INFO] Doc file: {input_path}")
    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"[INFO] Tong so ban ghi: {len(data)}")

    # Shuffle để tránh mô hình học theo thứ tự category
    random.seed(SEED)
    random.shuffle(data)

    chat_data = []
    skipped = 0

    for item in data:
        question    = item.get("question", "").strip()
        context     = item.get("context", "").strip()
        ground_truth = item.get("ground_truth", "").strip()

        # Bỏ qua bản ghi thiếu dữ liệu
        if not question or not ground_truth:
            skipped += 1
            continue

        # Build user message: ghép context + question
        if context:
            user_content = f"Ngữ cảnh tài liệu:\n{context}\n\nCâu hỏi: {question}"
        else:
            user_content = f"Câu hỏi: {question}"

        chat_data.append({
            "messages": [
                {"role": "system",    "content": SYSTEM_PROMPT},
                {"role": "user",      "content": user_content},
                {"role": "assistant", "content": ground_truth},
            ]
        })

    print(f"[OK] Converted: {len(chat_data)} ban ghi")
    if skipped:
        print(f"[WARN] Bo qua: {skipped} ban ghi thieu du lieu")

    with open(output_path, "w", encoding="utf-8") as f:
        for item in chat_data:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")

    print(f"[SAVED] Da luu: {output_path}")

    # Hien thi mau dau tien de verify
    print("\n--- Mau ban ghi dau tien ---")
    sample = chat_data[0]
    print(f"  [system]: {sample['messages'][0]['content'][:80]}...")
    print(f"  [user]:   {sample['messages'][1]['content'][:120]}...")
    print(f"  [asst]:   {sample['messages'][2]['content'][:120]}...")


# ─── Chạy ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    convert_to_chat_format(INPUT_FILE, OUTPUT_FILE)
