import type { ResearchExplainerContent, SourceReview } from './research-article.js';
import { deepFreeze } from './model.js';

const evidence = (paperId: string, locator: string, supports: string) => ({ paperId, locator, supports, verificationNote: '著者研究室公開の原論文全文を照合。数値・条件は独立した確認も実施。' });
export const retrievalArticle: ResearchExplainerContent = deepFreeze({
  slug: 'retrieval-practice-versus-rereading',
  title: '読み返すより、いったん閉じる？ 「思い出す練習」を論文で確かめる',
  summary: '読み返すことと、資料を閉じて思い出すこと。2006年・2011年の二つの実験から、直後の成績と後に残る学習を分けて見ます。',
  publishedDate: '2026-10-25', readingMinutes: 5, category: '学習・記憶',
  evidenceScope: '大学生による短い科学文章の学習実験',
  audience: '学び方を見直したい初学者', centralQuestion: '読み返すことと、思い出す練習は、後の学習成果にどう関係するか？',
  tags: ['学習・記憶', '想起練習', '自由再生', '遅延テスト', '概念図', 'retrieval practice', 'rereading'],
  authorship: { siteByline: 'RONLENS', productionDisclosure: 'AIを用いて調査・執筆し、原論文との照合と別工程の事実確認を行ったサイト独自の解説です。論文著者による執筆・監修ではありません。', distinction: 'site-authored-explainer-not-original-paper' },
  papers: [
    { id: 'roediger-karpicke-2006', title: 'Test-enhanced learning: Taking memory tests improves long-term retention', authors: ['Henry L. Roediger III', 'Jeffrey D. Karpicke'], year: 2006, venue: 'Psychological Science, 17(3), 249–255', doi: '10.1111/j.1467-9280.2006.01693.x', primaryUrl: 'https://doi.org/10.1111/j.1467-9280.2006.01693.x', fullTextUrl: 'https://learninglab.psych.purdue.edu/downloads/2006/2006_Roediger_Karpicke_PsychSci.pdf', inspectedMaterial: 'full-text', publicationType: 'journal-article' },
    { id: 'karpicke-blunt-2011', title: 'Retrieval practice produces more learning than elaborative studying with concept mapping', authors: ['Jeffrey D. Karpicke', 'Janell R. Blunt'], year: 2011, venue: 'Science, 331(6018), 772–775', doi: '10.1126/science.1199327', primaryUrl: 'https://doi.org/10.1126/science.1199327', fullTextUrl: 'https://learninglab.psych.purdue.edu/downloads/2011/2011_Karpicke_Blunt_Science.pdf', inspectedMaterial: 'full-text', publicationType: 'journal-article' },
  ],
  sections: [
    { id: 'introduction', title: '思い出すことを、学習の一部に', role: 'context', paragraphs: [
      '本を開けば説明がよく分かる。けれど、閉じて誰かに話そうとすると言葉が出てこない。そんなとき、もう一度読む前に、思い出せることを書いてみる選択肢があります。',
      'ここで扱うのは、記憶から内容を取り出す「想起練習」です。テストを成績の判定だけでなく、学習の一部として使う方法を、二つの実験論文から見ていきます。',
    ], evidence: [] },
    { id: 'delay-method', title: '5分後に強い方法と、1週間後に強い方法', role: 'method', paragraphs: [
      'RoedigerとKarpickeの2006年の実験1では、大学生120人が短い科学文章を学びました。一方の文章は読み返し、もう一方は文章を見ずに内容を書き出しました。学習と復習の時間は各7分。想起中に正解の提示はありません。最終テストでは、文章の30の意味単位をどれだけ再現できたかを採点しています。',
    ], evidence: [evidence('roediger-karpicke-2006', 'Experiment 1, Method, pp. 250–251', '参加者120人、30意味単位、各7分、遅延は参加者間の条件。')] },
    { id: 'delay-result', title: '直後と、時間を置いた後を分ける', role: 'finding', paragraphs: [
      '数値は再現できた意味単位の平均割合です。各時点は別の参加者群で、同じ人を3回追跡した数字ではありません。直後は読み返しが優位でも、時間を置くと関係が逆転しました。「今よく答えられること」と「後でも答えられること」を分けて見る必要があります。',
    ], evidence: [evidence('roediger-karpicke-2006', 'Experiment 1, Results and Discussion, p. 251 / Fig. 1', '5分81%/75%、2日54%/68%、1週間42%/56%。各時点は別群。')] },
    { id: 'concept-mapping', title: '丸暗記だけの話なのか', role: 'finding', paragraphs: [
      'KarpickeとBluntの2011年の実験1は、大学生80人を4条件に分けました。文章を見ながら概念図を作る条件と、読んだ内容を思い出し、再読してもう一度思い出す条件も比べています。この2条件の学習時間は同じでした。',
      '1週間後には、文章中の知識を問う問題だけでなく、複数の概念を結びつける推論問題でも、想起練習の成績が上回りました。ただし、これは「図解は無意味」という比較ではありません。資料を閉じて概念図を作れば、それ自体が想起練習になり得ます。',
    ], evidence: [evidence('karpicke-blunt-2011', 'Experiment 1, pp. 772–773; Discussion, p. 774', '80人4条件、2条件の学習時間を一致。1週間後の逐語的知識・推論の比較と概念図への留保。')] },
    { id: 'limitations', title: 'この結果から飛躍させないこと', role: 'limitation', paragraphs: [
      '対象は大学生による文章学習です。この2本だけで、ピアノの演奏、数学の問題解決、長期間の学習成果まで同じ効果が出るとは言えません。また、「苦しんで思い出せないほどよい」「教材を読まなくてよい」という実験でもありません。',
      'この記事は二つの研究を読む入口であり、研究全体を網羅したレビューではありません。最新研究を代表するものでもなく、2006年と2011年の基礎的な比較を取り上げています。',
    ], evidence: [evidence('roediger-karpicke-2006', 'Experiment 1, Method, pp. 250–251', '大学生と文章学習という対象範囲。'), evidence('karpicke-blunt-2011', 'Experiment 1, pp. 772–773', '大学生と科学文章という対象範囲。')] },
    { id: 'practice', title: '次の読書で試すなら', role: 'example', paragraphs: [
      '以下は実験手順の再現ではなく、日常向けに組み立てた提案です。',
      'たとえば技術書なら、用語を列挙するだけでなく「どんな問題を解く仕組みか」を説明します。書けなかった箇所は、次に読む場所の目印にできます。なお、この具体的な4手順や確認の間隔が最適だと、上の2論文が検証したわけではありません。',
      '読書量の記録に、「本を閉じて何を説明できたか」を一つ加える。まずはその小さな変更から、自分の学習を観察してみてください。',
    ], evidence: [] },
  ],
  concepts: [
    { id: 'learning', parentId: null, label: '学習と記憶', sectionId: 'introduction' },
    { id: 'retrieval-practice', parentId: 'learning', label: '想起練習', sectionId: 'introduction' },
    { id: 'free-recall', parentId: 'retrieval-practice', label: '自由再生', sectionId: 'delay-method' },
    { id: 'delayed-test', parentId: 'retrieval-practice', label: '遅延テスト', sectionId: 'delay-result' },
    { id: 'concept-map', parentId: 'learning', label: '概念図', sectionId: 'concept-mapping' },
  ],
  readingOrder: ['learning', 'retrieval-practice', 'free-recall', 'delayed-test', 'concept-map'],
  diagrams: [{ id: 'learning-concepts', kind: 'original-schematic', caption: 'この記事の用語をたどる概念マップ', alt: '学習と記憶から想起練習と概念図へ。想起練習の下に自由再生と遅延テスト。', description: '記事を読むために編集した用語の階層。研究モデルや原論文の図版の再現ではない。', sectionIds: ['introduction', 'delay-method', 'delay-result', 'concept-mapping'] }],
});
export const retrievalResults = deepFreeze([
  { delay: '5分', rereading: 81, retrieval: 75 },
  { delay: '2日', rereading: 54, retrieval: 68 },
  { delay: '1週間', rereading: 42, retrieval: 56 },
]);
export const readingSteps = deepFreeze([
  '短い節を一つ読み、分からない言葉を確認する。',
  '本とノートを閉じ、「何を説明していたか」「なぜそうなるか」を自分の言葉で書く。',
  '原文を開き、抜けた点と間違えた点を別の色で直す。',
  '後日、同じ問いに資料なしで答えてみる。',
]);
export const researchGlossary = deepFreeze([
  { id: 'retrieval-practice', english: 'retrieval practice', meaning: '資料を見るだけでなく、記憶を手がかりに内容を取り出す練習。' },
  { id: 'free-recall', english: 'free recall', meaning: '答えの選択肢を使わず、思い出せる内容を述べたり書いたりする課題。' },
  { id: 'delayed-test', english: '', meaning: '学習直後ではなく、時間を置いて行う確認。' },
  { id: 'concept-map', english: 'concept map', meaning: '概念と、その間の関係を線などで表した図。' },
]);
export const verifiedCitation = deepFreeze({ kind: 'verified-citation', fromPaperId: 'karpicke-blunt-2011', toPaperId: 'roediger-karpicke-2006', locator: 'References and Notes, 8 (p. 775)', sourceUrl: retrievalArticle.papers[1]!.fullTextUrl! });
export const sourceReview: SourceReview = deepFreeze({ reviewedOn: '2026-10-25', reviewerLabel: '調査工程と独立した事実確認工程（AI）', paperIds: retrievalArticle.papers.map(p => p.id), sectionIds: retrievalArticle.sections.map(s => s.id), notes: '両原論文の全文を確認。2006年実験1の数値・条件と2011年実験1の比較、および2011年参考文献8を照合。日常向けの手順はサイト側の提案であり、検証された最適手順ではない。' });
export const articleDisclosure = '本記事は実在の論文をもとにした日本語の解説です。論文の著者による記事ではありません。表は原論文の数値から独自に構成し、原論文の図版や本文は転載していません。';
