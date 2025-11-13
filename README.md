# 🎭 VoiceDrama DAW

ボイスドラマ制作に特化したブラウザベースのDAW（デジタル・オーディオ・ワークステーション）です。

## ✨ 主な機能

### 🎚️ マルチトラック編集
- 最大30トラックのマルチトラック編集
- ドラッグ&ドロップでクリップを配置
- トラックごとのボリューム・ミュート・ソロ機能

### 📁 ファイル管理
- カテゴリ別ファイル管理（台詞/効果音/BGM/環境音/エフェクト）
- WAV・MP3形式の読み込み対応
- IndexedDBによる自動保存

### 🎛️ エフェクト
- 3バンドイコライザー（Low/Mid/High）
- W1 Limiter風のリミッター
  - Threshold調整
  - Release調整
  - Output Ceiling調整

### 💾 プロジェクト管理
- ブラウザのIndexedDBに自動保存
- プロジェクトファイルのダウンロード（.vddaw形式）
- プロジェクトのインポート機能

### 📤 書き出し
- WAV形式（16/24/32bit対応）
- MP3形式（開発中）
- サンプルレート選択（44.1kHz/48kHz/96kHz）

### 📱 レスポンシブデザイン
- PC・タブレット・スマホ対応
- タッチ操作最適化
- かわいいチョコレート系カラーテーマ

## 🚀 使い方

### 基本的な操作

1. **ファイルの追加**
   - 左サイドバーの「ファイル追加」ボタンをクリック
   - カテゴリタブを切り替えて分類

2. **トラックへの配置**
   - ファイルをトラックエリアにドラッグ&ドロップ
   - またはファイルをダブルクリックで自動追加

3. **編集**
   - クリップをドラッグして移動
   - ハンドルをドラッグしてトリミング（今後実装予定）
   - トラックのボリュームスライダーで音量調整

4. **エフェクト調整**
   - 右パネルでイコライザー・リミッターを調整
   - リアルタイムでプレビュー可能

5. **書き出し**
   - 「書き出し」ボタンをクリック
   - 形式とサンプルレートを選択
   - 「書き出し開始」でダウンロード

### ショートカットキー（今後実装予定）

- `Space`: 再生/一時停止
- `Ctrl + S`: プロジェクト保存
- `Ctrl + O`: プロジェクト読み込み
- `Delete`: 選択クリップを削除

## 🌐 GitHub Pagesへのデプロイ

### 1. リポジトリの作成

```bash
# ローカルでGit初期化
git init
git add .
git commit -m "Initial commit"

# GitHubにプッシュ
git remote add origin https://github.com/YOUR_USERNAME/voicedrama-daw.git
git branch -M main
git push -u origin main
```

### 2. GitHub Pagesの設定

1. GitHubリポジトリページを開く
2. Settings → Pages
3. Source: "Deploy from a branch"
4. Branch: `main` / `/ (root)` を選択
5. Save

数分後、`https://YOUR_USERNAME.github.io/voicedrama-daw/` でアクセス可能になります。

## 📂 ファイル構成

```
voicedrama-daw/
├── index.html              # メインHTML
├── styles/
│   ├── main.css           # メインスタイル
│   ├── theme.css          # テーマカラー・コンポーネント
│   └── responsive.css     # レスポンシブ対応
└── js/
    ├── audioEngine.js     # Web Audio API管理
    ├── projectManager.js  # プロジェクト管理
    ├── trackManager.js    # トラック・クリップ管理
    ├── fileManager.js     # ファイル管理
    ├── effectsManager.js  # エフェクト管理
    ├── exportManager.js   # エクスポート機能
    └── app.js            # メインアプリケーション
```

## 🎨 カスタマイズ

### テーマカラーの変更

`styles/theme.css` の `:root` セクションで色を変更できます：

```css
:root {
    --color-primary: #8B6F47;      /* プライマリカラー */
    --color-accent: #D4A574;       /* アクセントカラー */
    --color-bg-primary: #FFF9F0;   /* 背景色 */
    /* その他のカラー変数 */
}
```

### 機能の追加

各マネージャークラスは独立しているため、機能追加が容易です：

- `audioEngine.js`: 音声処理関連
- `trackManager.js`: トラック・クリップ操作
- `effectsManager.js`: エフェクト追加
- `exportManager.js`: 書き出し形式追加

## 🔧 技術スタック

- **フロントエンド**: Vanilla JavaScript (ES6+)
- **音声処理**: Web Audio API
- **ストレージ**: IndexedDB
- **スタイル**: CSS3 (CSS Variables使用)
- **ホスティング**: GitHub Pages

## 📝 ライセンス

MIT License

## 🤝 コントリビューション

プルリクエスト大歓迎です！

## 📮 お問い合わせ

バグ報告や機能要望はIssuesまでお願いします。

---

Made with ❤️ for Voice Drama Creators
