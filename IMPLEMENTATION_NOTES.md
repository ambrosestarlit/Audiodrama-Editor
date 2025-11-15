# VoiceDrama DAW - プロジェクト保存システム実装ノート

## 📋 Starlit Timelineから学んだベストプラクティス

### 1. データ構造の分離
- **プロジェクトJSON**: メタデータ + 有効/無効フラグのみ
- **素材ZIP**: 実際のファイル
- **localStorage**: エフェクトパラメーター（グローバル設定）

### 2. 保存するデータ

#### ✅ プロジェクトJSONに保存
```javascript
{
    version: '1.0',
    projectName: 'my_project',
    tracks: [...],
    audioFiles: [...],  // メタデータのみ
    effectsEnabled: {   // 有効/無効フラグ
        eq: true,
        limiter: false
    },
    zoom: 100
}
```

#### ✅ 素材ZIPに保存
```
assets/
├── file1_audio.wav
├── file2_bgm.wav
└── file3_se.wav
```

#### ✅ localStorageに保存（将来的に）
```javascript
{
    eqSettings: { low: 0, mid: 0, high: 0 },
    limiterSettings: { threshold: -6, release: 250 }
}
```

### 3. 実装済み機能

✅ プロジェクト名の入力とサニタイズ
✅ プロジェクトJSONのダウンロード
✅ 素材ZIPの自動ダウンロード
✅ 2段階読み込み（JSON → ZIP）
✅ MIMEタイプの推測
✅ エラーハンドリング
✅ undefined除去（?? 演算子）

### 4. IndexedDBを使わない理由

- ❌ ブラウザ依存でデータが消える可能性
- ❌ 構造化クローンの制限（Date, undefined, 循環参照）
- ❌ デバッグが困難
- ✅ JSON+ZIPなら他のソフトでも開ける
- ✅ バックアップが簡単
- ✅ バージョン管理が可能

### 5. 注意点

#### Date オブジェクト
```javascript
// ❌ NG
createdAt: new Date()

// ✅ OK
createdAt: new Date().toISOString()
```

#### undefined
```javascript
// ❌ NG
volume: track.volume

// ✅ OK
volume: track.volume ?? 0.8
```

#### AudioBuffer/Blob
```javascript
// ❌ プロジェクトJSONに含めない
audioBuffer: clip.audioBuffer

// ✅ メタデータのみ
duration: clip.duration
```

### 6. 完成したフロー

```
【保存】
1. プロジェクト名を入力
2. JSONをダウンロード
3. ZIPをダウンロード
   ↓
ユーザーのダウンロードフォルダに2ファイル

【読み込み】
1. JSONを選択
2. 確認ダイアログ
3. ZIPを選択
   ↓
プロジェクトが完全に復元
```

## 🎉 結論

Starlit Timelineと同じ方式を採用することで：
- ✅ シンプルで確実な保存システム
- ✅ デバッグが容易
- ✅ クロスプラットフォーム対応
- ✅ 他のソフトとの連携も可能

**作成者:** アンブローズ・スターリット  
**参考:** Starlit Timeline Editor  
**最終更新:** 2025/11/15
