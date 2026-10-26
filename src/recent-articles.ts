import { deepFreeze } from './model.js';
import type { EvidenceReference, ExplainerConcept, ExplainerSection, ResearchExplainerContent, ResearchPaperReference } from './research-article.js';

const authorship: ResearchExplainerContent['authorship'] = {
  siteByline: 'RONLENS', distinction: 'site-authored-explainer-not-original-paper',
  productionDisclosure: 'AIを用いて原論文全文を読み、調査・執筆と独立した出典確認を行ったサイト独自の解説です。論文著者による執筆・監修ではありません。元データの再解析や実験の追試は行っていません。',
};
function paper(id: string, title: string, authors: string[], date: string, html: boolean): ResearchPaperReference {
  return { id: 'arxiv-' + id.replace('.', '-'), title, authors, year: 2026, venue: 'arXiv ' + id + 'v1', doi: '10.48550/arXiv.' + id,
    primaryUrl: 'https://arxiv.org/abs/' + id + 'v1', fullTextUrl: 'https://arxiv.org/' + (html ? 'html/' : 'pdf/') + id + 'v1', inspectedMaterial: 'full-text', publicationType: 'preprint',
    record: { firstPublished: date, revisedOn: null, version: 'v1', checkedOn: '2026-10-26', peerReview: 'not-confirmed' } };
}
const trustPaper = paper('2610.32883', 'When Should I Trust This? Designing and Evaluating Factuality Indicators for LLM-based Chatbots', ['Greta Warren', 'Jessica Heal', 'Sila Eser', 'Denise M. Leto', 'Christine M. Lehane', 'Isabelle Augenstein'], '2026-10-23', true);
const gelliPaper = paper('2610.31987', 'GELLI: A Generator for Experiential Language Learning Interactions', ['Danilo Symonette', 'Alan Y. Cheng', 'Taiga Ikedo', 'Jose Manuel Rosales Juarez', 'Roy Pea', 'Parastoo Abtahi', 'Jane L. E', 'James Landay'], '2026-10-22', true);
const materialsPaper = paper('2610.07097', 'Verified, not generated: expert-verified AI study materials and the distribution of learning gains in a university course', ['Canh Thien Dang', 'An Nguyen'], '2026-10-05', false);
function evidence(p: ResearchPaperReference, locator: string, fragment: string, supports: string): EvidenceReference {
  return { paperId: p.id, locator, supports, url: p.fullTextUrl! + fragment, verificationNote: '2026-10-26にv1本文と補足を照合。独立した出典確認工程でも数値・条件を確認。' };
}
function article(input: Pick<ResearchExplainerContent, 'slug' | 'title' | 'summary' | 'category' | 'evidenceScope' | 'centralQuestion' | 'tags' | 'papers' | 'sections' | 'concepts'>): ResearchExplainerContent {
  return deepFreeze({ ...input, publishedDate: '2026-10-26', readingMinutes: 4, audience: 'AIと学習・情報の関係を原論文から知りたい人', authorship,
    readingOrder: input.concepts.map(c => c.id),
    diagrams: [{ id: 'article-concepts', kind: 'original-schematic', caption: '本文の概念をたどるために編集した図', alt: input.concepts.map(c => c.label).join('、'), description: '概念の階層はRONLENS独自の整理。原論文の図版や、検証済みの因果モデルではありません。', sectionIds: [...new Set(input.concepts.map(c => c.sectionId))] }],
  });
}
const section = (id: string, title: string, role: ExplainerSection['role'], paragraphs: string[], refs: EvidenceReference[] = []): ExplainerSection => ({ id, title, role, paragraphs, evidence: refs });
const concept = (id: string, parentId: string | null, label: string, sectionId: string): ExplainerConcept => ({ id, parentId, label, sectionId });

export const trustArticle = article({
  slug: 'ai-confidence-indicators-and-trust', title: 'AIの「自信あり」は何を伝える？ 表示と信頼を分けて読む', category: 'AI・情報',
  summary: '信頼度や出典の表示を見た人は、AIをどう評価するのか。5,151人の実験から、第一印象と正誤を知った後の判断を分けます。',
  evidenceScope: '米国の生成AI利用者への面接・調査と、静止画を使った主観評価実験',
  centralQuestion: 'AIの信頼度表示は、回答の正しさを確かめる手がかりになるか？', tags: ['AI', 'AI・情報', '信頼性', '出典と照合', '信頼度', 'factuality'], papers: [trustPaper],
  sections: [
    section('introduction', '数字が添えられると、安心できる？', 'context', ['AIの回答に「自信あり」やパーセントが添えられていても、その数字が何を指すかは別に確かめる必要があります。この論文は、表示の仕方が人の受け止め方をどう変えるかを調べています。']),
    section('design', '画面を見せ、正誤を伝える前後で比べる', 'method', ['米国のAI利用者に、面接8人、質問紙調査1,000人、実験5,151人という別々の調査を行いました。データ収集は2025年3月・5月・6月で、論文公開は2026年です。', '実験では、各人がランダムに割り当てられたチャット画面を一つ見ました。園芸・数学・医療の話題で、表示方法6種類と回答の正誤などを変え、正解を伝える前後の信頼や印象を尋ねています。実際にチャットを操作する実験ではありません。'], [evidence(trustPaper, '§3.1、§4.1、§5.1 / Table 3', '#S5.SS1', '別標本の人数、収集年月、ランダム割当、静止画と評価尺度。')]),
    section('findings', '最初の評価の差は小さかった', 'finding', ['正誤を知らない段階の信頼は、ラベル式の信頼度や出典表示で、パーセント表示より高くなりました。ただし、この比較の効果量dは0.132と0.157と小さく、表示がない条件より常に良いわけではありません。', '正誤を伝えた後は、表示方法による信頼の差は統計的に有意ではありませんでした（p=.115）。実際に正しかったかどうかの差が大きくなります。これは「出典表示は無意味」でも「信頼度が正確なら安全」でもなく、この条件での主観評価の結果です。'], [evidence(trustPaper, '§5.2 Pre-/Post-revelation: Perceived trust、§6.1', '#S5.SS2', 'd=.132/.157、事後の表示主効果p=.115、対照との差への留保。')]),
    section('meaning', '「自信」の意味が人によって違う', 'finding', ['面接では、信頼度を「正答の確率」「文章中で正しい部分の割合」「すでに検証した証拠」などと受け取る違いが見られました。面接8人の探索的な知見で、どの解釈が何割いるかを示した調査ではありません。'], [evidence(trustPaper, '§3.2.1、§6.2', '#S3.SS2', '信頼度の異なる解釈。割合の推定ではない。')]),
    section('limitations', '信頼した後の行動までは分からない', 'limitation', ['対象は米国の既存AI利用者です。静止画一例への評価なので、出典を開く行動や誤情報を見抜く正答率、長期の利用は測っていません。調査の自己申告も、実際の行動記録とは異なります。医療の話題は表示を評価するための刺激で、治療や服薬の有効性を調べた研究ではありません。'], [evidence(trustPaper, '§6.5 Limitations and future work', '#S6.SS5', '対象、静止画、主観評価、単回提示という限界。')]),
    section('interpretation', '読むときは、表示から根拠へ進む', 'interpretation', ['ここからは記事側の提案です。AIが出典を付けたら、結論に関わる主張を一つ選び、元の資料で同じ内容が書かれているか確かめる。信頼度の数字には、その定義や根拠が示されているかを見る。この読み方が最適だと今回の実験が証明したわけではありません。', 'このサイトの解説にも同じ読み方を使えます。下の原文リンクから研究の条件へ戻り、解説で省かれた点や、言い切りすぎている点がないかを確かめてください。']),
  ],
  concepts: [concept('trust', null, 'AIへの信頼', 'introduction'), concept('indicators', 'trust', '信頼性の表示', 'design'), concept('confidence', 'indicators', '信頼度の意味', 'meaning'), concept('truth-revelation', 'indicators', '正誤を知る前後', 'findings'), concept('perception', 'trust', '評価と行動', 'limitations')],
});

export const gelliArticle = article({
  slug: 'gelli-generated-language-practice', title: 'AIと場面を演じる語学練習、何が伸びた？ GELLIの比較実験を読む', category: '学習・記憶',
  summary: '日本語学習者40人が、生成された会話場面と学習動画を体験。語彙・自信・発話を分けて、短い実験から分かることを見ます。',
  evidenceScope: '成人の日本語学習者、1回のセッション内での動画との比較', centralQuestion: 'AIが作る会話場面での練習は、何を学ぶ助けになるか？', tags: ['AI', '学習・記憶', '語学', 'GELLI', '語彙', '日本語学習'], papers: [gelliPaper],
  sections: [
    section('introduction', '覚えた言葉を、場面の中で使う', 'context', ['単語を知っていることと、店で注文するときに言えることには距離があります。GELLIは、学習目標に合わせてAIが場面と会話相手を作る研究用システムです。会話の脇に翻訳や表現の候補があり、場面の後には振り返りも用意されています。'], [evidence(gelliPaper, '§4 GELLI', '#S4', '生成場面、支援パネル、振り返りの構成。')]),
    section('design', '同じ人が、動画と生成場面を体験', 'method', ['日本語を大学で1年以上学んだ程度の成人47人を募集し、予備実験2人、時間不足3人、欠測2人を除いて定量分析は40人でした。時間不足・欠測の5人のうち3人も意見を提供できたため、定性分析は43人です。', '40人は動画とGELLIの両方を使い、カフェ・買い物という文脈と順序を釣り合わせました。学習目標とヘッドセットは共通です。全セッションは2〜3時間で、各条件の学習時間が同じだったとは記載されていません。'], [evidence(gelliPaper, '§5.1–5.4 Study Design', '#S5', '募集と除外、40/43人、参加者内比較と評価。')]),
    section('findings', '語彙と自信に差。発話には明確な差がない', 'finding', ['直後の語彙テストは、英語の意味から日本語5語を答える10点満点の課題です。事前得点や文脈を調整したモデルでは、GELLIの得点が動画より0.85点高くなりました（95%信頼区間0.25〜1.45、p=.005）。会話への自信にも差がありました。', '一方、発話テストでの課題達成と語彙・文法の使用には、条件間の有意差がありませんでした。差がないと証明したわけではありません。「会話力全体が向上した」と語彙の結果を広げないことが大切です。'], [evidence(gelliPaper, '§6.1.1 Learning and Support', '#S6.SS1.SSS1', '語彙b=.85、95%CI[.25,1.45]、p=.005。発話p=.43/.26。')]),
    section('immersion', '入り込めた感覚と、学習成果を分ける', 'finding', ['GELLIでは、その場にいる感覚などの自己評価が高い一方、物語の理解は動画の方が高くなりました。また、測った臨場感・感情的な関与から語彙の得点を予測する分析では、有意な関係を確認できませんでした。'], [evidence(gelliPaper, '§6.2.1 Immersion', '#S6.SS2.SSS1', 'presence等と物語理解の比較、語彙との関連は非有意。')]),
    section('limitations', '一度の体験から、長期の上達は言えない', 'limitation', ['一地域の成人、日本語、二つの文脈を一度に試した研究です。後日の保持や実際の会話への転移は未検証です。対話・画像・音声・支援・振り返りをまとめて比べたため、何が効いたかは切り分けられません。対話できる人手制作教材に勝るかも分かりません。'], [evidence(gelliPaper, '§8.1–8.4 Limitations and Future Work', '#S8', '要素の寄与、期間と転移、対象範囲、技術的制約。')]),
    section('interpretation', '練習の目標を、小さく決めてみる', 'interpretation', ['ここからは記事側の提案です。「語学を上達させる」だけでなく、「注文を一つ言える」「聞き返せる」のように確認できる目標を置くと、楽しさと、できたことを分けて振り返れます。支援を見ずに同じ内容を言えるかも、別に確かめてみる。この手順自体をGELLIの実験が検証したわけではありません。']),
  ],
  concepts: [concept('situated-practice', null, '場面での語学練習', 'introduction'), concept('learning-outcomes', 'situated-practice', '測った学習成果', 'design'), concept('vocabulary', 'learning-outcomes', '語彙と発話', 'findings'), concept('transfer', 'learning-outcomes', '保持と転移', 'limitations'), concept('presence', 'situated-practice', '臨場感', 'immersion')],
});

export const materialsArticle = article({
  slug: 'expert-verified-ai-study-materials', title: 'AI教材は、誰が確かめる？ 大学の成績データを平均の先まで読む', category: '学習・記憶',
  summary: '専門家が検証したAI教材を配った授業を、前年と比較した研究。平均2.34点という推定値の成り立ちと、成績分布の違いを読み解きます。',
  evidenceScope: '英国の一大学・経済学1科目、異なる2年度の170人・340得点', centralQuestion: '専門家が確かめたAI教材へのアクセスは、成績のどこに関係したか？', tags: ['AI', '学習・記憶', '教材', '差の差', '専門家による検証', 'NotebookLM'], papers: [materialsPaper],
  sections: [
    section('introduction', '作れる教材と、配れる教材のあいだ', 'context', ['AIで教材を作れても、内容の正しさを確かめる仕事は残ります。この論文は、その仕事を学生だけに任せず、授業を知る担当者が引き受けた事例を分析しています。']),
    section('design', '学生を二分した実験ではない', 'method', ['英国の経済学1科目で、2023/24年度と2024/25年度の各85人、計170人の試験得点を比較しました。各人に前半・後半の50点満点の得点があり、計340得点です。後の年度だけ、授業後半にAI生成の音声・FAQ・小テスト付き学習ガイドを追加しました。大学院生の授業補助担当者が原資料と照合し、修正してから配っています。', '比較方法は「差の差」です。授業後半の年度差から、教材を追加していない前半の年度差を引きます。学生をランダムに二群へ分けた比較ではありません。'], [evidence(materialsPaper, '§3.1–3.3, pp. 7–8', '#page=7', '各85人、2科目半期でなく1科目内の前半/後半、検証済み補助教材、差の差。')]),
    section('findings', '2.34点は、何と何の差か', 'finding', ['後半の平均は34.12点から34.85点へ、約0.73点上がりましたが、この上昇だけでは有意ではありません（p=.441）。一方、前半は35.87点から34.26点へ下がりました。この二つの変化の差が約2.34点です。論文は、前半で見られた低下を後半では免れた可能性として慎重に解釈しています。', '30点未満の割合についても、変化の差は−24.7パーセントポイントでした。これは相対的に24.7%減ったという意味ではありません。成績分布の低い側に変化が集中し、平均効果は介入前年度の後半で低得点だった学生を除くと弱まる一方、この境界での結果は除外分析でも残りました。'], [evidence(materialsPaper, '§4.1–4.3 / Tables 1–3, pp. 9–12', '#page=9', 'セル平均と2.341点、30点未満−24.7pp、平均と閾値の感度の違い。')]),
    section('burden', '確認する負担を、どこに置くか', 'interpretation', ['著者は、教材の正誤を見分ける負担を担当者側へ移したことが、支援を必要とする学生に役立った可能性を論じています。ただし、教材を増やした効果と、検証した効果はこの設計では分離できません。これは研究結果を説明する仮説です。'], [evidence(materialsPaper, '§2.3、§4.4、§5.1', '#page=13', 'judgement burden仮説と、教材追加・検証の寄与を分離できない点。')]),
    section('limitations', '因果を決めるには、比較が足りない', 'limitation', ['一大学・一科目の非無作為比較で、介入前が1年度しかなく、前半と後半が同じ傾向で変化したはずだという仮定を検証できません。後半へ復習時間を移した可能性も残ります。個人別の利用ログがないため、誰が使って伸びたかは分かりません。36人の意見も逐語録ではなく、聞き取り時のメモです。', '個人の成績データは公開されていません。ここでは論文の報告値と分析の条件を読んでおり、元データから結果を再計算したわけではありません。'], [evidence(materialsPaper, '§3.5、§5.6、Data availability, pp. 9, 17–18', '#page=17', '並行トレンド、復習配分、利用記録、定性メモ、元データ非公開。')]),
    section('interpretation', '教材を選ぶときに、確認の跡を見る', 'interpretation', ['ここからは記事側の提案です。教材を選ぶ際に、出典と、誰が何を照合したかの記録を探す。自分で作る場合も、定義や例題を授業資料と突き合わせた跡を残す。「検証済み」という表示だけで正しさが保証されると、この研究が示したわけではありません。', 'また、成績の報告では平均だけでなく、どの範囲の得点に変化があったのかを読む。今回の論文は、そのための具体的な読み方を考える材料になります。']),
  ],
  concepts: [concept('verified-materials', null, '検証されたAI教材', 'introduction'), concept('comparison', 'verified-materials', '成績の比較', 'design'), concept('difference-in-differences', 'comparison', '差の差', 'findings'), concept('distribution', 'comparison', '平均と分布', 'findings'), concept('judgement-burden', 'verified-materials', '確認する負担', 'burden')],
});
