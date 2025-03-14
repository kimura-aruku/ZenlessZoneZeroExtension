

window.onload = () => {
    const MY_CLASS = 'alk-element';
    // 画面にチェックボックスを追加し、UID+キャラクターごとに追加ステータスを記憶する
    // 上記はchrome.storage.localで実現する
    // 最初に画面を開いたとき、キャラを切り替えたときに各ドライバをクリックして画面表示+ステータスをキャッシュ
    // 自作チェックボックスの内容で計算
    // 自作チェックボックスが変更されたらキャッシュしたステータスで計算
    
    // ポップアップの親
    /** @type {HTMLElement | null} */
    let roleDetailElement;

    // ポップアップ監視オブジェクト
    let roleDetailElementObserver;

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

    // サブステータスの数が足りないとき、空行でスコアの位置を揃える
    
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
    
    function waitForElementsInternal(selector, isSingleElement = true, validate = (el) => !!el, 
        options = { childList: true, subtree: true, attributes: true }) {
            return new Promise((resolve, reject) => {
                const anyObserver = new MutationObserver((mutationsList, observer) => {
                    const elements = isSingleElement ? document.querySelector(selector) : document.querySelectorAll(selector);
                    if (elements && (validate == null || validate(elements))) {
                        observer.disconnect();
                        resolve(elements);
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
            options = { childList: true, subtree: true, attributes: true }) {
            return waitForElementsInternal(selector, true, validate, options);
        }

        // 汎用的な要素待機関数（複数要素）
        function waitForElements(selector, validate = (el) => !!el, 
            options = { childList: true, subtree: true, attributes: true }) {
            return waitForElementsInternal(selector, false, validate, options);
        }

        // ドライバ情報のキャッシュ
        async function cacheDriverInfo(driverIndex){
            const popupContentElement = await waitForElement('.popup-content', null);
            const driverInfo = {};
            driverInfo.iconSource = popupContentElement
                .querySelector('img')?.getAttribute('src');
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
                // 直下に span が2つだけある場合
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
        
        // 描画
        function draw(){
        }
    
        // 非同期処理を分離
        async function reDraw() {
            draw();
        }
    
        // 最初に実行
        async function setup(){
            const equipInfoElements = await waitForElements('.equip-info', 
                (els) => Array.from(els).some(el => el.querySelector('.bg')));
            roleDetailElement = document.querySelector('.role-detail');
            // ドライバを装備しているかどうか
            const equipDriverList = Array.from(equipInfoElements)
                .map(el => !!el.querySelector('.bg'));
            // TODO:装備しているドライバがないなら、キャラ変更監視だけ行う
            const isNothingEquipped = equipDriverList.every(value => value === false);
            
            // .equip-infoで要素を取得できたらボタンを押す->情報取得->閉じる の繰り返し
            equipDriverList.forEach((equipDriver, index) => {
                if (equipDriver) {
                    equipInfoElements[index].click();
                    cacheDriverInfo(index);
                } else {
                    driverInfoList[index] = null;
                }
            });
            console.log('遺物情報取得完了');
            console.log(driverInfoList);
            // 情報を全部取り終えたら画面を作る

            // キャラが変更されたら上記処理を再度行う

            // 自作チェックボックスが変更されたら、計算処理だけ再度行う



    
            // 変更監視開始
            // setObservers();
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