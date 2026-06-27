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

# 4. Định nghĩa Class Model để chạy inference trên GPU
@app.cls(
    gpu="A10G",
    volumes={"/model": volume},
    timeout=600
)
class Model:
    @modal.enter()
    def load_model(self):
        import torch
        from transformers import AutoModelForCausalLM, AutoTokenizer
        from peft import PeftModel

        self.model_dir = "/model/llama3.1-8b-java-chatbot"
        self.lora_dir = "/model/llama3.1-8b-java-chatbot-lora"
        
        # Nếu thư mục model có sẵn trong volume, ta load từ đó
        if os.path.exists(self.model_dir):
            print(f"Loading model from volume: {self.model_dir}")
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_dir)
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_dir,
                torch_dtype=torch.bfloat16,
                device_map="auto"
            )
        else:
            # Fallback model cho việc test hoặc khởi tạo nhanh không cần HF token
            fallback_model = "Qwen/Qwen2.5-1.5B-Instruct"
            print(f"Model not found in volume. Falling back to: {fallback_model}")
            self.tokenizer = AutoTokenizer.from_pretrained(fallback_model)
            self.model = AutoModelForCausalLM.from_pretrained(
                fallback_model,
                torch_dtype=torch.bfloat16,
                device_map="auto"
            )

        # Load LoRA adapter nếu tồn tại riêng lẻ
        if os.path.exists(self.lora_dir):
            print(f"Loading LoRA adapter from volume: {self.lora_dir}")
            self.model = PeftModel.from_pretrained(self.model, self.lora_dir)
            
        print("Model loaded successfully!")
