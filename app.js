// ==========================================
// Main Application
// ==========================================

class VoiceDramaDAW {
    constructor() {
        this.isPlaying = false;
        this.animationId = null;
    }
    
    // 初期化
    async init() {
        console.log('VoiceDrama DAW initializing...');
        
        try {
            // 必要なマネージャーの存在確認
            const requiredManagers = [
                'audioEngine',
                'projectManager', 
                'fileManager',
                'effectsManager',
                'exportManager',
                'trackManager',
                'historyManager'
            ];
            
            const missingManagers = requiredManagers.filter(manager => !window[manager]);
            
            if (missingManagers.length > 0) {
                throw new Error(`必要なマネージャーが読み込まれていません: ${missingManagers.join(', ')}\n\nJavaScriptファイルが正しく読み込まれているか確認してください。`);
            }
            
            // 各マネージャーの初期化
            try {
                console.log('Initializing projectManager...');
                await window.projectManager.init();
                console.log('✓ projectManager initialized');
            } catch (error) {
                console.error('✗ projectManager initialization failed:', error);
                throw error;
            }
            
            try {
                console.log('Initializing fileManager...');
                window.fileManager.init();
                console.log('✓ fileManager initialized');
            } catch (error) {
                console.error('✗ fileManager initialization failed:', error);
                throw error;
            }
            
            try {
                console.log('Initializing effectsManager...');
                window.effectsManager.init();
                console.log('✓ effectsManager initialized');
            } catch (error) {
                console.error('✗ effectsManager initialization failed:', error);
                throw error;
            }
            
            try {
                console.log('Initializing exportManager...');
                window.exportManager.init();
                console.log('✓ exportManager initialized');
            } catch (error) {
                console.error('✗ exportManager initialization failed:', error);
                throw error;
            }
            
            // イベントリスナー設定
            console.log('Setting up event listeners...');
            this.setupEventListeners();
            console.log('✓ Event listeners set up');
            
            // 新規プロジェクト作成（この中で初期トラックも作成される）
            console.log('Creating new project...');
            this.createNewProject();
            console.log('✓ New project created');
            
            console.log('✓ VoiceDrama DAW initialized successfully');
        } catch (error) {
            console.error('Initialization error:', error);
            console.error('Error stack:', error.stack);
            alert(`アプリケーションの初期化に失敗しました\n\n${error.message}\n\n詳細はコンソールを確認してください`);
        }
    }
    
    // イベントリスナー設定
    setupEventListeners() {
        // プロジェクト管理
        document.getElementById('newProjectBtn')?.addEventListener('click', () => {
            if (confirm('新規プロジェクトを作成しますか？未保存の変更は失われます。')) {
                this.createNewProject();
            }
        });
        
        document.getElementById('saveProjectBtn')?.addEventListener('click', () => {
            this.saveProject();
        });
        
        document.getElementById('loadProjectBtn')?.addEventListener('click', () => {
            this.openLoadProjectModal();
        });
        
        // クリップゲイン調整ポップアップ
        const clipGainSlider = document.getElementById('clipGainSlider');
        if (clipGainSlider) {
            clipGainSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                const valueDisplay = document.getElementById('clipGainValue');
                if (valueDisplay) {
                    valueDisplay.textContent = `${value >= 0 ? '+' : ''}${value.toFixed(1)} dB`;
                }
                
                // リアルタイムでゲインを適用
                if (window.trackManager.currentGainClip) {
                    const { trackId, clipId } = window.trackManager.currentGainClip;
                    window.trackManager.setClipGain(trackId, clipId, value);
                }
            });
        }
        
        // ゲインプリセットボタン
        document.querySelectorAll('.gain-preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const value = parseFloat(e.target.dataset.value);
                const slider = document.getElementById('clipGainSlider');
                if (slider) {
                    slider.value = value;
                    const valueDisplay = document.getElementById('clipGainValue');
                    if (valueDisplay) {
                        valueDisplay.textContent = `${value >= 0 ? '+' : ''}${value.toFixed(1)} dB`;
                    }
                    
                    // ゲインを適用
                    if (window.trackManager.currentGainClip) {
                        const { trackId, clipId } = window.trackManager.currentGainClip;
                        window.trackManager.setClipGain(trackId, clipId, value);
                    }
                }
            });
        });
        
        // クリップゲインポップアップを閉じる
        const closeClipGainBtn = document.getElementById('closeClipGainBtn');
        if (closeClipGainBtn) {
            closeClipGainBtn.addEventListener('click', () => {
                const popup = document.getElementById('clipGainPopup');
                if (popup) {
                    popup.style.display = 'none';
                    window.trackManager.currentGainClip = null;
                }
            });
        }
        
        // アンドゥ・リドゥ
        document.getElementById('undoBtn')?.addEventListener('click', () => {
            window.historyManager.undo();
        });
        
        document.getElementById('redoBtn')?.addEventListener('click', () => {
            window.historyManager.redo();
        });
        
        // トランスポートコントロール
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.addEventListener('click', async () => {
                console.log('Play button clicked in app.js');
                try {
                    await this.play();
                    console.log('Play completed successfully');
                } catch (error) {
                    console.error('Play error:', error);
                }
            });
        }
        
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                console.log('Pause button clicked');
                this.pause();
            });
        }
        
        const stopBtn = document.getElementById('stopBtn');
        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                console.log('Stop button clicked');
                this.stop();
            });
        }
        
        // ズームコントロール
        document.getElementById('zoomInBtn')?.addEventListener('click', () => {
            this.zoomIn();
        });
        
        document.getElementById('zoomOutBtn')?.addEventListener('click', () => {
            this.zoomOut();
        });
        
        document.getElementById('fitBtn')?.addEventListener('click', () => {
            this.fitToWindow();
        });
        
        // トラック追加
        document.getElementById('addTrackBtn')?.addEventListener('click', () => {
            window.trackManager.addTrack();
        });
        
        // モーダルクローズ（背景クリック）
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
        
        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
            
            // Cmd/Ctrl + Z: アンドゥ
            if (cmdOrCtrl && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                window.historyManager.undo();
            }
            
            // Cmd/Ctrl + Y (Windows) または Cmd/Ctrl + Shift + Z (Mac): リドゥ
            if (cmdOrCtrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                window.historyManager.redo();
            }
            
            // Delete (Windows) または Backspace (Mac): 選択中のクリップを削除
            if (e.key === 'Delete' || (isMac && e.key === 'Backspace')) {
                if (window.trackManager.selectedClip) {
                    e.preventDefault();
                    const { trackId, clipId } = window.trackManager.selectedClip;
                    window.trackManager.removeClip(trackId, clipId);
                }
            }
        });
    }
    
    // 新規プロジェクト作成
    createNewProject() {
        // 既存トラックをクリア
        if (window.trackManager) {
            window.trackManager.clearAllTracks();
        }
        if (window.fileManager) {
            window.fileManager.clearFileList();
        }
        
        // 新規プロジェクト
        const project = window.projectManager.createNewProject();
        
        // プロジェクト名を表示
        const projectNameElement = document.getElementById('projectName');
        if (projectNameElement) {
            projectNameElement.textContent = project.name;
        }
        
        // エフェクトをリセット
        if (window.effectsManager && window.effectsManager.resetAllEffects) {
            window.effectsManager.resetAllEffects();
        }
        
        // 初期トラック追加
        if (window.trackManager) {
            window.trackManager.addTrack('メイントラック');
        }
    }
    
    // プロジェクト保存
    async saveProject() {
        try {
            const project = window.projectManager.getCurrentProject();
            if (!project) {
                alert('保存するプロジェクトがありません');
                return;
            }
            
            // 現在の状態を保存
            project.tracks = window.trackManager.tracks.map(track => ({
                ...track,
                clips: track.clips.map(clip => ({
                    id: clip.id,
                    fileId: clip.fileId,
                    startTime: clip.startTime,
                    duration: clip.duration,
                    offset: clip.offset,
                    gain: clip.gain,
                    fadeIn: clip.fadeIn,
                    fadeOut: clip.fadeOut
                }))
            }));
            
            // audioFilesをシリアライズ可能な形式に変換（getAllFiles()を使用）
            const fileList = window.fileManager.getAllFiles();
            project.audioFiles = await Promise.all(fileList.map(async file => {
                // audioBufferの存在確認
                if (!file.audioBuffer) {
                    console.warn('AudioBuffer not found for file:', file.name);
                    return null;
                }
                
                // AudioBufferをArrayBufferに変換
                const audioBufferData = this.serializeAudioBuffer(file.audioBuffer);
                
                return {
                    id: file.id,
                    name: file.name,
                    category: file.category,
                    duration: file.duration,
                    sampleRate: file.sampleRate,
                    numberOfChannels: file.numberOfChannels,
                    fileType: file.fileType,
                    size: file.size,
                    audioBufferData: audioBufferData
                };
            }));
            
            // nullを除外
            project.audioFiles = project.audioFiles.filter(f => f !== null);
            
            project.effectSettings = window.effectsManager.getEffectSettings();
            project.zoom = window.trackManager.pixelsPerSecond;
            
            await window.projectManager.saveProject(project);
            alert('プロジェクトを保存しました');
        } catch (error) {
            console.error('Save project error:', error);
            alert(`プロジェクトの保存に失敗しました: ${error.message}`);
        }
    }
    
    // AudioBufferをシリアライズ可能な形式に変換
    serializeAudioBuffer(audioBuffer) {
        const numberOfChannels = audioBuffer.numberOfChannels;
        const length = audioBuffer.length;
        const sampleRate = audioBuffer.sampleRate;
        
        const channels = [];
        for (let i = 0; i < numberOfChannels; i++) {
            channels.push(audioBuffer.getChannelData(i));
        }
        
        return {
            numberOfChannels: numberOfChannels,
            length: length,
            sampleRate: sampleRate,
            channels: channels
        };
    }
    
    // シリアライズされたデータからAudioBufferを復元
    deserializeAudioBuffer(data) {
        const audioBuffer = window.audioEngine.audioContext.createBuffer(
            data.numberOfChannels,
            data.length,
            data.sampleRate
        );
        
        for (let i = 0; i < data.numberOfChannels; i++) {
            audioBuffer.copyToChannel(new Float32Array(data.channels[i]), i);
        }
        
        return audioBuffer;
    }
    
    // プロジェクト読み込みモーダルを開く
    async openLoadProjectModal() {
        const modal = document.getElementById('projectModal');
        const projectList = document.getElementById('projectList');
        
        if (!modal || !projectList) return;
        
        // プロジェクト一覧を取得
        try {
            const projects = await window.projectManager.getAllProjects();
            
            projectList.innerHTML = '';
            
            if (projects.length === 0) {
                projectList.innerHTML = '<p class="text-muted text-center">保存されたプロジェクトがありません</p>';
            } else {
                projects.forEach(project => {
                    const item = document.createElement('div');
                    item.className = 'project-item';
                    
                    const updatedDate = new Date(project.updatedAt).toLocaleString('ja-JP');
                    
                    item.innerHTML = `
                        <div class="project-item-info">
                            <div class="project-item-name">${project.name}</div>
                            <div class="project-item-meta">
                                <span>トラック数: ${project.tracks?.length || 0}</span>
                                <span>更新日: ${updatedDate}</span>
                            </div>
                        </div>
                        <div class="project-item-actions">
                            <button class="btn btn-small btn-primary" data-action="load" data-id="${project.id}">読込</button>
                            <button class="btn btn-small btn-warning" data-action="download" data-id="${project.id}">DL</button>
                            <button class="btn btn-small btn-danger" data-action="delete" data-id="${project.id}">削除</button>
                        </div>
                    `;
                    
                    projectList.appendChild(item);
                });
                
                // アクションボタンのイベント
                projectList.querySelectorAll('[data-action="load"]').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        const projectId = parseInt(btn.dataset.id);
                        await this.loadProject(projectId);
                        modal.classList.remove('active');
                    });
                });
                
                projectList.querySelectorAll('[data-action="download"]').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        const projectId = parseInt(btn.dataset.id);
                        const project = await window.projectManager.loadProject(projectId);
                        window.projectManager.downloadProjectAsJSON(project);
                    });
                });
                
                projectList.querySelectorAll('[data-action="delete"]').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        if (confirm('このプロジェクトを削除しますか？')) {
                            const projectId = parseInt(btn.dataset.id);
                            await window.projectManager.deleteProject(projectId);
                            this.openLoadProjectModal(); // リストを再読み込み
                        }
                    });
                });
            }
            
            modal.classList.add('active');
        } catch (error) {
            console.error('Load projects error:', error);
            alert('プロジェクト一覧の取得に失敗しました');
        }
    }
    
    // プロジェクト読み込み
    async loadProject(projectId) {
        try {
            const project = await window.projectManager.loadProject(projectId);
            
            // トラックをクリア
            window.trackManager.clearAllTracks();
            
            // ファイルをクリア
            window.fileManager.clearAllFiles();
            
            // プロジェクト名を表示
            const projectNameElement = document.getElementById('projectName');
            if (projectNameElement) {
                projectNameElement.textContent = project.name;
            }
            
            // オーディオファイルを復元
            if (project.audioFiles) {
                for (const fileData of project.audioFiles) {
                    // AudioBufferを復元
                    const audioBuffer = this.deserializeAudioBuffer(fileData.audioBufferData);
                    
                    // ファイルマネージャーに追加
                    const file = {
                        id: fileData.id,
                        name: fileData.name,
                        category: fileData.category,
                        duration: fileData.duration,
                        sampleRate: fileData.sampleRate,
                        numberOfChannels: fileData.numberOfChannels,
                        fileType: fileData.fileType,
                        size: fileData.size,
                        audioBuffer: audioBuffer
                    };
                    
                    window.fileManager.addFileFromData(file);
                }
            }
            
            // トラックを復元
            if (project.tracks) {
                for (const trackData of project.tracks) {
                    const track = window.trackManager.addTrack(trackData.name);
                    if (track) {
                        track.volume = trackData.volume || 0.8;
                        track.mute = trackData.mute || false;
                        track.solo = trackData.solo || false;
                        
                        // クリップを復元
                        for (const clipData of trackData.clips) {
                            const audioFile = window.fileManager.getFileById(clipData.fileId);
                            if (audioFile) {
                                const clip = await window.trackManager.addClip(track.id, audioFile, clipData.startTime);
                                if (clip) {
                                    clip.offset = clipData.offset || 0;
                                    clip.gain = clipData.gain || 0;
                                    clip.fadeIn = clipData.fadeIn || 0;
                                    clip.fadeOut = clipData.fadeOut || 0;
                                }
                            }
                        }
                    }
                }
            }
            
            // エフェクト設定を復元
            if (project.effectSettings) {
                window.effectsManager.applyEffectSettings(project.effectSettings);
            }
            
            // ズームを復元
            if (project.zoom) {
                window.trackManager.setZoom(project.zoom);
            }
            
            // モーダルを閉じる
            const modal = document.getElementById('projectModal');
            if (modal) {
                modal.classList.remove('active');
            }
            
            alert('プロジェクトを読み込みました');
        } catch (error) {
            console.error('Load project error:', error);
            alert(`プロジェクトの読み込みに失敗しました: ${error.message}`);
        }
    }
    
    // 再生
    async play() {
        if (this.isPlaying) return;
        
        // AudioContextを再開
        if (window.audioEngine.audioContext.state === 'suspended') {
            await window.audioEngine.audioContext.resume();
            console.log('AudioContext resumed');
        }
        
        // 再生前にdurationを計算
        window.audioEngine.calculateDuration();
        console.log('Duration calculated:', window.audioEngine.duration);
        
        this.isPlaying = true;
        await window.audioEngine.play(window.audioEngine.currentTime);
        this.startTimeUpdate();
    }
    
    // 一時停止
    pause() {
        if (!this.isPlaying) return;
        
        this.isPlaying = false;
        window.audioEngine.pause();
        this.stopTimeUpdate();
    }
    
    // 停止
    stop() {
        this.isPlaying = false;
        window.audioEngine.stop();
        this.stopTimeUpdate();
        
        // currentTimeを0にリセット
        window.audioEngine.currentTime = 0;
        
        this.updateTimeDisplay();
        
        // プレイヘッドを0に戻す
        const playhead = document.querySelector('.playhead');
        if (playhead) {
            const trackHeader = document.querySelector('.track-header');
            const headerWidth = trackHeader ? trackHeader.offsetWidth : 240;
            playhead.style.left = `${headerWidth}px`;
        }
    }
    
    // 時間表示の更新を開始
    startTimeUpdate() {
        console.log('startTimeUpdate called, isPlaying:', this.isPlaying);
        
        // プレイヘッドを作成
        this.createPlayhead();
        
        const update = () => {
            console.log('update frame, isPlaying:', this.isPlaying);
            if (!this.isPlaying) {
                console.log('Animation stopped because isPlaying is false');
                return;
            }
            
            try {
                if (window.audioEngine.audioContext) {
                    window.audioEngine.currentTime += 0.016; // 約60FPS
                    this.updateTimeDisplay();
                    this.updatePlayhead();
                    
                    // 終了チェック
                    if (window.audioEngine.currentTime >= window.audioEngine.duration) {
                        this.stop();
                        return;
                    }
                }
                
                this.animationId = requestAnimationFrame(update);
            } catch (error) {
                console.error('Update loop error:', error);
                this.stop();
            }
        };
        
        this.animationId = requestAnimationFrame(update);
    }
    
    // 時間表示の更新を停止
    stopTimeUpdate() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    // プレイヘッドを作成
    createPlayhead() {
        // 既存のプレイヘッドを削除
        const existing = document.querySelector('.playhead');
        if (existing) return; // 既に存在する場合は何もしない
        
        const tracksContainer = document.getElementById('tracksContainer');
        if (!tracksContainer) return;
        
        // track-headerの実際の幅を取得
        const trackHeader = document.querySelector('.track-header');
        const headerWidth = trackHeader ? trackHeader.offsetWidth : 240;
        
        const playhead = document.createElement('div');
        playhead.className = 'playhead';
        playhead.style.left = `${headerWidth}px`;
        tracksContainer.appendChild(playhead);
        
        // ドラッグ機能を追加
        this.setupPlayheadDrag(playhead);
    }
    
    // プレイヘッドのドラッグ機能を設定
    setupPlayheadDrag(playhead) {
        let isDragging = false;
        let wasPlaying = false;
        
        const onMouseDown = (e) => {
            // ▽部分（::before擬似要素）のクリック判定
            // クリック位置が上部8px以内なら▽部分
            const rect = playhead.getBoundingClientRect();
            if (e.clientY > rect.top + 8) return;
            
            isDragging = true;
            wasPlaying = this.isPlaying;
            
            // 再生中なら一時停止
            if (this.isPlaying) {
                this.pause();
            }
            
            playhead.classList.add('dragging');
            e.preventDefault();
        };
        
        const onMouseMove = (e) => {
            if (!isDragging) return;
            
            const tracksContainer = document.getElementById('tracksContainer');
            const trackHeader = document.querySelector('.track-header');
            const headerWidth = trackHeader ? trackHeader.offsetWidth : 240;
            
            const rect = tracksContainer.getBoundingClientRect();
            const x = e.clientX - rect.left - headerWidth;
            const time = Math.max(0, x / window.trackManager.pixelsPerSecond);
            
            // 最大時間を超えないように
            const maxTime = window.audioEngine.duration;
            window.audioEngine.currentTime = Math.min(time, maxTime);
            
            this.updatePlayhead();
            this.updateTimeDisplay();
        };
        
        const onMouseUp = () => {
            if (!isDragging) return;
            
            isDragging = false;
            playhead.classList.remove('dragging');
            
            // ドラッグ前に再生中だった場合は再開
            if (wasPlaying) {
                this.play();
            }
        };
        
        playhead.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }
    
    // プレイヘッドを更新
    updatePlayhead() {
        const playhead = document.querySelector('.playhead');
        if (!playhead) return;
        
        // track-headerの実際の幅を取得
        const trackHeader = document.querySelector('.track-header');
        const headerWidth = trackHeader ? trackHeader.offsetWidth : 240;
        
        const leftPos = headerWidth + (window.audioEngine.currentTime * window.trackManager.pixelsPerSecond);
        playhead.style.left = `${leftPos}px`;
    }
    
    // 時間表示を更新
    updateTimeDisplay() {
        const currentTimeElement = document.getElementById('currentTime');
        const totalTimeElement = document.getElementById('totalTime');
        
        if (currentTimeElement) {
            currentTimeElement.textContent = window.trackManager.formatTime(window.audioEngine.currentTime);
        }
        
        if (totalTimeElement) {
            totalTimeElement.textContent = window.trackManager.formatTime(window.audioEngine.duration);
        }
    }
    
    // ズームイン
    zoomIn() {
        const newZoom = Math.min(400, window.trackManager.pixelsPerSecond * 1.5);
        window.trackManager.setZoom(newZoom);
    }
    
    // ズームアウト
    zoomOut() {
        const newZoom = Math.max(25, window.trackManager.pixelsPerSecond / 1.5);
        window.trackManager.setZoom(newZoom);
    }
    
    // ウィンドウにフィット
    fitToWindow() {
        const duration = window.audioEngine.calculateDuration();
        if (duration === 0) return;
        
        const timelineArea = document.getElementById('timelineArea');
        if (!timelineArea) return;
        
        const availableWidth = timelineArea.clientWidth - 200; // トラックヘッダー幅を除く
        const pixelsPerSecond = availableWidth / duration;
        
        window.trackManager.setZoom(Math.max(25, Math.min(400, pixelsPerSecond)));
    }
}

// アプリケーション起動
const app = new VoiceDramaDAW();

// DOMContentLoaded後に初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app.init();
    });
} else {
    app.init();
}

// グローバルに公開
window.voiceDramaDAW = app;
