import os
import uuid
from dotenv import load_dotenv
# from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct

def process_and_upload():
    # Load environment variables
    load_dotenv()
    
    # ------------------- Cấu hình -------------------
    PDF_PATH = r"f:\IT project\JAVA\Project\Benchmark\data\pdf\JavaCore.pdf"
    START_FROM_CHAPTER = 7 # Bắt đầu xử lý từ chương mấy (nếu = None thì xử lý toàn bộ)
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

    print(f"Đang đọc PDF bằng MarkItDown từ {PDF_PATH}...")
    from markitdown import MarkItDown
    import re
    from langchain_core.documents import Document
    from langchain_text_splitters import MarkdownHeaderTextSplitter
    
    md = MarkItDown()
    result = md.convert(PDF_PATH)
    full_text = result.text_content
                
    # Cắt bỏ phần mục lục và các chương trước đó nếu có cấu hình START_FROM_CHAPTER
    if START_FROM_CHAPTER is not None:
        pattern = rf'(?i)Chương\s*{START_FROM_CHAPTER}'
        matches = list(re.finditer(pattern, full_text))
        if len(matches) >= 2:
            # Thông thường match thứ 2 là chương thật (match 1 ở mục lục)
            full_text = full_text[matches[1].start():]
        elif len(matches) == 1:
            full_text = full_text[matches[0].start():]
        else:
            print(f"Cảnh báo: Không tìm thấy 'Chương {START_FROM_CHAPTER}' trong text.")
            
    # Lưu file markdown để kiểm tra/tái sử dụng
    md_dir = r"f:\IT project\JAVA\Project\Benchmark\data\markdown"
    os.makedirs(md_dir, exist_ok=True)
    base_name = os.path.basename(PDF_PATH)
    md_filename = os.path.splitext(base_name)[0] + ".md"
    md_output_path = os.path.join(md_dir, md_filename)
    
    print(f"Đang lưu file Markdown xuất ra vào: {md_output_path}")
    with open(md_output_path, "w", encoding="utf-8") as f:
        f.write(full_text)
        
    print("Đang băm nhỏ (chunking) văn bản theo cấu trúc Header (Semantic Chunking)...")
    
    # Định nghĩa các cấp độ Header để phân tách
    headers_to_split_on = [
        ("#", "Header 1"),      # Thường là tên sách / Chương lớn
        ("##", "Header 2"),     # Thường là Chương (Chapter)
        ("###", "Header 3"),    # Thường là mục 1.1, 1.2, Vocabulary, Exercises...
    ]
    markdown_splitter = MarkdownHeaderTextSplitter(
        headers_to_split_on=headers_to_split_on,
        strip_headers=False
    )
    semantic_chunks = markdown_splitter.split_text(full_text)
            
    # Các block Semantic có thể vẫn quá lớn so với giới hạn 512 tokens của E5-small.
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=600,
        chunk_overlap=60,
        separators=["\n\n", "\n", ".", "?", "!", " ", ""]
    )
    chunks = text_splitter.split_documents(semantic_chunks)
    print(f"Đã tạo {len(chunks)} chunks bằng MarkItDown + MarkdownHeaderTextSplitter.")
    
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
