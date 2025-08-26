// スタイル管理モジュール
window.StyleManager = (() => {
    'use strict';

    // 設定定数を参照
    const { CSS_PROPERTIES, STYLE_TYPES } = Config;

    // スタイルオブジェクトキャッシュ
    /** @type {{ [key: string]: { [key: string]: string } }} */
    const styleObjectCache = {
        title: {},
        item: {},
        caption: {},
        itemShape: {},
        nickname: {}
    };

    // 色情報キャッシュ
    /** @type {{ activeItem: string, headerBackground: string }} */
    const colorCache = {
        activeItem: '',
        headerBackground: ''
    };

    /**
     * オリジナルのスタイル取得
     * @param {HTMLElement} targetElement - 対象要素
     * @param {string[]} allowedProperties - 取得するプロパティリスト
     * @returns {Object} スタイルオブジェクト
     */
    function getOriginalStyleObject(targetElement, allowedProperties) {
        const targetElementStyle = window.getComputedStyle(targetElement);
        const tempObject = {};
        for (let style of allowedProperties) {
            tempObject[style] = targetElementStyle.getPropertyValue(style);
        }
        return tempObject;
    }

    /**
     * 統合されたスタイルキャッシュ関数
     * @param {string} styleType - スタイルタイプ ('title', 'item', 'caption', 'itemShape')
     * @param {HTMLElement} targetElement - 対象要素
     * @param {string[]} allowedProperties - 取得するプロパティリスト
     */
    function cacheStyleObject(styleType, targetElement, allowedProperties) {
        // キャッシュ済みの場合はスキップ
        if (Object.keys(styleObjectCache[styleType]).length > 0) {
            return;
        }
        styleObjectCache[styleType] = getOriginalStyleObject(targetElement, allowedProperties);
    }

    /**
     * 統合されたスタイル適用関数
     * @param {HTMLElement} element - 対象要素
     * @param {string} styleType - スタイルタイプ ('title', 'item', 'caption', 'itemShape')
     */
    function applyOriginalStyle(element, styleType) {
        Object.assign(element.style, styleObjectCache[styleType]);
    }

    /**
     * 指定されたスタイルタイプに応じてスタイルをキャッシュ
     * @param {string} styleType - スタイルタイプ (STYLE_TYPES の値)
     * @param {HTMLElement} targetElement - 対象要素
     */
    function cacheStyle(styleType, targetElement) {
        const propertyMap = {
            [STYLE_TYPES.TITLE]: CSS_PROPERTIES.TITLE_STYLE_PROPERTIES,
            [STYLE_TYPES.ITEM]: CSS_PROPERTIES.ITEM_STYLE_PROPERTIES,
            [STYLE_TYPES.CAPTION]: CSS_PROPERTIES.CAPTION_STYLE_PROPERTIES,
            [STYLE_TYPES.ITEM_SHAPE]: CSS_PROPERTIES.ITEM_SHAPE_STYLE_PROPERTIES,
            [STYLE_TYPES.NICKNAME]: CSS_PROPERTIES.NICKNAME_STYLE_PROPERTIES
        };
        
        const properties = propertyMap[styleType];
        if (!properties) {
            console.error(`[ZZZ-Score] Unknown style type: ${styleType}`);
            return;
        }
        
        cacheStyleObject(styleType, targetElement, properties);
    }

    /**
     * 色情報を抽出してキャッシュ
     * @param {string} cssClasses - CSSクラス定数オブジェクト
     */
    function cacheColors(cssClasses) {
        // キャッシュ済みの場合はスキップ
        if (colorCache.activeItem && colorCache.headerBackground) {
            return;
        }

        try {
            // 強調色（activeItemColor）
            const propertyInfoElement = document.querySelector(cssClasses.PROPERTY_INFO);
            if (propertyInfoElement) {
                const baseAddPropElement = propertyInfoElement.querySelector(cssClasses.BASE_ADD_PROP);
                const spanElements = baseAddPropElement?.querySelectorAll('span');
                if (spanElements && spanElements[1]) {
                    colorCache.activeItem = getComputedStyle(spanElements[1]).color;
                }
            }

            // ヘッダ背景色（headerBackgroundColor）
            const headerElement = document.querySelector(`${cssClasses.EQUIPMENT_INFO} h2`);
            if (headerElement) {
                colorCache.headerBackground = getComputedStyle(headerElement).backgroundColor;
            }
        } catch (error) {
            console.error('[ZZZ-Score] Failed to cache colors:', error);
        }
    }

    /**
     * キャッシュされた色情報を取得
     * @returns {{ activeItem: string, headerBackground: string }}
     */
    function getColors() {
        return { ...colorCache };
    }

    // 公開API
    return {
        cacheStyleObject,
        applyOriginalStyle,
        cacheStyle,
        cacheColors,
        getColors,
        getStyleCache: () => ({
            title: { ...styleObjectCache.title },
            item: { ...styleObjectCache.item },
            caption: { ...styleObjectCache.caption },
            itemShape: { ...styleObjectCache.itemShape },
            nickname: { ...styleObjectCache.nickname }
        })
    };
})();