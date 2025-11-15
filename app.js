// ==========================================
// Main Application
// ==========================================

class VoiceDramaDAW {
    constructor() {
        this.isPlaying = false;
        this.animationId = null;
        this.pendingProject = null; // 素材ZIP読み込み待ちのプロジェクト
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
                'historyManager',
                'keyframeManager',
                'keyframeEditorUI'
            ];
            
            const missingManagers = requiredManagers.filter(manager => !window[manager]);
            
            if (missingManagers.length > 0) {
                throw new Error(`必要なマネージャーが読み込まれていません: ${missingManagers.join(', ')}\n\nJavaScriptファイルが正しく読み込まれているか確認してください。`);
            }
            
            // 各マネージャーの初期化
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
            
            try {
                console.log('Initializing keyframeEditorUI...');
                window.keyframeEditorUI.init();
                console.log('✓ keyframeEditorUI initialized');
            } catch (error) {
                console.error('✗ keyframeEditorUI initialization failed:', error);
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
        // プロジェクト名の編集
        const projectNameInput = document.getElementById('projectName');
        if (projectNameInput) {
            // フォーカス時に全選択
            projectNameInput.addEventListener('focus', (e) => {
                e.target.select();
            });
            
            // 入力時にプロジェクト名を更新
            projectNameInput.addEventListener('change', (e) => {
                let newName = e.target.value.trim();
                
                // 空の場合はデフォルト名
                if (!newName) {
                    newName = '新規プロジェクト';
                }
                
                // ファイル名として使えない文字を除去
                newName = newName.replace(/[<>:"/\\|?*]/g, '_');
                
                // プロジェクト名を更新
                e.target.value = newName;
                window.projectManager.updateProjectName(newName);
                
                console.log(`プロジェクト名を変更: ${newName}`);
            });
            
            // Enterキーで確定
            projectNameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.target.blur(); // フォーカスを外して変更を確定
                }
            });
        }
        
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
            this.openLoadProjectDialog();
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
            projectNameElement.value = project.name;
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
            
            // 現在のプロジェクト名を取得
            const projectNameElement = document.getElementById('projectName');
            const projectName = projectNameElement ? projectNameElement.value.trim() : project.name;
            
            // ファイル名として使えない文字を除去
            const safeName = projectName.replace(/[<>:"/\\|?*]/g, '_');
            
            // プロジェクト名を更新
            project.name = safeName;
            window.projectManager.updateProjectName(safeName);
            
            // プロジェクト名を表示に反映
            if (projectNameElement) {
                projectNameElement.value = safeName;
            }
            
            // 現在の状態を保存（素材本体は含めない）
            const projectData = {
                version: '1.0',
                projectName: safeName,
                createdAt: project.createdAt,
                updatedAt: new Date().toISOString(),
                sampleRate: project.sampleRate || 48000,
                bitDepth: project.bitDepth || 24,
                
                // トラック情報（素材は参照のみ）
                tracks: window.trackManager.tracks.map(track => {
                    // audioEngineのトラックを取得
                    const audioTrack = window.audioEngine.getTrack(track.id);
                    
                    return {
                        id: track.id,
                        name: track.name || '',
                        volume: track.volume ?? 1.0,
                        mute: track.mute ?? false,
                        solo: track.solo ?? false,
                        
                        // トラックEQ設定（audioEngineから取得）
                        eqEnabled: audioTrack?.eqEnabled ?? false,
                        eq: {
                            low: audioTrack?.eq?.low?.gain?.value ?? 0,
                            mid: audioTrack?.eq?.mid?.gain?.value ?? 0,
                            high: audioTrack?.eq?.high?.gain?.value ?? 0
                        },
                        
                        // トラックリミッター設定（audioEngineから取得、msに変換）
                        limiterEnabled: audioTrack?.limiterEnabled ?? false,
                        limiter: {
                            threshold: audioTrack?.limiter?.threshold?.value ?? -6,
                            release: (audioTrack?.limiter?.release?.value ?? 0.25) * 1000,
                            ratio: audioTrack?.limiter?.ratio?.value ?? 20
                        },
                        
                        // ノイズリダクション設定（audioEngineから取得）
                        noiseReductionEnabled: audioTrack?.noiseReductionEnabled ?? false,
                        noiseReduction: {
                            highpassEnabled: audioTrack?.noiseReduction?.highpassEnabled ?? false,
                            highpassFrequency: audioTrack?.noiseReduction?.highpassCutoff ?? 80,
                            highpassResonance: audioTrack?.noiseReduction?.highpassResonance ?? 0.7,
                            lowpassEnabled: audioTrack?.noiseReduction?.lowpassEnabled ?? false,
                            lowpassFrequency: audioTrack?.noiseReduction?.lowpassCutoff ?? 8000,
                            lowpassResonance: audioTrack?.noiseReduction?.lowpassResonance ?? 0.7
                        },
                        
                        // エクスパンダー設定（audioEngineから取得、msに変換）
                        expanderEnabled: audioTrack?.expanderEnabled ?? false,
                        expander: {
                            threshold: audioTrack?.expander?.threshold?.value ?? -40,
                            ratio: audioTrack?.expander?.ratio?.value ?? 0.5,
                            release: (audioTrack?.expander?.release?.value ?? 0.25) * 1000
                        },
                        
                        clips: track.clips.map(clip => ({
                            id: clip.id,
                            fileId: clip.fileId,
                            startTime: clip.startTime ?? 0,
                            duration: clip.duration ?? 0,
                            offset: clip.offset ?? 0,
                            gain: clip.gain ?? 0,
                            fadeIn: clip.fadeIn ?? 0,
                            fadeOut: clip.fadeOut ?? 0
                        }))
                    };
                }),
                
                // 素材メタデータ（本体は含めない）
                audioFiles: window.fileManager.getAllFiles().map(file => ({
                    id: file.id,
                    name: file.name || '',
                    category: file.category || 'other',
                    duration: file.duration ?? 0,
                    sampleRate: file.sampleRate ?? 48000,
                    numberOfChannels: file.numberOfChannels ?? 2
                })),
                
                // エフェクト設定
                effectSettings: window.effectsManager.getEffectSettings() || {},
                
                // ズーム設定
                zoom: window.trackManager.pixelsPerSecond ?? 100
            };
            
            // JSON化テスト
            try {
                JSON.stringify(projectData);
                console.log('✅ Project data is serializable');
            } catch (e) {
                console.error('❌ Project data cannot be serialized:', e);
                throw new Error('プロジェクトデータに保存できないオブジェクトが含まれています');
            }
            
            // プロジェクトJSONをダウンロード
            const projectBlob = new Blob([JSON.stringify(projectData, null, 2)], { 
                type: 'application/json' 
            });
            const projectUrl = URL.createObjectURL(projectBlob);
            const projectLink = document.createElement('a');
            projectLink.href = projectUrl;
            projectLink.download = `${safeName}.json`;
            projectLink.click();
            URL.revokeObjectURL(projectUrl);
            
            // 素材をZIPでダウンロード
            const fileList = window.fileManager.getAllFiles();
            await this.downloadAudioFilesAsZip(safeName, fileList);
            
            alert(`プロジェクト「${safeName}」を保存しました\n\n以下のファイルがダウンロードされました:\n・${safeName}.json\n・${safeName}_素材.zip`);
        } catch (error) {
            console.error('Save project error:', error);
            alert(`プロジェクトの保存に失敗しました: ${error.message}`);
        }
    }
    
    // 素材をZIPでダウンロード
    async downloadAudioFilesAsZip(projectName, fileList) {
        if (fileList.length === 0) {
            console.log('No audio files to save');
            return;
        }
        
        // JSZipライブラリを使用（CDNから動的ロード）
        if (!window.JSZip) {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }
        
        const zip = new JSZip();
        const assetsFolder = zip.folder('assets');
        
        // カテゴリごとにフォルダを作成
        const categoryFolders = {};
        const categories = ['dialogue', 'sfx', 'bgm', 'ambience', 'effects'];
        categories.forEach(cat => {
            categoryFolders[cat] = assetsFolder.folder(cat);
        });
        
        // 各ファイルをカテゴリフォルダに追加
        for (const file of fileList) {
            if (file.audioBuffer && file.category) {
                const wavBlob = this.audioBufferToWavBlob(file.audioBuffer);
                const fileName = `${file.name}.wav`;
                const folder = categoryFolders[file.category];
                if (folder) {
                    folder.file(fileName, wavBlob);
                }
            }
        }
        
        // ZIPを生成してダウンロード
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectName}_素材.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // AudioBufferをWAV Blobに変換
    audioBufferToWavBlob(audioBuffer) {
        const numberOfChannels = audioBuffer.numberOfChannels;
        const sampleRate = audioBuffer.sampleRate;
        const length = audioBuffer.length;
        const bitDepth = 16;
        const bytesPerSample = bitDepth / 8;
        
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
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
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
                view.setInt16(offset, sample, true);
                offset += 2;
            }
        }
        
        return new Blob([buffer], { type: 'audio/wav' });
    }
    
    // プロジェクト読み込みダイアログを開く
    openLoadProjectDialog() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            await this.loadProjectJSON(e);
        };
        
        input.click();
    }
    
    // プロジェクトJSON読み込み
    async loadProjectJSON(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const projectData = JSON.parse(e.target.result);
                
                // バージョンチェック
                if (projectData.version !== '1.0') {
                    console.warn('異なるバージョンのプロジェクトです:', projectData.version);
                }
                
                // プロジェクトデータを一時保存
                this.pendingProject = projectData;
                
                // プロジェクト名を表示
                const projectNameElement = document.getElementById('projectName');
                if (projectNameElement) {
                    projectNameElement.value = projectData.projectName || '無題のプロジェクト';
                }
                
                // 素材ZIP読み込みを促す
                const projectName = projectData.projectName || 'プロジェクト';
                const loadZip = confirm(
                    `プロジェクト「${projectName}」を読み込みました。\n\n` +
                    `続いて素材ZIPファイル「${projectName}_素材.zip」を選択してください。`
                );
                
                if (loadZip) {
                    this.openLoadAssetsZipDialog();
                } else {
                    alert('素材が読み込まれていません。\n後で読み込む場合は、再度プロジェクトを開いてください。');
                    this.pendingProject = null;
                }
            } catch (error) {
                console.error('Load project JSON error:', error);
                alert(`プロジェクトの読み込みに失敗しました: ${error.message}`);
            }
        };
        
        reader.onerror = () => {
            alert('ファイルの読み込みに失敗しました');
        };
        
        reader.readAsText(file);
    }
    
    // 素材ZIP読み込みダイアログを開く
    openLoadAssetsZipDialog() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.zip';
        
        input.onchange = async (e) => {
            await this.loadAssetsZip(e);
        };
        
        input.click();
    }
    
    // 素材ZIP読み込み
    async loadAssetsZip(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            // JSZipライブラリを使用
            if (!window.JSZip) {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
                await new Promise((resolve, reject) => {
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }
            
            const zip = await JSZip.loadAsync(file);
            const assetsFolder = zip.folder('assets');
            
            if (!assetsFolder) {
                throw new Error('ZIPファイル内にassetsフォルダが見つかりません');
            }
            
            // 既存の素材をクリア
            if (typeof window.fileManager.clearAllFiles === 'function') {
                try {
                    // clearAllFilesを呼ぶが、renderFileListエラーを無視
                    window.fileManager.audioFiles = {
                        dialogue: [],
                        sfx: [],
                        bgm: [],
                        ambience: [],
                        effects: []
                    };
                    
                    // UIもクリア
                    ['dialogue', 'sfx', 'bgm', 'ambience', 'effects'].forEach(cat => {
                        const list = document.getElementById(`${cat}-list`);
                        if (list) list.innerHTML = '';
                    });
                } catch (e) {
                    console.warn('Clear files warning:', e);
                }
            }
            
            // ZIPから素材を抽出
            const filePromises = [];
            
            assetsFolder.forEach((relativePath, zipEntry) => {
                if (zipEntry.dir) return;
                
                // パスを分解（例: "dialogue/file_123_voice.wav"）
                const pathParts = relativePath.split('/');
                
                if (pathParts.length >= 2) {
                    // カテゴリフォルダ内のファイル
                    const category = pathParts[0]; // dialogue, sfx, bgm, ambience, effects
                    const fileName = pathParts[pathParts.length - 1];
                    
                    const promise = zipEntry.async('blob').then(async blob => {
                        // ファイル名から拡張子を除いた名前を取得
                        const originalName = fileName.replace('.wav', '');
                        
                        // BlobからFileオブジェクトを作成
                        const mimeType = 'audio/wav';
                        const file = new File([blob], fileName, { type: mimeType });
                        
                        // fileManager.importAudioFileを使って追加
                        await window.fileManager.importAudioFile(file, category);
                    });
                    
                    filePromises.push(promise);
                }
            });
            
            await Promise.all(filePromises);
            
            // プロジェクトデータから項目を復元
            if (this.pendingProject) {
                await this.restoreProjectData(this.pendingProject);
                this.pendingProject = null;
            }
            
            alert('素材とプロジェクトの読み込みが完了しました');
        } catch (error) {
            console.error('Load assets ZIP error:', error);
            alert(`素材ZIPの読み込みに失敗しました: ${error.message}`);
        }
    }
    
    // プロジェクトデータから項目を復元
    async restoreProjectData(projectData) {
        // トラックをクリア
        window.trackManager.clearAllTracks();
        
        // トラックとクリップを復元
        if (projectData.tracks) {
            for (const trackData of projectData.tracks) {
                const track = window.trackManager.addTrack(trackData.name);
                if (track) {
                    track.volume = trackData.volume ?? 1.0;
                    track.mute = trackData.mute ?? false;
                    track.solo = trackData.solo ?? false;
                    
                    // ボリュームスライダーとUI表示を更新
                    const volumeSlider = document.querySelector(`.volume-slider[data-track-id="${track.id}"]`);
                    if (volumeSlider) {
                        volumeSlider.value = track.volume;
                        // スライダーの進捗バーも更新
                        if (window.updateSliderProgress) {
                            window.updateSliderProgress(volumeSlider);
                        }
                    }
                    const volumeValue = document.querySelector(`[data-track-id="${track.id}"]`)?.querySelector('.volume-value');
                    if (volumeValue) {
                        volumeValue.textContent = Math.round(track.volume * 100);
                    }
                    window.audioEngine.setTrackVolume(track.id, track.volume);
                    
                    // audioEngineのトラックを取得
                    const audioTrack = window.audioEngine.getTrack(track.id);
                    
                    if (audioTrack) {
                        // トラックEQ設定を復元
                        audioTrack.eqEnabled = trackData.eqEnabled ?? false;
                        if (trackData.eq) {
                            if (audioTrack.eq.low?.gain) audioTrack.eq.low.gain.value = trackData.eq.low ?? 0;
                            if (audioTrack.eq.mid?.gain) audioTrack.eq.mid.gain.value = trackData.eq.mid ?? 0;
                            if (audioTrack.eq.high?.gain) audioTrack.eq.high.gain.value = trackData.eq.high ?? 0;
                        }
                        window.audioEngine.setTrackEQEnabled(track.id, audioTrack.eqEnabled);
                        
                        // トラックリミッター設定を復元
                        audioTrack.limiterEnabled = trackData.limiterEnabled ?? false;
                        if (trackData.limiter) {
                            if (audioTrack.limiter.threshold) audioTrack.limiter.threshold.value = trackData.limiter.threshold ?? -6;
                            if (audioTrack.limiter.release) audioTrack.limiter.release.value = (trackData.limiter.release ?? 250) / 1000;
                            if (audioTrack.limiter.ratio) audioTrack.limiter.ratio.value = trackData.limiter.ratio ?? 20;
                        }
                        window.audioEngine.setTrackLimiterEnabled(track.id, audioTrack.limiterEnabled);
                        
                        // ノイズリダクション設定を復元
                        audioTrack.noiseReductionEnabled = trackData.noiseReductionEnabled ?? 
                            (trackData.noiseReduction?.highpassEnabled || trackData.noiseReduction?.lowpassEnabled || false);
                        if (trackData.noiseReduction) {
                            audioTrack.noiseReduction.highpassEnabled = trackData.noiseReduction.highpassEnabled ?? false;
                            audioTrack.noiseReduction.lowpassEnabled = trackData.noiseReduction.lowpassEnabled ?? false;
                            
                            if (audioTrack.noiseReduction.highpass?.frequency) {
                                const freq = trackData.noiseReduction.highpassFrequency ?? 80;
                                audioTrack.noiseReduction.highpass.frequency.value = freq;
                                audioTrack.noiseReduction.highpassCutoff = freq;
                            }
                            if (audioTrack.noiseReduction.lowpass?.frequency) {
                                const freq = trackData.noiseReduction.lowpassFrequency ?? 8000;
                                audioTrack.noiseReduction.lowpass.frequency.value = freq;
                                audioTrack.noiseReduction.lowpassCutoff = freq;
                            }
                            if (trackData.noiseReduction.highpassResonance !== undefined) {
                                audioTrack.noiseReduction.highpassResonance = trackData.noiseReduction.highpassResonance;
                                if (audioTrack.noiseReduction.highpass?.Q) {
                                    audioTrack.noiseReduction.highpass.Q.value = trackData.noiseReduction.highpassResonance;
                                }
                            }
                            if (trackData.noiseReduction.lowpassResonance !== undefined) {
                                audioTrack.noiseReduction.lowpassResonance = trackData.noiseReduction.lowpassResonance;
                                if (audioTrack.noiseReduction.lowpass?.Q) {
                                    audioTrack.noiseReduction.lowpass.Q.value = trackData.noiseReduction.lowpassResonance;
                                }
                            }
                        }
                        window.audioEngine.setTrackNoiseReductionEnabled(track.id, audioTrack.noiseReductionEnabled);
                        
                        // エクスパンダー設定を復元
                        audioTrack.expanderEnabled = trackData.expanderEnabled ?? false;
                        if (trackData.expander) {
                            if (audioTrack.expander.threshold) audioTrack.expander.threshold.value = trackData.expander.threshold ?? -40;
                            if (audioTrack.expander.ratio) audioTrack.expander.ratio.value = trackData.expander.ratio ?? 0.5;
                            if (audioTrack.expander.release) audioTrack.expander.release.value = (trackData.expander.release ?? 250) / 1000;
                        }
                        window.audioEngine.setTrackExpanderEnabled(track.id, audioTrack.expanderEnabled);
                    }
                    
                    // クリップを復元
                    for (const clipData of trackData.clips) {
                        const audioFile = window.fileManager.getFileById(clipData.fileId);
                        if (audioFile) {
                            const clip = await window.trackManager.addClip(track.id, audioFile, clipData.startTime);
                            if (clip) {
                                clip.offset = clipData.offset ?? 0;
                                clip.gain = clipData.gain ?? 0;
                                clip.fadeIn = clipData.fadeIn ?? 0;
                                clip.fadeOut = clipData.fadeOut ?? 0;
                                
                                // audioEngineのクリップにもゲインを設定
                                const audioClip = audioTrack?.clips.find(c => c.id === clip.id);
                                if (audioClip) {
                                    audioClip.gain = clip.gain;
                                }
                                
                                // 波形を再描画してゲインを反映
                                await window.trackManager.drawClipWaveform(track.id, clip.id);
                            }
                        } else {
                            console.warn(`素材が見つかりません: ${clipData.fileId}`);
                        }
                    }
                    
                    // FXボタンの状態を更新
                    window.effectsManager.updateFXButtonState(track.id);
                }
            }
        }
        
        // エフェクト設定を復元
        if (projectData.effectSettings) {
            window.effectsManager.applyEffectSettings(projectData.effectSettings);
        }
        
        // キーフレームデータを復元
        if (projectData.keyframes && window.keyframeManager) {
            window.keyframeManager.deserialize(projectData.keyframes);
            console.log('キーフレームデータを復元しました');
        }
        
        // ズームを復元
        if (projectData.zoom) {
            window.trackManager.setZoom(projectData.zoom);
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
