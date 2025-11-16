// ==========================================
// TimelineKeyframeUI - タイムライン上のキーフレームUI
// ==========================================

class TimelineKeyframeUI {
    constructor() {
        this.selectedClip = null;
        this.selectedTrackId = null;
        this.isDraggingKeyframe = false;
        this.draggedKeyframe = null;
        this.keyframeElements = new Map();
    }
    
    init() {
        console.log('TimelineKeyframeUI initialized');
        this.setupGlobalEvents();
    }
    
    setupGlobalEvents() {
        document.addEventListener('mousemove', (e) => this.onGlobalMouseMove(e));
        document.addEventListener('mouseup', () => this.onGlobalMouseUp());
        
        // くまさんキーフレームボタンのイベント設定
        this.setupBearKeyframeButtons();
    }
    
    setupBearKeyframeButtons() {
        // エフェクトパネル内のくまさんボタンを取得
        const bearButtons = document.querySelectorAll('.keyframe-bear-btn');
        
        bearButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const effect = button.dataset.effect;
                
                if (effect) {
                    // エフェクト一括キーフレーム追加
                    this.recordEffectGroupKeyframes(effect);
                } else {
                    // 個別パラメーター(後方互換用)
                    const param = button.dataset.param;
                    if (param) {
                        this.recordEffectKeyframe(param);
                    }
                }
            });
        });
    }
    
    recordEffectGroupKeyframes(effectName) {
        if (!this.selectedClip || !this.selectedTrackId) {
            alert('クリップを選択してください!');
            return;
        }
        
        const clip = window.trackManager.getTrack(this.selectedTrackId)?.clips
            .find(c => c.id === this.selectedClip.id);
        if (!clip) return;
        
        // 現在の再生時間からクリップ内の相対時間を計算
        const absoluteTime = window.audioEngine.currentTime;
        const relativeTime = absoluteTime - clip.startTime;
        
        // クリップの範囲外なら何もしない
        if (relativeTime < 0 || relativeTime > clip.duration) {
            alert('クリップの範囲内で実行してください!');
            return;
        }
        
        // エフェクトごとのパラメーターリスト
        const effectParams = {
            'equalizer': ['eqLow', 'eqMid', 'eqHigh'],
            'limiter': ['trackLimiterThreshold', 'trackLimiterRelease', 'trackLimiterRatio'],
            'expander': ['trackExpanderThreshold', 'trackExpanderRatio', 'trackExpanderRelease'],
            'filters': ['trackHighpassCutoff', 'trackHighpassResonance', 'trackLowpassCutoff', 'trackLowpassResonance']
        };
        
        const params = effectParams[effectName];
        if (!params) return;
        
        let addedCount = 0;
        
        // 各パラメーターのキーフレームを追加
        params.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (!element) return;
            
            const value = parseFloat(element.value);
            
            // キーフレーム追加または更新
            const nearest = window.keyframeManager.getNearestKeyframe(
                this.selectedClip.id, 
                elementId, 
                relativeTime, 
                0.01  // 0.01秒以内のみ上書き
            );
            
            if (nearest) {
                window.keyframeManager.updateKeyframe(
                    this.selectedClip.id,
                    elementId,
                    nearest.id,
                    { value }
                );
            } else {
                window.keyframeManager.addKeyframe(
                    this.selectedClip.id,
                    elementId,
                    relativeTime,
                    value,
                    'linear'
                );
                addedCount++;
            }
        });
        
        // 再描画
        this.renderKeyframesForClip(this.selectedClip.id, this.selectedTrackId);
        
        // 視覚的フィードバック
        const button = document.querySelector(`.keyframe-bear-btn[data-effect="${effectName}"]`);
        if (button) {
            button.style.transform = 'scale(1.2)';
            setTimeout(() => {
                button.style.transform = '';
            }, 200);
        }
        
        console.log(`✨ ${effectName}のキーフレームを${addedCount}個追加しました!`);
    }
    
    recordEffectKeyframe(elementId) {
        if (!this.selectedClip || !this.selectedTrackId) {
            alert('クリップを選択してください!');
            return;
        }
        
        const clip = window.trackManager.getTrack(this.selectedTrackId)?.clips
            .find(c => c.id === this.selectedClip.id);
        if (!clip) return;
        
        // 現在の再生時間からクリップ内の相対時間を計算
        const absoluteTime = window.audioEngine.currentTime;
        const relativeTime = absoluteTime - clip.startTime;
        
        // クリップの範囲外なら何もしない
        if (relativeTime < 0 || relativeTime > clip.duration) {
            alert('クリップの範囲内で実行してください!');
            return;
        }
        
        // 現在の値を取得
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const value = parseFloat(element.value);
        
        // キーフレーム追加または更新
        const nearest = window.keyframeManager.getNearestKeyframe(
            this.selectedClip.id, 
            elementId, 
            relativeTime, 
            0.1
        );
        
        if (nearest) {
            window.keyframeManager.updateKeyframe(
                this.selectedClip.id,
                elementId,
                nearest.id,
                { value }
            );
        } else {
            window.keyframeManager.addKeyframe(
                this.selectedClip.id,
                elementId,
                relativeTime,
                value,
                'linear'
            );
        }
        
        // 再描画
        this.renderKeyframesForClip(this.selectedClip.id, this.selectedTrackId);
        
        // 視覚的フィードバック
        const button = document.querySelector(`.keyframe-bear-btn[data-param="${elementId}"]`);
        if (button) {
            button.style.transform = 'scale(1.2)';
            setTimeout(() => {
                button.style.transform = '';
            }, 200);
        }
    }
    
    // クリップ選択時にキーフレーム自動記録を有効化
    enableKeyframeRecording(clip, trackId) {
        this.selectedClip = clip;
        this.selectedTrackId = trackId;
        
        // キーフレームを描画
        this.renderKeyframesForClip(clip.id, trackId);
        
        // スライダーイベントを設定（まだ設定されていない場合）
        this.setupSliderRecording(trackId);
    }
    
    setupSliderRecording(trackId) {
        const trackElement = document.querySelector(`[data-track-id="${trackId}"]`);
        if (!trackElement) return;
        
        // ボリュームスライダー
        const volumeSlider = trackElement.querySelector('.volume-slider');
        if (volumeSlider && !volumeSlider.dataset.keyframeEnabled) {
            volumeSlider.dataset.keyframeEnabled = 'true';
            
            // input: リアルタイム更新（履歴保存なし）
            volumeSlider.addEventListener('input', () => {
                console.log(`📊 Volume slider input: selectedClip=${this.selectedClip?.id}, selectedTrackId=${this.selectedTrackId}, trackId=${trackId}`);
                if (this.selectedClip && this.selectedTrackId === trackId) {
                    this.recordKeyframeLive('volume', trackId);
                } else {
                    console.log(`  ⚠️ 条件不一致: selectedClip=${!!this.selectedClip}, trackIdMatch=${this.selectedTrackId === trackId}`);
                }
            });
            
            // change: スライダーを離したときに履歴保存
            volumeSlider.addEventListener('change', () => {
                if (window.app && window.app.saveHistory) {
                    window.app.saveHistory();
                }
            });
        }
        
        // Panスライダー
        const panSlider = trackElement.querySelector('.pan-slider');
        if (panSlider && !panSlider.dataset.keyframeEnabled) {
            panSlider.dataset.keyframeEnabled = 'true';
            
            // input: リアルタイム更新（履歴保存なし）
            panSlider.addEventListener('input', () => {
                console.log(`📊 Pan slider input: selectedClip=${this.selectedClip?.id}, selectedTrackId=${this.selectedTrackId}, trackId=${trackId}`);
                if (this.selectedClip && this.selectedTrackId === trackId) {
                    this.recordKeyframeLive('pan', trackId);
                } else {
                    console.log(`  ⚠️ 条件不一致: selectedClip=${!!this.selectedClip}, trackIdMatch=${this.selectedTrackId === trackId}`);
                }
            });
            
            // change: スライダーを離したときに履歴保存
            panSlider.addEventListener('change', () => {
                if (window.app && window.app.saveHistory) {
                    window.app.saveHistory();
                }
            });
        }
    }
    
    recordKeyframe(parameter, trackId) {
        if (!this.selectedClip) return;
        
        const clip = window.trackManager.getTrack(trackId)?.clips
            .find(c => c.id === this.selectedClip.id);
        if (!clip) return;
        
        // 現在の時間を取得（プレイヘッドの位置から逆算）
        let absoluteTime = window.audioEngine.currentTime;
        
        // もしcurrentTimeが0で、プレイヘッドが移動している場合は、プレイヘッドの位置から計算
        if (absoluteTime === 0 || !this.isPlaying) {
            const playhead = document.querySelector('.playhead');
            if (playhead) {
                const trackHeader = document.querySelector('.track-header');
                const headerWidth = trackHeader ? trackHeader.offsetWidth : 240;
                const playheadLeft = parseFloat(playhead.style.left) || headerWidth;
                const offsetX = playheadLeft - headerWidth;
                absoluteTime = offsetX / window.trackManager.pixelsPerSecond;
                console.log(`🎯 一時停止中: プレイヘッド位置から計算 offsetX=${offsetX}, time=${absoluteTime}`);
            }
        }
        
        const relativeTime = absoluteTime - clip.startTime;
        
        console.log(`🎯 recordKeyframe: parameter=${parameter}, absoluteTime=${absoluteTime}, relativeTime=${relativeTime}`);
        
        // クリップの範囲外なら何もしない（少し余裕を持たせる）
        if (relativeTime < -0.1 || relativeTime > clip.duration + 0.1) {
            console.log(`  ⚠️ 範囲外!`);
            return;
        }
        
        // 範囲内に収める
        const clampedTime = Math.max(0, Math.min(relativeTime, clip.duration));
        
        // 現在の値を取得
        let value;
        const trackElement = document.querySelector(`[data-track-id="${trackId}"]`);
        
        switch (parameter) {
            case 'volume':
                const volumeSlider = trackElement.querySelector('.volume-slider');
                value = parseFloat(volumeSlider.value);
                break;
            case 'pan':
                const panSlider = trackElement.querySelector('.pan-slider');
                value = parseFloat(panSlider.value);
                break;
            case 'gain':
                const gainSlider = document.getElementById('clipGainSlider');
                value = gainSlider ? parseFloat(gainSlider.value) : 0;
                break;
        }
        
        // キーフレーム追加または更新
        const nearest = window.keyframeManager.getNearestKeyframe(
            this.selectedClip.id, 
            parameter, 
            clampedTime,  // clampedTimeを使用
            0.01  // 0.01秒以内のみ上書き
        );
        
        if (nearest) {
            window.keyframeManager.updateKeyframe(
                this.selectedClip.id,
                parameter,
                nearest.id,
                { value }
            );
        } else {
            window.keyframeManager.addKeyframe(
                this.selectedClip.id,
                parameter,
                clampedTime,  // clampedTimeを使用
                value,
                'linear'
            );
        }
        
        // 再描画
        this.renderKeyframesForClip(this.selectedClip.id, trackId);
        
        // 履歴保存（app.saveHistoryを呼ぶ）
        if (window.app && window.app.saveHistory) {
            window.app.saveHistory();
        }
    }
    
    // キーフレーム記録（ライブ更新、履歴保存なし）
    recordKeyframeLive(parameter, trackId) {
        console.log(`🔍 recordKeyframeLive called: parameter=${parameter}, trackId=${trackId}, selectedClip=${this.selectedClip?.id}`);
        
        if (!this.selectedClip) {
            console.log(`  ❌ selectedClip is null`);
            return;
        }
        
        const clip = window.trackManager.getTrack(trackId)?.clips
            .find(c => c.id === this.selectedClip.id);
        if (!clip) {
            console.log(`  ❌ clip not found`);
            return;
        }
        
        console.log(`  ✅ clip found: id=${clip.id}, startTime=${clip.startTime}`);
        
        // 現在の時間を取得（プレイヘッドの位置から逆算）
        let absoluteTime = window.audioEngine.currentTime;
        
        // もしcurrentTimeが0で、プレイヘッドが移動している場合は、プレイヘッドの位置から計算
        if (absoluteTime === 0 || !this.isPlaying) {
            const playhead = document.querySelector('.playhead');
            if (playhead) {
                const trackHeader = document.querySelector('.track-header');
                const headerWidth = trackHeader ? trackHeader.offsetWidth : 240;
                const playheadLeft = parseFloat(playhead.style.left) || headerWidth;
                const offsetX = playheadLeft - headerWidth;
                absoluteTime = offsetX / window.trackManager.pixelsPerSecond;
            }
        }
        
        const relativeTime = absoluteTime - clip.startTime;
        
        // クリップの範囲外なら何もしない（少し余裕を持たせる）
        if (relativeTime < -0.1 || relativeTime > clip.duration + 0.1) {
            return;
        }
        
        // 範囲内に収める
        const clampedTime = Math.max(0, Math.min(relativeTime, clip.duration));
        
        console.log(`  📍 Time calculation: abs=${absoluteTime.toFixed(3)}s, clip.start=${clip.startTime.toFixed(3)}s, relative=${relativeTime.toFixed(3)}s, clamped=${clampedTime.toFixed(3)}s`);
        
        // 現在の値を取得
        let value;
        const trackElement = document.querySelector(`[data-track-id="${trackId}"]`);
        
        switch (parameter) {
            case 'volume':
                const volumeSlider = trackElement.querySelector('.volume-slider');
                value = parseFloat(volumeSlider.value);
                break;
            case 'pan':
                const panSlider = trackElement.querySelector('.pan-slider');
                value = parseFloat(panSlider.value);
                break;
            case 'gain':
                const gainSlider = document.getElementById('clipGainSlider');
                value = gainSlider ? parseFloat(gainSlider.value) : 0;
                break;
        }
        
        // キーフレーム追加または更新（履歴保存なし）
        const nearest = window.keyframeManager.getNearestKeyframe(
            this.selectedClip.id, 
            parameter, 
            clampedTime,
            0.01
        );
        
        if (nearest) {
            window.keyframeManager.updateKeyframe(
                this.selectedClip.id,
                parameter,
                nearest.id,
                { value }
            );
        } else {
            window.keyframeManager.addKeyframe(
                this.selectedClip.id,
                parameter,
                clampedTime,
                value,
                'linear'
            );
        }
        
        // 再描画（履歴保存なし）
        this.renderKeyframesForClip(this.selectedClip.id, trackId);
    }
    
    disableKeyframeRecording() {
        // キーフレーム記録モード終了時に、スライダーをトラックの実際の値に戻す
        if (this.selectedTrackId !== null) {
            const track = window.trackManager.getTrack(this.selectedTrackId);
            if (track) {
                const trackElement = document.querySelector(`[data-track-id="${this.selectedTrackId}"]`);
                if (trackElement) {
                    // ボリュームスライダーを元に戻す
                    const volumeSlider = trackElement.querySelector('.volume-slider');
                    if (volumeSlider) {
                        volumeSlider.value = track.volume;
                        const volumeValue = trackElement.querySelector('.volume-value');
                        if (volumeValue) {
                            volumeValue.textContent = Math.round(track.volume * 100);
                        }
                    }
                    
                    // パンスライダーを元に戻す
                    const panSlider = trackElement.querySelector('.pan-slider');
                    if (panSlider) {
                        panSlider.value = track.pan;
                    }
                }
            }
        }
        
        this.selectedClip = null;
        this.selectedTrackId = null;
    }
    
    // クリップのキーフレームを描画
    renderKeyframesForClip(clipId, trackId) {
        this.removeKeyframeElements(clipId);
        
        const clip = window.trackManager.getTrack(trackId)?.clips.find(c => c.id === clipId);
        if (!clip) return;
        
        const clipElement = document.querySelector(`.track-clip[data-clip-id="${clipId}"]`);
        if (!clipElement) return;
        
        // 基本パラメーター
        const baseParams = ['volume', 'pan', 'gain'];
        baseParams.forEach((param, index) => {
            const keyframes = window.keyframeManager.getParameterKeyframes(clipId, param);
            
            keyframes.forEach(kf => {
                this.createKeyframeDiamond(clipElement, clip, kf, param, trackId, index);
            });
        });
        
        // エフェクトパラメーター
        const effectParams = [
            'eqLow', 'eqMid', 'eqHigh',
            'trackLimiterThreshold', 'trackLimiterRelease', 'trackLimiterRatio',
            'trackExpanderThreshold', 'trackExpanderRatio', 'trackExpanderRelease',
            'trackHighpassCutoff', 'trackHighpassResonance',
            'trackLowpassCutoff', 'trackLowpassResonance'
        ];
        
        let effectParamIndex = baseParams.length;
        effectParams.forEach((param) => {
            const keyframes = window.keyframeManager.getParameterKeyframes(clipId, param);
            
            if (keyframes.length > 0) {
                keyframes.forEach(kf => {
                    this.createKeyframeDiamond(clipElement, clip, kf, param, trackId, effectParamIndex);
                });
                effectParamIndex++;
            }
        });
    }
    
    createKeyframeDiamond(clipElement, clip, keyframe, parameter, trackId, paramIndex) {
        const diamond = document.createElement('div');
        diamond.className = 'keyframe-diamond';
        diamond.dataset.keyframeId = keyframe.id;
        diamond.dataset.parameter = parameter;
        diamond.dataset.clipId = clip.id;
        
        const leftPos = (keyframe.time / clip.duration) * 100;
        diamond.style.left = `${leftPos}%`;
        diamond.style.bottom = `${5 + paramIndex * 15}px`;
        diamond.title = `🐻 ${parameter}: ${keyframe.value.toFixed(2)} @ ${keyframe.time.toFixed(2)}s`;
        
        diamond.addEventListener('mousedown', (e) => this.onKeyframeDiamondMouseDown(e, keyframe, clip.id, trackId, parameter));
        diamond.addEventListener('contextmenu', (e) => this.onKeyframeDiamondRightClick(e, keyframe, clip.id, trackId, parameter));
        
        clipElement.appendChild(diamond);
        
        if (!this.keyframeElements.has(clip.id)) {
            this.keyframeElements.set(clip.id, {});
        }
        if (!this.keyframeElements.get(clip.id)[parameter]) {
            this.keyframeElements.get(clip.id)[parameter] = [];
        }
        this.keyframeElements.get(clip.id)[parameter].push(diamond);
    }
    
    removeKeyframeElements(clipId) {
        const clipElement = document.querySelector(`.track-clip[data-clip-id="${clipId}"]`);
        if (clipElement) {
            clipElement.querySelectorAll('.keyframe-diamond').forEach(el => el.remove());
        }
        this.keyframeElements.delete(clipId);
    }
    
    onKeyframeDiamondMouseDown(e, keyframe, clipId, trackId, parameter) {
        if (e.button !== 0) return;
        
        e.stopPropagation();
        e.preventDefault();
        
        this.isDraggingKeyframe = true;
        this.draggedKeyframe = {
            keyframe,
            clipId,
            trackId,
            parameter,
            startX: e.clientX,
            startTime: keyframe.time
        };
        
        document.body.style.cursor = 'grabbing';
    }
    
    onGlobalMouseMove(e) {
        if (!this.isDraggingKeyframe || !this.draggedKeyframe) return;
        
        const clip = window.trackManager.getTrack(this.draggedKeyframe.trackId)?.clips
            .find(c => c.id === this.draggedKeyframe.clipId);
        if (!clip) return;
        
        const deltaX = e.clientX - this.draggedKeyframe.startX;
        const deltaTime = deltaX / window.trackManager.pixelsPerSecond;
        const newTime = Math.max(0, Math.min(clip.duration, this.draggedKeyframe.startTime + deltaTime));
        
        window.keyframeManager.updateKeyframe(
            this.draggedKeyframe.clipId,
            this.draggedKeyframe.parameter,
            this.draggedKeyframe.keyframe.id,
            { time: newTime }
        );
        
        this.renderKeyframesForClip(this.draggedKeyframe.clipId, this.draggedKeyframe.trackId);
    }
    
    onGlobalMouseUp() {
        if (this.isDraggingKeyframe) {
            this.isDraggingKeyframe = false;
            this.draggedKeyframe = null;
            document.body.style.cursor = '';
        }
    }
    
    onKeyframeDiamondRightClick(e, keyframe, clipId, trackId, parameter) {
        e.preventDefault();
        e.stopPropagation();
        
        if (confirm(`キーフレームを削除しますか?\n${parameter}: ${keyframe.value.toFixed(2)} @ ${keyframe.time.toFixed(2)}s`)) {
            window.keyframeManager.removeKeyframe(clipId, parameter, keyframe.id);
            this.renderKeyframesForClip(clipId, trackId);
        }
    }
}

window.timelineKeyframeUI = new TimelineKeyframeUI();
