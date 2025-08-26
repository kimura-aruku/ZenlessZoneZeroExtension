// 設定定数モジュール
window.Config = (() => {
    'use strict';

    // CSS クラス名・ID定数
    const CSS_CLASSES = Object.freeze({
        // 拡張機能独自のクラス名
        MY_CLASS: 'alk-element',
        MY_OVERLAY_ID: 'alk-overlay',
        MY_CHECK_BOX_CLASS: 'alk-check-box',
        MY_CHECK_BOX_CONTAINER_CLASS: 'alk-check-box-container',
        
        // 既存ページのセレクター
        LANG_SELECTOR: '.mhy-hoyolab-lang-selector__current-lang',
        EQUIPMENT_INFO: '.equipment-info',
        SKILL_INFO_UL: '.skill-info ul',
        SKILL_ITEM: '.skill-item',
        NICKNAME: '.nickname',
        PROPERTY_INFO: '.property-info',
        BASE_ADD_PROP: '.base-add-prop',
        ROLE_DETAIL_CONTAINER: '.role-detail-container',
        
        // ポップアップ関連
        ROLE_DETAIL_POPUP: '.role-detail-popup.equip-popup',
        POPUP_CONTENT: '.popup-content',
        POPUP_CONTENT_IMG: '.popup-content img',
        POPUP_CONTENT_P: '.popup-content p',
        BASE_ATTRS_SPAN: '.base-attrs span',
        UPPER_ATTRS_DIV: '.upper-attrs div',
        CLOSE_ICON: '.close-icon',
        
        // 装備状態判定用
        EQUIP_INFO: '.equip-info',
        BG: '.bg',
        EMPTY_CONTENT: '.empty-content',
        ROLE_AVATAR_CONTAINER_IMG: '.role-avatar-container img'
    });

    // 数値定数
    const NUMERIC_CONSTANTS = Object.freeze({
        // タイムアウト値 (ミリ秒)
        ELEMENT_WAIT_TIMEOUT: 10000,
        
        // スコア計算用係数
        SCORE_COEFFICIENTS: {
            // パーセント値用の係数
            HP_ATK_MULTIPLIER: 1.6,
            HP_ATK_HIT_DIVISOR: 3.0,
            CRIT_DMG_DEF_MULTIPLIER: 1.0,
            CRIT_DMG_DEF_HIT_DIVISOR: 4.8,
            CRIT_RATE_MULTIPLIER: 2.0,
            CRIT_RATE_HIT_DIVISOR: 2.4,
            ANOMALY_PROFICIENCY_MULTIPLIER: 48.0 / 92.0,
            ANOMALY_PROFICIENCY_HIT_DIVISOR: 9.0,
            
            // 実数値用の基本値（1回あたりの強化値）
            HP_BASE_VALUE: 112.0,
            ATK_BASE_VALUE: 19.0,
            DEF_BASE_VALUE: 15.0,
            PENETRATION_BASE_VALUE: 9.0
        },
        
        // スタイル用数値
        DRIVER_IMAGE_WIDTH_RATIO: 0.15,
        DRIVER_NAME_MAX_LENGTH: 9,
        DRIVER_NAME_TRUNCATE_START: 4,
        DRIVER_NAME_TRUNCATE_END: 3,
        MAIN_PROP_NAME_MAX_LENGTH: 9,
        MAIN_PROP_NAME_TRUNCATE_LENGTH: 8,
        HIT_COUNT_BACKGROUND_ALPHA: 0.16,
        
        // スコア計算の精度調整
        SCORE_DECIMAL_MULTIPLIER: 100,
        SCORE_DECIMAL_DIVISOR: 0.01,
        HIT_COUNT_ADJUSTMENT: 1
    });

    // 文字列定数
    const STRING_CONSTANTS = Object.freeze({
        // 言語判定用
        LANGUAGE_EN: 'EN',
        LANGUAGE_JP: 'JP',
        
        // エラーメッセージ
        ERROR_ELEMENT_NOT_FOUND: '終了条件を満たしました',
        ERROR_TIMEOUT_PREFIX: 'Timeout: 要素',
        ERROR_TIMEOUT_SUFFIX: 'が見つかりませんでした',
        ERROR_STORAGE_GET: '取得エラー:',
        ERROR_STORAGE_SET: '保存エラー:',
        
        // ログメッセージ
        LOG_DATA_SAVED: 'のデータを保存しました',
        LOG_TEMPLATES_LOADED: 'Templates loaded successfully',
        LOG_TEMPLATES_ERROR: 'Failed to load templates:',
        
        // HTML属性値
        ATTR_DATA_CHECKED: 'data-checked',
        ATTR_TRUE: 'true',
        ATTR_SRC: 'src',
        ATTR_STYLE: 'style'
    });

    // CSS プロパティ定数
    const CSS_PROPERTIES = Object.freeze({
        // スタイルキャッシュ用プロパティ群
        TITLE_STYLE_PROPERTIES: [
            'font-size', 'text-align', 'font-family', 'color', 'font-weight'
        ],
        ITEM_STYLE_PROPERTIES: [
            'font-size', 'font-family', 'color', 'font-weight'
        ],
        CAPTION_STYLE_PROPERTIES: [
            'font-size', 'text-align', 'font-family', 'color', 'font-weight'
        ],
        ITEM_SHAPE_STYLE_PROPERTIES: [
            'border', 'background', 'border-radius', 'padding'
        ],
        NICKNAME_STYLE_PROPERTIES: [ // ニックネーム（合計スコア）用のスタイルプロパティ
            'font-family'
        ],
        
    });

    // MutationObserver オプション
    const OBSERVER_OPTIONS = Object.freeze({
        DEFAULT: { childList: true, subtree: true, attributes: true },
        STYLE_ONLY: {
            childList: false,
            attributes: true,
            subtree: false,
            characterData: false,
            characterDataOldValue: false,
            attributeOldValue: false,
            attributeFilter: ['style']
        }
    });

    // テンプレートID定数
    const TEMPLATE_IDS = Object.freeze({
        DRIVER_CONTAINER: 'driver-container-template',
        CHECKBOX_CONTAINER: 'checkbox-container-template',
        OVERLAY: 'overlay-template'
    });

    // スタイルタイプ定数
    const STYLE_TYPES = Object.freeze({
        TITLE: 'title',
        ITEM: 'item',
        CAPTION: 'caption',
        ITEM_SHAPE: 'itemShape',
        NICKNAME: 'nickname'
    });

    // チェックボックスID生成用
    const CHECKBOX_ID_PREFIX = 'checkbox';

    // 正規表現パターン
    const REGEX_PATTERNS = Object.freeze({
        PERCENTAGE: /[%]/g,
        RGBA_COLOR: /rgba?\((\d+), (\d+), (\d+)(?:, (\d+(?:\.\d+)?))?\)/,
        BACKGROUND_STYLE: /background:[^;]+/
    });

    // デフォルト値
    const DEFAULTS = Object.freeze({
        EMPTY_DISPLAY: '-',
        BORDER_WIDTH_MULTIPLIER: 2.0,
        AUTO_SIZE: 'auto'
    });

    // スタイル関連定数
    const STYLE_CONSTANTS = Object.freeze({
        // drawScore内のスタイルプロパティ配列
        PARENT_STYLE_PROPERTIES: [ // 親コンテナ（ul要素）用のスタイルプロパティ
            'height', 'padding', 'border', 'margin', 'box-sizing', 
            'align-items', 'color', 'display', 'gap', 'justify-content'
        ],
        CHILD_STYLE_PROPERTIES: [ // 子要素（li要素）用のスタイルプロパティ
            'height', 'width', 'padding', 'margin', 'box-sizing', 'color',
            'display', 'border', 'border-radius', 'border-width', 'background'
        ],
        CONTENT_STYLE_PROPERTIES: [ // コンテンツ要素（ドライバ情報表示div）用のスタイルプロパティ
            'background', 'border', 'margin', 'border-radius', 'height', 'width'
        ],
        
        // スタイル値
        PADDING_BOTTOM: '16px', // 下部パディング値
        
        // スタイルキーワード
        BORDER_KEYWORD: 'border', // ボーダー関連プロパティ判定用キーワード
        WIDTH_KEYWORD: 'width' // 幅関連プロパティ判定用キーワード
    });

    // プロパティ名翻訳
    const PROP_NAME = Object.freeze({
        JP: {
            HP: 'HP',
            ATK: '攻撃力',
            DEF: '防御力',
            CRIT_RATE: '会心率',
            CRIT_DMG: '会心ダメージ',
            ANOMALY_PROFICIENCY: '異常マスタリー'
        },
        EN: {
            HP: 'HP',
            ATK: 'ATK',
            DEF: 'DEF',
            CRIT_RATE: 'CRIT Rate',
            CRIT_DMG: 'CRIT DMG',
            ANOMALY_PROFICIENCY: 'Anomaly Proficiency'
        }
    });

    // UI文字列翻訳
    const UI_TRANSLATIONS = Object.freeze({
        JP: {
            SCORE: 'スコア',
            TOTAL_SCORE: '合計スコア',
            PENETRATION: '貫通値'
        },
        EN: {
            SCORE: 'Score',
            TOTAL_SCORE: 'Total Score', 
            PENETRATION: 'PEN Ratio'
        }
    });

    // 公開API
    return {
        CSS_CLASSES,
        NUMERIC_CONSTANTS,
        STRING_CONSTANTS,
        CSS_PROPERTIES,
        OBSERVER_OPTIONS,
        TEMPLATE_IDS,
        STYLE_TYPES,
        CHECKBOX_ID_PREFIX,
        REGEX_PATTERNS,
        DEFAULTS,
        STYLE_CONSTANTS,
        PROP_NAME,
        UI_TRANSLATIONS
    };
})();