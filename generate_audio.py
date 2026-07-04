"""
Tool tạo file audio mp3 (giọng đọc tiếng Trung chuẩn) từ danh sách câu/từ,
dùng Google Cloud Text-to-Speech.

CHUẨN BỊ (chỉ làm 1 lần):
1. Tạo tài khoản Google Cloud (miễn phí): https://console.cloud.google.com
2. Bật API "Cloud Text-to-Speech API" cho project của bạn.
3. Tạo Service Account -> tải file JSON key về máy (vd: gcp-key.json).
4. Cài thư viện:
     pip install google-cloud-texttospeech
5. Thiết lập biến môi trường trỏ tới file key trước khi chạy script:
   - Windows (Command Prompt):
       set GOOGLE_APPLICATION_CREDENTIALS=duong_dan\gcp-key.json
   - Windows (PowerShell):
       $env:GOOGLE_APPLICATION_CREDENTIALS="duong_dan\gcp-key.json"

CÁCH DÙNG:
1. Chuẩn bị 1 file text (.txt) hoặc dùng thẳng data/vocab.json / data/dialogues.json.
   - Nếu dùng file .txt: mỗi dòng là 1 câu/từ cần đọc, KHÔNG cần đặt tên file mp3
     (script sẽ tự đặt tên theo số thứ tự dòng, hoặc theo nội dung nếu ngắn).
2. Chạy lệnh:
     python generate_audio.py --input cau_can_doc.txt --outdir assets/audio
   Hoặc tạo audio cho toàn bộ từ vựng:
     python generate_audio.py --json data/vocab.json --field hanzi --outdir assets/audio
   Hoặc tạo audio cho toàn bộ câu đàm thoại:
     python generate_audio.py --json data/dialogues.json --field hanzi --outdir assets/audio

3. Script sẽ tự bỏ qua các câu đã có file mp3 rồi (tránh tạo lại tốn phí/thời gian).
4. Sau khi chạy xong, mở lại file Excel (vocab_data.xlsx) và điền tên file mp3
   tương ứng vào cột "Audio" cho từng dòng, rồi chạy lại convert_excel_to_json.py.

LƯU Ý CHI PHÍ:
Google Cloud TTS có gói miễn phí 1 triệu ký tự/tháng (giọng WaveNet) hoặc
4 triệu ký tự/tháng (giọng Standard). Với vài trăm từ/câu ngắn, gần như luôn nằm
trong hạn mức miễn phí. Kiểm tra giá mới nhất tại: https://cloud.google.com/text-to-speech/pricing
"""

import argparse
import json
import os
import re
import sys
import unicodedata


def slugify(text: str, max_len: int = 40) -> str:
    """Chuyển văn bản thành tên file an toàn (bỏ dấu, ký tự đặc biệt)."""
    text = text.strip()
    # Giữ lại chữ Hán + chữ cái/số, thay khoảng trắng và ký tự khác bằng _
    text = re.sub(r"[^\w一-鿿]+", "_", text)
    text = text.strip("_")
    if not text:
        text = "audio"
    return text[:max_len]


def load_sentences_from_txt(path):
    with open(path, "r", encoding="utf-8") as f:
        lines = [line.strip() for line in f if line.strip()]
    return lines


def load_sentences_from_json(path, field):
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    sentences = []
    for item in data:
        value = item.get(field)
        if value:
            sentences.append(value)
    return sentences


def synthesize(client, texttospeech, text: str, voice_name: str, speaking_rate: float):
    input_text = texttospeech.SynthesisInput(text=text)
    voice = texttospeech.VoiceSelectionParams(
        language_code="cmn-CN",
        name=voice_name,
    )
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3,
        speaking_rate=speaking_rate,
    )
    response = client.synthesize_speech(
        input=input_text, voice=voice, audio_config=audio_config
    )
    return response.audio_content


def main():
    parser = argparse.ArgumentParser(description="Tạo file mp3 giọng đọc tiếng Trung bằng Google Cloud TTS")
    parser.add_argument("--input", help="File .txt, mỗi dòng 1 câu cần đọc")
    parser.add_argument("--json", help="File .json (vd data/vocab.json hoặc data/dialogues.json)")
    parser.add_argument("--field", default="hanzi", help="Tên trường chứa chữ Hán trong file JSON (mặc định: hanzi)")
    parser.add_argument("--outdir", default="assets/audio", help="Thư mục lưu file mp3 (mặc định: assets/audio)")
    parser.add_argument(
        "--voice",
        default="cmn-CN-Wavenet-A",
        help="Tên giọng đọc Google Cloud TTS. Một số lựa chọn phổ biến: "
        "cmn-CN-Wavenet-A (nữ), cmn-CN-Wavenet-B (nam), cmn-CN-Wavenet-C (nam), cmn-CN-Wavenet-D (nữ)",
    )
    parser.add_argument("--rate", type=float, default=0.9, help="Tốc độ đọc, 1.0 = bình thường, 0.9 = chậm hơn 1 chút (mặc định: 0.9)")
    args = parser.parse_args()

    if not args.input and not args.json:
        print("Cần chỉ định --input file.txt HOẶC --json file.json")
        sys.exit(1)

    try:
        from google.cloud import texttospeech
    except ImportError:
        print("Thiếu thư viện. Cài bằng lệnh: pip install google-cloud-texttospeech")
        sys.exit(1)

    if not os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
        print("Chưa thiết lập biến môi trường GOOGLE_APPLICATION_CREDENTIALS.")
        print("Xem hướng dẫn ở đầu file generate_audio.py để thiết lập trước khi chạy.")
        sys.exit(1)

    if args.input:
        sentences = load_sentences_from_txt(args.input)
    else:
        sentences = load_sentences_from_json(args.json, args.field)

    if not sentences:
        print("Không tìm thấy câu/từ nào để tạo audio.")
        sys.exit(1)

    os.makedirs(args.outdir, exist_ok=True)
    client = texttospeech.TextToSpeechClient()

    created = 0
    skipped = 0
    failed = []

    for text in sentences:
        filename = slugify(text) + ".mp3"
        filepath = os.path.join(args.outdir, filename)

        if os.path.exists(filepath):
            skipped += 1
            continue

        try:
            audio_content = synthesize(client, texttospeech, text, args.voice, args.rate)
            with open(filepath, "wb") as out:
                out.write(audio_content)
            created += 1
            print(f"Đã tạo: {filename}  <-  {text}")
        except Exception as e:
            failed.append((text, str(e)))
            print(f"LỖI với câu '{text}': {e}")

    print()
    print(f"Hoàn tất. Đã tạo mới: {created} file. Bỏ qua (đã có sẵn): {skipped} file.")
    if failed:
        print(f"Có {len(failed)} câu bị lỗi, xem chi tiết ở trên.")


if __name__ == "__main__":
    main()
