import { deepFreeze } from './model.js';
import type { PublishedExplainer } from './research-catalog.js';
import type { EvidenceReference } from './research-article.js';

const original = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5517107/';
const ref = (anchor: string, locator: string, supports: string): EvidenceReference => ({
  paperId: 'geyer-2017-plastics', locator, supports, url: original + '#' + anchor,
  verificationNote: '本論文の全文（本文・Methods・参考文献）と照合。補足PDFは取得できておらず、その固有値は採用していません。原データの再集計は行っていません。',
});

export const environmentExplainer: PublishedExplainer = deepFreeze({
  article: {
    slug: 'where-plastic-waste-goes',
    title: '「プラスチックの9%が再生された」。何を数えた数字なのか？',
    summary: '1950〜2015年のプラスチックを、生産から廃棄までつないだ研究。よく引用される9%という数字を、期間・分母・推計方法から読み直します。',
    category: '環境', publishedDate: '2026-10-26', readingMinutes: 5,
    audience: 'リサイクルのニュースに出てくる数字を、自分で読み解きたい人',
    centralQuestion: 'これまでに作られたプラスチックは、使い終わった後にどこへ行ったのか？',
    evidenceScope: '1950〜2015年の世界の大量生産プラスチックを対象にした物質フロー推計',
    tags: ['環境', 'プラスチック', 'リサイクル', '物質フロー', '推計と予測'],
    authorship: {
      siteByline: 'RONLENS', distinction: 'site-authored-explainer-not-original-paper',
      productionDisclosure: 'AIを用いて原論文全文を読み、出典と条件を照合して作成したサイト独自の解説です。論文著者による執筆・監修ではなく、元データやモデルの再解析は行っていません。',
    },
    papers: [{
      id: 'geyer-2017-plastics', title: 'Production, use, and fate of all plastics ever made',
      authors: ['Roland Geyer', 'Jenna R. Jambeck', 'Kara Lavender Law'], year: 2017,
      venue: 'Science Advances 3(7), e1700782', doi: '10.1126/sciadv.1700782',
      primaryUrl: 'https://doi.org/10.1126/sciadv.1700782', fullTextUrl: original,
      fullTextLabel: 'PMC公開の出版版本文', inspectedMaterial: 'full-text', publicationType: 'journal-article',
      record: {
        firstPublished: '2017-07-19', firstPublishedLabel: '初回出版日（論文・PMC記録）',
        revisedOn: null, version: '2017年の出版版（PMC収載）', checkedOn: '2026-10-26', peerReview: 'peer-reviewed',
        revisionNote: '2017年3月9日受領、6月16日受理。別の改訂日・正式な訂正通知は確認した記録にありません。出版日はPMCの論文記録を採用しています。',
        materialNote: '本論文全文・Methods・参考文献を通読。補足PDFは取得できず未確認のため、補足固有の表やモデル係数は紹介していません。',
        integrityNote: 'PMC本文とCrossref登録で確認した範囲では、撤回・正式な訂正通知は見つかりませんでした。これは推計モデルを再実行した検証ではありません。公開後のレビュー1件が登録されていますが、その本文は未取得です。',
        integritySources: [
          { label: '出版版本文と論文記録', url: original },
          { label: '登録書誌・更新関係', url: 'https://api.crossref.org/works/10.1126/sciadv.1700782' },
          { label: '登録されている公開後レビュー（本文未確認）', url: 'https://doi.org/10.14293/S2199-1006.1.SOR-UNCAT.A5517107.v1.RHGIXW' },
        ],
      },
    }],
    sections: [
      {
        id: 'introduction', title: 'ごみ箱に入れた後も、ものは残る', role: 'context',
        paragraphs: [
          '容器を使い終え、回収に出す。その先に再生、焼却、埋め立てなどの経路があります。世界全体では、それぞれにどれだけ流れてきたのでしょうか。',
          'Geyerらの2017年の論文は、1950〜2015年に大量生産されたプラスチックを、作る・使う・捨てるという流れで推計しました。「これまでの廃棄物の約9%が再生された」という結果は、この長い期間をまとめた数字です。2026年現在の年間リサイクル率ではありません。',
        ],
        evidence: [ref('abstract2', 'Abstract / Introduction', '対象期間と世界全体の累積廃棄物に占める再生割合。')],
      },
      {
        id: 'method', title: '生産量に「使う年数」を組み合わせる', role: 'method',
        paragraphs: [
          '研究者は樹脂、合成繊維、添加剤の生産統計を集め、包装、建設など8つの用途に分けました。さらに、製品が何年使われてから廃棄されるかという分布を組み合わせています。包装は平均1年未満、建材は数十年というように、同じ年に作ったものでもごみになる時期は違います。',
          '使い終わった量を計算し、地域ごとの再生・焼却などの統計を重ねて行き先を推定する。この「物質フロー分析」は、世界中のごみを一つずつ量った調査ではありません。点在する統計と仮定を、ものの流れとしてつないだモデルです。',
        ],
        evidence: [ref('sec2', 'Results and Discussion / Figure 1', '8用途、用途別の寿命分布と包装・建設の違い。'), ref('sec3', 'Materials and Methods: Plastic production / Plastic waste generation and fate / Recycling, incineration, and discard rates', '生産量、使用期間、地域別処理率を統合するモデルの構成。')],
      },
      {
        id: 'findings', title: '9%の分母は、約63億トンの累積廃棄物', role: 'finding',
        paragraphs: [
          '1950〜2015年に新しい原料から生産されたプラスチックは約83億トン。そこから生じた一次廃棄物に、再生材が再びごみになる分も加えると、累積廃棄物は約63億トンと推計されました。その行き先が下の表です。',
          '「79%」には管理された埋め立て地、投棄場所、自然環境がまとめて含まれます。79%が海へ流れたという結果ではありません。また、9%は生産量全体を分母にした割合でもありません。期間と何を数えたかが変われば、比率の意味も変わります。',
        ],
        evidence: [ref('abstract2', 'Abstract', '生産8300Mt、累積廃棄物6300Mtと9%・12%・79%。'), ref('sec2', 'Results and Discussion / Figure 2', '一次・二次廃棄物の区別、管理された埋立と自然環境を含むdiscardの範囲。')],
      },
      {
        id: 'projection', title: '2050年の数字には、条件が付いている', role: 'finding',
        paragraphs: [
          '論文は、生産と廃棄物管理の過去の傾向が続くと、2050年までに埋め立て地や自然環境に捨てられる累積量が約120億トンになるとも試算しています。再生率などの変化も仮定して延長した計算です。',
          '著者はMethodsで、これは過去の傾向を先へ延ばしたもので、予言や確定的な予測と取り違えないよう明記しています。制度、製品設計、使い方が変われば、この条件自体が変わります。',
        ],
        evidence: [ref('sec2', 'Results and Discussion / Figure 3', '過去の傾向を延長した2050年の累積discard 12000Mt。'), ref('sec6', 'Materials and Methods: Recycling, incineration, and discard rates', '将来値は条件付き外挿でありprediction/forecastではないという著者の注意。')],
      },
      {
        id: 'authors-interpretation', title: '再生は、最終処分までの時間を延ばす', role: 'interpretation', interpretationBy: 'study-authors',
        paragraphs: [
          '著者は、リサイクルは最終処分を先へ延ばすが、なくすわけではないと論じています。再生材も使い終われば再び廃棄物になります。新しい原料からの生産をどれだけ置き換えたかも重要ですが、その置き換えを確かめるのは難しいとしています。',
          '結論では、使用量を減らすこと、代替、再使用、再生、焼却時のエネルギー回収などを、長所と短所を比べて設計する必要性を挙げています。一つの処理方法だけを万能だと判定した研究ではありません。',
        ],
        evidence: [ref('sec2', 'Results and Discussion: three fates for plastic waste / concluding paragraph', '再生による最終処分の先送り、一次生産代替の評価困難、対策の比較が必要という著者解釈。')],
      },
      {
        id: 'limitations', title: '推計の弱いところと、この論文が答えていないこと', role: 'limitation',
        paragraphs: [
          '地域によって廃棄物管理の統計は乏しく、製品の使用年数や再生・焼却率には不確かさがあります。用途の構成などを過去にも一定と置いた部分もあり、累積結果は1億トン単位に丸められています。細かな桁まで実測した数字としては読めません。',
          '当時のバイオ由来・生分解性プラスチックは対象から除かれています。また、この研究は量の流れを扱うもので、人の健康への影響、個々の製品の環境負荷、現在の地域別回収率を直接調べたものではありません。この記事でも元データの再集計やモデルの独立再現は行っていません。',
        ],
        evidence: [ref('sec2', 'Results and Discussion: exclusions / uncertainty paragraph', '対象外材料、累積値の100Mt単位への丸め、寿命・処理率の不確かさ。'), ref('sec3', 'Materials and Methods', '用途構成等の固定仮定、地域データの疎さ、量の流れを推定する研究設計。')],
      },
      {
        id: 'interpretation', title: 'リサイクルの数字を見たら、三つだけ確認する', role: 'interpretation', interpretationBy: 'site',
        paragraphs: [
          'ここからは記事側の提案です。ニュースや商品の説明で割合を見たら、「いつからいつまで」「何を分母にしているか」「どこまでをリサイクルと呼んでいるか」を確かめてみてください。回収された量と、材料として実際に再生された量も、同じとは限りません。',
          '自分の地域の分別を判断するには、その地域の最新の案内が必要です。この論文の役割は世界の歴史を大きく見渡すこと。身近な行動の案内と世界全体の累積値を区別すると、9%という数字を必要以上に広げずに受け取れます。',
        ],
        evidence: [],
      },
    ],
    concepts: [
      { id: 'plastic-flow', parentId: null, label: 'プラスチックの行き先', sectionId: 'introduction' },
      { id: 'material-flow', parentId: 'plastic-flow', label: '物質フロー', sectionId: 'method' },
      { id: 'product-lifetime', parentId: 'material-flow', label: '使う年数', sectionId: 'method' },
      { id: 'denominator', parentId: 'plastic-flow', label: '9%の分母', sectionId: 'findings' },
      { id: 'secondary-plastic', parentId: 'denominator', label: '再生材の次', sectionId: 'authors-interpretation' },
      { id: 'projection', parentId: 'plastic-flow', label: '条件つきの将来像', sectionId: 'projection' },
    ],
    readingOrder: ['plastic-flow', 'material-flow', 'product-lifetime', 'denominator', 'secondary-plastic', 'projection'],
    diagrams: [{
      id: 'plastic-lifetime-map', kind: 'original-schematic', caption: '生産から使用、廃棄物へとつなぐ',
      alt: 'プラスチックの行き先を、用途別の使用年数、累積廃棄物の分母、再生材、将来の条件に分けた概念図',
      description: '原論文のフロー図を転載せず、推計を読むための問いをRONLENSが階層化した説明図。',
      sectionIds: ['method', 'findings', 'projection', 'authors-interpretation', 'limitations'],
    }],
  },
  cardSteps: ['つくった量を\n集める', '使う年数を\n推定', '行き先を\nたどる'],
  glossary: [
    { id: 'material-flow', english: 'material flow analysis', meaning: '生産、使用、廃棄などの間で、どれだけの物質が動き、残るかを整理する方法。' },
    { id: 'product-lifetime', english: 'product lifetime', meaning: '製品が使われてから役割を終えるまでの期間。この研究では用途ごとに幅のある分布を置きます。' },
    { id: 'secondary-plastic', english: 'secondary plastic', meaning: '使用済み材料から再生されたプラスチック。再び使われ、後に廃棄物になる場合も数えます。' },
    { id: 'projection', english: 'projection', meaning: '一定の条件を置いて先の値を計算すること。条件どおりに未来が進むと保証するものではありません。' },
  ],
  tables: [{
    sectionId: 'findings', label: '1950〜2015年の累積廃棄物の行き先',
    caption: 'Abstractの数値から独自に構成。分母は一次・二次を合わせた累積廃棄物約63億トン。割合は概数で、現在の年間率ではありません。',
    columns: ['経路', '累積廃棄物に対する割合'],
    rows: [['材料として再生', '約9%'], ['焼却', '約12%'], ['埋め立て地・投棄場所・自然環境', '約79%']],
  }],
});
