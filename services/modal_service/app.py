import modal
import os

# 1. Định nghĩa Image với các thư viện cần thiết cho LLM và FastAPI
image = (
    modal.Image.debian_slim()
    .pip_install(
        "torch",
        "transformers",
        "peft",
        "accelerate",
        "fastapi",
        "uvicorn",
        "pydantic"
    )
)

# 2. Khai báo Volume để lưu trữ model weights đã fine-tune
# Tránh việc tải lại từ Hugging Face Hub mỗi khi container khởi động lại
volume = modal.Volume.from_name("finetune-model-weights", create_if_missing=True)

# 3. Định nghĩa Modal App
app = modal.App("finetune-api", image=image)
