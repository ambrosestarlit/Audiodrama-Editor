// ==========================================
// EffectsManager - エフェクト管理クラス
// ==========================================

class EffectsManager {
    constructor() {
        this.isOpen = false;
    }
    
    // 初期化
    init() {
        this.setupEventListeners();
    }
    
    // イベントリスナー設定
    setupEventListeners() {
        // イコライザー
        const eqSliders = {
            low: document.getElementById('eqLow'),
            mid: document.getElementById('eqMid'),
            high: document.getElementById('eqHigh')
        };
        
        for (const [band, slider] of Object.entries(eqSliders)) {
            if (!slider) continue;
            
            const valueDisplay = slider.nextElementSibling;
            
            slider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                window.audioEngine.setEQ(band, value);
                
                if (valueDisplay) {
                    valueDisplay.textContent = `${value >= 0 ? '+' : ''}${value.toFixed(1)} dB`;
                }
            });
        }
        
        // リミッター
        const limiterThreshold = document.getElementById('limiterThreshold');
        const limiterRelease = document.getElementById('limiterRelease');
        const limiterCeiling = document.getElementById('limiterCeiling');
        
        if (limiterThreshold) {
            limiterThreshold.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                window.audioEngine.setLimiter('threshold', value);
                
                const valueDisplay = e.target.nextElementSibling;
                if (valueDisplay) {
                    valueDisplay.textContent = `${value.toFixed(1)} dB`;
                }
            });
        }
        
        if (limiterRelease) {
            limiterRelease.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                window.audioEngine.setLimiter('release', value);
                
                const valueDisplay = e.target.nextElementSibling;
                if (valueDisplay) {
                    valueDisplay.textContent = `${value.toFixed(0)} ms`;
                }
            });
        }
        
        if (limiterCeiling) {
            limiterCeiling.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                window.audioEngine.setLimiter('ceiling', value);
                
                const valueDisplay = e.target.nextElementSibling;
                if (valueDisplay) {
                    valueDisplay.textContent = `${value.toFixed(1)} dB`;
                }
            });
        }
        
        // エフェクトパネルを閉じる
        const closeBtn = document.getElementById('closeEffectsBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.togglePanel();
            });
        }
    }
    
    // パネルの開閉
    togglePanel() {
        const panel = document.getElementById('effectsPanel');
        if (!panel) return;
        
        this.isOpen = !this.isOpen;
        panel.classList.toggle('open', this.isOpen);
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
