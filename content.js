

window.onload = () => {
    const MY_CLASS = 'alk-element';
    const MY_OVERLAY_ID = 'alk-overlay';
    const MY_CHECK_BOX_CLASS = 'alk-check-box';
    const MY_CHECK_BOX_CONTAINER_CLASS = 'alk-check-box-container';
    
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

    // オリジナルのスタイル取得
    function getOriginalStyleObject(targetElement, allowedProperties){
        const targetElementStyle = window.getComputedStyle(targetElement);
        const tempObject ={};
        for (let style of allowedProperties) {
            tempObject[style] = targetElementStyle.getPropertyValue(style);
        }
        return tempObject;
    }

    // オリジナルのタイトルスタイルオブジェクト
    /** @type {{ [key: string]: string }} */
    let titleStyleObject = {};
    // キャッシュと適用
    function cacheTitleStyleObject(targetElement){
        // キャッシュ済み
        if(Object.keys(titleStyleObject).length > 0){
            return;
        }
        const allowedProperties = ['font-size', 'text-align', 'font-family', 'color', 'font-weight'];
        titleStyleObject = getOriginalStyleObject(targetElement, allowedProperties);
    }
    function applyOriginalTitleStyle(element){
        Object.assign(element.style, titleStyleObject);
    }
    
    // オリジナルの項目スタイルオブジェクト
    /** @type {{ [key: string]: string }} */
    let itemStyleObject = {};
    // キャッシュと適用
    function cacheItemStyleObject(targetElement){
        // キャッシュ済み
        if(Object.keys(itemStyleObject).length > 0){
            return;
        }
        const allowedProperties = ['font-size', 'font-family', 'color', 'font-weight'];
        itemStyleObject = getOriginalStyleObject(targetElement, allowedProperties);
    }
    function applyOriginalItemStyle(element){
        Object.assign(element.style, itemStyleObject);
    }

    // オリジナルの補足情報スタイルオブジェクト
    /** @type {{ [key: string]: string }} */
    let captionStyleObject = {};
    // キャッシュと適用
    function cacheCaptionStyleObject(targetElement){
        // キャッシュ済み
        if(Object.keys(captionStyleObject).length > 0){
            return;
        }
        const allowedProperties = ['font-size', 'text-align', 'font-family', 'color', 'font-weight'];
        captionStyleObject = getOriginalStyleObject(targetElement, allowedProperties);
    }
    function applyOriginalCaptionStyle(element){
        Object.assign(element.style, captionStyleObject);
    }

    // オリジナルの項目ボタン用スタイルオブジェクト
    /** @type {{ [key: string]: string }} */
    let itemShapeStyleObject = {};
    // キャッシュと適用
    function cacheItemShapeStyleObject(targetElement){
        // キャッシュ済み
        if(Object.keys(itemShapeStyleObject).length > 0){
            return;
        }
        const allowedProperties = ['border', 'background', 'border-radius', 'padding'];
        itemShapeStyleObject = getOriginalStyleObject(targetElement, allowedProperties);
    }
    function applyOriginalItemShapeStyle(element){
        Object.assign(element.style, itemShapeStyleObject);
    }

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

    // 有効な項目用の色
    let activeItemColor;
    // ヘッダの背景色
    let headerBackgroundColor;
    
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
                        console.log(`終了条件を満たしました: ${selector} が見つかりませんでした`);
                        resolve(null);
                    }
                });
                // DOMの変更を監視
                anyObserver.observe(document.body, options);

                // タイムアウト処理
                setTimeout(() => {
                    anyObserver.disconnect();
                    reject(new Error(`Timeout: 要素 ${selector} が見つかりませんでした`));
                }, 10000);
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
            const popupContentElement = await waitForElement('.role-detail-popup.equip-popup', null);
            const driverInfo = {};
            driverInfo.iconSource = popupContentElement.querySelector('.popup-content img')?.getAttribute('src');
            const nameAndLevelElement = popupContentElement.querySelectorAll('.popup-content p');
            const nameElement = nameAndLevelElement[0];
            const levelElement = nameAndLevelElement[1];
            cacheTitleStyleObject(nameElement);
            cacheCaptionStyleObject(levelElement);
            driverInfo.driverName = nameElement.textContent.trim();
            // 背景画像取得
            const titleStyle = window.getComputedStyle(nameElement);
            driverInfo.driverBackgroundImage = titleStyle.backgroundImage;;
            driverInfo.driverLevel = levelElement.textContent.trim();
            // メインステータス
            const mainNameAndValueElement = popupContentElement.querySelectorAll('.base-attrs span');
            cacheItemStyleObject(mainNameAndValueElement[1]);
            driverInfo.mainPropName = mainNameAndValueElement[0].textContent.trim();
            driverInfo.mainPropValue = mainNameAndValueElement[1].textContent.trim();
            // サブステータス
            const supPropElements = popupContentElement.querySelectorAll('.upper-attrs div');
            const subPropNameAndValues = [];
            supPropElements.forEach(div => {
                const spans = div.querySelectorAll('span');
                if (spans.length === 2) {
                    const subPropNameAndValue = {};
                    subPropNameAndValue.name = spans[0].textContent.trim();
                    subPropNameAndValue.value = spans[1].textContent.trim();
                    subPropNameAndValues.push(subPropNameAndValue);
                    cacheItemShapeStyleObject(spans[0].parentElement);
                }
            });
            driverInfo.subPropNameAndValues = subPropNameAndValues;
            driverInfoList[driverIndex] = driverInfo;
            popupContentElement.parentNode.querySelector('.close-icon').click();
        }

        // ステータスのキーと名称
        const PROP_NAME = Object.freeze({
            HP: 'HP',
            ATK: '攻撃力',
            DEF: '防御力',
            CRIT_RATE: '会心率',
            CRIT_DMG: '会心ダメージ',
            ANOMALY_PROFICIENCY: '異常マスタリー'
        });

        // チェックが入ったステータス名を返す
        function getActivePropNamesFromCheckboxes(){
            const checkedPropNames = [];
            const propNames = Object.values(PROP_NAME);
            propNames.forEach((value, index) => {
                const checkbox = document.getElementById(`checkbox${index}`);
                if (checkbox?.getAttribute('data-checked') === 'true') {
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
                    console.error("取得エラー:", chrome.runtime.lastError);
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
                const targetCheckbox = document.querySelector(`.${MY_CHECK_BOX_CLASS}.${keyAndValidity[0]}`);
                const isChecked = !!keyAndValidity[1];
                changeCheckbox(targetCheckbox, isChecked);
            }
        }

        // スコアにして返す
        function getScoreAndHitCount(subPropName, subPropValue){
            // 実数かパーセントか判断できない状態
            const isRealOrPercent = [PROP_NAME.HP, PROP_NAME.ATK, PROP_NAME.DEF, '貫通値']
                .includes(subPropName);
            // 実数
            if(isRealOrPercent && !subPropValue.includes('%')){
                const subPropNumberValue = Number(subPropValue.trim());
                switch(subPropName){
                    case PROP_NAME.HP:
                        return {score:0, hitCount: Math.round(
                            subPropNumberValue / 112.0)-1};
                    case PROP_NAME.ATK:
                        return {score:0, hitCount: Math.round(
                            subPropNumberValue / 19.0)-1};
                    case PROP_NAME.DEF:
                        return {score:0, hitCount: Math.round(
                            subPropNumberValue / 15.0)-1};
                    case '貫通値':
                        return {score:0, hitCount: Math.round(
                            subPropNumberValue / 9.0)-1};
                }
            }
            const subPropNumberValue = Number(subPropValue.replace(/[%]/g, '').trim());
            let score = 0;
            let hitCount = 0;
            switch (subPropName) {
                // 攻撃、HP
                case PROP_NAME.HP:
                case PROP_NAME.ATK:
                    score = subPropNumberValue * 1.6;
                    hitCount = subPropNumberValue / 3.0;
                    break;
                // 会心ダメージ、 防御
                case PROP_NAME.CRIT_DMG:
                case PROP_NAME.DEF:
                    score = subPropNumberValue;
                    hitCount = subPropNumberValue / 4.8;
                    break;
                // 会心率
                case PROP_NAME.CRIT_RATE:
                    score = subPropNumberValue * 2.0;
                    hitCount = subPropNumberValue / 2.4;
                    break;
                // 異常マスタリー
                case PROP_NAME.ANOMALY_PROFICIENCY:
                    score = (48.0/92.0) * subPropNumberValue;
                    hitCount = subPropNumberValue / 9.0;
                    break;
            }
            // 無効な項目
            if(!getActivePropNamesFromCheckboxes().includes(subPropName)){
                score = 0;
            }
            return {score:Math.floor(score * 100) * 0.01, hitCount: Math.round(hitCount)-1};
        }

        // スコア描画
        function drawScore(){
            // 念のため削除
            document.querySelectorAll(`.${MY_CLASS}`)?.forEach(element => {
                element.remove();
            });
            // とりあえず親にする要素
            const parentElement = document.querySelector('.equipment-info');
            // 親内に入れるためstyle改変
            parentElement.style.height = 'auto';
            const mainFrameElement = document.createElement('div');
            mainFrameElement.classList.add(MY_CLASS);
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
            const allowedPropertiesForParent = 
                ['height', 'padding', 'border', 'margin', 'box-sizing', 
                    'align-items', 'color', 'display', 'gap', 'justify-content'];
            for (let property of allowedPropertiesForParent) {
                copiedUl.style[property] = ulStyle.getPropertyValue(property);
            }
            // クラスとサイズを改変
            copiedUl.className = '';
            copiedUl.style.minWidth = copiedUl.style.width;
            copiedUl.style.minHeight = copiedUl.style.height;
            copiedUl.style.width = 'auto';
            copiedUl.style.height = 'auto';
            copiedUl.style.paddingBottom = '16px';
            // 子要素用のスタイル
            const lis = copiedUl.querySelectorAll('li');
            const liStyle = window.getComputedStyle(skillInfoChildUl);
            const allowedPropertiesForChild = 
                ['height', 'width', 'padding', 'margin', 'box-sizing', 'color',
                     'display', 'border', 'border-radius', 'border-width', 'background'];
            let totalScores = 0;
            for(let i = 0; i < lis.length; i++){
                const li = lis[i];
                // 子要素にスタイル適用
                for (let property of allowedPropertiesForChild) {
                    // なぜかボーダーだけ細くなるので2倍にする
                    if(property.includes('border') && property.includes('width')){
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
                const allowedPropertiesForContent = 
                    ['background', 'border', 'margin', 'border-radius', 'height', 'width'];
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
                    // ヘッダー：アイコン,タイトル,レベル
                    const contentHeaderElement = document.createElement('div');
                    contentHeaderElement.classList.add('alk-driver-content');
                    contentHeaderElement.style.display = 'flex';
                    contentHeaderElement.style.padding = '8px 8px 6px 8px';
                    contentHeaderElement.style.backgroundColor = headerBackgroundColor;
                    // ドライバ画像
                    const driverImageElement = document.createElement('img');
                    driverImageElement.src = driverInfo.iconSource;
                    const originalLi = skillInfoUl.querySelector('li');
                    const parentWidth = originalLi.offsetWidth;
                    const imageWidth = parentWidth * 0.15;
                    driverImageElement.style.width = `${imageWidth}px`;
                    driverImageElement.style.height = `${imageWidth}px`;
                    contentHeaderElement.appendChild(driverImageElement);
                    // タイトル部
                    const titleElement = document.createElement('div');
                    applyOriginalTitleStyle(titleElement);
                    titleElement.style.marginLeft = '8px';
                    const titleNameElement = document.createElement('p');
                    // 文字数が長い場合でも最後の番号文字を表示するための加工
                    const driverName = driverInfo.driverName;
                    if (driverName.length >= 9) {
                        titleNameElement.textContent = driverName.slice(0, 4) + '…' + driverName.slice(-3);
                    }else{
                        titleNameElement.textContent = driverInfo.driverName;
                    }
                    titleNameElement.style.overflow = 'hidden';
                    titleNameElement.style.whiteSpace = 'nowrap';
                    titleNameElement.style.paddingRight = '20px';
                    titleNameElement.style.fontSize = '12px';
                    // タイトル背景画像（レアリティ画像）
                    if(driverInfo.driverBackgroundImage){
                        titleNameElement.style.backgroundImage = driverInfo.driverBackgroundImage;
                        titleNameElement.style.backgroundPosition = 'right center';
                        titleNameElement.style.backgroundRepeat = 'no-repeat';
                        titleNameElement.style.backgroundOrigin = 'padding-box';
                        titleNameElement.style.backgroundSize = 'contain';
                    }
                    titleElement.appendChild(titleNameElement);
                    // レベル部
                    const driverLevelElement = document.createElement('p');
                    applyOriginalCaptionStyle(driverLevelElement);
                    driverLevelElement.textContent = driverInfo.driverLevel;
                    titleElement.appendChild(driverLevelElement);
                    contentHeaderElement.appendChild(titleElement);
                    // メインステータス+サブステータス+スコア
                    const subPropListElement = document.createElement('div');
                    subPropListElement.style.display = 'flex';
                    subPropListElement.style.flexDirection = 'column';
                    subPropListElement.style.overflow = 'hidden';
                    subPropListElement.style.whiteSpace = 'nowrap';
                    // メインステータス
                    const mainPropElement = document.createElement('div');
                    const mainPropNameElement = document.createElement('span');
                    applyOriginalItemStyle(mainPropNameElement);
                    mainPropNameElement.textContent = driverInfo.mainPropName;
                    mainPropNameElement.style.float = 'left';
                    const mainPropValueElement = document.createElement('span');
                    applyOriginalItemStyle(mainPropValueElement);
                    mainPropValueElement.textContent = driverInfo.mainPropValue;
                    mainPropValueElement.style.float = 'right';
                    mainPropElement.style.padding = '6px 8px';
                    mainPropElement.appendChild(mainPropNameElement);
                    mainPropElement.appendChild(mainPropValueElement);
                    subPropListElement.appendChild(mainPropElement);

                    // サブステータス
                    const subPropNameAndValues = driverInfo.subPropNameAndValues;
                    let scores = 0
                    // 空行も作るため4つ固定
                    for(let j = 0; j < 4; j++){
                        subProp = subPropNameAndValues[j];
                        const subPropElement = document.createElement('div');
                        subPropElement.style.overflow = 'hidden';
                        subPropElement.style.whiteSpace = 'nowrap';
                        subPropElement.style.padding = '6px 8px';
                        if(subProp){
                            // スコア
                            const ScoreAndHitCount = getScoreAndHitCount(subProp.name, subProp.value)
                            scores += ScoreAndHitCount.score;
                            // 各要素を作成
                            const subPropNameElement = document.createElement('span');
                            applyOriginalItemStyle(subPropNameElement);
                            const subPropHitCountElement = document.createElement('span');
                            applyOriginalItemStyle(subPropHitCountElement);
                            const subPropValueElement = document.createElement('span');
                            applyOriginalItemStyle(subPropValueElement);
                            // 強調表示
                            if(ScoreAndHitCount && ScoreAndHitCount.score > 0){
                                subPropNameElement.style.color = activeItemColor;
                                subPropHitCountElement.style.color = activeItemColor;
                                subPropValueElement.style.color = activeItemColor;
                            }else{
                                subPropNameElement.style.color = captionStyleObject['color'];
                                subPropHitCountElement.style.color = captionStyleObject['color'];
                                subPropValueElement.style.color = captionStyleObject['color'];
                            }
                            // ステータス名
                            subPropNameElement.textContent = subProp.name;
                            subPropNameElement.style.float = 'left';
                            subPropElement.appendChild(subPropNameElement);
                            // ヒット回数
                            if(ScoreAndHitCount && ScoreAndHitCount.hitCount > 0){
                                subPropHitCountElement.textContent = ScoreAndHitCount.hitCount.toFixed(0);
                                subPropHitCountElement.style.float = 'left';
                                // 背景色設定
                                let currentColor = subPropHitCountElement.style.color;
                                let rgbaMatch = currentColor.match(/rgba?\((\d+), (\d+), (\d+)(?:, (\d+(\.\d+)?))?\)/);
                                if (rgbaMatch) {
                                    let red = rgbaMatch[1];
                                    let green = rgbaMatch[2];
                                    let blue = rgbaMatch[3];
                                    let alpha = 0.16;
                                    subPropHitCountElement.style.backgroundColor = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
                                }
                                subPropHitCountElement.style.marginLeft = '6px';
                                subPropHitCountElement.style.padding = '0 2px';
                                subPropElement.appendChild(subPropHitCountElement);
                            }
                            // 数値
                            subPropValueElement.textContent = subProp.value;
                            subPropValueElement.style.float = 'right';
                            subPropElement.appendChild(subPropValueElement);
                            subPropListElement.appendChild(subPropElement);
                        }
                        // 空行
                        else{
                            // ステータス名
                            const subPropNameElement = document.createElement('span');
                            applyOriginalItemStyle(subPropNameElement);
                            subPropNameElement.textContent = '-';
                            subPropNameElement.style.float = 'left';
                            // 数値
                            const subPropValueElement = document.createElement('span');
                            applyOriginalItemStyle(subPropValueElement);
                            subPropValueElement.textContent = '-';
                            subPropValueElement.style.float = 'right';
                            // 生成
                            subPropElement.appendChild(subPropNameElement);
                            subPropElement.appendChild(subPropValueElement);
                            subPropListElement.appendChild(subPropElement);
                        }
                    }
                    // スコア
                    totalScores += scores;
                    const totalElement = document.createElement('div');
                    totalElement.style.backgroundColor = headerBackgroundColor;
                    const totalNameElement = document.createElement('span');
                    applyOriginalItemStyle(totalNameElement);
                    totalNameElement.textContent = 'スコア';
                    totalNameElement.style.float = 'left';
                    const totalValueElement = document.createElement('span');
                    applyOriginalItemStyle(totalValueElement);
                    totalValueElement.textContent = scores.toFixed(2);
                    totalValueElement.style.float = 'right';
                    totalElement.style.padding = '8px 8px 8px 8px';
                    totalElement.appendChild(totalNameElement);
                    totalElement.appendChild(totalValueElement);
                    // ステータスリスト
                    subPropListElement.appendChild(totalElement);
                    // 内容
                    content.appendChild(contentHeaderElement);
                    content.appendChild(subPropListElement);
                } 
                else {
                    // 未装備のドライバ欄
                }
                li.appendChild(content);
            }
            mainFrameElement.append(copiedUl);
            parentElement.append(mainFrameElement);
            
            // 合計
            // チェックボックスのグループを親にする
            const checkboxParent = document.querySelector(`.${MY_CHECK_BOX_CONTAINER_CLASS}`);
            const totalScoreLabelElement = document.createElement('span');
            totalScoreLabelElement.classList.add(MY_CLASS);
            totalScoreLabelElement.textContent = '合計スコア';
            applyOriginalTitleStyle(totalScoreLabelElement);
            totalScoreLabelElement.style.float = 'right';
            totalScoreLabelElement.style.textAlign = 'right';
            totalScoreLabelElement.style.marginLeft  = 'auto';
            totalScoreLabelElement.style.position = 'absolute';
            totalScoreLabelElement.style.right = '12%';
            totalScoreLabelElement.style.fontFamily = 'inpin hongmengti';
            checkboxParent.appendChild(totalScoreLabelElement);

            const driverScoreElement = document.createElement('span');
            driverScoreElement.classList.add(MY_CLASS);
            driverScoreElement.textContent = `${totalScores.toFixed(2)}`;
            applyOriginalTitleStyle(driverScoreElement);
            driverScoreElement.style.float = 'right';
            driverScoreElement.style.textAlign = 'right';
            driverScoreElement.style.marginLeft  = 'auto';
            driverScoreElement.style.position = 'absolute';
            driverScoreElement.style.right = '0';
            driverScoreElement.style.paddingRight = '22px';
            driverScoreElement.style.fontFamily = 'inpin hongmengti';
            checkboxParent.appendChild(driverScoreElement);
        }

        // チェックボックス変更（引数は次のチェック状態）
        function changeCheckbox(checkboxElement, nextCheckedState){
            checkboxElement.dataset.checked = (!!nextCheckedState).toString();
            checkboxElement.style.color = nextCheckedState ? activeItemColor : captionStyleObject['color'];
        }

        // 加算対象のチェックボックス描画
        function drawConfig(){
            // 念のため削除
            document.querySelectorAll(`.${MY_CHECK_BOX_CLASS}`)?.forEach(element => {
                element.remove();
            });
            // チェックボックスを6つ作成
            const container = document.createElement('div');
            container.classList.add(MY_CHECK_BOX_CONTAINER_CLASS);
            // TODO:要素コピーした方がいい
            container.style.display = 'flex';
            container.style.columnGap = '5px';
            container.style.padding = '0 22px 8px 18px';
            const propKeyAndNames = Object.entries(PROP_NAME);
            for (let i = 0; i < propKeyAndNames.length; i++) {
                const propKeyAndName = propKeyAndNames[i];
                const span = document.createElement('span');
                span.id = `checkbox${i}`;
                span.classList.add(MY_CHECK_BOX_CLASS, `${propKeyAndName[0]}`);
                span.textContent = propKeyAndName[1];
                applyOriginalItemStyle(span);
                applyOriginalItemShapeStyle(span);
            
                // クリックでオンオフ切り替え
                span.addEventListener('click', () => {
                    const isChecked = span.dataset.checked === 'true';
                    changeCheckbox(span, !isChecked);
                    saveTargetProp();
                    drawScore();
                });
                container.appendChild(span);
            }
            // 仮の親
            const parentElement = document.querySelector('.equipment-info');
            parentElement.appendChild(container);
        }

        // キャラ名取得
        function getCharacterName(){
            return document.querySelector('.nickname').textContent?.trim();
        }

        // チェックボックスの内容を保存
        function saveTargetProp(){
            const propKeyAndNames = Object.entries(PROP_NAME);
            const activePropNames = getActivePropNamesFromCheckboxes();
            const targetPropsObject = {};
            for (let propKeyAndName of propKeyAndNames){
                targetPropsObject[propKeyAndName[0]] = !!activePropNames.includes(propKeyAndName[1]);
            }
            const characterName = getCharacterName();
            // キャラ名をキーにチェック状態を保存
            chrome.storage.local.set({ [characterName]: targetPropsObject }, () => {
                if (chrome.runtime.lastError) {
                    console.error("保存エラー:", chrome.runtime.lastError);
                } else {
                    console.log(`${characterName} のデータを保存しました`, targetPropsObject);
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
            characterInfoElementObserver.observe(characterInfoElement, {
                childList: false,
                attributes: true,
                subtree: false,
                characterData: false,
                characterDataOldValue: false,
                attributeOldValue: false,
                attributeFilter: ['style']
            });
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
                Array.from(els).some(el => el.querySelector('.bg'));
            // キャラが表示されていてセット効果がなくディスクもないなら装備なしとみなす
            const stopCondition = () => 
                (!!document.querySelector('.empty-content') 
                && !!document.querySelector('.role-avatar-container img')?.src
                && !document.querySelector('.equip-info .bg'));
            // 上記条件でドライバ情報要素*6を取得
            const equipInfoElements = await waitForElements(
                '.equip-info', 
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
                .map(el => !!el.querySelector('.bg'));
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
            const overlay = document.createElement("div");
            overlay.style.position = "fixed";
            overlay.style.top = "0";
            overlay.style.left = "0";
            overlay.style.width = "100vw";
            overlay.style.height = "100vh";
            overlay.style.background = "rgba(0, 0, 0, 0)"; 
            overlay.style.zIndex = "9999";
            overlay.style.pointerEvents = "none";
            overlay.id = MY_OVERLAY_ID;
            document.body.appendChild(overlay);
        }

        // ユーザーの操作を防ぐ透明なオーバーレイ要素を削除
        function deleteOverlay(){
            const overlay = document.querySelector(`#${MY_OVERLAY_ID}`);
            document.body.removeChild(overlay);
        }

        // 最初に実行
        async function setup(){
            // ドライバ情報取得
            const isSuccess = await tryCacheDriverInfoList();
            if(isSuccess){
                // 色のキャッシュ
                const propertyInfoElement = document.querySelector('.property-info');
                // 強調色
                const baseAddPropElement = propertyInfoElement.querySelector('.base-add-prop');
                const spanElements = baseAddPropElement.querySelectorAll('span');
                activeItemColor = getComputedStyle(spanElements[1]).color;
                // ヘッダ背景色
                const headerElement = document.querySelector('.equipment-info h2');
                headerBackgroundColor = getComputedStyle(headerElement).backgroundColor;
            }
            characterInfoElement = await waitForElement('.role-detail-container');
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
                console.error('エラー:', error);
            }
        }
    
        firstDraw();
    };