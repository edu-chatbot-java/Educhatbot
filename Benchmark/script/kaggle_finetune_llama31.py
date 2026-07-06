# ─── Kaggle Notebook: Fine-tune Llama-3.1-8B với QLoRA ─────────────────────────
# Platform : Kaggle P100 (16GB VRAM) — bật GPU trong Settings → Accelerator
# Thoi gian: ~4-6 gio (3 epochs, 5679 samples)
# DATA    : train_chat_format.jsonl (upload lên Kaggle Dataset trước)
#
# BUOC CHUAN BI (lam truoc khi chay notebook):
#   1. Upload file train_chat_format.jsonl len Kaggle Dataset
#   2. Add dataset vay vao notebook nay
#   3. Tao HF token tai https://huggingface.co/settings/tokens
#   4. Add HF token vao Kaggle Secrets: Settings → Secrets → Add HF_TOKEN
#   5. Xin quyen truy cap Llama-3.1: https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct
#
# ─── CELL 1: Cai dat thu vien ─────────────────────────────────────────────────

# %%
# !pip install -q unsloth "xformers==0.0.28.post2"
# !pip install -q trl peft accelerate bitsandbytes huggingface_hub datasets

# ─── CELL 2: Dang nhap HF + Load Model ────────────────────────────────────────

# %%
import os
from kaggle_secrets import UserSecretsClient  # type: ignore
from huggingface_hub import login  # type: ignore

# Lay HF token tu Kaggle Secrets (an toan hon hard-code)
secrets = UserSecretsClient()
hf_token = secrets.get_secret("HF_TOKEN")
login(token=hf_token)
print("Da dang nhap Hugging Face thanh cong")

# ─── CELL 3: Load Llama-3.1-8B voi 4-bit QLoRA ───────────────────────────────

# %%
from unsloth import FastLanguageModel  # type: ignore
import torch

MODEL_NAME     = "meta-llama/Llama-3.1-8B-Instruct"
MAX_SEQ_LENGTH = 2048   # Du de chua context + question + answer cua bo du lieu Java
DTYPE          = None   # Auto detect (bfloat16 cho Ampere+, float16 cho P100)
LOAD_IN_4BIT   = True   # QLoRA: 4-bit quantization

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name      = MODEL_NAME,
    max_seq_length  = MAX_SEQ_LENGTH,
    dtype           = DTYPE,
    load_in_4bit    = LOAD_IN_4BIT,
    token           = hf_token,
)
print(f"Da load model: {MODEL_NAME}")

# ─── CELL 4: Cau hinh LoRA ───────────────────────────────────────────────────

# %%
model = FastLanguageModel.get_peft_model(
    model,
    r              = 16,      # LoRA rank — 16 la can bang giua chat luong va toc do
    target_modules = [
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj",
    ],
    lora_alpha     = 32,      # Scaling factor (thuong = 2*r)
    lora_dropout   = 0.05,
    bias           = "none",
    use_gradient_checkpointing = "unsloth",  # Tiet kiem 30% VRAM
    random_state   = 42,
)
print("Da cau hinh LoRA")
model.print_trainable_parameters()

# ─── CELL 5: Load va chuan bi Dataset ────────────────────────────────────────

# %%
from datasets import load_dataset  # type: ignore

# Duong dan toi file JSONL da upload len Kaggle Dataset
DATASET_PATH = "/kaggle/input/YOUR_DATASET_NAME/train_chat_format.jsonl"

dataset = load_dataset("json", data_files=DATASET_PATH, split="train")
dataset = dataset.train_test_split(test_size=0.05, seed=42)
print(f"Train: {len(dataset['train'])} samples | Val: {len(dataset['test'])} samples")

# Apply Llama-3.1 chat template
def format_chat(example):
    return {
        "text": tokenizer.apply_chat_template(
            example["messages"],
            tokenize            = False,
            add_generation_prompt = False,
        )
    }

dataset = dataset.map(format_chat, remove_columns=["messages"])

# Kiem tra mau dau tien
print("\nMau du lieu sau khi format:")
print(dataset["train"][0]["text"][:500])

# ─── CELL 6: Training ────────────────────────────────────────────────────────

# %%
from trl import SFTTrainer  # type: ignore
from transformers import TrainingArguments  # type: ignore

trainer = SFTTrainer(
    model                = model,
    tokenizer            = tokenizer,
    train_dataset        = dataset["train"],
    eval_dataset         = dataset["test"],
    dataset_text_field   = "text",
    max_seq_length       = MAX_SEQ_LENGTH,
    dataset_num_proc     = 2,
    packing              = False,  # Tat packing de tranh nhap nham cac sample
    args = TrainingArguments(
        # Batch size va gradient accumulation
        per_device_train_batch_size  = 2,
        gradient_accumulation_steps  = 4,   # Effective batch = 2*4 = 8

        # So epochs
        num_train_epochs             = 3,

        # Learning rate voi warmup
        learning_rate                = 2e-4,
        warmup_ratio                 = 0.03,
        lr_scheduler_type            = "cosine",

        # Mixed precision
        fp16                         = not torch.cuda.is_bf16_supported(),
        bf16                         = torch.cuda.is_bf16_supported(),

        # Logging va Evaluation
        logging_steps                = 25,
        evaluation_strategy          = "steps",
        eval_steps                   = 100,

        # Luu checkpoint theo epoch
        save_strategy                = "epoch",
        save_total_limit             = 2,

        # Thu muc output
        output_dir                   = "/kaggle/working/llama31-java-finetuned",

        # Optim
        optim                        = "adamw_8bit",
        weight_decay                 = 0.01,
        max_grad_norm                = 1.0,

        # Seed
        seed                         = 42,
        report_to                    = "none",  # Tat wandb
    ),
)

print("Bat dau training...")
trainer_stats = trainer.train()
print(f"\nTraining hoan thanh!")
print(f"  Training loss: {trainer_stats.training_loss:.4f}")
print(f"  Total steps  : {trainer_stats.global_step}")

# ─── CELL 7: Luu model va Push len HF Hub ────────────────────────────────────

# %%
HF_USERNAME  = "YOUR_HF_USERNAME"         # <-- Thay bang HF username cua ban
REPO_NAME    = "llama3.1-8b-java-chatbot-lora"
HF_REPO_ID   = f"{HF_USERNAME}/{REPO_NAME}"

print(f"Dang push model len: {HF_REPO_ID}")

# Luu va push LoRA adapters
model.push_to_hub(HF_REPO_ID, token=hf_token)
tokenizer.push_to_hub(HF_REPO_ID, token=hf_token)

print(f"Da push model thanh cong len: https://huggingface.co/{HF_REPO_ID}")
print(f"\n[QUAN TRONG] Cap nhat application.yml:")
print(f"  huggingface.model.id = {HF_REPO_ID}")

# ─── CELL 8: Kiem tra nhanh model vua train ──────────────────────────────────

# %%
# Test nhanh mot cau hoi Java
FastLanguageModel.for_inference(model)  # Chuyen sang inference mode (nhanh hon 2x)

test_messages = [
    {"role": "system",    "content": "Ban la tro ly hoc thuat chuyen ve lap trinh Java. Hay tra loi bang tieng Viet."},
    {"role": "user",      "content": "Interface trong Java la gi va no khac gi Abstract class?"},
]

inputs = tokenizer.apply_chat_template(
    test_messages, tokenize=True, add_generation_prompt=True, return_tensors="pt"
).to("cuda")

outputs = model.generate(
    input_ids        = inputs,
    max_new_tokens   = 300,
    temperature      = 0.7,
    do_sample        = True,
    pad_token_id     = tokenizer.eos_token_id,
)

response = tokenizer.decode(outputs[0][inputs.shape[-1]:], skip_special_tokens=True)
print("=== Cau tra loi cua model ===")
print(response)
