// ==========================================
// TrackManager - トラック管理クラス
// ==========================================

class TrackManager {
    constructor() {
        this.tracks = [];
        this.selectedClip = null;
        this.maxTracks = 30;
        this.trackIdCounter = 1;
        this.clipIdCounter = 1;
        this.pixelsPerSecond = 100; // ズームレベル
        this.isDragging = false;
        this.dragTarget = null;
        this.dragStartX = 0;
        this.dragStartTime = 0;
    }
    
    // トラック追加
    addTrack(name = null) {
        if (this.tracks.length >= this.maxTracks) {
            alert(`トラック数の上限（${this.maxTracks}）に達しています`);
            return null;
        }
        
        const trackId = this.trackIdCounter++;
        const trackName = name || `トラック ${trackId}`;
        
        // AudioEngineにトラック追加
        const audioTrack = window.audioEngine.createTrack(trackId);
        audioTrack.name = trackName;
        
        const track = {
            id: trackId,
            name: trackName,
            clips: [],
            mute: false,
            solo: false,
            volume: 0.8,
            pan: 0,
            color: this.generateTrackColor()
        };
        
        this.tracks.push(track);
        this.renderTrack(track);
        this.updateTrackCount();
        
        return track;
    }
    
    // トラック削除
    removeTrack(trackId) {
        const index = this.tracks.findIndex(t => t.id === trackId);
        if (index === -1) return;
        
        // AudioEngineからトラック削除
        window.audioEngine.removeTrack(trackId);
        
        // DOM要素削除
        const trackElement = document.querySelector(`[data-track-id="${trackId}"]`);
        if (trackElement) {
            trackElement.remove();
        }
        
        this.tracks.splice(index, 1);
        this.updateTrackCount();
    }
    
    // トラック取得
    getTrack(trackId) {
        return this.tracks.find(t => t.id === trackId);
    }
    
    // トラックをレンダリング
    renderTrack(track) {
        const tracksContainer = document.getElementById('tracksContainer');
        
        const trackElement = document.createElement('div');
        trackElement.className = 'track';
        trackElement.dataset.trackId = track.id;
        
        trackElement.innerHTML = `
            <div class="track-header">
                <input type="text" class="track-name" value="${track.name}" 
                       data-track-id="${track.id}">
                <div class="track-controls">
                    <button class="track-btn" data-action="mute" data-track-id="${track.id}" 
                            title="ミュート">M</button>
                    <button class="track-btn" data-action="solo" data-track-id="${track.id}" 
                            title="ソロ">S</button>
                    <button class="track-btn" data-action="delete" data-track-id="${track.id}" 
                            title="削除">🗑️</button>
                </div>
                <div class="track-volume">
                    <input type="range" class="volume-slider" min="0" max="1" step="0.01" 
                           value="${track.volume}" data-track-id="${track.id}">
                </div>
            </div>
            <div class="track-content" data-track-id="${track.id}"></div>
        `;
        
        tracksContainer.appendChild(trackElement);
        
        // イベントリスナー設定
        this.setupTrackEvents(trackElement, track);
    }
    
    // トラックイベント設定
    setupTrackEvents(trackElement, track) {
        // トラック名変更
        const nameInput = trackElement.querySelector('.track-name');
        nameInput.addEventListener('change', (e) => {
            track.name = e.target.value;
        });
        
        // ミュートボタン
        const muteBtn = trackElement.querySelector('[data-action="mute"]');
        muteBtn.addEventListener('click', () => {
            track.mute = !track.mute;
            muteBtn.classList.toggle('active', track.mute);
            window.audioEngine.setTrackMute(track.id, track.mute);
        });
        
        // ソロボタン
        const soloBtn = trackElement.querySelector('[data-action="solo"]');
        soloBtn.addEventListener('click', () => {
            track.solo = !track.solo;
            soloBtn.classList.toggle('active', track.solo);
            window.audioEngine.setTrackSolo(track.id, track.solo);
        });
        
        // 削除ボタン
        const deleteBtn = trackElement.querySelector('[data-action="delete"]');
        deleteBtn.addEventListener('click', () => {
            if (confirm(`"${track.name}" を削除しますか？`)) {
                this.removeTrack(track.id);
            }
        });
        
        // ボリュームスライダー
        const volumeSlider = trackElement.querySelector('.volume-slider');
        volumeSlider.addEventListener('input', (e) => {
            track.volume = parseFloat(e.target.value);
            window.audioEngine.setTrackVolume(track.id, track.volume);
        });
        
        // トラックコンテンツへのドロップ
        const trackContent = trackElement.querySelector('.track-content');
        trackContent.addEventListener('drop', (e) => this.handleDrop(e, track));
        trackContent.addEventListener('dragover', (e) => e.preventDefault());
    }
    
    // クリップ追加
    async addClip(trackId, audioFile, startTime = 0) {
        const track = this.getTrack(trackId);
        if (!track) return null;
        
        const clipId = this.clipIdCounter++;
        
        // AudioEngineにクリップ追加
        const audioClip = window.audioEngine.addClip(trackId, {
            id: clipId,
            name: audioFile.name,
            audioBuffer: audioFile.audioBuffer,
            startTime: startTime,
            offset: 0,
            duration: audioFile.duration,
            fadeIn: 0,
            fadeOut: 0
        });
        
        const clip = {
            id: clipId,
            fileId: audioFile.id,
            name: audioFile.name,
            startTime: startTime,
            duration: audioFile.duration,
            offset: 0,
            fadeIn: 0,
            fadeOut: 0
        };
        
        track.clips.push(clip);
        this.renderClip(trackId, clip);
        
        return clip;
    }
    
    // クリップをレンダリング
    renderClip(trackId, clip) {
        const trackContent = document.querySelector(`.track-content[data-track-id="${trackId}"]`);
        if (!trackContent) return;
        
        const clipElement = document.createElement('div');
        clipElement.className = 'track-clip';
        clipElement.dataset.clipId = clip.id;
        clipElement.dataset.trackId = trackId;
        
        const leftPos = clip.startTime * this.pixelsPerSecond;
        const width = clip.duration * this.pixelsPerSecond;
        
        clipElement.style.left = `${leftPos}px`;
        clipElement.style.width = `${width}px`;
        
        clipElement.innerHTML = `
            <div class="clip-name">${clip.name}</div>
            <div class="clip-resize-handle left"></div>
            <div class="clip-resize-handle right"></div>
        `;
        
        trackContent.appendChild(clipElement);
        
        // イベントリスナー設定
        this.setupClipEvents(clipElement, trackId, clip);
    }
    
    // クリップイベント設定
    setupClipEvents(clipElement, trackId, clip) {
        // クリップ選択
        clipElement.addEventListener('click', (e) => {
            if (e.target.classList.contains('clip-resize-handle')) return;
            this.selectClip(trackId, clip.id);
        });
        
        // ドラッグ移動
        clipElement.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('clip-resize-handle')) return;
            this.startDrag(e, 'move', trackId, clip);
        });
        
        // リサイズハンドル
        const leftHandle = clipElement.querySelector('.clip-resize-handle.left');
        const rightHandle = clipElement.querySelector('.clip-resize-handle.right');
        
        leftHandle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.startDrag(e, 'resize-left', trackId, clip);
        });
        
        rightHandle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.startDrag(e, 'resize-right', trackId, clip);
        });
    }
    
    // クリップ選択
    selectClip(trackId, clipId) {
        // 既存の選択を解除
        document.querySelectorAll('.track-clip.selected').forEach(el => {
            el.classList.remove('selected');
        });
        
        // 新しいクリップを選択
        const clipElement = document.querySelector(`[data-clip-id="${clipId}"][data-track-id="${trackId}"]`);
        if (clipElement) {
            clipElement.classList.add('selected');
            this.selectedClip = { trackId, clipId };
        }
    }
    
    // ドラッグ開始
    startDrag(e, type, trackId, clip) {
        this.isDragging = true;
        this.dragTarget = { type, trackId, clipId: clip.id };
        this.dragStartX = e.clientX;
        this.dragStartTime = clip.startTime;
        
        document.addEventListener('mousemove', this.handleDrag.bind(this));
        document.addEventListener('mouseup', this.endDrag.bind(this));
        
        e.preventDefault();
    }
    
    // ドラッグ中
    handleDrag(e) {
        if (!this.isDragging || !this.dragTarget) return;
        
        const deltaX = e.clientX - this.dragStartX;
        const deltaTime = deltaX / this.pixelsPerSecond;
        
        const track = this.getTrack(this.dragTarget.trackId);
        const clip = track.clips.find(c => c.id === this.dragTarget.clipId);
        
        if (this.dragTarget.type === 'move') {
            const newStartTime = Math.max(0, this.dragStartTime + deltaTime);
            clip.startTime = newStartTime;
            this.updateClipPosition(this.dragTarget.trackId, clip.id);
        }
        // リサイズは簡易実装（詳細は後で追加可能）
    }
    
    // ドラッグ終了
    endDrag() {
        this.isDragging = false;
        this.dragTarget = null;
        
        document.removeEventListener('mousemove', this.handleDrag.bind(this));
        document.removeEventListener('mouseup', this.endDrag.bind(this));
    }
    
    // クリップ位置更新
    updateClipPosition(trackId, clipId) {
        const track = this.getTrack(trackId);
        const clip = track.clips.find(c => c.id === clipId);
        const clipElement = document.querySelector(`[data-clip-id="${clipId}"][data-track-id="${trackId}"]`);
        
        if (clipElement && clip) {
            const leftPos = clip.startTime * this.pixelsPerSecond;
            clipElement.style.left = `${leftPos}px`;
        }
    }
    
    // ドロップ処理
    async handleDrop(e, track) {
        e.preventDefault();
        
        const fileId = e.dataTransfer.getData('fileId');
        if (!fileId) return;
        
        // ドロップ位置から時間を計算
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const startTime = Math.max(0, x / this.pixelsPerSecond);
        
        // オーディオファイル取得
        const audioFile = await window.fileManager.getAudioFile(fileId);
        if (audioFile) {
            await this.addClip(track.id, audioFile, startTime);
        }
    }
    
    // ズーム調整
    setZoom(pixelsPerSecond) {
        this.pixelsPerSecond = pixelsPerSecond;
        this.rerenderAllClips();
        this.updateRuler();
    }
    
    // 全クリップ再描画
    rerenderAllClips() {
        this.tracks.forEach(track => {
            track.clips.forEach(clip => {
                const clipElement = document.querySelector(
                    `[data-clip-id="${clip.id}"][data-track-id="${track.id}"]`
                );
                if (clipElement) {
                    const leftPos = clip.startTime * this.pixelsPerSecond;
                    const width = clip.duration * this.pixelsPerSecond;
                    clipElement.style.left = `${leftPos}px`;
                    clipElement.style.width = `${width}px`;
                }
            });
        });
    }
    
    // ルーラー更新
    updateRuler() {
        const ruler = document.getElementById('timelineRuler');
        if (!ruler) return;
        
        ruler.innerHTML = '';
        const duration = window.audioEngine.calculateDuration();
        const width = duration * this.pixelsPerSecond;
        
        // メジャーマーカー（1秒ごと）
        for (let i = 0; i <= duration; i++) {
            const marker = document.createElement('div');
            marker.className = 'ruler-marker major';
            marker.style.left = `${i * this.pixelsPerSecond}px`;
            
            const label = document.createElement('div');
            label.className = 'ruler-label';
            label.textContent = this.formatTime(i);
            label.style.left = `${i * this.pixelsPerSecond}px`;
            
            ruler.appendChild(marker);
            ruler.appendChild(label);
        }
    }
    
    // トラックカラー生成
    generateTrackColor() {
        const colors = [
            '#D4A574', '#A0855B', '#B88A5F', '#C9A882',
            '#E8C9A1', '#D6B892', '#BFA078', '#C8B299'
        ];
        return colors[this.tracks.length % colors.length];
    }
    
    // トラック数更新
    updateTrackCount() {
        const countElement = document.getElementById('trackCount');
        if (countElement) {
            countElement.textContent = this.tracks.length;
        }
    }
    
    // 時間フォーマット
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
    }
    
    // 全トラッククリア
    clearAllTracks() {
        this.tracks.forEach(track => {
            window.audioEngine.removeTrack(track.id);
        });
        this.tracks = [];
        document.getElementById('tracksContainer').innerHTML = '';
        this.updateTrackCount();
    }
}

// グローバルインスタンス
window.trackManager = new TrackManager();
