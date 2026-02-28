"""
backend/core/db.py — Supabase database module for quiz history & PDF persistence.
Supports per-user data isolation via user_id.
"""

from __future__ import annotations

import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

def _get_supabase_config() -> tuple[str, str]:
    """Get Supabase URL and Key from environment variables."""
    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_KEY", "")
    return url, key

def _get_client():
    """Return a Supabase client instance."""
    from supabase import create_client
    url, key = _get_supabase_config()
    if not url or not key:
        raise RuntimeError(
            "SUPABASE_URL と SUPABASE_KEY が設定されていません。\n"
            ".env ファイルに設定してください。"
        )
    return create_client(url, key)

def init_db() -> None:
    """Verify Supabase connection is working."""
    try:
        client = _get_client()
        client.table("quiz_results").select("id").limit(1).execute()
    except Exception as e:
        print(f"[db.py] Supabase connection warning: {e}")

def save_result(
    question: str,
    user_answer: str,
    correct_answer: str,
    is_correct: bool,
    era: str,
    field: str,
    user_id: str = "anonymous",
) -> None:
    """Save a single quiz result to Supabase."""
    try:
        client = _get_client()
        client.table("quiz_results").insert({
            "user_id": user_id,
            "question_text": question,
            "user_answer": user_answer,
            "correct_answer": correct_answer,
            "is_correct": is_correct,
            "era": era,
            "field": field,
            "created_at": datetime.now().isoformat(),
        }).execute()
    except Exception as e:
        print(f"[db.py] save_result error: {e}")

def get_weak_areas(limit: int = 5, user_id: str = "anonymous") -> list[dict]:
    """Return the (era, field) pairs with the highest error rates."""
    try:
        client = _get_client()
        resp = client.table("quiz_results").select(
            "era, field, is_correct"
        ).eq("user_id", user_id).execute()

        rows = resp.data
        if not rows:
            return []

        from collections import defaultdict
        stats: dict[tuple, dict] = defaultdict(lambda: {"total": 0, "wrong": 0})
        for r in rows:
            key = (r["era"], r["field"])
            stats[key]["total"] += 1
            if not r["is_correct"]:
                stats[key]["wrong"] += 1

        result = []
        for (era, field), s in stats.items():
            if s["total"] >= 2:
                error_rate = round(s["wrong"] / s["total"] * 100, 1)
                result.append({
                    "era": era,
                    "field": field,
                    "total": s["total"],
                    "wrong": s["wrong"],
                    "error_rate": error_rate,
                })

        result.sort(key=lambda x: x["error_rate"], reverse=True)
        return result[:limit]
    except Exception as e:
        print(f"[db.py] get_weak_areas error: {e}")
        return []

def get_recent_wrong_questions(limit: int = 20, user_id: str = "anonymous") -> list[str]:
    """Return recent incorrectly-answered question texts."""
    try:
        client = _get_client()
        resp = (
            client.table("quiz_results")
            .select("question_text")
            .eq("user_id", user_id)
            .eq("is_correct", False)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return list({r["question_text"] for r in resp.data})
    except Exception as e:
        print(f"[db.py] get_recent_wrong_questions error: {e}")
        return []

def get_stats(user_id: str = "anonymous") -> dict:
    """Return overall and per-era/field accuracy stats."""
    empty = {"total": 0, "correct": 0, "accuracy": 0.0, "by_era": []}
    try:
        client = _get_client()
        resp = client.table("quiz_results").select(
            "is_correct, era, field"
        ).eq("user_id", user_id).execute()

        rows = resp.data
        if not rows:
            return empty

        total = len(rows)
        correct = sum(1 for r in rows if r["is_correct"])
        accuracy = round(correct / total * 100, 1) if total > 0 else 0.0

        from collections import defaultdict
        era_stats: dict[str, dict] = defaultdict(lambda: {"total": 0, "correct": 0})

        for r in rows:
            era_stats[r["era"]]["total"] += 1
            if r["is_correct"]:
                era_stats[r["era"]]["correct"] += 1

        by_era = sorted(
            [
                {
                    "era": era,
                    "total": s["total"],
                    "correct": s["correct"],
                    "accuracy": round(s["correct"] / s["total"] * 100, 1),
                }
                for era, s in era_stats.items()
            ],
            key=lambda x: x["total"],
            reverse=True,
        )

        return {
            "total": total,
            "correct": correct,
            "accuracy": accuracy,
            "by_era": by_era,
        }
    except Exception as e:
        print(f"[db.py] get_stats error: {e}")
        return empty

def save_pdf(user_id: str, file_name: str, pdf_text: str) -> None:
    """Save PDF text to Supabase."""
    try:
        client = _get_client()
        existing = (
            client.table("saved_pdfs")
            .select("id")
            .eq("user_id", user_id)
            .eq("file_name", file_name)
            .limit(1)
            .execute()
        )
        if existing.data:
            return
        client.table("saved_pdfs").insert({
            "user_id": user_id,
            "file_name": file_name,
            "pdf_text": pdf_text,
            "char_count": len(pdf_text),
            "created_at": datetime.now().isoformat(),
        }).execute()
    except Exception as e:
        print(f"[db.py] save_pdf error: {e}")

def get_saved_pdfs(user_id: str = "anonymous") -> list[dict]:
    """Return list of saved PDFs."""
    try:
        client = _get_client()
        resp = (
            client.table("saved_pdfs")
            .select("id, file_name, char_count, created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        return resp.data
    except Exception as e:
        print(f"[db.py] get_saved_pdfs error: {e}")
        return []

def delete_saved_pdf(pdf_id: int) -> None:
    """Delete a saved PDF by ID."""
    try:
        client = _get_client()
        client.table("saved_pdfs").delete().eq("id", pdf_id).execute()
    except Exception as e:
        print(f"[db.py] delete_saved_pdf error: {e}")

def get_pdf_text(pdf_id: int) -> str:
    """Get the full text of a saved PDF by ID."""
    try:
        client = _get_client()
        resp = (
            client.table("saved_pdfs")
            .select("pdf_text")
            .eq("id", pdf_id)
            .limit(1)
            .execute()
        )
        if resp.data:
            return resp.data[0]["pdf_text"]
        return ""
    except Exception as e:
        print(f"[db.py] get_pdf_text error: {e}")
        return ""
