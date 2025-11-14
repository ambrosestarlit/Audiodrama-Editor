# VoiceDrama DAW - イコライザー修正詳細ドキュメント

## 問題の特定

イコライザーが機能していなかった原因:

1. **エフェクトパネルが表示されていなかった**
   - `.effects-panel`のCSSで常に`display: flex`が設定されていたため、`.open`クラスによる表示/非表示の切り替えができなかった

2. **currentTrackIdが設定されていなかった**
   - エフェクトパネルが開かれず、どのトラックのエフェクトを調整するのか不明な状態だった

3. **UIの初期状態が不適切だった**
   - イコライザーとリミッターのスライダーが有効化チェックボックスを無視して常に操作可能だった

## 変更ファイル一覧

### 1. main.css (3行の変更)

**変更箇所**: 548-556行目

```css
/* 変更前 */
.effects-panel {
    width: 320px;
    background: white;
    border-left: 2px solid var(--color-border-light);
    display: flex;  /* ← 常に表示されていた */
    flex-direction: column;
    overflow: hidden;
    box-shadow: var(--shadow-medium);
}

/* 変更後 */
.effects-panel {
    width: 320px;
    background: white;
    border-left: 2px solid var(--color-border-light);
    display: none;  /* ← デフォルトは非表示 */
    flex-direction: column;
    overflow: hidden;
    box-shadow: var(--shadow-medium);
}

.effects-panel.open {
    display: flex;  /* ← openクラスで表示 */
}
```

**影響**: 
- FXボタンをクリックするまでエフェクトパネルが非表示になる
- `.open`クラスが追加されると表示される

---

### 2. effectsManager.js (2つの変更)

#### 変更A: setupEventListeners()メソッドに閉じるボタンの処理を追加

**変更箇所**: 17-26行目

```javascript
// 追加されたコード
setupEventListeners() {
    // パネルを閉じるボタン
    const closeBtn = document.getElementById('closeEffectsBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            this.closePanel();
        });
    }
    
    // イコライザー有効化チェックボックス
    // ... 既存のコード
}
```

**影響**:
- ✕ボタンでエフェクトパネルを閉じることができる

#### 変更B: closePanel()メソッドの追加

**変更箇所**: 348-357行目

```javascript
// 追加されたメソッド
// パネルを閉じる
closePanel() {
    const panel = document.getElementById('effectsPanel');
    if (!panel) return;
    
    this.isOpen = false;
    panel.classList.remove('open');
    this.currentTrackId = null;
}
```

**影響**:
- エフェクトパネルを閉じる専用メソッド
- `currentTrackId`をnullにリセットして、どのトラックも選択されていない状態にする

---

### 3. index.html (2つの変更)

#### 変更A: イコライザーコントロールにdisabled属性を追加

**変更箇所**: 138-161行目

```html
<!-- 各スライダーとボタンにdisabled属性を追加 -->
<input type="range" id="eqLow" min="-12" max="12" value="0" step="0.1" disabled>
<input type="range" id="eqMid" min="-12" max="12" value="0" step="0.1" disabled>
<input type="range" id="eqHigh" min="-12" max="12" value="0" step="0.1" disabled>

<button class="btn btn-small eq-preset-btn" data-preset="flat" disabled>フラット</button>
<button class="btn btn-small eq-preset-btn" data-preset="phone" disabled>電話風</button>
<button class="btn btn-small eq-preset-btn" data-preset="radio" disabled>ラジオ風</button>
```

**影響**:
- デフォルトでイコライザーのコントロールが無効化される
- チェックボックスをオンにすると有効化される

#### 変更B: リミッターコントロールにdisabled属性を追加

**変更箇所**: 170-185行目

```html
<!-- 各スライダーにdisabled属性を追加 -->
<input type="range" id="trackLimiterThreshold" min="-24" max="0" value="-6" step="0.1" disabled>
<input type="range" id="trackLimiterRelease" min="10" max="1000" value="250" step="10" disabled>
<input type="range" id="trackLimiterRatio" min="1" max="20" value="20" step="0.1" disabled>
```

**影響**:
- デフォルトでリミッターのコントロールが無効化される
- チェックボックスをオンにすると有効化される

---

## 動作フロー

### エフェクトパネルを開く流れ

1. ユーザーがトラックの「FX」ボタンをクリック
2. `trackManager.js`の`setupTrackEvents()`が`effectsManager.openTrackEffects(track.id)`を呼び出す
3. `effectsManager.js`の`openTrackEffects()`が:
   - `this.currentTrackId`にトラックIDを設定
   - パネルのタイトルを「エフェクト - [トラック名]」に変更
   - `panel.classList.add('open')`でパネルを表示
   - `loadTrackLimiterSettings()`でトラックの現在の設定を読み込む
   - `updateFXButtonState()`でFXボタンのアクティブ状態を更新

### イコライザーを有効化する流れ

1. ユーザーが「イコライザーを有効化」チェックボックスをオン
2. `effectsManager.js`のchangeイベントリスナーが:
   - `audioEngine.setTrackEQEnabled(trackId, true)`を呼び出す
   - スライダーとプリセットボタンの`disabled`属性を削除
   - `updateFXButtonState()`でFXボタンをアクティブ表示
   - `updateTrackClipsWaveforms()`で波形を更新

3. `audioEngine.js`の`setTrackEQEnabled()`が:
   - `track.eqEnabled = true`を設定
   - `reconnectTrackEffects()`でオーディオノードの接続を再構築
   - シグナルフローに EQ を挿入: Pan → EQ → (Limiter) → Master

### シグナルフロー詳細

```
入力
 ↓
Track Gain (ボリューム調整)
 ↓
Stereo Panner (パン調整)
 ↓
[Track EQ] ← チェックボックスでON/OFF
 ├─ Low Shelf (100Hz)
 ├─ Peaking (1kHz)
 └─ High Shelf (10kHz)
 ↓
[Track Limiter] ← チェックボックスでON/OFF
 ├─ Threshold
 ├─ Release
 └─ Ratio
 ↓
Master EQ Chain
 ├─ Low Shelf (100Hz)
 ├─ Peaking (1kHz)
 └─ High Shelf (10kHz)
 ↓
Master Limiter
 ↓
Master Gain
 ↓
出力 (AudioContext.destination)
```

## テスト方法

1. **エフェクトパネルの表示テスト**
   - トラックを追加
   - 「FX」ボタンをクリック
   - 右側にエフェクトパネルが表示されることを確認
   - ✕ボタンでパネルが閉じることを確認

2. **イコライザーの動作テスト**
   - 「イコライザーを有効化」をチェック
   - スライダーが操作可能になることを確認
   - Low/Mid/Highを調整して音質が変わることを確認
   - プリセットボタン(電話風/ラジオ風)をクリックして音質が変わることを確認

3. **リミッターの動作テスト**
   - 「リミッターを有効化」をチェック
   - スライダーが操作可能になることを確認
   - Thresholdを調整して音量制限が効くことを確認

4. **FXボタンのアクティブ状態テスト**
   - イコライザーまたはリミッターを有効化
   - FXボタンが茶色(アクティブ)になることを確認
   - 両方無効化するとFXボタンが元の色に戻ることを確認

## 既知の制限事項

1. **エクスポート時のエフェクト適用**
   - 現在、エクスポート時にトラックEQ/リミッターが正しく適用されない可能性があります
   - `exportManager.js`の`exportWAV()`メソッドで、各トラックのエフェクト設定を読み込む必要があります

2. **プロジェクト保存時のエフェクト設定**
   - トラック単位のEQ/リミッター設定がプロジェクトに保存されません
   - `app.js`の`saveProject()`と`loadProject()`で、各トラックのエフェクト設定を保存/復元する必要があります

3. **アンドゥ/リドゥ対応**
   - エフェクトの変更が履歴に記録されません
   - `historyManager`との統合が必要です

## 今後の改善案

1. **リアルタイム波形表示**
   - EQ適用後の波形をリアルタイムで表示
   - ビジュアルフィードバックの向上

2. **エフェクトプリセットの保存**
   - ユーザー定義のEQ/リミッタープリセットを保存
   - よく使う設定を素早く呼び出せる

3. **追加エフェクト**
   - コンプレッサー
   - リバーブ
   - ディレイ
   - ノイズゲート

4. **サイドチェイン対応**
   - トラック間でのサイドチェイン圧縮
   - ボイスドラマでBGMをセリフに合わせて自動ダッキング
