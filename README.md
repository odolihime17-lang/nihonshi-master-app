# 日本史マスター 🏯

AIが生成する4択問題で日本史の実力を鍛える学習Webアプリ

## 機能

- 📄 PDF アップロード / Google Drive URL からプリントを読み込み
- 🤖 Gemini AI が4択問題を自動生成
- 📊 苦手分野の自動分析＆重点出題
- 💾 SQLite で学習履歴を保存

## セットアップ

### ローカル実行

```bash
# .env に API キーを設定
echo 'GEMINI_API_KEY="your-key"' > .env

# 依存ライブラリをインストール
pip install -r requirements.txt

# アプリを起動
streamlit run app.py
```

### Streamlit Community Cloud

1. このリポジトリを GitHub に push
2. [share.streamlit.io](https://share.streamlit.io) でデプロイ
3. Settings → Secrets に以下を追加：
   ```toml
   GEMINI_API_KEY = "your-api-key"
   ```
