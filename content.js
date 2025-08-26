

window.onload = () => {
    // 設定定数を参照
    const { CSS_CLASSES, NUMERIC_CONSTANTS, STRING_CONSTANTS, CSS_PROPERTIES, OBSERVER_OPTIONS, STYLE_CONSTANTS, STYLE_TYPES, PROP_NAME_TRANSLATIONS, PROP_NAME, UI_TRANSLATIONS } = Config;
    
    // ドライバ情報リスト
    /** @type {Array<{
     *  iconSource: string, 
     *  driverName: string, 
     *  driverBackgroundImage: string,
     *  driverLevel: string,
     *  mainPropName: string,
     *  mainPropValue: string,
     *  subPropNameAndValues: Array<{
     *      name: string, 
     *      value: string
     *  }>
     *  }>} */
    const driverInfoList = [];

    // キャラ親要素
    /** @type {HTMLElement | null} */
    let characterInfoElement;

    // キャラ情報の監視オブジェクト
    let characterInfoElementObserver;


    // ヘッダ色=スキル枠背景色：
    //      rgb(22, 22, 22)
    // 奇数背景色：
    //      rgb(19, 19, 19)
    // 偶数背景色=ベースの背景色：
    //      rgb(42, 42, 42)
    // 枠背景色：
    //      rgb(36, 36, 36)
    // ポップアップ背景色
    //      rgb(29, 31, 30)
    // 罫線背景色
    //      rgb(42, 44, 43)

    
    function waitForElementsInternal(selector, isSingleElement = true, 
        validate = (el) => !!el, 
        options = { childList: true, subtree: true, attributes: true}, 
        stopCondition = () => false) {
            return new Promise((resolve, reject) => {
                const anyObserver = new MutationObserver((mutationsList, observer) => {
                    const elements = isSingleElement ? document.querySelector(selector) : document.querySelectorAll(selector);
                    // 成功条件
                    if (elements && (validate == null || validate(elements))) {
                        observer.disconnect();
                        resolve(elements);
                    }
                    // 終了条件
                    if (stopCondition()) {
                        observer.disconnect();
                        console.log(`[ZZZ-Score] ${STRING_CONSTANTS.ERROR_ELEMENT_NOT_FOUND}: ${selector} ${STRING_CONSTANTS.ERROR_TIMEOUT_SUFFIX}`);
                        resolve(null);
                    }
                });
                // DOMの変更を監視
                anyObserver.observe(document.body, options);

                // タイムアウト処理
                setTimeout(() => {
                    anyObserver.disconnect();
                    reject(new Error(`${STRING_CONSTANTS.ERROR_TIMEOUT_PREFIX} ${selector} ${STRING_CONSTANTS.ERROR_TIMEOUT_SUFFIX}`));
                }, NUMERIC_CONSTANTS.ELEMENT_WAIT_TIMEOUT);
            });
        }

        // 汎用的な要素待機関数（単一要素）
        function waitForElement(selector, validate = (el) => !!el, 
            options = { childList: true, subtree: true, attributes: true},
            stopCondition = () => false) 
        {
            return waitForElementsInternal(selector, true, validate, options, stopCondition);
        }

        // 汎用的な要素待機関数（複数要素）
        function waitForElements(selector, validate = (el) => !!el, 
            options = { childList: true, subtree: true, attributes: true},
            stopCondition = () => false) 
        {
            return waitForElementsInternal(selector, false, validate, options, stopCondition);
        }

        // ドライバ情報のキャッシュ
        async function cacheDriverInfo(driverIndex){
            const popupContentElement = await waitForElement(CSS_CLASSES.ROLE_DETAIL_POPUP, null);
            const driverInfo = {};
            driverInfo.iconSource = popupContentElement.querySelector(CSS_CLASSES.POPUP_CONTENT_IMG)?.getAttribute(STRING_CONSTANTS.ATTR_SRC);
            const nameAndLevelElement = popupContentElement.querySelectorAll(CSS_CLASSES.POPUP_CONTENT_P);
            const nameElement = nameAndLevelElement[0];
            const levelElement = nameAndLevelElement[1];
            StyleManager.cacheStyle(STYLE_TYPES.TITLE, nameElement);
            StyleManager.cacheStyle(STYLE_TYPES.CAPTION, levelElement);
            driverInfo.driverName = nameElement.textContent.trim();
            // 背景画像取得
            const titleStyle = window.getComputedStyle(nameElement);
            driverInfo.driverBackgroundImage = titleStyle.backgroundImage;;
            driverInfo.driverLevel = levelElement.textContent.trim();
            // メインステータス
            const mainNameAndValueElement = popupContentElement.querySelectorAll(CSS_CLASSES.BASE_ATTRS_SPAN);
            StyleManager.cacheStyle(STYLE_TYPES.ITEM, mainNameAndValueElement[1]);
            driverInfo.mainPropName = mainNameAndValueElement[0].textContent.trim();
            driverInfo.mainPropValue = mainNameAndValueElement[1].textContent.trim();
            // サブステータス
            const supPropElements = popupContentElement.querySelectorAll(CSS_CLASSES.UPPER_ATTRS_DIV);
            const subPropNameAndValues = [];
            supPropElements.forEach(div => {
                const spans = div.querySelectorAll('span');
                if (spans.length === 2) {
                    const subPropNameAndValue = {};
                    subPropNameAndValue.name = spans[0].textContent.trim();
                    subPropNameAndValue.value = spans[1].textContent.trim();
                    subPropNameAndValues.push(subPropNameAndValue);
                    StyleManager.cacheStyle(STYLE_TYPES.ITEM_SHAPE, spans[0].parentElement);
                }
            });
            driverInfo.subPropNameAndValues = subPropNameAndValues;
            driverInfoList[driverIndex] = driverInfo;
            popupContentElement.parentNode.querySelector(CSS_CLASSES.CLOSE_ICON).click();
        }

        // 言語検知関数
        function getCurrentLanguage() {
            const langSelector = document.querySelector(CSS_CLASSES.LANG_SELECTOR);
            return langSelector?.textContent?.trim() === STRING_CONSTANTS.LANGUAGE_EN ? STRING_CONSTANTS.LANGUAGE_EN : STRING_CONSTANTS.LANGUAGE_JP;
        }

        // チェックが入ったステータス名を返す
        function getActivePropNamesFromCheckboxes(){
            const checkedPropNames = [];
            const currentLang = getCurrentLanguage();
            const propNames = Object.values(PROP_NAME_TRANSLATIONS[currentLang]);
            propNames.forEach((value, index) => {
                const checkbox = document.getElementById(`${Config.CHECKBOX_ID_PREFIX}${index}`);
                if (checkbox?.getAttribute(STRING_CONSTANTS.ATTR_DATA_CHECKED) === STRING_CONSTANTS.ATTR_TRUE) {
                    checkedPropNames.push(propNames[index]);
                }
            });
            return checkedPropNames;
        }

        // チェックボックスの情報を読み込み
        function loadAndSetTargetPropNamesObject(onComplete){
            const characterName = getCharacterName();
            chrome.storage.local.get(characterName, (result) => {
                if (chrome.runtime.lastError) {
                    console.error('[ZZZ-Score]', STRING_CONSTANTS.ERROR_STORAGE_GET, chrome.runtime.lastError);
                    return;
                } 
                if(!result || !result[characterName]){
                    onComplete();
                    return;
                } 
                setCheckboxesFromStorage(result[characterName]);
                onComplete();
            });
        }

        // 読み込んだ情報をチェックボックスに反映
        function setCheckboxesFromStorage(targetPropNamesObject){
            const keyAndValidations = Object.entries(targetPropNamesObject);
            for (let keyAndValidity of keyAndValidations){
                const targetCheckbox = document.querySelector(`.${CSS_CLASSES.MY_CHECK_BOX_CLASS}.${keyAndValidity[0]}`);
                const isChecked = !!keyAndValidity[1];
                changeCheckbox(targetCheckbox, isChecked);
            }
        }


        // スコアにして返す
        function getScoreAndHitCount(subPropName, subPropValue){
            const currentLang = getCurrentLanguage();
            // 実数かパーセントか判断できない状態
            const isRealOrPercent = [PROP_NAME.HP, PROP_NAME.ATK, PROP_NAME.DEF, UI_TRANSLATIONS[currentLang].PENETRATION]
                .includes(subPropName);
            // 実数
            if(isRealOrPercent && !subPropValue.includes('%')){
                const subPropNumberValue = Number(subPropValue.trim());
                switch(subPropName){
                    case PROP_NAME.HP:
                        return {score:0, hitCount: Math.round(
                            subPropNumberValue / NUMERIC_CONSTANTS.SCORE_COEFFICIENTS.HP_BASE_VALUE)-NUMERIC_CONSTANTS.HIT_COUNT_ADJUSTMENT};
                    case PROP_NAME.ATK:
                        return {score:0, hitCount: Math.round(
                            subPropNumberValue / NUMERIC_CONSTANTS.SCORE_COEFFICIENTS.ATK_BASE_VALUE)-NUMERIC_CONSTANTS.HIT_COUNT_ADJUSTMENT};
                    case PROP_NAME.DEF:
                        return {score:0, hitCount: Math.round(
                            subPropNumberValue / NUMERIC_CONSTANTS.SCORE_COEFFICIENTS.DEF_BASE_VALUE)-NUMERIC_CONSTANTS.HIT_COUNT_ADJUSTMENT};
                    case UI_TRANSLATIONS[currentLang].PENETRATION:
                        return {score:0, hitCount: Math.round(
                            subPropNumberValue / NUMERIC_CONSTANTS.SCORE_COEFFICIENTS.PENETRATION_BASE_VALUE)-NUMERIC_CONSTANTS.HIT_COUNT_ADJUSTMENT};
                }
            }
            const subPropNumberValue = Number(subPropValue.replace(Config.REGEX_PATTERNS.PERCENTAGE, '').trim());
            let score = 0;
            let hitCount = 0;
            switch (subPropName) {
                // 攻撃、HP
                case PROP_NAME.HP:
                case PROP_NAME.ATK:
                    score = subPropNumberValue * NUMERIC_CONSTANTS.SCORE_COEFFICIENTS.HP_ATK_MULTIPLIER;
                    hitCount = subPropNumberValue / NUMERIC_CONSTANTS.SCORE_COEFFICIENTS.HP_ATK_HIT_DIVISOR;
                    break;
                // 会心ダメージ、 防御
                case PROP_NAME.CRIT_DMG:
                case PROP_NAME.DEF:
                    score = subPropNumberValue * NUMERIC_CONSTANTS.SCORE_COEFFICIENTS.CRIT_DMG_DEF_MULTIPLIER;
                    hitCount = subPropNumberValue / NUMERIC_CONSTANTS.SCORE_COEFFICIENTS.CRIT_DMG_DEF_HIT_DIVISOR;
                    break;
                // 会心率
                case PROP_NAME.CRIT_RATE:
                    score = subPropNumberValue * NUMERIC_CONSTANTS.SCORE_COEFFICIENTS.CRIT_RATE_MULTIPLIER;
                    hitCount = subPropNumberValue / NUMERIC_CONSTANTS.SCORE_COEFFICIENTS.CRIT_RATE_HIT_DIVISOR;
                    break;
                // 異常マスタリー
                case PROP_NAME.ANOMALY_PROFICIENCY:
                    score = NUMERIC_CONSTANTS.SCORE_COEFFICIENTS.ANOMALY_PROFICIENCY_MULTIPLIER * subPropNumberValue;
                    hitCount = subPropNumberValue / NUMERIC_CONSTANTS.SCORE_COEFFICIENTS.ANOMALY_PROFICIENCY_HIT_DIVISOR;
                    break;
            }
            // 無効な項目
            if(!getActivePropNamesFromCheckboxes().includes(subPropName)){
                score = 0;
            }
            return {score:Math.floor(score * NUMERIC_CONSTANTS.SCORE_DECIMAL_MULTIPLIER) * NUMERIC_CONSTANTS.SCORE_DECIMAL_DIVISOR, hitCount: Math.round(hitCount)-NUMERIC_CONSTANTS.HIT_COUNT_ADJUSTMENT};
        }

        // スコア描画
        function drawScore(){
            // 念のため削除
            document.querySelectorAll(`.${CSS_CLASSES.MY_CLASS}`)?.forEach(element => {
                element.remove();
            });
            // とりあえず親にする要素
            const parentElement = document.querySelector(CSS_CLASSES.EQUIPMENT_INFO);
            // 親内に入れるためstyle改変
            parentElement.style.height = 'auto';
            const mainFrameElement = document.createElement('div');
            mainFrameElement.classList.add(CSS_CLASSES.MY_CLASS);
            
            // スタイルと色情報をまとめる（合計スコア表示用に後で再取得）
            const styleObjects = StyleManager.getStyleCache();
            const colors = StyleManager.getColors();
            const currentLang = getCurrentLanguage();
            const translations = UI_TRANSLATIONS[currentLang];
            // 要素を取得してコピー
            const skillInfoUl = document.querySelector('.skill-info ul');
            const skillInfoChildUl = skillInfoUl.querySelector('.skill-item');
            const skillInfoContentUl = skillInfoChildUl.querySelector('div');
            const copiedUl = skillInfoUl.cloneNode(true);
            // 内容はスタイルのみ取得し削除
            const contentStyle = window.getComputedStyle(skillInfoContentUl);
            const divs = copiedUl.querySelectorAll('div');
            divs.forEach(div => div.remove());
            // 親にスタイルを適用
            const ulStyle = window.getComputedStyle(skillInfoUl)
            const allowedPropertiesForParent = STYLE_CONSTANTS.PARENT_STYLE_PROPERTIES;
            for (let property of allowedPropertiesForParent) {
                copiedUl.style[property] = ulStyle.getPropertyValue(property);
            }
            // クラスとサイズを改変
            copiedUl.className = '';
            copiedUl.style.minWidth = copiedUl.style.width;
            copiedUl.style.minHeight = copiedUl.style.height;
            copiedUl.style.width = 'auto';
            copiedUl.style.height = 'auto';
            copiedUl.style.paddingBottom = STYLE_CONSTANTS.PADDING_BOTTOM;
            // 子要素用のスタイル
            const lis = copiedUl.querySelectorAll('li');
            const liStyle = window.getComputedStyle(skillInfoChildUl);
            const allowedPropertiesForChild = STYLE_CONSTANTS.CHILD_STYLE_PROPERTIES;
            let totalScores = 0;
            for(let i = 0; i < lis.length; i++){
                const li = lis[i];
                // 子要素にスタイル適用
                for (let property of allowedPropertiesForChild) {
                    // なぜかボーダーだけ細くなるので2倍にする
                    if(property.includes(STYLE_CONSTANTS.BORDER_KEYWORD) && property.includes(STYLE_CONSTANTS.WIDTH_KEYWORD)){
                        li.style[property] = `calc(${liStyle.getPropertyValue(property)} * 2.0)`;
                    }else{
                        li.style[property] = liStyle.getPropertyValue(property);
                    }
                }
                // クラスとサイズを改変
                li.className = '';
                li.style.minWidth = li.style.width;
                li.style.minHeight = li.style.height;
                li.style.width = 'auto';
                li.style.height = 'auto';
                // 内容を作成
                const content = document.createElement('div');
                // 内容にスタイルを適用
                const allowedPropertiesForContent = STYLE_CONSTANTS.CONTENT_STYLE_PROPERTIES;
                for (let property of allowedPropertiesForContent) {
                    content.style[property] = contentStyle.getPropertyValue(property);
                }
                // ボーダーが被って消えるのを防ぐ
                content.style.minWidth = content.style.width;
                content.style.minHeight = content.style.height;
                content.style.width = 'auto';
                content.style.height = 'auto';
                content.style.overflow = 'hidden';
                const driverInfo = driverInfoList[i];
                if (driverInfo) {
                    // 画像サイズを計算
                    const originalLi = skillInfoUl.querySelector('li');
                    const parentWidth = originalLi.offsetWidth;
                    const imageWidth = parentWidth * 0.15;
                    
                    // ドライバデータを準備
                    const driverData = {
                        ...driverInfo,
                        imageWidth: imageWidth
                    };
                    
                    // コンポーネントを生成
                    
                    if (typeof ScoreComponent === 'undefined') {
                        console.error('[ZZZ-Score] ScoreComponent not available');
                        return;
                    }
                    
                    const componentResult = ScoreComponent.createDriverComponent(
                        driverData,
                        styleObjects,
                        colors,
                        getScoreAndHitCount,
                        getActivePropNamesFromCheckboxes(),
                        translations
                    );
                    
                    
                    content.appendChild(componentResult.element.header);
                    content.appendChild(componentResult.element.stats);
                    totalScores += componentResult.score;
                } 
                else {
                    // 未装備のドライバ欄
                }
                li.appendChild(content);
            }
            mainFrameElement.append(copiedUl);
            parentElement.append(mainFrameElement);
            
            // 合計スコア表示を更新（最新のスタイル情報を取得）
            const checkboxParent = document.querySelector(`.${CSS_CLASSES.MY_CHECK_BOX_CONTAINER_CLASS}`);
            if (checkboxParent) {
                const latestStyleObjects = StyleManager.getStyleCache();
                
                
                ScoreComponent.updateTotalScore(
                    checkboxParent, 
                    totalScores, 
                    translations.TOTAL_SCORE, 
                    latestStyleObjects
                );
            }
        }

        // チェックボックス変更（引数は次のチェック状態）
        function changeCheckbox(checkboxElement, nextCheckedState){
            checkboxElement.dataset.checked = (!!nextCheckedState).toString();
            const colors = StyleManager.getColors();
            checkboxElement.style.color = nextCheckedState ? colors.activeItem : StyleManager.getStyleCache().caption['color'];
        }

        // 加算対象のチェックボックス描画
        function drawConfig(){
            // 念のため削除
            document.querySelectorAll(`.${CSS_CLASSES.MY_CHECK_BOX_CLASS}`)?.forEach(element => {
                element.remove();
            });
            
            // スタイル情報を準備
            const styleObjects = StyleManager.getStyleCache();
            
            const currentLang = getCurrentLanguage();
            const translations = PROP_NAME_TRANSLATIONS[currentLang];
            
            // チェックボックス変更時のコールバック
            const onCheckboxChange = (checkbox, isChecked) => {
                changeCheckbox(checkbox, isChecked);
                saveTargetProp();
                drawScore();
            };
            
            // コンポーネントを生成
            const container = ScoreComponent.createCheckboxContainer(
                translations,
                styleObjects,
                onCheckboxChange
            );
            
            // 親要素に追加
            const parentElement = document.querySelector('.equipment-info');
            parentElement.appendChild(container);
        }

        // キャラ名取得
        function getCharacterName(){
            return document.querySelector(CSS_CLASSES.NICKNAME).textContent?.trim();
        }

        // チェックボックスの内容を保存
        function saveTargetProp(){
            const currentLang = getCurrentLanguage();
            const propKeyAndNames = Object.entries(PROP_NAME_TRANSLATIONS[currentLang]);
            const activePropNames = getActivePropNamesFromCheckboxes();
            const targetPropsObject = {};
            for (let propKeyAndName of propKeyAndNames){
                targetPropsObject[propKeyAndName[0]] = !!activePropNames.includes(propKeyAndName[1]);
            }
            const characterName = getCharacterName();
            // キャラ名をキーにチェック状態を保存
            chrome.storage.local.set({ [characterName]: targetPropsObject }, () => {
                if (chrome.runtime.lastError) {
                    console.error('[ZZZ-Score]', STRING_CONSTANTS.ERROR_STORAGE_SET, chrome.runtime.lastError);
                } else {
                }
            });
        }
        
        // 非同期処理を分離
        async function reDraw() {
            const isValid = await tryCacheDriverInfoList();
            if(isValid){
                drawConfig();
                loadAndSetTargetPropNamesObject(drawScore);
            }
        }
            
        // 監視を再設定する関数
        function setObservers() {
            // キャラ名
            if (characterInfoElementObserver) {
                characterInfoElementObserver.disconnect();
            }
            characterInfoElementObserver = new MutationObserver(callback);
            characterInfoElementObserver.observe(characterInfoElement, OBSERVER_OPTIONS.STYLE_ONLY);
        }

        // 監視のコールバック
        const callback = (mutationsList, observer) => {(
            async () =>{
                for (let mutation of mutationsList) {
                    // キャラ選択
                    if(observer === characterInfoElementObserver 
                        && mutation.type === 'attributes' && mutation.attributeName === 'style'
                    ){
                        const oldStyle = mutation.oldValue || ''; 
                        const newStyle = mutation.target.getAttribute('style') || '';
                        // backgroundか変更されていればキャラを変更したとみなす
                        const oldBackground = oldStyle.match(/background:[^;]+/);
                        const newBackground = newStyle.match(/background:[^;]+/);
                        if (oldBackground?.[0] !== newBackground?.[0]) {
                            await reDraw();
                        }
                    } 
                }
            })();
        };

        // 画面を開いてドライバ情報を取得（終わったら戻る）
        async function tryCacheDriverInfoList(){
            // bg要素を取得できれば完了
            const validateEquipInfoElements = (els) => 
                Array.from(els).some(el => el.querySelector(CSS_CLASSES.BG));
            // キャラが表示されていてセット効果がなくディスクもないなら装備なしとみなす
            const stopCondition = () => 
                (!!document.querySelector(CSS_CLASSES.EMPTY_CONTENT) 
                && !!document.querySelector(CSS_CLASSES.ROLE_AVATAR_CONTAINER_IMG)?.complete
                && !document.querySelector(`${CSS_CLASSES.EQUIP_INFO} ${CSS_CLASSES.BG}`));
            // 上記条件でドライバ情報要素*6を取得
            const equipInfoElements = await waitForElements(
                CSS_CLASSES.EQUIP_INFO, 
                validateEquipInfoElements, 
                undefined, 
                stopCondition
            );
            // 取得できなかったら失敗
            if(!equipInfoElements){
                return false;
            }
            // ドライバの装備/非装備リスト
            const equipDriverList = Array.from(equipInfoElements)
                .map(el => !!el.querySelector(CSS_CLASSES.BG));
            const isNothingEquipped = equipDriverList.every(value => value === false);
            // 装備なしなら終了
            if(isNothingEquipped){
                return false;
            }
            // 一時的に操作を防ぐ
            addOverlay();
            // キャッシュ
            for (let i = 0; i < equipDriverList.length; i++) {
                if (equipDriverList[i]) {
                    equipInfoElements[i].click();
                    await cacheDriverInfo(i);
                } else {
                    driverInfoList[i] = null;
                }
            }
            deleteOverlay();
            return true;
        }

        // ユーザーの操作を防ぐ透明なオーバーレイ要素追加
        function addOverlay(){
            const overlay = ScoreComponent.createOverlay();
            document.body.appendChild(overlay);
        }

        // ユーザーの操作を防ぐ透明なオーバーレイ要素を削除
        function deleteOverlay(){
            const overlay = document.querySelector(`#${CSS_CLASSES.MY_OVERLAY_ID}`);
            if (overlay) {
                document.body.removeChild(overlay);
            }
        }

        // 最初に実行
        async function setup(){
            // テンプレート読み込み
            try {
                await TemplateLoader.loadTemplates();
            } catch (error) {
                console.error('[ZZZ-Score]', STRING_CONSTANTS.LOG_TEMPLATES_ERROR, error);
                return false;
            }
            
            // ドライバ情報取得
            const isSuccess = await tryCacheDriverInfoList();
            if(isSuccess){
                // 色のキャッシュ
                const propertyInfoElement = document.querySelector(CSS_CLASSES.PROPERTY_INFO);
                // 色情報をキャッシュ
                StyleManager.cacheColors(CSS_CLASSES);
                
                // ニックネーム（合計スコア）用のスタイルをキャッシュ
                const nicknameElement = document.querySelector(CSS_CLASSES.NICKNAME);
                if (nicknameElement) {
                    StyleManager.cacheStyle(STYLE_TYPES.NICKNAME, nicknameElement);
                }
            }
            characterInfoElement = await waitForElement(CSS_CLASSES.ROLE_DETAIL_CONTAINER);
            // 変更監視開始
            setObservers();
        }
    
        // スコア要素作成
        async function firstDraw(){
            try {
                await setup();
                drawConfig();
                loadAndSetTargetPropNamesObject(drawScore);
            } catch (error) {
                console.error('[ZZZ-Score] エラー:', error);
            }
        }
    
        firstDraw();
    };