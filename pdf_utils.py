"""
pdf_utils.py — PDF text extraction using PyMuPDF.
Supports both file upload and Google Drive URL.
"""

from __future__ import annotations

import re
import fitz  # PyMuPDF
import requests


def extract_text_from_pdf(uploaded_file, max_pages: int = 30) -> str:
    """
    Extract text from a PDF uploaded via Streamlit's file_uploader.

    Args:
        uploaded_file: A Streamlit UploadedFile object (has .read() method).
        max_pages: Maximum number of pages to extract (default: 30).

    Returns:
        Concatenated text content of extracted pages.
    """
    pdf_bytes = uploaded_file.read()
    return _extract_text_from_bytes(pdf_bytes, max_pages)


def extract_text_from_drive_url(url: str, max_pages: int = 30) -> str:
    """
    Download a PDF from a Google Drive sharing URL and extract text.

    Supports URLs like:
        - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
        - https://drive.google.com/open?id=FILE_ID

    Args:
        url: A Google Drive sharing URL.
        max_pages: Maximum number of pages to extract.

    Returns:
        Concatenated text content of extracted pages.

    Raises:
        ValueError: If the URL format is invalid.
        RuntimeError: If the download fails.
    """
    file_id = _extract_drive_file_id(url)
    if not file_id:
        raise ValueError(
            "Google Drive の共有リンクの形式が正しくありません。\n"
            "「https://drive.google.com/file/d/ファイルID/view?usp=sharing」\n"
            "の形式で入力してください。"
        )

    # Use the direct download URL
    download_url = f"https://drive.google.com/uc?export=download&id={file_id}"
    response = requests.get(download_url, timeout=30)

    if response.status_code != 200:
        raise RuntimeError(
            f"ファイルのダウンロードに失敗しました（HTTP {response.status_code}）。\n"
            "ファイルの共有設定を「リンクを知っている全員」に変更してください。"
        )

    # Check if we got HTML (access denied or confirmation page) instead of PDF
    content_type = response.headers.get("Content-Type", "")
    if "text/html" in content_type:
        # Try to handle the "virus scan" confirmation page for large files
        confirm_match = re.search(r'confirm=([0-9A-Za-z_-]+)', response.text)
        if confirm_match:
            confirm_url = f"{download_url}&confirm={confirm_match.group(1)}"
            response = requests.get(confirm_url, timeout=30)
        else:
            raise RuntimeError(
                "ファイルにアクセスできません。\n"
                "ファイルの共有設定を「リンクを知っている全員が閲覧可」に変更してください。"
            )

    pdf_bytes = response.content

    if len(pdf_bytes) < 100:
        raise RuntimeError("ダウンロードしたファイルが空または不正です。共有設定を確認してください。")

    return _extract_text_from_bytes(pdf_bytes, max_pages)


def _extract_drive_file_id(url: str) -> str | None:
    """Extract the Google Drive file ID from various URL formats."""
    # Format: /file/d/FILE_ID/
    match = re.search(r'/file/d/([a-zA-Z0-9_-]+)', url)
    if match:
        return match.group(1)

    # Format: ?id=FILE_ID or &id=FILE_ID
    match = re.search(r'[?&]id=([a-zA-Z0-9_-]+)', url)
    if match:
        return match.group(1)

    return None


def _extract_text_from_bytes(pdf_bytes: bytes, max_pages: int = 30) -> str:
    """Extract text from PDF bytes."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")

    total_pages = len(doc)
    pages_to_read = min(total_pages, max_pages)

    pages_text: list[str] = []
    for page_num in range(pages_to_read):
        page = doc[page_num]
        text = page.get_text()
        if text.strip():
            pages_text.append(f"--- ページ {page_num + 1} ---\n{text}")

    doc.close()

    if total_pages > max_pages:
        pages_text.append(f"\n(※ {total_pages}ページ中、最初の{max_pages}ページのみ抽出)")

    return "\n\n".join(pages_text)
