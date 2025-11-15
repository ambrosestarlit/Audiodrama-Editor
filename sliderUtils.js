// ==========================================
// スライダーユーティリティ - くまさんつまみ対応
// ==========================================

// スライダーの進捗バーの色を更新
function updateSliderProgress(slider) {
    const min = parseFloat(slider.min) || 0;
    const max = parseFloat(slider.max) || 100;
    const value = parseFloat(slider.value) || 0;
    
    // パーセンテージを計算
    const percentage = ((value - min) / (max - min)) * 100;
    
    // グラデーションで進捗を表示
    slider.style.background = `linear-gradient(to right, 
        var(--color-accent) 0%, 
        var(--color-accent) ${percentage}%, 
        var(--color-border-medium) ${percentage}%, 
        var(--color-border-medium) 100%)`;
}

// すべてのスライダーに進捗バー更新を適用
function initializeAllSliders() {
    const sliders = document.querySelectorAll('input[type="range"]');
    
    sliders.forEach(slider => {
        // 初期状態を設定
        updateSliderProgress(slider);
        
        // input イベントで更新
        slider.addEventListener('input', () => {
            updateSliderProgress(slider);
        });
        
        // change イベントでも更新（互換性のため）
        slider.addEventListener('change', () => {
            updateSliderProgress(slider);
        });
    });
}

// DOMContentLoaded で初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAllSliders);
} else {
    initializeAllSliders();
}

// 動的に追加されたスライダーを監視
const sliderObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element node
                // 追加されたノードがスライダーの場合
                if (node.tagName === 'INPUT' && node.type === 'range') {
                    updateSliderProgress(node);
                    node.addEventListener('input', () => updateSliderProgress(node));
                    node.addEventListener('change', () => updateSliderProgress(node));
                }
                
                // 追加されたノードの子孫にスライダーがある場合
                const childSliders = node.querySelectorAll?.('input[type="range"]');
                childSliders?.forEach(slider => {
                    updateSliderProgress(slider);
                    slider.addEventListener('input', () => updateSliderProgress(slider));
                    slider.addEventListener('change', () => updateSliderProgress(slider));
                });
            }
        });
    });
});

// body要素を監視
if (document.body) {
    sliderObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// グローバルに公開
window.updateSliderProgress = updateSliderProgress;
window.initializeAllSliders = initializeAllSliders;
