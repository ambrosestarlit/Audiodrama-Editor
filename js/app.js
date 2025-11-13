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
            // 各マネージャーの初期化
            await window.projectManager.init();
            window.fileManager.init();
            window.effectsManager.init();
            window.exportManager.init();
            
            // イベントリスナー設定
            this.setupEventListeners();
            
            // 新規プロジェクト作成
            this.createNewProject();
            
            // 初期トラックを追加
            window.trackManager.addTrack('メイントラック');
            
            console.log('VoiceDrama DAW initialized successfully');
        } catch (error) {
            console.error('Initialization error:', error);
            alert('アプリケーションの初期化に失敗しました');
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
        
        // トランスポートコントロール
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.addEventListener('click', async () => {
                console.log('Play button clicked in app.js');
                await this.play();
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
    }
    
    // 新規プロジェクト作成
    createNewProject() {
        // 既存トラックをクリア
        window.trackManager.clearAllTracks();
        window.fileManager.clearFileList();
        
        // 新規プロジェクト
        const project = window.projectManager.createNewProject();
        
        // プロジェクト名を表示
        const projectNameElement = document.getElementById('projectName');
        if (projectNameElement) {
            projectNameElement.textContent = project.name;
        }
        
        // エフェクトをリセット
        window.effectsManager.resetAllEffects();
        
        // 初期トラック追加
        window.trackManager.addTrack('メイントラック');
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
            project.tracks = window.trackManager.tracks;
            project.audioFiles = window.fileManager.exportFileList();
            project.effectSettings = window.effectsManager.getEffectSettings();
            project.zoom = window.trackManager.pixelsPerSecond;
            
            await window.projectManager.saveProject(project);
            alert('プロジェクトを保存しました');
        } catch (error) {
            console.error('Save project error:', error);
            alert('プロジェクトの保存に失敗しました');
        }
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
            
            // プロジェクト名を表示
            const projectNameElement = document.getElementById('projectName');
            if (projectNameElement) {
                projectNameElement.textContent = project.name;
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
                            const audioFile = await window.fileManager.getAudioFile(clipData.fileId);
                            if (audioFile) {
                                await window.trackManager.addClip(track.id, audioFile, clipData.startTime);
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
            
            alert('プロジェクトを読み込みました');
        } catch (error) {
            console.error('Load project error:', error);
            alert('プロジェクトの読み込みに失敗しました');
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
        this.updateTimeDisplay();
        
        // プレイヘッドを0に戻す
        const playhead = document.querySelector('.playhead');
        if (playhead) {
            playhead.style.left = '0px';
        }
    }
    
    // 時間表示の更新を開始
    startTimeUpdate() {
        // プレイヘッドを作成
        this.createPlayhead();
        
        const update = () => {
            if (!this.isPlaying) return;
            
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
        
        const playhead = document.createElement('div');
        playhead.className = 'playhead';
        playhead.style.left = '0px';
        tracksContainer.appendChild(playhead);
    }
    
    // プレイヘッドを更新
    updatePlayhead() {
        const playhead = document.querySelector('.playhead');
        if (!playhead) return;
        
        const leftPos = window.audioEngine.currentTime * window.trackManager.pixelsPerSecond;
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
