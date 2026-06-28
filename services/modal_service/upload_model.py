import os
import modal

app = modal.App("model-uploader")
volume = modal.Volume.from_name("finetune-model-weights", create_if_missing=True)

# Định nghĩa image có sẵn huggingface_hub
image = modal.Image.debian_slim().pip_install("huggingface_hub")

@app.function(image=image, volumes={"/model": volume}, timeout=1800)
def upload_model_to_volume():
    """
    Script để tải model từ Hugging Face Hub và lưu trực tiếp vào Modal Volume.
    Chạy bằng lệnh: modal run services/modal_service/upload_model.py
    """
    from huggingface_hub import snapshot_download
    
    # Lấy model_id từ env hoặc mặc định
    # Volume mount được ánh xạ tại '/model' trong container.
    # Thư mục đích trong volume '/model/llama3.1-8b-java-chatbot-lora'
    # sẽ tương ứng với đường dẫn mà load_model() trong app.py đọc LoRA weights.
    model_id = os.environ.get("HF_MODEL_ID", "thinhpg1420/llama3.1-8b-java-chatbot-lora")
    target_dir = f"/model/llama3.1-8b-java-chatbot-lora"
    
    print(f"Downloading model {model_id} to Volume path {target_dir}...")
    
    try:
        snapshot_download(
            repo_id=model_id,
            local_dir=target_dir,
            ignore_patterns=["*.msgpack", "*.h5", "*.ot"],
            token=os.environ.get("HF_API_TOKEN") # token đọc từ config/secret của modal nếu có
        )
        # Commit để lưu dữ liệu vào Volume
        volume.commit()
        print("Model uploaded to Volume successfully!")
    except Exception as e:
        print(f"Error uploading model to volume: {str(e)}")
