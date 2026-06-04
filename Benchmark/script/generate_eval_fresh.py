import json
import os
import random
import time
from dotenv import load_dotenv
from openai import OpenAI
from tqdm import tqdm
import itertools

# Cấu hình API Keys giống hệ thống chính
load_dotenv()
API_KEYS = [os.getenv("API_KEY_1"), os.getenv("API_KEY_2"), os.getenv("API_KEY_3")]
API_KEYS = [k for k in API_KEYS if k]
api_key_cycle = itertools.cycle(API_KEYS)

def get_client():
    return OpenAI(
        api_key=next(api_key_cycle),
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
    )

def load_chunks_from_text(file_path, chunk_size=1500, overlap=150):
    with open(file_path, 'r', encoding='utf-8') as f:
        text = f.read()
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += (chunk_size - overlap)
    return chunks

JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "qa_pairs": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "category": {"type": "string"},
                    "question": {"type": "string"},
                    "context": {"type": "string"},
                    "ground_truth": {"type": "string"}
                },
                "required": ["category", "question", "context", "ground_truth"],
                "additionalProperties": False
            }
        }
    },
    "required": ["qa_pairs"],
    "additionalProperties": False
}

def generate_eval_qa(chunk, index, num_questions=2):
    prompt = f"""Bạn là một chuyên gia ra đề thi lập trình Java xuất sắc.
Dựa vào đoạn văn bản dưới đây, hãy sinh ra ĐÚNG {num_questions} cặp câu hỏi - câu trả lời chất lượng cao dùng để đánh giá mô hình AI (RAG Evaluation Benchmark).

YÊU CẦU NGHIÊM NGẶT:
1. Câu hỏi phải sâu sắc, đòi hỏi suy luận, không hỏi quá chung chung.
2. 'context' phải là nguyên văn phần văn bản chứa đáp án được copy nguyên xi từ đoạn trích.
3. 'ground_truth' phải trả lời trực diện, chính xác.

ĐOẠN VĂN BẢN:
{chunk}
"""
    while True:
        try:
            client = get_client()
            response = client.chat.completions.create(
                model="gemini-3.1-flash-lite-preview",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3, # Giảm sáng tạo để tăng độ chính xác
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": "eval_qa_generation",
                        "strict": True,
                        "schema": JSON_SCHEMA
                    }
                }
            )
            res_json = json.loads(response.choices[0].message.content)
            
            if "qa_pairs" in res_json:
                return res_json["qa_pairs"][:num_questions]
            return []
        except Exception as e:
            error_str = str(e).lower()
            if "429" in error_str or "exhausted" in error_str or "rate limit" in error_str:
                time.sleep(3)
                continue
            elif "expecting" in error_str or "json" in error_str:
                time.sleep(1)
                continue
            print(f"Lỗi tại chunk {index}: {e}")
            return []

def main():
    file1 = r"f:\IT project\JAVA\Project\Benchmark\data\markdown\JavaCore.md"
    file2 = r"f:\IT project\JAVA\Project\Benchmark\data\markdown\Think Java.txt"
    output_file = r"f:\IT project\JAVA\Project\Benchmark\data\eval_200_questions.json"
    
    if not os.path.exists(file1) or not os.path.exists(file2):
        print("❌ Không tìm thấy một trong hai file nguồn. Vui lòng kiểm tra lại!")
        return
        
    print("Đang đọc và chunking văn bản từ 2 tài liệu...")
    # Tăng kích thước chunk để câu hỏi sinh ra có độ sâu ngữ cảnh
    chunks1 = load_chunks_from_text(file1, chunk_size=1500, overlap=150)
    chunks2 = load_chunks_from_text(file2, chunk_size=1500, overlap=150)
    
    # Shuffle ngẫu nhiên và chọn 50 chunks mỗi file
    random.seed(123)
    random.shuffle(chunks1)
    random.shuffle(chunks2)
    
    selected_chunks = chunks1[:50] + chunks2[:50]
    random.shuffle(selected_chunks)
    
    print(f"Đã chọn ngẫu nhiên {len(selected_chunks)} chunks (50 chunks từ mỗi sách).")
    print("🚀 Bắt đầu gọi AI sinh 200 câu hỏi Benchmark...")
    
    eval_dataset = []
    
    for idx, chunk in enumerate(tqdm(selected_chunks, desc="Đang sinh tập Eval")):
        # Mỗi chunk gọi AI sinh 2 câu hỏi (100 chunks * 2 = 200 câu)
        pairs = generate_eval_qa(chunk, idx, num_questions=2)
        eval_dataset.extend(pairs)
        time.sleep(1.0)
        
        # Save tạm định kỳ
        if idx % 10 == 0:
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(eval_dataset, f, ensure_ascii=False, indent=2)
                
    # Lưu file hoàn chỉnh
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(eval_dataset, f, ensure_ascii=False, indent=2)
        
    print(f"\n✅ Hoàn thành xuất sắc! Đã sinh {len(eval_dataset)} câu hỏi Eval độc lập.")
    print(f"📂 File sẵn sàng để đánh giá RAG và Finetune tại: {output_file}")

if __name__ == "__main__":
    main()
