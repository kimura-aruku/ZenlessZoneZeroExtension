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