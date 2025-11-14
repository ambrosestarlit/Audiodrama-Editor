// ==========================================
// EffectsManager - エフェクト管理クラス
// ==========================================

class EffectsManager {
    constructor() {
        this.isOpen = false;
        this.currentTrackId = null;
    }
    
    // 初期化
    init() {
        this.setupEventListeners();
    }
    
    // イベントリスナー設定
    setupEventListeners() {
        // イコライザー有効化チェックボックス
        const eqEnabledCheckbox = document.getElementById('trackEQEnabled');
        if (eqEnabledCheckbox) {
            eqEnabledCheckbox.addEventListener('change', (e) => {
                if (this.currentTrackId === null) return;
                
                const enabled = e.target.checked;
                window.audioEngine.setTrackEQEnabled(this.currentTrackId, enabled);
                
                // スライダーとボタンの有効/無効を切り替え
                const sliders = ['eqLow', 'eqMid', 'eqHigh'];
                sliders.forEach(id => {
                    const slider = document.getElementById(id);
                    if (slider) slider.disabled = !enabled;
                });
                
                document.querySelectorAll('.eq-preset-btn').forEach(btn => {
                    btn.disabled = !enabled;
                });
                
                // FXボタンの状態を更新
                this.updateFXButtonState(this.currentTrackId);
            });
        }
        
        // イコライザー - Low
        const eqLow = document.getElementById('eqLow');
        if (eqLow) {
            eqLow.addEventListener('input', (e) => {
                if (this.currentTrackId === null) return;
                
                const value = parseFloat(e.target.value);
                window.audioEngine.setTrackEQ(this.currentTrackId, 'low', value);
                
                const valueDisplay = e.target.nextElementSibling;
                if (valueDisplay) {
                    valueDisplay.textContent = `${value >= 0 ? '+' : ''}${value.toFixed(1)} dB`;
                }
            });
        }
        
        // イコライザー - Mid
        const eqMid = document.getElementById('eqMid');
        if (eqMid) {
            eqMid.addEventListener('input', (e) => {
                if (this.currentTrackId === null) return;
                
                const value = parseFloat(e.target.value);
                window.audioEngine.setTrackEQ(this.currentTrackId, 'mid', value);
                
                const valueDisplay = e.target.nextElementSibling;
                if (valueDisplay) {
                    valueDisplay.textContent = `${value >= 0 ? '+' : ''}${value.toFixed(1)} dB`;
                }
            });
        }
        
        // イコライザー - High
        const eqHigh = document.getElementById('eqHigh');
        if (eqHigh) {
            eqHigh.addEventListener('input', (e) => {
                if (this.currentTrackId === null) return;
                
                const value = parseFloat(e.target.value);
                window.audioEngine.setTrackEQ(this.currentTrackId, 'high', value);
                
                const valueDisplay = e.target.nextElementSibling;
                if (valueDisplay) {
                    valueDisplay.textContent = `${value >= 0 ? '+' : ''}${value.toFixed(1)} dB`;
                }
            });
        }
        
        // イコライザープリセットボタン
        document.querySelectorAll('.eq-preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (this.currentTrackId === null) return;
                
                const preset = e.target.dataset.preset;
                const values = window.audioEngine.setTrackEQPreset(this.currentTrackId, preset);
                
                if (values) {
                    // UIを更新
                    if (eqLow) {
                        eqLow.value = values.low;
                        const valueDisplay = eqLow.nextElementSibling;
                        if (valueDisplay) {
                            valueDisplay.textContent = `${values.low >= 0 ? '+' : ''}${values.low.toFixed(1)} dB`;
                        }
                    }
                    if (eqMid) {
                        eqMid.value = values.mid;
                        const valueDisplay = eqMid.nextElementSibling;
                        if (valueDisplay) {
                            valueDisplay.textContent = `${values.mid >= 0 ? '+' : ''}${values.mid.toFixed(1)} dB`;
                        }
                    }
                    if (eqHigh) {
                        eqHigh.value = values.high;
                        const valueDisplay = eqHigh.nextElementSibling;
                        if (valueDisplay) {
                            valueDisplay.textContent = `${values.high >= 0 ? '+' : ''}${values.high.toFixed(1)} dB`;
                        }
                    }
                }
            });
        });
        
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
                
                // FXボタンの状態を更新
                this.updateFXButtonState(this.currentTrackId);
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
        
        // エフェクトパネルを閉じる
        const closeBtn = document.getElementById('closeEffectsBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.togglePanel();
                this.currentTrackId = null;
            });
        }
    }
    
    // トラックのリミッター設定を読み込み
    loadTrackLimiterSettings(trackId) {
        const track = window.audioEngine.getTrack(trackId);
        if (!track) return;
        
        // イコライザー有効化チェックボックス
        const eqEnabledCheckbox = document.getElementById('trackEQEnabled');
        if (eqEnabledCheckbox) {
            eqEnabledCheckbox.checked = track.eqEnabled || false;
        }
        
        // イコライザー設定を読み込み
        const eqLow = document.getElementById('eqLow');
        if (eqLow && track.eq) {
            const value = track.eq.low.gain.value;
            eqLow.value = value;
            eqLow.disabled = !track.eqEnabled;
            const valueDisplay = eqLow.nextElementSibling;
            if (valueDisplay) {
                valueDisplay.textContent = `${value >= 0 ? '+' : ''}${value.toFixed(1)} dB`;
            }
        }
        
        const eqMid = document.getElementById('eqMid');
        if (eqMid && track.eq) {
            const value = track.eq.mid.gain.value;
            eqMid.value = value;
            eqMid.disabled = !track.eqEnabled;
            const valueDisplay = eqMid.nextElementSibling;
            if (valueDisplay) {
                valueDisplay.textContent = `${value >= 0 ? '+' : ''}${value.toFixed(1)} dB`;
            }
        }
        
        const eqHigh = document.getElementById('eqHigh');
        if (eqHigh && track.eq) {
            const value = track.eq.high.gain.value;
            eqHigh.value = value;
            eqHigh.disabled = !track.eqEnabled;
            const valueDisplay = eqHigh.nextElementSibling;
            if (valueDisplay) {
                valueDisplay.textContent = `${value >= 0 ? '+' : ''}${value.toFixed(1)} dB`;
            }
        }
        
        // EQプリセットボタンも無効化
        document.querySelectorAll('.eq-preset-btn').forEach(btn => {
            btn.disabled = !track.eqEnabled;
        });
        
        // リミッター有効化チェックボックス
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
    
    // FXボタンの状態を更新
    updateFXButtonState(trackId) {
        const track = window.audioEngine.getTrack(trackId);
        if (!track) return;
        
        const fxButton = document.querySelector(`[data-action="effects"][data-track-id="${trackId}"]`);
        if (!fxButton) return;
        
        // EQまたはリミッターが有効ならアクティブ状態にする
        const hasEffects = track.eqEnabled || track.limiterEnabled;
        
        if (hasEffects) {
            fxButton.classList.add('active');
        } else {
            fxButton.classList.remove('active');
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
    openTrackEffects(trackId) {
        this.currentTrackId = trackId;
        
        const panel = document.getElementById('effectsPanel');
        const panelHeader = panel.querySelector('.panel-header h2');
        
        const track = window.trackManager.getTrack(trackId);
        if (track) {
            panelHeader.textContent = `🎛️ エフェクト - ${track.name}`;
        }
        
        this.isOpen = true;
        panel.classList.add('open');
        
        // トラックのリミッター設定を読み込み
        this.loadTrackLimiterSettings(trackId);
        
        // FXボタンの状態を更新
        this.updateFXButtonState(trackId);
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
