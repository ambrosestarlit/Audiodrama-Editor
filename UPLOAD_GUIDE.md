# GitHub Pagesへのアップロード手順

## ⚠️ 重要: すべてのファイルをアップロードしてください

このアプリケーションは以下の**すべてのファイル**が必要です:

### 必須ファイル一覧

#### HTMLファイル
- ✅ `index.html`

#### JavaScriptファイル（すべて必須）
- ✅ `app.js`
- ✅ `audioEngine.js`
- ✅ `effectsManager.js` ← **これが欠けているとエラーになります**
- ✅ `exportManager.js`
- ✅ `fileManager.js`
- ✅ `historyManager.js`
- ✅ `projectManager.js`
- ✅ `trackManager.js`

#### CSSファイル（すべて必須）
- ✅ `main.css`
- ✅ `theme.css`
- ✅ `responsive.css`

#### ドキュメント（オプション）
- 📄 `README.md`
- 📄 `CHANGES.md`
- 📄 `UPLOAD_GUIDE.md`

## 🚀 アップロード手順

### 方法1: GitHub Webインターフェース（推奨）

1. **GitHubリポジトリにアクセス**
   - `https://github.com/アカウント名/リポジトリ名` にアクセス

2. **すべてのファイルを削除** (古いファイルを残さないため)
   - 各ファイルを開いて `Delete file` をクリック
   - または、新しいブランチを作成

3. **新しいファイルをアップロード**
   - `Add file` → `Upload files` をクリック
   - ZIPを解凍した**すべてのファイル**をドラッグ&ドロップ
   - ⚠️ 特に以下のファイルが含まれているか確認:
     - `effectsManager.js`
     - `audioEngine.js`
     - `trackManager.js`

4. **コミット**
   - コミットメッセージ: `イコライザー機能修正版`
   - `Commit changes` をクリック

5. **GitHub Pagesの設定を確認**
   - `Settings` → `Pages`
   - Source: `main` branch、`/ (root)` を選択
   - `Save` をクリック

6. **デプロイ完了を待つ**
   - 数分待つ
   - `Actions` タブで緑色のチェックマークが表示されるまで待つ

7. **動作確認**
   - `https://アカウント名.github.io/リポジトリ名/` にアクセス
   - F12キーでコンソールを開く
   - エラーがないか確認

### 方法2: Git コマンドライン

```bash
# リポジトリをクローン
git clone https://github.com/アカウント名/リポジトリ名.git
cd リポジトリ名

# 古いファイルを削除
git rm *.js *.css *.html

# 新しいファイルをコピー
cp /path/to/extracted/files/* .

# コミット
git add .
git commit -m "イコライザー機能修正版"

# プッシュ
git push origin main
```

## 🔍 アップロード後の確認方法

### 1. ファイルが正しくアップロードされたか確認

GitHubリポジトリのページで以下のファイルが存在するか確認:

```
your-repo/
├── index.html
├── app.js
├── audioEngine.js
├── effectsManager.js ← 特にこれ！
├── exportManager.js
├── fileManager.js
├── historyManager.js
├── projectManager.js
├── trackManager.js
├── main.css
├── theme.css
└── responsive.css
```

### 2. ブラウザで動作確認

1. `https://アカウント名.github.io/リポジトリ名/` にアクセス
2. **F12キー**を押して開発者ツールを開く
3. **Console**タブを選択
4. 以下のようなログが表示されることを確認:

```
VoiceDrama DAW initializing...
Initializing projectManager...
✓ projectManager initialized
Initializing fileManager...
FileManager: Setting up event listeners...
FileManager: Initialized successfully
✓ fileManager initialized
Initializing effectsManager...
EffectsManager: Setting up event listeners...
EffectsManager: Initialized successfully
✓ effectsManager initialized
...
✓ VoiceDrama DAW initialized successfully
```

### 3. エラーが出た場合

#### `effectsManager not found` エラー
→ `effectsManager.js` がアップロードされていません
→ 手順1に戻ってすべてのファイルを再アップロード

#### `404 Not Found` エラー
→ ファイル名が間違っているか、ファイルが存在しません
→ ファイル名が正確か確認（大文字小文字も区別されます）

#### `Syntax Error` エラー
→ ファイルが破損しているか、アップロード中にエラーが発生
→ ZIPを再度解凍して、ファイルを再アップロード

## 📝 キャッシュのクリア

古いバージョンがキャッシュされている場合:

### Chromeの場合
1. F12キーで開発者ツールを開く
2. ネットワークタブを選択
3. 「Disable cache」にチェック
4. 右クリックで再読み込みボタンを押して「Empty Cache and Hard Reload」を選択

### Firefoxの場合
1. Ctrl + Shift + Delete を押す
2. 「キャッシュ」のみにチェック
3. 「今すぐ消去」をクリック
4. ページを再読み込み

### Safariの場合
1. Cmd + Option + E を押してキャッシュを空にする
2. ページを再読み込み

## ✅ 正常に動作しているか確認

1. トラックを追加できる
2. オーディオファイルをドラッグ&ドロップできる
3. トラックの「FX」ボタンをクリックするとエフェクトパネルが開く
4. 「イコライザーを有効化」をチェックするとスライダーが操作可能になる
5. 音声を再生してイコライザーが効いている

すべて確認できたら成功です! 🎉
