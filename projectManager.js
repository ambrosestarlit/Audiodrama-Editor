// ==========================================
// ProjectManager - プロジェクト管理クラス
// ==========================================

class ProjectManager {
    constructor() {
        this.db = null;
        this.currentProject = null;
        this.dbName = 'VoiceDramaDAW';
        this.dbVersion = 1;
        
        this.init();
    }
    
    // IndexedDB初期化
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('IndexedDB open error:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB opened successfully');
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // プロジェクトストア
                if (!db.objectStoreNames.contains('projects')) {
                    const projectStore = db.createObjectStore('projects', { keyPath: 'id', autoIncrement: true });
                    projectStore.createIndex('name', 'name', { unique: false });
                    projectStore.createIndex('updatedAt', 'updatedAt', { unique: false });
                }
                
                // オーディオファイルストア
                if (!db.objectStoreNames.contains('audioFiles')) {
                    const fileStore = db.createObjectStore('audioFiles', { keyPath: 'id' });
                    fileStore.createIndex('category', 'category', { unique: false });
                }
            };
        });
    }
    
    // 新規プロジェクト作成
    createNewProject(name = '新規プロジェクト') {
        this.currentProject = {
            id: null,
            name: name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            sampleRate: 48000,
            bitDepth: 24,
            tracks: [],
            audioFiles: []
        };
        
        return this.currentProject;
    }
    
    // プロジェクト保存
    async saveProject(projectData = null) {
        const project = projectData || this.currentProject;
        if (!project) {
            throw new Error('保存するプロジェクトがありません');
        }
        
        project.updatedAt = new Date().toISOString();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['projects'], 'readwrite');
            const store = transaction.objectStore('projects');
            
            const request = project.id ? store.put(project) : store.add(project);
            
            request.onsuccess = () => {
                project.id = request.result;
                this.currentProject = project;
                console.log('Project saved:', project.id);
                resolve(project);
            };
            
            request.onerror = () => {
                console.error('Project save error:', request.error);
                reject(request.error);
            };
        });
    }
    
    // プロジェクト読み込み
    async loadProject(projectId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['projects'], 'readonly');
            const store = transaction.objectStore('projects');
            const request = store.get(projectId);
            
            request.onsuccess = () => {
                if (request.result) {
                    this.currentProject = request.result;
                    console.log('Project loaded:', projectId);
                    resolve(request.result);
                } else {
                    reject(new Error('プロジェクトが見つかりません'));
                }
            };
            
            request.onerror = () => {
                console.error('Project load error:', request.error);
                reject(request.error);
            };
        });
    }
    
    // 全プロジェクト取得
    async getAllProjects() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['projects'], 'readonly');
            const store = transaction.objectStore('projects');
            const request = store.getAll();
            
            request.onsuccess = () => {
                const projects = request.result;
                // 更新日時でソート（新しい順）
                projects.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                resolve(projects);
            };
            
            request.onerror = () => {
                console.error('Get all projects error:', request.error);
                reject(request.error);
            };
        });
    }
    
    // プロジェクト削除
    async deleteProject(projectId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['projects'], 'readwrite');
            const store = transaction.objectStore('projects');
            const request = store.delete(projectId);
            
            request.onsuccess = () => {
                console.log('Project deleted:', projectId);
                if (this.currentProject && this.currentProject.id === projectId) {
                    this.currentProject = null;
                }
                resolve();
            };
            
            request.onerror = () => {
                console.error('Project delete error:', request.error);
                reject(request.error);
            };
        });
    }
    
    // オーディオファイル保存
    async saveAudioFile(fileData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['audioFiles'], 'readwrite');
            const store = transaction.objectStore('audioFiles');
            const request = store.put(fileData);
            
            request.onsuccess = () => {
                console.log('Audio file saved:', fileData.id);
                resolve(fileData);
            };
            
            request.onerror = () => {
                console.error('Audio file save error:', request.error);
                reject(request.error);
            };
        });
    }
    
    // オーディオファイル取得
    async getAudioFile(fileId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['audioFiles'], 'readonly');
            const store = transaction.objectStore('audioFiles');
            const request = store.get(fileId);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                console.error('Audio file get error:', request.error);
                reject(request.error);
            };
        });
    }
    
    // カテゴリ別オーディオファイル取得
    async getAudioFilesByCategory(category) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['audioFiles'], 'readonly');
            const store = transaction.objectStore('audioFiles');
            const index = store.index('category');
            const request = index.getAll(category);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                console.error('Get audio files by category error:', request.error);
                reject(request.error);
            };
        });
    }
    
    // 全オーディオファイル取得
    async getAllAudioFiles() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['audioFiles'], 'readonly');
            const store = transaction.objectStore('audioFiles');
            const request = store.getAll();
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                console.error('Get all audio files error:', request.error);
                reject(request.error);
            };
        });
    }
    
    // オーディオファイル削除
    async deleteAudioFile(fileId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['audioFiles'], 'readwrite');
            const store = transaction.objectStore('audioFiles');
            const request = store.delete(fileId);
            
            request.onsuccess = () => {
                console.log('Audio file deleted:', fileId);
                resolve();
            };
            
            request.onerror = () => {
                console.error('Audio file delete error:', request.error);
                reject(request.error);
            };
        });
    }
    
    // プロジェクトをJSON形式でダウンロード
    downloadProjectAsJSON(project = null) {
        const proj = project || this.currentProject;
        if (!proj) {
            alert('ダウンロードするプロジェクトがありません');
            return;
        }
        
        const jsonData = JSON.stringify(proj, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${proj.name}_${new Date().toISOString().split('T')[0]}.vddaw`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // JSONファイルからプロジェクトをインポート
    async importProjectFromJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const projectData = JSON.parse(e.target.result);
                    
                    // 新しいIDを割り当てるため、既存IDを削除
                    delete projectData.id;
                    projectData.name = `${projectData.name} (インポート)`;
                    projectData.updatedAt = new Date().toISOString();
                    
                    await this.saveProject(projectData);
                    resolve(projectData);
                } catch (error) {
                    console.error('Import project error:', error);
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(reader.error);
            };
            
            reader.readAsText(file);
        });
    }
    
    // 現在のプロジェクトを取得
    getCurrentProject() {
        return this.currentProject;
    }
    
    // プロジェクト名を更新
    updateProjectName(name) {
        if (this.currentProject) {
            this.currentProject.name = name;
            this.currentProject.updatedAt = new Date().toISOString();
        }
    }
}

// グローバルインスタンス
window.projectManager = new ProjectManager();
