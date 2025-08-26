// テンプレートローダーモジュール
window.TemplateLoader = (() => {
    'use strict';

    let templatesLoaded = false;
    let templates = {};

    /**
     * HTMLテンプレートファイルを読み込む
     * @returns {Promise<void>}
     */
    async function loadTemplates() {
        if (templatesLoaded) {
            return Promise.resolve();
        }

        try {
            // Chrome拡張機能のリソースURLを取得
            const templateUrl = chrome.runtime.getURL('templates.html');
            
            // テンプレートファイルを取得
            const response = await fetch(templateUrl);
            if (!response.ok) {
                throw new Error(`Failed to load templates: ${response.status}`);
            }

            const htmlText = await response.text();
            
            // 仮のDOMエレメントを作成してテンプレートを解析
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlText;
            
            // 各テンプレートを抽出
            const templateElements = tempDiv.querySelectorAll('template');
            templateElements.forEach(template => {
                templates[template.id] = template.content.cloneNode(true);
            });

            templatesLoaded = true;
            console.log('Templates loaded successfully:', Object.keys(templates));
        } catch (error) {
            console.error('Failed to load templates:', error);
            throw error;
        }
    }

    /**
     * 指定されたテンプレートIDのクローンを取得
     * @param {string} templateId - テンプレートID
     * @returns {DocumentFragment} テンプレートのクローン
     */
    function getTemplate(templateId) {
        if (!templatesLoaded) {
            throw new Error('Templates not loaded. Call loadTemplates() first.');
        }

        const template = templates[templateId];
        if (!template) {
            throw new Error(`Template not found: ${templateId}`);
        }

        return template.cloneNode(true);
    }

    /**
     * テンプレートが読み込まれているかチェック
     * @returns {boolean} 読み込み済みかどうか
     */
    function isLoaded() {
        return templatesLoaded;
    }

    /**
     * 利用可能なテンプレートIDのリストを取得
     * @returns {string[]} テンプレートIDの配列
     */
    function getAvailableTemplates() {
        return Object.keys(templates);
    }

    // 公開API
    return {
        loadTemplates,
        getTemplate,
        isLoaded,
        getAvailableTemplates
    };
})();