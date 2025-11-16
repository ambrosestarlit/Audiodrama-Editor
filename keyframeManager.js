// ==========================================
// KeyframeManager - キーフレーム管理クラス
// ==========================================

class KeyframeManager {
    constructor() {
        this.keyframes = new Map(); // clipId -> { parameter -> [keyframes] }
        this.selectedKeyframe = null;
        this.interpolationTypes = {
            LINEAR: 'linear',
            EASE_IN: 'ease-in',
            EASE_OUT: 'ease-out',
            EASE_IN_OUT: 'ease-in-out',
            STEP: 'step'
        };
    }
    
    // キーフレームの追加
    addKeyframe(clipId, parameter, time, value, interpolation = 'linear') {
        if (!this.keyframes.has(clipId)) {
            this.keyframes.set(clipId, {});
        }
        
        const clipKeyframes = this.keyframes.get(clipId);
        if (!clipKeyframes[parameter]) {
            clipKeyframes[parameter] = [];
        }
        
        const keyframe = {
            id: `${clipId}_${parameter}_${Date.now()}`,
            time: time,
            value: value,
            interpolation: interpolation
        };
        
        clipKeyframes[parameter].push(keyframe);
        
        // 時間順にソート
        clipKeyframes[parameter].sort((a, b) => a.time - b.time);
        
        return keyframe;
    }
    
    // キーフレームの削除
    removeKeyframe(clipId, parameter, keyframeId) {
        const clipKeyframes = this.keyframes.get(clipId);
        if (!clipKeyframes || !clipKeyframes[parameter]) return;
        
        const index = clipKeyframes[parameter].findIndex(kf => kf.id === keyframeId);
        if (index !== -1) {
            clipKeyframes[parameter].splice(index, 1);
        }
    }
    
    // キーフレームの更新
    updateKeyframe(clipId, parameter, keyframeId, updates) {
        const clipKeyframes = this.keyframes.get(clipId);
        if (!clipKeyframes || !clipKeyframes[parameter]) return;
        
        const keyframe = clipKeyframes[parameter].find(kf => kf.id === keyframeId);
        if (keyframe) {
            Object.assign(keyframe, updates);
            
            // 時間が変更された場合は再ソート
            if ('time' in updates) {
                clipKeyframes[parameter].sort((a, b) => a.time - b.time);
            }
        }
    }
    
    // 指定時間でのパラメータ値を補間して取得
    getValueAtTime(clipId, parameter, time, defaultValue = 0) {
        const clipKeyframes = this.keyframes.get(clipId);
        if (!clipKeyframes || !clipKeyframes[parameter] || clipKeyframes[parameter].length === 0) {
            return defaultValue;
        }
        
        const keyframes = clipKeyframes[parameter];
        
        // 最初のキーフレームより前 → デフォルト値
        if (time < keyframes[0].time) {
            return defaultValue;
        }
        
        // 最後のキーフレームより後 → デフォルト値
        if (time > keyframes[keyframes.length - 1].time) {
            return defaultValue;
        }
        
        // ちょうど最初のキーフレームの時間
        if (time === keyframes[0].time) {
            return keyframes[0].value;
        }
        
        // ちょうど最後のキーフレームの時間
        if (time === keyframes[keyframes.length - 1].time) {
            return keyframes[keyframes.length - 1].value;
        }
        
        // 2つのキーフレーム間を補間
        for (let i = 0; i < keyframes.length - 1; i++) {
            const kf1 = keyframes[i];
            const kf2 = keyframes[i + 1];
            
            if (time >= kf1.time && time <= kf2.time) {
                return this.interpolate(kf1, kf2, time);
            }
        }
        
        return defaultValue;
    }
    
    // 指定時間がキーフレームの影響範囲内か判定し、範囲内なら補間値を返す
    getValueAtTimeInRange(clipId, parameter, time, defaultValue = 0) {
        const clipKeyframes = this.keyframes.get(clipId);
        if (!clipKeyframes || !clipKeyframes[parameter] || clipKeyframes[parameter].length === 0) {
            return { inRange: false, value: defaultValue };
        }
        
        const keyframes = clipKeyframes[parameter];
        
        // デバッグ：配列の状態を出力
        console.log(`📋 Keyframe array for ${parameter}:`, keyframes.map(k => `t=${k.time.toFixed(2)}:v=${k.value}`).join(', '));
        
        const firstTime = keyframes[0].time;
        const lastTime = keyframes[keyframes.length - 1].time;
        
        console.log(`🔍 inRange check: time=${time.toFixed(3)}, first=${firstTime.toFixed(3)}, last=${lastTime.toFixed(3)}`);
        
        // 最初のキーフレームより前 → 範囲外
        if (time < firstTime) {
            console.log(`  → 範囲外(前): ${time} < ${firstTime}, デフォルト値=${defaultValue}を使用`);
            return { inRange: false, value: defaultValue };
        }
        
        // 最後のキーフレーム以降 → 範囲外（デフォルト値に戻す）
        if (time > lastTime) {
            console.log(`  → 範囲外(後): ${time} > ${lastTime}, デフォルト値=${defaultValue}を使用`);
            return { inRange: false, value: defaultValue };
        }
        
        // キーフレーム範囲内（firstTime <= time <= lastTime）：補間値を返す
        console.log(`  → 範囲内! 補間値を計算`);
        return { inRange: true, value: this.getValueAtTime(clipId, parameter, time, defaultValue) };
    }
    
    // 補間計算
    interpolate(kf1, kf2, time) {
        const duration = kf2.time - kf1.time;
        const progress = (time - kf1.time) / duration;
        
        let t = progress;
        
        // 補間タイプに応じてイージング関数を適用
        switch (kf1.interpolation) {
            case 'linear':
                t = progress;
                break;
            case 'ease-in':
                t = progress * progress;
                break;
            case 'ease-out':
                t = 1 - Math.pow(1 - progress, 2);
                break;
            case 'ease-in-out':
                t = progress < 0.5 
                    ? 2 * progress * progress 
                    : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                break;
            case 'step':
                t = 0; // 次のキーフレームまでは前の値を保持
                break;
        }
        
        if (kf1.interpolation === 'step') {
            return kf1.value;
        }
        
        return kf1.value + (kf2.value - kf1.value) * t;
    }
    
    // クリップの全キーフレームを取得
    getClipKeyframes(clipId) {
        return this.keyframes.get(clipId) || {};
    }
    
    // パラメータのキーフレームリストを取得
    getParameterKeyframes(clipId, parameter) {
        const clipKeyframes = this.keyframes.get(clipId);
        if (!clipKeyframes) return [];
        return clipKeyframes[parameter] || [];
    }
    
    // クリップのキーフレームを全削除
    clearClipKeyframes(clipId) {
        this.keyframes.delete(clipId);
    }
    
    // パラメータのキーフレームを全削除
    clearParameterKeyframes(clipId, parameter) {
        const clipKeyframes = this.keyframes.get(clipId);
        if (clipKeyframes && clipKeyframes[parameter]) {
            delete clipKeyframes[parameter];
        }
    }
    
    // 指定時間に最も近いキーフレームを取得
    getNearestKeyframe(clipId, parameter, time, threshold = 0.1) {
        const keyframes = this.getParameterKeyframes(clipId, parameter);
        if (keyframes.length === 0) return null;
        
        let nearest = null;
        let minDistance = threshold;
        
        for (const kf of keyframes) {
            const distance = Math.abs(kf.time - time);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = kf;
            }
        }
        
        return nearest;
    }
    
    // キーフレームデータをシリアライズ（保存用）
    serialize() {
        const data = {};
        this.keyframes.forEach((clipKeyframes, clipId) => {
            data[clipId] = clipKeyframes;
        });
        return data;
    }
    
    // キーフレームデータをデシリアライズ（読み込み用）
    deserialize(data) {
        this.keyframes.clear();
        Object.entries(data).forEach(([clipId, clipKeyframes]) => {
            this.keyframes.set(parseInt(clipId), clipKeyframes);
        });
    }
    
    // キーフレームの存在確認
    hasKeyframes(clipId, parameter = null) {
        const clipKeyframes = this.keyframes.get(clipId);
        if (!clipKeyframes) return false;
        
        if (parameter) {
            return clipKeyframes[parameter] && clipKeyframes[parameter].length > 0;
        }
        
        return Object.values(clipKeyframes).some(kfs => kfs.length > 0);
    }
    
    // クリップをコピー時にキーフレームもコピー
    copyClipKeyframes(sourceClipId, targetClipId, timeOffset = 0) {
        const sourceKeyframes = this.keyframes.get(sourceClipId);
        if (!sourceKeyframes) return;
        
        const targetKeyframes = {};
        
        Object.entries(sourceKeyframes).forEach(([parameter, keyframes]) => {
            targetKeyframes[parameter] = keyframes.map(kf => ({
                id: `${targetClipId}_${parameter}_${Date.now()}_${Math.random()}`,
                time: kf.time + timeOffset,
                value: kf.value,
                interpolation: kf.interpolation
            }));
        });
        
        this.keyframes.set(targetClipId, targetKeyframes);
    }
}

// グローバルインスタンスを作成
window.keyframeManager = new KeyframeManager();
