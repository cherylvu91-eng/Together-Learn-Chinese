"""
Script noi bo, dung trong GitHub Actions (khong can chay tay).
Sau khi generate_audio.py tao xong cac file mp3 con thieu, script nay
dien lai ten file mp3 vao cot "Audio" trong vocab_data.xlsx va data/vocab.json,
dam bao web luon biet dung file audio nao cho tung tu.
"""

import json
import re
import openpyxl


def slugify(text, max_len=40):
    text = text.strip()
    text = re.sub(r"[^\w\u4e00-\u9fff]+", "_", text)
    text = text.strip("_")
    if not text:
        text = "audio"
    return text[:max_len]


def update_excel(path):
    wb = openpyxl.load_workbook(path)
    ws = wb.active
    headers = [c.value for c in ws[1]]
    if "Audio" not in headers or "Tu/Cum tu" not in headers and "Từ/Cụm từ" not in headers:
        hanzi_key = "Từ/Cụm từ" if "Từ/Cụm từ" in headers else "Tu/Cum tu"
    else:
        hanzi_key = "Từ/Cụm từ"
    audio_col = headers.index("Audio") + 1
    hanzi_col = headers.index(hanzi_key) + 1

    updated = 0
    for row in ws.iter_rows(min_row=2):
        hanzi = row[hanzi_col - 1].value
        if hanzi:
            row[audio_col - 1].value = slugify(str(hanzi)) + ".mp3"
            updated += 1

    wb.save(path)
    return updated


def update_json(path):
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    for item in data:
        if item.get("hanzi"):
            item["audio"] = slugify(item["hanzi"]) + ".mp3"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return len(data)


if __name__ == "__main__":
    n1 = update_excel("vocab_data.xlsx")
    n2 = update_json("data/vocab.json")
    print(f"Da cap nhat cot Audio: {n1} dong trong Excel, {n2} muc trong vocab.json")
