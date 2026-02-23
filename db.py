"""
db.py — SQLite database module for quiz history persistence.
"""

from __future__ import annotations

import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "history_quiz.db")


def _get_connection() -> sqlite3.Connection:
    """Get a database connection with row factory enabled."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Create the quiz_results table if it does not exist."""
    conn = _get_connection()
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS quiz_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                question_text TEXT NOT NULL,
                user_answer TEXT NOT NULL,
                correct_answer TEXT NOT NULL,
                is_correct INTEGER NOT NULL,
                era TEXT NOT NULL,
                field TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)
        conn.commit()
    finally:
        conn.close()


def save_result(
    question: str,
    user_answer: str,
    correct_answer: str,
    is_correct: bool,
    era: str,
    field: str,
) -> None:
    """Save a single quiz result to the database."""
    conn = _get_connection()
    try:
        conn.execute(
            """
            INSERT INTO quiz_results
                (question_text, user_answer, correct_answer, is_correct, era, field, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                question,
                user_answer,
                correct_answer,
                1 if is_correct else 0,
                era,
                field,
                datetime.now().isoformat(),
            ),
        )
        conn.commit()
    finally:
        conn.close()


def get_weak_areas(limit: int = 5) -> list[dict]:
    """
    Return the (era, field) pairs with the highest error rates.
    Only considers pairs with at least 2 attempts.
    """
    conn = _get_connection()
    try:
        rows = conn.execute(
            """
            SELECT era, field,
                   COUNT(*) AS total,
                   SUM(CASE WHEN is_correct = 0 THEN 1 ELSE 0 END) AS wrong,
                   ROUND(
                       CAST(SUM(CASE WHEN is_correct = 0 THEN 1 ELSE 0 END) AS REAL)
                       / COUNT(*) * 100, 1
                   ) AS error_rate
            FROM quiz_results
            GROUP BY era, field
            HAVING total >= 2
            ORDER BY error_rate DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def get_recent_wrong_questions(limit: int = 20) -> list[str]:
    """Return recent incorrectly-answered question texts for prompt injection."""
    conn = _get_connection()
    try:
        rows = conn.execute(
            """
            SELECT DISTINCT question_text
            FROM quiz_results
            WHERE is_correct = 0
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
        return [r["question_text"] for r in rows]
    finally:
        conn.close()


def get_stats() -> dict:
    """
    Return overall and per-era/field accuracy stats.
    Returns: {
        "total": int,
        "correct": int,
        "accuracy": float,
        "by_era": [...],
        "by_field": [...]
    }
    """
    conn = _get_connection()
    try:
        # Overall
        row = conn.execute(
            """
            SELECT COUNT(*) AS total,
                   SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) AS correct
            FROM quiz_results
            """
        ).fetchone()
        total = row["total"]
        correct = row["correct"] or 0
        accuracy = round(correct / total * 100, 1) if total > 0 else 0.0

        # By era
        by_era = [
            dict(r)
            for r in conn.execute(
                """
                SELECT era,
                       COUNT(*) AS total,
                       SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) AS correct,
                       ROUND(
                           CAST(SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) AS REAL)
                           / COUNT(*) * 100, 1
                       ) AS accuracy
                FROM quiz_results
                GROUP BY era
                ORDER BY total DESC
                """
            ).fetchall()
        ]

        # By field
        by_field = [
            dict(r)
            for r in conn.execute(
                """
                SELECT field,
                       COUNT(*) AS total,
                       SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) AS correct,
                       ROUND(
                           CAST(SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) AS REAL)
                           / COUNT(*) * 100, 1
                       ) AS accuracy
                FROM quiz_results
                GROUP BY field
                ORDER BY total DESC
                """
            ).fetchall()
        ]

        return {
            "total": total,
            "correct": correct,
            "accuracy": accuracy,
            "by_era": by_era,
            "by_field": by_field,
        }
    finally:
        conn.close()
