import json
import os
import time
from dotenv import load_dotenv
from openai import OpenAI
from tqdm import tqdm

load_dotenv()

API_KEYS = [
    os.getenv("API_KEY_1"),
    os.getenv("API_KEY_2"),
    os.getenv("API_KEY_3")
]
API_KEYS = [k for k in API_KEYS if k]
import itertools
api_key_cycle = itertools.cycle(API_KEYS)

def get_client():
    return OpenAI(
        api_key=next(api_key_cycle),
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
    )

INPUT_FILE = r"f:\IT project\JAVA\Project\Benchmark\data\Fine-tune\java_qa_dataset.json"
OUTPUT_FILE = r"f:\IT project\JAVA\Project\Benchmark\data\Fine-tune\java_augmented_dataset.json"

JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "results": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "integer"},
                    "variations": {
                        "type": "array",
                        "items": {"type": "string"}
                    }
                },
                "required": ["id", "variations"],
                "additionalProperties": False
            }
        }
    },
    "required": ["results"],
    "additionalProperties": False
}

def paraphrase_batch(batch_items):
    prompt = "Bạn là một chuyên gia ngôn ngữ học. Hãy viết lại các câu hỏi Java sau đây, mỗi câu thành đúng 2 biến thể khác nhau (giữ nguyên ý nghĩa cốt lõi).\n\n"
    prompt += "QUY TẮC:\n"
    prompt += "- Biến thể 1: Thay đổi cách dùng từ, có thể chuyển sang tình huống hoặc thuật ngữ tiếng Anh.\n"
    prompt += "- Biến thể 2: Hành văn theo kiểu một học sinh đang thắc mắc.\n\n"
    
    for item in batch_items:
        prompt += f"ID: {item['temp_id']}\n"
        prompt += f"Nhóm: {item['category']}\n"
        prompt += f"Câu hỏi: \"{item['question']}\"\n\n"
        
    while True:
        try:
            client = get_client()
            response = client.chat.completions.create(
                model="gemini-3.1-flash-lite-preview",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5,
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": "qa_batch_generation",
                        "strict": True,
                        "schema": JSON_SCHEMA
                    }
                }
            )
            res_json = json.loads(response.choices[0].message.content)
            
            if "results" in res_json:
                return res_json["results"]
            return []
        except Exception as e:
            error_str = str(e).lower()
            if "429" in error_str or "rate limit" in error_str or "exhausted" in error_str:
                print(f"\n⚠️ Bị Rate limit, đã tự động xoay API Key. Chờ 3 giây...")
                time.sleep(3)
                continue
            elif "expecting" in error_str or "json" in error_str:
                time.sleep(1)
                continue
                
            print(f"\nLỗi: {e}")
            return []

def main():
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        dataset = json.load(f)
        
    augmented_dataset = []
    start_idx = 0
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
                augmented_dataset = json.load(f)
            # Vì mỗi câu sinh ra 2 biến thể -> tổng cộng 3 câu được append cho mỗi item gốc
            start_idx = len(augmented_dataset) // 3
            print(f"🔄 Tìm thấy checkpoint! Tiếp tục từ câu hỏi thứ {start_idx}...")
        except Exception as e:
            print("Không thể load checkpoint, bắt đầu lại từ đầu...")
            augmented_dataset = []
            
    print("🚀 Bắt đầu quá trình nhân bản câu hỏi (Data Augmentation)...")
    
    # Chuẩn bị dữ liệu chưa được xử lý
    items_to_process = dataset[start_idx:]
    batch_size = 4
    
    # Chia thành các batch 4 câu
    batches = [items_to_process[i:i + batch_size] for i in range(0, len(items_to_process), batch_size)]
    
    for batch_idx, batch in enumerate(tqdm(batches, desc="Đang nhân bản (Batch 4)")):
        # Gán temp_id để map kết quả trả về
        for i, item in enumerate(batch):
            item['temp_id'] = i
            
        results = paraphrase_batch(batch)
        
        # Parse kết quả và append biến thể
        for item in batch:
            # Copy sạch item gốc
            clean_item = item.copy()
            if 'temp_id' in clean_item: del clean_item['temp_id']
            
            augmented_dataset.append(clean_item) # Thêm câu gốc
            
            # Tìm result có id tương ứng
            matching_res = next((r for r in results if r.get("id") == item.get("temp_id")), None)
            if matching_res and "variations" in matching_res:
                for var in matching_res["variations"]:
                    new_item = clean_item.copy()
                    new_item['question'] = var
                    augmented_dataset.append(new_item)
            
        time.sleep(2.0) # Tránh gọi API quá nhanh
            
        if batch_idx % 10 == 0:
            with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
                json.dump(augmented_dataset, f, ensure_ascii=False, indent=2)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(augmented_dataset, f, ensure_ascii=False, indent=2)
        
    print(f"✅ Hoàn thành! Bộ dữ liệu sau nhân bản đạt: {len(augmented_dataset)} câu.")

if __name__ == "__main__":
    main()
