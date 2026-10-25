# 非視覚的な基盤の検証記録

この記録は初回の基盤完成時点のもの。2026-10-25に取得したホーム画像とブラウザ実装の追加検証は [ホーム検証記録](home-verification.md) を参照する。

- [要点](#要点)
- [環境](#環境)
- [検証範囲](#検証範囲)
- [未検証と制限](#未検証と制限)
- [関連資料](#関連資料)

## 要点

2026-10-24に非視覚的な基盤を実装した。
開発者と独立担当が型検査・ビルド・69件のテストを実行し、成功した。
独立担当の追加6件も成功し、通常のテストへ取り込んだ。
統合後の最終確認では型検査・ビルド・合計75件が成功した。

## 環境

- Node.js 21.6.1
- npm 10.2.4
- TypeScript 5.9.3（固定）
- テスト: Node標準test runner
- 永続化: メモリ上のlocalStorage互換アダプター
- 外部API・実論文取得・外部サービス書込み: なし

## 検証範囲

| 範囲 | 開発者確認 | 証拠 |
| --- | --- | --- |
| 架空データ・引用・編集関連の契約 | pass | catalog.test.mjs |
| 親子・循環・原稿との引用抜粋の一致 | pass | catalog.test.mjs |
| 選択・展開・親・同階層・全体ノード | pass | reader.test.mjs |
| 戻る・進む・連続操作・履歴上限 | pass | reader.test.mjs |
| 検索・保存検索・保存論文・空状態 | pass | search-workspace.test.mjs |
| 保存後の新しいstoreでの履歴復元 | pass | storage.test.mjs |
| 破損・将来版・容量不足・競合 | pass | storage.test.mjs |
| strict型検査・JS/型宣言ビルド | pass | npm run check |
| 独立レビュー | pass（非視覚的基盤の範囲） | independent-foundation.test.mjs |

独立レビューで、NFKC正規化後に検索語・タグが文字数上限を超え、受理した検索を保存できない不具合を再現した。
正規化後の上限検査を追加し、受理済み検索の再パースと保存・復元で修正を確認した。
追加検証は深い非7分類ツリー、同一論文への再訪、書込み後例外、現在論文削除時の復元、JSON形入力を含む。
1,000回の決定的な混合操作では、選択の可視性・過去snapshotの不変・保存復元の一致も確認した。

## 未検証と制限

- 実画像の閲覧と忠実なUI実装はblocked。
- 実ブラウザのlocalStorage、History API、URL、スクロール復元はnot_run。
- PC・モバイルの表示、アクセシビリティ、スクリーンショット比較はnot_run。
- GitHubへのrepo作成・push、Vercel公開はnot_run。
- localStorageの競合検出は比較後の同時書込みまで原子的には保護しない。
- office-development / office-testingの引継ぎ手順を使用した。
- 両スキルから参照されたorbit:software-engineeringは、現在のクラウド・ローカルスキル一覧を全ページ検索しても見つからなかった。実行場所は本人の専用ローカル環境指定に従った。

## 関連資料

- [README](../README.md)
- [データ契約テスト](../tests/catalog.test.mjs)
- [読書状態テスト](../tests/reader.test.mjs)
- [検索・保存テスト](../tests/search-workspace.test.mjs)
- [保存・復元テスト](../tests/storage.test.mjs)
- [独立担当の追加テスト](../tests/independent-foundation.test.mjs)
- [混合操作の不変条件](../tests/invariants.test.mjs)
