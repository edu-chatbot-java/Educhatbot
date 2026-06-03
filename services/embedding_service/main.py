import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List
import uvicorn
import torch
import torch.nn.functional as F
from transformers import AutoTokenizer
from optimum.onnxruntime import ORTModelForFeatureExtraction

app = FastAPI(
    title="Embedding Service API (ONNX Accelerated)", 
    description="Microservice cung cấp API mã hóa văn bản sử dụng ONNX Runtime để tăng tốc tối đa, tiết kiệm RAM.",
    version="1.1.0"
)

model_name = "intfloat/multilingual-e5-small"
onnx_path = "./onnx_model"

print(f"Đang khởi tạo mô hình {model_name} qua ONNX Runtime...")

# Tự động tải và convert sang ONNX nếu chưa có
if not os.path.exists(onnx_path):
    print("⏳ Chưa có file ONNX cục bộ. Đang tải và convert (Chỉ thực hiện lần đầu tiên)...")
    model = ORTModelForFeatureExtraction.from_pretrained(model_name, export=True)
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    # Lưu lại để lần sau khởi động tức thì
    model.save_pretrained(onnx_path)
    tokenizer.save_pretrained(onnx_path)
    print("✅ Convert ONNX thành công!")
else:
    print("⚡ Đang load mô hình ONNX từ thư mục cục bộ...")
    model = ORTModelForFeatureExtraction.from_pretrained(onnx_path)
    tokenizer = AutoTokenizer.from_pretrained(onnx_path)

print("✅ Tải mô hình thành công! Sẵn sàng nhận request.")

class EmbedRequest(BaseModel):
    texts: List[str] = Field(..., description="Danh sách các đoạn văn bản cần mã hóa")
    prefix: str = Field(
        default="", 
        description="Tiền tố E5 yêu cầu. Truyền 'passage: ' khi Ingestion (lưu DB), và 'query: ' khi Search RAG (tìm kiếm)."
    )

class EmbedResponse(BaseModel):
    embeddings: List[List[float]]
    model: str
    dimension: int

def average_pool(last_hidden_states: torch.Tensor, attention_mask: torch.Tensor) -> torch.Tensor:
    """Pooling theo chuẩn của E5 (Average Pooling)"""
    last_hidden = last_hidden_states.masked_fill(~attention_mask[..., None].bool(), 0.0)
    return last_hidden.sum(dim=1) / attention_mask.sum(dim=1)[..., None]

@app.post("/api/embed", response_model=EmbedResponse)
def generate_embeddings(request: EmbedRequest):
    try:
        if not request.texts:
            raise HTTPException(status_code=400, detail="Danh sách 'texts' không được để trống")

        # Chuẩn bị dữ liệu đầu vào cho E5
        input_texts = [request.prefix + text for text in request.texts]
        
        # Tiền xử lý (Tokenization)
        encoded_input = tokenizer(
            input_texts, 
            padding=True, 
            truncation=True, 
            max_length=512, 
            return_tensors='pt'
        )
        
        # Sinh vector qua ONNX
        model_output = model(**encoded_input)
        
        # Pooling và Normalize (Cosine Similarity)
        embeddings = average_pool(model_output.last_hidden_state, encoded_input['attention_mask'])
        embeddings = F.normalize(embeddings, p=2, dim=1)
        
        return EmbedResponse(
            embeddings=embeddings.tolist(),
            model=f"{model_name} (ONNX)",
            dimension=embeddings.shape[1]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi sinh vector: {str(e)}")

@app.get("/health")
def health_check():
    return {
        "status": "healthy", 
        "model": f"{model_name} (ONNX)",
        "dimension": 384
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
