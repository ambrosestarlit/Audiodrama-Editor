// ==========================================
// EffectsManager - エフェクト管理クラス
// ==========================================

class EffectsManager {
    constructor() {
        this.isOpen = false;
        this.currentTrackId = null;
        this.currentClipId = null;
    }
    
    // 初期化
    init() {
        this.setupEventListeners();
    }
    
    // イベントリスナー設定
    setupEventListeners() {
        // トラックリミッター有効化チェックボックス
        const enabledCheckbox = document.getElementById('trackLimiterEnabled');
        if (enabledCheckbox) {
            enabledCheckbox.addEventListener('change', (e) => {
                if (this.currentTrackId === null) return;
                
                const enabled = e.target.checked;
                window.audioEngine.setTrackLimiterEnabled(this.currentTrackId, enabled);
                
                // スライダーの有効/無効を切り替え
                const sliders = ['trackLimiterThreshold', 'trackLimiterRelease', 'trackLimiterRatio'];
                sliders.forEach(id => {
                    const slider = document.getElementById(id);
                    if (slider) slider.disabled = !enabled;
                });
            });
        }
        
        // トラックリミッター - Threshold
        const trackThreshold = document.getElementById('trackLimiterThreshold');
        if (trackThreshold) {
            trackThreshold.addEventListener('input', (e) => {
                if (this.currentTrackId === null) return;
                
                const value = parseFloat(e.target.value);
                window.audioEngine.setTrackLimiter(this.currentTrackId, 'threshold', value);
                
                const valueDisplay = e.target.nextElementSibling;
                if (valueDisplay) {
                    valueDisplay.textContent = `${value.toFixed(1)} dB`;
                }
            });
        }
        
        // トラックリミッター - Release
        const trackRelease = document.getElementById('trackLimiterRelease');
        if (trackRelease) {
            trackRelease.addEventListener('input', (e) => {
                if (this.currentTrackId === null) return;
                
                const value = parseFloat(e.target.value);
                window.audioEngine.setTrackLimiter(this.currentTrackId, 'release', value);
                
                const valueDisplay = e.target.nextElementSibling;
                if (valueDisplay) {
                    valueDisplay.textContent = `${value.toFixed(0)} ms`;
                }
            });
        }
        
        // トラックリミッター - Ratio
        const trackRatio = document.getElementById('trackLimiterRatio');
        if (trackRatio) {
            trackRatio.addEventListener('input', (e) => {
                if (this.currentTrackId === null) return;
                
                const value = parseFloat(e.target.value);
                window.audioEngine.setTrackLimiter(this.currentTrackId, 'ratio', value);
                
                const valueDisplay = e.target.nextElementSibling;
                if (valueDisplay) {
                    valueDisplay.textContent = `${value.toFixed(1)}:1`;
                }
            });
        }
        
        // ノーマライズ - 目標レベルスライダー
        const normalizeTarget = document.getElementById('normalizeTarget');
        if (normalizeTarget) {
            normalizeTarget.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                const valueDisplay = e.target.nextElementSibling;
                if (valueDisplay) {
                    valueDisplay.textContent = `${value.toFixed(1)} dB`;
                }
                
                // ゲイン調整を更新
                if (this.currentTrackId !== null && this.currentClipId !== null) {
                    this.updateNormalizeInfo(this.currentTrackId, this.currentClipId, value);
                }
            });
        }
        
        // ノーマライズ - プリセットボタン
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const value = parseFloat(e.target.dataset.value);
                const targetSlider = document.getElementById('normalizeTarget');
                if (targetSlider) {
                    targetSlider.value = value;
                    const valueDisplay = targetSlider.nextElementSibling;
                    if (valueDisplay) {
                        valueDisplay.textContent = `${value.toFixed(1)} dB`;
                    }
                    
                    // ゲイン調整を更新
                    if (this.currentTrackId !== null && this.currentClipId !== null) {
                        this.updateNormalizeInfo(this.currentTrackId, this.currentClipId, value);
                    }
                }
            });
        });
        
        // ノーマライズ適用ボタン
        const applyNormalizeBtn = document.getElementById('applyNormalizeBtn');
        if (applyNormalizeBtn) {
            applyNormalizeBtn.addEventListener('click', async () => {
                if (this.currentTrackId === null || this.currentClipId === null) return;
                
                const targetLevel = parseFloat(document.getElementById('normalizeTarget').value);
                await this.applyNormalize(this.currentTrackId, this.currentClipId, targetLevel);
            });
        }
        
        // エフェクトパネルを閉じる
        const closeBtn = document.getElementById('closeEffectsBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.togglePanel();
                this.currentTrackId = null;
                this.currentClipId = null;
            });
        }
    }
    
    // クリップのノーマライズ情報を読み込み
    async loadClipNormalizeInfo(trackId, clipId) {
        const track = window.trackManager.getTrack(trackId);
        if (!track) return;
        
        const clip = track.clips.find(c => c.id === clipId);
        if (!clip) return;
        
        // オーディオファイルを取得
        const audioFile = await window.fileManager.getAudioFile(clip.fileId);
        if (!audioFile || !audioFile.audioBuffer) return;
        
        // ピーク値を計算
        const peakValue = this.calculatePeak(audioFile.audioBuffer);
        const peakDb = 20 * Math.log10(peakValue);
        
        // 現在のピークを表示
        const currentPeakElement = document.getElementById('currentPeak');
        if (currentPeakElement) {
            currentPeakElement.textContent = `${peakDb.toFixed(1)} dB`;
            if (peakDb > -0.1) {
                currentPeakElement.style.color = 'var(--color-danger)';
            } else {
                currentPeakElement.style.color = 'var(--color-primary)';
            }
        }
        
        // ゲイン調整を計算
        const targetLevel = parseFloat(document.getElementById('normalizeTarget').value);
        const gainAdjust = targetLevel - peakDb;
        
        const gainAdjustElement = document.getElementById('gainAdjust');
        if (gainAdjustElement) {
            gainAdjustElement.textContent = `${gainAdjust >= 0 ? '+' : ''}${gainAdjust.toFixed(1)} dB`;
        }
    }
    
    // ノーマライズ情報を更新
    async updateNormalizeInfo(trackId, clipId, targetLevel) {
        const track = window.trackManager.getTrack(trackId);
        if (!track) return;
        
        const clip = track.clips.find(c => c.id === clipId);
        if (!clip) return;
        
        const audioFile = await window.fileManager.getAudioFile(clip.fileId);
        if (!audioFile || !audioFile.audioBuffer) return;
        
        const peakValue = this.calculatePeak(audioFile.audioBuffer);
        const peakDb = 20 * Math.log10(peakValue);
        const gainAdjust = targetLevel - peakDb;
        
        const gainAdjustElement = document.getElementById('gainAdjust');
        if (gainAdjustElement) {
            gainAdjustElement.textContent = `${gainAdjust >= 0 ? '+' : ''}${gainAdjust.toFixed(1)} dB`;
        }
    }
    
    // ピーク値を計算
    calculatePeak(audioBuffer) {
        let peak = 0;
        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
            const channelData = audioBuffer.getChannelData(channel);
            for (let i = 0; i < channelData.length; i++) {
                const abs = Math.abs(channelData[i]);
                if (abs > peak) peak = abs;
            }
        }
        return peak;
    }
    
    // ノーマライズを適用
    async applyNormalize(trackId, clipId, targetLevel) {
        const track = window.trackManager.getTrack(trackId);
        if (!track) return;
        
        const clip = track.clips.find(c => c.id === clipId);
        if (!clip) return;
        
        const audioFile = await window.fileManager.getAudioFile(clip.fileId);
        if (!audioFile || !audioFile.audioBuffer) return;
        
        // ピーク値を計算
        const peakValue = this.calculatePeak(audioFile.audioBuffer);
        const peakDb = 20 * Math.log10(peakValue);
        const gainAdjust = targetLevel - peakDb;
        const gainLinear = Math.pow(10, gainAdjust / 20);
        
        // 新しいオーディオバッファを作成
        const newBuffer = window.audioEngine.audioContext.createBuffer(
            audioFile.audioBuffer.numberOfChannels,
            audioFile.audioBuffer.length,
            audioFile.audioBuffer.sampleRate
        );
        
        // 各チャンネルにゲインを適用
        for (let channel = 0; channel < audioFile.audioBuffer.numberOfChannels; channel++) {
            const inputData = audioFile.audioBuffer.getChannelData(channel);
            const outputData = newBuffer.getChannelData(channel);
            
            for (let i = 0; i < inputData.length; i++) {
                outputData[i] = Math.max(-1, Math.min(1, inputData[i] * gainLinear));
            }
        }
        
        // オーディオバッファを更新
        audioFile.audioBuffer = newBuffer;
        
        // audioEngineのクリップも更新
        const audioTrack = window.audioEngine.getTrack(trackId);
        if (audioTrack) {
            const audioClip = audioTrack.clips.find(c => c.id === clipId);
            if (audioClip) {
                audioClip.audioBuffer = newBuffer;
            }
        }
        
        // UIを更新
        await this.loadClipNormalizeInfo(trackId, clipId);
        
        alert(`ノーマライズを適用しました\nゲイン調整: ${gainAdjust >= 0 ? '+' : ''}${gainAdjust.toFixed(1)} dB`);
    }
    
    // トラックのリミッター設定を読み込み
    loadTrackLimiterSettings(trackId) {
        const track = window.audioEngine.getTrack(trackId);
        if (!track) return;
        
        // 有効化チェックボックス
        const enabledCheckbox = document.getElementById('trackLimiterEnabled');
        if (enabledCheckbox) {
            enabledCheckbox.checked = track.limiterEnabled || false;
        }
        
        // Threshold
        const thresholdSlider = document.getElementById('trackLimiterThreshold');
        if (thresholdSlider) {
            const value = track.limiter.threshold.value;
            thresholdSlider.value = value;
            thresholdSlider.disabled = !track.limiterEnabled;
            const valueDisplay = thresholdSlider.nextElementSibling;
            if (valueDisplay) {
                valueDisplay.textContent = `${value.toFixed(1)} dB`;
            }
        }
        
        // Release
        const releaseSlider = document.getElementById('trackLimiterRelease');
        if (releaseSlider) {
            const value = track.limiter.release.value * 1000; // sからmsへ
            releaseSlider.value = value;
            releaseSlider.disabled = !track.limiterEnabled;
            const valueDisplay = releaseSlider.nextElementSibling;
            if (valueDisplay) {
                valueDisplay.textContent = `${value.toFixed(0)} ms`;
            }
        }
        
        // Ratio
        const ratioSlider = document.getElementById('trackLimiterRatio');
        if (ratioSlider) {
            const value = track.limiter.ratio.value;
            ratioSlider.value = value;
            ratioSlider.disabled = !track.limiterEnabled;
            const valueDisplay = ratioSlider.nextElementSibling;
            if (valueDisplay) {
                valueDisplay.textContent = `${value.toFixed(1)}:1`;
            }
        }
    }
    
    // パネルの開閉
    togglePanel() {
        const panel = document.getElementById('effectsPanel');
        if (!panel) return;
        
        this.isOpen = !this.isOpen;
        panel.classList.toggle('open', this.isOpen);
    }
    
    // トラックエフェクトパネルを開く
    openTrackEffects(trackId, clipId = null) {
        this.currentTrackId = trackId;
        this.currentClipId = clipId;
        
        const panel = document.getElementById('effectsPanel');
        const panelHeader = panel.querySelector('.panel-header h2');
        
        const track = window.trackManager.getTrack(trackId);
        if (track) {
            if (clipId) {
                const clip = track.clips.find(c => c.id === clipId);
                panelHeader.textContent = `🎛️ エフェクト - ${clip ? clip.name : 'クリップ'}`;
            } else {
                panelHeader.textContent = `🎛️ エフェクト - ${track.name}`;
            }
        }
        
        this.isOpen = true;
        panel.classList.add('open');
        
        if (clipId) {
            // クリップのノーマライズ情報を表示
            this.loadClipNormalizeInfo(trackId, clipId);
        } else {
            // トラックのリミッター設定を読み込み
            this.loadTrackLimiterSettings(trackId);
        }
    }
    
    // EQ値をリセット
    resetEQ() {
        const bands = ['low', 'mid', 'high'];
        
        bands.forEach(band => {
            window.audioEngine.setEQ(band, 0);
            
            const slider = document.getElementById(`eq${band.charAt(0).toUpperCase() + band.slice(1)}`);
            if (slider) {
                slider.value = 0;
                const valueDisplay = slider.nextElementSibling;
                if (valueDisplay) {
                    valueDisplay.textContent = '0 dB';
                }
            }
        });
    }
    
    // リミッター値をリセット
    resetLimiter() {
        const defaults = {
            threshold: -6,
            release: 250,
            ceiling: -0.1
        };
        
        // Threshold
        window.audioEngine.setLimiter('threshold', defaults.threshold);
        const thresholdSlider = document.getElementById('limiterThreshold');
        if (thresholdSlider) {
            thresholdSlider.value = defaults.threshold;
            const valueDisplay = thresholdSlider.nextElementSibling;
            if (valueDisplay) {
                valueDisplay.textContent = `${defaults.threshold} dB`;
            }
        }
        
        // Release
        window.audioEngine.setLimiter('release', defaults.release);
        const releaseSlider = document.getElementById('limiterRelease');
        if (releaseSlider) {
            releaseSlider.value = defaults.release;
            const valueDisplay = releaseSlider.nextElementSibling;
            if (valueDisplay) {
                valueDisplay.textContent = `${defaults.release} ms`;
            }
        }
        
        // Ceiling
        window.audioEngine.setLimiter('ceiling', defaults.ceiling);
        const ceilingSlider = document.getElementById('limiterCeiling');
        if (ceilingSlider) {
            ceilingSlider.value = defaults.ceiling;
            const valueDisplay = ceilingSlider.nextElementSibling;
            if (valueDisplay) {
                valueDisplay.textContent = `${defaults.ceiling} dB`;
            }
        }
    }
    
    // 全エフェクトをリセット
    resetAllEffects() {
        this.resetEQ();
        this.resetLimiter();
    }
    
    // エフェクト設定を取得
    getEffectSettings() {
        return {
            eq: {
                low: parseFloat(document.getElementById('eqLow')?.value || 0),
                mid: parseFloat(document.getElementById('eqMid')?.value || 0),
                high: parseFloat(document.getElementById('eqHigh')?.value || 0)
            },
            limiter: {
                threshold: parseFloat(document.getElementById('limiterThreshold')?.value || -6),
                release: parseFloat(document.getElementById('limiterRelease')?.value || 250),
                ceiling: parseFloat(document.getElementById('limiterCeiling')?.value || -0.1)
            }
        };
    }
    
    // エフェクト設定を適用
    applyEffectSettings(settings) {
        if (!settings) return;
        
        // EQ
        if (settings.eq) {
            ['low', 'mid', 'high'].forEach(band => {
                const value = settings.eq[band] || 0;
                window.audioEngine.setEQ(band, value);
                
                const slider = document.getElementById(`eq${band.charAt(0).toUpperCase() + band.slice(1)}`);
                if (slider) {
                    slider.value = value;
                    const valueDisplay = slider.nextElementSibling;
                    if (valueDisplay) {
                        valueDisplay.textContent = `${value >= 0 ? '+' : ''}${value.toFixed(1)} dB`;
                    }
                }
            });
        }
        
        // Limiter
        if (settings.limiter) {
            ['threshold', 'release', 'ceiling'].forEach(param => {
                const value = settings.limiter[param];
                if (value !== undefined) {
                    window.audioEngine.setLimiter(param, value);
                    
                    const sliderId = `limiter${param.charAt(0).toUpperCase() + param.slice(1)}`;
                    const slider = document.getElementById(sliderId);
                    if (slider) {
                        slider.value = value;
                        const valueDisplay = slider.nextElementSibling;
                        if (valueDisplay) {
                            if (param === 'release') {
                                valueDisplay.textContent = `${value.toFixed(0)} ms`;
                            } else {
                                valueDisplay.textContent = `${value.toFixed(1)} dB`;
                            }
                        }
                    }
                }
            });
        }
    }
}

// グローバルインスタンス
window.effectsManager = new EffectsManager();
