# CLAUDE.md

このファイルは、このリポジトリで作業する際にClaude Code (claude.ai/code) にガイダンスを提供します。

## プロジェクト概要

これはゼンレスゾーンゼロ用のChrome拡張機能で、HoYoLabのエージェント詳細ページ (https://act.hoyolab.com/app/zzz-game-record/index.html) でキャラクターのドライバスコアを計算・表示します。この拡張機能は、一般的な1:2:1の比率ではなく、正確なスコア計算式（会心ダメージ : 会心率 : 攻撃力%/HP% = 1 : 2 : 1.6）を使用します。

## アーキテクチャ

### コアファイル
- `manifest.json` - Chrome拡張機能マニフェスト (Manifest V3)
- `content.js` - HoYoLabページで実行されるメインコンテンツスクリプト
- `README.md` - 日本語のプロジェクトドキュメント

### 主要コンポーネント

#### 拡張機能構造
- **コンテンツスクリプト**: `https://act.hoyolab.com/app/zzz-game-record/index.html*` に注入
- **権限**: キャラクターごとのユーザー設定保存に`storage`権限を使用
- **実行**: 早期注入を確実にするため`document_start`で実行

#### 主要機能 (content.js)
- **ドライバ情報キャッシュ**: UIからドライバディスク情報を自動抽出
- **スコア計算**: 異なるステータスタイプに対する正確なスコア算出アルゴリズムの実装
- **UI拡張**: 元のページにスコア表示とステータス選択チェックボックスを追加
- **データ永続化**: Chrome storage APIを使用してキャラクターごとのステータス選択設定を保存

#### 主要クラスと定数
- `MY_CLASS`: 'alk-element' - メイン要素のクラスプレフィックス
- `MY_OVERLAY_ID`: 'alk-overlay' - オーバーレイ要素ID
- `MY_CHECK_BOX_CLASS`: 'alk-check-box' - チェックボックス要素クラス
- `PROP_NAME`: ステータス名マッピングを含むオブジェクト (HP, ATK, DEF, CRIT_RATE, CRIT_DMG, ANOMALY_PROFICIENCY)

#### コア関数
- `tryCacheDriverInfoList()`: ゲームUIからドライバディスクデータを抽出
- `getScoreAndHitCount()`: ステータスタイプと値に基づいてスコアを計算
- `drawScore()`: スコア表示要素をレンダリング
- `drawConfig()`: ステータス選択チェックボックスを作成
- `saveTargetProp()`: ユーザー設定をChromeストレージに保存

## 開発ノート

### ビルドプロセスなし
これはビルドツール、package.json、依存関係のないシンプルなChrome拡張機能です。すべてのコードはバニラJavaScriptです。

### インストール
Chromeの開発者モードでプロジェクトフォルダを選択し、パッケージ化されていない拡張機能として読み込みます。

### テスト
以下の手順でテスト:
1. Chrome拡張機能を読み込み
2. HoYoLab ZZZエージェント詳細ページに移動
3. スコア計算が正しく表示されることを確認
4. ページリロード間でのステータス選択の永続化をテスト

### UI統合
拡張機能は以下の方法で元ページのスタイリングを慎重に模倣:
- 既存の要素から計算されたスタイルを抽出
- カラースキームとフォントをキャッシュ
- ゲームのUIテーマとの視覚的一貫性を維持

### データフロー
1. ページ読み込み → ドライバ情報抽出
2. ユーザーがステータス選択 → Chromeストレージに保存
3. スコア計算 → UI更新
4. キャラクター変更 → 設定を再読み込みして再計算

### ブラウザ互換性
Manifest V3とChrome storage APIを使用してChromeに特化して設計されています。

## 改善点

### 設計面の改善点
- **モジュール化**: 現在すべてのコードが単一のファイル内の即座実行関数に含まれている。機能別にクラスやモジュールに分割することで保守性が向上する
- **定数管理**: マジックナンバー（スコア計算の係数、タイムアウト値など）を定数として分離し、設定可能にする
- **エラーハンドリング**: try-catch文の範囲が限定的。より包括的なエラーハンドリングとユーザーへのフィードバック機能が必要
- **依存性分離**: DOM要素への直接依存が多い。セレクターやスタイル情報を設定として外部化することで、ゲームのUI変更に対する耐性を向上

### パフォーマンス面の改善点
- **DOM操作の最適化**: `drawScore()`関数内でDOM要素を大量に作成している。DocumentFragmentの使用やバッチ処理による改善が可能
- **メモリリーク対策**: MutationObserverやイベントリスナーの適切な解放処理が不足している
- **不要な再計算削減**: スタイルキャッシュは初期化時のみだが、キャラクター変更時に不要な再取得を行っている可能性
- **非同期処理の改善**: `waitForElement`関数のタイムアウト処理をより効率的に実装できる

### 機能面の改善点
- **国際化対応**: 現在日本語のみ対応。多言語サポートの実装が将来的に必要
- **設定UI**: スコア計算式の係数をユーザーが調整できるオプション画面の追加
- **データ検証**: Chrome storageから読み込んだデータの妥当性チェック機能
- **アクセシビリティ**: キーボードナビゲーションやスクリーンリーダー対応

### コード品質の改善点
- **TypeScript化**: JSDocは使用されているが、完全なTypeScript化により型安全性を向上
- **テスト実装**: 自動テストフレームワークの導入とユニットテスト・E2Eテストの実装
- **リンター設定**: ESLintやPrettierによるコード品質の統一
- **ドキュメント拡充**: 関数レベルのドキュメントとアーキテクチャ図の追加

## 技術詳細

### 描画フロー

#### 初期化フロー
1. **window.onload** → `firstDraw()`呼び出し
2. **setup()** → ドライバ情報キャッシュと色情報取得
   - `tryCacheDriverInfoList()`: 各ドライバをクリックして情報を抽出
   - 色情報キャッシュ (`activeItemColor`, `headerBackgroundColor`)
   - `waitForElement('.role-detail-container')`: キャラ要素待機
3. **setObservers()** → MutationObserver設定
4. **drawConfig()** → チェックボックス生成
5. **loadAndSetTargetPropNamesObject(drawScore)** → 保存済み設定読み込み後にスコア描画

#### 再描画フロー (キャラクター変更時)
1. **MutationObserver callback** → backgroundスタイル変更を検知
2. **reDraw()** → `tryCacheDriverInfoList()` → `drawConfig()` → `loadAndSetTargetPropNamesObject(drawScore)`

#### UI更新フロー (チェックボックス操作時)
1. **checkbox click** → `changeCheckbox()` → `saveTargetProp()` → `drawScore()`

### 監視・検知方法

#### キャラクター変更検知
- **監視対象**: `.role-detail-container`要素のstyle属性
- **検知条件**: background プロパティの変更
- **実装**: MutationObserver (attributeFilter: ['style'])
- **コールバック処理**: background値比較による変更判定

#### 要素待機システム
- **汎用関数**: `waitForElement()`, `waitForElements()`
- **タイムアウト**: 10秒 (10000ms)
- **監視オプション**: `{ childList: true, subtree: true, attributes: true }`
- **停止条件**: カスタム条件関数による早期終了

#### ドライバ装備状態検知
- **装備判定**: `.equip-info .bg`要素の存在
- **未装備判定**: `.empty-content`存在 + `.role-avatar-container img`完了 + `.equip-info .bg`不在
- **バリデーション**: `validateEquipInfoElements()`による要素検証

### セレクター依存関係

#### 言語検知
- `.mhy-hoyolab-lang-selector__current-lang` → 言語設定取得

#### ドライバ情報抽出
- `.role-detail-popup.equip-popup` → ポップアップコンテナ
- `.popup-content img` → ドライバアイコン
- `.popup-content p` → 名前・レベル要素
- `.base-attrs span` → メインステータス
- `.upper-attrs div` → サブステータス
- `.close-icon` → ポップアップ閉じボタン

#### UI描画・配置
- `.equipment-info` → メイン親要素
- `.skill-info ul` → スタイル参照元
- `.skill-item` → リスト項目スタイル
- `.property-info` → 色情報取得
- `.base-add-prop span` → アクティブ色取得
- `.equipment-info h2` → ヘッダ背景色取得
- `.nickname` → キャラクター名取得

#### 装備状態判定
- `.equip-info` → 装備スロット (×6)
- `.bg` → 装備済み判定用要素
- `.empty-content` → 未装備状態表示
- `.role-avatar-container img` → キャラクター画像

### アーキテクチャ構造

#### データ層
```
driverInfoList[] → キャッシュされたドライバ情報
  ├─ iconSource: string
  ├─ driverName: string  
  ├─ driverBackgroundImage: string
  ├─ driverLevel: string
  ├─ mainPropName: string
  ├─ mainPropValue: string
  └─ subPropNameAndValues[]
     ├─ name: string
     └─ value: string
```

#### スタイルキャッシュ
```
titleStyleObject → タイトル用スタイル
itemStyleObject → 項目用スタイル  
captionStyleObject → キャプション用スタイル
itemShapeStyleObject → アイテム形状用スタイル
activeItemColor → アクティブ項目色
headerBackgroundColor → ヘッダ背景色
```

#### 監視システム
```
characterInfoElement → 監視対象要素
characterInfoElementObserver → MutationObserver
  └─ callback() → 変更検知時の処理
```

#### 設定管理
```
Chrome Storage Local
  └─ [characterName]: targetPropsObject
     ├─ HP: boolean
     ├─ ATK: boolean  
     ├─ DEF: boolean
     ├─ CRIT_RATE: boolean
     ├─ CRIT_DMG: boolean
     └─ ANOMALY_PROFICIENCY: boolean
```

### スコア計算ロジック

#### hitCount（強化回数）について
`hitCount`はドライバディスクの強化回数を表します。ゼンレスゾーンゼロでは強化による各ステータスの伸び幅が固定値のため、現在の値を1回あたりの強化値で割ることで強化回数を算出できます。この強化回数は、ドライバの品質評価やポテンシャル判断の重要な指標となります。

#### 基本係数
- **攻撃・HP**: score = value * 1.6, hitCount = value / 3.0 (強化1回あたり3.0%上昇)
- **会心ダメージ・防御**: score = value * 1.0, hitCount = value / 4.8 (強化1回あたり4.8%上昇)
- **会心率**: score = value * 2.0, hitCount = value / 2.4 (強化1回あたり2.4%上昇)
- **異常マスタリー**: score = value * (48/92), hitCount = value / 9.0 (強化1回あたり9.0上昇)

#### 実数値処理 (% がない場合)
実数値の場合は、各ステータスの基礎値からの増加分を1回あたりの強化値で割って強化回数を算出:
- **HP**: hitCount = round(value / 112.0) - 1 (強化1回あたり112上昇)
- **攻撃**: hitCount = round(value / 19.0) - 1 (強化1回あたり19上昇)
- **防御**: hitCount = round(value / 15.0) - 1 (強化1回あたり15上昇)
- **貫通値**: hitCount = round(value / 9.0) - 1 (強化1回あたり9上昇)

## 注意事項

- この改善点リストはプロジェクトの更新に応じて随時見直し・更新を行う
- 実装時は既存機能への影響を最小限に抑えた段階的な改善を推奨
- ゲームUIの変更に伴うセレクター更新が必要な場合は、この文書の技術的詳細も併せて更新する