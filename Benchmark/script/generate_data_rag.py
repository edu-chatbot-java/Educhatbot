import os
import uuid
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct

def process_and_upload():
    # Load environment variables
    load_dotenv()
    
    # ------------------- Cấu hình -------------------
    PDF_PATH = r"f:\IT project\JAVA\Project\Benchmark\data\pdf\LearnJava.pdf"
    COLLECTION_NAME = "java_oop_chunks"
    MODEL_NAME = "intfloat/multilingual-e5-small"
    
    # Nếu chưa có QDRANT_URL, nó sẽ thử local. 
    # Thay 'QDRANT_API_KEY' trong .env hoặc dùng API_KEY_1
    qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333") 
    qdrant_api_key = os.getenv("QDRANT_API_KEY", os.getenv("API_KEY_1"))
    # ------------------------------------------------
    
    if not os.path.exists(PDF_PATH):
        print(f"Lỗi: Không tìm thấy file tại {PDF_PATH}")
        return

    print(f"Đang đọc file PDF từ {PDF_PATH}...")
    loader = PyPDFLoader(PDF_PATH)
    docs = loader.load()
    print(f"Đã load {len(docs)} trang.")
    
    print("Đang băm nhỏ (chunking) văn bản...")
    # Mô hình E5-small xử lý tối đa ~512 tokens.
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
        separators=["\n\n", "\n", ".", "?", "!", " ", ""]
    )
    chunks = text_splitter.split_documents(docs)
    print(f"Đã tạo {len(chunks)} chunks.")
    
    print(f"Đang tải mô hình Embedding: {MODEL_NAME}...")
    embeddings_model = HuggingFaceEmbeddings(model_name=MODEL_NAME)
    
    print("Đang sinh Vectors (Embeddings)... Quá trình này có thể mất chút thời gian.")
    # Lưu ý: Các mô hình E5 yêu cầu prefix 'passage: ' cho văn bản lưu trong DB
    texts = [f"passage: {chunk.page_content}" for chunk in chunks]
    vectors = embeddings_model.embed_documents(texts)
    
    print(f"Kết nối tới Qdrant Cloud (URL: {qdrant_url})...")
    client = QdrantClient(
        url=qdrant_url, 
        api_key=qdrant_api_key
    )
    
    # intfloat/multilingual-e5-small có đầu ra là vector 384 chiều
    vector_size = 384 
    
    if not client.collection_exists(collection_name=COLLECTION_NAME):
        print(f"Đang tạo collection '{COLLECTION_NAME}' trên Qdrant...")
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
        )
    else:
        print(f"Collection '{COLLECTION_NAME}' đã tồn tại.")
    
    print(f"Đang đẩy (upload) {len(vectors)} points lên Qdrant...")
    points = []
    for chunk, vector in zip(chunks, vectors):
        points.append(
            PointStruct(
                id=str(uuid.uuid4()),
                vector=vector,
                payload={
                    "content": chunk.page_content,
                    "page": chunk.metadata.get("page", 0),
                    "source": chunk.metadata.get("source", ""),
                    "subject_id": "JAVA_OOP"
                }
            )
        )
        
        # Đẩy từng lô 100 points
        if len(points) >= 100:
            client.upsert(collection_name=COLLECTION_NAME, points=points)
            points = []
            
    # Đẩy nốt phần còn lại
    if points:
        client.upsert(collection_name=COLLECTION_NAME, points=points)
        
    print("✅ Đã đồng bộ toàn bộ dữ liệu PDF lên Qdrant Cloud thành công!")

if __name__ == "__main__":
    process_and_upload()
