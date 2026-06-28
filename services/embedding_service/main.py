import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List
import uvicorn
import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModel

app = FastAPI(
    title="Embedding Service API", 
    description="Microservice cung cấp API mã hóa văn bản sử dụng E5.",
    version="1.1.0"
)

model_name = "intfloat/multilingual-e5-small"

print(f"Đang khởi tạo mô hình {model_name}...")
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModel.from_pretrained(model_name)
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

        input_texts = [request.prefix + text for text in request.texts]
        
        encoded_input = tokenizer(
            input_texts, 
            padding=True, 
            truncation=True, 
            max_length=512, 
            return_tensors='pt'
        )
        
        with torch.no_grad():
            model_output = model(**encoded_input)
            embeddings = average_pool(model_output.last_hidden_state, encoded_input['attention_mask'])
            embeddings = F.normalize(embeddings, p=2, dim=1)
        
        return EmbedResponse(
            embeddings=embeddings.tolist(),
            model=model_name,
            dimension=embeddings.shape[1]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi sinh vector: {str(e)}")

@app.get("/health")
def health_check():
    return {
        "status": "healthy", 
        "model": model_name,
        "dimension": 384
    }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
