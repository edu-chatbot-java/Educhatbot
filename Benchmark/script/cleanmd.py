import re

input_file = "f:\IT project\JAVA\Project\Benchmark\data\markdown\JavaCore.md"
output_file = "f:\IT project\JAVA\Project\Benchmark\data\markdown\JavaCore_Final_Clean.md"

print("🧹 Đang tiến hành xóa sạch mã rác (cid) từ file MarkItDown...")

with open(input_file, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Xóa bỏ hoàn toàn các cụm (cid:X)
clean_content = re.sub(r'\(cid:\d+\)', '', content)

# 2. Dọn dẹp các khoảng trắng thừa hoặc xuống dòng vô lý nếu có
clean_content = re.sub(r'\n\s*\n', '\n\n', clean_content)

with open(output_file, "w", encoding="utf-8") as f:
    f.write(clean_content)

print(f"🎉 Xử lý xong! File sạch tuyệt đối lưu tại: {output_file}")