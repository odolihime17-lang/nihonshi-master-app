"""
backend/core/pdf_utils.py — PDF text extraction using pypdf.
Supports both file bytes and Google Drive URL.
"""

from __future__ import annotations

import io
import re
import requests
from pypdf import PdfReader


def extract_text_from_pdf(pdf_bytes: bytes, max_pages: int = 30) -> str:
    """
    Extract text from PDF bytes.
    """
    return _extract_text_from_bytes(pdf_bytes, max_pages)


def extract_text_from_drive_url(url: str, max_pages: int = 30) -> str:
    """
    Download a PDF from a Google Drive sharing URL and extract text.
    """
    file_id = _extract_drive_file_id(url)
    if not file_id:
        raise ValueError(
            "Google Drive の共有リンクの形式が正しくありません。"
        )

    download_url = f"https://drive.google.com/uc?export=download&id={file_id}"
    response = requests.get(download_url, timeout=30)

    if response.status_code != 200:
        raise RuntimeError(
            f"ファイルのダウンロードに失敗しました（HTTP {response.status_code}）。"
        )

    content_type = response.headers.get("Content-Type", "")
    if "text/html" in content_type:
        confirm_match = re.search(r'confirm=([0-9A-Za-z_-]+)', response.text)
        if confirm_match:
            confirm_url = f"{download_url}&confirm={confirm_match.group(1)}"
            response = requests.get(confirm_url, timeout=30)
        else:
            raise RuntimeError("ファイルにアクセスできません。共有設定を確認してください。")

    pdf_bytes = response.content
    if len(pdf_bytes) < 100:
        raise RuntimeError("ダウンロードしたファイルが不正です。")

    return _extract_text_from_bytes(pdf_bytes, max_pages)


def _extract_drive_file_id(url: str) -> str | None:
    match = re.search(r'/file/d/([a-zA-Z0-9_-]+)', url)
    if match:
        return match.group(1)
    match = re.search(r'[?&]id=([a-zA-Z0-9_-]+)', url)
    if match:
        return match.group(1)
    return None


def _extract_text_from_bytes(pdf_bytes: bytes, max_pages: int = 30) -> str:
    reader = PdfReader(io.BytesIO(pdf_bytes))
    total_pages = len(reader.pages)
    pages_to_read = min(total_pages, max_pages)
    pages_text: list[str] = []
    for page_num in range(pages_to_read):
        text = reader.pages[page_num].extract_text() or ""
        if text.strip():
            pages_text.append(f"--- ページ {page_num + 1} ---\n{text}")
    if total_pages > max_pages:
        pages_text.append(f"\n(※ {total_pages}ページ中、最初の{max_pages}ページのみ抽出)")
    return "\n\n".join(pages_text)
