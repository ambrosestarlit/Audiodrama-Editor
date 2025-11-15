// ==========================================
// ProjectManager - プロジェクト管理クラス（簡易版）
// ==========================================

class ProjectManager {
    constructor() {
        this.currentProject = null;
    }
    
    // 新規プロジェクト作成
    createNewProject(name = '新規プロジェクト') {
        this.currentProject = {
            name: name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            sampleRate: 48000,
            bitDepth: 24,
            tracks: [],
            audioFiles: [],
            keyframes: {}
        };
        
        return this.currentProject;
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
    
    // ==========================================
    // 互換性維持用のダミー関数
    // (IndexedDBを使わないため、何もしない)
    // ==========================================
    
    async saveAudioFile(fileData) {
        // IndexedDBを使わないため、何もしない
        // fileManager.jsとの互換性維持のため空関数として残す
        console.log('saveAudioFile called (no-op):', fileData.id);
        return Promise.resolve(fileData);
    }
    
    async getAudioFile(fileId) {
        console.log('getAudioFile called (no-op):', fileId);
        return Promise.resolve(null);
    }
    
    async getAudioFilesByCategory(category) {
        console.log('getAudioFilesByCategory called (no-op):', category);
        return Promise.resolve([]);
    }
    
    async getAllAudioFiles() {
        console.log('getAllAudioFiles called (no-op)');
        return Promise.resolve([]);
    }
    
    async deleteAudioFile(fileId) {
        console.log('deleteAudioFile called (no-op):', fileId);
        return Promise.resolve();
    }
    
    downloadProjectAsJSON(project = null) {
        const proj = project || this.currentProject;
        if (!proj) {
            alert('ダウンロードするプロジェクトがありません');
            return;
        }
        
        // キーフレームデータを含める
        if (window.keyframeManager) {
            proj.keyframes = window.keyframeManager.serialize();
        }
        
        const jsonData = JSON.stringify(proj, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${proj.name}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// グローバルインスタンス
window.projectManager = new ProjectManager();
