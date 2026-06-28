# Play Thema（今伸ばしたいプレーテーマ）

Soccer Type 診断アプリから切り出した、プレーテーマチェック機能の独立アプリです。

## セットアップ

```bash
npm install
npm run dev
```

http://localhost:3000 → `/soccer-check` へリダイレクトされます。

## ルート

| パス | 内容 |
|------|------|
| `/` | `/soccer-check` へリダイレクト |
| `/soccer-check` | イントロ |
| `/soccer-check/quiz` | カテゴリ別選択 |
| `/soccer-check/result` | 結果表示 |

## フォルダ構成

```
src/
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── page.tsx              # → /soccer-check へリダイレクト
│   └── soccer-check/
│       ├── page.tsx
│       ├── quiz/page.tsx
│       └── result/page.tsx
├── data/soccerIssues.ts      # テーマデータ
├── types/soccerCheck.ts      # 型定義
└── lib/
    ├── soccerCheckStorage.ts # localStorage
    └── soccerCheckScoring.ts # 集計（任意）
```

## 環境変数

不要（静的クライアントアプリ）
