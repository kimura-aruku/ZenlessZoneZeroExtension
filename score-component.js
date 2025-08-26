// スコアコンポーネント生成モジュール
window.ScoreComponent = (() => {
    'use strict';

    /**
     * テンプレートを取得するヘルパー関数
     * @param {string} templateId - テンプレートID
     * @returns {DocumentFragment} テンプレートのクローン
     */
    function getTemplate(templateId) {
        if (!window.TemplateLoader || !window.TemplateLoader.isLoaded()) {
            throw new Error('TemplateLoader not available or templates not loaded');
        }
        return window.TemplateLoader.getTemplate(templateId);
    }

    /**
     * ドライバ情報コンポーネントを生成
     * @param {Object} driverData - ドライバデータ
     * @param {Object} styleObjects - スタイルオブジェクト群
     * @param {Object} colors - 色情報
     * @param {Function} scoreCalculator - スコア計算関数
     * @param {Array} activeProps - 有効なプロパティリスト
     * @param {Object} translations - 翻訳データ
     * @returns {HTMLElement} 生成されたドライバコンポーネント
     */
    function createDriverComponent(driverData, styleObjects, colors, scoreCalculator, activeProps, translations) {
        const template = getTemplate('driver-container-template');
        const container = document.createElement('div');
        container.appendChild(template);

        // ヘッダー部の動的スタイル設定
        const headerElement = container.querySelector('.alk-driver-content');
        headerElement.style.backgroundColor = colors.headerBackground;

        // ドライバアイコン
        const iconElement = container.querySelector('.driver-icon');
        iconElement.src = driverData.iconSource;
        iconElement.style.width = `${driverData.imageWidth}px`;
        iconElement.style.height = `${driverData.imageWidth}px`;

        // ドライバ名
        const nameElement = container.querySelector('.driver-name');
        Object.assign(nameElement.style, styleObjects.title);
        nameElement.textContent = truncateDriverName(driverData.driverName);
        
        // 背景画像（レアリティ）
        if (driverData.driverBackgroundImage) {
            nameElement.style.backgroundImage = driverData.driverBackgroundImage;
        }

        // ドライバレベル
        const levelElement = container.querySelector('.driver-level');
        Object.assign(levelElement.style, styleObjects.caption);
        levelElement.textContent = driverData.driverLevel;

        // メインステータス
        const mainStatElement = container.querySelector('.main-stat');
        setupStatElement(mainStatElement, {
            name: truncateMainPropName(driverData.mainPropName),
            value: driverData.mainPropValue
        }, styleObjects.item, false, colors);

        // サブステータス
        let totalScore = 0;
        const subStats = driverData.subPropNameAndValues || [];
        
        for (let i = 1; i <= 4; i++) {
            const subStatElement = container.querySelector(`.sub-stat-${i}`);
            const subStat = subStats[i - 1];
            
            if (subStat) {
                const scoreData = scoreCalculator(subStat.name, subStat.value);
                totalScore += scoreData.score;
                const isActive = scoreData.score > 0;
                
                setupStatElement(subStatElement, {
                    name: subStat.name,
                    value: subStat.value,
                    hitCount: scoreData.hitCount > 0 ? scoreData.hitCount.toFixed(0) : null
                }, styleObjects.item, isActive, colors, styleObjects.caption);
            } else {
                // 空の行
                setupStatElement(subStatElement, {
                    name: '-',
                    value: '-'
                }, styleObjects.item, false, colors);
            }
        }

        // トータルスコア
        const totalScoreElement = container.querySelector('.total-score');
        totalScoreElement.style.backgroundColor = colors.headerBackground;
        
        const scoreLabelElement = container.querySelector('.score-label');
        Object.assign(scoreLabelElement.style, styleObjects.item);
        scoreLabelElement.textContent = translations.SCORE;
        
        const scoreValueElement = container.querySelector('.score-value');
        Object.assign(scoreValueElement.style, styleObjects.item);
        scoreValueElement.textContent = totalScore.toFixed(2);

        // ヘッダー部分と統計部分を分離して返す（元のコード構造に合わせる）
        const resultHeaderElement = container.querySelector('.alk-driver-content');
        const resultStatsElement = container.querySelector('.driver-stats');
        
        return { 
            element: { 
                header: resultHeaderElement, 
                stats: resultStatsElement 
            }, 
            score: totalScore 
        };
    }

    /**
     * チェックボックスコンテナを生成
     * @param {Object} translations - 翻訳データ
     * @param {Object} styleObjects - スタイルオブジェクト群
     * @param {Function} onCheckboxChange - チェックボックス変更時のコールバック
     * @returns {HTMLElement} 生成されたチェックボックスコンテナ
     */
    function createCheckboxContainer(translations, styleObjects, onCheckboxChange) {
        const template = getTemplate('checkbox-container-template');
        const container = document.createElement('div');
        container.appendChild(template);
        
        const checkboxContainer = container.firstElementChild;

        // チェックボックス要素の設定
        const propKeys = Object.keys(translations);
        propKeys.forEach((key, index) => {
            const checkbox = checkboxContainer.querySelector(`#checkbox${index}`);
            if (checkbox) {
                checkbox.textContent = translations[key];
                Object.assign(checkbox.style, styleObjects.item);
                Object.assign(checkbox.style, styleObjects.itemShape);
                
                checkbox.addEventListener('click', () => {
                    const isChecked = checkbox.dataset.checked === 'true';
                    onCheckboxChange(checkbox, !isChecked);
                });
            }
        });

        return checkboxContainer;
    }

    /**
     * 合計スコア表示を更新
     * @param {HTMLElement} container - チェックボックスコンテナ
     * @param {number} totalScore - 合計スコア
     * @param {string} totalScoreLabel - 合計スコアラベル
     * @param {Object} styleObjects - スタイルオブジェクト群
     */
    function updateTotalScore(container, totalScore, totalScoreLabel, styleObjects) {
        const labelElement = container.querySelector('.total-score-label');
        const valueElement = container.querySelector('.total-score-value');
        
        // ラベル設定
        labelElement.textContent = totalScoreLabel;
        Object.assign(labelElement.style, styleObjects.title);
        
        // 値設定
        valueElement.textContent = totalScore.toFixed(2);
        Object.assign(valueElement.style, styleObjects.title);
    }

    /**
     * オーバーレイを生成
     * @returns {HTMLElement} オーバーレイ要素
     */
    function createOverlay() {
        const template = getTemplate('overlay-template');
        const container = document.createElement('div');
        container.appendChild(template);
        return container.firstElementChild;
    }

    // ヘルパー関数
    function truncateDriverName(name) {
        return name.length >= 9 ? name.slice(0, 4) + '…' + name.slice(-3) : name;
    }

    function truncateMainPropName(name) {
        return name.length > 9 ? name.slice(0, 8) + '…' : name;
    }

    function setupStatElement(element, data, itemStyle, isActive, colors, captionStyle = null) {
        const nameElement = element.querySelector('.stat-name');
        const valueElement = element.querySelector('.stat-value');
        const hitCountElement = element.querySelector('.hit-count');

        // デバッグ用ログ
        if (!nameElement || !valueElement) {
            console.error('Elements not found:', { nameElement, valueElement, element });
        }

        // 基本スタイル適用
        Object.assign(nameElement.style, itemStyle);
        Object.assign(valueElement.style, itemStyle);
        if (hitCountElement) {
            Object.assign(hitCountElement.style, itemStyle);
        }

        // アクティブ状態に応じた色設定
        const color = isActive ? colors.activeItem : (captionStyle ? captionStyle.color : itemStyle.color);
        nameElement.style.color = color;
        valueElement.style.color = color;
        if (hitCountElement) {
            hitCountElement.style.color = color;
        }

        // 内容設定
        nameElement.textContent = data.name;
        valueElement.textContent = data.value;

        // ヒット回数表示
        if (hitCountElement && data.hitCount) {
            hitCountElement.textContent = data.hitCount;
            
            // 背景色設定
            const rgbaMatch = color.match(/rgba?\((\d+), (\d+), (\d+)(?:, (\d+(?:\.\d+)?))?\)/);
            if (rgbaMatch) {
                const [, red, green, blue] = rgbaMatch;
                hitCountElement.style.backgroundColor = `rgba(${red}, ${green}, ${blue}, 0.16)`;
            }
        } else if (hitCountElement) {
            hitCountElement.style.display = 'none';
        }
    }

    // 公開API
    return {
        createDriverComponent,
        createCheckboxContainer,
        updateTotalScore,
        createOverlay
    };
})();