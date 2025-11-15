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
            audioFiles: []
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
}

// グローバルインスタンス
window.projectManager = new ProjectManager();
