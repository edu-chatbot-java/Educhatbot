import modal
import os
import time
import logging

# Thiết lập logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("modal-finetune-service")

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
            logger.info(f"Loading model from volume: {self.model_dir}")
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_dir)
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_dir,
                torch_dtype=torch.bfloat16,
                device_map="auto"
            )
        else:
            # Fallback model cho việc test hoặc khởi tạo nhanh không cần HF token
            fallback_model = "Qwen/Qwen2.5-1.5B-Instruct"
            logger.info(f"Model not found in volume. Falling back to: {fallback_model}")
            self.tokenizer = AutoTokenizer.from_pretrained(fallback_model)
            self.model = AutoModelForCausalLM.from_pretrained(
                fallback_model,
                torch_dtype=torch.bfloat16,
                device_map="auto"
            )

        # Load LoRA adapter nếu tồn tại riêng lẻ
        if os.path.exists(self.lora_dir):
            logger.info(f"Loading LoRA adapter from volume: {self.lora_dir}")
            self.model = PeftModel.from_pretrained(self.model, self.lora_dir)
            
        logger.info("Model loaded successfully!")

    @modal.web_endpoint(method="POST")
    def generate(self, request: dict):
        """
        Endpoint POST /generate nhận payload:
        {
            "prompt": "...",
            "max_new_tokens": 512,
            "temperature": 0.7
        }
        Trả về:
        {
            "answer": "...",
            "latency_ms": 123
        }
        """
        start_time = time.time()
        try:
            prompt = request.get("prompt", "")
            max_new_tokens = request.get("max_new_tokens", 512)
            temperature = request.get("temperature", 0.7)
            do_sample = temperature > 0.0

            if not prompt:
                return {"error": "Prompt cannot be empty"}, 400

            logger.info(f"Received generation request. Prompt length: {len(prompt)}")

            # Tokenize prompt
            inputs = self.tokenizer(prompt, return_tensors="pt").to("cuda")
            
            # Sinh văn bản
            import torch
            with torch.no_grad():
                output_ids = self.model.generate(
                    **inputs,
                    max_new_tokens=max_new_tokens,
                    temperature=temperature if do_sample else None,
                    do_sample=do_sample,
                    pad_token_id=self.tokenizer.eos_token_id
                )

            # Chỉ giải mã phần text mới sinh ra (loại bỏ prompt ban đầu)
            input_length = inputs.input_ids.shape[1]
            generated_ids = output_ids[0][input_length:]
            answer = self.tokenizer.decode(generated_ids, skip_special_tokens=True)

            latency_ms = int((time.time() - start_time) * 1000)
            logger.info(f"Generation completed in {latency_ms}ms")

            return {
                "answer": answer.strip(),
                "latency_ms": latency_ms
            }

        except Exception as e:
            logger.error(f"Error during generation: {str(e)}", exc_info=True)
            return {"error": f"Internal server error: {str(e)}"}, 500

    @modal.web_endpoint(method="GET")
    def health(self):
        """
        Endpoint GET /health để kiểm tra trạng thái hoạt động của mô hình
        """
        try:
            model_name = getattr(self.model.config, "_name_or_path", "unknown")
            return {
                "status": "healthy",
                "model": model_name
            }
        except Exception as e:
            logger.error(f"Health check failed: {str(e)}")
            return {"status": "unhealthy", "error": str(e)}, 500
