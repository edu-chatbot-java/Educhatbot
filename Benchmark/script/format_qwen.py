import json
import os

input_file = r"f:\IT project\JAVA\Project\Benchmark\data\Fine-tune\final_train_data_shuffled.json"
output_file = r"f:\IT project\JAVA\Project\Benchmark\data\Fine-tune\qwen_finetune_dataset.json"

system_prompt = "Bạn là một giảng viên lập trình Java và chuyên gia phân tích phần mềm. Nhiệm vụ của bạn là giải đáp chính xác, dễ hiểu các thắc mắc của sinh viên về ngôn ngữ Java, OOP và các kỹ thuật lập trình."

def format_dataset():
    if not os.path.exists(input_file):
        print(f"Không tìm thấy file: {input_file}")
        return

    with open(input_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    formatted_data = []
    
    for item in data:
        # Xây dựng cấu trúc messages chuẩn OpenAI/ChatML
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": item["question"]},
            {"role": "assistant", "content": item["ground_truth"]}
        ]
        
        formatted_data.append({"messages": messages})

    # Lưu ra định dạng JSON cho việc train (LLaMA-Factory, Unsloth, HuggingFace đều hỗ trợ chuẩn này)
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(formatted_data, f, ensure_ascii=False, indent=2)

    print(f"✅ Đã convert thành công {len(formatted_data)} cặp Q&A sang định dạng ChatML (messages)!")
    print(f"📂 File sẵn sàng để Fine-tune: {output_file}")

if __name__ == "__main__":
    format_dataset()
