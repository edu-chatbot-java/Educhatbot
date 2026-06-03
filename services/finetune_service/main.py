from fastapi import FastAPI
import uvicorn

app = FastAPI(
    title="Fine-tuning LLM Service API", 
    description="Microservice do TV5 phát triển, chứa mô hình LLM đã được Fine-tune bằng QLoRA để sinh câu trả lời chuyên ngành."
)

@app.post("/api/generate")
def generate_answer(request: dict):
    # TODO: TV5 viết code nhận payload từ Java, đưa vào LLM để sinh kết quả
    return {"answer": "Đây là câu trả lời mô phỏng từ Fine-tune model"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    # Chạy trên port 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
