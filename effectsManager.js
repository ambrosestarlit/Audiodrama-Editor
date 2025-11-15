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
        try {
            console.log('EffectsManager: Setting up event listeners...');
            this.setupEventListeners();
            console.log('EffectsManager: Initialized successfully');
        } catch (error) {
            console.error('EffectsManager initialization error:', error);
            throw error;
        }
    }
    
    // イベントリスナー設定
    setupEventListeners() {
        // パネルを閉じるボタン
        const closeBtn = document.getElementById('closeEffectsBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closePanel();
            });
        }
        
        // エフェクトセクションの折りたたみ機能
        this.setupCollapsibleSections();
        
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
                
                // 波形を更新
                this.updateTrackClipsWaveforms(this.currentTrackId);
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
                
                // 波形を更新
                this.updateTrackClipsWaveforms(this.currentTrackId);
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
                
                // 波形を更新
                this.updateTrackClipsWaveforms(this.currentTrackId);
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
                
                // 波形を更新
                this.updateTrackClipsWaveforms(this.currentTrackId);
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
                    
                    // 波形を更新
                    this.updateTrackClipsWaveforms(this.currentTrackId);
                }
            });
        });
        
        // ノイズリダクション有効化チェックボックス
        const noiseReductionEnabledCheckbox = document.getElementById('trackNoiseReductionEnabled');
        if (noiseReductionEnabledCheckbox) {
            noiseReductionEnabledCheckbox.addEventListener('change', (e) => {
                if (this.currentTrackId === null) return;
                
                const enabled = e.target.checked;
                window.audioEngine.setTrackNoiseReductionEnabled(this.currentTrackId, enabled);
                
                // ハイパス・ローパスのチェックボックスの有効/無効を切り替え
                const checkboxes = ['trackHighpassEnabled', 'trackLowpassEnabled'];
                checkboxes.forEach(id => {
                    const checkbox = document.getElementById(id);
                    if (checkbox) checkbox.disabled = !enabled;
                });
                
                // スライダーの有効/無効を切り替え（チェック状態も考慮）
                const highpassEnabled = document.getElementById('trackHighpassEnabled')?.checked;
                const lowpassEnabled = document.getElementById('trackLowpassEnabled')?.checked;
                
                const highpassSliders = ['trackHighpassCutoff', 'trackHighpassResonance'];
                highpassSliders.forEach(id => {
                    const slider = document.getElementById(id);
                    if (slider) slider.disabled = !enabled || !highpassEnabled;
                });
                
                const lowpassSliders = ['trackLowpassCutoff', 'trackLowpassResonance'];
                lowpassSliders.forEach(id => {
                    const slider = document.getElementById(id);
                    if (slider) slider.disabled = !enabled || !lowpassEnabled;
                });
                
                // FXボタンの状態を更新
                this.updateFXButtonState(this.currentTrackId);
            });
        }
        
        // ハイパスフィルタ有効化チェックボックス
        const highpassEnabledCheckbox = document.getElementById('trackHighpassEnabled');
        if (highpassEnabledCheckbox) {
            highpassEnabledCheckbox.addEventListener('change', (e) => {
                if (this.currentTrackId === null) return;
                
                const enabled = e.target.checked;
                window.audioEngine.setTrackHighpassEnabled(this.currentTrackId, enabled);
                
                // スライダーの有効/無効を切り替え
                const sliders = ['trackHighpassCutoff', 'trackHighpassResonance'];
                const noiseReductionEnabled = document.getElementById('trackNoiseReductionEnabled')?.checked;
                sliders.forEach(id => {
                    const slider = document.getElementById(id);
                    if (slider) slider.disabled = !noiseReductionEnabled || !enabled;
                });
                
                // FXボタンの状態を更新
                this.updateFXButtonState(this.currentTrackId);
            });
        }
        
        // ハイパスフィルタ - Cutoff
        const highpassCutoff = document.getElementById('trackHighpassCutoff');
        if (highpassCutoff) {
            highpassCutoff.addEventListener('input', (e) => {
                if (this.currentTrackId === null) return;
                
                const value = parseFloat(e.target.value);
                window.audioEngine.setTrackNoiseReduction(this.currentTrackId, 'highpassCutoff', value);
                
                const valueDisplay = e.target.nextElementSibling;
                if (valueDisplay) {
                    valueDisplay.textContent = `${value.toFixed(0)} Hz`;
                }
            });
        }
        
        // ハイパスフィルタ - Resonance
        const highpassResonance = document.getElementById('trackHighpassResonance');
        if (highpassResonance) {
            highpassResonance.addEventListener('input', (e) => {
                if (this.currentTrackId === null) return;
                
                const value = parseFloat(e.target.value);
                window.audioEngine.setTrackNoiseReduction(this.currentTrackId, 'highpassResonance', value);
                
                const valueDisplay = e.target.nextElementSibling;
                if (valueDisplay) {
                    valueDisplay.textContent = value.toFixed(2);
                }
            });
        }
        
        // ローパスフィルタ有効化チェックボックス
        const lowpassEnabledCheckbox = document.getElementById('trackLowpassEnabled');
        if (lowpassEnabledCheckbox) {
            lowpassEnabledCheckbox.addEventListener('change', (e) => {
                if (this.currentTrackId === null) return;
                
                const enabled = e.target.checked;
                window.audioEngine.setTrackLowpassEnabled(this.currentTrackId, enabled);
                
                // スライダーの有効/無効を切り替え
                const sliders = ['trackLowpassCutoff', 'trackLowpassResonance'];
                const noiseReductionEnabled = document.getElementById('trackNoiseReductionEnabled')?.checked;
                sliders.forEach(id => {
                    const slider = document.getElementById(id);
                    if (slider) slider.disabled = !noiseReductionEnabled || !enabled;
                });
                
                // FXボタンの状態を更新
                this.updateFXButtonState(this.currentTrackId);
            });
        }
        
        // ローパスフィルタ - Cutoff
        const lowpassCutoff = document.getElementById('trackLowpassCutoff');
        if (lowpassCutoff) {
            lowpassCutoff.addEventListener('input', (e) => {
                if (this.currentTrackId === null) return;
                
                const value = parseFloat(e.target.value);
                window.audioEngine.setTrackNoiseReduction(this.currentTrackId, 'lowpassCutoff', value);
                
                const valueDisplay = e.target.nextElementSibling;
                if (valueDisplay) {
                    valueDisplay.textContent = `${value.toFixed(0)} Hz`;
                }
            });
        }
        
        // ローパスフィルタ - Resonance
        const lowpassResonance = document.getElementById('trackLowpassResonance');
        if (lowpassResonance) {
            lowpassResonance.addEventListener('input', (e) => {
                if (this.currentTrackId === null) return;
                
                const value = parseFloat(e.target.value);
                window.audioEngine.setTrackNoiseReduction(this.currentTrackId, 'lowpassResonance', value);
                
                const valueDisplay = e.target.nextElementSibling;
                if (valueDisplay) {
                    valueDisplay.textContent = value.toFixed(2);
                }
            });
        }
        
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
                
                // 波形を更新
                this.updateTrackClipsWaveforms(this.currentTrackId);
            });
        }
        
        // エキスパンダー有効化チェックボックス
        const expanderEnabledCheckbox = document.getElementById('trackExpanderEnabled');
        if (expanderEnabledCheckbox) {
            expanderEnabledCheckbox.addEventListener('change', (e) => {
                if (this.currentTrackId === null) return;
                
                const enabled = e.target.checked;
                window.audioEngine.setTrackExpanderEnabled(this.currentTrackId, enabled);
                
                // スライダーの有効/無効を切り替え
                const sliders = ['trackExpanderThreshold', 'trackExpanderRatio', 'trackExpanderRelease'];
                sliders.forEach(id => {
                    const slider = document.getElementById(id);
                    if (slider) slider.disabled = !enabled;
                });
                
                // FXボタンの状態を更新
                this.updateFXButtonState(this.currentTrackId);
            });
        }
        
        // エキスパンダー - Threshold
        const expanderThreshold = document.getElementById('trackExpanderThreshold');
        if (expanderThreshold) {
            expanderThreshold.addEventListener('input', (e) => {
                if (this.currentTrackId === null) return;
                
                const value = parseFloat(e.target.value);
                window.audioEngine.setTrackExpander(this.currentTrackId, 'threshold', value);
                
                const valueDisplay = e.target.nextElementSibling;
                if (valueDisplay) {
                    valueDisplay.textContent = `${value.toFixed(0)} dB`;
                }
            });
        }
        
        // エキスパンダー - Ratio
        const expanderRatio = document.getElementById('trackExpanderRatio');
        if (expanderRatio) {
            expanderRatio.addEventListener('input', (e) => {
                if (this.currentTrackId === null) return;
                
                const value = parseFloat(e.target.value);
                window.audioEngine.setTrackExpander(this.currentTrackId, 'ratio', value);
                
                const valueDisplay = e.target.nextElementSibling;
                if (valueDisplay) {
                    valueDisplay.textContent = value.toFixed(2);
                }
            });
        }
        
        // エキスパンダー - Release
        const expanderRelease = document.getElementById('trackExpanderRelease');
        if (expanderRelease) {
            expanderRelease.addEventListener('input', (e) => {
                if (this.currentTrackId === null) return;
                
                const value = parseFloat(e.target.value);
                window.audioEngine.setTrackExpander(this.currentTrackId, 'release', value);
                
                const valueDisplay = e.target.nextElementSibling;
                if (valueDisplay) {
                    valueDisplay.textContent = `${value.toFixed(0)} ms`;
                }
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
                
                // 波形を更新
                this.updateTrackClipsWaveforms(this.currentTrackId);
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
                
                // 波形を更新
                this.updateTrackClipsWaveforms(this.currentTrackId);
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
        
        // ノイズリダクション有効化チェックボックス
        const noiseReductionEnabledCheckbox = document.getElementById('trackNoiseReductionEnabled');
        if (noiseReductionEnabledCheckbox) {
            noiseReductionEnabledCheckbox.checked = track.noiseReductionEnabled || false;
        }
        
        // ハイパスフィルタ有効化チェックボックス
        const highpassEnabledCheckbox = document.getElementById('trackHighpassEnabled');
        if (highpassEnabledCheckbox) {
            highpassEnabledCheckbox.checked = track.noiseReduction.highpassEnabled || false;
            highpassEnabledCheckbox.disabled = !track.noiseReductionEnabled;
        }
        
        // ハイパスフィルタ - Cutoff
        const highpassCutoff = document.getElementById('trackHighpassCutoff');
        if (highpassCutoff) {
            const value = track.noiseReduction.highpassCutoff;
            highpassCutoff.value = value;
            highpassCutoff.disabled = !track.noiseReductionEnabled || !track.noiseReduction.highpassEnabled;
            const valueDisplay = highpassCutoff.nextElementSibling;
            if (valueDisplay) {
                valueDisplay.textContent = `${value.toFixed(0)} Hz`;
            }
        }
        
        // ハイパスフィルタ - Resonance
        const highpassResonance = document.getElementById('trackHighpassResonance');
        if (highpassResonance) {
            const value = track.noiseReduction.highpassResonance;
            highpassResonance.value = value;
            highpassResonance.disabled = !track.noiseReductionEnabled || !track.noiseReduction.highpassEnabled;
            const valueDisplay = highpassResonance.nextElementSibling;
            if (valueDisplay) {
                valueDisplay.textContent = value.toFixed(2);
            }
        }
        
        // ローパスフィルタ有効化チェックボックス
        const lowpassEnabledCheckbox = document.getElementById('trackLowpassEnabled');
        if (lowpassEnabledCheckbox) {
            lowpassEnabledCheckbox.checked = track.noiseReduction.lowpassEnabled || false;
            lowpassEnabledCheckbox.disabled = !track.noiseReductionEnabled;
        }
        
        // ローパスフィルタ - Cutoff
        const lowpassCutoff = document.getElementById('trackLowpassCutoff');
        if (lowpassCutoff) {
            const value = track.noiseReduction.lowpassCutoff;
            lowpassCutoff.value = value;
            lowpassCutoff.disabled = !track.noiseReductionEnabled || !track.noiseReduction.lowpassEnabled;
            const valueDisplay = lowpassCutoff.nextElementSibling;
            if (valueDisplay) {
                valueDisplay.textContent = `${value.toFixed(0)} Hz`;
            }
        }
        
        // ローパスフィルタ - Resonance
        const lowpassResonance = document.getElementById('trackLowpassResonance');
        if (lowpassResonance) {
            const value = track.noiseReduction.lowpassResonance;
            lowpassResonance.value = value;
            lowpassResonance.disabled = !track.noiseReductionEnabled || !track.noiseReduction.lowpassEnabled;
            const valueDisplay = lowpassResonance.nextElementSibling;
            if (valueDisplay) {
                valueDisplay.textContent = value.toFixed(2);
            }
        }
        
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
        
        // エキスパンダー有効化チェックボックス
        const expanderEnabledCheckbox = document.getElementById('trackExpanderEnabled');
        if (expanderEnabledCheckbox) {
            expanderEnabledCheckbox.checked = track.expanderEnabled || false;
        }
        
        // エキスパンダー - Threshold
        const expanderThresholdSlider = document.getElementById('trackExpanderThreshold');
        if (expanderThresholdSlider) {
            const value = track.expander.threshold.value;
            expanderThresholdSlider.value = value;
            expanderThresholdSlider.disabled = !track.expanderEnabled;
            const valueDisplay = expanderThresholdSlider.nextElementSibling;
            if (valueDisplay) {
                valueDisplay.textContent = `${value.toFixed(0)} dB`;
            }
        }
        
        // エキスパンダー - Ratio
        const expanderRatioSlider = document.getElementById('trackExpanderRatio');
        if (expanderRatioSlider) {
            const value = track.expanderEnabled ? track.expander.ratio.value : 0.5;
            expanderRatioSlider.value = value;
            expanderRatioSlider.disabled = !track.expanderEnabled;
            const valueDisplay = expanderRatioSlider.nextElementSibling;
            if (valueDisplay) {
                valueDisplay.textContent = value.toFixed(2);
            }
        }
        
        // エキスパンダー - Release
        const expanderReleaseSlider = document.getElementById('trackExpanderRelease');
        if (expanderReleaseSlider) {
            const value = track.expander.release.value * 1000; // sからmsへ
            expanderReleaseSlider.value = value;
            expanderReleaseSlider.disabled = !track.expanderEnabled;
            const valueDisplay = expanderReleaseSlider.nextElementSibling;
            if (valueDisplay) {
                valueDisplay.textContent = `${value.toFixed(0)} ms`;
            }
        }
    }
    
    // FXボタンの状態を更新
    updateFXButtonState(trackId) {
        const track = window.audioEngine.getTrack(trackId);
        if (!track) return;
        
        const fxButton = document.querySelector(`[data-action="effects"][data-track-id="${trackId}"]`);
        if (!fxButton) return;
        
        // EQ、ノイズリダクション、エキスパンダー、またはリミッターが有効ならアクティブ状態にする
        const hasEffects = track.eqEnabled || track.noiseReductionEnabled || track.expanderEnabled || track.limiterEnabled;
        
        if (hasEffects) {
            fxButton.classList.add('active');
        } else {
            fxButton.classList.remove('active');
        }
    }
    
    // 折りたたみ機能の設定
    setupCollapsibleSections() {
        const sections = document.querySelectorAll('.effect-section');
        
        sections.forEach(section => {
            const header = section.querySelector('h3');
            if (!header) return;
            
            // 折りたたみボタンを作成
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'section-toggle-btn';
            toggleBtn.innerHTML = '<img src="open.png" alt="開く" class="toggle-icon">';
            toggleBtn.type = 'button';
            
            // h3の最初の子要素として挿入
            header.insertBefore(toggleBtn, header.firstChild);
            
            // 折りたたみ状態を管理
            let isCollapsed = false;
            
            toggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                isCollapsed = !isCollapsed;
                
                // コントロールエリアを取得
                const controls = section.querySelector('.eq-controls, .noisereduction-controls, .expander-controls, .limiter-controls');
                
                if (controls) {
                    if (isCollapsed) {
                        controls.style.display = 'none';
                        toggleBtn.classList.add('collapsed');
                    } else {
                        controls.style.display = 'block';
                        toggleBtn.classList.remove('collapsed');
                    }
                }
            });
        });
    }
    
    // パネルの開閉
    togglePanel() {
        const panel = document.getElementById('effectsPanel');
        if (!panel) return;
        
        this.isOpen = !this.isOpen;
        panel.classList.toggle('open', this.isOpen);
    }
    
    // パネルを閉じる
    closePanel() {
        const panel = document.getElementById('effectsPanel');
        if (!panel) return;
        
        this.isOpen = false;
        panel.classList.remove('open');
        this.currentTrackId = null;
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
    
    // トラックの全クリップの波形を更新
    updateTrackClipsWaveforms(trackId) {
        if (!window.trackManager) return;
        
        const track = window.trackManager.getTrack(trackId);
        if (!track) return;
        
        // トラックの全クリップの波形を再描画
        track.clips.forEach(clip => {
            window.trackManager.drawClipWaveform(trackId, clip.id);
        });
    }
}

// グローバルインスタンス
window.effectsManager = new EffectsManager();
