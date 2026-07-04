"""
Tool tao file audio mp3 (giong doc tieng Trung) tu danh sach cau/tu vung,
dung gTTS (Google Text-to-Speech mien phi, khong can API key, khong can tai khoan).

CHUAN BI (chi lam 1 lan):
    pip install gTTS

CACH DUNG:
1. Tao audio cho toan bo cau dam thoai:
     python generate_audio.py --json data/dialogues.json --field hanzi --outdir assets/audio

2. Tao audio cho toan bo tu vung:
     python generate_audio.py --json data/vocab.json --field hanzi --outdir assets/audio

3. Hoac dung file .txt tuy y, moi dong la 1 cau/tu can doc:
     python generate_audio.py --input cau_can_doc.txt --outdir assets/audio

4. Script se tu bo qua cau da co file mp3 roi (khong tao lai, tiet kiem thoi gian).

5. Sau khi chay xong, mo file Excel (vocab_data.xlsx hoac vocab_data_hsk2.xlsx)
   dien ten file mp3 tuong ung vao cot "Audio" cho tung dong, roi chay lai
   convert_excel_to_json.py de cap nhat vao web.

LUU Y:
- gTTS can ket noi Internet khi chay (no goi toi server cua Google o che do dich vu mien phi,
  khac voi Google Cloud TTS phai dang ky tai khoan/API key).
- Chat luong giong doc on, dam bao ro rang, phu hop cho hoc tap; khong tu nhien bang
  giong WaveNet cua Google Cloud TTS tra phi, nhung mien phi hoan toan va de dung ngay.
- Neu can dung nhieu (hang nghin cau), Google co the tam thoi chan do goi qua nhieu/qua nhanh.
  Neu gap loi lien tuc, doi vai phut roi chay lai.
"""

import argparse
import json
import os
import re
import sys
import time


def slugify(text, max_len=40):
    """Chuyen van ban thanh ten file an toan (giu chu Han, bo ky tu dac biet)."""
    text = text.strip()
    text = re.sub(r"[^\w\u4e00-\u9fff]+", "_", text)
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


def main():
    parser = argparse.ArgumentParser(description="Tao file mp3 giong doc tieng Trung bang gTTS (mien phi)")
    parser.add_argument("--input", help="File .txt, moi dong 1 cau can doc")
    parser.add_argument("--json", help="File .json (vd data/vocab.json hoac data/dialogues.json)")
    parser.add_argument("--field", default="hanzi", help="Ten truong chua chu Han trong file JSON (mac dinh: hanzi)")
    parser.add_argument("--outdir", default="assets/audio", help="Thu muc luu file mp3 (mac dinh: assets/audio)")
    parser.add_argument("--slow", action="store_true", help="Doc cham hon binh thuong (tot cho hoc sinh moi hoc)")
    parser.add_argument("--delay", type=float, default=0.3, help="Thoi gian nghi giua cac lan goi API, giay (mac dinh: 0.3)")
    args = parser.parse_args()

    if not args.input and not args.json:
        print("Can chi dinh --input file.txt HOAC --json file.json")
        sys.exit(1)

    try:
        from gtts import gTTS
    except ImportError:
        print("Thieu thu vien. Cai bang lenh: pip install gTTS")
        sys.exit(1)

    if args.input:
        sentences = load_sentences_from_txt(args.input)
    else:
        sentences = load_sentences_from_json(args.json, args.field)

    if not sentences:
        print("Khong tim thay cau/tu nao de tao audio.")
        sys.exit(1)

    os.makedirs(args.outdir, exist_ok=True)

    created = 0
    skipped = 0
    failed = []

    print(f"Chuan bi tao audio cho {len(sentences)} cau/tu, luu vao thu muc: {args.outdir}")
    print()

    for i, text in enumerate(sentences, start=1):
        filename = slugify(text) + ".mp3"
        filepath = os.path.join(args.outdir, filename)

        if os.path.exists(filepath):
            skipped += 1
            continue

        try:
            tts = gTTS(text=text, lang="zh-CN", slow=args.slow)
            tts.save(filepath)
            created += 1
            print(f"[{i}/{len(sentences)}] Da tao: {filename}  <-  {text}")
            time.sleep(args.delay)
        except Exception as e:
            failed.append((text, str(e)))
            print(f"[{i}/{len(sentences)}] LOI voi cau '{text}': {e}")

    print()
    print(f"Hoan tat. Da tao moi: {created} file. Bo qua (da co san): {skipped} file.")
    if failed:
        print(f"Co {len(failed)} cau bi loi:")
        for text, err in failed:
            print(f"  - {text}: {err}")


if __name__ == "__main__":
    main()
