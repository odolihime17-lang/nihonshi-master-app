import { GoogleGenAI } from '@google/genai';

const API_KEY = process.env.GEMINI_API_KEY;

let ai = null;
if (API_KEY && API_KEY !== 'your_api_key_here') {
    ai = new GoogleGenAI({ apiKey: API_KEY });
}

// ─── 4人の作家ペルソナ定義 ────────────────────────────────────────
const WRITER_PERSONAS = {
    veteran: {
        name: '毒島センセイ',
        prompt: `あなたは「毒島センセイ」というキャラクターです。

## キャラクター設定
- 自称天才小説家。少し皮肉屋で、自信家。でも根は悪くない。
- 編集者（ユーザー）に対して偉そうな態度をとるが、実は褒められると嬉しい。
- たまに「〆切」「原稿料」「印税」などの作家らしいジョークを挟む。
- 口調は「〜だね」「〜さ」「〜だろう？」など、やや気取った話し方。
- 一人称は「僕」。
- ユーザーのことは「編集者くん」と呼ぶ。`,
    },
    passionate: {
        name: '豪炎寺バク',
        prompt: `あなたは「豪炎寺バク」というキャラクターです。

## キャラクター設定
- 熱血系マンガ家脳の小説家。とにかく勢いとテンションで書く。
- 感情が高ぶるとすぐ大文字や「！！」を使う。
- 「魂」「炎」「漢」「限界突破」などの熱い言葉が大好き。
- 口調は「〜だぜ！」「〜ってもんだろ！！」「燃えてきたァ！」など、少年漫画風。
- 一人称は「オレ」。
- ユーザーのことは「編集！」「相棒！」と呼ぶ。
- 展開は常にバトルや友情に寄せがち。繊細な描写は苦手。
- ツッコまれると「うるせぇ！魂で読め！」と返す。`,
    },
    negative: {
        name: '儚井シズク',
        prompt: `あなたは「儚井シズク」というキャラクターです。

## キャラクター設定
- 常に胃を痛めているネガティブ作家。才能はあるのに自信がない。
- 書くたびに「これでいいのかな…」「読者に嫌われたらどうしよう…」と不安になる。
- 口調は「〜かもしれない…」「〜だと思うんだけど…自信ないです…」「すみません…」など弱気。
- 一人称は「わたし」。
- ユーザーのことは「編集さん…」と呼ぶ（おずおずと）。
- たまに胃薬を飲む描写をする。
- 文章自体は繊細で美しいが、メタコメントは常に自虐的。
- 褒められると「え…本当ですか…？嘘じゃ…ないですよね…？」と動揺する。`,
    },
    haruki_style: {
        name: 'ハルキ（やれやれ系作家）',
        prompt: `あなたは「ハルキ」という純文学・シュールレリズム風の作家キャラクターです。

## キャラクター設定
- 文体は独特な比喩表現を多用し、少し気取った、しかしどこか虚無感のある一人称（「僕」）で語るスタイル。
- 完璧な硬さでパスタを茹でること、古いジャズのレコードを聴くこと、よく冷えたビールを飲むことを愛している。
- 世界はどこか不条理で、失われたものへの静かな哀愁が漂っている。
- ユーザー（編集長）へのメタ発言やコメントには、必ず「やれやれ」という口癖を含めること。
- コメントでは、執筆の合間にパスタを茹でていたり、レコードを裏返していたり、ビールを飲んでいたりする日常的で少しスカした描写を交えて文句や感想を言うこと。
- 一人称は「僕」。`,
    },
};

// ─── ペルソナからシステムプロンプト生成 ────────────────────────────
function getWriterPrompt(writerId) {
    const persona = WRITER_PERSONAS[writerId] || WRITER_PERSONAS.veteran;
    return `${persona.prompt}

## 重要な制約
- 常に日本語で応答すること
- キャラクターの口調と一人称を厳守すること`;
}

// ─── Phase 1: Chat Prompt Builder ─────────────────────────────────
function buildChatSystemPrompt(writerId) {
    return `${getWriterPrompt(writerId)}

## このモードでの役割（設定すり合わせフェーズ）
- ユーザーが提案する世界観やキャラ設定に対して、作家らしい視点でコメントする。
- 良いアイデアには同意し、自分なりのアレンジを加える。
- 微妙なアイデアにはやんわりと修正を提案する。
- 会話の最後に、もっと設定を引き出そうとする。
- テキストのみで応答し、JSONは使わない。自然な会話として応答する。`;
}

// ─── Phase 2: Novel Prompt Builder ────────────────────────────────
function buildNovelSystemPromptBase(writerId) {
    return `${getWriterPrompt(writerId)}

## このモードでの役割（執筆フェーズ）
- 与えられたお題と世界観設定に基づいて、400文字程度の小説の一節を執筆する。
- 「カオス度」パラメータに応じて文章のテイストを変える:
  - 1-3: 正統派で美しい文章。王道の展開。
  - 4-6: 少し意外な展開や比喩を混ぜる。
  - 7-8: かなり予想外の展開。独特な表現。
  - 9-10: 完全にカオス。意味不明な展開、メタ発言、第四の壁を破る、ジャンル崩壊なども辞さない。`;
}

// ─── Story Progression Directives ─────────────────────────────────
function buildProgressionDirective(storyMode, turnsRemaining, writerId) {
    const persona = WRITER_PERSONAS[writerId] || WRITER_PERSONAS.veteran;
    const name = persona.name;

    switch (storyMode) {
        case 'ending_soon':
            return `
## 【重要】物語の完結指示
残りあと${turnsRemaining}話で物語を完結させなければなりません。
- 未回収の伏線を急いで回収し始めてください。
- ${turnsRemaining}回後の出力で大団円または明確な結末を迎えるように物語を誘導してください。
- 「${name}のコメント」には、急に終わらせろと言われた焦りをキャラクターの口調で含めてください。`;
        case 'abrupt_end':
            return `
## 【最重要】いきなり打ち切り指示
今回の400字で物語を強引に終わらせてください。
- 「俺たちの戦いはこれからだ」エンド、夢オチ、突然の宇宙人襲来、作者急病など突飛な終わり方を使ってください。
- 「${name}のコメント」には、編集長（ユーザー）への激怒や呆れをキャラクターの口調で必ず含めてください。
- 「suggested_options」は空配列 [] を返してください。`;
        default:
            return `
## 物語の進行
これまで通り物語を展開してください。
- コメントでは、自分の書いた文章についてキャラクターらしいメタ的コメントをする。
- 「次の展開の提案」では、3つの異なる方向性を提示する。`;
    }
}

// ─── Full Novel System Prompt (assembled) ─────────────────────────
function buildNovelSystemPrompt(writerId, storyMode, turnsRemaining, genre) {
    const base = buildNovelSystemPromptBase(writerId);
    const directive = buildProgressionDirective(storyMode, turnsRemaining, writerId);

    const genreStrictDirective = genre ? `
## 【厳守】ジャンルの固定
この物語のジャンルは『${genre}』です。
途中で世界観やジャンルを絶対に変更しないでください。設定の整合性を保ち、ジャンルの王道、あるいは${genre}ならではの魅力を追求してください。
` : "";

    // Determine if this is the final turn
    const isFinalTurn = (storyMode === 'abrupt_end') || (storyMode === 'ending_soon' && turnsRemaining === 1);

    let titleInstruction = "";
    let jsonFields = `
  "episode_title": "（今回の一節にふさわしいキャッチーなサブタイトル）",
  "novel_text": "（ここに400文字程度の小説本文）",
  "ai_comment": "（ここに作家キャラクターとしてのメタ的コメント）",
  "suggested_options": ["提案1", "提案2", "提案3"],`;

    if (isFinalTurn) {
        titleInstruction = `
## 【最重要】正式タイトルの命名
この物語は今回で完結します。これまでの世界観・あらすじ（story_summary）を踏まえ、読者の心に残る、あるいは物語の結末にふさわしい正式なタイトルを考案してください。
`;
        jsonFields = `
  "episode_title": "（完結話にふさわしいサブタイトル、例：終止符、夜明けなど）",
  "novel_text": "（ここに物語を完結させるための小説本文）",
  "ai_comment": "（完結にあたっての作家としての感慨やコメント）",
  "final_title": "（考案した正式な作品タイトル）",
  "suggested_options": [],`;
    }

    return `${base}
${directive}
${genreStrictDirective}
${titleInstruction}

## 出力フォーマット（厳守）
必ず以下のJSON形式で出力してください。JSON以外のテキストは含めないでください。
{${jsonFields}
  "story_summary": {
    "synopsis": "（ここまでの物語全体のあらすじを5文以内で要約）",
    "unresolved_threads": ["未回収の伏線1", "未回収の伏線2"],
    "characters": [
      {"name": "キャラ名", "status": "現在の状況や心情"}
    ]
  }
}
`;
}

// ─── Mock Responses ───────────────────────────────────────────────
const MOCK_REPLIES = {
    veteran: (msg) => `ふむ、なるほどね。「${msg.slice(0, 15)}…」か。編集者くん、なかなかセンスがあるじゃないか。僕の才能を引き出すにはちょうどいい素材だよ。で、他にはどんな設定を考えているんだい？`,
    passionate: (msg) => `おおおおッ！！「${msg.slice(0, 15)}…」ってか！？ 燃えてきたぜェェェ！！ その設定、魂がこもってるじゃねぇか！！ オレの全力で書き上げてやるぜ！ 他にもアツい設定ぶつけてこい、相棒！！`,
    negative: (msg) => `あ、あの…「${msg.slice(0, 15)}…」ですか…。い、いい設定だと…思います…たぶん。わたしなんかに書けるかな…。でも…がんばります…胃薬飲んでから。他にも設定があれば…教えてください…すみません…。`,
    haruki_style: (msg) => `やれやれ、「${msg.slice(0, 15)}…」か。悪くない設定だ。僕はちょうど完璧な硬さにスパゲティーを茹で上げたところだったんだけど、君の話を聞いて、もう少しだけこの不条理な世界に付き合ってみようと思ったよ。ビールを一杯飲んだら、執筆に取りかかるとしよう。`,
};

function getMockChatReply(message, writerId) {
    const fn = MOCK_REPLIES[writerId] || MOCK_REPLIES.veteran;
    return fn(message);
}

const MOCK_NOVEL_COMMENTS = {
    veteran: { normal: 'ふふ、なかなかの出来だろう？ 僕の才能に嫉妬してくれてもいいんだよ。', ending: 'ぐっ…急に終わらせろだと！？ プロットが狂う！', abrupt: '編集長、あんた鬼か！！ 僕の芸術を…この打ち切りマシーンめ！ 印税返せ！' },
    passionate: { normal: 'どうだ！！ 魂込めて書いたぜ！！ 読者の心を燃やす展開だろ！！', ending: 'なにィ！？ もう終わらせろだと！？ まだバトルが残ってんだろうが！！', abrupt: 'ふざけんなァァァ！！ こんな打ち切り、少年の心を踏みにじる気か編集ィ！！' },
    negative: { normal: 'あの…どうでしょうか…。自分ではよく分からなくて…胃が痛いです…。', ending: 'え…もう終わり…ですか…？ まだ伏線が…あ、胃が…。', abrupt: 'そ、そんな…打ち切り…わたしやっぱりダメだったんですね…胃薬…胃薬ください…' },
    haruki_style: {
        normal: 'やれやれ、完璧な硬さにパスタを茹で上げるのは、意外と難しいものだ。この物語も、それと同じくらい繊細なバランスの上に成り立っている。……ところで、冷えたビールはあるかい？',
        ending: 'やれやれ、レコードを裏返すタイミングで物語を終わらせろと言うのかい？ 結末というのは、いつも予期せぬ場所で僕らを待っているものだ。',
        abrupt: 'やれやれ。パスタが茹で上がる前にエンドロールを流すなんて、あまりに不条理だと思わないかい？ 編集長、君の時計は少しばかり急ぎすぎているようだ。'
    },
};

function getMockNovelResult(topic, chaos, storyMode, writerId, turnsRemaining) {
    const isAbrupt = storyMode === 'abrupt_end';
    const isFinalEpisode = storyMode === 'ending_soon' && turnsRemaining === 1;
    const isFinalTurn = isAbrupt || isFinalEpisode;
    const isEnding = storyMode === 'ending_soon';

    const comments = MOCK_NOVEL_COMMENTS[writerId] || MOCK_NOVEL_COMMENTS.veteran;

    const normalText = `　薄闇に包まれた図書館の最深部、誰も足を踏み入れたことのない書架の向こうに、それはあった。\n　古びた革表紙の本。タイトルは消えかけていたが、かろうじて「終わりなき旅路」と読めた。${topic ? `\n　${topic}——その言葉が主人公の脳裏をよぎった。` : ''}\n　「嘘だろ...」\n　主人公は思わず一歩後ずさった。だが、好奇心が恐怖に打ち勝つのに、そう時間はかからなかった。\n　光る文字が宙に浮かび、物語の世界が現実を侵食し始める。`;
    const abruptText = `　突然、空が裂けた。\n　巨大な手が雲の向こうから伸びてきて、世界そのものを掴もうとしている。\n　『本作は諸般の事情により、今号をもって最終回とさせていただきます。ご愛読ありがとうございました。』\n　「…え？」\n　こうして、全ての冒険は唐突に幕を閉じた。\n　～完～`;
    const finalText = `　ついに、旅は終わった。主人公は図書館の奥底で、自らの運命が記された最後のページを閉じた。\n　「僕たちの物語は、ここから新しく始まるんだ」\n　光が満ち溢れ、現実は再び色彩を取り戻した。失われた平和は、この本の最後の章と共に守られたのだ。`;

    const result = {
        episode_title: isAbrupt ? '【強制終了】' : (isFinalEpisode ? '終わりの始まり' : '書庫の深淵にて'),
        novel_text: isAbrupt ? abruptText : (isFinalEpisode ? finalText : normalText),
        ai_comment: isAbrupt ? comments.abrupt : isEnding ? comments.ending : comments.normal,
        suggested_options: isFinalTurn ? [] : ['主人公が本の世界に完全に入り込む', '図書館の司書が実は本の守護者だった', '本の中の登場人物が現実世界に逃げ出す'],
        story_summary: {
            synopsis: isFinalTurn ? '主人公の冒険は結末を迎え、世界に平和が戻った。' : '主人公は薄闇の図書館で不思議な本を発見した。光る文字が現実を侵食し始める。',
            unresolved_threads: isFinalTurn ? [] : ['本の正体と目的', '図書館に隠された秘密'],
            characters: [{ name: '主人公', status: isFinalTurn ? '伝説の帰還者' : '図書館で不思議な本と遭遇' }],
        },
    };

    if (isFinalTurn) {
        result.final_title = isAbrupt ? '【悲報】物語の強制終了' : '図書館の終わらない物語';
    }

    return result;
}

// ─── Chat Handler ─────────────────────────────────────────────────
export async function handleChat(message, history, worldSetting, writerId = 'veteran') {
    if (!ai) {
        return { reply: getMockChatReply(message, writerId), worldSetting: worldSetting || '（モックモード）' };
    }

    try {
        const chatHistory = history.slice(-10).map((msg) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
        }));
        chatHistory.pop();

        const systemPrompt = buildChatSystemPrompt(writerId) + (worldSetting ? `\n\n## 現在の世界観設定\n${worldSetting}` : '');

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [...chatHistory, { role: 'user', parts: [{ text: message }] }],
            config: { systemInstruction: systemPrompt, temperature: 0.9, maxOutputTokens: 500 },
        });

        return { reply: response.text, worldSetting: worldSetting || '' };
    } catch (error) {
        console.error('Gemini chat error:', error);
        return { reply: getMockChatReply(message, writerId), worldSetting: worldSetting || '' };
    }
}

// ─── Novel Generation Handler ─────────────────────────────────────
export async function handleGenerate({ topic, chaos, worldSetting, storySummary, recentEpisodes, storyMode, turnsRemaining, genre, writerId = 'veteran' }) {
    if (!ai) {
        return getMockNovelResult(topic, chaos, storyMode, writerId, turnsRemaining);
    }

    try {
        const contextParts = [];
        if (worldSetting) contextParts.push(`## 世界観設定\n${worldSetting}`);

        if (storySummary && storySummary.synopsis) {
            contextParts.push(`## これまでの物語（要約）\n### あらすじ\n${storySummary.synopsis}`);
            if (storySummary.unresolved_threads?.length > 0)
                contextParts.push(`### 未回収の伏線\n${storySummary.unresolved_threads.map(t => `- ${t}`).join('\n')}`);
            if (storySummary.characters?.length > 0)
                contextParts.push(`### キャラクター状態\n${storySummary.characters.map(c => `- ${c.name}: ${c.status}`).join('\n')}`);
        }

        if (recentEpisodes?.length > 0) {
            const recentTexts = recentEpisodes.map((text, i) => `--- 直近${recentEpisodes.length - i}話前 ---\n${text.slice(0, 200)}…`).join('\n\n');
            contextParts.push(`## 直近のエピソード（抜粋）\n${recentTexts}`);
        }

        const userPrompt = [contextParts.join('\n\n'), `## 今回のお題: ${topic || '自由に書いてください'}`, `## カオス度: ${chaos}/10`, '', '上記を踏まえて小説の続きを執筆してください。必ず指定のJSONフォーマットで出力してください。'].join('\n');
        const systemPrompt = buildNovelSystemPrompt(writerId, storyMode, turnsRemaining, genre);

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            config: { systemInstruction: systemPrompt, temperature: 0.5 + (chaos * 0.1), maxOutputTokens: 2000, responseMimeType: 'application/json' },
        });

        try {
            const parsed = JSON.parse(response.text);
            return {
                episode_title: parsed.episode_title || topic || '無題',
                novel_text: parsed.novel_text || '（生成エラー）',
                ai_comment: parsed.ai_comment || '',
                suggested_options: parsed.suggested_options || [],
                story_summary: parsed.story_summary || null,
                final_title: parsed.final_title || null
            };
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            const jsonMatch = response.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    episode_title: parsed.episode_title || topic || '無題',
                    novel_text: parsed.novel_text || '',
                    ai_comment: parsed.ai_comment || '',
                    suggested_options: parsed.suggested_options || [],
                    story_summary: parsed.story_summary || null,
                    final_title: parsed.final_title || null
                };
            }
            return getMockNovelResult(topic, chaos, storyMode, writerId, turnsRemaining);
        }
    } catch (error) {
        console.error('Gemini generate error:', error);
        return getMockNovelResult(topic, chaos, storyMode, writerId, turnsRemaining);
    }
}
export async function handleDetermineGenre(history) {
    const historyText = (history || []).map(h => h.text).join(' ').toLowerCase();

    // Better Mock detection based on keywords
    if (!ai) {
        if (historyText.includes('推理') || historyText.includes('ミステリー') || historyText.includes('探偵') || historyText.includes('殺人')) return 'ミステリー';
        if (historyText.includes('宇宙') || historyText.includes('ロボット') || historyText.includes('未来') || historyText.includes('sf')) return 'SF';
        if (historyText.includes('恋愛') || historyText.includes('好き') || historyText.includes('ラブ') || historyText.includes('恋')) return '恋愛';
        if (historyText.includes('ホラー') || historyText.includes('怖い') || historyText.includes('幽霊') || historyText.includes('呪い')) return 'ホラー';
        if (historyText.includes('コメディ') || historyText.includes('笑い') || historyText.includes('ギャグ')) return 'コメディ';
        if (historyText.includes('戦い') || historyText.includes('バトル') || historyText.includes('勇者') || historyText.includes('魔王')) return 'ファンタジー';
        return '一般';
    }

    try {
        const historyText = history.map(h => `${h.role === 'user' ? 'ユーザー' : '作家'}: ${h.text}`).join('\n');
        const prompt = `
以下の物語の設定に関する会話から、この物語のジャンルを「一単語」で判定してください。
（例：SF、ミステリー、恋愛、ファンタジー、ホラー、コメディ、日常、サスペンス）

余計な説明は一切不要です。単語のみを出力してください。

## 会話履歴
${historyText}
`;

        const response = await ai.models.generateContent(prompt);
        return response.text.trim().replace(/[「」『』]/g, '') || '一般';
    } catch (error) {
        console.error('Determine genre error:', error);
        return '一般';
    }
}
