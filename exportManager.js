// ==========================================
// ExportManager - エクスポート管理クラス
// ==========================================

class ExportManager {
    constructor() {
        this.isExporting = false;
    }
    
    // 初期化
    init() {
        try {
            console.log('ExportManager: Setting up event listeners...');
            this.setupEventListeners();
            console.log('ExportManager: Initialized successfully');
        } catch (error) {
            console.error('ExportManager initialization error:', error);
            throw error;
        }
    }
    
    // イベントリスナー設定
    setupEventListeners() {
        const exportBtn = document.getElementById('exportBtn');
        const closeModalBtn = document.getElementById('closeExportModal');
        const startExportBtn = document.getElementById('startExportBtn');
        
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.openExportModal();
            });
        }
        
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                this.closeExportModal();
            });
        }
        
        if (startExportBtn) {
            startExportBtn.addEventListener('click', () => {
                this.startExport();
            });
        }
    }
    
    // エクスポートモーダルを開く
    openExportModal() {
        const modal = document.getElementById('exportModal');
        if (modal) {
            modal.classList.add('active');
        }
    }
    
    // エクスポートモーダルを閉じる
    closeExportModal() {
        const modal = document.getElementById('exportModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }
    
    // エクスポート開始
    async startExport() {
        if (this.isExporting) return;
        
        const format = document.getElementById('exportFormat').value;
        const sampleRate = parseInt(document.getElementById('exportSampleRate').value);
        const bitDepth = parseInt(document.getElementById('exportBitDepth').value);
        
        this.isExporting = true;
        const startBtn = document.getElementById('startExportBtn');
        if (startBtn) {
            startBtn.textContent = '書き出し中...';
            startBtn.disabled = true;
        }
        
        try {
            if (format === 'wav') {
                await this.exportWAV(sampleRate, bitDepth);
            } else if (format === 'mp3') {
                await this.exportMP3(sampleRate);
            }
            
            alert('書き出しが完了しました！');
            this.closeExportModal();
        } catch (error) {
            console.error('Export error:', error);
            alert(`書き出しに失敗しました: ${error.message}`);
        } finally {
            this.isExporting = false;
            if (startBtn) {
                startBtn.textContent = '書き出し開始';
                startBtn.disabled = false;
            }
        }
    }
    
    // WAVエクスポート
    async exportWAV(sampleRate, bitDepth) {
        const duration = window.audioEngine.calculateDuration();
        
        if (duration === 0) {
            throw new Error('エクスポートする音声がありません');
        }
        
        // オフラインレンダリング用のAudioContext作成
        const offlineContext = new OfflineAudioContext(2, sampleRate * duration, sampleRate);
        
        // マスターチェーンを再構築
        const offlineGain = offlineContext.createGain();
        const offlineLimiter = offlineContext.createDynamicsCompressor();
        
        // エフェクト設定を適用
        const effectSettings = window.effectsManager.getEffectSettings();
        
        offlineLimiter.threshold.value = effectSettings.limiter.threshold;
        offlineLimiter.knee.value = 0;
        offlineLimiter.ratio.value = 20;
        offlineLimiter.attack.value = 0.003;
        offlineLimiter.release.value = effectSettings.limiter.release / 1000;
        
        offlineLimiter.connect(offlineGain);
        offlineGain.connect(offlineContext.destination);
        
        // 各トラックの各クリップをレンダリング
        window.trackManager.tracks.forEach(track => {
            if (track.mute) return;
            
            // トラックの基本ゲイン
            const trackGain = offlineContext.createGain();
            trackGain.gain.value = track.volume;
            
            // トラックのオーディオトラック情報を取得
            const audioTrack = window.audioEngine.getTrack(track.id);
            
            // トラックエフェクトチェーンを構築
            let trackOutput = trackGain;
            
            // エキスパンダーを適用
            if (audioTrack && audioTrack.expanderEnabled && audioTrack.expander) {
                const expander = offlineContext.createDynamicsCompressor();
                expander.threshold.value = audioTrack.expander.threshold.value;
                expander.knee.value = audioTrack.expander.knee.value;
                expander.ratio.value = audioTrack.expander.ratio.value;
                expander.attack.value = audioTrack.expander.attack.value;
                expander.release.value = audioTrack.expander.release.value;
                
                trackOutput.connect(expander);
                trackOutput = expander;
            }
            
            // ノイズリダクションを適用
            if (audioTrack && audioTrack.noiseReductionEnabled && audioTrack.noiseReduction) {
                // ハイパスフィルタ
                if (audioTrack.noiseReduction.highpassEnabled) {
                    const highpass = offlineContext.createBiquadFilter();
                    highpass.type = 'highpass';
                    highpass.frequency.value = audioTrack.noiseReduction.highpassCutoff;
                    highpass.Q.value = audioTrack.noiseReduction.highpassResonance;
                    
                    trackOutput.connect(highpass);
                    trackOutput = highpass;
                }
                
                // ローパスフィルタ
                if (audioTrack.noiseReduction.lowpassEnabled) {
                    const lowpass = offlineContext.createBiquadFilter();
                    lowpass.type = 'lowpass';
                    lowpass.frequency.value = audioTrack.noiseReduction.lowpassCutoff;
                    lowpass.Q.value = audioTrack.noiseReduction.lowpassResonance;
                    
                    trackOutput.connect(lowpass);
                    trackOutput = lowpass;
                }
            }
            
            // EQを適用
            if (audioTrack && audioTrack.eqEnabled && audioTrack.eq) {
                const lowShelf = offlineContext.createBiquadFilter();
                lowShelf.type = 'lowshelf';
                lowShelf.frequency.value = 200;
                lowShelf.gain.value = audioTrack.eq.low.gain.value;
                
                const peaking = offlineContext.createBiquadFilter();
                peaking.type = 'peaking';
                peaking.frequency.value = 1000;
                peaking.Q.value = 1;
                peaking.gain.value = audioTrack.eq.mid.gain.value;
                
                const highShelf = offlineContext.createBiquadFilter();
                highShelf.type = 'highshelf';
                highShelf.frequency.value = 3000;
                highShelf.gain.value = audioTrack.eq.high.gain.value;
                
                // EQチェーンを接続
                trackOutput.connect(lowShelf);
                lowShelf.connect(peaking);
                peaking.connect(highShelf);
                trackOutput = highShelf;
            }
            
            // トラックリミッターを適用
            if (audioTrack && audioTrack.limiterEnabled && audioTrack.limiter) {
                const trackLimiter = offlineContext.createDynamicsCompressor();
                trackLimiter.threshold.value = audioTrack.limiter.threshold.value;
                trackLimiter.knee.value = 0;
                trackLimiter.ratio.value = audioTrack.limiter.ratio.value;
                trackLimiter.attack.value = 0.003;
                trackLimiter.release.value = audioTrack.limiter.release.value;
                
                trackOutput.connect(trackLimiter);
                trackOutput = trackLimiter;
            }
            
            // マスターリミッターに接続
            trackOutput.connect(offlineLimiter);
            
            track.clips.forEach(clip => {
                const source = offlineContext.createBufferSource();
                
                // オーディオファイル取得
                const audioFile = window.fileManager.getAllFiles().find(f => f.id === clip.fileId);
                if (!audioFile) return;
                
                // クリップゲインを適用
                const clipGain = offlineContext.createGain();
                const clipGainDb = clip.gain || 0;
                clipGain.gain.value = Math.pow(10, clipGainDb / 20);
                
                source.buffer = audioFile.audioBuffer;
                source.connect(clipGain);
                clipGain.connect(trackGain);
                source.start(clip.startTime, clip.offset, clip.duration);
            });
        });
        
        // レンダリング実行
        const renderedBuffer = await offlineContext.startRendering();
        
        // WAVファイル生成
        const wavBlob = this.bufferToWave(renderedBuffer, bitDepth);
        
        // ダウンロード
        const projectName = window.projectManager.getCurrentProject()?.name || '新規プロジェクト';
        this.downloadFile(wavBlob, `${projectName}_${this.getTimestamp()}.wav`);
    }
    
    // MP3エクスポート（簡易版 - 実際にはlame.jsなどが必要）
    async exportMP3(sampleRate) {
        // 注: 実際のMP3エンコードにはlame.jsなどのライブラリが必要
        // ここでは一旦WAV形式で出力し、ユーザーに別途変換を促す
        alert('MP3エクスポートは現在開発中です。WAV形式で出力します。');
        await this.exportWAV(sampleRate, 16);
    }
    
    // AudioBufferをWAVファイルに変換
    bufferToWave(audioBuffer, bitDepth) {
        const numberOfChannels = audioBuffer.numberOfChannels;
        const sampleRate = audioBuffer.sampleRate;
        const length = audioBuffer.length;
        const bytesPerSample = bitDepth / 8;
        
        // WAVヘッダーを含む全体のバイト数を計算
        const dataSize = length * numberOfChannels * bytesPerSample;
        const buffer = new ArrayBuffer(44 + dataSize);
        const view = new DataView(buffer);
        
        // WAVヘッダーを書き込み
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + dataSize, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true); // fmt chunk size
        view.setUint16(20, 1, true); // PCM format
        view.setUint16(22, numberOfChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numberOfChannels * bytesPerSample, true);
        view.setUint16(32, numberOfChannels * bytesPerSample, true);
        view.setUint16(34, bitDepth, true);
        writeString(36, 'data');
        view.setUint32(40, dataSize, true);
        
        // オーディオデータを書き込み
        const channels = [];
        for (let i = 0; i < numberOfChannels; i++) {
            channels.push(audioBuffer.getChannelData(i));
        }
        
        let offset = 44;
        const maxValue = Math.pow(2, bitDepth - 1) - 1;
        
        for (let i = 0; i < length; i++) {
            for (let channel = 0; channel < numberOfChannels; channel++) {
                let sample = Math.max(-1, Math.min(1, channels[channel][i]));
                sample = sample < 0 ? sample * (maxValue + 1) : sample * maxValue;
                
                if (bitDepth === 16) {
                    view.setInt16(offset, sample, true);
                    offset += 2;
                } else if (bitDepth === 24) {
                    const int24 = Math.floor(sample);
                    view.setUint8(offset, int24 & 0xFF);
                    view.setUint8(offset + 1, (int24 >> 8) & 0xFF);
                    view.setUint8(offset + 2, (int24 >> 16) & 0xFF);
                    offset += 3;
                } else if (bitDepth === 32) {
                    view.setFloat32(offset, sample, true);
                    offset += 4;
                }
            }
        }
        
        return new Blob([buffer], { type: 'audio/wav' });
    }
    
    // ファイルダウンロード
    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // タイムスタンプ生成
    getTimestamp() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `${year}${month}${day}_${hours}${minutes}${seconds}`;
    }
}

// グローバルインスタンス
window.exportManager = new ExportManager();
