from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api import quiz, pdf, stats
from backend.core import db

app = FastAPI(
    title="日本史マスター API",
    description="日本史学習アプリのバックエンド API",
    version="1.0.0"
)

# CORS 設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 開発時は全て許可。本番環境では適切に制限すること。
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# データベース初期化（接続確認）
@app.on_event("startup")
async def startup_event():
    db.init_db()

# ルーターの登録
app.include_router(quiz.router)
app.include_router(pdf.router)
app.include_router(stats.router)

@app.get("/")
async def root():
    return {"message": "Nihonshi Master API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
