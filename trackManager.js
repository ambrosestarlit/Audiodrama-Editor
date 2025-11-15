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
            volume: 1.0,
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
                    <button class="track-btn" data-action="effects" data-track-id="${track.id}" 
                            title="エフェクト">FX</button>
                    <button class="track-btn" data-action="delete" data-track-id="${track.id}" 
                            title="削除">🗑️</button>
                </div>
                <div class="track-volume">
                    <label class="track-param-label">Vol</label>
                    <input type="range" class="volume-slider" min="0" max="1" step="0.01" 
                           value="${track.volume}" data-track-id="${track.id}">
                    <span class="volume-value">${Math.round(track.volume * 100)}</span>
                </div>
                <div class="track-pan">
                    <label class="track-param-label">Pan</label>
                    <input type="range" class="pan-slider" min="-1" max="1" step="0.01" 
                           value="${track.pan}" data-track-id="${track.id}">
                    <span class="pan-value">C</span>
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
        
        // エフェクトボタン
        const effectsBtn = trackElement.querySelector('[data-action="effects"]');
        effectsBtn.addEventListener('click', () => {
            window.effectsManager.openTrackEffects(track.id);
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
            
            // 数値表示を更新 (0-100スケール)
            const volumeValue = trackElement.querySelector('.volume-value');
            if (volumeValue) {
                volumeValue.textContent = Math.round(track.volume * 100);
            }
            
            // このトラックの全クリップの波形を更新
            track.clips.forEach(clip => {
                this.drawClipWaveform(track.id, clip.id);
            });
        });
        
        // Panスライダー
        const panSlider = trackElement.querySelector('.pan-slider');
        const panValue = trackElement.querySelector('.pan-value');
        
        // Panの表示を更新する関数
        const updatePanDisplay = (value) => {
            if (value === 0) {
                panValue.textContent = 'C';
            } else if (value < 0) {
                panValue.textContent = `L${Math.abs(Math.round(value * 100))}`;
            } else {
                panValue.textContent = `R${Math.round(value * 100)}`;
            }
        };
        
        updatePanDisplay(track.pan);
        
        panSlider.addEventListener('input', (e) => {
            track.pan = parseFloat(e.target.value);
            window.audioEngine.setTrackPan(track.id, track.pan);
            updatePanDisplay(track.pan);
        });
        
        // Panスライダーをダブルクリックでセンターに戻す
        panSlider.addEventListener('dblclick', () => {
            track.pan = 0;
            panSlider.value = 0;
            window.audioEngine.setTrackPan(track.id, 0);
            updatePanDisplay(0);
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
            fadeOut: 0,
            gain: 0  // dB単位のゲイン調整
        };
        
        track.clips.push(clip);
        this.renderClip(trackId, clip);
        
        return clip;
    }
    
    // クリップをレンダリング
    async renderClip(trackId, clip) {
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
            <div class="clip-waveform" data-clip-id="${clip.id}" data-track-id="${trackId}"></div>
            <div class="clip-name">${clip.name}</div>
            <div class="clip-resize-handle left"></div>
            <div class="clip-resize-handle right"></div>
        `;
        
        trackContent.appendChild(clipElement);
        
        // イベントリスナー設定
        this.setupClipEvents(clipElement, trackId, clip);
        
        // 波形を描画
        this.drawClipWaveform(trackId, clip.id);
    }
    
    // クリップイベント設定
    setupClipEvents(clipElement, trackId, clip) {
        // クリップ選択
        clipElement.addEventListener('click', (e) => {
            if (e.target.classList.contains('clip-resize-handle')) return;
            this.selectClip(trackId, clip.id);
        });
        
        // ダブルクリックでゲイン調整ポップアップを開く
        clipElement.addEventListener('dblclick', (e) => {
            if (e.target.classList.contains('clip-resize-handle')) return;
            this.openClipGainPopup(trackId, clip.id);
        });
        
        // 右クリックでコンテキストメニュー
        clipElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showClipContextMenu(e, trackId, clip);
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
    
    // クリップコンテキストメニューを表示
    showClipContextMenu(e, trackId, clip) {
        // 既存のメニューがあれば削除
        const existing = document.querySelector('.clip-context-menu');
        if (existing) existing.remove();
        
        const menu = document.createElement('div');
        menu.className = 'clip-context-menu';
        menu.style.left = `${e.pageX}px`;
        menu.style.top = `${e.pageY}px`;
        
        menu.innerHTML = `
            <div class="context-menu-item" data-action="keyframe">
                🎬 キーフレームエディタ
            </div>
            <div class="context-menu-item" data-action="gain">
                🎚️ ゲイン調整
            </div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item" data-action="delete">
                🗑️ 削除
            </div>
        `;
        
        document.body.appendChild(menu);
        
        // メニュー項目のクリックイベント
        menu.querySelectorAll('.context-menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                
                switch (action) {
                    case 'keyframe':
                        window.keyframeEditorUI.open(clip);
                        break;
                    case 'gain':
                        this.openClipGainPopup(trackId, clip.id);
                        break;
                    case 'delete':
                        this.removeClip(trackId, clip.id);
                        break;
                }
                
                menu.remove();
            });
        });
        
        // メニュー外をクリックで閉じる
        const closeMenu = (event) => {
            if (!menu.contains(event.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 10);
    }
    
    // クリップゲイン調整ポップアップを開く
    openClipGainPopup(trackId, clipId) {
        const track = this.getTrack(trackId);
        if (!track) return;
        
        const clip = track.clips.find(c => c.id === clipId);
        if (!clip) return;
        
        // ポップアップを表示
        const popup = document.getElementById('clipGainPopup');
        const title = document.getElementById('clipGainTitle');
        const slider = document.getElementById('clipGainSlider');
        const valueDisplay = document.getElementById('clipGainValue');
        
        if (popup && title && slider && valueDisplay) {
            title.textContent = `🎚️ ${clip.name}`;
            slider.value = clip.gain || 0;
            valueDisplay.textContent = `${(clip.gain || 0).toFixed(1)} dB`;
            popup.style.display = 'block';
            
            // 現在のポップアップ対象を保存
            this.currentGainClip = { trackId, clipId };
            
            // ピーク情報を更新
            this.updateClipGainInfo(trackId, clipId);
        }
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
            
            // audioEngineのクリップも更新
            const audioTrack = window.audioEngine.getTrack(this.dragTarget.trackId);
            if (audioTrack) {
                const audioClip = audioTrack.clips.find(c => c.id === this.dragTarget.clipId);
                if (audioClip) {
                    audioClip.startTime = newStartTime;
                }
            }
            
            this.updateClipPosition(this.dragTarget.trackId, clip.id);
        }
        // リサイズは簡易実装（詳細は後で追加可能）
    }
    
    // ドラッグ終了
    endDrag() {
        if (this.isDragging && this.dragTarget) {
            // 衝突検出と自動トリミング
            this.handleClipCollision(this.dragTarget.trackId, this.dragTarget.clipId);
        }
        
        this.isDragging = false;
        this.dragTarget = null;
        
        document.removeEventListener('mousemove', this.handleDrag.bind(this));
        document.removeEventListener('mouseup', this.endDrag.bind(this));
    }
    
    // クリップ衝突検出と自動トリミング
    handleClipCollision(trackId, clipId) {
        const track = this.getTrack(trackId);
        if (!track) return;
        
        const movedClip = track.clips.find(c => c.id === clipId);
        if (!movedClip) return;
        
        const movedStart = movedClip.startTime;
        const movedEnd = movedClip.startTime + movedClip.duration - movedClip.offset;
        
        // 同じトラックの他のクリップをチェック
        track.clips.forEach(otherClip => {
            if (otherClip.id === clipId) return; // 自分自身はスキップ
            
            const otherStart = otherClip.startTime;
            const otherEnd = otherClip.startTime + otherClip.duration - otherClip.offset;
            
            // パターン1: 移動したクリップが他のクリップの前に入り込んだ
            // [他のクリップ    ] に [移動クリップ] が左から衝突
            // → 他のクリップの頭をトリミング
            if (movedEnd > otherStart && movedEnd < otherEnd && movedStart < otherStart) {
                const overlap = movedEnd - otherStart;
                otherClip.offset += overlap;
                otherClip.startTime = movedEnd;
                
                console.log(`前方衝突: クリップ ${otherClip.id} の頭を ${overlap.toFixed(2)}秒 トリミング`);
                
                // audioEngineのクリップも更新
                const audioTrack = window.audioEngine.getTrack(trackId);
                if (audioTrack) {
                    const audioClip = audioTrack.clips.find(c => c.id === otherClip.id);
                    if (audioClip) {
                        audioClip.offset = otherClip.offset;
                        audioClip.startTime = otherClip.startTime;
                    }
                }
                
                // 位置と幅を更新
                this.updateClipPositionAndWidth(trackId, otherClip.id);
                // 波形を再描画
                this.drawClipWaveform(trackId, otherClip.id);
            }
            
            // パターン2: 移動したクリップが他のクリップの後ろに入り込んだ
            // [移動クリップ] が [他のクリップ    ] に右から衝突
            // → 他のクリップの後ろをトリミング
            else if (movedStart < otherEnd && movedStart > otherStart && movedEnd > otherEnd) {
                const overlap = otherEnd - movedStart;
                const visibleDuration = otherClip.duration - otherClip.offset;
                const newVisibleDuration = visibleDuration - overlap;
                
                // 最小デュレーションチェック（0.1秒未満にはしない）
                if (newVisibleDuration >= 0.1) {
                    console.log(`後方衝突: クリップ ${otherClip.id} の後ろを ${overlap.toFixed(2)}秒 トリミング`);
                    
                    // audioEngineのクリップの再生時間を調整
                    const audioTrack = window.audioEngine.getTrack(trackId);
                    if (audioTrack) {
                        const audioClip = audioTrack.clips.find(c => c.id === otherClip.id);
                        if (audioClip) {
                            audioClip.duration = otherClip.offset + newVisibleDuration;
                        }
                    }
                    
                    // trackManagerのクリップも更新
                    otherClip.duration = otherClip.offset + newVisibleDuration;
                    
                    // 幅を更新
                    this.updateClipPositionAndWidth(trackId, otherClip.id);
                    // 波形を再描画
                    this.drawClipWaveform(trackId, otherClip.id);
                }
            }
            
            // パターン3: 移動したクリップが他のクリップを完全に覆った場合
            // [移動クリップ          ] が [他のクリップ] を完全に覆う
            // → 他のクリップを非表示（最小サイズに）
            else if (movedStart <= otherStart && movedEnd >= otherEnd) {
                console.log(`完全衝突: クリップ ${otherClip.id} が完全に覆われました`);
                
                // この場合は他のクリップを移動させる（移動クリップの後ろへ）
                otherClip.startTime = movedEnd;
                otherClip.offset = 0;
                
                // audioEngineのクリップも更新
                const audioTrack = window.audioEngine.getTrack(trackId);
                if (audioTrack) {
                    const audioClip = audioTrack.clips.find(c => c.id === otherClip.id);
                    if (audioClip) {
                        audioClip.startTime = otherClip.startTime;
                        audioClip.offset = otherClip.offset;
                    }
                }
                
                // 位置を更新
                this.updateClipPositionAndWidth(trackId, otherClip.id);
                // 波形を再描画
                this.drawClipWaveform(trackId, otherClip.id);
            }
        });
    }
    
    // クリップ位置と幅を更新
    updateClipPositionAndWidth(trackId, clipId) {
        const track = this.getTrack(trackId);
        const clip = track.clips.find(c => c.id === clipId);
        const clipElement = document.querySelector(`[data-clip-id="${clipId}"][data-track-id="${trackId}"]`);
        
        if (clipElement && clip) {
            const leftPos = clip.startTime * this.pixelsPerSecond;
            const visibleDuration = clip.duration - clip.offset;
            const width = visibleDuration * this.pixelsPerSecond;
            
            clipElement.style.left = `${leftPos}px`;
            clipElement.style.width = `${width}px`;
        }
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
    
    // クリップゲイン情報を更新
    async updateClipGainInfo(trackId, clipId) {
        const track = this.getTrack(trackId);
        if (!track) return;
        
        const clip = track.clips.find(c => c.id === clipId);
        if (!clip) return;
        
        const audioFile = await window.fileManager.getAudioFile(clip.fileId);
        if (!audioFile || !audioFile.audioBuffer) return;
        
        // ピーク値を計算
        let peak = 0;
        for (let channel = 0; channel < audioFile.audioBuffer.numberOfChannels; channel++) {
            const channelData = audioFile.audioBuffer.getChannelData(channel);
            for (let i = 0; i < channelData.length; i++) {
                const abs = Math.abs(channelData[i]);
                if (abs > peak) peak = abs;
            }
        }
        
        const peakDb = peak > 0 ? 20 * Math.log10(peak) : -Infinity;
        const gainDb = clip.gain || 0;
        const adjustedPeakDb = peakDb + gainDb;
        
        // 表示を更新
        const currentPeakElement = document.getElementById('clipCurrentPeak');
        const adjustedPeakElement = document.getElementById('clipAdjustedPeak');
        
        if (currentPeakElement) {
            currentPeakElement.textContent = `${peakDb.toFixed(1)} dB`;
            currentPeakElement.style.color = peakDb > -0.1 ? 'var(--color-danger)' : 'var(--color-primary)';
        }
        
        if (adjustedPeakElement) {
            adjustedPeakElement.textContent = `${adjustedPeakDb.toFixed(1)} dB`;
            adjustedPeakElement.style.color = adjustedPeakDb > -0.1 ? 'var(--color-danger)' : 'var(--color-primary)';
        }
    }
    
    // クリップゲインを設定
    setClipGain(trackId, clipId, gainDb) {
        const track = this.getTrack(trackId);
        if (!track) return;
        
        const clip = track.clips.find(c => c.id === clipId);
        if (!clip) return;
        
        clip.gain = gainDb;
        
        // audioEngineのクリップも更新
        const audioTrack = window.audioEngine.getTrack(trackId);
        if (audioTrack) {
            const audioClip = audioTrack.clips.find(c => c.id === clipId);
            if (audioClip) {
                audioClip.gain = gainDb;
            }
        }
        
        // ピーク情報を更新
        this.updateClipGainInfo(trackId, clipId);
        
        // タイムライン上の波形を更新
        this.drawClipWaveform(trackId, clipId);
    }
    
    // クリップの波形を描画
    async drawClipWaveform(trackId, clipId) {
        const track = this.getTrack(trackId);
        if (!track) return;
        
        const clip = track.clips.find(c => c.id === clipId);
        if (!clip) return;
        
        const waveformContainer = document.querySelector(`.clip-waveform[data-clip-id="${clipId}"][data-track-id="${trackId}"]`);
        if (!waveformContainer) return;
        
        // オーディオファイルを取得
        const audioFile = await window.fileManager.getAudioFile(clip.fileId);
        if (!audioFile || !audioFile.audioBuffer) return;
        
        // 既存のcanvasを削除
        const existingCanvas = waveformContainer.querySelector('canvas');
        if (existingCanvas) {
            existingCanvas.remove();
        }
        
        const canvas = document.createElement('canvas');
        const clipElement = waveformContainer.closest('.track-clip');
        const rect = clipElement.getBoundingClientRect();
        canvas.width = rect.width * 2; // Retina対応
        canvas.height = rect.height * 2;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        waveformContainer.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // 波形データを取得
        const audioBuffer = audioFile.audioBuffer;
        const rawData = audioBuffer.getChannelData(0);
        
        // オフセットとデュレーションを考慮
        const offsetSeconds = clip.offset || 0;
        const visibleDuration = clip.duration - offsetSeconds;
        
        // オフセット位置（サンプル数）を計算
        const sampleRate = audioBuffer.sampleRate;
        const offsetSamples = Math.floor(offsetSeconds * sampleRate);
        const visibleSamples = Math.floor(visibleDuration * sampleRate);
        
        // 表示するサンプル範囲
        const startSample = offsetSamples;
        const endSample = Math.min(offsetSamples + visibleSamples, rawData.length);
        const actualSamples = endSample - startSample;
        
        // キャンバスのサンプル数
        const samples = Math.floor(width / 2);
        const blockSize = Math.floor(actualSamples / samples);
        const filteredData = [];
        
        // クリップゲインを適用
        const clipGainDb = clip.gain || 0;
        const clipGainLinear = Math.pow(10, clipGainDb / 20);
        
        // トラックボリュームを取得
        const trackVolume = track.volume !== undefined ? track.volume : 1.0;
        
        // トラックエフェクトの影響を計算
        const audioTrack = window.audioEngine.getTrack(trackId);
        let eqMultiplier = 1.0;
        let limiterEnabled = false;
        let limiterThreshold = -6;
        let limiterRatio = 10;
        
        if (audioTrack) {
            // EQの影響（平均ゲインで近似）
            if (audioTrack.eqEnabled && audioTrack.eq) {
                const lowGain = audioTrack.eq.low.gain.value;
                const midGain = audioTrack.eq.mid.gain.value;
                const highGain = audioTrack.eq.high.gain.value;
                
                // 平均的な影響を計算
                const avgEQGain = (lowGain + midGain + highGain) / 3;
                eqMultiplier = Math.pow(10, avgEQGain / 20);
            }
            
            // リミッター設定を取得
            if (audioTrack.limiterEnabled && audioTrack.limiter) {
                limiterEnabled = true;
                limiterThreshold = audioTrack.limiter.threshold.value;
                limiterRatio = audioTrack.limiter.ratio.value;
            }
        }
        
        // 総合ゲイン（クリップゲイン × トラックボリューム × EQ効果）
        const totalGain = clipGainLinear * trackVolume * eqMultiplier;
        
        // ピークを抽出してエフェクトを適用
        const thresholdLinear = limiterEnabled ? Math.pow(10, limiterThreshold / 20) : 999;
        
        for (let i = 0; i < samples; i++) {
            let blockStart = startSample + (blockSize * i);  // オフセット位置から開始
            let max = 0;
            for (let j = 0; j < blockSize; j++) {
                const sampleIndex = blockStart + j;
                if (sampleIndex >= endSample) break;  // 終了位置を超えたら停止
                const val = Math.abs(rawData[sampleIndex] || 0) * totalGain;
                if (val > max) max = val;
            }
            
            // リミッターを適用（閾値を超えた部分を圧縮）
            if (limiterEnabled && max > thresholdLinear) {
                // 閾値を超えた分を圧縮
                const over = max - thresholdLinear;
                max = thresholdLinear + (over / limiterRatio);
            }
            
            filteredData.push(max);
        }
        
        // 背景をクリア
        ctx.clearRect(0, 0, width, height);
        
        // 波形を描画
        const middle = height / 2;
        const barWidth = width / samples;
        
        for (let i = 0; i < samples; i++) {
            const value = filteredData[i];
            const barHeight = value * middle * 0.85;
            const x = i * barWidth;
            
            // クリッピング検出
            const isClipping = value > 1.0;
            
            // リミッターが効いている場合は色を変える
            const thresholdLinear = limiterEnabled ? Math.pow(10, limiterThreshold / 20) : 999;
            const isLimiterActive = limiterEnabled && value > thresholdLinear;
            
            let color;
            if (isClipping) {
                color = 'rgba(214, 115, 115, 0.8)'; // 赤：クリッピング
            } else if (isLimiterActive) {
                color = 'rgba(255, 200, 100, 0.7)'; // オレンジ：リミッター作動中
            } else {
                color = 'rgba(139, 111, 71, 0.6)'; // チョコレート：通常
            }
            
            ctx.fillStyle = color;
            
            // 上下対称に描画
            ctx.fillRect(x, middle - barHeight, barWidth - 0.5, barHeight * 2);
        }
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
    
    // クリップ削除
    removeClip(trackId, clipId) {
        const track = this.getTrack(trackId);
        if (!track) return;
        
        const clipIndex = track.clips.findIndex(c => c.id === clipId);
        if (clipIndex === -1) return;
        
        const clip = track.clips[clipIndex];
        
        // 履歴に記録
        window.historyManager.pushAction({
            undo: () => {
                // クリップを復元
                this.restoreClip(trackId, clip, clipIndex);
            },
            redo: () => {
                // クリップを削除
                this.deleteClip(trackId, clipId);
            }
        });
        
        // 実際の削除処理
        this.deleteClip(trackId, clipId);
    }
    
    // クリップの実際の削除処理
    deleteClip(trackId, clipId) {
        const track = this.getTrack(trackId);
        if (!track) return;
        
        const clipIndex = track.clips.findIndex(c => c.id === clipId);
        if (clipIndex === -1) return;
        
        // trackManagerから削除
        track.clips.splice(clipIndex, 1);
        
        // audioEngineから削除
        window.audioEngine.removeClip(trackId, clipId);
        
        // DOMから削除
        const clipElement = document.querySelector(`[data-clip-id="${clipId}"][data-track-id="${trackId}"]`);
        if (clipElement) {
            clipElement.remove();
        }
        
        // 選択解除
        if (this.selectedClip && this.selectedClip.clipId === clipId) {
            this.selectedClip = null;
        }
    }
    
    // クリップを復元
    async restoreClip(trackId, clipData, insertIndex) {
        const track = this.getTrack(trackId);
        if (!track) return;
        
        // オーディオファイルを取得
        const audioFile = await window.fileManager.getAudioFile(clipData.fileId);
        if (!audioFile) return;
        
        // trackManagerに追加
        const clip = {
            id: clipData.id,
            fileId: clipData.fileId,
            name: clipData.name,
            startTime: clipData.startTime,
            duration: clipData.duration,
            offset: clipData.offset,
            fadeIn: clipData.fadeIn,
            fadeOut: clipData.fadeOut
        };
        
        track.clips.splice(insertIndex, 0, clip);
        
        // audioEngineに追加
        window.audioEngine.addClip(trackId, {
            id: clip.id,
            name: clip.name,
            audioBuffer: audioFile.audioBuffer,
            startTime: clip.startTime,
            offset: clip.offset,
            duration: clip.duration,
            fadeIn: clip.fadeIn,
            fadeOut: clip.fadeOut
        });
        
        // DOMに追加
        this.renderClip(trackId, clip);
    }
}

// グローバルインスタンス
window.trackManager = new TrackManager();
