# 🚀 Modal Fine-tuning Inference Service

Service này được xây dựng trên nền tảng Serverless GPU của [Modal.com](https://modal.com) để chạy mô hình ngôn ngữ lớn (LLM) đã được fine-tune mà không cần duy trì một server GPU chạy 24/7.

## 🛠️ Yêu cầu & Cấu hình môi trường

1. Cài đặt Modal CLI trong môi trường Python local:
   ```bash
   pip install modal
   ```
2. Xác thực tài khoản Modal:
   ```bash
   modal setup
   ```
3. Khởi tạo một Volume lưu trữ model weights (chỉ cần chạy một lần):
   ```bash
   modal volume create finetune-model-weights
   ```

## 📦 Deploy lên Modal Cloud

Deploy endpoint HTTPS production cố định:
```bash
modal deploy services/modal_service/app.py
```
Sau khi deploy thành công, Modal sẽ cung cấp một URL cố định dạng:
`https://<your-username>--finetune-api-model-generate.modal.run`

Hãy cấu hình URL này vào file `.env` local của dự án:
```env
MODAL_API_URL=https://<your-username>--finetune-api-model-generate.modal.run
```

## 🗄️ Tải Model lên Volume

Để upload weights model đã fine-tune (LoRA adapter) từ Hugging Face Hub trực tiếp vào Modal Volume:
```bash
# Cấu hình biến môi trường và chạy script uploader trực tiếp trên Cloud container
export HF_MODEL_ID="yourusername/llama3.1-8b-java-chatbot-lora"
modal run services/modal_service/upload_model.py
```

## 📡 API Endpoints

### 1. GET `/health`
Kiểm tra trạng thái của model.

**Response:**
```json
{
  "status": "healthy",
  "model": "llama3.1-8b-java-chatbot-lora"
}
```

### 2. POST `/generate`
Sinh câu trả lời từ prompt.

**Request Body:**
```json
{
  "prompt": "<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\nBạn là trợ lý...<|eot_id|>",
  "max_new_tokens": 512,
  "temperature": 0.7
}
```

**Response Body:**
```json
{
  "answer": "Đây là câu trả lời được sinh ra...",
  "latency_ms": 1250
}
```

## 🔍 Giám sát và Xem Logs

Xem log realtime của service đang chạy trên Cloud:
```bash
modal logs finetune-api
```
