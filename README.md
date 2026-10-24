# RONLENS（論レンズ）

- [要点](#要点)
- [実行方法](#実行方法)
- [実装した範囲](#実装した範囲)
- [使い方](#使い方)
- [状態とデータの境界](#状態とデータの境界)
- [受入条件](#受入条件)
- [画像と公開の保留条件](#画像と公開の保留条件)

## 要点

- 論文を日本語の図解と概念マップで読むサイトの、画面に依存しない基盤である。
- この版は架空デモ専用であり、実在する論文や実引用を収録していない。
- UI、プリズム、ロゴ、座標・色・レイアウトは実装していない。
- 承認済み画像6枚は取得に失敗しており、閲覧・再現・スクリーンショット比較は未実施である。
- GitHubへの作成・push、Vercel公開は行わない。画像確認とQAの後に別工程で進める。

## 実行方法

Node.js 20以降を使用する。
確認環境はNode.js 21.6.1、npm 10.2.4、TypeScript 5.9.3である。

```sh
npm ci --ignore-scripts
npm run check
```

`check`は型検査、JavaScript・型宣言のビルド、Node標準テストを順に実行する。
実行時の外部ライブラリはない。
TypeScriptだけを開発依存として固定している。

| コマンド | 内容 |
| --- | --- |
| npm run typecheck | strict設定の型検査 |
| npm run build | distへのES Modules・型宣言出力 |
| npm test | ビルドと単体・統合テスト |

## 実装した範囲

| ファイル | 責務 |
| --- | --- |
| [model.ts](src/model.ts) | 架空論文、概念、原典、引用、編集関連の契約 |
| [catalog.ts](src/catalog.ts) | 外部入力の検証、ID・親子・原典整合、論文と概念の参照 |
| [demo.ts](src/demo.ts) | 創作した3原稿・9概念・2関係 |
| [reader.ts](src/reader.ts) | 展開・選択、論文移動、戻る・進む、マップの意味情報 |
| [search.ts](src/search.ts) | Unicode正規化、語句・タグ検索、結果と0件の区別 |
| [workspace.ts](src/workspace.ts) | 保存論文・保存検索・現在の検索・履歴の状態遷移 |
| [storage.ts](src/storage.ts) | localStorage互換アダプター、復元、破損保護、変更競合の検出 |

## 使い方

```ts
import {
  createDemoCatalog, createWorkspace, transitionWorkspace,
  readerContext, searchPapers, LocalWorkspaceStore,
} from "./dist/index.js";

const catalog = createDemoCatalog();
let state = createWorkspace(catalog);

state = transitionWorkspace(catalog, state, {
  type: "reader",
  action: {
    type: "open-paper",
    paperId: "demo-paths",
    conceptId: "paths-return",
  },
}).state;

const context = readerContext(catalog, state.reader);
const results = searchPapers(catalog, {
  text: "位置 保持",
  tags: ["学び"],
  sort: "relevance",
});

// 将来のUIではブラウザのlocalStorageを渡せる。
// localStorageへのアクセス自体が拒否される場合も呼び出し側で扱う。
const store = new LocalWorkspaceStore(catalog, window.localStorage);
const restored = store.load();
// restored.statusを表示に反映してから編集を開始する。
// invalid / unsupported-version / dataset-mismatchを黙って上書きしない。
if (restored.status === "empty") {
  const saved = store.save(state);
  // saved.status === "saved" のときだけ保存成功として扱う。
}
```

`LocalWorkspaceStore`は初回の`load()`後だけ書き込める。
保存失敗の表示と再試行は将来のUIが担当する。
`clear()`は本人が保存データを消す操作を明示したときに呼ぶ。
他アプリのキーは削除しない。

## 状態とデータの境界

### 架空データ

- `Catalog.parse(unknown)`で型と参照関係を検証する。
- データセット・各論文・概念の原典・引用に架空デモの区別を持たせる。
- DOIなど未定義の実論文メタデータは、この版では受け付けない。
- 引用は方向を持ち、引用元概念の架空原稿に抜粋が存在することを検証する。
- 編集上の関連は選定理由を持つ。引用の証拠は持たせず、両端から移動できる。
- 表示用の関係名は`relationshipLabel`から得る。
- 将来、実論文を扱う場合は検証・来歴の別契約が必要である。

### 概念と履歴

- 論文ごとに1つのルートを持つ。親子は同じ論文に閉じ、循環や孤立を拒否する。
- マップは論文固有の概念で構成し、7分類を固定の階層にしない。
- 深い概念を選択すると、そこへ至る祖先を開く。
- 選択概念の祖先を閉じた場合は、その祖先を選択して焦点を保持する。
- 閉じた枝の内部の展開状態は保持する。
- `readerContext`は親・同階層・全体ノード・可視ノード・深さを返す。座標は持たない。
- 別論文への移動時に履歴を追加し、戻る・進むは保存した選択と展開を復元する。
- 同じ論文への連打は履歴を増やさない。戻った後の新しい移動は先の履歴を置き換える。
- 履歴は100件まで保持する。上限超過時は最古の項目から外す。
- ブラウザのURL、History API、スクロール位置との連携は未実装である。

### 検索と保存

- NFKC・小文字化・空白正規化を行う。日本語は部分一致で扱う。
- 空白で分かれた語はAND条件、複数のタグもAND条件である。
- タイトル・要約・タグ・概念名・解説・用語を検索する。
- 保存検索は正規化後の語句・タグ・並び順で重複を防ぐ。上限100件を超えたら明示的な失敗を返す。
- 論文保存は「保存する／解除する」を指定する。連打で意図せず反転させない。
- 現在の検索、保存論文、保存検索、読書履歴を一つの版付きデータに保存する。
- データセット更新で消えた論文・概念は、復元時に警告付きで整理する。読込だけでは書き戻さない。
- 破損JSON、非対応版、別データセットは、明示的な解除まで保護する。
- 読込後に別タブが書き換えた場合は、上書き前の比較で`conflict`を返す。
- localStorageはトランザクションを持たない。比較と書込みの間の同時更新を完全には排除できない。
- テストではlocalStorage互換アダプターを使う。実ブラウザの容量・プライバシー制限は未検証である。

### 空・失敗状態

| 状態 | 返却値 |
| --- | --- |
| 論文データなし | search: empty-catalog |
| 条件に合う論文なし | search: no-matches |
| 検索入力が不正 | search: invalid-query |
| 読書開始前 | reader: empty |
| 保存論文なし | savedPapers: empty |
| 閲覧履歴なし | readingHistory: empty |
| 不明な論文・概念・リンク | transition: not-found |
| 現在の論文から辿れない引用 | transition: not-available |
| 保存なし | load: empty |
| 保存破損・非対応版 | load: invalid / unsupported-version |
| 保存操作の拒否・失敗 | storage-error |
| 読込後に保存内容が変化 | conflict |

## 受入条件

[テスト](tests/)は実際のデータ契約と状態遷移を対象とする。

- 架空デモの表記、親子・引用根拠の整合を検証する。
- 深い概念を選ぶ → 別論文へ移動 → 戻る → 保存 → 新しいstoreから復元 → 進む、を確認する。
- 展開・保存の連打、未知ID、履歴上限、保存検索の上限を確認する。
- 検索の正規化、用語検索、AND条件、0件を確認する。
- 破損データ・将来版・別データセットの保護、容量不足、アクセス拒否、競合を確認する。
- 型検査・ビルド・テストの実行結果は[検証記録](docs/verification.md)に記す。

## 画像と公開の保留条件

承認済みロゴA・ホーム・詳細・一覧・ネットワーク・全体の6画像が必要である。
正本は親作業の取得記録に保持している。
追加取得は行わず、Macの保存予定先を維持する。

```text
../references/
  v3-logo.png
  v3-home.png
  v2-reader.png
  03-library.png
  05-paper-network.png
  01-overview.png
```

ここでの`../references/`は専用repoの親にある作業フォルダであり、現在は空である。
画像取得・目視後に、承認済み構図へのUI実装とPC・モバイル比較を行う。
公開時は予定コミット・remote・Vercel productionの成功を照合する。
