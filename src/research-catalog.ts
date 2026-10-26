import type { ResearchExplainerContent } from './research-article.js';
import { retrievalArticle, retrievalResults, researchGlossary, readingSteps } from './retrieval-article.js';
import { trustArticle, gelliArticle, materialsArticle } from './recent-articles.js';
import { deepFreeze } from './model.js';
export interface ResearchTable {
  readonly sectionId: string;
  readonly label: string;
  readonly caption: string;
  readonly columns: readonly string[];
  readonly rows: readonly (readonly string[])[];
}
export interface PublishedExplainer {
  readonly article: ResearchExplainerContent;
  readonly cardSteps: readonly [string, string, string];
  readonly glossary: readonly { readonly id: string; readonly english: string; readonly meaning: string }[];
  readonly tables: readonly ResearchTable[];
  readonly steps?: { readonly sectionId: string; readonly items: readonly string[] };
}
export const retrievalExplainer: PublishedExplainer = deepFreeze({
  article: retrievalArticle, cardSteps: ['読む', '閉じて\n思い出す', '後で\n確かめる'], glossary: researchGlossary,
  tables: [{ sectionId: 'delay-method', label: '2006年実験1の結果表', caption: '再現できた意味単位の平均割合 · 2006年 実験1', columns: ['最終テストまでの間隔', '読み返し', '想起練習'], rows: retrievalResults.map(r => [r.delay, r.rereading + '%', r.retrieval + '%']) }],
  steps: { sectionId: 'practice', items: readingSteps },
});
const term = (id: string, english: string, meaning: string) => ({ id, english, meaning });
/** Only source-reviewed published content is registered. content/drafts is never imported. */
export const publishedExplainers: readonly PublishedExplainer[] = deepFreeze([
  { article: trustArticle, cardSteps: ['表示を\n見る', '正誤を\n知る', '評価を\n比べる'], tables: [], glossary: [
    term('indicators', 'factuality indicators', '回答の正しさを判断するために添える表示。信頼度や出典の表示など。'),
    term('confidence', 'confidence', 'AIの回答に添えられた自信の表現。この実験の表示値は条件として操作したもので、モデルの正答確率を測った値ではありません。'),
    term('truth-revelation', 'ground-truth revelation', '研究者が回答の正誤を参加者に伝える手続き。自分で出典を検証する行動とは異なります。'),
    term('perception', 'subjective evaluation', '人がどう評価したかを尋ねること。実際に何を選び、何ができたかとは別の指標です。'),
  ] },
  { article: gelliArticle, cardSteps: ['目標を\n決める', '会話を\n試す', '成果を\n分けて見る'], tables: [{ sectionId: 'findings', label: 'GELLIで測った成果', caption: '本文§6.1.1から独自に整理。差が非有意でも、同等性が証明されたわけではありません。', columns: ['指標', '条件間の比較'], rows: [['語彙（10点満点）', 'GELLI +0.85点、95% CI 0.25〜1.45'], ['会話への自信（5段階）', 'GELLI +0.59、95% CI 0.23〜0.95'], ['発話：課題達成', '差は非有意（p=.43）'], ['発話：語彙・文法の使用', '差は非有意（p=.26）']] }], glossary: [
    term('learning-outcomes', 'learning outcomes', '学習で何が変わったかを測る指標。語彙、自信、発話は同じものではありません。'),
    term('vocabulary', 'vocabulary recall', '意味を手がかりに単語を取り出す課題。日常会話の上達すべてを表すものではありません。'),
    term('transfer', 'transfer', '練習した内容を別の場面で使えること。今回、現実の会話への転移は測っていません。'),
    term('presence', 'presence', 'その場所にいる、相手がそこにいると感じること。この研究では質問紙で測っています。'),
  ] },
  { article: materialsArticle, cardSteps: ['原資料と\n照合', '教材を\n配る', '成績の\n分布を見る'], tables: [{ sectionId: 'findings', label: '授業前半と後半の年度別平均', caption: 'Table 1の平均得点を独自に整理（各部分50点満点、各年度85人）。変化は丸めた平均から算出。', columns: ['授業の部分', '2023/24', '2024/25', '変化'], rows: [['前半：追加教材なし', '35.87', '34.26', '−1.61'], ['後半：後の年度に教材追加', '34.12', '34.85', '+0.73']] }], glossary: [
    term('comparison', 'quasi-experiment', '無作為割当を行わず、比較対象や時期の違いを使って介入との関係を調べる設計。'),
    term('difference-in-differences', 'difference-in-differences', '一方の変化から比較対象の変化を引く方法。介入がなければ同じ傾向で変化したという仮定が必要です。'),
    term('distribution', 'distribution', '得点がどの範囲に、どれだけ集まるか。平均が同じでも分布は異なることがあります。'),
    term('judgement-burden', 'judgement burden', 'AIの出力を学習に使えるか見分けるための知識と手間。著者が提案する概念で、効果の仕組みを確定したものではありません。'),
  ] },
  retrievalExplainer,
]);
export const explainerBySlug = (slug: string): PublishedExplainer | undefined => publishedExplainers.find(item => item.article.slug === slug);
export function explainerAtPath(path: string): PublishedExplainer | undefined {
  if (!path.startsWith('/articles/')) return undefined;
  try { return explainerBySlug(decodeURIComponent(path.slice('/articles/'.length).replace(/\/+$/, ''))); } catch { return undefined; }
}
export const researchCatalogSummary = `実論文${new Set(publishedExplainers.flatMap(e => e.article.papers.map(p => p.id))).size}本を扱う解説${publishedExplainers.length}件と、操作を試せる架空デモ3件`;
