import os
import json
import time
from dotenv import load_dotenv
from openai import OpenAI
from tqdm import tqdm

# Load API Key từ file .env
load_dotenv()

# Lấy danh sách các API Key để xoay vòng
API_KEYS = [
    os.getenv("API_KEY_1"),
    os.getenv("API_KEY_2"),
    os.getenv("API_KEY_3")
]
API_KEYS = [k for k in API_KEYS if k] # Lọc các key hợp lệ

import itertools
api_key_cycle = itertools.cycle(API_KEYS)

def get_client():
    """Tạo client OpenAI tương thích với endpoint của Gemini, xoay vòng API key"""
    return OpenAI(
        api_key=next(api_key_cycle),
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
    )

# Cấu hình đường dẫn
RAW_TXT_PATH = r"f:\IT project\JAVA\Project\Benchmark\data\markdown\JavaCore.md"
OUTPUT_JSON_PATH = r"f:\IT project\JAVA\Project\Benchmark\data\Fine-tune\java_qa_dataset.json"

# Định nghĩa cấu trúc JSON bắt buộc bằng JSON Schema (Structured Outputs)
# Việc này ép LLM bắt buộc phải trả về đúng số câu và đúng các trường dữ liệu
JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "qa_pairs": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "category": {"type": "string", "enum": ["Lý thuyết khái niệm", "Phân tích mã nguồn", "Sửa lỗi và tối ưu"]},
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

def load_chunks_from_text(file_path, chunk_size=800, overlap=100):
    """
    Đọc file text tổng hợp và chia nhỏ thành các đoạn text (nếu bạn không muốn lấy từ Qdrant)
    Lưu ý: Bạn cũng có thể dùng thư viện qdrant_client để kéo ngược 747 chunks đã upload về.
    Ở đây ta giả định đọc trực tiếp file text đã xuất ra ở bước trước để xử lý tuyến tính.
    """
    with open(file_path, "r", encoding="utf-8") as f:
        full_text = f.read()
        
    # Cách băm đơn giản nếu chạy trực tiếp trên file text
    chunks = []
    start = 0
    while start < len(full_text):
        end = start + chunk_size
        chunks.append(full_text[start:end])
        start += chunk_size - overlap
    return chunks

def generate_qa_from_chunk(chunk_text, index):
    system_prompt = (
        "Bạn là một chuyên gia khảo thí và đào tạo lập trình Java Core chuyên nghiệp. "
        "Nhiệm vụ của bạn là đọc đoạn văn bản trích từ tài liệu 'JavaCore' và sinh ra chính xác 3 cặp câu hỏi - câu trả lời "
        "chất lượng cao phục vụ cho việc huấn luyện (fine-tune) mô hình ngôn ngữ lớn."
    )
    
    user_prompt = f"""
Đoạn văn bản gốc (Context):
\"\"\"
{chunk_text}
\"\"\"

Yêu cầu: Sinh chính xác 3 cặp câu hỏi và câu trả lời (Q&A) dựa trên ngữ cảnh trên theo đúng 3 nhóm sau:
1. Nhóm 'Lý thuyết khái niệm': Hỏi về định nghĩa, thuật ngữ, cơ chế vận hành của Java được nhắc tới.
2. Nhóm 'Phân tích mã nguồn': Đặt câu hỏi bắt người học phân tích đoạn code trong bài, hoặc tự viết code ví dụ minh họa cho khái niệm trong đoạn văn nếu đoạn văn không có code sẵn.
3. Nhóm 'Sửa lỗi và tối ưu': Đặt tình huống xuất hiện lỗi cú pháp hoặc lỗi logic liên quan đến kiến thức trong đoạn văn và cách khắc phục.

Chú ý quan trọng: 
- Câu trả lời (ground_truth) phải chi tiết, đầy đủ, sử dụng đúng thuật ngữ tiếng Việt sư phạm có trong đoạn văn.
- Trường 'context' trong JSON phải trích nguyên văn đoạn thông tin chứa câu trả lời từ đoạn văn bản gốc trên (không bịa, không tóm tắt) để phục vụ test RAG Faithfulness sau này.
"""

    try:
        # Lấy client xoay vòng API Key
        client = get_client()
        # Gọi API với chế độ khống chế cấu trúc đầu ra (Response Format) qua endpoint OpenAI compatibility của Gemini
        response = client.chat.completions.create(
            model="gemini-3.1-flash-lite-preview",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "qa_generation_schema",
                    "strict": True,
                    "schema": JSON_SCHEMA
                }
            },
            temperature=0.3 # Thấp để đảm bảo tính chính xác, bám sát văn bản gốc
        )
        
        # Parse kết quả trả về
        result = json.loads(response.choices[0].message.content)
        return result.get("qa_pairs", [])
    except Exception as e:
        print(f"\n❌ Lỗi tại chunk {index}: {e}")
        return []

def main():
    if not os.path.exists(RAW_TXT_PATH):
        print(f"Không tìm thấy file text tại: {RAW_TXT_PATH}")
        return

    print("Đang chuẩn bị dữ liệu chunk...")
    # Nếu bạn muốn đọc chính xác 747 chunks từ file text:
    # Ở đây ta điều chỉnh chunk_size phù hợp để chia ra lượng chunk tương ứng
    # Giảm chunk_size xuống 800 ký tự, overlap 100 ký tự
    chunks = load_chunks_from_text(RAW_TXT_PATH, chunk_size=800, overlap=100)
    print(f"Tổng số chunks sẽ xử lý: {len(chunks)}")
    
    final_dataset = []
    # Đọc dữ liệu cũ nếu có để nối tiếp vào (Append)
    if os.path.exists(OUTPUT_JSON_PATH):
        try:
            with open(OUTPUT_JSON_PATH, "r", encoding="utf-8") as f:
                final_dataset = json.load(f)
            print(f"Đã load {len(final_dataset)} cặp Q&A cũ từ {OUTPUT_JSON_PATH}")
        except Exception as e:
            print(f"Lỗi đọc JSON cũ: {e}")
    
    # Tiến hành chạy qua từng chunk và gọi API với thanh tiến trình tqdm
    for idx, chunk in enumerate(tqdm(chunks, desc="Đang sinh Q&A từ tài liệu")):
        if not chunk.strip():
            continue
            
        qa_pairs = generate_qa_from_chunk(chunk, idx)
        final_dataset.extend(qa_pairs)
        
        # Tránh bị Rate Limit của API khi chạy vòng lặp quá nhanh
        time.sleep(0.5)
        
        # Lưu checkpoint định kỳ sau mỗi 20 chunks để phòng sự cố mất điện/mất mạng
        if idx % 20 == 0 and final_dataset:
            with open(OUTPUT_JSON_PATH, "w", encoding="utf-8") as f:
                json.dump(final_dataset, f, ensure_ascii=False, indent=2)

    # Ghi toàn bộ dữ liệu hoàn chỉnh ra file JSON cuối cùng
    with open(OUTPUT_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(final_dataset, f, ensure_ascii=False, indent=2)
        
    print(f"\n✅ Hoàn thành! Đã sinh ra tổng cộng {len(final_dataset)} cặp Q&A.")
    print(f"📂 File dữ liệu lưu tại: {OUTPUT_JSON_PATH}")

if __name__ == "__main__":
    main()