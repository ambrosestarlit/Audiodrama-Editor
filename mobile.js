/**
 * Sound Bear - スマホUI制御
 */

class MobileUI {
    constructor() {
        this.isMobile = window.innerWidth <= 768;
        this.menuOpen = false;
        this.init();
    }
    
    init() {
        if (!this.isMobile) return;
        
        this.setupHamburgerMenu();
        this.setupFileListToggle();
        this.setupTrackVolumeSliders();
        this.setupTouchEnhancements();
        this.setupOrientationChange();
        
        console.log('📱 Mobile UI initialized');
    }
    
    /**
     * ハンバーガーメニューのセットアップ
     */
    setupHamburgerMenu() {
        // ハンバーガーボタンを作成
        const headerControls = document.querySelector('.header-controls');
        if (!headerControls) return;
        
        // 既存のボタンを非表示にしてハンバーガーメニューに移動
        const existingButtons = headerControls.querySelectorAll('.btn:not(.hamburger-menu)');
        
        // ハンバーガーボタンを追加
        const hamburgerBtn = document.createElement('button');
        hamburgerBtn.className = 'hamburger-menu';
        hamburgerBtn.innerHTML = '☰';
        hamburgerBtn.setAttribute('aria-label', 'メニューを開く');
        headerControls.appendChild(hamburgerBtn);
        
        // メニューオーバーレイを作成
        const overlay = document.createElement('div');
        overlay.className = 'menu-overlay';
        document.body.appendChild(overlay);
        
        // メニューパネルを作成
        const menuPanel = document.createElement('div');
        menuPanel.className = 'menu-panel';
        document.body.appendChild(menuPanel);
        
        // メニュー項目を追加
        const menuItems = [
            { text: '🆕 新規プロジェクト', id: 'newProjectBtn' },
            { text: '💾 保存', id: 'saveProjectBtn' },
            { text: '📂 読込', id: 'loadProjectBtn' },
            { text: '📤 書き出し', id: 'exportBtn' },
            { text: '↶ 元に戻す', id: 'undoBtn' },
            { text: '↷ やり直す', id: 'redoBtn' }
        ];
        
        menuItems.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.className = 'menu-item';
            menuItem.textContent = item.text;
            menuItem.dataset.action = item.id;
            
            // 対応するボタンの有効/無効状態を反映
            const originalBtn = document.getElementById(item.id);
            if (originalBtn && originalBtn.disabled) {
                menuItem.style.opacity = '0.5';
                menuItem.style.pointerEvents = 'none';
            }
            
            menuItem.addEventListener('click', () => {
                const btn = document.getElementById(item.id);
                if (btn) {
                    btn.click();
                    this.closeMenu(overlay, menuPanel);
                }
            });
            
            menuPanel.appendChild(menuItem);
        });
        
        // ハンバーガーボタンのクリックイベント
        hamburgerBtn.addEventListener('click', () => {
            if (this.menuOpen) {
                this.closeMenu(overlay, menuPanel);
            } else {
                this.openMenu(overlay, menuPanel);
            }
        });
        
        // オーバーレイクリックで閉じる
        overlay.addEventListener('click', () => {
            this.closeMenu(overlay, menuPanel);
        });
        
        // メニュー項目の状態を監視
        const observer = new MutationObserver(() => {
            this.updateMenuItems(menuPanel);
        });
        
        // undoBtn と redoBtn の状態変化を監視
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        if (undoBtn) observer.observe(undoBtn, { attributes: true });
        if (redoBtn) observer.observe(redoBtn, { attributes: true });
    }
    
    openMenu(overlay, menuPanel) {
        this.menuOpen = true;
        overlay.classList.add('active');
        menuPanel.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    closeMenu(overlay, menuPanel) {
        this.menuOpen = false;
        overlay.classList.remove('active');
        menuPanel.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    updateMenuItems(menuPanel) {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        
        const undoMenuItem = menuPanel.querySelector('[data-action="undoBtn"]');
        const redoMenuItem = menuPanel.querySelector('[data-action="redoBtn"]');
        
        if (undoMenuItem && undoBtn) {
            undoMenuItem.style.opacity = undoBtn.disabled ? '0.5' : '1';
            undoMenuItem.style.pointerEvents = undoBtn.disabled ? 'none' : 'auto';
        }
        
        if (redoMenuItem && redoBtn) {
            redoMenuItem.style.opacity = redoBtn.disabled ? '0.5' : '1';
            redoMenuItem.style.pointerEvents = redoBtn.disabled ? 'none' : 'auto';
        }
    }
    
    /**
     * ファイルリスト表示切り替え
     */
    setupFileListToggle() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;
        
        // サイドバーヘッダーを再構成
        const sidebarHeader = sidebar.querySelector('.sidebar-header');
        if (sidebarHeader) {
            sidebarHeader.innerHTML = `
                <img src="gorone-bear.png" alt="🐻" class="sidebar-bear">
                <div class="sidebar-header-buttons">
                    <button class="btn btn-primary btn-icon" id="deleteFilesBtn" title="選択したファイルを削除">-</button>
                    <button class="btn btn-primary btn-icon" id="importFilesBtn">+</button>
                </div>
            `;
        }
    }
    
    /**
     * トラックボリュームスライダーのセットアップ
     */
    setupTrackVolumeSliders() {
        // トラックが追加されたときに呼ばれる関数を上書き
        const originalAddTrack = window.addTrack;
        if (!originalAddTrack) return;
        
        window.addTrack = function(trackData) {
            const track = originalAddTrack.call(this, trackData);
            if (!track) return track;
            
            // モバイル用のボリュームスライダーを追加
            if (window.innerWidth <= 768) {
                mobileUI.addVolumeSliderToTrack(track);
            }
            
            return track;
        };
    }
    
    addVolumeSliderToTrack(trackElement) {
        const trackHeader = trackElement.querySelector('.track-header');
        if (!trackHeader) return;
        
        // ボリューム行が既に存在する場合はスキップ
        if (trackHeader.querySelector('.track-volume-row')) return;
        
        const trackId = trackElement.dataset.trackId;
        const currentVolume = 100; // デフォルト値
        
        // ボリューム行を作成(横並びで追加)
        const volumeRow = document.createElement('div');
        volumeRow.className = 'track-volume-row';
        volumeRow.innerHTML = `
            <div class="volume-slider-container">
                <input type="range" 
                    class="track-volume-slider" 
                    min="0" 
                    max="100" 
                    value="${currentVolume}" 
                    data-track-id="${trackId}">
                <span class="track-volume-value">${currentVolume}</span>
            </div>
        `;
        
        // ヘッダーの最後に追加(横並び)
        trackHeader.appendChild(volumeRow);
        
        // スライダーのイベントリスナー
        const slider = volumeRow.querySelector('.track-volume-slider');
        const valueDisplay = volumeRow.querySelector('.track-volume-value');
        
        slider.addEventListener('input', (e) => {
            const value = e.target.value;
            valueDisplay.textContent = value;
            
            // トラックのボリュームを更新
            if (window.updateTrackVolume) {
                window.updateTrackVolume(trackId, value / 100);
            } else if (window.trackManager) {
                // trackManagerから直接更新
                const track = window.trackManager.getTrack(trackId);
                if (track) {
                    track.volume = value / 100;
                    window.audioEngine.setTrackVolume(trackId, track.volume);
                    
                    // 既存のボリュームスライダーも更新
                    const pcSlider = document.querySelector(`.volume-slider[data-track-id="${trackId}"]`);
                    if (pcSlider) {
                        pcSlider.value = track.volume;
                    }
                    
                    // クリップ波形を更新
                    track.clips.forEach(clip => {
                        window.trackManager.drawClipWaveform(trackId, clip.id);
                    });
                }
            }
        });
    }
    
    /**
     * タッチ操作の強化
     */
    setupTouchEnhancements() {
        // タッチスクロールの改善
        const scrollContainers = document.querySelectorAll(
            '.file-list-container, .tracks-container, .timeline-area'
        );
        
        scrollContainers.forEach(container => {
            container.style.webkitOverflowScrolling = 'touch';
            container.style.overscrollBehavior = 'contain';
        });
        
        // ドラッグ&ドロップのタッチ対応
        this.setupTouchDragAndDrop();
    }
    
    setupTouchDragAndDrop() {
        let draggedElement = null;
        let touchStartX = 0;
        let touchStartY = 0;
        
        document.addEventListener('touchstart', (e) => {
            const fileItem = e.target.closest('.file-item');
            if (fileItem) {
                draggedElement = fileItem;
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                
                // ドラッグ中のスタイル
                fileItem.style.opacity = '0.7';
                fileItem.style.transform = 'scale(1.05)';
            }
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            if (!draggedElement) return;
            
            const touch = e.touches[0];
            const deltaX = touch.clientX - touchStartX;
            const deltaY = touch.clientY - touchStartY;
            
            // 視覚的フィードバック
            if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
                draggedElement.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.05)`;
            }
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            if (!draggedElement) return;
            
            // ドラッグ終了時の処理
            const touch = e.changedTouches[0];
            const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
            
            if (dropTarget) {
                const trackContent = dropTarget.closest('.track-content');
                if (trackContent && window.handleFileDrop) {
                    // ファイルドロップ処理を呼び出し
                    const fileData = {
                        name: draggedElement.querySelector('.file-item-name').textContent,
                        category: draggedElement.closest('.file-list').id.replace('-list', '')
                    };
                    
                    const rect = trackContent.getBoundingClientRect();
                    const position = (touch.clientX - rect.left) / rect.width;
                    
                    window.handleFileDrop(trackContent, fileData, position);
                }
            }
            
            // スタイルをリセット
            draggedElement.style.opacity = '';
            draggedElement.style.transform = '';
            draggedElement = null;
        });
    }
    
    /**
     * 画面回転対応
     */
    setupOrientationChange() {
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.isMobile = window.innerWidth <= 768;
                
                // 横向きの場合の調整
                if (window.orientation === 90 || window.orientation === -90) {
                    document.body.classList.add('landscape');
                } else {
                    document.body.classList.remove('landscape');
                }
            }, 100);
        });
    }
    
    /**
     * トラックにボリュームスライダーを一括追加
     */
    addVolumeSlidersToAllTracks() {
        if (window.innerWidth > 768) return;
        
        const tracks = document.querySelectorAll('.track');
        tracks.forEach(track => {
            this.addVolumeSliderToTrack(track);
        });
    }
    
    /**
     * トラックコントロールの再配置
     */
    repositionTrackControls() {
        if (window.innerWidth > 768) return;
        
        const tracks = document.querySelectorAll('.track');
        tracks.forEach(track => {
            const header = track.querySelector('.track-header');
            if (!header) return;
            
            // 削除ボタンをコントロールエリアに移動
            const deleteBtn = track.querySelector('.track-delete-btn');
            const controls = header.querySelector('.track-controls');
            
            if (deleteBtn && controls && !controls.contains(deleteBtn)) {
                controls.appendChild(deleteBtn);
            }
        });
    }
}

// モバイルUIのインスタンスを作成
let mobileUI;

// DOM読み込み完了後に初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        mobileUI = new MobileUI();
    });
} else {
    mobileUI = new MobileUI();
}

// リサイズ時に再初期化
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        const wasMobile = mobileUI.isMobile;
        const isNowMobile = window.innerWidth <= 768;
        
        if (wasMobile !== isNowMobile) {
            location.reload(); // レイアウトが大きく変わるのでリロード
        }
    }, 250);
});
