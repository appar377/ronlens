import type { PublishedExplainer } from './research-catalog.js';
import { deepFreeze } from './model.js';

const sourceUrl = 'https://orca.cardiff.ac.uk/141031/1/nejmoa2021436.pdf';
const evidence = (locator: string, supports: string) => ({
  paperId: 'recovery-dexamethasone-2021', locator, supports,
  verificationNote: 'NEJM最終報告の本文・表・図の数値と照合。元データの再解析は行っていません。',
  url: sourceUrl,
});

export const medicalExplainer: PublishedExplainer = deepFreeze({
  article: {
    slug: 'recovery-dexamethasone-who-benefits',
    title: '同じ薬でも、誰に使うかで結果は変わる？ RECOVERY試験を読む',
    publishedDate: '2026-10-26', readingMinutes: 6, category: '医療・健康',
    evidenceScope: '2020年の英国でCOVID-19のため入院した患者6,425人を対象とする無作為化比較試験',
    summary: '「死亡が17%減った」と「死亡割合が2.8ポイント低かった」は何が違うのか。大規模な臨床試験から、対象集団と効果の読み方を考えます。',
    audience: '医療研究の数字を読む入口を知りたい人',
    centralQuestion: '薬が効いたという結論は、どの患者について、どの数字で言えるのか。',
    tags: ['医療・健康', '臨床試験', 'COVID-19', '絶対効果', '無作為化'],
    authorship: {
      siteByline: 'RONLENS', distinction: 'site-authored-explainer-not-original-paper',
      productionDisclosure: '実在の論文をAIの支援で読解・構成したサイト独自の日本語解説です。原論文の著者による記事ではありません。元データの再解析や追試は行っておらず、図表は原論文の結果から独自に整理しています。',
    },
    papers: [{
      id: 'recovery-dexamethasone-2021', title: 'Dexamethasone in Hospitalized Patients with Covid-19',
      authors: ['The RECOVERY Collaborative Group'], collectiveAuthors: true,
      year: 2021, venue: 'New England Journal of Medicine, 384(8), 693–704',
      doi: '10.1056/NEJMoa2021436', primaryUrl: 'https://doi.org/10.1056/NEJMoa2021436',
      fullTextUrl: sourceUrl, fullTextLabel: '著者所属機関リポジトリの全文PDF',
      inspectedMaterial: 'full-text', publicationType: 'journal-article',
      record: {
        firstPublished: '2020-07-17', firstPublishedLabel: 'オンライン速報の公開日',
        revisedOn: null, version: '最終報告（2021年2月25日号、693–704頁）',
        checkedOn: '2026-10-26', peerReview: 'peer-reviewed',
        revisionNote: '2020-07-17の速報から最終報告へ更新。ここでは2020-12-14をデータ締切とする最終報告を使用。最終版へのオンライン更新日は未確認です。',
        materialNote: '最終報告の本文、図表、考察を全文読解。補足資料の全項目や個票データを再解析したものではありません。',
        integrityNote: '確認時点のPubMed、Crossref書誌と撤回・訂正検索で、主要結論を取り消す告知は見つかりませんでした。全履歴の不存在を保証する確認ではありません。WHOの2025年解説も、重症度により対象を区別しています。',
        integritySources: [
          { label: 'PubMed掲載記録', url: 'https://pubmed.ncbi.nlm.nih.gov/32678530/' },
          { label: 'Crossref書誌', url: 'https://api.crossref.org/works/10.1056/NEJMoa2021436' },
          { label: 'WHO解説（2025-04-23更新）', url: 'https://www.who.int/news-room/questions-and-answers/item/coronavirus-disease-covid-19-dexamethasone' },
        ],
      },
    }],
    sections: [
      {
        id: 'question', title: '「効く薬」には、対象の条件がある', role: 'context',
        paragraphs: [
          'ある薬が死亡を減らした、と聞くと、同じ病気なら誰にでも役立つように感じるかもしれません。ところが、病気の進み方によって結果が違うことがあります。COVID-19の入院患者を対象にしたRECOVERY試験は、その違いを数字で読む例になります。',
          'この記事は2020年に行われた試験の読み方を扱います。個人への処方や、現在の治療を始めたり変更したりするための案内ではありません。',
        ], evidence: [evidence('693頁 Abstract、698–700頁 Results', '入院患者の無作為化比較と、開始時の呼吸補助による結果の違い')],
      },
      {
        id: 'method', title: '入院患者を、薬の追加と通常診療に無作為に分ける', role: 'method',
        paragraphs: [
          '英国176の医療組織で、COVID-19が疑われるか確認された入院患者6,425人がこの比較に参加しました。2,104人をデキサメタゾンの追加、4,321人を通常診療に無作為に割り付けています。薬は炎症を抑えるステロイドで、試験の条件は1日6mgを最長10日間、または退院まででした。',
          '主に比べたのは、割り付け後28日以内に原因を問わず死亡した割合です。患者も医療者も割り付けを知る非盲検の試験でした。通常診療群にも8%でステロイドが使われましたが、解析は実際に受けた治療へ組み替えず、最初の割り付けに沿って行われました。',
        ], evidence: [evidence('694–696頁 Methods、698頁 Figure 1、698頁 Results', '施設数、割付人数、投与条件、非盲検、28日死亡、通常診療群の使用、割付に沿う解析')],
      },
      {
        id: 'overall-effect', title: '17%の相対的な低下と、2.8ポイントの差', role: 'finding',
        paragraphs: [
          '全体の28日死亡割合は、デキサメタゾン群で22.9%（482人）、通常診療群で25.7%（1,110人）でした。報告された年齢調整死亡率比は0.83、95%信頼区間は0.75〜0.93です。1から0.83を引いた「17%」は、比較対象を基準にした相対的な低下を表します。',
          '一方、観測された割合をそのまま引くと、25.7−22.9＝2.8パーセントポイントです。これは年齢調整前の単純な差です。「100人につき17人減った」という意味ではありません。調整済みの率比と未調整の割合差は別の計算なので、同じ数字へ無理に換算しないことが大切です。',
        ], evidence: [evidence('698頁 Results、701頁 Table 2', '死亡人数・割合と年齢調整死亡率比。2.8ポイントは掲載された丸め値の単純差')],
      },
      {
        id: 'respiratory-support', title: '開始時に酸素が必要だったかで、結果が違った', role: 'finding',
        paragraphs: [
          'あらかじめ予定していた呼吸補助別の比較では、侵襲的人工呼吸を受ける群と、酸素投与を受ける群で死亡が少なくなりました。酸素群には、気管への挿管を伴わない換気補助も含まれます。',
          '酸素投与を受けていなかった患者では、利益は確認できませんでした。率比は1.19と死亡が増える方向ですが、信頼区間は0.92〜1.55で、差がない可能性も含みます。この結果を「必ず害がある」とも「誰にでも有効」とも読むことはできません。',
        ], evidence: [evidence('698–700頁 Results、700頁 Figure 3', '事前指定の呼吸補助別解析、死亡割合、年齢調整率比と95%信頼区間')],
      },
      {
        id: 'authors-interpretation', title: '著者たちは、病気の段階との関係を考えた', role: 'interpretation', interpretationBy: 'study-authors',
        paragraphs: [
          '著者たちは、炎症による肺の傷害が重要になる段階で、炎症を抑える作用が役立つ可能性を論じています。開始時の呼吸補助や、発症からの期間による違いが、その説明に合うためです。',
          'ただし、試験では詳しい生理学的指標、検査値、ウイルス量を収集していません。観察された治療効果から、体内の仕組みまで直接確かめたわけではありません。',
        ], evidence: [evidence('701–702頁 Discussion', '炎症段階に関する著者の解釈と、生理・検査・ウイルス学的測定の不足')],
      },
      {
        id: 'limits', title: '利益の数字だけでは、安全性や現在の効果は決まらない', role: 'limitation',
        paragraphs: [
          '試験担当者が薬に関連すると判断した重篤な副作用は、高血糖2件、消化管出血1件、精神病症状1件の計4件が報告されました。これは「副作用が4人だけに起きた」「安全性が網羅的に分かった」という意味ではありません。この試験は、負担を抑えるため収集情報を絞った設計です。',
          'また、対象は2020年の英国の入院患者で、主な観察期間は28日です。軽症の外来患者、予防目的、別の感染症、現在の治療環境へ、この割合をそのまま当てはめることはできません。非盲検なので、ほかの診療の違いが結果に関わる可能性にも注意が必要です。',
        ], evidence: [evidence('694–696頁 Methods、701–702頁 Discussion', '簡略な情報収集、非盲検、重篤な副作用4報告、研究対象と期間の範囲')],
      },
      {
        id: 'reading-results', title: '次に医療ニュースを読むときの、三つの確認', role: 'interpretation', interpretationBy: 'site',
        paragraphs: [
          'ここからは記事側の読み方の提案です。「誰を対象にしたか」「何と比べたか」「絶対的にはどれくらい違ったか」の順に見ると、大きな相対値だけに引っ張られにくくなります。',
          'そして、全体平均のあとに対象の条件と不確かさを読みます。この試験から持ち帰れるのは、薬を自己判断で選ぶ手順ではなく、「効果がある」という文の後ろにある条件を確かめる習慣です。',
        ], evidence: [],
      },
    ],
    concepts: [
      { id: 'treatment-effect', parentId: null, label: '治療効果の読み方', sectionId: 'question' },
      { id: 'randomization', parentId: 'treatment-effect', label: '無作為な割り付け', sectionId: 'method' },
      { id: 'mortality', parentId: 'treatment-effect', label: '28日死亡', sectionId: 'overall-effect' },
      { id: 'absolute-effect', parentId: 'mortality', label: '相対値と絶対差', sectionId: 'overall-effect' },
      { id: 'respiratory-group', parentId: 'mortality', label: '呼吸補助別の違い', sectionId: 'respiratory-support' },
      { id: 'applicability', parentId: 'treatment-effect', label: '適用範囲と副作用', sectionId: 'limits' },
    ],
    readingOrder: ['treatment-effect', 'randomization', 'mortality', 'absolute-effect', 'respiratory-group', 'applicability'],
    diagrams: [{
      id: 'recovery-comparison', kind: 'original-schematic',
      caption: '無作為割付から、全体の効果と呼吸補助別の結果を分けて読む。',
      alt: '入院患者6,425人を二群に分け、28日死亡を比較し、開始時の呼吸補助別に見る概念図',
      description: '入院患者から薬追加・通常診療へ二分岐し、28日死亡へ接続。その下に全体の相対値と絶対差、呼吸補助別の対象条件、適用範囲を置く独自の概念図。元論文の図版は使用しない。',
      sectionIds: ['method', 'overall-effect', 'respiratory-support', 'limits'],
    }],
  },
  cardSteps: ['対象を\n確かめる', '死亡を\n比較する', '条件別に\n読む'],
  glossary: [
    { id: 'randomization', english: 'randomization', meaning: '比較する群を偶然に基づいて割り当てる方法。群の背景の偏りを小さくするために使います。' },
    { id: 'mortality', english: 'all-cause mortality', meaning: '原因を限定せず、一定の期間内に死亡したかを見る指標です。' },
    { id: 'absolute-effect', english: 'absolute difference', meaning: '二つの割合を引いた差。相対的な増減率とは分けて読み、パーセントポイントで表します。' },
    { id: 'respiratory-group', english: 'subgroup analysis', meaning: '対象者を特徴ごとに分けた比較。事前に予定されていたか、不確かさがどれくらいあるかも確認します。' },
  ],
  tables: [{
    sectionId: 'respiratory-support', label: '開始時の呼吸補助別・28日死亡',
    caption: '最終報告Figure 3から独自に整理。割合は未調整、率比と95%信頼区間は年齢調整済み。率比1が差なしに対応します。',
    columns: ['開始時の状態', '通常診療', '薬を追加', '死亡率比（95%信頼区間）'],
    rows: [
      ['侵襲的人工呼吸あり', '41.4%', '29.3%', '0.64（0.51〜0.81）'],
      ['酸素あり・侵襲的人工呼吸なし', '26.2%', '23.3%', '0.82（0.72〜0.94）'],
      ['酸素なし', '14.0%', '17.8%', '1.19（0.92〜1.55）'],
    ],
  }],
});
