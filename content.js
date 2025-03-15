

window.onload = () => {
    const MY_CLASS = 'alk-element';
    const MY_OVERLAY_ID = 'alk-overlay';
    // 画面にチェックボックスを追加し、UID+キャラクターごとに追加ステータスを記憶する
    // 上記はchrome.storage.localで実現する
    // 最初に画面を開いたとき、キャラを切り替えたときに各ドライバをクリックして画面表示+ステータスをキャッシュ
    // 自作チェックボックスの内容で計算
    // 自作チェックボックスが変更されたらキャッシュしたステータスで計算
    
    // ドライバ情報リスト
    /** @type {Array<{
     *  iconSource: string, 
     *  driverName: string, 
     *  driverRarityClassName: string,
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
            const popupContentElement = await waitForElement('.popup-content', null);
            const driverInfo = {};
            driverInfo.iconSource = popupContentElement.querySelector('img')?.getAttribute('src');
            const nameAndLevelElement = popupContentElement.querySelectorAll('p');
            driverInfo.driverName = nameAndLevelElement[0].textContent.trim();
            driverInfo.driverRarityClassName = nameAndLevelElement[0].className;
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

        const PROP_NAME = Object.freeze({
            HP: 'HP',
            ATK: '攻撃力',
            DEF: '防御力',
            CRIT_RATE: '会心率',
            CRIT_DMG: '会心ダメージ',
            ANOMALY_PROFICIENCY: '異常マスタリー'
        });

        function getActivePropNames(){
            // TODO: チェックボックス（ストレージ）に保存した値を返すように修正
            return [PROP_NAME.ATK, PROP_NAME.CRIT_RATE, PROP_NAME.CRIT_DMG];
        }

        // スコアにして返す
        function getScore(subPropName, subPropValue){
            // 無効な項目
            if(!getActivePropNames().includes(subPropName)){
                return 0;
            }
            // 実数かパーセントか判断できない状態
            const isRealOrPercent = [PROP_NAME.HP, PROP_NAME.ATK, PROP_NAME.DEF]
                .includes(subPropName);
            // 実数
            if(isRealOrPercent && !subPropValue.includes('%')){
                return 0;
            }
            subPropValue = subPropValue.replace(/[%+]/g, '').trim();
            let score = 0;
            switch (subPropName) {
                // 攻撃、HP
                case PROP_NAME.HP:
                case PROP_NAME.ATK:
                    score = subPropValue * 1.6;
                // 会心ダメージ、 防御
                case PROP_NAME.CRIT_DMG:
                case PROP_NAME.DEF:
                    score = subPropValue;
                // 会心率
                case PROP_NAME.CRIT_RATE:
                    score = subPropValue * 2.0;
                // 異常マスタリー
                case PROP_NAME.ANOMALY_PROFICIENCY:
                    score = (48.0/92.0) * subPropValue;
            }
            return Math.floor(score * 100) * 0.01;
        }
        
        // 描画
        function draw(){
            // 念のため削除
            document.querySelectorAll(`.${MY_CLASS}`)?.forEach(element => {
                element.remove();
            });
            // とりあえず親にする要素
            const parentElement = document.querySelector('.equipment-info');
            const mainFrameElement = document.createElement('div');
            mainFrameElement.classList.add(MY_CLASS);
            let totalScores = 0;
            driverInfoList.forEach((driverInfo, index) => {
                const driverScoreElement = document.createElement('div');
                driverScoreElement.style.height = '20px';
                if (driverInfo) {
                    const subPropNameAndValues = driverInfo.subPropNameAndValues;
                    let scores = 0
                    subPropNameAndValues.forEach(subProp => {
                        scores += getScore(subProp.name, subProp.value);
                    });
                    totalScores += scores;
                    driverScoreElement.textContent = `ドライバー(${index + 1})のスコア:${scores.toFixed(2)}`;
                } else {
                    driverScoreElement.textContent = `ドライバー(${index + 1})は空っぽ`;
                }
                driverScoreElement.style.color = 'white';
                mainFrameElement.appendChild(driverScoreElement);
            });
            // 合計
            const driverScoreElement = document.createElement('div');
            driverScoreElement.textContent = `ドライバーの合計スコア:${totalScores.toFixed(2)}`;
            driverScoreElement.style.color = 'white';
            mainFrameElement.appendChild(driverScoreElement);
            // 生成
            parentElement.style.height = 'auto';
            parentElement.append(mainFrameElement);
        }
    
        // 非同期処理を分離
        async function reDraw() {
            const isValid = await tryCacheDriverInfoList();
            if(isValid){
                draw();
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
        const callback = (mutationsList, observer) => {
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
                        reDraw();
                    }
                } 
            }
        };

        // 画面を開いてドライバ情報を取得（終わったら戻る）
        async function tryCacheDriverInfoList(){
            // bg要素を取得できれば完了
            const validateEquipInfoElements = (els) => 
                Array.from(els).some(el => el.querySelector('.bg'));
            // ステータスにプラスがなく、かつセット効果がないなら装備なしとみなす
            const stopCondition = () => 
                !!document.querySelector('.base-add-prop') && 
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
                draw();
            } catch (error) {
                console.error('エラー:', error);
            }
        }
    
        console.log('拡張処理開始');
        firstDraw();
    };