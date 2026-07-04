# Hướng dẫn thêm từ vựng mới (dùng VS Code + Python)

Dành cho người chưa biết code, đã cài sẵn Python và VS Code trên máy.

## Bước 1 — Mở project bằng VS Code
Mở VS Code → **File → Open Folder** → chọn thư mục project (ví dụ `testweb`).

## Bước 2 — Sửa file Excel
Mở file `vocab_data.xlsx` bằng Microsoft Excel (không mở bằng VS Code vì VS Code không đọc được file Excel).

Thêm dòng mới vào cuối bảng, điền đủ 8 cột:

| Cột | Ý nghĩa | Ví dụ |
|---|---|---|
| Từ/Cụm từ | Chữ Hán | 谢谢 |
| Pinyin | Phiên âm | xièxie |
| Hán Việt | Âm Hán Việt | tạ tạ |
| Nghĩa tiếng Việt | Nghĩa | Cảm ơn |
| Loại từ | Từ loại | Cụm từ |
| Ví dụ tiếng Trung | Câu ví dụ | 谢谢你！ |
| Cấp độ HSK | Chỉ nhập số | 1 |
| Audio | Tên file mp3 (có thể để trống) | xiexie.mp3 |

Có thể để trống ô nào chưa có dữ liệu. Lưu file lại (Ctrl+S).

Nếu có file âm thanh mp3, copy file đó vào thư mục `assets/audio/` và ghi đúng tên file vào cột Audio.

## Bước 3 — Cài thư viện (chỉ làm 1 lần đầu tiên)
Mở Terminal trong VS Code: menu **Terminal → New Terminal**.

Gõ lệnh:
```
pip install openpyxl
```
Đây là thư viện giúp Python đọc được file Excel. Chỉ cần cài 1 lần trên máy, các lần sau không cần lặp lại.

## Bước 4 — Chạy script chuyển đổi
Vẫn trong Terminal, gõ:
```
python convert_excel_to_json.py
```
Script sẽ đọc file `vocab_data.xlsx` và tự động tạo lại file `data/vocab.json` (file mà website thực sự sử dụng).

Nếu thấy dòng: `Đã chuyển đổi XX từ vựng -> data/vocab.json` là thành công.

Nếu báo thiếu cột, kiểm tra lại tên cột trong Excel có đúng chính tả như bảng ở Bước 2 không.

## Bước 5 — Đẩy thay đổi lên GitHub
Trong Terminal, gõ lần lượt 3 lệnh:
```
git add .
git commit -m "Cap nhat tu vung moi"
git push
```

- `git add .`: gom tất cả file đã thay đổi lại để chuẩn bị lưu.
- `git commit -m "..."`: lưu lại thành một điểm chốt, kèm ghi chú mô tả.
- `git push`: đẩy thay đổi lên GitHub.

## Bước 6 — Kiểm tra kết quả
Đợi khoảng 1 phút, mở lại trang web:
https://cherylvu91-eng.github.io/Together-Learn-Chinese/

Bấm Ctrl+F5 (hoặc Cmd+Shift+R trên Mac) để làm mới trang hoàn toàn, tránh trình duyệt hiển thị bản cũ đã lưu cache. Từ mới sẽ xuất hiện trong danh sách.

## Xử lý khi gặp lỗi thường gặp
- **"pip không được nhận diện"**: Python chưa được thêm vào PATH khi cài đặt. Cài lại Python và tick chọn "Add Python to PATH".
- **"git không được nhận diện"**: Git chưa cài hoặc chưa khởi động lại Terminal sau khi cài.
- **Web không hiện từ mới sau khi push**: đợi thêm 1-2 phút, hoặc kiểm tra tab Actions trên GitHub xem có báo lỗi không.
