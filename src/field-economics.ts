import { deepFreeze } from './model.js';
import type { PublishedExplainer } from './research-catalog.js';
import type { EvidenceReference } from './research-article.js';

const fullText = 'https://emiguel.econ.berkeley.edu/wordpress/wp-content/uploads/2019/11/ecta200500.pdf';
const appendix = 'https://emiguel.econ.berkeley.edu/wordpress/wp-content/uploads/2019/11/ecta200500-sup-0001-onlineappendix.pdf';
const publisher = 'https://onlinelibrary.wiley.com/doi/full/10.3982/ECTA17945';
const reanalysis = 'https://files.givewell.org/files/DWDA%202009/GiveDirectly/Michael_Wiebe_Reanalysis_of_Egger_et_al_2022.pdf';
const leungReanalysis = 'https://arxiv.org/html/2310.18836v5';
const paperId = 'egger-cash-transfers-2022';
const evidence = (locator: string, page: number, supports: string): EvidenceReference => ({
  paperId, locator, supports, url: fullText + '#page=' + page,
  verificationNote: '2026-10-26に掲載版本文と補足B〜Dを読解し、記載と照合。元データの再解析・追試は行っていません。',
});

export const economicsExplainer: PublishedExplainer = deepFreeze({
  article: {
    slug: 'cash-transfers-and-local-spillovers',
    title: '現金給付は、受け取らなかった人にも届く？ ケニアの地域実験を読む',
    publishedDate: '2026-10-26', readingMinutes: 6, category: '経済',
    summary: '給付を受けた家の外へ、効果はどこまで届くのか。653村の実験と後の再分析を読み、地域への波及や「2.5倍」という推定の不確かさを考えます。',
    evidenceScope: '2014〜2017年のケニア西部農村における、地域外の資金による一度限りの現金給付',
    audience: '現金給付のニュースを、受給者と地域の両方から考えたい人',
    centralQuestion: '現金給付の効果は、直接受け取った家計の外へどのように広がるか？',
    tags: ['経済', '現金給付', '地域経済', '波及効果', 'ケニア', 'ランダム化比較試験'],
    authorship: {
      siteByline: 'RONLENS', distinction: 'site-authored-explainer-not-original-paper',
      productionDisclosure: 'AIを用いて原論文全文を読み、出典と本文を照合して作成したサイト独自の解説です。論文著者による執筆・監修ではありません。元データの再解析や実験の追試は行っていません。',
    },
    papers: [{
      id: paperId,
      title: 'General Equilibrium Effects of Cash Transfers: Experimental Evidence From Kenya',
      authors: ['Dennis Egger', 'Johannes Haushofer', 'Edward Miguel', 'Paul Niehaus', 'Michael Walker'],
      year: 2022, venue: 'Econometrica, 90(6), 2603–2643', doi: '10.3982/ECTA17945',
      primaryUrl: 'https://doi.org/10.3982/ECTA17945', fullTextUrl: fullText,
      fullTextLabel: '著者サイト公開の掲載版全文PDF',
      inspectedMaterial: 'full-text', publicationType: 'journal-article',
      record: {
        firstPublished: '2022-06-24', firstPublishedLabel: '掲載版PDFに記載のオンライン公開日',
        revisedOn: null, version: 'Econometrica掲載版（2022年11月号）', checkedOn: '2026-10-26', peerReview: 'peer-reviewed',
        revisionNote: '掲載版末尾はオンライン公開2022-06-24、現行出版社ページのFirst published表示は2022-11-22です。2019年のワーキングペーパーと区別し、この記事は掲載版を使用。掲載版の訂正・改訂日は確認できていません。',
        materialNote: '掲載版本文41ページ（付録A・参考文献を含む）と、別冊補足B〜Dの26ページを読解。複製用データ・コードに含まれる補足E〜Kと元データの再解析は未実施。',
        integrityNote: '確認した出版社・著者ページには撤回・訂正の告知を確認できませんでした。Leungの2025年改訂稿§7・補足SA.4では、比較する効果を変えた再分析で、直接効果に比べ波及効果の証拠は弱いと報告されています。Wiebeの2024年報告は要約・§2〜3を確認。2026年10月公開のZhouによる再分析候補は全文未取得で結論未評価です。再分析の網羅的な確認や、当サイトによる計算の再現を意味しません。',
        integritySources: [
          { label: '出版社の掲載情報・利益相反の開示', url: publisher },
          { label: '著者の論文ページ', url: 'https://emiguel.econ.berkeley.edu/research/general-equilibrium-effects-of-cash-transfers-experimental-evidence-from-kenya/' },
          { label: 'Leungの再分析：2025年改訂稿v5、§7・補足SA.4', url: leungReanalysis + '#S7' },
          { label: 'Leungの再分析論文の掲載情報（JASA）', url: 'https://doi.org/10.1080/01621459.2025.2566416' },
          { label: 'Wiebe（2024）再分析報告：確認範囲は要約・§2〜3', url: reanalysis },
          { label: 'Zhou（2026）再分析候補：全文未確認', url: 'https://papers.ssrn.com/sol3/papers.cfm?abstract_id=7635120' },
        ],
      },
    }],
    sections: [
      {
        id: 'introduction', title: '家計に入ったお金は、その先へ動く', role: 'context',
        paragraphs: ['給付金で食材を買えば、その支出は店の売上になります。店が仕入れや賃金に使えば、給付を受けていない人の暮らしにも影響するかもしれません。反対に、物が足りなければ値段が上がる可能性もあります。', 'Eggerらはケニアの農村で、受給した家計だけでなく、周囲の家計・事業者・市場価格を調べました。原論文は大きな波及を推定しましたが、後の別手法による再分析では、その証拠の強さに留保が付きます。この記事では、両方を分けて読みます。'],
        evidence: [evidence('§1 Introduction', 1, '受給者に加え、非受給者・事業者・価格を対象とした研究の問い。')],
      },
      {
        id: 'design', title: '653村で、給付が多い地域と少ない地域をつくる', role: 'method',
        paragraphs: ['実験はケニア西部の653村で行われました。草ぶき屋根の家を対象に、NGOのGiveDirectlyが計10,500世帯超へ、1世帯あたり合計87,000ケニア・シリング（当時の名目額で約1,000米ドル）を給付。8か月にわたる3回の支払いで、その後も毎月続く制度ではありません。', '研究者は地域ごとに、給付する村の割合を3分の2または3分の1へ無作為に割り当て、地域内のどの村へ給付するかも無作為に決めました。対象となった村では、条件を満たす全世帯が給付を受けます。近隣へ入るお金の量に差をつくり、村の境界を越えた波及を調べる設計です。', '家計調査は開始前に7,845世帯、追跡時に8,239世帯へ実施。追跡調査の時期の中央値は、予定された給付開始から19か月後でした。両調査の世帯数が違うのは、開始前に調査できなかった世帯なども追跡対象に含めたためです。'],
        evidence: [evidence('§2.1〜2.3、§3.1', 4, '地域・対象・給付額と支払期間、二段階の無作為割当、家計調査数と追跡時期。')],
      },
      {
        id: 'spending', title: '原論文は非受給者の支出増を推定したが、再分析には留保も', role: 'finding',
        paragraphs: ['原論文で周囲の村への給付も考慮した推定では、追跡時の家計支出は、受給世帯で年間換算約339ドル、非受給世帯で約335ドル増えました。ここでのドルは、物価水準の違いを調整した購買力平価（PPP）の単位です。給付の名目1,000ドルとは単位が違い、この2つをそのまま割り算できません。', '表はモデルを使った「給付がなかった場合との差」の推定です。実際に全世帯が同じ額を受け取ったわけでも、調査期間中の支出を合計した額でもありません。標準誤差は推定の不確かさを表します。非受給者には、給付しない村の対象世帯と、屋根の条件を満たさない世帯の両方が含まれます。', '効果は一様ではありません。補足の分析では、非受給世帯の支出増加の多くは給付対象外の世帯に見られ、給付しない村の対象世帯では明確な増加を確認できませんでした。「受け取らない人も皆同じように得をする」とは読めません。', 'さらにLeungの再分析（2025年改訂稿）は、村の平均を単位として、給付する村が3分の1の地域と3分の2の地域を比較しました。直接受け取る効果は強い一方、波及については推定の不確かさが大きく、原論文ほど強い証拠ではないと報告しています。', '原論文が推定する「周囲への給付がゼロの場合との差」と、再分析の「少ない給付と多い給付の差」は同じ問いではありません。この結果だけで原論文が覆されたとは言えませんが、波及の大きさが分析方法や仮定にかかわらず確定したとも扱えません。', '市場で測った品物の価格については、原論文の給付による追加的な変化の推定平均は約0.1%でした。これは地域の物価上昇率そのものが0.1%だった、という意味ではありません。'],
        evidence: [
          evidence('Table I、§4.1、§4.4、Table IV', 17, '年間換算支出の総効果338.57/334.77、標準誤差109.38/123.20、非受給者の定義、価格への小さな追加効果。'),
          { paperId, locator: '補足 Table B.VIII', url: appendix + '#page=13', supports: '非受給者の平均は異質な集団をまとめた値であり、対象外世帯と対照村の対象世帯の効果は異なる。', verificationNote: '補足B〜Dを全文読解。Table B.VIIIの列定義と年間換算支出の推定・標準誤差を照合。' },
          evidence('§4.5、Table IV', 24, '全商品の価格指数への平均処置効果は0.0010対数ポイント、約0.1%。地域全体のインフレ率ではない。'),
          { paperId, locator: 'Leung, Cluster-Randomized Trials with Cross-Cluster Interference, v5 §7・Table 3・補足SA.4', linkLabel: '再分析本文（2025年改訂稿v5）', url: leungReanalysis + '#S7', supports: '村平均による1/3対2/3の比較では、直接効果に比べ波及効果の証拠が弱い。元の0対2/3のモデルによる推定と効果定義が異なる。', verificationNote: '2026-10-26に§7、Table 3、補足SA.4の該当分析を読解・照合。理論証明を含む論文全体の精査や元データの再解析ではありません。' },
        ],
      },
      {
        id: 'multiplier', title: '「2.5倍」は、財布の残高が増えた倍率ではない', role: 'finding',
        paragraphs: ['著者は、給付によって地域の生産がどれだけ増えたかも推定しました。給付総額に対する、29か月間の地域GDPの追加分の比を「地域の給付乗数」と呼びます。支出側から計算すると2.58、所得側から計算すると2.47でした。要約の「約2.5」はこの結果です。', 'ただし推定の不確かさは大きく、標準誤差はそれぞれ1.44と1.71です。各推定について「乗数は1未満」という仮説を調べた片側検定のp値は0.14と0.20で、各々では通常の5%基準で退けられません。2.5という一点を確実な倍率として使うことはできません。', '給付直後の観測が少なく、地域外との取引も完全には測れていません。乗数はその扱いにも左右されます。また、生産が増えることと、暮らしの満足度が同じ倍率で増えることは別です。個人の投資利回りや、どの国でも使える政策の保証値ではありません。'],
        evidence: [evidence('§5、Table V、§6', 26, '29か月の乗数の定義、2.58/2.47、標準誤差1.44/1.71、片側p値0.14/0.20、初期観測・純輸出・厚生との区別。')],
      },
      {
        id: 'mechanism', title: '著者は「余っていた生産能力」に注目する', role: 'interpretation', interpretationBy: 'study-authors',
        paragraphs: ['企業の売上は増えましたが、設備投資や労働投入にはそれに見合う大幅な増加が見られませんでした。著者が考えたのは、客が来れば追加で対応できる店や、依頼を待つ製造業者に、生産を増やす余地があった可能性です。', 'この説明なら、需要が増えても、価格を大きく上げずに供給を増やせます。ただし、著者自身が推測を含む説明として示しています。生産能力の余裕を直接操作して、仕組みを確定した実験ではありません。'],
        evidence: [evidence('§4.3、§7', 33, '需要による売上増加と、未利用の生産能力という著者の仮説。仕組みの確定とは区別。')],
      },
      {
        id: 'limits', title: '日本の全国給付へ、そのまま移せない', role: 'limitation',
        paragraphs: ['資金は地域外の寄付者から入りました。地域内の増税や借金で賄う場合、全国で同時に給付する場合、輸入や金利・為替の反応が変わる場合に、同じ効果が出るとは言えません。対象も2014〜2017年のケニア西部農村であり、継続的なベーシックインカムの効果や長期の貧困解消を、この結果だけで判断することはできません。', '研究の開示では、共著者のPaul NiehausはGiveDirectlyの共同創設者・元代表・理事会議長です。実施団体との関係も、読む際の情報として残しておきます。', '2024年のWiebeによる再分析報告では、確認した要約と計算再現性の節に、主要結果を覆す問題は見つからなかった一方、コードの実行にはパスの修正と著者からの不足データ提供が必要だったと記されています。2026年10月の別の再分析候補は、この記事では全文を取得できておらず、その結論は未評価です。現在の全ての再分析を確認済みとは扱いません。'],
        evidence: [
          evidence('§1、§2、§8、著者注', 1, '地域外の資金、研究時期・地域、全国政策への一般化の制約、実施団体との関係。'),
          evidence('§8 Conclusions', 35, '資金調達法、他地域、景気局面によって波及や乗数が変わり得ること。'),
          { paperId, locator: 'Wiebe（2024）再分析報告 §1〜2（本文とは別資料）', linkLabel: '再分析報告（2024年）', url: reanalysis + '#page=1', supports: '第三者報告の結論と当時の計算再現性の問題。2026年現在の再現実行を意味しない。', verificationNote: '報告の要約、計算再現性の節、分配分析§3を確認。報告35ページ全体の精査や当サイトによる再実行は未実施。' },
        ],
      },
      {
        id: 'reading-news', title: '給付のニュースで、三つの行き先を確かめる', role: 'interpretation', interpretationBy: 'site',
        paragraphs: ['ここからは記事側の読み方の提案です。給付の評価を読むときは、受給者の暮らし、周囲の店や非受給者、物価の三つを分けて見てください。平均のプラスだけでは、どこまで効果が届き、誰に届かなかったかが隠れます。', '「何倍の効果」という数字には、何を分子にしたか、何か月分か、資金はどこから来たか、推定の幅はどのくらいかを添える。この論文から持ち帰れるのは、いつでも給付を勧める結論よりも、家計と地域をつなげて確かめる視点です。'],
        evidence: [],
      },
    ],
    concepts: [
      { id: 'local-economy', parentId: null, label: '給付と地域経済', sectionId: 'introduction' },
      { id: 'spillover', parentId: 'local-economy', label: '村を越える波及', sectionId: 'design' },
      { id: 'household-spending', parentId: 'spillover', label: '非受給者の支出', sectionId: 'spending' },
      { id: 'transfer-multiplier', parentId: 'spillover', label: '地域の給付乗数', sectionId: 'multiplier' },
      { id: 'spare-capacity', parentId: 'local-economy', label: '生産を増やす余地', sectionId: 'mechanism' },
      { id: 'scope', parentId: 'local-economy', label: '他の政策への限界', sectionId: 'limits' },
    ],
    readingOrder: ['local-economy', 'spillover', 'household-spending', 'transfer-multiplier', 'spare-capacity', 'scope'],
    diagrams: [{
      id: 'local-spillover-map', kind: 'original-schematic',
      caption: '給付から家計・地域への影響をたどる、RONLENS独自の概念整理',
      alt: '給付と地域経済を中心に、村を越える波及、非受給者の支出、地域の給付乗数、生産余力、他の政策への限界をつなぐ',
      description: '各概念を読むための編集上の階層図。原論文の図を転載したものや、個々のお金の経路を追跡した確定的な因果図ではありません。',
      sectionIds: ['introduction', 'design', 'spending', 'multiplier', 'mechanism', 'limits'],
    }],
  },
  cardSteps: ['家計へ\n給付', '近隣への\n波及を見る', '価格と\n条件を確かめる'],
  glossary: [
    { id: 'spillover', english: 'spillover effect', meaning: '直接の対象者以外へ及ぶ影響。ここでは近隣の家計や事業者への影響を調べています。' },
    { id: 'transfer-multiplier', english: 'local transfer multiplier', meaning: '給付総額に対して、一定期間の地域の生産がどれだけ追加で増えたかを表す比。個人の受取額や幸福の倍率ではありません。' },
    { id: 'spare-capacity', english: 'spare capacity', meaning: '今ある設備や人手で、生産やサービスをさらに増やせる余地。この記事では著者が示した仕組みの仮説として扱います。' },
    { id: 'scope', english: 'external validity', meaning: 'ある研究の結果が、別の地域・対象・制度でも成り立つかという問題。資金の出所や市場の条件が変われば、同じ効果とは限りません。' },
  ],
  tables: [{
    sectionId: 'spending', label: '給付による年間換算家計支出の変化',
    caption: 'Table Iの総効果（IV推定）を独自に整理。単位は1世帯あたりPPP米ドル。追跡時の支出を年間換算した効果で、給付額や累積支出ではありません。標準誤差は推定の不確かさの指標です。',
    columns: ['家計の区分', '推定増加額', '標準誤差'],
    rows: [['受給世帯', '338.57', '109.38'], ['非受給世帯の平均', '334.77', '123.20']],
  }],
});
