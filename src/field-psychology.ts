import type { PublishedExplainer } from './research-catalog.js';
import { deepFreeze } from './model.js';

const sourceUrl = 'https://www.newswise.com/pdf_docs/166676485849170_many%20smiles_nature_paper.pdf';
const evidence = (locator: string, supports: string) => ({
  paperId: 'many-smiles-2022', locator, supports,
  verificationNote: '公開組版PDFの本文・図表と照合。出版社の刊行書誌も確認。元データの再解析は行っていません。',
  url: sourceUrl,
});

export const psychologyExplainer: PublishedExplainer = deepFreeze({
  article: {
    slug: 'many-smiles-facial-feedback',
    title: '笑顔を作ると、気分も変わる？ 大規模な再検証を読む',
    publishedDate: '2026-10-26', readingMinutes: 6, category: '心理学',
    evidenceScope: '19か国のオンライン実験。3,878人が回答し、事前指定の基準を満たした1,504人を主解析',
    summary: '笑顔は気分の結果であると同時に、気分を少し動かす原因にもなるのか。異なる立場の研究者が三つの方法を比べた結果は、方法によって違いました。',
    audience: '身近な心理学の説を、再現性と効果の大きさから読みたい人',
    centralQuestion: '表情を変えるだけで、その瞬間の楽しさは変わるのか。',
    tags: ['心理学', '感情', '表情', '再現性', '事前登録'],
    authorship: {
      siteByline: 'RONLENS', distinction: 'site-authored-explainer-not-original-paper',
      productionDisclosure: '実在の論文をAIの支援で読解・構成したサイト独自の日本語解説です。原論文の著者による記事ではありません。元データの再解析や追試は行っておらず、図表は原論文の結果から独自に整理しています。',
    },
    papers: [{
      id: 'many-smiles-2022',
      title: 'A multi-lab test of the facial feedback hypothesis by the Many Smiles Collaboration',
      authors: ["Nicholas A. Coles", "David S. March", "Fernando Marmolejo-Ramos", "Jeff T. Larsen", "Nwadiogo C. Arinze", "Izuchukwu L. G. Ndukaihe", "Megan L. Willis", "Francesco Foroni", "Niv Reggev", "Aviv Mokady", "Patrick S. Forscher", "John F. Hunter", "Gwenaël Kaminski", "Elif Yüvrük", "Aycan Kapucu", "Tamás Nagy", "Nandor Hajdu", "Julian Tejada", "Raquel M. K. Freitag", "Danilo Zambrano", "Bidisha Som", "Balazs Aczel", "Krystian Barzykowski", "Sylwia Adamus", "Katarzyna Filip", "Yuki Yamada", "Ayumi Ikeda", "Daniel L. Eaves", "Carmel A. Levitan", "Sydney Leiweke", "Michal Parzuchowski", "Natalie Butcher", "Gerit Pfuhl", "Dana M. Basnight-Brown", "José A. Hinojosa", "Pedro R. Montoro", "Lady G. Javela D", "Kevin Vezirian", "Hans IJzerman", "Natalia Trujillo", "Sarah D. Pressman", "Pascal M. Gygax", "Asil A. Özdoğru", "Susana Ruiz-Fernandez", "Phoebe C. Ellsworth", "Lowell Gaertner", "Fritz Strack", "Marco Marozzi", "Marco Tullio Liuzza"],
      year: 2022, venue: 'Nature Human Behaviour, 6, 1731–1742',
      doi: '10.1038/s41562-022-01458-9', primaryUrl: 'https://doi.org/10.1038/s41562-022-01458-9',
      fullTextUrl: sourceUrl, fullTextLabel: '公開されている受理後組版の全文PDF',
      inspectedMaterial: 'full-text', publicationType: 'journal-article',
      record: {
        firstPublished: '2022-10-20', firstPublishedLabel: '出版社のオンライン刊行日',
        revisedOn: null, version: '査読済みRegistered Reportの受理後組版PDF',
        checkedOn: '2026-10-26', peerReview: 'peer-reviewed',
        revisionNote: '2019-02-21受稿、2022-09-07受理、2022-10-20刊行（出版社書誌）。読解した公開PDFの刊行日欄は組版用プレースホルダーです。最終刊行PDFとの差分は未確認です。',
        materialNote: '本文12頁と付属Reporting Summary 3頁を全文読解。組版PDFの年齢・性別欄に不整合があるため、それらの属性値は採用していません。別ファイルの補足資料と元データは再解析していません。',
        integrityNote: '出版社の掲載記録、Crossref書誌と撤回・訂正検索で、確認時点に結論を取り消す告知は見つかりませんでした。全履歴の不存在を保証する確認ではありません。事前登録された多施設研究ですが、ペン課題の主解析は明瞭な効果を示さず、再現性の問題を一括して解決した論文ではありません。',
        integritySources: [
          { label: '出版社の掲載記録', url: 'https://www.nature.com/articles/s41562-022-01458-9' },
          { label: 'Crossref書誌', url: 'https://api.crossref.org/works/10.1038/s41562-022-01458-9' },
          { label: '著者所属機関の掲載記録', url: 'https://digitalcommons.chapman.edu/psychology_articles/330/' },
        ],
      },
    }],
    sections: [
      {
        id: 'question', title: '笑うから楽しい、という説をどう確かめるか', role: 'context',
        paragraphs: [
          '楽しいと笑顔になる。それなら逆に、笑顔を作ることで楽しさが少し増えるのでしょうか。顔の動きが感情へ影響するという「顔面フィードバック仮説」は、身近でありながら検証が難しい問いです。',
          'ペンをくわえて表情を変える有名な実験は、大規模な追試で同じ結果が得られず、議論になりました。Many Smiles Collaborationでは、仮説を支持する研究者も疑問を持つ研究者も協力し、三つの課題を比べました。これは昔の一つの実験を、そのまま繰り返した研究ではありません。',
        ], evidence: [evidence('公開PDF 1–2頁 Introduction、6–7頁 Discussion', '仮説、ペン課題の再現性を巡る背景、異なる立場の共同研究と過去研究との手順差')],
      },
      {
        id: 'method', title: '三つの表情課題を、同じ枠組みで比べる', role: 'method',
        paragraphs: [
          '26の研究グループが19か国でオンライン実験を行いました。参加者は、写真の笑顔をまねる、指示に従って口角などを動かす、ペンを口に保持する、のいずれかに無作為に割り付けられました。それぞれ笑顔に対応する姿勢と無表情に対応する姿勢を5秒ずつ、順序を無作為に変えて行います。',
          '各課題のあと、直前に感じた楽しさなど四つの項目を1〜7で尋ねました。心地よい写真を同時に見せるかどうかも分けています。回答完了者は3,878人ですが、注意確認や課題の理解など、事前に決めた厳しい基準を適用した主解析は1,504人です。実験の狙いに気づいた人を除く基準が、人数を大きく減らしました。',
        ], evidence: [evidence('公開PDF 3頁 Participants、8–9頁 Methods、15頁 Reporting Summary', '対象数、無作為割付と順序、オンライン、課題時間、四項目・7段階尺度、主解析の除外基準')],
      },
      {
        id: 'findings', title: '表情を作る方法で、差の大きさが変わった', role: 'finding',
        paragraphs: [
          '主解析では、写真をまねる課題と、顔を動かす指示に従う課題で、無表情に比べて楽しさの自己報告が高くなりました。差はそれぞれ0.49点と0.40点です。1〜7の尺度での平均的な差であり、「幸福が49%増えた」という意味ではありません。',
          'ペン課題の差は0.04点で、95%信頼区間は−0.07〜0.15でした。この主解析では効果を明瞭に示せませんでした。一方、除外基準を緩めた探索的な解析では小さな差が出ています。「ペン課題では絶対に何も起きない」と断定するより、解析条件によって結果が変わると読むのが適切です。',
        ], evidence: [
          evidence('公開PDF 3頁 Primary analyses、4頁 Figure 2', '課題別のモデル推定平均差と95%信頼区間'),
          evidence('公開PDF 5頁 Hypothesis awareness、6–7頁 Discussion', '除外基準を緩めた探索的解析と、ペン課題の不確かさ'),
        ],
      },
      {
        id: 'authors-interpretation', title: '著者たちは「感情を少し動かす」証拠と考えた', role: 'interpretation', interpretationBy: 'study-authors',
        paragraphs: [
          '著者たちは、笑顔に近い表情を作る一部の方法が、その瞬間の楽しさを生み出したり変化させたりする証拠と解釈しています。心地よい写真がない条件でも結果が見られたため、すでにある楽しさを増幅するだけとは限らない、という説明です。',
          'ただし仕組みは一つに決まりません。顔の動きが身体の反応を変えるのか、「自分は笑っている」と解釈することが関わるのか。論文はこうした候補を論じていますが、この実験だけでは切り分けられません。',
        ], evidence: [evidence('公開PDF 6–7頁 Discussion', '感情の開始・変調という著者の結論と、推論過程・生理過程の候補')],
      },
      {
        id: 'reproducibility', title: '事前登録は、結果の揺れを見えるようにする', role: 'finding',
        paragraphs: [
          'この論文は、計画を結果より先に査読するRegistered Reportとして進められました。仮説や主解析を前もって決めておくと、結果を見たあとで都合のよい分析だけを選ぶ余地を小さくできます。',
          'それでも、予定どおりにいかなかった部分はあります。全てオンラインとなり対面との比較ができず、主解析の人数も計画より80人少なくなりました。論文はこうした変更と、主解析・二次解析・探索的解析を分けて報告しています。再現性を見るときは、「成功したか」の一言だけでなく、どの手順なら同じ結論に届いたかが手がかりになります。',
        ], evidence: [evidence('公開PDF 1–3頁、9頁 Primary analyses / Power simulation', 'Registered Report、事前指定解析、オンラインへの変更、計画人数との差と解析の区分')],
      },
      {
        id: 'limits', title: '一瞬の自己報告から、人生の幸福までは言えない', role: 'limitation',
        paragraphs: [
          '測ったのは短い課題の直後の自己報告で、生活全体の幸福度や、うつ病の改善ではありません。著者の多くも、この大きさの効果が日常の幸福を改善する介入になるとは考えにくい、と述べています。長期間笑顔を続けた効果を調べた実験でもありません。',
          '参加者は各地で集めた便宜的な標本で、19か国の全人口を代表しません。顔の動きは動画で直接確認しておらず、回答や自己評価に頼る部分があります。実験の狙いに気づいた人ほど差が大きい傾向もあり、研究者が期待する答えを推測する影響を完全に除けたとは言えません。',
        ], evidence: [evidence('公開PDF 5–8頁、14頁 Reporting Summary', '仮説への気づき、効果の小ささと介入への留保、表情確認の制限、便宜的標本')],
      },
      {
        id: 'reading-advice', title: '身近な心理学ほど、何を測ったかへ戻る', role: 'interpretation', interpretationBy: 'site',
        paragraphs: [
          '記事側の提案は、心理学の話を読むときに「どんな操作で」「何を」「いつ測ったか」を一組で確かめることです。この研究なら、数秒の表情操作と、直後の楽しさの自己報告がその一組です。',
          '「笑顔ならいつも幸せになれる」という生活のルールへ広げる前に、その間にまだ調べられていない距離があると考える。小さな効果を小さなまま受け取ることも、研究を役立てる読み方です。',
        ], evidence: [],
      },
    ],
    concepts: [
      { id: 'facial-feedback', parentId: null, label: '表情から感情へ', sectionId: 'question' },
      { id: 'pose-task', parentId: 'facial-feedback', label: '三つの表情課題', sectionId: 'method' },
      { id: 'self-report', parentId: 'pose-task', label: '直後の自己報告', sectionId: 'findings' },
      { id: 'registered-report', parentId: 'facial-feedback', label: '先に決めた分析', sectionId: 'reproducibility' },
      { id: 'replication', parentId: 'registered-report', label: '結果の再現性', sectionId: 'reproducibility' },
      { id: 'generalization', parentId: 'facial-feedback', label: '生活への一般化', sectionId: 'limits' },
    ],
    readingOrder: ['facial-feedback', 'pose-task', 'self-report', 'registered-report', 'replication', 'generalization'],
    diagrams: [{
      id: 'smile-experiment', kind: 'original-schematic',
      caption: '表情の操作、直後の自己報告、日常への解釈を分ける。',
      alt: '三つの表情課題から自己報告へつなぎ、主解析と探索的解析、日常への一般化を分けた概念図',
      description: '表情課題から直後の自己報告へ矢印を置き、事前登録・主解析を隣に示す。日常の幸福は測定範囲の外として分ける独自の概念図。顔写真や原論文の図版は転載しない。',
      sectionIds: ['method', 'findings', 'reproducibility', 'limits'],
    }],
  },
  cardSteps: ['表情を\n変える', '直後に\n答える', '方法別に\n比べる'],
  glossary: [
    { id: 'facial-feedback', english: 'facial feedback', meaning: '顔の表情を作る動きや、その感覚が、経験する感情へ影響するという考え方です。' },
    { id: 'self-report', english: 'self-report', meaning: '本人に感じ方などを答えてもらう測定。行動や生理反応を直接測った値とは区別します。' },
    { id: 'registered-report', english: 'Registered Report', meaning: '研究の問いや方法を結果が出る前に査読し、計画の質を審査する出版形式です。' },
    { id: 'replication', english: 'replication', meaning: '研究を繰り返して、同じ方向や大きさの結果が得られるか確かめること。手順や対象の違いも確認します。' },
  ],
  tables: [{
    sectionId: 'findings', label: '笑顔に対応する姿勢と無表情の差',
    caption: '公開PDF 3頁の主解析から独自に整理。1〜7尺度のモデル推定平均差と95%信頼区間。主解析対象は計1,504人。',
    columns: ['課題', '楽しさの差', '95%信頼区間'],
    rows: [
      ['写真の笑顔をまねる', '+0.49点', '0.36〜0.61'],
      ['指示どおり顔を動かす', '+0.40点', '0.23〜0.56'],
      ['ペンを口に保持する', '+0.04点', '−0.07〜0.15'],
    ],
  }],
});
