# RONLENS（論レンズ）

論文固有の概念をひらき、日本語の説明・図・原典を行き来するWebサイトです。
実論文に基づく日本語解説と、操作を試せる**架空デモ**を区別して掲載しています。論文A・B・Cの原稿と引用は創作です。論文取得の自動化は行いません。

## 使える画面

| 画面 | 操作 |
| --- | --- |
| ホーム `/` | プリズムの7視点、検索、論文カード、保存 |
| 一覧 `/library` | 語句・タグ検索、並び替え、条件の保存、0件からの回復 |
| 実論文の解説 `/articles/{slug}` | 9記事。条件・結果・限界・用語マップ、出版・改訂・訂正確認の記録、原文へのリンク |
| 詳細 `/paper/demo-retrieval` | 概念の選択・枝の開閉、親・同階層・全体図、説明・用語・架空原典 |
| つながり `/network` | 実論文の確認済み引用2本と、別枠の架空引用2本・編集関連1本 |
| 保存 `/saved` | 保存論文、閲覧履歴、保存した検索からの再開 |
| 案内 `/help` | 読む順序、操作方法、デモと保存の範囲 |
| 404 | 未収録ページから検索・ホームへ戻る |

7視点はホームのアイキャッチだけに使います。論文の構造は各原稿固有です。
引用は実線矢印、編集上の関連は点線と説明で区別します。

## 起動と検証

Node.js 20以降とnpmを使用します。実行時の外部ライブラリやAPIキーは不要です。

```sh
npm ci --ignore-scripts
npm run check
npm run build:site
npm run dev
# http://127.0.0.1:4183
```

Chromeをインストール済みの環境で、`npm run test:browser` が専用ポート4184を使って操作試験を実行します。
`npm run build:site` は `site/` にページ・ES Modules・画像・404を出力します。
Vercelのビルド設定は [vercel.json](vercel.json) にあります。

比較用の画面は `BASE_URL=http://127.0.0.1:4183 node scripts/capture-site.mjs ../evidence` で撮影できます。
参照原本やローカル検証ログは公開出力に含めません。ホームの承認デザイン画像は装飾素材として使っています。

## 実装の境界

| ファイル | 責務 |
| --- | --- |
| [model.ts](src/model.ts)、[catalog.ts](src/catalog.ts) | 架空論文・概念・引用・編集関連の契約と入力検証 |
| [reader.ts](src/reader.ts) | 展開、選択、論文移動、履歴復元 |
| [search.ts](src/search.ts) | NFKC正規化、語句・タグのAND検索、並び順 |
| [workspace.ts](src/workspace.ts) | 検索と保存の状態遷移 |
| [storage.ts](src/storage.ts) | localStorageの読込・保存・復元と破損保護 |
| [research-catalog.ts](src/research-catalog.ts)、[recent-articles.ts](src/recent-articles.ts)、[research-article.ts](src/research-article.ts) | 出典確認済み解説と、原論文・サイト解説を分ける契約 |
| [research-reader.ts](src/research-reader.ts)、[research-view.ts](src/web/research-view.ts) | 実記事の検索・概念選択・独立したローカル保存と表示 |
| [home-demo.ts](src/web/home-demo.ts) | 公開UIの架空3論文・15概念・3関係 |
| [home.ts](src/web/home.ts)、[app.ts](src/web/app.ts) | ページ、URL、履歴、フォーカスの接続 |
| [diagrams.ts](src/web/diagrams.ts) | 概念図、全体ミニマップ、説明図 |

- 概念の深い位置を選ぶと祖先を開きます。選択した子を含む枝を閉じると、その親へ選択を戻します。隠れた枝の内部状態は保持します。
- 別論文へ移動して戻ると、選択概念・展開・ブラウザ履歴のスクロール位置を復元します。閲覧履歴も位置から再開できます。
- 保存先はこのブラウザのlocalStorageだけです。アカウント、サーバー送信、端末間同期はありません。
- 保存論文・保存検索・検索条件・閲覧履歴を版付きで保存します。読書履歴と保存検索はそれぞれ100件までです。
- 破損JSON・非対応版は自動で上書きしません。保存拒否・容量不足・別タブ競合は画面に通知します。localStorage自体にはトランザクションがないため、同時更新の完全な排除は保証しません。
- 引用抜粋が架空原稿内に存在すること、親子の循環・孤立・論文跨ぎがないことを検証します。架空カタログでは実論文メタデータを受け付けません。実論文解説は別の契約と保存領域を使います。

## デザインと検証記録

承認参照6枚の実画素を確認し、ロゴA・ホームv3・詳細v2を優先して実装しています。
合成モックの端末枠を除いた内容領域と同寸法・DPR1で比較しています。
保存・履歴・案内・空状態は専用の完成参照がないため、承認画面の部品で補完した領域です。

[全画面の検証記録](docs/full-site-verification.md)に、比較条件・機能検証・残る差を記載します。
[基盤検証](docs/verification.md)と[初期ホーム検証](docs/home-verification.md)は当時の履歴です。

[実論文解説の仕様と検証](docs/research-article-handoff.md)に、出典と公開の境界を記載しています。


## 2026-10-26の追加記事

10月公開の研究から、AIと学習・情報の理解に関わる3本を選びました。公開日順の上位3本や、研究全体を網羅する選定ではありません。いずれもarXivのv1を読み、確認時点で査読済みの掲載は確認できていません。既存の記憶研究の記事は保持しています。

- `/articles/ai-confidence-indicators-and-trust` — 信頼性表示と主観評価
- `/articles/gelli-generated-language-practice` — 語彙・自信・発話を分ける比較
- `/articles/expert-verified-ai-study-materials` — 教材へのアクセスと成績分布

各記事の保存・履歴・概念の展開は別々です。既存記事の保存キーは変更しません。
原文PDFや調査用の全文ファイルは公開repo・出力に含めず、原文へのリンクを置きます。
調査と検証の詳細は [追加記事の検証記録](docs/recent-articles-verification.md) を参照してください。

## 分野を広げた5記事

医療・健康、心理学、経済、自然科学、環境から、全文を読める研究を選びました。新しさだけを基準にせず、初学者が研究の問い・方法・結果・限界をたどれる形にしています。

- `/articles/recovery-dexamethasone-who-benefits` — 対象集団と医療効果の数字
- `/articles/many-smiles-facial-feedback` — 表情と感情、方法ごとの再現性
- `/articles/cash-transfers-and-local-spillovers` — 家計への給付と地域への波及
- `/articles/how-ligo-detected-gravitational-waves` — 観測・雑音評価・モデルによる推定
- `/articles/where-plastic-waste-goes` — 累積廃棄物の分母と条件付き外挿

分野別フィルタとDOI検索に対応しています。原文の出版・版情報と、訂正・撤回・追研究を確認した範囲を明示します。調査資料を読んだことを原データ再解析と呼びません。
[選定・読解範囲・検証記録](docs/fields-articles-verification.md)を参照してください。
