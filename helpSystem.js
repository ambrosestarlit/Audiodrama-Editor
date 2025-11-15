/**
 * helpSystem.js - Sound Bearヘルプシステム
 */

class HelpSystem {
    constructor() {
        this.helpOverlay = null;
        this.helpBtn = null;
        this.currentTab = 'basic';
        this.dontShowAgain = false;
        
        this.init();
    }
    
    init() {
        // DOMの読み込み完了を待つ
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }
    
    setup() {
        // 要素の取得
        this.helpOverlay = document.getElementById('helpModal');
        this.helpBtn = document.getElementById('helpBtn');
        
        if (!this.helpOverlay || !this.helpBtn) {
            console.warn('Help system elements not found');
            return;
        }
        
        // イベントリスナーの設定
        this.setupEventListeners();
        
        // 初回表示の設定を読み込み
        this.loadSettings();
    }
    
    setupEventListeners() {
        // ヘルプボタン
        this.helpBtn.addEventListener('click', () => this.show());
        
        // 閉じるボタン（ヘッダー）
        const closeBtn = document.getElementById('closeHelpModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }
        
        // 閉じるボタン（フッター）
        const closeFooterBtn = document.getElementById('closeHelpFooterBtn');
        if (closeFooterBtn) {
            closeFooterBtn.addEventListener('click', () => this.hide());
        }
        
        // タブ切り替え
        const helpTabs = this.helpOverlay.querySelectorAll('.help-tab-btn');
        helpTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.helpTab;
                if (tabName) {
                    this.switchTab(tabName);
                }
            });
        });
        
        // オーバーレイの外側をクリックで閉じる
        this.helpOverlay.addEventListener('click', (e) => {
            if (e.target === this.helpOverlay) {
                this.hide();
            }
        });
        
        // 「次回から表示しない」チェックボックス
        const dontShowCheckbox = document.getElementById('dontShowHelpAgain');
        if (dontShowCheckbox) {
            dontShowCheckbox.addEventListener('change', (e) => {
                this.dontShowAgain = e.target.checked;
                this.saveSettings();
            });
        }
        
        // ESCキーで閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.helpOverlay.classList.contains('active')) {
                this.hide();
            }
        });
    }
    
    show() {
        if (!this.helpOverlay) return;
        
        this.helpOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // スクロール防止
        
        // 初回表示時は基本タブを表示
        if (!this.currentTab) {
            this.switchTab('basic');
        }
    }
    
    hide() {
        if (!this.helpOverlay) return;
        
        this.helpOverlay.classList.remove('active');
        document.body.style.overflow = ''; // スクロール復元
    }
    
    switchTab(tabName) {
        if (!this.helpOverlay) return;
        
        this.currentTab = tabName;
        
        // タブボタンのアクティブ状態を更新
        const helpTabs = this.helpOverlay.querySelectorAll('.help-tab-btn');
        helpTabs.forEach(tab => {
            if (tab.dataset.helpTab === tabName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // コンテンツの表示切り替え
        const helpContents = this.helpOverlay.querySelectorAll('.help-content');
        helpContents.forEach(content => {
            if (content.dataset.helpContent === tabName) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
    }
    
    loadSettings() {
        try {
            const settings = localStorage.getItem('soundbear_help_settings');
            if (settings) {
                const data = JSON.parse(settings);
                this.dontShowAgain = data.dontShowAgain || false;
                
                const checkbox = document.getElementById('dontShowHelpAgain');
                if (checkbox) {
                    checkbox.checked = this.dontShowAgain;
                }
            }
        } catch (error) {
            console.error('Failed to load help settings:', error);
        }
    }
    
    saveSettings() {
        try {
            const settings = {
                dontShowAgain: this.dontShowAgain
            };
            localStorage.setItem('soundbear_help_settings', JSON.stringify(settings));
        } catch (error) {
            console.error('Failed to save help settings:', error);
        }
    }
    
    shouldShowOnStartup() {
        return !this.dontShowAgain;
    }
    
    showOnStartup() {
        if (this.shouldShowOnStartup()) {
            // 少し遅延させて表示（アプリの初期化が完了してから）
            setTimeout(() => this.show(), 1000);
        }
    }
}

// グローバルインスタンスを作成
let helpSystem;

// DOMContentLoaded後に初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        helpSystem = new HelpSystem();
    });
} else {
    helpSystem = new HelpSystem();
}
