// ==========================================
// KeyframeEditorUI - キーフレームエディタUI管理
// ==========================================

class KeyframeEditorUI {
    constructor() {
        this.currentClip = null;
        this.currentParameter = 'volume';
        this.canvas = null;
        this.ctx = null;
        this.selectedKeyframe = null;
        this.isDragging = false;
        this.snapThreshold = 5; // ピクセル単位のスナップ閾値
        
        this.parameterConfig = {
            volume: {
                min: 0,
                max: 2,
                default: 1,
                unit: '',
                label: 'ボリューム'
            },
            pan: {
                min: -1,
                max: 1,
                default: 0,
                unit: '',
                label: 'パン'
            },
            gain: {
                min: -24,
                max: 24,
                default: 0,
                unit: ' dB',
                label: 'ゲイン'
            }
        };
    }
    
    init() {
        this.canvas = document.getElementById('keyframeCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 高DPI対応
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        
        this.setupEvents();
    }
    
    setupEvents() {
        // タブ切り替え
        document.querySelectorAll('.keyframe-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.keyframe-tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentParameter = e.target.dataset.param;
                this.render();
            });
        });
        
        // キャンバスイベント
        this.canvas.addEventListener('mousedown', (e) => this.onCanvasMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onCanvasMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.onCanvasMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.onCanvasMouseUp());
        this.canvas.addEventListener('dblclick', (e) => this.onCanvasDoubleClick(e));
        
        // ボタンイベント
        document.getElementById('addKeyframeBtn').addEventListener('click', () => this.addKeyframeAtCurrentTime());
        document.getElementById('deleteKeyframeBtn').addEventListener('click', () => this.deleteSelectedKeyframe());
        document.getElementById('clearKeyframesBtn').addEventListener('click', () => this.clearAllKeyframes());
        document.getElementById('closeKeyframeEditorBtn').addEventListener('click', () => this.close());
        
        // 補間タイプ変更
        document.getElementById('keyframeInterpolation').addEventListener('change', (e) => {
            if (this.selectedKeyframe) {
                window.keyframeManager.updateKeyframe(
                    this.currentClip.id,
                    this.currentParameter,
                    this.selectedKeyframe.id,
                    { interpolation: e.target.value }
                );
                
                // 波形を更新（ゲインとボリュームの場合のみ）
                if (this.currentParameter === 'gain' || this.currentParameter === 'volume') {
                    this.updateClipWaveform();
                }
                
                this.render();
            }
        });
    }
    
    open(clip) {
        this.currentClip = clip;
        this.selectedKeyframe = null;
        document.getElementById('keyframeEditorPopup').style.display = 'flex';
        document.getElementById('keyframeEditorTitle').textContent = `🎬 ${clip.name} - キーフレーム`;
        this.render();
    }
    
    close() {
        document.getElementById('keyframeEditorPopup').style.display = 'none';
        this.currentClip = null;
        this.selectedKeyframe = null;
    }
    
    render() {
        if (!this.currentClip) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        // クリア
        this.ctx.clearRect(0, 0, width, height);
        
        // グリッド描画
        this.drawGrid(width, height);
        
        // キーフレーム取得
        const keyframes = window.keyframeManager.getParameterKeyframes(
            this.currentClip.id,
            this.currentParameter
        );
        
        // カーブ描画
        if (keyframes.length > 0) {
            this.drawCurve(keyframes, width, height);
        }
        
        // キーフレームポイント描画
        keyframes.forEach(kf => {
            this.drawKeyframePoint(kf, width, height);
        });
        
        // 情報表示更新
        this.updateInfo();
    }
    
    drawGrid(width, height) {
        const config = this.parameterConfig[this.currentParameter];
        
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;
        
        // 水平グリッド（値）
        const valueSteps = 5;
        for (let i = 0; i <= valueSteps; i++) {
            const y = (height / valueSteps) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
            
            // 値ラベル
            const value = config.max - (config.max - config.min) * (i / valueSteps);
            this.ctx.fillStyle = '#666';
            this.ctx.font = '12px sans-serif';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(value.toFixed(1) + config.unit, 5, y - 3);
        }
        
        // 垂直グリッド（時間）
        const timeSteps = 10;
        const duration = this.currentClip.duration;
        for (let i = 0; i <= timeSteps; i++) {
            const x = (width / timeSteps) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
            this.ctx.stroke();
            
            // 時間ラベル
            const time = (duration / timeSteps) * i;
            this.ctx.fillStyle = '#666';
            this.ctx.font = '12px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(time.toFixed(2) + 's', x, height - 5);
        }
        
        // デフォルト値のライン
        const defaultY = this.valueToY(config.default, height);
        this.ctx.strokeStyle = '#8B6F47';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(0, defaultY);
        this.ctx.lineTo(width, defaultY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    drawCurve(keyframes, width, height) {
        this.ctx.strokeStyle = '#D67373';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        
        const steps = 100;
        const duration = this.currentClip.duration;
        
        for (let i = 0; i <= steps; i++) {
            const time = (duration / steps) * i;
            const value = window.keyframeManager.getValueAtTime(
                this.currentClip.id,
                this.currentParameter,
                time,
                this.parameterConfig[this.currentParameter].default
            );
            
            const x = this.timeToX(time, width);
            const y = this.valueToY(value, height);
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.stroke();
    }
    
    drawKeyframePoint(kf, width, height) {
        const x = this.timeToX(kf.time, width);
        const y = this.valueToY(kf.value, height);
        
        const isSelected = this.selectedKeyframe && this.selectedKeyframe.id === kf.id;
        
        // 外側の円
        this.ctx.fillStyle = isSelected ? '#8B6F47' : '#D67373';
        this.ctx.beginPath();
        this.ctx.arc(x, y, isSelected ? 8 : 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 内側の円
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(x, y, isSelected ? 4 : 3, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    timeToX(time, width) {
        return (time / this.currentClip.duration) * width;
    }
    
    valueToY(value, height) {
        const config = this.parameterConfig[this.currentParameter];
        const normalized = (value - config.min) / (config.max - config.min);
        return height - (normalized * height);
    }
    
    xToTime(x, width) {
        return Math.max(0, Math.min(this.currentClip.duration, (x / width) * this.currentClip.duration));
    }
    
    yToValue(y, height) {
        const config = this.parameterConfig[this.currentParameter];
        const normalized = 1 - (y / height);
        return config.min + (normalized * (config.max - config.min));
    }
    
    getKeyframeAtPosition(x, y) {
        const rect = this.canvas.getBoundingClientRect();
        const keyframes = window.keyframeManager.getParameterKeyframes(
            this.currentClip.id,
            this.currentParameter
        );
        
        for (const kf of keyframes) {
            const kfX = this.timeToX(kf.time, rect.width);
            const kfY = this.valueToY(kf.value, rect.height);
            
            const distance = Math.sqrt(Math.pow(x - kfX, 2) + Math.pow(y - kfY, 2));
            if (distance < 10) {
                return kf;
            }
        }
        
        return null;
    }
    
    onCanvasMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const kf = this.getKeyframeAtPosition(x, y);
        
        if (kf) {
            this.selectedKeyframe = kf;
            this.isDragging = true;
            document.getElementById('deleteKeyframeBtn').disabled = false;
            document.getElementById('keyframeInterpolation').disabled = false;
            document.getElementById('keyframeInterpolation').value = kf.interpolation;
        } else {
            this.selectedKeyframe = null;
            document.getElementById('deleteKeyframeBtn').disabled = true;
            document.getElementById('keyframeInterpolation').disabled = true;
        }
        
        this.render();
    }
    
    onCanvasMouseMove(e) {
        if (!this.isDragging || !this.selectedKeyframe) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const newTime = this.xToTime(x, rect.width);
        const newValue = this.yToValue(y, rect.height);
        
        window.keyframeManager.updateKeyframe(
            this.currentClip.id,
            this.currentParameter,
            this.selectedKeyframe.id,
            { time: newTime, value: newValue }
        );
        
        // 更新されたキーフレームを再取得
        this.selectedKeyframe = window.keyframeManager.getParameterKeyframes(
            this.currentClip.id,
            this.currentParameter
        ).find(kf => kf.id === this.selectedKeyframe.id);
        
        // 波形を更新（ゲインとボリュームの場合のみ）
        if (this.currentParameter === 'gain' || this.currentParameter === 'volume') {
            this.updateClipWaveform();
        }
        
        this.render();
    }
    
    onCanvasMouseUp() {
        // ドラッグ終了時にも波形を更新
        if (this.isDragging && (this.currentParameter === 'gain' || this.currentParameter === 'volume')) {
            this.updateClipWaveform();
        }
        this.isDragging = false;
    }
    
    // クリップの波形を更新
    updateClipWaveform() {
        if (!this.currentClip) return;
        
        // trackManagerを通じて波形を再描画
        const trackId = window.trackManager.tracks.find(track => 
            track.clips.some(clip => clip.id === this.currentClip.id)
        )?.id;
        
        if (trackId) {
            window.trackManager.drawClipWaveform(trackId, this.currentClip.id);
        }
    }
    
    onCanvasDoubleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const time = this.xToTime(x, rect.width);
        const value = this.yToValue(y, rect.height);
        
        const kf = window.keyframeManager.addKeyframe(
            this.currentClip.id,
            this.currentParameter,
            time,
            value,
            'linear'
        );
        
        this.selectedKeyframe = kf;
        
        // 波形を更新（ゲインとボリュームの場合のみ）
        if (this.currentParameter === 'gain' || this.currentParameter === 'volume') {
            this.updateClipWaveform();
        }
        
        this.render();
    }
    
    addKeyframeAtCurrentTime() {
        if (!this.currentClip) return;
        
        const time = window.audioEngine.currentTime;
        const config = this.parameterConfig[this.currentParameter];
        
        const kf = window.keyframeManager.addKeyframe(
            this.currentClip.id,
            this.currentParameter,
            time,
            config.default,
            'linear'
        );
        
        this.selectedKeyframe = kf;
        
        // 波形を更新（ゲインとボリュームの場合のみ）
        if (this.currentParameter === 'gain' || this.currentParameter === 'volume') {
            this.updateClipWaveform();
        }
        
        this.render();
    }
    
    deleteSelectedKeyframe() {
        if (!this.selectedKeyframe) return;
        
        window.keyframeManager.removeKeyframe(
            this.currentClip.id,
            this.currentParameter,
            this.selectedKeyframe.id
        );
        
        this.selectedKeyframe = null;
        document.getElementById('deleteKeyframeBtn').disabled = true;
        document.getElementById('keyframeInterpolation').disabled = true;
        
        // 波形を更新（ゲインとボリュームの場合のみ）
        if (this.currentParameter === 'gain' || this.currentParameter === 'volume') {
            this.updateClipWaveform();
        }
        
        this.render();
    }
    
    clearAllKeyframes() {
        if (!this.currentClip) return;
        
        if (confirm(`${this.parameterConfig[this.currentParameter].label}のキーフレームを全て削除しますか?`)) {
            window.keyframeManager.clearParameterKeyframes(
                this.currentClip.id,
                this.currentParameter
            );
            this.selectedKeyframe = null;
            
            // 波形を更新（ゲインとボリュームの場合のみ）
            if (this.currentParameter === 'gain' || this.currentParameter === 'volume') {
                this.updateClipWaveform();
            }
            
            this.render();
        }
    }
    
    updateInfo() {
        const timeDisplay = document.getElementById('keyframeTimeDisplay');
        const valueDisplay = document.getElementById('keyframeValueDisplay');
        
        if (this.selectedKeyframe) {
            timeDisplay.textContent = this.selectedKeyframe.time.toFixed(3) + 's';
            const config = this.parameterConfig[this.currentParameter];
            valueDisplay.textContent = this.selectedKeyframe.value.toFixed(2) + config.unit;
        } else {
            timeDisplay.textContent = '--';
            valueDisplay.textContent = '--';
        }
    }
}

// グローバルインスタンスを作成
window.keyframeEditorUI = new KeyframeEditorUI();
