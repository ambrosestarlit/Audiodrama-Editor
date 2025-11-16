# Sound Bear Mobile - v1.1 バグフィックス

## 🐛 修正した問題

### 1. トラックバーとトラックが重なる問題

**症状:**
- トラック名の下にPC版のボリュームスライダーとモバイル版のボリュームスライダーが両方表示される
- レイアウトが崩れて重なってしまう

**原因:**
- `trackManager.js`で生成されるPC版の`.track-volume`要素が、mobile.cssで非表示にされていなかった
- モバイル用の`.track-volume-row`と併存してしまっていた

**修正内容 (mobile.css):**
```css
/* PC版のボリューム要素を非表示 */
.track-header .track-volume {
    display: none !important;
}
```

**結果:**
- ✅ トラック名とボタンの下にモバイル専用のくまスライダーのみが表示される
- ✅ レイアウトが正しく縦に並ぶ

---

### 2. 音声ファイルがグレーアウトして選択できない問題

**症状:**
- スマホで素材リストの音声ファイルをタップしても反応しない
- グレーアウトして選択できない状態に見える

**原因:**
1. ファイルアイテムに`cursor: move`が設定されていたが、スマホではドラッグ操作が不明瞭
2. クリック/タップで選択状態を示す視覚的フィードバックがなかった
3. タッチ操作に最適化されたスタイルが不足していた

**修正内容:**

#### mobile.css
```css
.file-item {
    /* ... */
    cursor: pointer;  /* move → pointer に変更 */
    transition: all 0.2s ease;
    user-select: none;
    -webkit-user-select: none;
    touch-action: manipulation;  /* タッチ操作を最適化 */
}

.file-item:active {
    transform: scale(0.98);  /* タップ時の視覚フィードバック */
    background: var(--color-secondary-light);
}

.file-item.selected {
    background: var(--color-accent-light);
    border-color: var(--color-accent);
    box-shadow: 0 2px 8px rgba(205, 133, 63, 0.3);  /* 選択状態を強調 */
}

.file-item-icon {
    font-size: 24px;
    width: 32px;
    text-align: center;
    flex-shrink: 0;
}

.file-item-info {
    flex: 1;
    min-width: 0;
}

.file-item-name {
    font-size: 14px;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;  /* 長いファイル名を省略 */
    white-space: nowrap;
    margin-bottom: 2px;
}

.file-item-waveform {
    display: none;  /* スマホでは波形非表示で軽量化 */
}
```

#### fileManager.js
```javascript
// モバイル: クリック/タップで選択状態を切り替え
item.addEventListener('click', (e) => {
    // ダブルクリック/タップを妨げないように
    if (e.detail === 1) {
        item.classList.toggle('selected');
    }
});
```

**結果:**
- ✅ ファイルをタップすると選択状態になり、色が変わる
- ✅ タップ時に視覚的フィードバック(押した感じ)がある
- ✅ 選択されたファイルは明確に識別できる
- ✅ ドラッグ&ドロップも引き続き動作する

---

## 📊 Before / After

### Before (v1.0)
```
┌─────────────────────────┐
│ メイントラック           │
│ [M][S][FX][🗑️]         │
│ ━━━━━━━━━ 100%  ← PC版 │
│ 🐻━━━━●━━━━ 100 ← Mobile │  ← 重なる!
├─────────────────────────┤
│ 波形                    │
└─────────────────────────┘

[ファイルアイテム]  ← グレーで反応しない
```

### After (v1.1)
```
┌─────────────────────────┐
│ メイントラック           │
│ [M][S][FX][🗑️]         │
│ 🐻━━━━●━━━━ 100        │  ← 1つだけ!
├─────────────────────────┤
│ 波形                    │
└─────────────────────────┘

[ファイルアイテム] ← タップで選択可能!
↓ タップ
[ファイルアイテム] ← 色が変わる!
```

---

## 🎯 追加改善

### ファイルリストの使いやすさ向上
1. **視覚的フィードバック**: タップ時にスケールダウンして押した感じ
2. **選択状態の明示**: アクセントカラーとシャドウで強調
3. **レイアウト調整**: アイコン・ファイル名・時間がきれいに配置
4. **パフォーマンス**: 波形非表示でスクロールが軽快

### タッチ操作の最適化
- `touch-action: manipulation` - ダブルタップズーム防止
- `user-select: none` - テキスト選択防止
- `transition` - スムーズなアニメーション

---

## 🔧 修正ファイル

1. **mobile.css**
   - `.track-header .track-volume` を非表示に
   - `.file-item` のスタイルを大幅改善
   - `.file-item-*` のレイアウト調整

2. **fileManager.js**
   - ファイルアイテムにクリック選択機能を追加

---

## 📦 配布パッケージ

- **Sound-Bear-Mobile-v1.1.zip** ← 最新版!
  - 全ての修正を含む完全版

---

## 🎉 動作確認

### 確認項目
- [x] トラックのボリュームスライダーが1つだけ表示される
- [x] スライダーにくまアイコンが表示される
- [x] ファイルをタップすると選択状態になる
- [x] 選択されたファイルは色が変わる
- [x] タップ時に押した感じがある
- [x] ドラッグ&ドロップも引き続き動作する

### テスト環境
- iOS Safari 14+
- Android Chrome 80+
- 画面サイズ: 375px〜768px

---

## 📝 使い方

### ファイルの選択とドラッグ
1. ファイルをタップして選択(色が変わる)
2. 長押ししてドラッグ
3. トラックの波形エリアにドロップ

### ボリューム調整
1. トラックのくまスライダーをスワイプ
2. 右の数値で確認

---

**Version**: 1.1  
**Release Date**: 2025-11-15  
**Status**: ✅ バグ修正完了
