// ==========================================
// FileManager - ファイル管理クラス
// ==========================================

class FileManager {
    constructor() {
        this.audioFiles = {
            dialogue: [],
            sfx: [],
            bgm: [],
            ambience: [],
            effects: []
        };
        this.currentCategory = 'dialogue';
        this.fileIdCounter = 1;
    }
    
    // 初期化
    init() {
        this.setupEventListeners();
        this.loadSavedFiles();
    }
    
    // イベントリスナー設定
    setupEventListeners() {
        // タブ切り替え
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.dataset.tab;
                this.switchCategory(category);
            });
        });
        
        // ファイル追加ボタン
        const importBtn = document.getElementById('importFilesBtn');
        const fileInput = document.getElementById('fileInput');
        
        importBtn.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files);
            fileInput.value = ''; // リセット
        });
    }
    
    // カテゴリ切り替え
    switchCategory(category) {
        this.currentCategory = category;
        
        // タブボタンのアクティブ状態更新
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === category);
        });
        
        // ファイルリストの表示切り替え
        document.querySelectorAll('.file-list').forEach(list => {
            list.classList.toggle('active', list.id === `${category}-list`);
        });
    }
    
    // ファイル選択処理
    async handleFileSelect(files) {
        const category = this.currentCategory;
        const validFiles = Array.from(files).filter(file => 
            file.type.startsWith('audio/')
        );
        
        if (validFiles.length === 0) {
            alert('音声ファイルを選択してください');
            return;
        }
        
        for (const file of validFiles) {
            try {
                await this.importAudioFile(file, category);
            } catch (error) {
                console.error('File import error:', error);
                alert(`${file.name} のインポートに失敗しました`);
            }
        }
    }
    
    // 音声ファイルインポート
    async importAudioFile(file, category) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const arrayBuffer = e.target.result;
                    const audioBuffer = await window.audioEngine.decodeAudioFile(arrayBuffer);
                    
                    const audioFile = {
                        id: `file_${this.fileIdCounter++}`,
                        name: file.name.replace(/\.[^/.]+$/, ''), // 拡張子削除
                        fileName: file.name,
                        category: category,
                        duration: audioBuffer.duration,
                        audioBuffer: audioBuffer,
                        arrayBuffer: arrayBuffer, // 保存用
                        size: file.size,
                        type: file.type,
                        addedAt: new Date().toISOString()
                    };
                    
                    // カテゴリ別配列に追加
                    this.audioFiles[category].push(audioFile);
                    
                    // IndexedDBに保存
                    await window.projectManager.saveAudioFile({
                        id: audioFile.id,
                        name: audioFile.name,
                        fileName: audioFile.fileName,
                        category: audioFile.category,
                        duration: audioFile.duration,
                        arrayBuffer: audioFile.arrayBuffer,
                        size: audioFile.size,
                        type: audioFile.type,
                        addedAt: audioFile.addedAt
                    });
                    
                    // UI更新
                    this.renderFileItem(audioFile);
                    
                    resolve(audioFile);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file);
        });
    }
    
    // ファイルアイテムをレンダリング
    renderFileItem(audioFile) {
        const listId = `${audioFile.category}-list`;
        const list = document.getElementById(listId);
        if (!list) return;
        
        const item = document.createElement('div');
        item.className = 'file-item';
        item.dataset.fileId = audioFile.id;
        item.draggable = true;
        
        const icon = this.getCategoryIcon(audioFile.category);
        const duration = this.formatDuration(audioFile.duration);
        
        item.innerHTML = `
            <div class="file-item-icon">${icon}</div>
            <div class="file-item-info">
                <div class="file-item-name" title="${audioFile.fileName}">${audioFile.name}</div>
                <div class="file-item-duration">${duration}</div>
            </div>
        `;
        
        // ドラッグイベント
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('fileId', audioFile.id);
            e.dataTransfer.effectAllowed = 'copy';
        });
        
        // ダブルクリックで自動追加
        item.addEventListener('dblclick', async () => {
            // 選択されているトラックまたは新規トラックに追加
            let track = window.trackManager.tracks[0];
            if (!track) {
                track = window.trackManager.addTrack();
            }
            
            if (track) {
                await window.trackManager.addClip(track.id, audioFile, 0);
            }
        });
        
        list.appendChild(item);
    }
    
    // カテゴリアイコン取得
    getCategoryIcon(category) {
        const icons = {
            dialogue: '💬',
            sfx: '🔊',
            bgm: '🎵',
            ambience: '🌊',
            effects: '✨'
        };
        return icons[category] || '📄';
    }
    
    // 時間フォーマット
    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        
        if (mins > 0) {
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `0:${secs.toString().padStart(2, '0')}`;
        }
    }
    
    // オーディオファイル取得
    async getAudioFile(fileId) {
        // メモリ内を検索
        for (const category in this.audioFiles) {
            const file = this.audioFiles[category].find(f => f.id === fileId);
            if (file) return file;
        }
        
        // IndexedDBから取得
        try {
            const fileData = await window.projectManager.getAudioFile(fileId);
            if (fileData) {
                // AudioBufferを再生成
                const audioBuffer = await window.audioEngine.decodeAudioFile(fileData.arrayBuffer);
                fileData.audioBuffer = audioBuffer;
                
                // メモリに追加
                this.audioFiles[fileData.category].push(fileData);
                
                return fileData;
            }
        } catch (error) {
            console.error('Get audio file error:', error);
        }
        
        return null;
    }
    
    // カテゴリ別ファイル取得
    getFilesByCategory(category) {
        return this.audioFiles[category] || [];
    }
    
    // 全ファイル取得
    getAllFiles() {
        const allFiles = [];
        for (const category in this.audioFiles) {
            allFiles.push(...this.audioFiles[category]);
        }
        return allFiles;
    }
    
    // ファイル削除
    async deleteFile(fileId) {
        for (const category in this.audioFiles) {
            const index = this.audioFiles[category].findIndex(f => f.id === fileId);
            if (index !== -1) {
                this.audioFiles[category].splice(index, 1);
                
                // IndexedDBから削除
                await window.projectManager.deleteAudioFile(fileId);
                
                // UI更新
                const item = document.querySelector(`[data-file-id="${fileId}"]`);
                if (item) item.remove();
                
                break;
            }
        }
    }
    
    // 保存済みファイル読み込み
    async loadSavedFiles() {
        try {
            const savedFiles = await window.projectManager.getAllAudioFiles();
            
            for (const fileData of savedFiles) {
                try {
                    // AudioBufferを再生成
                    const audioBuffer = await window.audioEngine.decodeAudioFile(fileData.arrayBuffer);
                    fileData.audioBuffer = audioBuffer;
                    
                    // メモリに追加
                    this.audioFiles[fileData.category].push(fileData);
                    
                    // UI更新
                    this.renderFileItem(fileData);
                } catch (error) {
                    console.error('Failed to load audio file:', fileData.id, error);
                }
            }
        } catch (error) {
            console.error('Load saved files error:', error);
        }
    }
    
    // ファイルリストクリア
    clearFileList(category = null) {
        if (category) {
            this.audioFiles[category] = [];
            const list = document.getElementById(`${category}-list`);
            if (list) list.innerHTML = '';
        } else {
            for (const cat in this.audioFiles) {
                this.audioFiles[cat] = [];
                const list = document.getElementById(`${cat}-list`);
                if (list) list.innerHTML = '';
            }
        }
    }
    
    // ファイルエクスポート（将来の拡張用）
    exportFileList() {
        const fileList = this.getAllFiles().map(f => ({
            id: f.id,
            name: f.name,
            fileName: f.fileName,
            category: f.category,
            duration: f.duration,
            size: f.size,
            type: f.type
        }));
        
        return fileList;
    }
    
    // ファイル検索
    searchFiles(query) {
        const allFiles = this.getAllFiles();
        const lowerQuery = query.toLowerCase();
        
        return allFiles.filter(file => 
            file.name.toLowerCase().includes(lowerQuery) ||
            file.fileName.toLowerCase().includes(lowerQuery)
        );
    }
}

// グローバルインスタンス
window.fileManager = new FileManager();
