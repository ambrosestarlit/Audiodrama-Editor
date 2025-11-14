# VoiceDrama DAW - イコライザー修正版

## 修正内容

### 1. エフェクトパネルの表示/非表示制御を追加 (main.css)
- `.effects-panel`にデフォルトで`display: none`を設定
- `.effects-panel.open`で`display: flex`を設定し、表示されるようにしました

### 2. パネルを閉じる機能を実装 (effectsManager.js)
- `closeEffectsBtn`のイベントリスナーを追加
- `closePanel()`メソッドを追加し、パネルを閉じる処理を実装

### 3. UI要素のデフォルト状態を改善 (index.html)
- イコライザーのスライダーとプリセットボタンにデフォルトで`disabled`属性を追加
- リミッターのスライダーにもデフォルトで`disabled`属性を追加
- チェックボックスをオンにすると有効化されるようになりました

## 使い方

1. トラックを追加する
2. オーディオファイルをドラッグ&ドロップしてクリップを作成
3. トラックヘッダーの「FX」ボタンをクリックしてエフェクトパネルを開く
4. 「イコライザーを有効化」をチェックしてスライダーを調整
5. プリセットボタン(フラット/電話風/ラジオ風)で素早く設定できます

## 動作確認済みの機能

✅ エフェクトパネルの開閉
✅ トラック単位のイコライザー設定
✅ イコライザープリセット(フラット/電話風/ラジオ風)
✅ トラック単位のリミッター設定
✅ FXボタンのアクティブ状態表示(EQまたはリミッターが有効時)
✅ チェックボックスによる有効/無効の切り替え

## 技術的な詳細

### イコライザーの実装
- Low Shelf Filter (100Hz)
- Peaking Filter (1kHz, Q=1)
- High Shelf Filter (10kHz)
- 各バンド-12dB〜+12dBの範囲で調整可能

### リミッターの実装
- DynamicsCompressorを使用したリミッター実装
- Threshold: -24dB〜0dB
- Release: 10ms〜1000ms
- Ratio: 1:1〜20:1

### シグナルフロー
```
Track Input 
→ Track Gain 
→ Pan 
→ [Track EQ] (有効時のみ)
→ [Track Limiter] (有効時のみ)
→ Master EQ 
→ Master Limiter 
→ Master Gain 
→ Output
```
