

window.onload = () => {
    const MY_CLASS = 'alk-element';
    const MY_OVERLAY_ID = 'alk-overlay';
    const MY_CHECK_BOX_CLASS = 'alk-check-box';
    // 画面にチェックボックスを追加し、UID+キャラクターごとに追加ステータスを記憶する
    // 上記はchrome.storage.localで実現する
    // 最初に画面を開いたとき、キャラを切り替えたときに各ドライバをクリックして画面表示+ステータスをキャッシュ
    // 自作チェックボックスの内容で計算
    // 自作チェックボックスが変更されたらキャッシュしたステータスで計算
    
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

    
    // .property-info内のli内から、各ステータスのアイコンを取得し、キーで取得できるようにする
    /** @type {{ [key: string]: string }} */
    let iconPaths = {};
    
    // 装備次第で取得できない条件があるため保持
    // ->色だけでいい
    /** @type {{ [key: string]: string }} */
    const highlightNumberStyle = {
        'color' : 'rgb(181, 255, 0)',
        'font-family' : 'inpin hongmengti',
        'font-size' : '14px',
        'text-align' : 'right',
    };
    
    /** @type {{ [key: string]: string }} */
    const normalNumberStyle = {
        'color' : 'rgb(255, 255, 255)',
        'font-family' : 'inpin hongmengti',
        'font-size' : '14px',
        'text-align' : 'right',
    };

    function getOriginalStyleObject(targetElement){
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

    function cacheTitleStyleObject(targetElement){
        const targetElementStyle = window.getComputedStyle(targetElement);
        for (let style of allowedProperties) {
            titleStyleObject[style] = targetElementStyle.getPropertyValue(style);
        }
    }
    
    // オリジナルの項目スタイルオブジェクト
    /** @type {{ [key: string]: string }} */
    let itemStyleObject = {};

    // オリジナルの補足情報スタイルオブジェクト
    /** @type {{ [key: string]: string }} */
    let captionStyleObject = {};

    // 有効な項目用の色
    let activeItemColor;


    const oddRowBackgroundColor = 'rgb(19, 19, 19)';
    const evenRowBackgroundColor = 'rgb(42, 42, 42)';
    
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
            driverInfo.driverName = nameAndLevelElement[0].textContent.trim();
            // 背景画像取得
            const titleStyle = window.getComputedStyle(nameAndLevelElement[0]);
            driverInfo.driverBackgroundImage = titleStyle.backgroundImage;;
            driverInfo.driverLevel = nameAndLevelElement[1].textContent.trim();
            const mainNameAndValueElement = popupContentElement.querySelectorAll('.base-attrs span');
            driverInfo.mainPropName = mainNameAndValueElement[0].textContent.trim();
            driverInfo.mainPropValue = mainNameAndValueElement[1].textContent.trim();
            const supPropElements = popupContentElement.querySelectorAll('.upper-attrs div');
            const subPropNameAndValues = [];
            supPropElements.forEach(div => {
                const spans = div.querySelectorAll('span');
                if (spans.length === 2) {
                    const subPropNameAndValue = {};
                    subPropNameAndValue.name = spans[0].textContent.trim();
                    subPropNameAndValue.value = spans[1].textContent.trim();
                    subPropNameAndValues.push(subPropNameAndValue);
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
                if (checkbox?.checked) {
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
                targetCheckbox.checked = !!keyAndValidity[1];
            }
        }

        // スコアにして返す
        function getScore(subPropName, subPropValue){
            // 無効な項目
            if(!getActivePropNamesFromCheckboxes().includes(subPropName)){
                return 0;
            }
            // 実数かパーセントか判断できない状態
            const isRealOrPercent = [PROP_NAME.HP, PROP_NAME.ATK, PROP_NAME.DEF]
                .includes(subPropName);
            // 実数
            if(isRealOrPercent && !subPropValue.includes('%')){
                return 0;
            }
            const subPropNumberValue = Number(subPropValue.replace(/[%]/g, '').trim());
            let score = 0;
            switch (subPropName) {
                // 攻撃、HP
                case PROP_NAME.HP:
                case PROP_NAME.ATK:
                    score = subPropNumberValue * 1.6;
                    break;
                // 会心ダメージ、 防御
                case PROP_NAME.CRIT_DMG:
                case PROP_NAME.DEF:
                    score = subPropNumberValue;
                    break;
                // 会心率
                case PROP_NAME.CRIT_RATE:
                    score = subPropNumberValue * 2.0;
                    break;
                // 異常マスタリー
                case PROP_NAME.ANOMALY_PROFICIENCY:
                    score = (48.0/92.0) * subPropNumberValue;
                    break;
            }
            return Math.floor(score * 100) / 100;
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
            // TODO:ここを取れないあるので、setupでとってからにする
            const skillInfoUl = document.querySelector('.skill-info ul');
            const skillInfoChildUl = skillInfoUl.querySelector('.skill-item');
            const skillInfoContentUl = skillInfoChildUl.querySelector('div');
            const copiedUl = skillInfoUl.cloneNode(true);
            copiedUl.className = '';
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
            // 子要素用のスタイル
            const lis = copiedUl.querySelectorAll('li');
            const liStyle = window.getComputedStyle(skillInfoChildUl);
            const allowedPropertiesForChild = 
            ['height', 'width', 'padding', 'border', 'margin',
                'align-items', 'color', 'display', 'border-radius', 'border', 'background'];
                let totalScores = 0;
                for(let index = 0; index < lis.length; index++){
                    const li = lis[index];
                    li.className = '';
                    // 子要素にスタイル適用
                    for (let property of allowedPropertiesForChild) {
                        li.style[property] = liStyle.getPropertyValue(property);
                    }
                    // 内容を作成
                    const content = document.createElement('div');
                    const driverInfo = driverInfoList[index];
                    content.style.color = 'white';
                    if (driverInfo) {
                        console.log('内容作成開始');
                        // ヘッダー：アイコン,タイトル,レベル
                        const contentHeaderElement = document.createElement('div');
                        contentHeaderElement.classList.add('alk-driver-content');
                        contentHeaderElement.style.display = 'flex';
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
                        // タイトル背景画像
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
                        driverLevelElement.textContent = driverInfo.driverLevel;
                        titleElement.appendChild(driverLevelElement);
                        contentHeaderElement.appendChild(titleElement);
                        // サブステータス
                        const subPropListElement = document.createElement('div');
                        subPropListElement.style.display = 'flex';
                        subPropListElement.style.flexDirection = 'column';
                        subPropListElement.style.overflow = 'hidden';
                        subPropListElement.style.whiteSpace = 'nowrap';
                        const subPropNameAndValues = driverInfo.subPropNameAndValues;
                        let scores = 0
                        subPropNameAndValues.forEach(subProp => {
                            const subPropElement = document.createElement('div');
                            subPropElement.style.overflow = 'hidden';
                            subPropElement.style.whiteSpace = 'nowrap';
                            // ステータス名
                            const subPropNameElement = document.createElement('span');
                            subPropNameElement.textContent = subProp.name;
                            subPropNameElement.style.float = 'left';

                            // 数値
                            const subPropValueElement = document.createElement('span');
                            subPropValueElement.textContent = subProp.value;
                            subPropValueElement.style.float = 'right';
                            // 生成
                            subPropElement.appendChild(subPropNameElement);
                            subPropElement.appendChild(subPropValueElement);
                            subPropListElement.appendChild(subPropElement);

                            scores += getScore(subProp.name, subProp.value);
                        });
                        totalScores += scores;
                        content.appendChild(contentHeaderElement);
                        content.appendChild(subPropListElement);
                        // 合計
                        const totalElement = document.createElement('div');
                        const totalNameElement = document.createElement('span');
                        totalNameElement.textContent = 'スコア';
                        totalNameElement.style.float = 'left';
                        const totalValueElement = document.createElement('span');
                        totalValueElement.textContent = scores.toFixed(2);
                        totalValueElement.style.float = 'right';
                        // 生成
                        totalElement.appendChild(totalNameElement);
                        totalElement.appendChild(totalValueElement);
                        content.appendChild(totalElement);
                    } else {
                        // content.textContent = `ドライバー(${index + 1})は空っぽ`;
                    }
                    // 内容にスタイルを適用
                    const allowedPropertiesForContent = 
                        ['background', 'width', 'height', 'border', 'margin', 'border-radius'];
                    for (let property of allowedPropertiesForContent) {
                        content.style[property] = contentStyle.getPropertyValue(property);
                    }
                    content.style.padding = '6px 6px 6px 6px';
                    li.appendChild(content);
                }
            mainFrameElement.append(copiedUl);
            parentElement.append(mainFrameElement);
            
            // 合計
            const driverScoreElement = document.createElement('div');
            driverScoreElement.textContent = `ドライバーの合計スコア:${totalScores.toFixed(2)}`;
            driverScoreElement.style.color = 'white';
            driverScoreElement.style.textAlign = 'right';
            driverScoreElement.style.padding = copiedUl.style.padding;
            mainFrameElement.prepend(driverScoreElement);
        }


        // 加算対象のチェックボックス描画
        function drawConfig(){
            // 念のため削除
            document.querySelectorAll(`.${MY_CHECK_BOX_CLASS}`)?.forEach(element => {
                element.remove();
            });
            // チェックボックスを6つ作成
            const container = document.createElement('div');
            const propKeyAndNames = Object.entries(PROP_NAME);
            for (let i = 0; i < propKeyAndNames.length; i++) {
                const propKeyAndName = propKeyAndNames[i];
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `checkbox${i}`;
                checkbox.classList.add(MY_CHECK_BOX_CLASS);
                checkbox.classList.add(`${propKeyAndName[0]}`);
                const label = document.createElement('label');
                label.htmlFor = `checkbox${i}`;
                label.textContent = propKeyAndName[1];
                label.style.color = 'white';
                container.appendChild(checkbox);
                container.appendChild(label);
                container.appendChild(document.createElement('br'));
            }
            // 仮の親
            const parentElement = document.querySelector('.equipment-info');
            parentElement.appendChild(container);

            // すべてのチェックボックスにイベントリスナーを追加
            for (let i = 0; i < propKeyAndNames.length; i++) {
                const checkbox = document.getElementById(`checkbox${i}`);
                checkbox.addEventListener('change', () => {
                    saveTargetProp();
                    drawScore();
                });
            }
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
                            console.log('キャラが変更された');
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
            // セット効果がないなら装備なしとみなす
            const stopCondition = () => 
                !!document.querySelector('.empty-content');
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
            await tryCacheDriverInfoList();
            characterInfoElement = await waitForElement('.role-detail-container');
            // 変更監視開始
            setObservers();
            // 自作チェックボックスが変更されたら、計算処理だけ再度行う

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
    
        console.log('拡張処理開始');
        firstDraw();
    };