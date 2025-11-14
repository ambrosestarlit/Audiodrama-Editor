// ==========================================
// HistoryManager - 履歴管理クラス
// ==========================================

class HistoryManager {
    constructor() {
        this.history = [];
        this.currentIndex = -1;
        this.maxHistory = 50; // 最大50回まで
    }
    
    // アクションを記録
    pushAction(action) {
        // 現在の位置より後の履歴を削除
        this.history = this.history.slice(0, this.currentIndex + 1);
        
        // 新しいアクションを追加
        this.history.push(action);
        this.currentIndex++;
        
        // 最大履歴数を超えたら古いものを削除
        if (this.history.length > this.maxHistory) {
            this.history.shift();
            this.currentIndex--;
        }
        
        this.updateButtons();
    }
    
    // アンドゥ
    undo() {
        if (!this.canUndo()) return;
        
        const action = this.history[this.currentIndex];
        if (action && action.undo) {
            action.undo();
            this.currentIndex--;
            this.updateButtons();
        }
    }
    
    // リドゥ
    redo() {
        if (!this.canRedo()) return;
        
        this.currentIndex++;
        const action = this.history[this.currentIndex];
        if (action && action.redo) {
            action.redo();
            this.updateButtons();
        }
    }
    
    // アンドゥ可能か
    canUndo() {
        return this.currentIndex >= 0;
    }
    
    // リドゥ可能か
    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }
    
    // ボタンの状態を更新
    updateButtons() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        
        if (undoBtn) {
            undoBtn.disabled = !this.canUndo();
        }
        
        if (redoBtn) {
            redoBtn.disabled = !this.canRedo();
        }
    }
    
    // 履歴をクリア
    clear() {
        this.history = [];
        this.currentIndex = -1;
        this.updateButtons();
    }
}

// グローバルインスタンス
window.historyManager = new HistoryManager();
