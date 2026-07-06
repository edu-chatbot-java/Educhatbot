import os
import json
import time
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv(dotenv_path='../.env')

# Tải 3 API Keys để xoay tua (tránh Rate Limit)
API_KEYS = [
    os.getenv("API_KEY_1"),
    os.getenv("API_KEY_2"),
    os.getenv("API_KEY_3")
]
# Lọc bỏ các key bị rỗng (nếu có)
API_KEYS = [key for key in API_KEYS if key]

# Tên model theo cấu hình của bạn
MODEL_NAME = 'gemini-3.1-flash-lite-preview'

# Biến toàn cục để theo dõi lượt xoay tua Key
current_key_index = 0

def get_next_model():
    """Hàm xoay tua API Key: Cứ mỗi lần gọi sẽ dùng Key tiếp theo"""
    global current_key_index
    api_key = API_KEYS[current_key_index]
    
    # Thay đổi cấu hình toàn cục sang Key mới
    genai.configure(api_key=api_key)
    
    # Chuyển sang key tiếp theo cho lần gọi sau
    current_key_index = (current_key_index + 1) % len(API_KEYS)
    
    return genai.GenerativeModel(MODEL_NAME)

def get_text_from_files(file_paths):
    text = ""
    for path in file_paths:
        try:
            with open(path, 'r', encoding='utf-8') as f:
                text += f.read() + "\n\n"
        except Exception as e:
            print(f"Lỗi đọc file {path}: {e}")
    return text

def chunk_text(text, chunk_size=200, overlap=50):
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start += (chunk_size - overlap)
    return chunks

def generate_questions_batch(chunks_batch):
    prompt = f"""
    Bạn là một chuyên gia lập trình Java. Tôi sẽ cung cấp cho bạn một đoạn văn bản (được chia thành nhiều phần) trích từ tài liệu học Java.
    Dựa DUY NHẤT vào nội dung của văn bản này, hãy tạo ra ĐÚNG 5 cặp Câu hỏi và Câu trả lời (Q&A).
    
    Yêu cầu:
    1. Câu hỏi phải rõ ràng, kiểm tra kiến thức về Java.
    2. Câu trả lời phải chính xác và dựa trên văn bản đã cho.
    3. Định dạng đầu ra BẮT BUỘC phải là 1 mảng JSON chứa 5 object, không có markdown formatting nào khác (không bọc trong ```json).
    
    Ví dụ định dạng đầu ra:
    [
        {{"question": "Câu hỏi 1?", "answer": "Trả lời 1."}},
        {{"question": "Câu hỏi 2?", "answer": "Trả lời 2."}}
    ]

    Văn bản nguồn:
    {json.dumps(chunks_batch, ensure_ascii=False)}
    """
    
    try:
        # Lấy model với API Key đã được xoay tua
        model = get_next_model()
        response = model.generate_content(prompt)
        content = response.text.strip()
        # Clean up markdown formatting if the model still outputs it
        if content.startswith("```json"):
            content = content[7:-3].strip()
        elif content.startswith("```"):
            content = content[3:-3].strip()
            
        return json.loads(content)
    except Exception as e:
        print(f"Lỗi khi gọi API hoặc parse JSON: {e}")
        return []

def main():
    file_paths = [
        r"f:\IT project\JAVA\Project\Benchmark\data\markdown\JavaCore.md",
        r"f:\IT project\JAVA\Project\Benchmark\data\markdown\Think Java.txt"
    ]
    
    output_file = r"f:\IT project\JAVA\Project\Benchmark\data\generated_questions.jsonl"
    
    print("Đang đọc file...")
    text = get_text_from_files(file_paths)
    
    print("Đang thực hiện chunking...")
    chunks = chunk_text(text, chunk_size=200, overlap=50)
    print(f"Tổng số chunk được tạo: {len(chunks)}")
    
    chunks_per_request = 50
    target_questions = 300
    questions_per_request = 5
    
    requests_needed = target_questions // questions_per_request
    
    total_questions_collected = 0
    chunk_index = 0
    
    print(f"Bắt đầu gọi API để tạo {target_questions} câu hỏi...")
    
    with open(output_file, 'w', encoding='utf-8') as f_out:
        while total_questions_collected < target_questions and chunk_index < len(chunks):
            # Lấy 50 chunk cho mỗi lần gọi (để sinh ra 5 câu)
            end_index = min(chunk_index + chunks_per_request, len(chunks))
            batch = chunks[chunk_index:end_index]
            
            print(f"Đang gửi request với chunk {chunk_index} đến {end_index}...")
            qa_list = generate_questions_batch(batch)
            
            for qa in qa_list:
                f_out.write(json.dumps(qa, ensure_ascii=False) + '\n')
                total_questions_collected += 1
                
                if total_questions_collected >= target_questions:
                    break
                    
            print(f"Đã thu thập được {total_questions_collected}/{target_questions} câu hỏi.")
            
            chunk_index += chunks_per_request
            
            # Tránh Rate Limit của API
            time.sleep(2)
            
    print(f"Hoàn thành! Đã lưu {total_questions_collected} câu hỏi vào: {output_file}")

if __name__ == "__main__":
    main()
