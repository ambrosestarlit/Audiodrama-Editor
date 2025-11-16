// ==========================================
// AudioEngine - Web Audio API管理クラス
// ==========================================

class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.limiter = null;
        this.eq = {
            low: null,
            mid: null,
            high: null
        };
        this.tracks = [];
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = 0;
        this.playbackRate = 1.0;
        this.sampleRate = 48000;
        
        this.init();
    }
    
    // 初期化
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: this.sampleRate
            });
            
            // マスターゲイン
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.8;
            
            // イコライザー設定
            this.setupEqualizer();
            
            // リミッター設定
            this.setupLimiter();
            
            // 接続: EQ -> Limiter -> Master -> Destination
            this.eq.low.connect(this.eq.mid);
            this.eq.mid.connect(this.eq.high);
            this.eq.high.connect(this.limiter);
            this.limiter.connect(this.masterGain);
            this.masterGain.connect(this.audioContext.destination);
            
            console.log('AudioEngine initialized:', this.audioContext);
        } catch (error) {
            console.error('AudioContext initialization failed:', error);
            alert('お使いのブラウザは音声機能に対応していません。');
        }
    }
    
    // イコライザー設定
    setupEqualizer() {
        // Low (100Hz)
        this.eq.low = this.audioContext.createBiquadFilter();
        this.eq.low.type = 'lowshelf';
        this.eq.low.frequency.value = 100;
        this.eq.low.gain.value = 0;
        
        // Mid (1kHz)
        this.eq.mid = this.audioContext.createBiquadFilter();
        this.eq.mid.type = 'peaking';
        this.eq.mid.frequency.value = 1000;
        this.eq.mid.Q.value = 1;
        this.eq.mid.gain.value = 0;
        
        // High (10kHz)
        this.eq.high = this.audioContext.createBiquadFilter();
        this.eq.high.type = 'highshelf';
        this.eq.high.frequency.value = 10000;
        this.eq.high.gain.value = 0;
    }
    
    // W1 Limiter風のリミッター設定
    setupLimiter() {
        this.limiter = this.audioContext.createDynamicsCompressor();
        this.limiter.threshold.value = -6;  // dB
        this.limiter.knee.value = 0;  // ハードニー
        this.limiter.ratio.value = 20;  // 高いレシオでリミッター動作
        this.limiter.attack.value = 0.003;  // 3ms（高速アタック）
        this.limiter.release.value = 0.25;  // 250ms
    }
    
    // EQ調整
    setEQ(band, value) {
        if (this.eq[band]) {
            this.eq[band].gain.value = value;
        }
    }
    
    // リミッター調整
    setLimiter(param, value) {
        if (!this.limiter) return;
        
        switch(param) {
            case 'threshold':
                this.limiter.threshold.value = value;
                break;
            case 'release':
                this.limiter.release.value = value / 1000; // msからsへ変換
                break;
            case 'ceiling':
                // Output ceilingは後処理で実装（ゲイン調整）
                const ceiling = value;
                const makeup = Math.abs(ceiling);
                this.masterGain.gain.value = Math.pow(10, makeup / 20);
                break;
        }
    }
    
    // オーディオファイルをデコード
    async decodeAudioFile(arrayBuffer) {
        try {
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            return audioBuffer;
        } catch (error) {
            console.error('Audio decode error:', error);
            throw new Error('音声ファイルのデコードに失敗しました');
        }
    }
    
    // トラックの作成
    createTrack(id) {
        const track = {
            id: id,
            name: `トラック ${id}`,
            gain: this.audioContext.createGain(),
            pan: this.audioContext.createStereoPanner(),
            limiter: this.audioContext.createDynamicsCompressor(),
            expander: this.audioContext.createDynamicsCompressor(),
            noiseReduction: {
                highpass: this.audioContext.createBiquadFilter(),
                lowpass: this.audioContext.createBiquadFilter(),
                highpassCutoff: 80,
                lowpassCutoff: 8000,
                highpassResonance: 0.7,
                lowpassResonance: 0.7,
                highpassEnabled: false,
                lowpassEnabled: false
            },
            eq: {
                low: this.audioContext.createBiquadFilter(),
                mid: this.audioContext.createBiquadFilter(),
                high: this.audioContext.createBiquadFilter()
            },
            mute: false,
            solo: false,
            volume: 0.8,
            clips: [],
            limiterEnabled: false,
            eqEnabled: false,
            noiseReductionEnabled: false,
            expanderEnabled: false
        };
        
        track.gain.gain.value = track.volume;
        
        // リミッター設定（W1 Limiter風）
        track.limiter.threshold.value = -6;
        track.limiter.knee.value = 0;
        track.limiter.ratio.value = 20;
        track.limiter.attack.value = 0.003;
        track.limiter.release.value = 0.25;
        
        // エキスパンダー設定（ノイズ軽減用）
        track.expander.threshold.value = -40; // この音量以下を小さくする
        track.expander.knee.value = 10; // ソフトニー（自然な効果）
        track.expander.ratio.value = 0.5; // 1以下で拡張（小さい音をさらに小さく）
        track.expander.attack.value = 0.003;
        track.expander.release.value = 0.25;
        
        // ノイズリダクション設定（ハイパスフィルター）
        track.noiseReduction.highpass.type = 'highpass';
        track.noiseReduction.highpass.frequency.value = 20; // 初期は20Hz(ほぼ無効)
        track.noiseReduction.highpass.Q.value = track.noiseReduction.highpassResonance;
        
        // ノイズリダクション設定（ローパスフィルター）
        track.noiseReduction.lowpass.type = 'lowpass';
        track.noiseReduction.lowpass.frequency.value = 20000; // 初期は20kHz(ほぼ無効)
        track.noiseReduction.lowpass.Q.value = track.noiseReduction.lowpassResonance;
        
        // イコライザー設定
        track.eq.low.type = 'lowshelf';
        track.eq.low.frequency.value = 100;
        track.eq.low.gain.value = 0;
        
        track.eq.mid.type = 'peaking';
        track.eq.mid.frequency.value = 1000;
        track.eq.mid.Q.value = 1;
        track.eq.mid.gain.value = 0;
        
        track.eq.high.type = 'highshelf';
        track.eq.high.frequency.value = 10000;
        track.eq.high.gain.value = 0;
        
        // 接続: Track Gain -> Expander -> Highpass -> Lowpass -> Pan -> (EQ) -> (Limiter) -> Master EQ
        track.gain.connect(track.expander);
        track.expander.connect(track.noiseReduction.highpass);
        track.noiseReduction.highpass.connect(track.noiseReduction.lowpass);
        track.noiseReduction.lowpass.connect(track.pan);
        // 初期状態ではEQをバイパス
        track.pan.connect(this.eq.low);
        
        this.tracks.push(track);
        return track;
    }
    
    // トラックの取得
    getTrack(id) {
        return this.tracks.find(t => t.id === id);
    }
    
    // トラックの削除
    removeTrack(id) {
        const index = this.tracks.findIndex(t => t.id === id);
        if (index !== -1) {
            const track = this.tracks[index];
            track.gain.disconnect();
            track.pan.disconnect();
            this.tracks.splice(index, 1);
        }
    }
    
    // クリップの追加
    addClip(trackId, clipData) {
        const track = this.getTrack(trackId);
        if (!track) return null;
        
        const clip = {
            id: clipData.id,
            name: clipData.name,
            audioBuffer: clipData.audioBuffer,
            startTime: clipData.startTime || 0,
            offset: clipData.offset || 0,
            duration: clipData.duration || clipData.audioBuffer.duration,
            source: null,
            fadeIn: clipData.fadeIn || 0,
            fadeOut: clipData.fadeOut || 0
        };
        
        track.clips.push(clip);
        return clip;
    }
    
    // クリップの削除
    removeClip(trackId, clipId) {
        const track = this.getTrack(trackId);
        if (!track) return;
        
        const index = track.clips.findIndex(c => c.id === clipId);
        if (index !== -1) {
            const clip = track.clips[index];
            if (clip.source) {
                clip.source.stop();
                clip.source.disconnect();
            }
            track.clips.splice(index, 1);
        }
    }
    
    // トラックのミュート
    setTrackMute(trackId, mute) {
        const track = this.getTrack(trackId);
        if (!track) return;
        
        track.mute = mute;
        track.gain.gain.value = mute ? 0 : track.volume;
    }
    
    // トラックのソロ
    setTrackSolo(trackId, solo) {
        const track = this.getTrack(trackId);
        if (!track) return;
        
        track.solo = solo;
        
        // ソロ状態を更新
        const hasSolo = this.tracks.some(t => t.solo);
        
        this.tracks.forEach(t => {
            if (hasSolo) {
                // ソロトラックがある場合、ソロ以外をミュート
                t.gain.gain.value = (t.solo && !t.mute) ? t.volume : 0;
            } else {
                // ソロがない場合、通常のミュート状態に戻す
                t.gain.gain.value = t.mute ? 0 : t.volume;
            }
        });
    }
    
    // トラックのボリューム調整
    setTrackVolume(trackId, volume) {
        const track = this.getTrack(trackId);
        if (!track) return;
        
        track.volume = volume;
        
        // ミュートやソロ状態を考慮
        const hasSolo = this.tracks.some(t => t.solo);
        if (hasSolo) {
            track.gain.gain.value = (track.solo && !track.mute) ? volume : 0;
        } else {
            track.gain.gain.value = track.mute ? 0 : volume;
        }
    }
    
    // トラックのパン調整
    setTrackPan(trackId, pan) {
        const track = this.getTrack(trackId);
        if (!track) return;
        
        track.pan.pan.value = pan;
    }
    
    // トラックリミッターの有効化/無効化
    setTrackLimiterEnabled(trackId, enabled) {
        const track = this.getTrack(trackId);
        if (!track) return;
        
        track.limiterEnabled = enabled;
        this.updateTrackEffectChain(track);
    }
    
    // トラックイコライザーの有効化/無効化
    setTrackEQEnabled(trackId, enabled) {
        const track = this.getTrack(trackId);
        if (!track) return;
        
        track.eqEnabled = enabled;
        this.updateTrackEffectChain(track);
    }
    
    // トラックのエフェクトチェーンを更新
    updateTrackEffectChain(track) {
        // 一度全て切断
        track.pan.disconnect();
        
        if (track.eqEnabled && track.limiterEnabled) {
            // EQ -> Limiter -> Master
            track.pan.connect(track.eq.low);
            track.eq.low.connect(track.eq.mid);
            track.eq.mid.connect(track.eq.high);
            track.eq.high.connect(track.limiter);
            track.limiter.connect(this.eq.low);
        } else if (track.eqEnabled) {
            // EQ -> Master
            track.pan.connect(track.eq.low);
            track.eq.low.connect(track.eq.mid);
            track.eq.mid.connect(track.eq.high);
            track.eq.high.connect(this.eq.low);
        } else if (track.limiterEnabled) {
            // Limiter -> Master
            track.pan.connect(track.limiter);
            track.limiter.connect(this.eq.low);
        } else {
            // Direct -> Master
            track.pan.connect(this.eq.low);
        }
    }
    
    // トラックリミッターのパラメータ設定
    setTrackLimiter(trackId, param, value) {
        const track = this.getTrack(trackId);
        if (!track || !track.limiter) return;
        
        switch(param) {
            case 'threshold':
                track.limiter.threshold.value = value;
                break;
            case 'release':
                track.limiter.release.value = value / 1000; // msからsへ変換
                break;
            case 'ratio':
                track.limiter.ratio.value = value;
                break;
        }
    }
    
    // トラックイコライザーの設定
    setTrackEQ(trackId, band, gain) {
        const track = this.getTrack(trackId);
        if (!track || !track.eq) return;
        
        switch(band) {
            case 'low':
                track.eq.low.gain.value = gain;
                break;
            case 'mid':
                track.eq.mid.gain.value = gain;
                break;
            case 'high':
                track.eq.high.gain.value = gain;
                break;
        }
    }
    
    // トラックイコライザーのプリセット
    setTrackEQPreset(trackId, preset) {
        const track = this.getTrack(trackId);
        if (!track || !track.eq) return;
        
        const presets = {
            flat: { low: 0, mid: 0, high: 0 },
            phone: { low: -24, mid: 24, high: -24 }, // 電話風（中域のみ、低域と高域完全カット）
            clear: { low: -10, mid: 3, high: 11 },   // クリア（こもりを解消）
            wall: { low: 24, mid: -24, high: -24 }   // 壁越し（低域のみ、中高域カット）
        };
        
        const values = presets[preset];
        if (values) {
            track.eq.low.gain.value = values.low;
            track.eq.mid.gain.value = values.mid;
            track.eq.high.gain.value = values.high;
            
            return values;
        }
    }
    
    // ノイズリダクション有効化/無効化（全体のON/OFF）
    setTrackNoiseReductionEnabled(trackId, enabled) {
        const track = this.getTrack(trackId);
        if (!track) return;
        
        track.noiseReductionEnabled = enabled;
        
        console.log('🎛️ Noise Reduction:', {
            trackId: trackId,
            enabled: enabled,
            highpass: {
                enabled: track.noiseReduction.highpassEnabled,
                currentFreq: track.noiseReduction.highpass.frequency.value,
                targetFreq: enabled && track.noiseReduction.highpassEnabled ? track.noiseReduction.highpassCutoff : 20
            },
            lowpass: {
                enabled: track.noiseReduction.lowpassEnabled,
                currentFreq: track.noiseReduction.lowpass.frequency.value,
                targetFreq: enabled && track.noiseReduction.lowpassEnabled ? track.noiseReduction.lowpassCutoff : 20000
            }
        });
        
        // ハイパスフィルタの更新
        if (enabled && track.noiseReduction.highpassEnabled) {
            track.noiseReduction.highpass.frequency.value = track.noiseReduction.highpassCutoff;
        } else {
            track.noiseReduction.highpass.frequency.value = 20; // バイパス
        }
        
        // ローパスフィルタの更新
        if (enabled && track.noiseReduction.lowpassEnabled) {
            track.noiseReduction.lowpass.frequency.value = track.noiseReduction.lowpassCutoff;
        } else {
            track.noiseReduction.lowpass.frequency.value = 20000; // バイパス
        }
        
        console.log('🔊 After change:', {
            highpass: {
                frequency: track.noiseReduction.highpass.frequency.value,
                Q: track.noiseReduction.highpass.Q.value,
                type: track.noiseReduction.highpass.type
            },
            lowpass: {
                frequency: track.noiseReduction.lowpass.frequency.value,
                Q: track.noiseReduction.lowpass.Q.value,
                type: track.noiseReduction.lowpass.type
            }
        });
    }
    
    // ハイパスフィルタの個別ON/OFF
    setTrackHighpassEnabled(trackId, enabled) {
        const track = this.getTrack(trackId);
        if (!track || !track.noiseReduction) return;
        
        track.noiseReduction.highpassEnabled = enabled;
        
        console.log('🔧 Highpass Filter Toggle:', {
            trackId: trackId,
            enabled: enabled,
            noiseReductionEnabled: track.noiseReductionEnabled
        });
        
        // ノイズリダクション全体が有効な場合のみ反映
        if (track.noiseReductionEnabled) {
            if (enabled) {
                track.noiseReduction.highpass.frequency.value = track.noiseReduction.highpassCutoff;
            } else {
                track.noiseReduction.highpass.frequency.value = 20; // バイパス
            }
        }
    }
    
    // ローパスフィルタの個別ON/OFF
    setTrackLowpassEnabled(trackId, enabled) {
        const track = this.getTrack(trackId);
        if (!track || !track.noiseReduction) return;
        
        track.noiseReduction.lowpassEnabled = enabled;
        
        console.log('🔧 Lowpass Filter Toggle:', {
            trackId: trackId,
            enabled: enabled,
            noiseReductionEnabled: track.noiseReductionEnabled
        });
        
        // ノイズリダクション全体が有効な場合のみ反映
        if (track.noiseReductionEnabled) {
            if (enabled) {
                track.noiseReduction.lowpass.frequency.value = track.noiseReduction.lowpassCutoff;
            } else {
                track.noiseReduction.lowpass.frequency.value = 20000; // バイパス
            }
        }
    }
    
    // ノイズリダクション設定変更
    setTrackNoiseReduction(trackId, param, value) {
        const track = this.getTrack(trackId);
        if (!track || !track.noiseReduction) return;
        
        console.log('🔧 Noise Reduction Parameter Change:', {
            trackId: trackId,
            param: param,
            value: value
        });
        
        switch(param) {
            case 'highpassCutoff':
                track.noiseReduction.highpassCutoff = value;
                if (track.noiseReductionEnabled && track.noiseReduction.highpassEnabled) {
                    track.noiseReduction.highpass.frequency.value = value;
                }
                break;
            case 'lowpassCutoff':
                track.noiseReduction.lowpassCutoff = value;
                if (track.noiseReductionEnabled && track.noiseReduction.lowpassEnabled) {
                    track.noiseReduction.lowpass.frequency.value = value;
                }
                break;
            case 'highpassResonance':
                track.noiseReduction.highpassResonance = value;
                track.noiseReduction.highpass.Q.value = value;
                break;
            case 'lowpassResonance':
                track.noiseReduction.lowpassResonance = value;
                track.noiseReduction.lowpass.Q.value = value;
                break;
            // 後方互換性のため、古いパラメータ名も対応
            case 'cutoff':
                track.noiseReduction.highpassCutoff = value;
                if (track.noiseReductionEnabled && track.noiseReduction.highpassEnabled) {
                    track.noiseReduction.highpass.frequency.value = value;
                }
                break;
            case 'resonance':
                track.noiseReduction.highpassResonance = value;
                track.noiseReduction.highpass.Q.value = value;
                break;
        }
        
        console.log('🔊 Current filter state:', {
            highpass: {
                frequency: track.noiseReduction.highpass.frequency.value,
                Q: track.noiseReduction.highpass.Q.value
            },
            lowpass: {
                frequency: track.noiseReduction.lowpass.frequency.value,
                Q: track.noiseReduction.lowpass.Q.value
            }
        });
    }
    
    // エキスパンダー有効化/無効化
    setTrackExpanderEnabled(trackId, enabled) {
        const track = this.getTrack(trackId);
        if (!track) return;
        
        track.expanderEnabled = enabled;
        
        console.log('🎚️ Expander:', {
            trackId: trackId,
            enabled: enabled,
            threshold: track.expander.threshold.value,
            ratio: track.expander.ratio.value
        });
        
        // エキスパンダーの有効/無効を切り替え
        // DynamicsCompressorは常に接続されているので、パラメータで制御
        if (!enabled) {
            // 無効時はバイパス状態（ratio=1で圧縮なし）
            track.expander.ratio.value = 1;
        } else {
            // 有効時は設定されたratioを適用（デフォルト0.5）
            track.expander.ratio.value = 0.5;
        }
    }
    
    // エキスパンダーのパラメータ設定
    setTrackExpander(trackId, param, value) {
        const track = this.getTrack(trackId);
        if (!track || !track.expander) return;
        
        console.log('🔧 Expander Parameter Change:', {
            trackId: trackId,
            param: param,
            value: value
        });
        
        switch(param) {
            case 'threshold':
                track.expander.threshold.value = value;
                break;
            case 'ratio':
                // ratioは0.1～1.0の範囲（1以下で拡張効果）
                track.expander.ratio.value = value;
                break;
            case 'attack':
                track.expander.attack.value = value / 1000; // msからsへ変換
                break;
            case 'release':
                track.expander.release.value = value / 1000; // msからsへ変換
                break;
            case 'knee':
                track.expander.knee.value = value;
                break;
        }
        
        console.log('🔊 Current expander state:', {
            threshold: track.expander.threshold.value,
            ratio: track.expander.ratio.value,
            attack: track.expander.attack.value,
            release: track.expander.release.value,
            knee: track.expander.knee.value
        });
    }
    
    // 再生
    async play(startTime = 0) {
        // AudioContextを再開（ブラウザのオートプレイポリシー対策）
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
            console.log('AudioContext resumed, state:', this.audioContext.state);
        }
        
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.currentTime = startTime;
        const contextStartTime = this.audioContext.currentTime;
        
        // 全トラックの全クリップを再生
        this.tracks.forEach(track => {
            track.clips.forEach(clip => {
                this.playClip(track, clip, startTime, contextStartTime);
            });
        });
        
        console.log('Playback started');
    }
    
    // クリップを再生
    playClip(track, clip, playbackStartTime, contextStartTime) {
        const clipStartTime = clip.startTime;
        const clipEndTime = clipStartTime + clip.duration;
        
        console.log(`🎬 playClip called: clipId=${clip.id}, startTime=${clipStartTime}`);
        
        // 再生範囲外のクリップはスキップ
        if (playbackStartTime > clipEndTime) return;
        
        // AudioBufferSourceNodeを作成
        const source = this.audioContext.createBufferSource();
        source.buffer = clip.audioBuffer;
        source.playbackRate.value = this.playbackRate;
        
        // フェードイン/アウト処理とクリップゲイン用のGainNode
        const clipGainNode = this.audioContext.createGain();
        
        // キーフレーム用のGainNode（ボリューム）
        const volumeGainNode = this.audioContext.createGain();
        
        // キーフレーム用のStereoPanner（パン）
        const panNode = this.audioContext.createStereoPanner();
        
        // 🐻 クリップ専用のイコライザーノードを作成
        const clipEQ = {
            low: this.audioContext.createBiquadFilter(),
            mid: this.audioContext.createBiquadFilter(),
            high: this.audioContext.createBiquadFilter()
        };
        
        // EQの設定（デフォルトはフラット）
        clipEQ.low.type = 'lowshelf';
        clipEQ.low.frequency.value = 100;
        clipEQ.low.gain.value = 0;  // フラット
        
        clipEQ.mid.type = 'peaking';
        clipEQ.mid.frequency.value = 1000;
        clipEQ.mid.Q.value = 1;
        clipEQ.mid.gain.value = 0;  // フラット
        
        clipEQ.high.type = 'highshelf';
        clipEQ.high.frequency.value = 10000;
        clipEQ.high.gain.value = 0;  // フラット
        
        // 🐻 接続: Source -> ClipGain -> VolumeGain -> Pan -> ClipEQ -> Track
        source.connect(clipGainNode);
        clipGainNode.connect(volumeGainNode);
        volumeGainNode.connect(panNode);
        
        // EQ経由で接続
        panNode.connect(clipEQ.low);
        clipEQ.low.connect(clipEQ.mid);
        clipEQ.mid.connect(clipEQ.high);
        clipEQ.high.connect(track.gain);
        
        // リアルタイム更新用にノードへの参照を保存
        clip.activeNodes = {
            clipGainNode,
            volumeGainNode,
            panNode,
            clipEQ,
            source
        };
        
        // クリップの実際のAudioContext開始時刻を計算
        let clipContextStartTime;
        if (playbackStartTime === 0 && clipStartTime === 0) {
            clipContextStartTime = this.audioContext.currentTime;
        } else {
            clipContextStartTime = contextStartTime + Math.max(0, clipStartTime - playbackStartTime);
        }
        
        // クリップゲインを適用（キーフレームまたは固定値）
        const baseClipGain = clip.gain ? Math.pow(10, clip.gain / 20) : 1.0;
        this.applyKeyframeAutomation(clip, 'gain', clipGainNode.gain, clipContextStartTime, clipStartTime, baseClipGain, playbackStartTime, clipEndTime);
        
        // ボリュームキーフレームを適用
        this.applyKeyframeAutomation(clip, 'volume', volumeGainNode.gain, clipContextStartTime, clipStartTime, 1.0, playbackStartTime, clipEndTime);
        
        // パンキーフレームを適用
        this.applyKeyframeAutomation(clip, 'pan', panNode.pan, clipContextStartTime, clipStartTime, 0, playbackStartTime, clipEndTime);
        
        // 🐻 イコライザーキーフレームを適用
        this.applyKeyframeAutomation(clip, 'eqLow', clipEQ.low.gain, clipContextStartTime, clipStartTime, clipEQ.low.gain.value, playbackStartTime, clipEndTime);
        this.applyKeyframeAutomation(clip, 'eqMid', clipEQ.mid.gain, clipContextStartTime, clipStartTime, clipEQ.mid.gain.value, playbackStartTime, clipEndTime);
        this.applyKeyframeAutomation(clip, 'eqHigh', clipEQ.high.gain, clipContextStartTime, clipStartTime, clipEQ.high.gain.value, playbackStartTime, clipEndTime);
        
        // 🐻 注意: フェードイン/アウト処理はキーフレームと競合するため削除
        // フェード効果が必要な場合は、gainキーフレームで設定してください
        
        // 再生開始位置とオフセットを計算
        const offset = clip.offset + Math.max(0, playbackStartTime - clipStartTime);
        const duration = clipEndTime - Math.max(playbackStartTime, clipStartTime);
        
        // 0秒から再生する場合は即座に開始（AudioContext.currentTimeを使用）
        let when;
        if (playbackStartTime === 0 && clipStartTime === 0) {
            when = this.audioContext.currentTime; // 即座に開始
        } else {
            when = contextStartTime + Math.max(0, clipStartTime - playbackStartTime);
        }
        
        source.start(when, offset, duration);
        
        // 停止時の処理
        source.onended = () => {
            source.disconnect();
            clipGainNode.disconnect();
            volumeGainNode.disconnect();
            panNode.disconnect();
            // 🐻 EQノードも切断
            clipEQ.low.disconnect();
            clipEQ.mid.disconnect();
            clipEQ.high.disconnect();
        };
        
        clip.source = source;
    }
    
    // キーフレームオートメーションを適用
    applyKeyframeAutomation(clip, parameter, audioParam, contextStartTime, clipStartTime, defaultValue, playbackStartTime = 0, clipEndTime = null) {
        if (!window.keyframeManager) return;
        
        const keyframes = window.keyframeManager.getParameterKeyframes(clip.id, parameter);
        
        console.log(`🐻 [${parameter}] キーフレーム取得: clipId=${clip.id}, count=${keyframes.length}`);
        
        if (keyframes.length === 0) {
            // キーフレームがない場合はデフォルト値を設定
            audioParam.setValueAtTime(defaultValue, contextStartTime);
            console.log(`  デフォルト値を使用: ${defaultValue}`);
            return;
        }
        
        console.log(`🐻 [${parameter}] キーフレーム適用: ${keyframes.length}個`, keyframes.map(kf => `${kf.time.toFixed(2)}s: ${kf.value.toFixed(2)}`));
        
        // CRITICAL: Web Audio APIでは過去の時間に値を設定できない
        // すべての時間が audioContext.currentTime より後である必要がある
        const now = this.audioContext.currentTime;
        const minTime = now + 0.001; // 1ms後以降
        
        // 🐻 CRITICAL: AudioParamのタイムラインをクリア
        // 前回の設定が残っているとキーフレームが正しく動作しない
        audioParam.cancelScheduledValues(now);
        
        // 🐻 CRITICAL: 現在値を強制的にデフォルト値にリセット
        // これをしないと、前回の再生で0になった値がそのまま残る
        audioParam.setValueAtTime(defaultValue, now);
        console.log(`  🔄 AudioParam リセット: ${parameter}=${defaultValue} @ now=${now.toFixed(3)}`);
        
        // 🐻 再生開始位置（クリップ内の相対時間）を計算
        const playbackOffsetInClip = Math.max(0, playbackStartTime - clipStartTime);
        
        // 🐻 最初のキーフレームが再生開始位置付近にある場合は、クリップ開始時の設定をスキップ
        // そうでない場合は、再生開始位置での値を設定
        const firstKfTime = keyframes[0].time;
        const skipInitialSet = Math.abs(playbackOffsetInClip - firstKfTime) < 0.01;
        
        if (!skipInitialSet) {
            // 🐻 再生開始位置でのキーフレーム値を計算
            let initialValue;
            const result = window.keyframeManager.getValueAtTimeInRange(clip.id, parameter, playbackOffsetInClip, defaultValue);
            initialValue = result.inRange ? result.value : defaultValue;
            
            // 🐻 クリップ開始時に再生位置での値を設定
            const startTime = Math.max(minTime, contextStartTime);
            audioParam.setValueAtTime(initialValue, startTime);
            console.log(`  クリップ開始(${playbackOffsetInClip.toFixed(2)}s地点): ${initialValue.toFixed(2)} @ ${(startTime - now).toFixed(3)}s後`);
        } else {
            console.log(`  クリップ開始スキップ: 最初のKFが${firstKfTime.toFixed(2)}s地点にあるため`);
        }
        
        // 🐻 すべてのキーフレームを順番に設定
        for (let i = 0; i < keyframes.length; i++) {
            const kf = keyframes[i];
            let time = contextStartTime + kf.time;
            
            // CRITICAL: 時間が過去の場合は現在時刻に調整
            if (time < minTime) {
                time = minTime;
            }
            
            if (i === 0) {
                // 🐻 最初のキーフレーム: 必ずsetValueAtTimeで設定
                audioParam.setValueAtTime(kf.value, time);
                console.log(`  KF${i}: ${kf.value.toFixed(2)} @ ${(time - now).toFixed(3)}s後 [SET]`);
            } else {
                const prevKf = keyframes[i - 1];
                
                // 🐻 補間タイプに応じて適用
                switch (prevKf.interpolation) {
                    case 'linear':
                        // 🐻 線形補間: linearRampを使う
                        // 注意: 前のキーフレームは既に設定済みなので、ここでは設定しない!
                        audioParam.linearRampToValueAtTime(kf.value, time);
                        console.log(`  KF${i}: ${kf.value.toFixed(2)} @ ${(time - now).toFixed(3)}s後 [LINEAR]`);
                        break;
                        
                    case 'step':
                        // 🐻 ステップ: 瞬時に変化
                        audioParam.setValueAtTime(kf.value, time);
                        console.log(`  KF${i}: ${kf.value.toFixed(2)} @ ${(time - now).toFixed(3)}s後 [STEP]`);
                        break;
                        
                    case 'ease-in':
                    case 'ease-out':
                    case 'ease-in-out':
                        // 🐻 イージング: 複数のlinearRampで近似
                        this.approximateEasing(audioParam, prevKf, kf, contextStartTime, now);
                        console.log(`  KF${i}: ${kf.value.toFixed(2)} @ ${(time - now).toFixed(3)}s後 [${prevKf.interpolation.toUpperCase()}]`);
                        break;
                        
                    default:
                        // デフォルトは線形補間
                        audioParam.linearRampToValueAtTime(kf.value, time);
                        console.log(`  KF${i}: ${kf.value.toFixed(2)} @ ${(time - now).toFixed(3)}s後 [LINEAR(default)]`);
                }
            }
        }
        
        // 🐻 CRITICAL: 最後のキーフレーム以降はデフォルト値に戻す
        // これにより、キーフレーム範囲外では通常の状態に戻る
        if (clipEndTime) {
            const lastKf = keyframes[keyframes.length - 1];
            const lastKfContextTime = contextStartTime + lastKf.time;
            const clipContextEndTime = contextStartTime + (clipEndTime - clipStartTime);
            
            // 最後のキーフレームがクリップ終了より前にある場合
            if (lastKfContextTime < clipContextEndTime - 0.001) {
                const resetTime = Math.max(minTime, lastKfContextTime + 0.001);
                audioParam.setValueAtTime(defaultValue, resetTime);
                console.log(`  最後のKF(${lastKf.time.toFixed(2)}s)後にデフォルトに戻す: ${defaultValue.toFixed(2)} @ ${(resetTime - now).toFixed(3)}s後`);
            } else {
                console.log(`  最後のKF(${lastKf.time.toFixed(2)}s)がクリップ終了付近のため、デフォルト復帰なし`);
            }
        } else {
            console.log(`  clipEndTime未指定のため、最後のKF以降は値を維持: ${keyframes[keyframes.length - 1].value.toFixed(2)}`);
        }
    }
    
    // イージングを複数のlinearRampで近似
    approximateEasing(audioParam, startKf, endKf, contextStartTime, now) {
        const steps = 10;
        const startTime = contextStartTime + startKf.time;
        const endTime = contextStartTime + endKf.time;
        const duration = endTime - startTime;
        const minTime = now + 0.001;
        
        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            let easedT;
            
            switch (startKf.interpolation) {
                case 'ease-in':
                    easedT = t * t;
                    break;
                case 'ease-out':
                    easedT = 1 - Math.pow(1 - t, 2);
                    break;
                case 'ease-in-out':
                    easedT = t < 0.5 
                        ? 2 * t * t 
                        : 1 - Math.pow(-2 * t + 2, 2) / 2;
                    break;
                default:
                    easedT = t;
            }
            
            const value = startKf.value + (endKf.value - startKf.value) * easedT;
            let time = startTime + (duration * t);
            
            // 過去の時間にならないように調整
            if (time < minTime) {
                time = minTime;
            }
            
            audioParam.linearRampToValueAtTime(value, time);
        }
    }
    
    // 一時停止
    pause() {
        if (!this.isPlaying) return;
        
        this.isPlaying = false;
        
        // 全クリップのソースを停止
        this.tracks.forEach(track => {
            track.clips.forEach(clip => {
                if (clip.source) {
                    clip.source.stop();
                    clip.source.disconnect();
                    clip.source = null;
                }
            });
        });
    }
    
    // 停止
    stop() {
        this.pause();
        this.currentTime = 0;
    }
    
    // 全体の長さを計算
    calculateDuration() {
        let maxDuration = 0;
        this.tracks.forEach(track => {
            track.clips.forEach(clip => {
                const clipEnd = clip.startTime + clip.duration;
                if (clipEnd > maxDuration) {
                    maxDuration = clipEnd;
                }
            });
        });
        this.duration = maxDuration;
        return maxDuration;
    }
    
    // マスターボリューム調整
    setMasterVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.value = volume;
        }
    }
    
    // クリーンアップ
    dispose() {
        this.stop();
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}

// グローバルインスタンス
window.audioEngine = new AudioEngine();
