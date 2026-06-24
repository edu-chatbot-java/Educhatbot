FROM python:3.10-slim

WORKDIR /app

# Cài đặt các thư viện cần thiết
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy mã nguồn vào container
COPY . .

# Cloud Run tự động cấp cổng thông qua biến môi trường PORT. 
# Ta đặt mặc định là 8001 (giống cấu hình local) nhưng có thể bị ghi đè bởi Cloud Run.
ENV PORT=8001
EXPOSE ${PORT}

# Chạy FastAPI bằng Uvicorn và lắng nghe ở cổng do PORT quy định
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT}
