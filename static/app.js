// ========================================================
// 云起武夷·活水传理 -- 朱子文化研习 (多模块独立会话与东方美学交互控制器)
// ========================================================

// 1. 四大功能独立会话状态机（彻底隔离答疑、课堂、督学、推荐对话）
const chatSessions = {
    qa: {
        id: "qa_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6),
        history: [],
        containerId: "qa-messages",
        inputId: "qa-user-input",
        title: "考亭答疑 · 问学书斋",
        welcomeHtml: `
            <div class="message-row assistant">
                <div class="message-avatar"><img src="/static/avatar_ref_hd.png" alt="先生" class="msg-avatar-img"></div>
                <div class="message-bubble parchment-bubble">
                    <div class="bubble-top-row">
                        <span class="speaker-label">考亭先生 · 问学亲授</span>
                        <button class="tts-play-btn" onclick="playVoiceFromBubble(this)">
                            <span class="tts-icon">🔊</span> <span class="tts-text">聆听先生讲学</span>
                        </button>
                    </div>
                    <div class="message-text">诸生后学请了！老夫字元晦，号晦庵，晚号考亭先生。今日仁兄步入此间问学精舍，凡经传章句疑义、理气心性奥旨，或日常修身立德之惑，皆可直言道来。老夫当与诸生即物穷理、博约相顾，共究大道！</div>
                    <div class="bubble-seal-mark">考亭先生手定</div>
                </div>
            </div>
        `
    },
    class: {
        id: "class_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6),
        history: [],
        containerId: "class-messages",
        inputId: "class-user-input",
        title: "考亭讲筵 · 第一人称书院研学",
        welcomeHtml: `
            <div class="message-row assistant">
                <div class="message-avatar"><img src="/static/avatar_ref_hd.png" alt="先生" class="msg-avatar-img"></div>
                <div class="message-bubble parchment-bubble">
                    <div class="bubble-top-row">
                        <span class="speaker-label">考亭主席 · 先生开筵</span>
                        <button class="tts-play-btn" onclick="playVoiceFromBubble(this)">
                            <span class="tts-icon">🔊</span> <span class="tts-text">听先生开讲</span>
                        </button>
                    </div>
                    <div class="message-text">门人后学端坐！老夫今日升堂讲读经典。左侧所陈，皆古圣先贤微言奥义与老夫毕生校注之精义。诸生若于字句训诂、义理归趣有所发明或疑难未决，随时在此开言问难，老夫当与诸生层层析解！</div>
                    <div class="bubble-seal-mark">考亭讲席</div>
                </div>
            </div>
        `
    },
    plan: {
        id: "plan_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6),
        history: [],
        containerId: "plan-messages",
        inputId: "plan-user-input",
        title: "白鹿督学 · 夫子伴读与智能督学堂",
        welcomeHtml: `
            <div class="message-row assistant">
                <div class="message-avatar"><img src="/static/avatar_ref_hd.png" alt="先生" class="msg-avatar-img"></div>
                <div class="message-bubble parchment-bubble">
                    <div class="bubble-top-row">
                        <span class="speaker-label">考亭夫子 · 严师督学</span>
                        <button class="tts-play-btn" onclick="playVoiceFromBubble(this)">
                            <span class="tts-icon">🔊</span> <span class="tts-text">聆听夫子训勉</span>
                        </button>
                    </div>
                    <div class="message-text">后学仁兄！老夫平生最恨浮夸无实、纸上空谈之人。进学之道，唯在笃行践履。“未见其功，先视其持守”。仁兄今日功课进境如何？衣冠念虑是否常常检摄？如有懈怠迁延，直告老夫，老夫自当为你对症针砭！</div>
                    <div class="bubble-seal-mark">严师督学</div>
                </div>
            </div>
        `
    },
    recommend: {
        id: "recommend_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6),
        history: [],
        containerId: "recommend-messages",
        inputId: "recommend-user-input",
        title: "沧洲藏书 · 3D 沉浸式互动图书馆",
        welcomeHtml: `
            <div class="message-row assistant">
                <div class="message-avatar"><img src="/static/avatar_ref_hd.png" alt="先生" class="msg-avatar-img"></div>
                <div class="message-bubble parchment-bubble">
                    <div class="bubble-top-row">
                        <span class="speaker-label">考亭先生 · 藏书引路</span>
                        <button class="tts-play-btn" onclick="playVoiceFromBubble(this)">
                            <span class="tts-icon">🔊</span> <span class="tts-text">听先生指路</span>
                        </button>
                    </div>
                    <div class="message-text">后学仁兄请坐！为学正如造塔，须先打牢地基，切不可躐等好高！老夫尝言：“先读《大学》以定其规模，次读《论语》以立其根本，次读《孟子》以观其发越，次读《中庸》以极夫精微。”仁兄今日学力如何？欲读何书？抑或不知从何处入手？直告老夫，老夫当因材施教，为你手订进学阶梯！</div>
                    <div class="bubble-seal-mark">沧洲指津</div>
                </div>
            </div>
        `
    }
};

// 2. 考亭讲筵课程讲义数据库 (与六大研学章程一一对应)
const courseList = [
    {
        chapterId: "wuyi_jingshe",
        badge: "精舍初筵 · 开山立教",
        title: "《武夷精舍杂咏并序》· 聚徒开山",
        summary: "淳熙十年卜居武夷隐屏峰下，辟仁智堂、隐求室数楹，避俗嚣之扰，聚徒穷理，立道南正脉。",
        original: "“琴书五十载，隐屏云雾深。淳熙十年，予卜居武夷隐屏峰下，结构精舍数楹，题曰武夷精舍。诸生环居，相与读书讲道。山川幽胜，天柱玉立，清溪抱门。群仙不可见，山阿万竹青。”",
        commentary: "闹市之中，人心易于随境流荡、气浮心粗；借武夷山川清虚深秀之气，使学者收敛放心、居敬穷理，于静中涵养本心，方有从容入圣之基。此乃先生聚徒开山、接续洙泗之宏旨。",
        thinking: "学者今日治学，心神是否常为世俗喧嚣所夺？如何收摄身心，于日常居处中筑就自家一片‘武夷精舍’？"
    },
    {
        chapterId: "jiuqu_zhaoge",
        badge: "泛舟溯理 · 循序渐进",
        title: "《武夷棹歌》· 循序寻源",
        summary: "朱子借九曲溪泛舟溯流之景，喻读书穷理‘循序渐进、由浅入深’之工夫，由一曲登仙渐进至九曲寻源。",
        original: "“武夷山上有仙灵，山下寒流曲曲清。欲识高深深几许？九曲溪边理自明。一曲溪边上钓船，九曲源头别有天。读书六法：一曰循序渐进，二曰熟读精思，三曰虚心涵泳，四曰切己体察，五曰着紧用力，六曰居敬持志。”",
        commentary: "为学如撑上水船，一篙不可放缓。泛舟九曲，必自一曲始，渐进至于九曲平旷之处。未得乎前，不敢求乎后；未通乎上，不敢求乎下。字求其训，句索其旨，方得源头活水。",
        thinking: "仁兄平日开卷，是否贪多求快、走马观花？若未通首卷即急窥末卷，学问何以能‘源清流长’？"
    },
    {
        chapterId: "wuyi_tea",
        badge: "敬以直内 · 日用工夫",
        title: "《朱子家礼·瀹茗工夫》· 茶理存诚",
        summary: "以武夷岩茶之品瀹、火候与清和，阐释‘主敬存诚、事事物物皆有天理’的日常省察与持守工夫。",
        original: "“客至则具茶，整肃几席，涤盏烹泉。水之清冽，火之徐候，茶叶之升降，莫非理之所寓。主敬存诚，心无旁骛，于一啜一饮间体认天理流行，不使毫厘私欲夹杂其中。”",
        commentary: "敬字功夫，是贯通动静之枢纽。煮茗非玩物适情，乃于至微至细之日用事伦中，察理之所当然与所以然。整齐严肃，敬以直内，方能使虚灵不昧之本心常惺惺。",
        thinking: "格物穷理岂在悬空冥想？在日常举止、饮食应接之间，如何做到‘敬以直内，义以方外’？"
    },
    {
        chapterId: "wufu_shecang",
        badge: "经世济民 · 实学笃行",
        title: "《崇安县五夫社仓记》· 义利兼通",
        summary: "乾道四年大饥，朱子躬行赈恤，在崇安五夫里创设社仓法，开创中国民间自治储粮济困之千秋典范。",
        original: "“乾道四年，建宁府崇安县大饥。予劝诸豪右出粟以振饥民。后建社仓于五夫里，春秋敛散，息米折半，岁丰则免息。不耗官帑，不累闾阎，经画有方，万世永赖。”",
        commentary: "五夫社仓历十四年而储谷达数万石，全活数郡生灵。儒者之学，绝非空谈心性之虚术，必当开物成务、兼济天下。正其义以谋万民之利，明其道以成济世之功，此真儒知行合一之至验。",
        thinking: "当世学者常病‘明理者不达时变，任事者不察义理’。五夫社仓法如何启示我们在求学与实践中兼顾义理与民生实效？"
    },
    {
        chapterId: "ehu_debate",
        badge: "理学论辩 · 尊德问道",
        title: "《鹅湖之会·答陆子静》· 道问学与尊德性",
        summary: "淳熙二年鹅湖寺世纪论辩，朱陆异同，探究‘泛观博览以格物致知’与‘发明本心以立大本’之同异互补。",
        original: "“鹅湖之会，伯恭招陆子静、子寿兄弟来聚。陆子以‘易简功夫终久大，支离事业竟浮沉’相诮。予答之曰：若不道问学、穷理致知，心何所据？尊德性而道问学，二者相济，不可偏废。”",
        commentary: "尊德性乃立本体，道问学乃致实用。若但空守本心而废博学审问，则流于禅宗之蹈空狂诞；若泛观万物而忘存养德性，则失于支离繁碎。朱子之学，立基于切实体察，两端互发，方臻至纯。",
        thinking: "为学修身之际，‘尊德性’（立志发明本心）与‘道问学’（博学读书穷理）二者，仁兄平日如何兼筹并进？"
    },
    {
        chapterId: "daxue_gewu",
        badge: "穷理致知 · 终极宇宙观",
        title: "《大学章句·格物致知补传》· 理一分殊",
        summary: "朱子倾尽毕生心血补缀《大学》格致亡章，提出‘月印万川、即物穷理’之集大成理学认识论。",
        original: "“所谓致知在格物者，言欲致吾之知，在即物而穷其理也。盖人心之灵莫不有知，而天下之物莫不有理。至于用力之久，而一旦豁然贯通焉，则众物之表里精粗无不到，而吾心之全提大用无不明矣。”",
        commentary: "理一分殊，月印万川。天地万物虽千差万别，皆本于同一天理。今日格一件，明日格一件，积久力深，心物交融，私意尽除，则万事万物之必然之则与本原之道自然豁然贯通，止于至善。",
        thinking: "在纷繁纷杂的万事万物面前，学者当如何从小处切近处下手穷理，方能期待有朝一日‘豁然贯通’？"
    }
];

let currentCourseIndex = 0;

// 3. 朱子晨策修身日课签词库
const dailyQuotes = [
    { quote: "“半亩方塘一鉴开，天光云影共徘徊。问渠那得清如许？为有源头活水来。”", author: "—— 考亭夫子 · 《观书有感》示学者" },
    { quote: "“小立课程，微加积叠。未得乎前，不敢求乎后；未通乎上，不敢求乎下。”", author: "—— 考亭夫子 · 《朱子读书六法》" },
    { quote: "“正其义不谋其利，明其道不计其功。言忠信，行笃敬，惩忿窒欲，迁善改过。”", author: "—— 考亭夫子 · 《白鹿洞书院揭示》" },
    { quote: "“涵养须用敬，进学在致知。穷理者，因其所已知者而推之，以各穷尽其极。”", author: "—— 考亭夫子 · 《四书章句集注》" },
    { quote: "“少年易老学难成，一寸光阴不可轻。未觉池塘春草梦，阶前梧叶已秋声。”", author: "—— 考亭夫子 · 《劝学诗》勉诸生" },
    { quote: "“人心虚灵不昧，以具众理而应万事。学者先须收拾此心，莫令逐物迁变。”", author: "—— 考亭夫子 · 《朱子语类》" }
];

// 4. 全局语音配音控制器 (默认关闭自动播音以提升极致流畅度，点击气泡或按钮随时可朗诵)
let autoTTS = false;
let currentVoiceStyle = "yunjian"; // 考亭大儒苍劲风骨
let currentAudio = null;
let currentTTSAbortController = null;
let currentTTSButton = null;
let activePlayId = 0;
let isVoicePlaying = false;
let isVoicePaused = false;

// 4.1 考亭书院雅乐 (网络宋韵古典BGM播放器 · 默认播放《晨风琴韵》 · 循环重复播放)
const BGM_PLAYLIST = [
    {
        id: "guzheng_morning",
        title: "《晨风琴韵》",
        subtitle: "古筝清音 · 武夷空山新雨",
        src: "/static/audio/guzheng_morning.mp3",
        desc: "空山灵雨，晨光初透。筝韵如泉水淙淙，令人神清气爽，涤除尘虑。"
    },
    {
        id: "liu_shui",
        title: "《高山流水》",
        subtitle: "古琴天籁 · 伯牙子期知音名曲",
        src: "/static/audio/liu_shui.ogg",
        desc: "宋代理学大儒会讲论道，必以琴棋书画为修身陶冶之具。流水汤汤，太古遗音。"
    },
    {
        id: "pingsha_luoyan",
        title: "《平沙落雁》",
        subtitle: "潇湘水云 · 逸士清幽之境",
        src: "/static/audio/pingsha_luoyan.ogg",
        desc: "秋高气爽，风静沙平，云程万里，天际飞鸣。借鸿鹄之远志，写逸士之胸襟。"
    },
    {
        id: "zuiyu_changwan",
        title: "《醉渔唱晚》",
        subtitle: "沧浪濯足 · 渔歌互答清音",
        src: "/static/audio/zuiyu_changwan.ogg",
        desc: "笑傲烟波，濯足沧浪。隐屏九曲之间，晚霞与孤鹜齐飞，尽显山水自得之趣。"
    },
    {
        id: "yangguan_sandie",
        title: "《阳关三叠》",
        subtitle: "唐宋琴歌 · 文士风骨与故人情谊",
        src: "/static/audio/yangguan_sandie.ogg",
        desc: "劝君更尽一杯酒，西出阳关无故人。曲调委婉缠绵，回环复沓，感人至深。"
    }
];

let currentBgmIndex = 0; // 默认首曲《晨风琴韵》
let bgmAudio = null;
let isBgmPlaying = false;
let bgmVolume = 0.40;

function initBgmPlayer() {
    if (!bgmAudio) {
        bgmAudio = new Audio();
        bgmAudio.loop = true; // 循环重复播放
        bgmAudio.volume = bgmVolume;

        bgmAudio.onplay = () => {
            isBgmPlaying = true;
            updateBgmUI();
        };

        bgmAudio.onpause = () => {
            isBgmPlaying = false;
            updateBgmUI();
        };

        bgmAudio.onended = () => {
            bgmAudio.currentTime = 0;
            bgmAudio.play().catch(() => {});
        };

        bgmAudio.onerror = (e) => {
            console.warn("BGM加载或播放异常:", e);
            isBgmPlaying = false;
            updateBgmUI();
        };
    }
}

function updateBgmUI() {
    const navItem = document.getElementById("nav-bgm-toggle");
    const badge = document.getElementById("nav-bgm-badge");
    const modalPlayBtn = document.getElementById("bgm-modal-play-btn");
    const currentTitle = document.getElementById("bgm-current-title");
    const currentDesc = document.getElementById("bgm-current-desc");
    const playerIcon = document.getElementById("bgm-player-icon");
    const track = BGM_PLAYLIST[currentBgmIndex] || BGM_PLAYLIST[0];

    if (badge) {
        if (isBgmPlaying) {
            badge.textContent = "播放中";
            badge.style.background = "#d97706";
            badge.style.color = "#ffffff";
        } else {
            badge.textContent = "静音";
            badge.style.background = "#e2e8f0";
            badge.style.color = "#475569";
        }
    }

    if (navItem) {
        if (isBgmPlaying) {
            navItem.classList.add("active");
        } else {
            navItem.classList.remove("active");
        }
    }

    if (modalPlayBtn) {
        modalPlayBtn.innerHTML = isBgmPlaying ? "⏸ 暂停雅乐" : "▶ 播放雅乐";
    }

    if (currentTitle) {
        currentTitle.textContent = `${track.title} · ${track.subtitle}`;
    }

    if (currentDesc) {
        currentDesc.textContent = isBgmPlaying ? `太古遗音 · 正在循环重复播放中` : `太古遗音 · 默认选中（点击上方按钮播放）`;
    }

    if (playerIcon) {
        playerIcon.textContent = isBgmPlaying ? "🎶" : "🎵";
    }

    renderBgmPlaylist();
}

function renderBgmPlaylist() {
    const listEl = document.getElementById("bgm-playlist-container");
    if (!listEl) return;

    listEl.innerHTML = BGM_PLAYLIST.map((item, idx) => {
        const isCurrent = idx === currentBgmIndex;
        return `
            <div onclick="playBgmTrack(${idx})" style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border-radius:8px; border:1px solid ${isCurrent ? '#b45309' : '#e2e8f0'}; background:${isCurrent ? '#fef3c7' : '#ffffff'}; cursor:pointer; transition:all 0.2s;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="font-size:16px;">${isCurrent && isBgmPlaying ? '🔊' : '🎵'}</span>
                    <div>
                        <div style="font-size:13.5px; font-weight:bold; color:${isCurrent ? '#78350f' : '#1e293b'}; font-family:var(--font-serif);">${item.title} <span style="font-size:12px; font-weight:normal; color:#64748b;">${item.subtitle}</span></div>
                        <div style="font-size:11.5px; color:#64748b; margin-top:2px;">${item.desc}</div>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:6px;">
                    <span style="font-size:11px; padding:2px 8px; border-radius:10px; background:${isCurrent ? '#d97706' : '#f1f5f9'}; color:${isCurrent ? '#ffffff' : '#64748b'};">${isCurrent && isBgmPlaying ? '播放中 (循环)' : (isCurrent ? '默认选中' : '点击切换')}</span>
                </div>
            </div>
        `;
    }).join("");
}

function playBgmTrack(index) {
    initBgmPlayer();
    currentBgmIndex = index;
    const track = BGM_PLAYLIST[currentBgmIndex];
    bgmAudio.src = track.src;
    bgmAudio.currentTime = 0;
    bgmAudio.play().then(() => {
        isBgmPlaying = true;
        updateBgmUI();
        if (typeof showToast === 'function') {
            showToast(`正在播放：${track.title}`);
        }
    }).catch(err => {
        console.warn("BGM播放需用户交互:", err);
        if (typeof showToast === 'function') {
            showToast(`请点击【播放雅乐】开启背景音乐`);
        }
        updateBgmUI();
    });
}

function toggleAcademyBGM() {
    initBgmPlayer();
    const track = BGM_PLAYLIST[currentBgmIndex];
    if (!bgmAudio.src || bgmAudio.src.indexOf(track.src) === -1) {
        bgmAudio.src = track.src;
    }

    if (isBgmPlaying) {
        bgmAudio.pause();
        isBgmPlaying = false;
        updateBgmUI();
        if (typeof showToast === 'function') {
            showToast("书院雅乐已暂停");
        }
    } else {
        bgmAudio.play().then(() => {
            isBgmPlaying = true;
            updateBgmUI();
            if (typeof showToast === 'function') {
                showToast(`书院雅乐已开启（循环播放）：${track.title}`);
            }
        }).catch(err => {
            console.warn("BGM播放受阻:", err);
            updateBgmUI();
        });
    }
}

function tryAutoPlayBgm() {
    initBgmPlayer();
    const track = BGM_PLAYLIST[currentBgmIndex];
    if (!bgmAudio.src || bgmAudio.src.indexOf(track.src) === -1) {
        bgmAudio.src = track.src;
    }
    const p = bgmAudio.play();
    if (p !== undefined) {
        p.then(() => {
            isBgmPlaying = true;
            updateBgmUI();
        }).catch(() => {
            // 被浏览器策略限制，在首次用户手势点击或按键时启动
            isBgmPlaying = false;
            updateBgmUI();
            const startOnInteraction = () => {
                if (!isBgmPlaying && bgmAudio) {
                    bgmAudio.play().then(() => {
                        isBgmPlaying = true;
                        updateBgmUI();
                    }).catch(() => {});
                }
                document.removeEventListener('click', startOnInteraction);
                document.removeEventListener('keydown', startOnInteraction);
                document.removeEventListener('touchstart', startOnInteraction);
            };
            document.addEventListener('click', startOnInteraction, { once: true });
            document.addEventListener('keydown', startOnInteraction, { once: true });
            document.addEventListener('touchstart', startOnInteraction, { once: true });
        });
    }
}

function nextBgmTrack() {
    const nextIdx = (currentBgmIndex + 1) % BGM_PLAYLIST.length;
    playBgmTrack(nextIdx);
}

function prevBgmTrack() {
    const prevIdx = (currentBgmIndex - 1 + BGM_PLAYLIST.length) % BGM_PLAYLIST.length;
    playBgmTrack(prevIdx);
}

function setBgmVolume(val) {
    bgmVolume = parseFloat(val);
    if (bgmAudio) bgmAudio.volume = bgmVolume;
    const valEl = document.getElementById("bgm-volume-val");
    if (valEl) valEl.textContent = `${Math.round(bgmVolume * 100)}%`;
}

function openBgmModal() {
    initBgmPlayer();
    const modal = document.getElementById("bgm-modal");
    if (modal) {
        modal.classList.add("active");
        updateBgmUI();
    }
}

function closeBgmModal() {
    const modal = document.getElementById("bgm-modal");
    if (modal) modal.classList.remove("active");
}

// 5. 对话流式生成与强制停止控制器 (防止超长输出与内存溢出导致系统崩溃)
const activeAbortControllers = {};

function setGeneratingUIState(moduleKey, isGenerating) {
    // 1. 切换发送/停止按钮图标与状态
    const btn = document.getElementById(`${moduleKey}-send-btn`);
    if (btn) {
        if (isGenerating) {
            if (!btn.dataset.origHtml) {
                btn.dataset.origHtml = btn.innerHTML;
                btn.dataset.origTitle = btn.title || "发送";
            }
            btn.classList.add("is-generating");
            btn.title = "停止生成 (Esc)";
            btn.innerHTML = `
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#ffffff">
                    <rect x="5" y="5" width="14" height="14" rx="2.5" fill="#ffffff"></rect>
                </svg>
            `;
        } else {
            btn.classList.remove("is-generating");
            if (btn.dataset.origHtml) {
                btn.innerHTML = btn.dataset.origHtml;
                btn.title = btn.dataset.origTitle || "发送";
            }
        }
    }

    // 2. 控制悬浮停止药丸按钮
    const dock = document.getElementById(`${moduleKey}-stop-dock`);
    if (dock) {
        dock.style.display = isGenerating ? "flex" : "none";
    }
}

function stopGenerating(moduleKey) {
    console.log(`[停止生成] 用户请求停止模块: ${moduleKey}`);
    const controller = activeAbortControllers[moduleKey];
    if (controller) {
        try {
            controller.abort();
        } catch (e) {
            console.warn("Abort error:", e);
        }
        delete activeAbortControllers[moduleKey];
    }
    const sess = chatSessions[moduleKey];
    if (sess && sess.id) {
        fetch("/api/chat/stop", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: sess.id })
        }).catch(() => {});
    }
    stopCurrentVoice(true);
    setGeneratingUIState(moduleKey, false);

    if (moduleKey === "qa" && window.avatarEngine) {
        avatarEngine.setState("idle");
        avatarEngine.setPose("standing", false);
    }
}

function handleSendOrStop(moduleKey) {
    if (activeAbortControllers[moduleKey]) {
        stopGenerating(moduleKey);
    } else {
        sendQuery(moduleKey);
    }
}

// 页面加载就绪
document.addEventListener("DOMContentLoaded", () => {
    loadKnowledgeStats();
    drawDailyQuote();
    initBgmPlayer();
    updateBgmUI();
    tryAutoPlayBgm();
    loadReservationBooklist();
    preloadOpacBooks();
    renderHomeShowcaseBooks('sishu');
    if (window.avatarEngine) {
        window.avatarEngine.init();
    }
    const qaInput = document.getElementById("qa-user-input");
    if (qaInput) {
        qaInput.addEventListener("input", () => {
            if (window.avatarEngine) {
                avatarEngine.onUserTyping();
            }
        });
    }

    const hash = window.location.hash.replace("#", "");
    if (["qa", "class", "plan", "recommend"].includes(hash)) {
        switchNav(hash);
    }
});

// 全局 Esc 快捷键停止当前正在生成的对话
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        const activeKeys = Object.keys(activeAbortControllers);
        if (activeKeys.length > 0) {
            e.preventDefault();
            activeKeys.forEach(k => stopGenerating(k));
        }
    }
});

// ========================================================
// 导航视图切换控制器 (home / qa / class / plan / recommend)
// ========================================================
function switchNav(viewName) {
    stopCurrentVoice(true);

    const views = ["home", "qa", "class", "plan", "recommend"];
    views.forEach(v => {
        const el = document.getElementById(`view-${v}`);
        const nav = document.getElementById(`nav-${v}`);
        if (el) el.classList.remove("active");
        if (nav) nav.classList.remove("active");
    });

    const targetView = document.getElementById(`view-${viewName}`);
    const targetNav = document.getElementById(`nav-${viewName}`);

    if (targetView) targetView.classList.add("active");
    if (targetNav) targetNav.classList.add("active");

    const scrollWrap = document.getElementById("main-scroll-wrap");
    if (scrollWrap) scrollWrap.scrollTop = 0;

    // 自动挂载各引擎单例
    if (viewName === "class" && window.galGameEngine) {
        window.galGameEngine.init();
    } else if (viewName === "plan" && window.studySupervisor) {
        window.studySupervisor.init();
    } else if (viewName === "recommend" && window.library3DEngine) {
        window.library3DEngine.init();
    }

    // 自动聚焦对应视图的专属输入框
    setTimeout(() => {
        if (viewName === "qa") {
            const input = document.getElementById("qa-user-input");
            if (input) input.focus();
            if (window.avatar3DEngine) {
                window.avatar3DEngine.onResize();
            }
        } else if (viewName === "class") {
            const input = document.getElementById("class-user-input");
            if (input) input.focus();
        } else if (viewName === "plan") {
            const input = document.getElementById("plan-user-input");
            if (input) input.focus();
        } else if (viewName === "recommend") {
            const input = document.getElementById("recommend-user-input");
            if (input) input.focus();
        }
    }, 100);
}

// ========================================================
// 考亭先生首页进入功能控制器 (直接无缝进入各功能，彻底去除加载动画与等待)
// ========================================================
function guideToModule(moduleKey) {
    stopCurrentVoice(true);
    const modal = document.getElementById("guide-transition-modal");
    if (modal) {
        modal.style.display = "none";
        modal.classList.remove("active");
    }
    switchNav(moduleKey);
}

// 真实图书馆底部浮动对答栏折叠/展开
function toggleLibraryChatDock() {
    const dockBody = document.getElementById("library-dock-body");
    const dockIcon = document.getElementById("library-dock-icon");
    if (!dockBody) return;
    const isHidden = dockBody.style.display === "none" || !dockBody.style.display;
    dockBody.style.display = isHidden ? "block" : "none";
    if (dockIcon) {
        dockIcon.textContent = isHidden ? "▼ 收起对答" : "▲ 展开对答";
    }
}

// 首页快速提问，自动切入问答室并开启新对答
function sendFromHome(queryText) {
    const text = (queryText || "").trim();
    if (!text) return;
    
    const homeInput = document.getElementById("home-input");
    if (homeInput) homeInput.value = "";

    switchNav("qa");
    sendQuery("qa", text);
}

// ========================================================
// 新建对答与清空功能（每个功能拥有完全独立的会话）
// ========================================================
function startNewChat(moduleKey) {
    stopCurrentVoice(true);
    stopGenerating(moduleKey);
    const sess = chatSessions[moduleKey];
    if (!sess) return;

    sess.id = moduleKey + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6);
    sess.history = [];

    const container = document.getElementById(sess.containerId);
    if (container) {
        container.innerHTML = sess.welcomeHtml;
    }

    const input = document.getElementById(sess.inputId);
    if (input) {
        input.value = "";
        input.focus();
    }

    if (moduleKey === "qa" && window.avatarEngine) {
        avatarEngine.setState("idle");
        avatarEngine.setPose("standing", true);
        avatarEngine.setMood("【端坐候教】");
    }
}

function clearCurrentMessages(moduleKey) {
    startNewChat(moduleKey);
}

// ========================================================
// 核心：多模块独立发送提问与流式接收（支持即时中断/停止生成）
// ========================================================
async function sendQuery(moduleKey, queryOverride) {
    // 若当前模块正处于生成中，再次点击发送按钮则作为“停止生成”处理
    if (activeAbortControllers[moduleKey]) {
        stopGenerating(moduleKey);
        return;
    }

    const sess = chatSessions[moduleKey];
    if (!sess) return;

    const input = document.getElementById(sess.inputId);
    const query = (queryOverride !== undefined ? queryOverride : (input ? input.value : "")).trim();
    if (!query) return;

    if (input && queryOverride === undefined) {
        input.value = "";
    }

    stopCurrentVoice(true);

    const container = document.getElementById(sess.containerId);
    if (!container) return;

    // 1. 追加用户发言卡片
    const userRow = document.createElement("div");
    userRow.className = "message-row user";
    userRow.innerHTML = `
        <div class="message-bubble">${escapeHtml(query)}</div>
        <div class="message-avatar">生</div>
    `;
    container.appendChild(userRow);
    container.scrollTop = container.scrollHeight;

    // 2. 准备考亭先生回复信笺卡片 (内置即刻停止胶囊按钮)
    const assistantRow = document.createElement("div");
    assistantRow.className = "message-row assistant";
    assistantRow.innerHTML = `
        <div class="message-avatar"><img src="/static/avatar_ref_hd.png" alt="先生" class="msg-avatar-img"></div>
        <div class="message-bubble parchment-bubble">
            <div class="bubble-top-row">
                <span class="speaker-label">考亭先生 · 讲授中</span>
                <button class="bubble-stop-pill" onclick="stopGenerating('${moduleKey}')" title="立即停止生成 (Esc)">
                    <span class="bubble-stop-sq">■</span> 停止生成
                </button>
                <button class="tts-play-btn" onclick="playVoiceFromBubble(this)" style="display:none;">
                    <span class="tts-icon">🔊</span> <span class="tts-text">聆听先生讲学</span>
                </button>
            </div>
            <div class="message-text"><span class="typing-cursor">先生正在研精审理...</span></div>
            <div class="bubble-seal-mark">考亭印</div>
        </div>
    `;
    container.appendChild(assistantRow);
    container.scrollTop = container.scrollHeight;

    const textEl = assistantRow.querySelector(".message-text");
    const ttsBtn = assistantRow.querySelector(".tts-play-btn");

    // 3. 注册 AbortController 并切换 UI 停止态
    const controller = new AbortController();
    activeAbortControllers[moduleKey] = controller;
    setGeneratingUIState(moduleKey, true);

    let fullText = "";
    if (moduleKey === "qa" && window.avatarEngine) {
        avatarEngine.onUserSubmit(query);
    }

    try {
        const response = await fetch("/api/chat/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                query: query,
                session_id: sess.id,
                history: sess.history
            }),
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(`网络响应异常: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        let renderScheduled = false;
        const scheduleRender = () => {
            if (!renderScheduled) {
                renderScheduled = true;
                requestAnimationFrame(() => {
                    textEl.innerHTML = renderMarkdown(fullText);
                    container.scrollTop = container.scrollHeight;
                    renderScheduled = false;
                });
            }
        };

        while (true) {
            if (controller.signal.aborted) break;
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop();

            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    const rawJson = line.substring(6).trim();
                    if (!rawJson) continue;

                    try {
                        const event = JSON.parse(rawJson);
                        if (event.type === "token") {
                            fullText += event.content;
                            scheduleRender();
                            if (moduleKey === "qa" && window.avatarEngine) {
                                avatarEngine.onTokenStream(event.content, fullText);
                            }
                        } else if (event.type === "done") {
                            fullText = cleanParentheses(fullText);
                            textEl.innerHTML = renderMarkdown(fullText);
                            container.scrollTop = container.scrollHeight;
                            if (moduleKey === "qa" && window.avatarEngine) {
                                avatarEngine.onComplete(fullText);
                            }
                        }
                    } catch (err) {
                        console.warn("JSON解析微恙:", err);
                    }
                }
            }
        }

    } catch (err) {
        if (moduleKey === "qa" && window.avatarEngine) {
            avatarEngine.setState("idle");
        }
        if (err.name === "AbortError" || controller.signal.aborted) {
            console.log(`[生成中止] 模块 ${moduleKey} 已被学者主动停止`);
            if (fullText.trim()) {
                fullText = cleanParentheses(fullText);
                textEl.innerHTML = renderMarkdown(fullText);
            } else {
                textEl.innerHTML = `<span style="color:#64748b; font-style:italic;">学者已停止讲学</span>`;
            }
            const stoppedBadge = document.createElement("div");
            stoppedBadge.className = "stream-stopped-hint";
            stoppedBadge.innerHTML = `<span>⏹ 学者令止 · 考亭先生谨遵雅意，暂止于此</span>`;
            assistantRow.querySelector(".message-bubble").appendChild(stoppedBadge);
            container.scrollTop = container.scrollHeight;
        } else {
            console.error("对话请求发生异常:", err);
            textEl.innerHTML = `<span style="color:#ef4444;">抱歉，考亭书院网络传信遇阻，请稍后重新提问。(${escapeHtml(err.message)})</span>`;
        }
    } finally {
        if (moduleKey === "qa" && window.avatarEngine && controller.signal.aborted) {
            avatarEngine.setState("idle");
        }
        // 移除气泡上的停止按钮
        const bubbleStop = assistantRow.querySelector(".bubble-stop-pill");
        if (bubbleStop) bubbleStop.remove();

        // 更新状态标签
        const speakerLabel = assistantRow.querySelector(".speaker-label");
        if (speakerLabel) {
            speakerLabel.textContent = controller.signal.aborted ? "考亭先生 · 授毕暂歇" : "考亭先生 · 讲授完毕";
        }

        // 保存进该模块的专属历史记录（防历史堆叠过长，彻底净化括号）
        fullText = cleanParentheses(fullText);
        if (fullText.trim()) {
            sess.history.push({ role: "user", content: query });
            sess.history.push({ role: "assistant", content: fullText });
            if (sess.history.length > 30) {
                sess.history = sess.history.slice(-30);
            }
        }

        // 清理当前控制器与恢复 UI
        delete activeAbortControllers[moduleKey];
        setGeneratingUIState(moduleKey, false);

        // 显示并触发即时配音【实时毫秒级出声】
        if (ttsBtn && fullText.trim()) {
            ttsBtn.style.display = "inline-flex";
            if (autoTTS && !controller.signal.aborted && fullText.length > 0) {
                speakInstantText(fullText, ttsBtn);
            }
        }

        if (moduleKey === "qa") {
            updateTaskFlowChips(fullText);
        }

        if (input) {
            input.focus();
        }
    }
}

// ========================================================
// 实时语音朗诵控制器【统一唯一考亭大儒声线 zh-CN-YunjianNeural，杜绝杂乱声线】
// ========================================================
function speakInstantText(text, btnElement) {
    // 坚决彻底停用并静音浏览器杂乱内置多音色，确保全局纯正考亭大儒唯一音色
    if ('speechSynthesis' in window) {
        try { window.speechSynthesis.cancel(); } catch (e) {}
    }
    // 统一交由 playVoice 调度 Edge-TTS 考亭大儒专属音色
    playVoice(text, btnElement, "yunjian");
}

function toggleInstantTTS() {
    autoTTS = !autoTTS;
    const btn = document.getElementById("qa-tts-toggle-btn");
    if (btn) {
        if (autoTTS) {
            btn.classList.add("active");
            btn.innerHTML = `<span class="tts-status-icon">🔊</span><span class="tts-status-label">实时语音: 开</span>`;
            showToast("实时语音已开启，先生讲学将实时发声");
        } else {
            btn.classList.remove("active");
            btn.innerHTML = `<span class="tts-status-icon">🔇</span><span class="tts-status-label">实时语音: 关</span>`;
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            stopCurrentVoice(false);
            showToast("实时语音已关闭");
        }
    }
}

// ========================================================
// 考亭先生四大互动任务流专修状态机
// 论文写作、古诗分析、浏览风景、人生经历
// ========================================================
let currentTaskFlow = null;

const SCENERY_IMAGE_MAP = {
    "武夷学院朱子像与朱子书院": {
        img: "/static/scenery/wuyi_university_zhuzi.jpg",
        name: "武夷学院 · 朱子像与朱子书院",
        quote: "武夷学院前身为南平师范专科学校，坐落于武夷山麓。校园内朱子书院古朴巍峨，朱子行教铜像庄严肃穆，乃当代传承宋代理学之重镇。",
        experience: "老夫虽身居宋代，今闻武夷学子在此弦歌不辍，绍述考亭文脉，深感欣慰。当年老夫在武夷山隐屏峰下结庐讲学，四方学者负笈来从；今日学院广聚英才，读书穷理，正是源头活水长流不息之实相！"
    },
    "武夷山九曲清溪与竹筏漂流": {
        img: "/static/scenery/jiuqu_stream.jpg",
        name: "武夷山 · 九曲清溪与竹筏漂流",
        quote: "“武夷山上有仙灵，山下寒流曲曲清。欲识个中奇绝处，棹歌闲听两三声。” —— 朱熹《九曲棹歌》",
        experience: "淳熙十一年，老夫泛舟九曲，作《九曲棹歌》十首。自一曲大王峰起，至九曲平川止，曲曲山回水转，碧水丹山。老夫非徒贪恋风景，盖因山水有自然之至理，乘竹筏顺流而下，虚心涵泳，恰如为学进道之次第！"
    },
    "建阳考亭书院与道原堂": {
        img: "/static/scenery/kaoting_academy.jpg",
        name: "建阳 · 考亭书院与道原堂",
        quote: "“沧洲精舍，考亭讲学之地。四方之士，相从于此，日夜诵读研几，天下理学之渊薮也。” —— 《建阳县志》",
        experience: "绍熙三年，老夫定居建阳考亭，建沧洲精舍，后称考亭书院。老夫于此著述讲学，订定四书集注，与黄勉斋、蔡季通诸贤会友论道。晚年虽遭庆元党禁之厄，老夫临危不变，教导弟子坚守名节道义，终使考亭理学垂范后世！"
    },
    "武夷山五夫镇紫阳楼与荷塘": {
        img: "/static/scenery/wufu_ziyanglou.jpg",
        name: "武夷山五夫镇 · 紫阳楼与万亩荷塘",
        quote: "“问渠那得清如许？为有源头活水来。” —— 朱熹《观书有感》其一作于五夫方塘",
        experience: "老夫自十四岁丧父，奉母随刘子羽先生定居五夫里屏山之麓，读书于紫阳楼，居五夫四十余载。五夫门前有半亩方塘，夏日荷香十里。老夫于此手创五夫社仓以赈饥民，成家立业、穷理尽性，五夫实乃老夫一生学术奠基之所！"
    },
    "武夷山天游峰与隐屏峰": {
        img: "/static/scenery/tianyou_peak.jpg",
        name: "武夷山 · 天游峰与隐屏峰",
        quote: "“隐屏深处结茆茨，壁立千仞倚苍烟。绝顶极目观造化，太虚无碍理自全。”",
        experience: "隐屏峰下，削壁千仞，云雾缭绕。天游峰高踞九曲中枢，每当雨后初晴，登临天游极目远眺，群峰如卧龙戏水，云海翻腾。老夫常携弟子登临啸咏，于苍茫天地之间体认天人合一、心与理融之境！"
    },
    "武夷宫与武夷精舍": {
        img: "/static/scenery/wuyi_palace.jpg",
        name: "武夷宫与武夷精舍古建筑群",
        quote: "“琴书五十载，隐屏云雾深。武夷精舍里，聚徒传道心。” —— 朱熹《武夷精舍杂咏》",
        experience: "淳熙十年，老夫结庐于大王峰与幔亭峰下，创武夷精舍。老夫在此著《四书章句集注》、聚徒开讲十余载。精舍内设仁智堂、隐求室、止宿寮，门人四方辐辏，朱张会讲于此，实乃宋学极盛之辉煌篇章！"
    }
};

function appendAssistantParchment(moduleKey, text) {
    const sess = chatSessions[moduleKey];
    if (!sess) return;
    const container = document.getElementById(sess.containerId);
    if (!container) return;

    const assistantRow = document.createElement("div");
    assistantRow.className = "message-row assistant";
    assistantRow.innerHTML = `
        <div class="message-avatar"><img src="/static/avatar_ref_hd.png" alt="先生" class="msg-avatar-img"></div>
        <div class="message-bubble parchment-bubble">
            <div class="bubble-top-row">
                <span class="speaker-label">考亭先生 · 专修亲授</span>
                <button class="tts-play-btn" onclick="playVoiceFromBubble(this)">
                    <span class="tts-icon">🔊</span> <span class="tts-text">聆听先生讲学</span>
                </button>
            </div>
            <div class="message-text">${renderMarkdown(cleanParentheses(text))}</div>
            <div class="bubble-seal-mark">考亭印</div>
        </div>
    `;
    container.appendChild(assistantRow);
    container.scrollTop = container.scrollHeight;

    if (sess.history) {
        sess.history.push({ role: "assistant", content: text });
    }
}

function startTaskFlow(flowKey) {
    currentTaskFlow = flowKey;

    const bar = document.getElementById("active-taskflow-bar");
    const chipsBar = document.getElementById("taskflow-quick-chips");
    const defaultChipsBar = document.getElementById("qa-default-chips-bar");
    const iconEl = document.getElementById("active-flow-icon");
    const titleEl = document.getElementById("active-flow-title");

    if (bar) bar.style.display = "flex";
    if (chipsBar) chipsBar.style.display = "flex";
    if (defaultChipsBar) defaultChipsBar.style.display = "none";

    let flowTitle = "";
    let flowIcon = "";
    let openingMsg = "";
    let chipsHtml = "";

    if (flowKey === "thesis") {
        flowTitle = "论文写作指导";
        flowIcon = "🎓";
        openingMsg = "后学有志于理学学术研撰，诚乃光大考亭道统之大幸！研撰理学论文，首重立意高远、辨析精微。请点击上方任一论题方向，老夫当从论点破题、义理脉络与论证纲要予以系统指导；若有自拟论题，亦可直接在对话框中键入道来！";
        chipsHtml = `
            <button class="taskflow-quick-chip" onclick="selectThesisDirection('朱子‘理在气先’与本体宇宙论深析')">📜 论题一：理在气先与本体论</button>
            <button class="taskflow-quick-chip" onclick="selectThesisDirection('从‘即物穷理’看朱子认识论与现代科学精神之异同')">🔬 论题二：即物穷理与科学精神</button>
            <button class="taskflow-quick-chip" onclick="selectThesisDirection('‘心统性情’视野下朱子工夫论与当代身心安顿')">🌸 论题三：心统性情与身心安顿</button>
            <button class="taskflow-quick-chip" onclick="selectThesisDirection('武夷精舍与考亭书院理学教育体系考论')">🏛️ 论题四：书院理学教育体系</button>
        `;
    } else if (flowKey === "poetry") {
        flowTitle = "古诗析理鉴赏";
        flowIcon = "📜";
        openingMsg = "老夫一生寄情于诗，诗中皆有理学生意。仁兄可点击下方诗歌名篇，亦可直接在对话框键入诗句，或点击输入栏右侧【📷 传图】按钮上传古诗墨宝、碑刻或书画照片。老夫当为仁兄由诗入道、开掘朱子文化与理学哲思！";
        chipsHtml = `
            <button class="taskflow-quick-chip" onclick="selectPoetrySample('观书有感其一')">📖 《观书有感·半亩方塘》</button>
            <button class="taskflow-quick-chip" onclick="selectPoetrySample('观书有感其二')">🚢 《观书有感·艨艟巨舰》</button>
            <button class="taskflow-quick-chip" onclick="selectPoetrySample('九曲棹歌')">🚣 《九曲棹歌》其一</button>
            <button class="taskflow-quick-chip" onclick="selectPoetrySample('春日')">🌸 《春日·泗水寻芳》</button>
            <button class="taskflow-quick-chip" onclick="triggerPoetryImageUpload()">📷 上传古诗墨宝图片</button>
        `;
    } else if (flowKey === "scenery") {
        flowTitle = "武夷胜景揽胜";
        flowIcon = "🏞️";
        openingMsg = "武夷山川，钟灵毓秀。老夫一生大半岁月皆在此结庐讲学、啸咏烟霞。仁兄今日欲先赏览何处名胜？请点击上方胜景，老夫当呈递真景画卷，结合文献诗文讲述当年亲历与哲思！";
        chipsHtml = `
            <button class="taskflow-quick-chip" onclick="selectScenerySpot('武夷学院朱子像与朱子书院')">🏛️ 武夷学院朱子像</button>
            <button class="taskflow-quick-chip" onclick="selectScenerySpot('武夷山九曲清溪与竹筏漂流')">🚣 九曲清溪竹筏</button>
            <button class="taskflow-quick-chip" onclick="selectScenerySpot('建阳考亭书院与道原堂')">🏮 考亭书院道原堂</button>
            <button class="taskflow-quick-chip" onclick="selectScenerySpot('武夷山五夫镇紫阳楼与荷塘')">🏡 五夫镇紫阳楼</button>
            <button class="taskflow-quick-chip" onclick="selectScenerySpot('武夷山天游峰与隐屏峰')">⛰️ 天游峰与隐屏峰</button>
            <button class="taskflow-quick-chip" onclick="selectScenerySpot('武夷宫与武夷精舍')">🍃 武夷宫与精舍</button>
        `;
    } else if (flowKey === "life") {
        flowTitle = "朱子人生经历";
        flowIcon = "⏳";
        openingMsg = "老夫行年七十有一，历经高宗、孝宗、光宗、宁宗四朝，一生穷理尽性、坎坷求道。后学欲探寻老夫哪一段求索岁月？点击上方任一阶段，老夫自当娓娓道来，仁兄亦可随时提问，共论得失！";
        chipsHtml = `
            <button class="taskflow-quick-chip" onclick="selectLifeStage('幼承庭训与从师游学')">📜 1. 幼承庭训与从师游学</button>
            <button class="taskflow-quick-chip" onclick="selectLifeStage('延平师事与弃佛归儒')">🌊 2. 延平师事与弃佛归儒</button>
            <button class="taskflow-quick-chip" onclick="selectLifeStage('结庐武夷与撰集四书')">🌿 3. 结庐武夷与撰集四书</button>
            <button class="taskflow-quick-chip" onclick="selectLifeStage('鹅湖之会与朱陆论辩')">🕊️ 4. 鹅湖之会与朱陆论辩</button>
            <button class="taskflow-quick-chip" onclick="selectLifeStage('知南康军与复兴白鹿洞')">🌾 5. 知南康军与复兴白鹿洞</button>
            <button class="taskflow-quick-chip" onclick="selectLifeStage('晚年考亭与庆元党禁')">⚡ 6. 晚年考亭与庆元党禁</button>
        `;
    }

    if (iconEl) iconEl.textContent = flowIcon;
    if (titleEl) titleEl.textContent = `当前专修：${flowTitle}`;
    if (chipsBar) chipsBar.innerHTML = chipsHtml;

    appendAssistantParchment("qa", openingMsg);
    speakInstantText(openingMsg);
    showToast(`已开启【${flowTitle}】`);
}

function exitTaskFlow() {
    currentTaskFlow = null;
    const bar = document.getElementById("active-taskflow-bar");
    const chipsBar = document.getElementById("taskflow-quick-chips");
    const defaultChipsBar = document.getElementById("qa-default-chips-bar");

    if (bar) bar.style.display = "none";
    if (chipsBar) chipsBar.style.display = "none";
    if (defaultChipsBar) defaultChipsBar.style.display = "flex";
    showToast("已退出当前专修任务流，恢复自由问学");
}

function selectThesisDirection(topic) {
    sendTaskFlowQuery(`【论文专修·步骤一】后学欲撰写理学学术论文，选题方向拟定为【${topic}】。请先生从立论破题、核心问题意识予以指导，并直接列出武夷学院逸夫图书馆特藏专柜之具体内容文献、原典文句引据及OPAC索书号，完成步骤一指导。`);
}

function selectPoetrySample(key) {
    const poems = {
        "观书有感其一": "半亩方塘一鉴开，天光云影共徘徊。问渠那得清如许？为有源头活水来。",
        "观书有感其二": "昨夜江边春水生，艨艟巨舰一毛轻。向来枉费推移力，此日中流自在行。",
        "九曲棹歌": "武夷山上有仙灵，山下寒流曲曲清。欲识个中奇绝处，棹歌闲听两三声。",
        "春日": "胜日寻芳泗水滨，无边光景一时新。等闲识得东风面，万紫千红总是春。"
    };
    const p = poems[key] || key;
    sendTaskFlowQuery(`请先生赏析诗句：“${p}”，由诗入道，从诗句题解、格物意境、朱子文化理学要旨、武夷山水情怀以及对后学修身践履之启示，进行四维理学深度剖析。`);
}

function selectScenerySpot(spot) {
    const info = SCENERY_IMAGE_MAP[spot];
    if (info) {
        // 先在对话流呈现高清名胜真景画卷
        const container = document.getElementById("qa-messages");
        if (container) {
            const imgRow = document.createElement("div");
            imgRow.className = "message-row assistant";
            imgRow.innerHTML = `
                <div class="message-avatar"><img src="/static/avatar_ref_hd.png" alt="先生" class="msg-avatar-img"></div>
                <div class="message-bubble parchment-bubble">
                    <div class="bubble-top-row">
                        <span class="speaker-label">考亭先生 · 递呈武夷胜景画卷</span>
                    </div>
                    <div style="margin:8px 0; border-radius:8px; overflow:hidden; border:1px solid #c59b4c; box-shadow:0 4px 12px rgba(0,0,0,0.15);">
                        <img src="${info.img}" style="width:100%; max-height:280px; object-fit:cover; display:block;" alt="${info.name}">
                        <div style="background:#fef3c7; color:#78350f; padding:8px 12px; font-size:12.5px; font-weight:bold; font-family:var(--font-serif);">${info.name}</div>
                    </div>
                    <div class="message-text"><strong>【胜景典籍依据】：</strong><br>${info.quote}</div>
                </div>
            `;
            container.appendChild(imgRow);
            container.scrollTop = container.scrollHeight;
        }
    }
    sendTaskFlowQuery(`后学欲畅游赏玩【${spot}】，请先生展示此胜境之画卷，并结合文献诗文讲述先生当年在此处的真实经历与哲思体悟。`);
}

function selectLifeStage(stage) {
    sendTaskFlowQuery(`请先生以纯第一人称，详述您当年【${stage}】这一时期的亲身经历、重大历史事件、内心求索与道义风骨。述毕请询问后学对此段岁月有何疑问或欲深入研讨之处。`);
}

function sendTaskFlowQuery(text) {
    sendQuery("qa", text);
}

function triggerPoetryImageUpload() {
    const input = document.getElementById("poetry-file-input");
    if (input) input.click();
}

async function handlePoetryImageFile(input) {
    const file = input.files[0];
    if (!file) return;

    showToast(`正在呈交先生识读古诗墨宝《${file.name}》...`);
    const formData = new FormData();
    formData.append("file", file);

    try {
        const res = await fetch("/api/document/analyze", {
            method: "POST",
            body: formData
        });
        const data = await res.json();
        if (res.ok && data.prompt) {
            sendQuery("qa", data.prompt);
            showToast("古诗墨宝呈递成功，先生正即物穷理析理中");
        } else {
            showToast(data.detail || "古诗墨宝识读失败，请重试");
        }
    } catch (err) {
        showToast(`识读遇阻: ${err.message}`);
    } finally {
        input.value = "";
    }
}

function updateTaskFlowChips(fullText) {
    if (!currentTaskFlow) return;
    const chipsBar = document.getElementById("taskflow-quick-chips");
    if (!chipsBar) return;

    if (currentTaskFlow === "thesis") {
        if (fullText.includes("步骤六") || fullText.includes("终审评语") || fullText.includes("终审通过") || fullText.includes("答辩委员会") || fullText.includes("准予开题")) {
            chipsBar.innerHTML = `
                <button class="taskflow-quick-chip" onclick="exitTaskFlow()">🎓 开题圆满，导出总纲</button>
                <button class="taskflow-quick-chip" onclick="startTaskFlow('thesis')">🔄 开启其他论文题目</button>
                <button class="taskflow-quick-chip" onclick="sendTaskFlowQuery('【质询深探】请先生针对答辩第一问‘本体在先与时间在先’再作深入点拨。')">💬 深探答辩第一问</button>
            `;
        } else if (fullText.includes("步骤五") || fullText.includes("学术前沿") || fullText.includes("创新点提炼") || fullText.includes("文献综述撰拟")) {
            chipsBar.innerHTML = `
                <button class="taskflow-quick-chip" onclick="sendTaskFlowQuery('【论文专修·步骤六】论点与文献综述已备！请先生移步考亭讲席，举行毕业答辩模拟质询并出具开题终审评语！')">🎓 推进至步骤六：毕业答辩模拟质询与开题总纲</button>
                <button class="taskflow-quick-chip" onclick="sendTaskFlowQuery('请先生为文献综述部分补充更多当代理学前沿专著文献。')">📖 补充现当代前沿专著</button>
                <button class="taskflow-quick-chip" onclick="sendTaskFlowQuery('请先生针对本题提炼更多跨学科生态伦理之创新点。')">💡 深入挖掘前沿创新点</button>
            `;
        } else if (fullText.includes("步骤四") || fullText.includes("四章节") || fullText.includes("分章写作") || fullText.includes("论证细纲")) {
            chipsBar.innerHTML = `
                <button class="taskflow-quick-chip" onclick="sendTaskFlowQuery('【论文专修·步骤五】四章节大纲已定！请先生指导学术前沿创新点提炼与权威文献综述撰写规范！')">🔬 推进至步骤五：学术前沿创新点与文献综述撰拟</button>
                <button class="taskflow-quick-chip" onclick="sendTaskFlowQuery('请先生详细指导本论文引言与结语的写作技法。')">✍️ 探讨引言与结语撰写</button>
                <button class="taskflow-quick-chip" onclick="sendTaskFlowQuery('请先生为第二章核心概念考证细化具体的论证段落。')">📑 细化第二章论证段落</button>
            `;
        } else if (fullText.includes("步骤三") || fullText.includes("范畴辩证") || fullText.includes("学术争鸣") || fullText.includes("学术辩难")) {
            chipsBar.innerHTML = `
                <button class="taskflow-quick-chip" onclick="sendTaskFlowQuery('【论文专修·步骤四】核心范畴辩难已通！请先生开列四章节系统论证细纲与分章正文写作要领！')">✍️ 推进至步骤四：四章节论证细纲与分章写作</button>
                <button class="taskflow-quick-chip" onclick="sendTaskFlowQuery('请先生深入剖析陈来先生与冯友兰先生在此论题上的学术分歧。')">🔍 深入剖析学界论争</button>
                <button class="taskflow-quick-chip" onclick="sendTaskFlowQuery('请先生指导如何有力回应清代考据学家对理学的批评。')">🛡️ 回应后儒学术批评</button>
            `;
        } else if (fullText.includes("步骤二") || fullText.includes("文句考证") || fullText.includes("文献精研") || fullText.includes("字词训诂")) {
            chipsBar.innerHTML = `
                <button class="taskflow-quick-chip" onclick="sendTaskFlowQuery('【论文专修·步骤三】原文考证甚为精审！请先生指导核心哲学范畴辩证与学术史争鸣！')">⚖️ 推进至步骤三：核心哲学范畴辩证与学术争鸣</button>
                <button class="taskflow-quick-chip" onclick="sendTaskFlowQuery('请先生对方才所引《朱子语类》‘毕竟也只是理’做更深一层的本体义理剖析。')">📖 深究核心原文义理</button>
                <button class="taskflow-quick-chip" onclick="sendTaskFlowQuery('换一批特藏典籍文献，需要考亭先生调阅更多本校特藏古籍。')">📚 调换一批特藏古籍</button>
            `;
        } else {
            // 步骤一或默认初始状态
            chipsBar.innerHTML = `
                <button class="taskflow-quick-chip" onclick="sendTaskFlowQuery('【论文专修·步骤二】步骤一文献定位已明！请先生开启步骤二，对特藏核心原文文句进行逐句考据与深细训诂！')">📜 推进至步骤二：特藏文献精研与文句考证</button>
                <button class="taskflow-quick-chip" onclick="sendTaskFlowQuery('换一批特藏文献，请先生从武夷学院逸夫图书馆更换其他批次文献典籍。')">📚 更换一批特藏文献</button>
                <button class="taskflow-quick-chip" onclick="sendTaskFlowQuery('请先生为本选题进一步阐发核心问题意识与立论深意。')">💡 深化本题问题意识</button>
                <button class="taskflow-quick-chip" onclick="startTaskFlow('thesis')">🔄 重新自选论题方向</button>
            `;
        }
    } else if (currentTaskFlow === "scenery") {
        chipsBar.innerHTML = `
            <button class="taskflow-quick-chip" onclick="selectScenerySpot('武夷学院朱子像与朱子书院')">🏛️ 武夷学院朱子像</button>
            <button class="taskflow-quick-chip" onclick="selectScenerySpot('武夷山九曲清溪与竹筏漂流')">🚣 九曲清溪竹筏</button>
            <button class="taskflow-quick-chip" onclick="selectScenerySpot('建阳考亭书院与道原堂')">🏮 考亭书院道原堂</button>
            <button class="taskflow-quick-chip" onclick="selectScenerySpot('武夷山五夫镇紫阳楼与荷塘')">🏡 五夫镇紫阳楼</button>
            <button class="taskflow-quick-chip" onclick="selectScenerySpot('武夷山天游峰与隐屏峰')">⛰️ 天游峰与隐屏峰</button>
            <button class="taskflow-quick-chip" onclick="selectScenerySpot('武夷宫与武夷精舍')">🍃 武夷宫精舍</button>
            <button class="taskflow-quick-chip" onclick="sendTaskFlowQuery('暂且游毕，感谢先生相伴云游武夷山水！')">🏞️ 暂且游毕</button>
        `;
    } else if (currentTaskFlow === "life") {
        if (fullText.includes("没有疑问") || fullText.includes("不需要了") || fullText.includes("告一段落") || fullText.includes("天下后世")) {
            chipsBar.innerHTML = `
                <button class="taskflow-quick-chip" onclick="startTaskFlow('life')">🔄 研读其他人生阶段</button>
                <button class="taskflow-quick-chip" onclick="exitTaskFlow()">🚪 结束生平研讨</button>
            `;
        } else {
            chipsBar.innerHTML = `
                <button class="taskflow-quick-chip" onclick="sendTaskFlowQuery('请问先生当时面对挫折与非议，内心如何居敬涵养、自我反省？')">💭 当时内心如何存养？</button>
                <button class="taskflow-quick-chip" onclick="sendTaskFlowQuery('请先生讲述下一阶段的人生历程。')">➡️ 请述下一阶段</button>
                <button class="taskflow-quick-chip" onclick="sendTaskFlowQuery('已知晓这段历史，没有疑问了，不需要了，感谢先生开示！')">✅ 没有疑问了，不需要了</button>
                <button class="taskflow-quick-chip" onclick="exitTaskFlow()">🚪 结束生平研讨</button>
            `;
        }
    }
}

// ========================================================
// 考亭讲筵 GalGame 研学交互辅助函数与讲义桥接
// ========================================================
function ensureGalGameEngineSyllabusBridge() {
    if (!window.galGameEngine) {
        window.galGameEngine = {};
    }
    if (typeof window.galGameEngine.updateSyllabusDrawer !== "function") {
        window.galGameEngine.updateSyllabusDrawer = function(chapterId) {
            if (!chapterId) chapterId = window.galGameEngine.currentChapterId || "wuyi_jingshe";
            const c = courseList.find(item => item.chapterId === chapterId) || courseList[0];
            if (!c) return;
            const badgeEl = document.getElementById("course-badge");
            const titleEl = document.getElementById("course-title");
            const summaryEl = document.getElementById("course-summary");
            const originalEl = document.getElementById("course-original");
            const commentaryEl = document.getElementById("course-commentary");
            const thinkingEl = document.getElementById("course-thinking");

            if (badgeEl) badgeEl.textContent = c.badge;
            if (titleEl) titleEl.textContent = c.title;
            if (summaryEl) summaryEl.textContent = c.summary;
            if (originalEl) originalEl.textContent = c.original;
            if (commentaryEl) commentaryEl.textContent = c.commentary;
            if (thinkingEl) thinkingEl.textContent = c.thinking;

            const pills = document.querySelectorAll(".drawer-chapter-pill");
            pills.forEach(pill => {
                const cAttr = pill.getAttribute("data-chapter") || "";
                const onclickVal = pill.getAttribute("onclick") || "";
                if (cAttr === chapterId || onclickVal.includes(`'${chapterId}'`) || onclickVal.includes(`"${chapterId}"`)) {
                    pill.classList.add("active");
                } else {
                    pill.classList.remove("active");
                }
            });
        };
    }
    if (typeof window.galGameEngine.switchSyllabusChapter !== "function") {
        window.galGameEngine.switchSyllabusChapter = function(chapterId) {
            if (window.galGameEngine.updateSyllabusDrawer) {
                window.galGameEngine.updateSyllabusDrawer(chapterId);
            }
            if (typeof window.galGameEngine.loadChapter === "function") {
                window.galGameEngine.loadChapter(chapterId, 0);
            }
        };
    }
    window.updateSyllabusDrawer = window.updateSyllabusDrawer || window.galGameEngine.updateSyllabusDrawer;
    window.switchSyllabusChapter = window.switchSyllabusChapter || window.galGameEngine.switchSyllabusChapter;
}
ensureGalGameEngineSyllabusBridge();

function switchGalGameChapter(chapterId, btnEl) {
    ensureGalGameEngineSyllabusBridge();
    if (btnEl) {
        document.querySelectorAll(".chapter-tab-pill").forEach(p => p.classList.remove("active"));
        btnEl.classList.add("active");
    }
    if (window.galGameEngine) {
        if (typeof window.galGameEngine.loadChapter === "function") {
            window.galGameEngine.loadChapter(chapterId, 0);
        }
        if (typeof window.galGameEngine.updateSyllabusDrawer === "function") {
            window.galGameEngine.updateSyllabusDrawer(chapterId);
        }
    }
}

function toggleGalGameSyllabusDrawer() {
    ensureGalGameEngineSyllabusBridge();
    const drawer = document.getElementById("galgame-syllabus-drawer");
    if (!drawer) return;
    const isHidden = drawer.style.display === "none" || !drawer.style.display;
    drawer.style.display = isHidden ? "flex" : "none";
    if (isHidden && window.galGameEngine) {
        const curId = window.galGameEngine.currentChapterId || "wuyi_jingshe";
        if (typeof window.galGameEngine.updateSyllabusDrawer === "function") {
            window.galGameEngine.updateSyllabusDrawer(curId);
        }
    }
}

function selectCourse(index) {
    currentCourseIndex = index;
    const c = courseList[index];
    if (!c) return;

    // 更新选项卡样式
    const tabs = document.querySelectorAll(".course-tab-btn");
    tabs.forEach((t, i) => {
        if (i === index) t.classList.add("active");
        else t.classList.remove("active");
    });

    // 填充讲义文本
    const badgeEl = document.getElementById("course-badge");
    const titleEl = document.getElementById("course-title");
    const summaryEl = document.getElementById("course-summary");
    const originalEl = document.getElementById("course-original");
    const commentaryEl = document.getElementById("course-commentary");
    const thinkingEl = document.getElementById("course-thinking");

    if (badgeEl) badgeEl.textContent = c.badge;
    if (titleEl) titleEl.textContent = c.title;
    if (summaryEl) summaryEl.textContent = c.summary;
    if (originalEl) originalEl.textContent = c.original;
    if (commentaryEl) commentaryEl.textContent = c.commentary;
    if (thinkingEl) thinkingEl.textContent = c.thinking;

    if (c.chapterId && window.galGameEngine) {
        window.galGameEngine.loadChapter(c.chapterId, 0);
    }
}

function askAboutCurrentCourse() {
    const c = courseList[currentCourseIndex];
    if (!c) return;
    const prompt = `请先生为后学讲授${c.title}中“${c.original.replace(/[“”"]/g, '').slice(0, 32)}...”之微言大义与治学要领。`;
    sendQuery("class", prompt);
}

function toggleRitualPunch(btn, ritualName) {
    const card = btn.closest(".compact-ritual-item") || btn.closest(".ritual-card") || btn;
    const isChecked = card.classList.contains("checked") || card.classList.contains("done");
    const statusEl = card.querySelector(".item-status") || btn;

    if (!isChecked) {
        card.classList.add("checked", "done");
        if (statusEl) statusEl.textContent = "已践履 ✓";
        showToast(`「${ritualName}」已恭敬践履，修德进业日增！`);
        if (window.studySupervisor) {
            window.studySupervisor.reverenceScore = Math.min(100, (window.studySupervisor.reverenceScore || 90) + 5);
            if (window.studySupervisor.reverenceScoreEl) {
                window.studySupervisor.reverenceScoreEl.textContent = window.studySupervisor.reverenceScore;
            }
        }
    } else {
        card.classList.remove("checked", "done");
        if (statusEl) statusEl.textContent = "打卡";
        showToast(`「${ritualName}」践履记录已重置`);
    }
}

function submitReflectionToMaster() {
    const textarea = document.getElementById("reflection-text");
    const text = (textarea ? textarea.value : "").trim();
    if (!text) {
        showToast("请先在上方写下今日读书治学所得或身心省察反思。");
        return;
    }

    textarea.value = "";
    const prompt = `后学今日日课省察札记：“${text}”。恭请夫子严加考校批阅，指出后学用功不足之处！`;
    sendQuery("plan", prompt);
}

// ========================================================
// 沧洲藏书交互 (藏书求径)
// ========================================================
function consultSpecificBook(bookTitle) {
    switchNav("recommend");
    const prompt = `后学欲研读《${bookTitle}》，请先生指点阅读次第、研读法门与核心宗旨。`;
    sendQuery("recommend", prompt);
}

// ========================================================
// 考亭晨策 · 朱子灵签解惑功能
// ========================================================
let currentDrawnSlip = null;

function openWisdomModal() {
    stopCurrentVoice(true);
    const modal = document.getElementById("wisdom-modal");
    if (!modal) return;
    drawAnotherSlip(false);
    modal.classList.add("active");
}

function closeWisdomModal(event) {
    if (event && event.target && event.target.id !== "wisdom-modal" && !event.target.classList.contains("modal-close-btn")) {
        return;
    }
    const modal = document.getElementById("wisdom-modal");
    if (modal) modal.classList.remove("active");
}

function drawAnotherSlip(showFeedback = true) {
    const randomIndex = Math.floor(Math.random() * dailyQuotes.length);
    currentDrawnSlip = dailyQuotes[randomIndex];
    
    const quoteEl = document.getElementById("modal-slip-quote");
    const sourceEl = document.getElementById("modal-slip-source");
    if (quoteEl && sourceEl) {
        quoteEl.style.opacity = "0";
        sourceEl.style.opacity = "0";
        setTimeout(() => {
            quoteEl.textContent = currentDrawnSlip.quote;
            sourceEl.textContent = currentDrawnSlip.author;
            quoteEl.style.opacity = "1";
            sourceEl.style.opacity = "1";
        }, 150);
    }
    if (showFeedback) {
        showToast("已诚心求得一则考亭修身箴言！");
    }
}

function consultMasterAboutSlip() {
    if (!currentDrawnSlip) {
        currentDrawnSlip = dailyQuotes[0];
    }
    closeWisdomModal();
    const prompt = `后学今日求得先生晨策灵签：“${currentDrawnSlip.quote}”。敢问先生，此语微言大义为何？在后学今日治学涉世之中，当如何切己体察践履？`;
    switchNav("qa");
    sendQuery("qa", prompt);
}

function copySlipQuote() {
    if (!currentDrawnSlip) return;
    const text = `${currentDrawnSlip.quote}\n${currentDrawnSlip.author}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showToast("箴言已复制至剪贴板");
        }).catch(() => {
            showToast("已复制");
        });
    } else {
        showToast("已复制");
    }
}

// 全屏沉浸研学切换
function toggleFullScreen() {
    if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {});
            showToast("已进入全屏沉浸研习模式");
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
            showToast("已退出全屏模式");
        }
    }
}

// 抽取朱子修身晨策 (兼容旧接口)
function drawDailyQuote() {
    drawAnotherSlip(false);
}

// ========================================================
// 典雅语音合成 (全局统一唯一考亭大儒声线，杜绝声线错乱与多重重叠)
// ========================================================
async function playVoice(text, btnElement, voiceStyleOverride) {
    // 1. 无条件彻底静音并停止当前任何在播音频或浏览器语音
    stopCurrentVoice(false);
    if ('speechSynthesis' in window) {
        try {
            window.speechSynthesis.cancel();
        } catch (e) {}
    }

    activePlayId++;
    const thisPlayId = activePlayId;
    currentTTSButton = btnElement;

    // 清洗文本用于纯净朗诵
    let cleanText = text
        .replace(/[#*`_>~]/g, "")
        .replace(/\[.*?\]/g, "")
        .replace(/\(.*?\)/g, "")
        .replace(/【.*?】/g, "")
        .replace(/📜|💡|🎯|✨|🌟|🏮|🌅|☀️|🌙/g, "")
        .trim();

    if (cleanText.length > 500) {
        cleanText = cleanText.substring(0, 500) + "。余言且待仁兄细味。";
    }

    if (!cleanText) return;

    if (btnElement) {
        btnElement.classList.add("playing");
        const icon = btnElement.querySelector(".tts-icon");
        const label = btnElement.querySelector(".tts-text");
        if (icon) icon.textContent = "🔊";
        if (label) label.textContent = "夫子讲学中...";
    }

    // 唤醒全局播放条（统一考亭大儒标识）
    const audioDock = document.getElementById("audio-dock");
    if (audioDock) {
        audioDock.style.display = "flex";
        const dockTitle = document.getElementById("dock-title");
        if (dockTitle) dockTitle.textContent = "考亭大儒 · 苍劲风骨 诵读中";
    }

    try {
        currentTTSAbortController = new AbortController();
        const response = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                text: cleanText,
                style: "yunjian"
            }),
            signal: currentTTSAbortController.signal
        });

        if (thisPlayId !== activePlayId) return;

        if (!response.ok) {
            throw new Error(`语音合成服务返回 ${response.status}`);
        }

        const blob = await response.blob();
        if (thisPlayId !== activePlayId) return;

        const audioUrl = URL.createObjectURL(blob);
        currentAudio = new Audio(audioUrl);
        isVoicePlaying = true;
        isVoicePaused = false;

        currentAudio.onended = () => {
            stopCurrentVoice(true);
        };

        currentAudio.onerror = (e) => {
            console.warn("音频播放异常:", e);
            if (thisPlayId === activePlayId) stopCurrentVoice(true);
        };

        await currentAudio.play().catch(playErr => {
            console.warn("音频自动播放需用户手势触发:", playErr);
            // 保持单一纯粹声线，绝不降级至杂乱机械语音
            if (btnElement) {
                const label = btnElement.querySelector(".tts-text");
                if (label) label.textContent = "点击聆听夫子原声";
            }
        });

        if (window.avatarEngine && avatarEngine.currentState !== "speaking") {
            avatarEngine.setState("speaking");
        }

    } catch (err) {
        if (err.name !== "AbortError") {
            console.warn("TTS 播放受限:", err);
        }
        if (thisPlayId === activePlayId) {
            stopCurrentVoice(true);
        }
    }
}

// 严禁任何杂乱内建语音干扰：全局静默 SpeechSynthesis
function cancelAnyBrowserSpeech() {
    if ('speechSynthesis' in window) {
        try { window.speechSynthesis.cancel(); } catch (e) {}
    }
}

// 全局暴露语音与对话派发工具
window.playVoiceByText = (text, style) => playVoice(text, null, style);
window.sendQuery = sendQuery;


function playVoiceFromBubble(btn) {
    const bubble = btn.closest(".message-bubble");
    if (!bubble) return;
    const textEl = bubble.querySelector(".message-text");
    if (!textEl) return;
    playVoice(textEl.innerText, btn);
}

function togglePauseVoice() {
    if (!currentAudio) return;
    const icon = document.getElementById("dock-play-pause-icon");
    const text = document.getElementById("dock-play-pause-text");

    if (isVoicePaused) {
        currentAudio.play();
        isVoicePaused = false;
        if (icon) icon.textContent = "⏸️";
        if (text) text.textContent = "暂停";
    } else {
        currentAudio.pause();
        isVoicePaused = true;
        if (icon) icon.textContent = "▶️";
        if (text) text.textContent = "继续";
    }
}

function stopCurrentVoice(hideDock = false) {
    activePlayId++;
    if (currentTTSAbortController) {
        currentTTSAbortController.abort();
        currentTTSAbortController = null;
    }
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = "";
        currentAudio = null;
    }
    // 强制终止浏览器一切原生语音朗读，防止声线重叠冲突
    if ('speechSynthesis' in window) {
        try {
            window.speechSynthesis.cancel();
        } catch (e) {}
    }
    isVoicePlaying = false;
    isVoicePaused = false;

    if (currentTTSButton) {
        currentTTSButton.classList.remove("playing");
        const icon = currentTTSButton.querySelector(".tts-icon");
        const label = currentTTSButton.querySelector(".tts-text");
        if (icon) icon.textContent = "🔊";
        if (label) label.textContent = "聆听先生讲学";
        currentTTSButton = null;
    }

    if (hideDock) {
        const audioDock = document.getElementById("audio-dock");
        if (audioDock) audioDock.style.display = "none";
    }

    if (window.avatarEngine && avatarEngine.currentState === "speaking") {
        avatarEngine.setState("idle");
    }
}

function toggleAutoTTS() {
    autoTTS = !autoTTS;
    const ttsIcon = document.getElementById("tts-icon");
    const modalBtn = document.getElementById("modal-tts-toggle");

    if (autoTTS) {
        if (ttsIcon) ttsIcon.textContent = "🔊";
        if (modalBtn) { modalBtn.textContent = "已开启"; modalBtn.className = "toggle-pill-btn"; }
        showToast("已开启先生回答自动配音");
    } else {
        stopCurrentVoice(true);
        if (ttsIcon) ttsIcon.textContent = "🔇";
        if (modalBtn) { modalBtn.textContent = "已关闭"; modalBtn.className = "toggle-pill-btn off"; }
        showToast("已静音先生自动配音");
    }
}

function changeVoiceStyle(val) {
    currentVoiceStyle = val;
    showToast("已切换诵读风骨声线");
}

// ========================================================
// 辅助与弹窗管理器
// ========================================================
function toggleTheme() {
    document.body.classList.toggle("dark-theme");
    const isDark = document.body.classList.contains("dark-theme");
    showToast(isDark ? "已切换至焦墨夜读模式" : "已切换至晴光日用模式");
}

function openUploadModal() {
    document.getElementById("upload-modal").classList.add("active");
    loadKnowledgeStats();
}
function closeUploadModal() {
    document.getElementById("upload-modal").classList.remove("active");
}

function openHistoryModal() {
    document.getElementById("history-modal").classList.add("active");
}
function closeHistoryModal() {
    document.getElementById("history-modal").classList.remove("active");
}

function openFavoriteModal() {
    openHistoryModal();
}

function openSettingsModal() {
    document.getElementById("settings-modal").classList.add("active");
}
function closeSettingsModal() {
    document.getElementById("settings-modal").classList.remove("active");
}

// 模拟窗口控件
function minimizeWindow() { showToast("应用已最小化至任务栏"); }
function toggleMaximize() { showToast("窗口最大化视图"); }
function closeWindow() { showToast("学者且慢行，考亭常在。"); }

// 知识库文件加载
async function loadKnowledgeStats() {
    try {
        const res = await fetch("/api/knowledge/stats");
        if (res.ok) {
            const data = await res.json();
            const countEl = document.getElementById("kb-count");
            if (countEl) countEl.textContent = `${data.total_chunks || 0} 章节切片`;
            const fileListEl = document.getElementById("corpus-files");
            if (fileListEl && data.indexed_sources) {
                fileListEl.innerHTML = data.indexed_sources.map(s => `
                    <div style="font-size:12px; padding:4px 0; color:#475569; border-bottom:1px solid #f1f5f9;">
                        📜 《${s}》
                    </div>
                `).join("");
            }
        }
    } catch (e) {
        console.warn("加载知识库统计略有延迟");
    }
}

// 上传模式切换 (即物穷理深度剖析 vs 并入书院知识库)
function switchUploadMode(mode) {
    const tabAnalyze = document.getElementById("tab-btn-analyze");
    const tabCorpus = document.getElementById("tab-btn-corpus");
    const panelAnalyze = document.getElementById("panel-upload-analyze");
    const panelCorpus = document.getElementById("panel-upload-corpus");

    if (mode === "analyze") {
        if (tabAnalyze) tabAnalyze.classList.add("active");
        if (tabCorpus) tabCorpus.classList.remove("active");
        if (panelAnalyze) {
            panelAnalyze.classList.add("active");
            panelAnalyze.style.display = "block";
        }
        if (panelCorpus) {
            panelCorpus.classList.remove("active");
            panelCorpus.style.display = "none";
        }
    } else {
        if (tabCorpus) tabCorpus.classList.add("active");
        if (tabAnalyze) tabAnalyze.classList.remove("active");
        if (panelCorpus) {
            panelCorpus.classList.add("active");
            panelCorpus.style.display = "block";
        }
        if (panelAnalyze) {
            panelAnalyze.classList.remove("active");
            panelAnalyze.style.display = "none";
        }
    }
}

// 模块四：即物穷理文献深度剖析 (支持 txt, md, docx, pdf)
async function handleDocumentAnalysis(input) {
    const file = input.files[0];
    if (!file) return;

    const statusEl = document.getElementById("analysis-upload-status");
    if (statusEl) {
        statusEl.textContent = `考亭先生正在展卷细读《${file.name}》，即物穷理中...`;
        statusEl.style.color = "#2563eb";
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
        const res = await fetch("/api/document/analyze", {
            method: "POST",
            body: formData
        });
        const data = await res.json();
        if (res.ok && data.prompt) {
            if (statusEl) {
                statusEl.textContent = `《${file.name}》研析完成，即刻移步考亭精舍呈交先生朱砂手批！`;
                statusEl.style.color = "#16a34a";
            }
            setTimeout(() => {
                closeUploadModal();
                switchNav("qa");
                sendQuery("qa", data.prompt);
                showToast(`已将《${file.name}》呈递考亭先生即物穷理批阅`);
            }, 700);
        } else {
            if (statusEl) {
                statusEl.textContent = data.detail || "文献研析失败，请检查文件格式";
                statusEl.style.color = "#dc2626";
            }
        }
    } catch (err) {
        if (statusEl) {
            statusEl.textContent = `析理遇阻: ${err.message}`;
            statusEl.style.color = "#dc2626";
        }
    }
}

async function handleFileUpload(input) {
    const file = input.files[0];
    if (!file) return;

    const statusEl = document.getElementById("upload-status");
    if (statusEl) {
        statusEl.textContent = `正在上传并切片索引《${file.name}》...`;
        statusEl.style.color = "#2563eb";
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
        const res = await fetch("/api/custom_corpus/upload", {
            method: "POST",
            body: formData
        });
        const data = await res.json();
        if (res.ok) {
            if (statusEl) {
                statusEl.textContent = `《${file.name}》收录成功，新增切片已融入书院知识库！`;
                statusEl.style.color = "#16a34a";
            }
            loadKnowledgeStats();
        } else {
            if (statusEl) {
                statusEl.textContent = data.detail || "上传失败";
                statusEl.style.color = "#dc2626";
            }
        }
    } catch (err) {
        if (statusEl) {
            statusEl.textContent = `上传遇阻: ${err.message}`;
            statusEl.style.color = "#dc2626";
        }
    }
}

// 彻底清除所有中英文圆括号，替换为典雅破折号，绝不误伤正文与典籍原名
function cleanParentheses(text) {
    if (!text) return "";
    let t = text;

    // 1. 将圆括号替换为文人破折号，绝不误删括号内的大段精辟义理
    t = t.replace(/[（\(]([^\n()（）]{1,80})[）\)]/g, "——$1——");
    t = t.replace(/[（\(\)）]/g, "");

    // 2. 保护传世典籍真实馆藏原名（如《朱子语类》《朱子读书法》《朱子文集》等）
    // 3. 将人名直呼温和转为宗师尊称
    t = t.replace(/朱文公|朱夫子|朱老师|朱爷爷/g, "考亭先生");
    return t;
}

// 简易 Markdown 渲染器 (增强古典文风表现力，严禁输出任何括号与系统规则)
function renderMarkdown(md) {
    if (!md) return "";
    // 优先清除任何圆括号及其内部内容
    md = cleanParentheses(md);
    let html = escapeHtml(md);

    // 标题
    html = html.replace(/^### (.*$)/gim, '<h4 class="md-h4">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 class="md-h3">$1</h3>');
    html = html.replace(/^# (.*$)/gim, '<h2 class="md-h2">$1</h2>');

    // 粗体与高亮
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 引用块
    html = html.replace(/^\&gt; (.*$)/gim, '<blockquote>$1</blockquote>');

    // 换行保留
    html = html.replace(/\n\n/g, '<br><br>');
    html = html.replace(/\n/g, '<br>');

    // 转换正文引注角标 【1】 或 [1] 或 ① 为绿色圆圈徽标（完全匹配茶典智能体样式）
    const circledNums = { '①': 1, '②': 2, '③': 3, '④': 4, '⑤': 5, '⑥': 6, '⑦': 7, '⑧': 8, '⑨': 9 };
    html = html.replace(/[①②③④⑤⑥⑦⑧⑨]/g, (match) => {
        const num = circledNums[match];
        return `<span class="cite-ref-badge" data-ref="${num}" onclick="window.scrollToProvenanceRef(${num})" title="查看武夷学院馆藏原典引注 [${num}]">${num}</span>`;
    });
    html = html.replace(/(?:【([0-9]{1,2})】|\[([0-9]{1,2})\])(?!\d)/g, (match, p1, p2) => {
        const num = p1 || p2;
        return `<span class="cite-ref-badge" data-ref="${num}" onclick="window.scrollToProvenanceRef(${num})" title="查看武夷学院馆藏原典引注 [${num}]">${num}</span>`;
    });

    // 强化武夷学院自建特色库馆藏溯源与线下预约卡片
    html = enrichCitationWithOpac(html);

    return html;
}

function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ========================================================
// 武夷学院图书馆 OPAC (Space v4.2.29) 典籍库与线下预约管理器
// ========================================================
const OPAC_BOOKS_REGISTRY = {
    sishu: { id: "sishu", title: "《四书章句集注》", callNumber: "B222.12/Z90:10", location: "总馆 - 流通书库", copiesDesc: "纸本馆藏 1 册 / 实时在架可借 1 册", status: "可借", isBorrowable: true, bibId: "mc7034ec9f084a8217d312a7fbb9d0960" },
    daxue: { id: "daxue", title: "《大学章句》", callNumber: "B222.12/Z90：1", location: "总馆 - 流通书库", copiesDesc: "纸本馆藏 3 册 / 实时在架可借 3 册", status: "可借", isBorrowable: true, bibId: "m1ac8664b61c03d8a5c8a35571d676d66" },
    lunyu: { id: "lunyu", title: "《论语集注》", callNumber: "B222.22/Z90", location: "特藏室 · 宋明理学专柜", copiesDesc: "纸本馆藏 2 册 / 借出 (建议预约)", status: "借出", isBorrowable: false, bibId: "m94a1e22d43113bea41afbb3b3fb15046" },
    mengzi: { id: "mengzi", title: "《孟子集注》", callNumber: "B222.52/Z90/1", location: "总馆 - 流通书库", copiesDesc: "纸本馆藏 2 册 / 实时在架可借 2 册", status: "可借", isBorrowable: true, bibId: "m51f8f17f5b8a91bfc2c86da36d289bc9" },
    zhongyong: { id: "zhongyong", title: "《中庸章句》", callNumber: "B222.12/Z90：1", location: "总馆 - 流通书库", copiesDesc: "纸本馆藏 3 册 / 实时在架可借 3 册", status: "可借", isBorrowable: true, bibId: "m1ac8664b61c03d8a5c8a35571d676d66" },
    jinsi: { id: "jinsi", title: "《近思录》", callNumber: "B244.74/Z30", location: "总馆 - 流通书库", copiesDesc: "纸本馆藏 2 册 / 实时在架可借 2 册", status: "可借", isBorrowable: true, bibId: "ma9ed44adcd8699c1c919d7fe122b33cf" },
    yulei: { id: "yulei", title: "《朱子语类》", callNumber: "B244.71/L42", location: "特藏室 · 宋明理学专柜", copiesDesc: "纸本馆藏 1 册 / 借出 (建议预约)", status: "借出", isBorrowable: false, bibId: "m910fe206f504321ab8075f4425a6561e" },
    taiji: { id: "taiji", title: "《太极图说解》", callNumber: "B244.25/Z29", location: "总馆 - 流通书库", copiesDesc: "纸本馆藏 1 册 / 实时在架可借 1 册", status: "可借", isBorrowable: true, bibId: "m03a229fed172c6c4457a9d25d0e3472e" },
    ximing: { id: "ximing", title: "《西铭解》", callNumber: "B222/T94：46", location: "六楼古籍特藏室", copiesDesc: "纸本馆藏 1 册 / 借出 (建议预约)", status: "借出", isBorrowable: false, bibId: "m329c4bf8aac402ba94c27628fa60915b" },
    gangmu: { id: "gangmu", title: "《资治通鉴纲目》", callNumber: "K204.3/Z90:4", location: "总馆 - 流通书库", copiesDesc: "纸本馆藏 4 册 / 实时在架可借 4 册", status: "可借", isBorrowable: true, bibId: "m847dd131dfc2f3cd792a696d5fc70bff" },
    shijizhuan: { id: "shijizhuan", title: "《诗集传》", callNumber: "I222.2/Z90", location: "特藏室 · 古籍专柜", copiesDesc: "纸本馆藏 1 册 / 借出 (建议预约)", status: "借出", isBorrowable: false, bibId: "m09f06ea84a2100925179748950beff70" },
    zhouyi: { id: "zhouyi", title: "《周易本义》", callNumber: "B221.5/L30", location: "总馆 - 流通书库", copiesDesc: "纸本馆藏 2 册 / 实时在架可借 2 册", status: "可借", isBorrowable: true, bibId: "m733ba27d4b6949cbdefd37ffe4fd2f80" },
    chuci: { id: "chuci", title: "《楚辞集注》", callNumber: "I222.3/Z90:2", location: "总馆 - 流通书库", copiesDesc: "纸本馆藏 2 册 / 实时在架可借 2 册", status: "可借", isBorrowable: true, bibId: "mc81bc1fef94dd6cdc04a36d4466f66be" },
    tongmeng: { id: "tongmeng", title: "《童蒙须知》", callNumber: "B222/T94：44", location: "六楼古籍特藏室", copiesDesc: "纸本馆藏 1 册 / 借出 (建议预约)", status: "借出", isBorrowable: false, bibId: "me19479abe54bb4b8467c82ec016450aa" },
    xuegui: { id: "xuegui", title: "《白鹿洞书院学规》", callNumber: "TU-092.2/L70:3", location: "总馆 - 流通书库", copiesDesc: "纸本馆藏 1 册 / 实时在架可借 1 册", status: "可借", isBorrowable: true, bibId: "m01a9861554abb51f11ba8d5c015131c8" },
    wuyi_kaoting: { id: "wuyi_kaoting", title: "《第二届考亭论坛专辑》", callNumber: "B244.75/L43:1", location: "特藏室 · 闽北文库", copiesDesc: "纸本馆藏 2 册 / 实时在架可借 2 册", status: "可借", isBorrowable: true, bibId: "m2b6005a499aa4f3f50aa0f01f5adc36f" },
    wuyi_chaosheng: { id: "wuyi_chaosheng", title: "《朝圣朱子》", callNumber: "B244.7/Z46", location: "特藏部 / 闽北地方文献", copiesDesc: "纸本馆藏 6 册 / 实时在架可借 5 册", status: "可借", isBorrowable: true, bibId: "m769fa97c35a89c0a3624980a21003904" },
    wuyi_dongjing: { id: "wuyi_dongjing", title: "《武夷精舍志》", callNumber: "B222/T94:71", location: "六楼古籍特藏室", copiesDesc: "纸本馆藏 1 册 / 现架特藏", status: "借出", isBorrowable: false, bibId: "mfbad133c1b671b185a1e58b0939666e1" },
    wuyi_haiwai: { id: "wuyi_haiwai", title: "《朱子文化在海外》", callNumber: "B244.75/D40", location: "特藏室 · 国际朱子学柜", copiesDesc: "纸本馆藏 2 册 / 实时在架可借 2 册", status: "可借", isBorrowable: true, bibId: "m9750078ba9d212e3b9a8c8ddd7e281f2" },
    wuyi_shici: { id: "wuyi_shici", title: "《朱子的诗和远方》", callNumber: "I207.227.442/Z43", location: "六楼古籍特藏室", copiesDesc: "纸本馆藏 1 册 / 现架阅览", status: "可借", isBorrowable: true, bibId: "m5590f490b8512b928c22c8a630f2f93b" },
    wuyi_fujian: { id: "wuyi_fujian", title: "《福建朱子学》", callNumber: "B244.75/G49:1", location: "特藏室 · 闽北理学专架", copiesDesc: "纸本馆藏 2 册 / 实时在架可借 1 册", status: "可借", isBorrowable: true, bibId: "mcd9b1f2e032950ae0d77ce38a1bb4770" },
    wuyi_century: { id: "wuyi_century", title: "《世纪之交的朱子学》", callNumber: "B244.75/X39:2", location: "特藏室 · 协同创新专柜", copiesDesc: "精装上中下三册 / 实时在架可借 1 册", status: "可借", isBorrowable: true, bibId: "md0bec348de5285f8b72b7bd977276ee9" }
};

window.opacBooksCache = { ...OPAC_BOOKS_REGISTRY };

function matchOpacBookKey(title) {
    if (!title) return "daxue";
    const clean = title.replace(/[《》·\s]/g, "").toLowerCase();
    for (const [k, b] of Object.entries(OPAC_BOOKS_REGISTRY)) {
        const bClean = b.title.replace(/[《》·\s]/g, "").toLowerCase();
        if (clean.includes(bClean) || bClean.includes(clean)) return k;
    }
    if (clean.includes("大学")) return "daxue";
    if (clean.includes("中庸")) return "zhongyong";
    if (clean.includes("论语")) return "lunyu";
    if (clean.includes("孟子")) return "mengzi";
    if (clean.includes("四书")) return "sishu";
    if (clean.includes("语类")) return "yulei";
    if (clean.includes("近思录")) return "jinsi";
    if (clean.includes("太极")) return "taiji";
    if (clean.includes("西铭")) return "ximing";
    if (clean.includes("纲目") || clean.includes("通鉴")) return "gangmu";
    if (clean.includes("诗集传") || clean.includes("诗经")) return "shijizhuan";
    if (clean.includes("周易") || clean.includes("易")) return "zhouyi";
    if (clean.includes("楚辞")) return "chuci";
    if (clean.includes("童蒙") || clean.includes("家训")) return "tongmeng";
    if (clean.includes("白鹿") || clean.includes("学规")) return "xuegui";
    if (clean.includes("考亭") || clean.includes("论坛")) return "wuyi_kaoting";
    if (clean.includes("朝圣")) return "wuyi_chaosheng";
    if (clean.includes("海外")) return "wuyi_haiwai";
    if (clean.includes("诗和远方") || clean.includes("诗词")) return "wuyi_shici";
    if (clean.includes("福建")) return "wuyi_fujian";
    if (clean.includes("世纪")) return "wuyi_century";
    return "daxue";
}

// ========================================================
// 武夷学院逸夫图书馆特色馆藏溯源渲染器（完全对齐茶文化智能体规制）
// ========================================================
function renderLibraryProvenanceBlock(rawContent) {
    if (!rawContent) return "";
    const lines = rawContent.split(/<br\s*\/?>|\n/).map(l => l.trim()).filter(Boolean);
    const items = [];
    let disclaimer = "注：以上资料均为武夷学院逸夫图书馆特色馆藏收录典籍，是否为在架纸质藏书请以 OPAC 实时查询为准。";
    let relatedTopic = "宋明理学特色库 · 检索理学文献题录";
    let relatedBooks = "";

    for (const l of lines) {
        const plain = l.replace(/<[^>]+>/g, "").trim();
        const m = plain.match(/^([0-9]{1,2})\s+(.+)/);
        if (m) {
            items.push({ num: m[1], text: m[2] });
        } else if (plain.startsWith("注：") || plain.startsWith("注:")) {
            disclaimer = plain;
        } else if (plain.startsWith("•") || plain.startsWith("-") || plain.startsWith("*")) {
            relatedTopic = plain.replace(/^[•\-\*\s]+/, "");
        } else if (plain.includes("检索到：") || plain.includes("检索到:")) {
            relatedBooks = plain;
        }
    }

    if (items.length === 0) {
        const titleMatches = Array.from(rawContent.matchAll(/《([^》]+)》/g), m => m[1].trim());
        titleMatches.forEach((t, i) => {
            items.push({ num: String(i + 1), text: `《${t}》 | 来源：武夷学院图书馆宋明理学特色库` });
        });
    }

    const itemRowsHtml = items.map(item => {
        const num = item.num;
        const text = item.text;
        const segments = text.split("|").map(s => s.trim()).filter(Boolean);
        const titlePart = segments[0] || "《考亭理学典籍》";
        const titleMatch = titlePart.match(/《([^》]+)》/);
        const stdTitle = titleMatch ? `《${titleMatch[1]}》` : titlePart;
        const bookKey = matchOpacBookKey(stdTitle);
        const opacEntry = (window.opacBooksCache && window.opacBooksCache[bookKey]) || OPAC_BOOKS_REGISTRY[bookKey] || {};

        let author = "";
        let callNumber = opacEntry.callNumber || "B244.7/1";
        let location = opacEntry.location || "逸夫图书馆六楼特藏室";
        let sourceDb = "武夷学院图书馆宋明理学特色库";
        let bibId = opacEntry.bibId || "";
        let isBorrowable = (opacEntry.status !== "借出");

        segments.slice(1).forEach(seg => {
            if (seg.startsWith("著者：") || seg.startsWith("著者:")) author = seg.replace(/^著者[：:]/, "").trim();
            else if (seg.startsWith("索书号：") || seg.startsWith("索书号:")) callNumber = seg.replace(/^索书号[：:]/, "").trim();
            else if (seg.startsWith("馆藏地点：") || seg.startsWith("馆藏地点:")) location = seg.replace(/^馆藏地点[：:]/, "").trim();
            else if (seg.startsWith("来源：") || seg.startsWith("来源:")) sourceDb = seg.replace(/^来源[：:]/, "").trim();
        });

        const detailUrl = bibId ? `https://wyutsg.wuyiu.edu.cn/space/searchDetailLocal/${bibId}` : "https://wyutsg.wuyiu.edu.cn/space/index";
        const safeTitle = escapeHtml(stdTitle).replace(/'/g, "\\'");
        const safeCall = escapeHtml(callNumber).replace(/'/g, "\\'");
        const statusClass = isBorrowable ? "status-ok" : "status-busy";
        const statusText = isBorrowable ? "🟢 实时在架可借" : "🔴 借出·可预约";

        return `
        <div class="prov-item-row" id="prov-ref-item-${num}">
            <span class="prov-num-circle">${num}</span>
            <div class="prov-item-body">
                <div class="prov-item-line">
                    <strong class="prov-book-title">${escapeHtml(stdTitle)}</strong>
                    ${author ? `<span class="prov-divider">|</span><span class="prov-meta-field">著者：${escapeHtml(author)}</span>` : ""}
                    <span class="prov-divider">|</span>
                    <span class="prov-meta-field">索书号：<code class="prov-meta-callno">${escapeHtml(callNumber)}</code></span>
                    <span class="prov-divider">|</span>
                    <span class="prov-meta-field">馆藏地点：${escapeHtml(location)}</span>
                    <span class="prov-divider">|</span>
                    <span class="prov-meta-source">来源：${escapeHtml(sourceDb)}</span>
                </div>
                <div class="prov-item-actions">
                    <a href="${detailUrl}" target="_blank" rel="noopener noreferrer" class="prov-btn prov-opac-btn" title="直达武夷学院图书馆${escapeHtml(stdTitle)}官方预约系统">
                        🏛️ 直达OPAC实体借阅预约 ➔
                    </a>
                    <button type="button" class="prov-btn prov-read-btn" onclick="window.openFulltextFromProvenance('${bookKey}', '${safeTitle}', '', '', '')" title="在电子阅览器中翻阅全书">
                        📖 翻阅全卷
                    </button>
                    <span class="prov-status-tag ${statusClass}">${statusText}</span>
                </div>
            </div>
        </div>
        `;
    }).join("");

    const opacLinkHtml = `<a href="https://wyutsg.wuyiu.edu.cn/space/index" target="_blank" rel="noopener noreferrer" class="prov-opac-link">OPAC 实时查询</a>`;
    let cleanDisclaimer = escapeHtml(disclaimer).replace(/OPAC\s*查询|OPAC\s*实时查询/g, opacLinkHtml);
    if (!cleanDisclaimer.includes("OPAC")) {
        cleanDisclaimer += `（请以 ${opacLinkHtml} 为准）`;
    }

    const relatedBooksList = Array.from(relatedBooks.matchAll(/《([^》]+)》/g), m => m[1].trim());
    if (relatedBooksList.length === 0) {
        items.forEach(it => {
            const m = it.text.match(/《([^》]+)》/);
            if (m && !relatedBooksList.includes(m[1])) relatedBooksList.push(m[1]);
        });
    }
    const tagsHtml = relatedBooksList.map(bt => {
        const k = matchOpacBookKey(bt);
        const sTitle = `《${escapeHtml(bt).replace(/'/g, "\\'")}》`;
        return `<span class="prov-book-tag" onclick="window.openFulltextFromProvenance('${k}', '${sTitle}', '', '', '')" title="点击阅读《${escapeHtml(bt)}》">《${escapeHtml(bt)}》</span>`;
    }).join("");

    return `
    <div class="prov-library-card">
        <div class="prov-header-tag">【参考资料】</div>
        <div class="prov-items-container">
            ${itemRowsHtml}
        </div>
        <div class="prov-disclaimer-box">
            ${cleanDisclaimer}
        </div>
        <div class="prov-related-section">
            <div class="prov-related-title">相关资源 · 点击直达或扫码打开</div>
            <div class="prov-related-topic">
                <span class="prov-bullet">•</span>
                <span class="prov-topic-name">${escapeHtml(relatedTopic)}</span>
            </div>
            <div class="prov-related-tags">
                <span class="prov-tags-label">检索到：</span>
                ${tagsHtml || '<span class="prov-meta-field">武夷学院自建宋明理学特色馆藏</span>'}
            </div>
        </div>
    </div>
    `;
}

window.scrollToProvenanceRef = function(refNum) {
    const el = document.getElementById(`prov-ref-item-${refNum}`);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        el.classList.add('prov-item-highlight');
        setTimeout(() => el.classList.remove('prov-item-highlight'), 1800);
    }
};

function enrichCitationWithOpac(html) {
    if (!html) return "";

    // 1. 如果包含【参考资料】，按全新武夷学院逸夫图书馆特色馆藏溯源规制渲染
    if (html.includes("【参考资料】")) {
        const parts = html.split(/【参考资料】/);
        const bodyPart = parts[0];
        const provPart = parts.slice(1).join("【参考资料】");
        return bodyPart.trim() + renderLibraryProvenanceBlock(provPart);
    }

    if (!html.includes("【典籍原典出处】") && !html.includes("OPAC")) {
        return html;
    }

    const citationRegex = /(?:<br>|\n|^)\s*📜\s*(?:&lt;strong&gt;|<strong>)?【典籍原典出处】(?:&lt;\/strong&gt;|<\/strong>)?[：:\s]*([\s\S]*?)(?:<br>|\n)+\s*🏛️\s*(?:&lt;strong&gt;|<strong>)?【(?:武夷学院|武夷学院图书馆|武夷学院馆藏).*?OPAC.*?】(?:&lt;\/strong&gt;|<\/strong>)?[：:\s]*([\s\S]*?)(?=(?:<br>\s*<br>|$))/i;

    if (citationRegex.test(html)) {
        html = html.replace(citationRegex, function(match, srcPart, opacPart) {
            const rawSrc = srcPart.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").trim();
            const rawOpac = opacPart.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").trim();

            // 提取所有被引用的典籍书名（支持多本引证逐一展示）
            const titleMatches = Array.from(rawSrc.matchAll(/《([^》]+)》/g), m => m[1].trim());

            if (titleMatches.length > 1) {
                // 多本书籍：一本一本来，逐一呈现独立状态与操作
                const bookCards = titleMatches.map((titleWithChap, idx) => {
                    const bookTitle = `《${titleWithChap}》`;
                    const bookKey = matchOpacBookKey(titleWithChap);
                    const opacEntry = (window.opacBooksCache && window.opacBooksCache[bookKey]) || OPAC_BOOKS_REGISTRY[bookKey] || {};

                    let callNumber = opacEntry.callNumber || "B222.12/Z90：1";
                    let location = opacEntry.location || "逸夫图书馆六楼特藏专区";
                    let bibId = opacEntry.bibId || "";
                    let copiesDesc = opacEntry.copiesDesc || "实时在架可借";
                    let isBorrowable = opacEntry.isBorrowable !== false;
                    if (opacEntry.status === "借出") isBorrowable = false;

                    // 检索 rawOpac 中是否有该书专门的索书号或在架状态
                    const baseName = titleWithChap.split(/[·\s]/)[0].replace(/[《》]/g, "").trim();
                    const opacLines = rawOpac.split(/\n|；|;/).map(l => l.trim()).filter(Boolean);
                    const matchedOpacLine = opacLines.find(line => line.includes(baseName) || (opacEntry.title && line.includes(opacEntry.title.replace(/[《》]/g, ""))));

                    if (matchedOpacLine) {
                        const callMatch = matchedOpacLine.match(/索书号\s*([A-Za-z0-9\.\:\/：\-]+)/);
                        if (callMatch) callNumber = callMatch[1].trim();
                        const bibMatch = matchedOpacLine.match(/藏书编码\s*([a-zA-Z0-9]+)/);
                        if (bibMatch) bibId = bibMatch[1].trim();
                        if (matchedOpacLine.includes("借出")) isBorrowable = false;
                        else if (matchedOpacLine.includes("可借")) isBorrowable = true;
                        const locMatch = matchedOpacLine.match(/^([^索]+?)\s*索书号/);
                        if (locMatch && locMatch[1].trim()) location = locMatch[1].replace(/^[0-9\.\s《》]+/, "").trim();
                    }

                    const statusClass = isBorrowable ? "status-ok" : "status-busy";
                    const statusLabel = isBorrowable ? "🟢 可借 (实时在架)" : "🔴 借出 (建议预约)";
                    const detailUrl = (opacEntry && opacEntry.detailUrl) || (bibId ? `https://wyutsg.wuyiu.edu.cn/space/searchDetailLocal/${bibId}` : "https://wyutsg.wuyiu.edu.cn/space/index");

                    const safeTitle = escapeHtml(bookTitle).replace(/'/g, "\\'");
                    const safeCall = escapeHtml(callNumber).replace(/'/g, "\\'");
                    const safeLoc = escapeHtml(location).replace(/'/g, "\\'");
                    const safeBib = escapeHtml(bibId).replace(/'/g, "\\'");
                    const safeChap = escapeHtml(titleWithChap.includes("·") ? titleWithChap.split("·")[1].trim() : "").replace(/'/g, "\\'");

                    return `
                    <div class="opac-multi-book-item" style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:12px 14px; margin-bottom:10px; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
                        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; gap:8px; flex-wrap:wrap;">
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span style="font-size:11px; background:#e0f2fe; color:#0369a1; padding:2px 8px; border-radius:4px; font-weight:700;">典籍 [${idx + 1}/${titleMatches.length}]</span>
                                <strong style="color:#0f172a; font-size:14px; font-family:var(--font-serif);">${escapeHtml(bookTitle)}</strong>
                            </div>
                            <span class="opac-status-badge ${statusClass}" style="font-size:11px; padding:2px 8px;">${statusLabel}</span>
                        </div>
                        <div class="opac-card-meta-grid" style="margin-bottom:10px;">
                            <div class="opac-meta-item">
                                <span class="meta-label">📌 索书号：</span>
                                <code class="meta-callno">${escapeHtml(callNumber)}</code>
                            </div>
                            <div class="opac-meta-item">
                                <span class="meta-label">📍 馆藏地点：</span>
                                <span class="meta-value">${escapeHtml(location)}</span>
                            </div>
                            <div class="opac-meta-item">
                                <span class="meta-label">📗 馆藏副本：</span>
                                <span class="meta-value">${escapeHtml(copiesDesc)}</span>
                            </div>
                        </div>
                        <div class="opac-card-actions-row">
                            <a href="${detailUrl}" target="_blank" rel="noopener noreferrer" class="opac-action-btn opac-direct-reserve-btn" style="background:linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color:#fff; font-weight:700; border:none; text-decoration:none; padding:7px 15px; border-radius:6px; display:inline-flex; align-items:center; gap:6px; box-shadow:0 2px 6px rgba(2,132,199,0.3); font-size:12.5px;" title="直达武夷学院图书馆${escapeHtml(bookTitle)}官方页面，点击页面内蓝色【预约】按钮即可登录并提交预约">
                                🏛️ 直达武夷学院官方预约系统（对应本书）➔
                            </a>
                            <button type="button" class="opac-action-btn opac-fulltext-btn" style="background:#fff7ed; color:#b45309; border:1px solid #fed7aa; padding:7px 14px; border-radius:6px; font-weight:600; cursor:pointer;" onclick="window.openFulltextFromProvenance('${bookKey}', '${safeTitle}', '', '', '${safeChap}')" title="进入阅览器翻阅全卷并定位章节">
                                📖 翻阅全卷
                            </button>
                            <button type="button" class="opac-action-btn opac-refresh-btn" onclick="window.refreshCitationOpacStatus(this, '${safeTitle}')" style="background:#fff; color:#0f766e; border:1px solid #0f766e; font-size:12px; padding:6px 12px; border-radius:6px; cursor:pointer;" title="强制直连武夷学院OPAC后台获取当前最新借阅在架数据">
                                🔄 实时同步架位
                            </button>
                        </div>
                    </div>
                    `;
                }).join("");

                return `
                <div class="opac-citation-card">
                    <div class="opac-card-header">
                        <div class="opac-card-title-group">
                            <span class="opac-icon">🏛️</span>
                            <span class="opac-card-heading">武夷学院图书馆 · 实时OPAC馆藏与原典溯源（共引证 ${titleMatches.length} 部典籍 · 逐本考据）</span>
                        </div>
                        <span class="opac-status-badge status-ok">📚 逐本查核在架</span>
                    </div>
                    <div class="opac-card-multi-list" style="margin-top:10px;">
                        ${bookCards}
                    </div>
                    <div style="background:#f0fdf4; border:1px solid #86efac; border-radius:6px; padding:10px 14px; margin-top:10px; font-size:12px; color:#166534; line-height:1.65;">
                        <strong>🏛️ 武夷学院图书馆 · 课本专属官方预约指引：</strong><br>
                        ① <strong>精准直达对应课本</strong>：点击上方<strong>【🏛️ 直达武夷学院官方预约系统（对应本书）➔】</strong>按钮，即可直接打开武夷学院智慧图书馆针对该课本的官方专属详情页（含真实索书号与在架副本）。<br>
                        ② <strong>直接进入预约登录</strong>：在打开的图书馆页面左下方，直接点击蓝色<strong>【预约】</strong>按钮，系统将直接唤起武夷学院统一身份认证/借阅证登录界面；读者输入学号登录后，直接完成该课本的在线预约与到馆取书。
                    </div>
                </div>
                `;
            }

            // 单部书籍渲染
            let bookTitle = "";
            if (titleMatches.length === 1) {
                bookTitle = `《${titleMatches[0]}》`;
            } else {
                const titleMatch = rawSrc.match(/《([^》]+)》/);
                if (titleMatch) {
                    bookTitle = `《${titleMatch[1]}》`;
                } else {
                    bookTitle = rawSrc.split("·")[0].trim() || "理学经典文献";
                }
            }

            const bookKey = matchOpacBookKey(bookTitle);
            const opacEntry = (window.opacBooksCache && window.opacBooksCache[bookKey]) || OPAC_BOOKS_REGISTRY[bookKey] || {};

            let callNumber = opacEntry.callNumber || "B222.12/Z90：1";
            let location = opacEntry.location || "逸夫图书馆六楼特藏专区";
            let bibId = opacEntry.bibId || "";
            let copiesDesc = opacEntry.copiesDesc || "实时在架可借";
            let isBorrowable = opacEntry.isBorrowable !== false && !rawOpac.includes("借出");

            const bibMatch = rawOpac.match(/藏书编码\s*([a-zA-Z0-9]+)/);
            if (bibMatch) {
                bibId = bibMatch[1].trim();
            }

            const cleanOpac = rawOpac.replace(/藏书编码\s*[a-zA-Z0-9]+/g, "").trim();

            if (opacEntry && opacEntry.callNumber) {
                callNumber = opacEntry.callNumber;
            } else {
                const callMatch = cleanOpac.match(/索书号\s*([A-Za-z0-9\.\:\/：\-]+)/);
                if (callMatch) callNumber = callMatch[1].trim();
            }

            if (opacEntry && opacEntry.location) {
                location = opacEntry.location;
            } else {
                const locMatch = cleanOpac.match(/^([^索]+?)\s*索书号/);
                if (locMatch && locMatch[1].trim()) location = locMatch[1].trim();
            }

            if (opacEntry && opacEntry.status) {
                isBorrowable = (opacEntry.status === "可借");
            }

            const statusClass = isBorrowable ? "status-ok" : "status-busy";
            const statusLabel = isBorrowable ? "🟢 馆藏状态：可借 (实时在架)" : "🔴 馆藏状态：借出 (建议预约)";

            const detailUrl = (opacEntry && opacEntry.detailUrl) || (bibId ? `https://wyutsg.wuyiu.edu.cn/space/searchDetailLocal/${bibId}` : "https://wyutsg.wuyiu.edu.cn/space/index");

            const safeTitle = escapeHtml(bookTitle).replace(/'/g, "\\'");
            const safeCall = escapeHtml(callNumber).replace(/'/g, "\\'");
            const safeLoc = escapeHtml(location).replace(/'/g, "\\'");
            const safeBib = escapeHtml(bibId).replace(/'/g, "\\'");
            const safeChap = escapeHtml(bookTitle.includes("·") ? bookTitle.split("·")[1].replace(/[《》]/g, "").trim() : "").replace(/'/g, "\\'");

            return `
            <div class="opac-citation-card">
                <div class="opac-card-header">
                    <div class="opac-card-title-group">
                        <span class="opac-icon">🏛️</span>
                        <span class="opac-card-heading">武夷学院图书馆 · 实时OPAC馆藏与原典溯源</span>
                    </div>
                    <span class="opac-status-badge ${statusClass}">${statusLabel}</span>
                </div>
                <div class="opac-card-meta-grid">
                    <div class="opac-meta-item">
                        <span class="meta-label">📜 典籍原典：</span>
                        <span class="meta-value">${escapeHtml(rawSrc)}</span>
                    </div>
                    <div class="opac-meta-item">
                        <span class="meta-label">📌 索书号：</span>
                        <code class="meta-callno">${escapeHtml(callNumber)}</code>
                    </div>
                    <div class="opac-meta-item">
                        <span class="meta-label">📍 馆藏地点：</span>
                        <span class="meta-value">${escapeHtml(location)}</span>
                    </div>
                    <div class="opac-meta-item">
                        <span class="meta-label">📗 馆藏副本：</span>
                        <span class="meta-value">${escapeHtml(copiesDesc)}</span>
                    </div>
                </div>
                <div class="opac-card-actions-row">
                    <a href="${detailUrl}" target="_blank" rel="noopener noreferrer" class="opac-action-btn opac-direct-reserve-btn" style="background:linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color:#fff; font-weight:700; border:none; text-decoration:none; padding:7px 15px; border-radius:6px; display:inline-flex; align-items:center; gap:6px; box-shadow:0 2px 6px rgba(2,132,199,0.3); font-size:12.5px;" title="直达武夷学院图书馆${escapeHtml(bookTitle)}官方页面，点击页面内蓝色【预约】按钮即可登录并提交预约">
                        🏛️ 直达武夷学院官方预约系统（对应本书）➔
                    </a>
                    <button type="button" class="opac-action-btn opac-fulltext-btn" style="background:#fff7ed; color:#b45309; border:1px solid #fed7aa; padding:7px 14px; border-radius:6px; font-weight:600; cursor:pointer;" onclick="window.openFulltextFromProvenance('${bookKey}', '${safeTitle}', '', '', '${safeChap}')" title="进入阅览器翻阅全卷并定位章节">
                        📖 翻阅全卷
                    </button>
                    <button type="button" class="opac-action-btn opac-refresh-btn" onclick="window.refreshCitationOpacStatus(this, '${safeTitle}')" style="background:#fff; color:#0f766e; border:1px solid #0f766e; font-size:12px; padding:6px 12px; border-radius:6px; cursor:pointer;" title="强制直连武夷学院OPAC后台获取当前最新借阅在架数据">
                        🔄 实时同步架位
                    </button>
                </div>
                <div style="background:#f0fdf4; border:1px solid #86efac; border-radius:6px; padding:10px 14px; margin-top:10px; font-size:12px; color:#166534; line-height:1.65;">
                    <strong>🏛️ 武夷学院图书馆 · 课本专属官方预约指引：</strong><br>
                    ① <strong>精准直达对应课本</strong>：点击上方<strong>【🏛️ 直达武夷学院官方预约系统（对应本书）➔】</strong>按钮，即可直接打开武夷学院智慧图书馆针对该课本的官方专属详情页（含真实索书号与在架副本）。<br>
                    ② <strong>直接进入预约登录</strong>：在打开的图书馆页面左下方，直接点击蓝色<strong>【预约】</strong>按钮，系统将直接唤起武夷学院统一身份认证/借阅证登录界面；读者输入学号登录后，直接完成该课本的在线预约与到馆取书。
                </div>
            </div>
            `;
        });
    }

    return html;
}

// 课本专属官方借阅预约直达控制器
let reservationBooklist = [];

function loadReservationBooklist() {
    try {
        localStorage.removeItem("zhuzi_opac_reservations_v1");
        localStorage.removeItem("zhuzi_my_submitted_reservations_v1");
    } catch (e) {}
    reservationBooklist = [];
    updateReservationBadgeCount();
}

function saveReservationBooklist() {
    reservationBooklist = [];
    updateReservationBadgeCount();
}

function updateReservationBadgeCount() {
    document.querySelectorAll(".reservation-badge-count").forEach(el => {
        el.textContent = "0";
        el.style.display = "none";
    });
}

// ========================================================
// 读者账号身份管理系统（预约记录严格随登入读者账号动态切换与隔离）
// ========================================================
let currentReaderAccount = {
    isLoggedIn: false,
    cardId: "",
    name: "",
    readerType: "本科生",
    phone: ""
};

function loadReaderAccount() {
    try {
        const raw = localStorage.getItem("zhuzi_current_reader_v1");
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed.isLoggedIn === "boolean") {
                currentReaderAccount = parsed;
            }
        }
    } catch (e) {
        currentReaderAccount = {
            isLoggedIn: false,
            cardId: "",
            name: "",
            readerType: "本科生",
            phone: ""
        };
    }
}

function saveReaderAccount() {
    try {
        localStorage.setItem("zhuzi_current_reader_v1", JSON.stringify(currentReaderAccount));
    } catch (e) {}
    updateReaderAccountUI();
}

function updateReaderAccountUI() {
    const isAuth = currentReaderAccount.isLoggedIn && !!currentReaderAccount.cardId;

    // 1. 顶部账号栏
    const bar = document.getElementById("res-reader-account-bar");
    if (bar) {
        if (isAuth) {
            bar.style.background = "#f0fdf4";
            bar.style.borderColor = "#86efac";
            bar.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px;">
                    <span style="font-size:20px;">👤</span>
                    <div>
                        <span style="font-size:12px; color:#166534; font-weight:700;">当前登入借阅账号：</span>
                        <strong style="font-size:13.5px; color:#0f172a;">${escapeHtml(currentReaderAccount.name || '读者')}</strong>
                        <span style="font-size:12px; color:#475569;">（学号/证号：<code style="color:#b45309; font-weight:700;">${escapeHtml(currentReaderAccount.cardId)}</code> · <span>${escapeHtml(currentReaderAccount.readerType || '本科生')}</span>）</span>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                    <button type="button" onclick="openReaderAccountSwitcherModal()" style="background:#fff; border:1px solid #0f766e; color:#0f766e; font-size:12px; font-weight:700; padding:4px 10px; border-radius:5px; cursor:pointer;" title="切换其他读者学号以查看不同账号的预约单">
                        🔄 切换读者账号
                    </button>
                    <button type="button" onclick="logoutReaderAccount()" style="background:#fee2e2; border:1px solid #fca5a5; color:#b91c1c; font-size:12px; font-weight:700; padding:4px 8px; border-radius:5px; cursor:pointer;" title="退出当前读者账号并重新锁定借阅功能">
                        登出锁定
                    </button>
                </div>
            `;
        } else {
            bar.style.background = "#fff7ed";
            bar.style.borderColor = "#ea580c";
            bar.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px;">
                    <span style="font-size:20px;">🔐</span>
                    <div>
                        <span style="font-size:13px; color:#9a3412; font-weight:700;">当前尚未登入读者借阅账号</span>
                        <span style="font-size:12px; color:#c2410c; margin-left:6px;">（线下借阅功能须登入读者学号后解锁）</span>
                    </div>
                </div>
                <button type="button" onclick="openReaderAccountSwitcherModal()" style="background:#ea580c; border:none; color:#fff; font-size:12px; font-weight:700; padding:5px 14px; border-radius:5px; cursor:pointer; box-shadow:0 2px 4px rgba(234,88,12,0.3);">
                    🔑 登入读者学号
                </button>
            `;
        }
    }

    // 2. 借阅功能门禁切换（只有登入了账号的人才可以回到这个界面进行下一步的租借）
    const loginGate = document.getElementById("res-borrow-login-gate");
    const unlockedForm = document.getElementById("res-borrow-form-unlocked");
    if (loginGate && unlockedForm) {
        if (isAuth) {
            loginGate.style.display = "none";
            unlockedForm.style.display = "block";
        } else {
            loginGate.style.display = "block";
            unlockedForm.style.display = "none";
        }
    }

    // 3. 填写已解锁表单内的读者信息
    if (isAuth) {
        const uName = document.getElementById("unlocked-account-name");
        const uCard = document.getElementById("unlocked-account-card");
        const uType = document.getElementById("unlocked-account-type");
        if (uName) uName.textContent = currentReaderAccount.name || "读者";
        if (uCard) uCard.textContent = currentReaderAccount.cardId;
        if (uType) uType.textContent = currentReaderAccount.readerType || "本科生";

        const inputName = document.getElementById("res-reader-name");
        const inputCard = document.getElementById("res-card-id");
        const inputType = document.getElementById("res-reader-type");
        const inputPhone = document.getElementById("res-reader-phone");
        if (inputName) inputName.value = currentReaderAccount.name || "";
        if (inputCard) inputCard.value = currentReaderAccount.cardId || "";
        if (inputType && currentReaderAccount.readerType) inputType.value = currentReaderAccount.readerType;
        if (inputPhone) inputPhone.value = currentReaderAccount.phone || "";
    }

    // 4. 更新记录标签与数量（严格按登入账号实时变化）
    const viewingLabel = document.getElementById("records-viewing-account-label");
    if (viewingLabel) {
        if (isAuth) {
            viewingLabel.textContent = `${currentReaderAccount.name || '读者'} (学号: ${currentReaderAccount.cardId})`;
        } else {
            viewingLabel.textContent = "未登入账号 (暂无记录)";
        }
    }

    updateReservationRecordsCount();
}

function openReaderAccountSwitcherModal() {
    loadReaderAccount();
    const modal = document.getElementById("reader-account-modal");
    if (!modal) return;

    const inputCard = document.getElementById("dlg-reader-card-id");
    const inputName = document.getElementById("dlg-reader-name");
    const inputType = document.getElementById("dlg-reader-type");
    const inputPhone = document.getElementById("dlg-reader-phone");

    if (inputCard) inputCard.value = currentReaderAccount.cardId || "";
    if (inputName) inputName.value = currentReaderAccount.name || "";
    if (inputType) inputType.value = currentReaderAccount.readerType || "本科生";
    if (inputPhone) inputPhone.value = currentReaderAccount.phone || "";

    modal.style.display = "flex";
}

function closeReaderAccountSwitcherModal(e) {
    if (e && e.target && e.target.id !== "reader-account-modal" && !e.target.classList.contains("modal-close-btn") && e.target.tagName !== "BUTTON") {
        return;
    }
    const modal = document.getElementById("reader-account-modal");
    if (modal) modal.style.display = "none";
}



function submitReaderAccountLogin(e) {
    if (e) e.preventDefault();
    const cardId = (document.getElementById("dlg-reader-card-id").value || "").trim();
    const name = (document.getElementById("dlg-reader-name").value || "").trim();
    const type = document.getElementById("dlg-reader-type").value;
    const phone = (document.getElementById("dlg-reader-phone").value || "").trim();

    if (!cardId || !name) {
        alert("请输入读者学号与姓名");
        return;
    }

    switchReaderAccount(cardId, name, type, phone);
    closeReaderAccountSwitcherModal();
}

function switchReaderAccount(cardId, name, type, phone) {
    currentReaderAccount = {
        isLoggedIn: true,
        cardId: cardId.trim(),
        name: name ? name.trim() : "读者",
        readerType: type || "本科生",
        phone: phone ? phone.trim() : ""
    };
    saveReaderAccount();
    updateReaderAccountUI();
    renderMyReservationRecords();
    showToast(`已成功登入读者账号：${currentReaderAccount.name}（学号：${currentReaderAccount.cardId}）！借阅功能已解锁`);
}

function logoutReaderAccount() {
    currentReaderAccount = {
        isLoggedIn: false,
        cardId: "",
        name: "",
        readerType: "本科生",
        phone: ""
    };
    saveReaderAccount();
    updateReaderAccountUI();
    renderMyReservationRecords();
    showToast("已退出读者借阅账号，借阅权限已锁定");
}

// 已提交预约记录管理（可随时查看凭据与取消预约）
function loadSubmittedReservations() {
    try {
        const raw = localStorage.getItem("zhuzi_my_submitted_reservations_v1");
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function saveSubmittedReservationsList(list) {
    try {
        localStorage.setItem("zhuzi_my_submitted_reservations_v1", JSON.stringify(list));
    } catch (e) {}
    updateReservationRecordsCount();
}

// 获取当前登入读者名下的所有预约记录（严格按当前读者账号过滤）
function getReservationsForCurrentAccount() {
    const list = loadSubmittedReservations();
    if (!currentReaderAccount.isLoggedIn || !currentReaderAccount.cardId) {
        return [];
    }
    const targetCid = currentReaderAccount.cardId.trim();
    return list.filter(r => {
        const rCid = (r.card_id || r.readerId || "").toString().trim();
        return rCid === targetCid;
    });
}

function updateReservationRecordsCount() {
    const accountList = getReservationsForCurrentAccount();
    const countEl = document.getElementById("res-my-records-count");
    if (countEl) {
        countEl.textContent = accountList.length;
    }
}

async function syncReservationsFromServer() {
    try {
        const res = await fetch("/api/opac/reservations");
        if (res.ok) {
            const data = await res.json();
            if (data.reservations && data.reservations.length > 0) {
                const localList = loadSubmittedReservations();
                const mergedMap = {};
                data.reservations.forEach(r => {
                    const id = r.reservationId || r.reservation_id;
                    if (id) {
                        mergedMap[id] = {
                            reservation_id: id,
                            created_at: r.createdAt || r.created_at,
                            reader_name: r.readerName || r.reader_name,
                            card_id: r.readerId || r.card_id,
                            phone: r.phone,
                            reader_type: r.readerType || r.reader_type || "本科生",
                            pickup_location: r.pickupLocation || r.pickup_location,
                            pickup_date: r.pickupDate || r.pickup_date,
                            valid_until: r.pickupDate ? (r.pickupDate + ' 17:30') : '',
                            notes: r.notes || "",
                            books: r.books || [],
                            status: (r.status === "已取消预约" || r.status === "cancelled") ? "cancelled" : "active"
                        };
                    }
                });
                localList.forEach(r => {
                    if (r.reservation_id && !mergedMap[r.reservation_id]) {
                        mergedMap[r.reservation_id] = r;
                    }
                });
                const mergedList = Object.values(mergedMap);
                localStorage.setItem("zhuzi_my_submitted_reservations_v1", JSON.stringify(mergedList));
                updateReservationRecordsCount();
                if (document.getElementById("res-panel-records") && document.getElementById("res-panel-records").style.display !== "none") {
                    renderMyReservationRecords();
                }
            }
        }
    } catch (e) {
        console.warn("同步服务器预约记录稍缓:", e);
    }
}

function switchReservationTab(tab) {
    const formPanel = document.getElementById("res-panel-form");
    const recordsPanel = document.getElementById("res-panel-records");
    const formTabBtn = document.getElementById("tab-btn-res-form");
    const recordsTabBtn = document.getElementById("tab-btn-res-records");

    if (tab === "records") {
        if (formPanel) formPanel.style.display = "none";
        if (recordsPanel) recordsPanel.style.display = "block";
        if (formTabBtn) {
            formTabBtn.style.color = "#64748b";
            formTabBtn.style.borderBottomColor = "transparent";
            formTabBtn.style.fontWeight = "600";
        }
        if (recordsTabBtn) {
            recordsTabBtn.style.color = "#0f766e";
            recordsTabBtn.style.borderBottomColor = "#0f766e";
            recordsTabBtn.style.fontWeight = "700";
        }
        renderMyReservationRecords();
    } else {
        if (recordsPanel) recordsPanel.style.display = "none";
        if (formPanel) formPanel.style.display = "block";
        if (recordsTabBtn) {
            recordsTabBtn.style.color = "#64748b";
            recordsTabBtn.style.borderBottomColor = "transparent";
            recordsTabBtn.style.fontWeight = "600";
        }
        if (formTabBtn) {
            formTabBtn.style.color = "#0f766e";
            formTabBtn.style.borderBottomColor = "#0f766e";
            formTabBtn.style.fontWeight = "700";
        }
        renderReservationBooksList();
    }
}

// 直达武夷学院图书馆相应课本专属官方预约系统
function directJumpToBookReservation(bookKeyOrTitle, directBibId = null) {
    let bibId = directBibId;
    let title = bookKeyOrTitle || "《大学章句》";
    if (!bibId) {
        const bookKey = matchOpacBookKey(title);
        const b = (window.opacBooksCache && window.opacBooksCache[bookKey]) || OPAC_BOOKS_REGISTRY[bookKey] || {};
        bibId = b.bibId || "m1ac8664b61c03d8a5c8a35571d676d66";
        title = b.title || title;
    }
    const targetUrl = `https://wyutsg.wuyiu.edu.cn/space/searchDetailLocal/${bibId}`;
    window.open(targetUrl, "_blank");
    showToast(`🏛️ 正在为您直达武夷学院图书馆${title}官方专属预约系统...`, 4000);
}
window.directJumpToBookReservation = directJumpToBookReservation;

function quickReserveThisBook(bookKey, bookTitle) {
    const b = (window.opacBooksCache && window.opacBooksCache[bookKey]) || OPAC_BOOKS_REGISTRY[bookKey] || {};
    const bibId = b.bibId || "m1ac8664b61c03d8a5c8a35571d676d66";
    const title = bookTitle || b.title || "《大学章句》";
    directJumpToBookReservation(title, bibId);
}

function quickReserveFromCitation(bookTitle, callNumber, location, bibId) {
    directJumpToBookReservation(bookTitle, bibId);
}

function removeReservationBook(id) {
    reservationBooklist = reservationBooklist.filter(b => b.id !== id && b.callNumber !== id);
    saveReservationBooklist();
    renderReservationBooksList();
    showToast("已从预约书单移除");
}

function clearReservationBooklist() {
    reservationBooklist = [];
    saveReservationBooklist();
    renderReservationBooksList();
    showToast("预约书单已清空");
}

// ========================================================
// 首页特藏馆藏与OPAC预约联动：五大分类书目库 (21部典籍全景)
// ========================================================
const HOME_SHOWCASE_CATEGORIES = {
    sishu: {
        id: "sishu",
        name: "① 四书章句类 · 进学之阶",
        count: "5部",
        books: [
            {
                key: "daxue",
                title: "《大学章句》",
                author: "宋·朱熹 章句 · 传世善本",
                callNumber: "B222.12/Z90：1",
                location: "总馆 - 流通书库",
                tag: "进学第一关",
                status: "馆内在架 · 支持借阅预约",
                bibId: "m1ac8664b61c03d8a5c8a35571d676d66",
                txtFile: "01_大学章句.txt",
                snippet: "大学之道，在明明德，在亲民，在止于至善。",
                chapter: "经一章"
            },
            {
                key: "zhongyong",
                title: "《中庸章句》",
                author: "宋·朱熹 章句 · 宋本中庸",
                callNumber: "B222.12/Z90：1",
                location: "总馆 - 流通书库",
                tag: "性命心法",
                status: "馆内在架 · 支持借阅预约",
                bibId: "m1ac8664b61c03d8a5c8a35571d676d66",
                txtFile: "02_中庸章句.txt",
                snippet: "天命之谓性，率性之谓道，修道之谓教。",
                chapter: "第一章"
            },
            {
                key: "lunyu",
                title: "《论语集注》",
                author: "宋·朱熹 集注 · 考亭讲筵",
                callNumber: "B222.22/Z90",
                location: "特藏室 · 宋明理学专柜",
                tag: "仁义践履",
                status: "特藏专柜 · 实时借出(建议预约)",
                isBusy: true,
                bibId: "m94a1e22d43113bea41afbb3b3fb15046",
                txtFile: "03_论语集注.txt",
                snippet: "学而时习之，不亦说乎？有朋自远方来，不亦乐乎？",
                chapter: "学而第一"
            },
            {
                key: "mengzi",
                title: "《孟子集注》",
                author: "宋·朱熹 集注 · 性善阐微",
                callNumber: "B222.52/Z90/1",
                location: "总馆 - 流通书库",
                tag: "义利辨析",
                status: "馆内在架 · 支持借阅预约",
                bibId: "m51f8f17f5b8a91bfc2c86da36d289bc9",
                txtFile: "04_孟子集注.txt",
                snippet: "仁义礼智根于心，其生色也，睟然见于面。",
                chapter: "梁惠王章句上"
            },
            {
                key: "sishu",
                title: "《四书章句集注》",
                author: "宋·朱熹 著 · 中华书局典藏版",
                callNumber: "B222.12/Z90:10",
                location: "总馆 - 流通书库",
                tag: "理学金梯",
                status: "馆内在架 · 支持借阅预约",
                bibId: "mc7034ec9f084a8217d312a7fbb9d0960",
                txtFile: "05_四书或问.txt",
                snippet: "为己之学，进学在致知，涵养须用敬。",
                chapter: "四书总论"
            }
        ]
    },
    daotong: {
        id: "daotong",
        name: "② 理学道统类 · 性理心法",
        count: "4部",
        books: [
            {
                key: "jinsi",
                title: "《近思录》",
                author: "宋·朱熹、吕祖谦 编 · 北宋五子心传",
                callNumber: "B244.74/Z30",
                location: "二楼社科书库",
                tag: "性理大成",
                status: "馆内在架 · 支持借阅预约",
                bibId: "ma9ed44adcd8699c1c919d7fe122b33cf",
                txtFile: "07_近思录.txt",
                snippet: "学者先须立志，问学进德之基。",
                chapter: "卷之一·道体"
            },
            {
                key: "yulei",
                title: "《朱子语类》",
                author: "宋·黎靖德 编 · 考亭门生实录",
                callNumber: "B244.71/L42",
                location: "特藏室 · 宋明理学专柜",
                tag: "讲筵实录",
                status: "特藏专柜 · 实时借出(建议预约)",
                isBusy: true,
                bibId: "m910fe206f504321ab8075f4425a6561e",
                txtFile: "01_朱子语类.txt",
                snippet: "理气心性探微，未有天地之先，毕竟也只是先有此理。",
                chapter: "卷一·理气上"
            },
            {
                key: "taiji",
                title: "《太极图说解》",
                author: "宋·朱熹 著 · 周敦颐 原著",
                callNumber: "B244.25/Z29",
                location: "总馆 - 流通书库",
                tag: "理气元旨",
                status: "馆内在架 · 支持借阅预约",
                bibId: "m03a229fed172c6c4457a9d25d0e3472e",
                txtFile: "11_太极图说解.txt",
                snippet: "无极而太极。太极动而生阳，动极而静，静而生阴。",
                chapter: "图说本义"
            },
            {
                key: "ximing",
                title: "《西铭解》",
                author: "宋·朱熹 著 · 张载 原著",
                callNumber: "B222/T94：46",
                location: "六楼古籍特藏室",
                tag: "民胞物与",
                status: "特藏专柜 · 实时借出(建议预约)",
                isBusy: true,
                bibId: "m329c4bf8aac402ba94c27628fa60915b",
                txtFile: "12_西铭解.txt",
                snippet: "乾称父，坤称母；予兹藐焉，乃混然中处。民吾同胞，物吾与也。",
                chapter: "西铭解义"
            }
        ]
    },
    jingshi: {
        id: "jingshi",
        name: "③ 经史政理类 · 春秋史鉴",
        count: "3部",
        books: [
            {
                key: "gangmu",
                title: "《资治通鉴纲目》",
                author: "宋·朱熹 著 · 春秋义法史学丰碑",
                callNumber: "K204.3/Z90:4",
                location: "总馆 - 流通书库",
                tag: "史学义旨",
                status: "馆内在架 · 支持借阅预约",
                bibId: "m847dd131dfc2f3cd792a696d5fc70bff",
                txtFile: "13_资治通鉴纲目.txt",
                snippet: "资治通鉴纲目，以纲提领，以目纪实，彰善瘅恶。",
                chapter: "纲目序例"
            },
            {
                key: "shijizhuan",
                title: "《诗集传》",
                author: "宋·朱熹 著 · 经学诗义集大成",
                callNumber: "I222.2/Z90",
                location: "六楼古籍特藏室",
                tag: "经学诗义",
                status: "特藏专柜 · 实时借出(建议预约)",
                isBusy: true,
                bibId: "m09f06ea84a2100925179748950beff70",
                txtFile: "08_诗集传.txt",
                snippet: "关关雎鸠，在河之洲。窈窕淑女，君子好逑。",
                chapter: "国风·周南"
            },
            {
                key: "zhouyi",
                title: "《周易本义》",
                author: "宋·朱熹 著 · 象数义理双融",
                callNumber: "B221.5/L30",
                location: "总馆 - 流通书库",
                tag: "象数义理",
                status: "馆内在架 · 支持借阅预约",
                bibId: "m733ba27d4b6949cbdefd37ffe4fd2f80",
                txtFile: "09_周易本义.txt",
                snippet: "天行健，君子以自强不息。地势坤，君子以厚德载物。",
                chapter: "周易本义·乾卦"
            }
        ]
    },
    wenxue_meng: {
        id: "wenxue_meng",
        name: "④ 骚体蒙学类 · 家风规矩",
        count: "3部",
        books: [
            {
                key: "chuci",
                title: "《楚辞集注》",
                author: "宋·朱熹 著 · 屈宋骚韵忠愤之思",
                callNumber: "I222.3/Z90:2",
                location: "总馆 - 流通书库",
                tag: "文学骚韵",
                status: "馆内在架 · 支持借阅预约",
                bibId: "mc81bc1fef94dd6cdc04a36d4466f66be",
                txtFile: "10_楚辞集注.txt",
                snippet: "帝高阳之苗裔兮，朕皇考曰伯庸。摄提贞于孟陬兮，惟庚寅吾以降。",
                chapter: "离骚经"
            },
            {
                key: "tongmeng",
                title: "《童蒙须知》",
                author: "宋·朱熹 著 · 考亭幼童规训",
                callNumber: "B222/T94：44",
                location: "六楼古籍特藏室",
                tag: "蒙学初阶",
                status: "特藏专柜 · 实时借出(建议预约)",
                isBusy: true,
                bibId: "me19479abe54bb4b8467c82ec016450aa",
                txtFile: "14_童蒙须知.txt",
                snippet: "凡为人子弟，当谨守礼节。衣服饮食、步趋坐立，皆当自守其规。",
                chapter: "衣服冠履"
            },
            {
                key: "xuegui",
                title: "《白鹿洞书院学规》",
                author: "宋·朱熹 著 · 千年学规之祖",
                callNumber: "TU-092.2/L70:3",
                location: "总馆 - 流通书库",
                tag: "书院规条",
                status: "馆内在架 · 支持借阅预约",
                bibId: "m01a9861554abb51f11ba8d5c015131c8",
                txtFile: "15_白鹿洞书院学规.txt",
                snippet: "父子有亲，君臣有义，夫妇有别，长幼有序，朋友有信。五教之目也。",
                chapter: "学规箴戒"
            }
        ]
    },
    wuyi_spec: {
        id: "wuyi_spec",
        name: "🏛️ 武夷学院特色馆 · 闽北文库",
        count: "6部",
        books: [
            {
                key: "wuyi_shici",
                title: "《朱子的诗和远方：武夷山水理学诗歌专著》",
                author: "张建光 著 · 海峡文艺出版社",
                callNumber: "I207.227.442/Z43",
                location: "六楼特藏室（闽北文库）",
                tag: "闽北文献专架",
                status: "馆内在架 · 支持借阅预约",
                bibId: "m5590f490b8512b928c22c8a630f2f93b",
                txtFile: "02_朱子的诗和远方_武夷山水理学诗歌专著.txt",
                snippet: "半亩方塘一鉴开，天光云影共徘徊。问渠那得清如许？为有源头活水来。",
                chapter: "第一章：半亩方塘与源头活水"
            },
            {
                key: "wuyi_chaosheng",
                title: "《朝圣朱子：武夷山五夫故里特色专著》",
                author: "张建光 著 · 特色地方文献",
                callNumber: "B244.7/Z46",
                location: "六楼特藏室（闽北文库）",
                tag: "五夫朱子专柜",
                status: "馆内在架 · 支持借阅预约",
                bibId: "m769fa97c35a89c0a3624980a21003904",
                txtFile: "03_朝圣朱子_武夷山五夫故里特色专著.txt",
                snippet: "紫阳楼前，绿竹青松。五夫故里，文公讲道之始。",
                chapter: "第一章：紫阳楼"
            },
            {
                key: "wuyi_century",
                title: "《世纪之交的朱子学：协同创新文丛》",
                author: "潘飞声、张品端 主编",
                callNumber: "B244.75/X39:2",
                location: "二楼社科书库",
                tag: "社科书库精选",
                status: "馆内在架 · 支持借阅预约",
                bibId: "md0bec348de5285f8b72b7bd977276ee9",
                txtFile: "01_世纪之交的朱子学_朱子文化协同创新文丛.txt",
                snippet: "世纪之交的朱子学研究，考辨精微，会通古今。",
                chapter: "第一章"
            },
            {
                key: "wuyi_fujian",
                title: "《朱子三代与政和：闽北朱氏家风》",
                author: "政和县朱子文化研究会 编",
                callNumber: "B244.75/G49:1",
                location: "六楼特藏室（闽北理学专架）",
                tag: "闽北家风专架",
                status: "馆内在架 · 支持借阅预约",
                bibId: "mcd9b1f2e032950ae0d77ce38a1bb4770",
                txtFile: "06_朱子三代与政和_闽北朱氏家风与历史渊源.txt",
                snippet: "政和朱氏家风，清廉自守，忠孝传家。",
                chapter: "第一章"
            },
            {
                key: "wuyi_kaoting",
                title: "《第二届考亭论坛专辑：理学研讨集》",
                author: "武夷学院朱子学研究中心 编",
                callNumber: "B244.75/L43:1",
                location: "六楼特藏室（闽北文库）",
                tag: "考亭论丛专柜",
                status: "馆内在架 · 支持借阅预约",
                bibId: "m2b6005a499aa4f3f50aa0f01f5adc36f",
                txtFile: "04_第二届考亭论坛专辑_考亭书院理学研讨集.txt",
                snippet: "考亭论坛汇集海内外学者，探求理学新命。",
                chapter: "考亭论坛前言"
            },
            {
                key: "wuyi_haiwai",
                title: "《朱子文化在海外：国际传播与影响》",
                author: "武夷学院朱子学研究中心 编",
                callNumber: "B244.75/D40",
                location: "六楼特藏室（国际朱子学柜）",
                tag: "国际传播专架",
                status: "馆内在架 · 支持借阅预约",
                bibId: "m9750078ba9d212e3b9a8c8ddd7e281f2",
                txtFile: "05_朱子文化在海外_武夷学院朱子学研究中心.txt",
                snippet: "朱子之学，东渐日本朝鲜，远播欧美，润物无声。",
                chapter: "序言"
            }
        ]
    }
};

function getCategoryForBookKey(bookKey) {
    if (!bookKey) return "sishu";
    for (const [catId, cat] of Object.entries(HOME_SHOWCASE_CATEGORIES)) {
        if (cat.books.some(b => b.key === bookKey)) {
            return catId;
        }
    }
    return "sishu";
}

let currentHomeShowcaseCategory = "sishu";

function switchHomeShowcaseCategory(catId, btn) {
    currentHomeShowcaseCategory = catId;
    const pillsContainer = document.getElementById("home-showcase-cat-pills");
    if (pillsContainer) {
        pillsContainer.querySelectorAll(".home-cat-pill").forEach(p => p.classList.remove("active"));
    }
    if (btn) {
        btn.classList.add("active");
    } else if (pillsContainer) {
        const targetBtn = pillsContainer.querySelector(`[onclick*="'${catId}'"]`);
        if (targetBtn) targetBtn.classList.add("active");
    }
    renderHomeShowcaseBooks(catId);
}

function renderHomeShowcaseBooks(catId = "sishu") {
    const grid = document.getElementById("home-showcase-books-grid");
    if (!grid) return;
    const cat = (window.HOME_SHOWCASE_CATEGORIES && window.HOME_SHOWCASE_CATEGORIES[catId]) || (HOME_SHOWCASE_CATEGORIES[catId] || HOME_SHOWCASE_CATEGORIES.sishu);
    const books = cat.books || [];

    grid.innerHTML = books.map(b => {
        const isBusy = !b.isAvailable || (b.borrowStatus && b.borrowStatus.includes("借出")) || (b.status && b.status.includes("借出"));
        const pillClass = isBusy ? "borrowed" : "available";
        const borrowText = b.borrowStatus || (isBusy ? "🔴 租借情况：特藏借出【支持线上预约】" : "🟢 租借情况：在架可借【实时在架】");
        const safeTitle = escapeHtml(b.title).replace(/'/g, "\\'");
        const safeSnippet = escapeHtml(b.snippet || "").replace(/'/g, "\\'");
        const safeFile = escapeHtml(b.txtFile || "").replace(/'/g, "\\'");
        const safeChap = escapeHtml(b.chapter || "").replace(/'/g, "\\'");

        return `
            <div class="lib-book-card">
                <div class="lbc-tag">${escapeHtml(b.tag || "典籍")}</div>
                <div class="lbc-title">${escapeHtml(b.title)}</div>
                <div class="lbc-author">${escapeHtml(b.author)}</div>
                <div class="lbc-callno">索书号：<code>${escapeHtml(b.callNumber)}</code></div>
                <div class="lbc-loc">馆藏：${escapeHtml(b.location)}</div>
                <div class="lbc-borrow-row">
                    <span class="borrow-status-pill ${pillClass}">${escapeHtml(borrowText)}</span>
                </div>
                <div class="lbc-actions">
                    <button type="button" class="lbc-btn read" onclick="openFulltextFromProvenance('${b.key}', '${safeTitle}', '${safeSnippet}', '${safeFile}', '${safeChap}')">📖 翻阅电子版</button>
                    <button type="button" class="lbc-btn reserve" onclick="openReservationModal('${b.key}')">🔖 OPAC预约借阅</button>
                </div>
            </div>
        `;
    }).join("");
}

let currentOpacModalCategory = "sishu";

function switchOpacModalCategory(catId, btn, highlightKey = null) {
    currentOpacModalCategory = catId;
    const pills = document.getElementById("opac-modal-cat-pills");
    if (pills) {
        pills.querySelectorAll(".opac-cat-tab").forEach(tab => tab.classList.remove("active"));
        if (btn) {
            btn.classList.add("active");
        } else {
            const target = pills.querySelector(`[data-cat="${catId}"]`);
            if (target) target.classList.add("active");
        }
    }
    renderReservationBooksList(catId, highlightKey);
}

function openReservationModal(activeBookKey = null) {
    loadReaderAccount();
    loadReservationBooklist();
    syncReservationsFromServer();
    updateReaderAccountUI();
    const modal = document.getElementById("reservation-modal");
    if (!modal) return;

    let targetCategory = "sishu";
    if (activeBookKey) {
        targetCategory = getCategoryForBookKey(activeBookKey);
    } else {
        targetCategory = currentOpacModalCategory || "sishu";
    }

    // 默认展示填写表单面板并渲染对应分类
    switchReservationTab("form");
    switchOpacModalCategory(targetCategory, null, activeBookKey);

    const dateInput = document.getElementById("res-pickup-date");
    if (dateInput && !dateInput.value) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateInput.value = tomorrow.toISOString().split("T")[0];
    }

    const voucherCard = document.getElementById("res-voucher-card");
    if (voucherCard) voucherCard.style.display = "none";
    const submitStatus = document.getElementById("res-submit-status");
    if (submitStatus) submitStatus.textContent = "";

    modal.classList.add("active");

    // 若有高亮书籍，滚动平滑聚焦
    if (activeBookKey) {
        setTimeout(() => {
            const highlightedEl = document.querySelector("#res-books-container .res-book-highlighted");
            if (highlightedEl) {
                highlightedEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        }, 150);
    }
}

function closeReservationModal(e) {
    if (e && e.target && e.target.id !== "reservation-modal" && !e.target.classList.contains("modal-close-btn")) {
        return;
    }
    const modal = document.getElementById("reservation-modal");
    if (modal) modal.classList.remove("active");
}

function renderReservationBooksList(targetCategory = null, highlightKey = null) {
    const container = document.getElementById("res-books-container");
    if (!container) return;

    const catId = targetCategory || currentOpacModalCategory || "sishu";
    const cat = (window.HOME_SHOWCASE_CATEGORIES && window.HOME_SHOWCASE_CATEGORIES[catId]) || (HOME_SHOWCASE_CATEGORIES[catId] || HOME_SHOWCASE_CATEGORIES.sishu);
    const books = cat.books || [];

    container.innerHTML = `
        <div style="padding:10px 12px; background:rgba(255,255,255,0.7); border-radius:6px; border:1px solid #e2e8f0;">
            <div style="font-size:12px; color:#64748b; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
                <span>💡 <strong>${escapeHtml(cat.name)}</strong>【共 ${books.length} 部典籍，点击可直接直达武夷学院图书馆该课本官方专属预约界面】：</span>
                <span style="font-size:11px; background:#e0f2fe; color:#0369a1; padding:2px 8px; border-radius:4px; font-weight:700;">Space v4.2.29 直通</span>
            </div>
            <div style="display:flex; flex-direction:column; gap:8px;">
                ${books.map(b => {
                    const isHighlighted = (highlightKey && highlightKey === b.key);
                    const isBusy = !b.isAvailable || (b.borrowStatus && b.borrowStatus.includes("借出")) || (b.status && b.status.includes("借出"));
                    const pillClass = isBusy ? "borrowed" : "available";
                    const borrowText = b.borrowStatus || (isBusy ? "🔴 租借情况：特藏借出【支持线上预约】" : "🟢 租借情况：在架可借【实时在架】");
                    const highlightClass = isHighlighted ? "res-book-highlighted" : "";
                    const highlightBorder = isHighlighted ? "border:2px solid #0284c7; background:#f0f9ff; box-shadow:0 0 0 3px rgba(2,132,199,0.15);" : "border:1px solid #e2e8f0; background:#f8fafc;";
                    const directUrl = `https://wyutsg.wuyiu.edu.cn/space/searchDetailLocal/${b.bibId}`;
                    const safeTitle = escapeHtml(b.title).replace(/'/g, "\\'");
                    const safeSnippet = escapeHtml(b.snippet || "").replace(/'/g, "\\'");
                    const safeFile = escapeHtml(b.txtFile || "").replace(/'/g, "\\'");
                    const safeChap = escapeHtml(b.chapter || "").replace(/'/g, "\\'");

                    return `
                        <div class="res-category-book-item ${highlightClass}" style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border-radius:6px; ${highlightBorder} transition:all 0.2s; flex-wrap:wrap; gap:8px;">
                            <div style="display:flex; flex-direction:column; gap:4px; flex:1; min-width:240px;">
                                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                                    <strong style="font-size:13.5px; color:#0f172a; font-family:var(--font-serif);">${escapeHtml(b.title)}</strong>
                                    <span class="borrow-status-pill ${pillClass}">${escapeHtml(borrowText)}</span>
                                    ${isHighlighted ? `<span style="font-size:11px; background:#0284c7; color:#fff; padding:1px 6px; border-radius:3px; font-weight:700;">★ 当前选定课本</span>` : ''}
                                </div>
                                <div style="font-size:11.5px; color:#64748b; display:flex; gap:12px; flex-wrap:wrap;">
                                    <span>索书号：<code style="color:#b45309; font-weight:700;">${escapeHtml(b.callNumber)}</code></span>
                                    <span>馆藏：${escapeHtml(b.location)}</span>
                                    <span>著者：${escapeHtml(b.author)}</span>
                                </div>
                            </div>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <button type="button" onclick="openFulltextFromProvenance('${b.key}', '${safeTitle}', '${safeSnippet}', '${safeFile}', '${safeChap}')" style="background:#fff; color:#475569; border:1px solid #cbd5e1; font-size:11.5px; font-weight:600; padding:5px 10px; border-radius:5px; cursor:pointer;" title="在电子阅览器中翻阅此典籍全文">
                                    📖 翻阅
                                </button>
                                <a href="${directUrl}" target="_blank" rel="noopener noreferrer" style="background:linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color:#fff; text-decoration:none; padding:6px 14px; border-radius:5px; font-size:12px; font-weight:700; display:inline-flex; align-items:center; gap:4px; box-shadow:0 2px 4px rgba(2,132,199,0.3);" title="直达武夷学院图书馆${escapeHtml(b.title)}页面，点击页面内蓝色【预约】按钮即可登录学号并提交预约">
                                    🏛️ 直达该课本官方预约 ➔
                                </a>
                            </div>
                        </div>
                    `;
                }).join("")}
            </div>
        </div>
    `;
}

function renderMyReservationRecords() {
    const container = document.getElementById("res-my-records-container");
    if (!container) return;

    renderKnownAccountsChips();

    if (!currentReaderAccount.isLoggedIn || !currentReaderAccount.cardId) {
        container.innerHTML = `
            <div style="padding:42px 20px; text-align:center; color:#64748b; font-size:13px; background:#fff; border-radius:12px; border:1px solid #e2e8f0; box-shadow:0 4px 14px rgba(0,0,0,0.03);">
                <div style="width:60px; height:60px; background:#fff7ed; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:28px; margin-bottom:14px; border:1.5px solid #fed7aa;">
                    🔐
                </div>
                <h3 style="margin:0 0 10px; font-size:16.5px; font-weight:700; color:#9a3412;">
                    未登入借阅账号 · 暂无法查看预约记录
                </h3>
                <p style="color:#c2410c; font-size:13px; max-width:460px; margin:0 auto 22px; line-height:1.7;">
                    典籍借阅预约凭据与逸夫图书馆架位锁定严格<strong>根据登入的读者账号专属存储与隔离</strong>。<strong>只有登入了账号的读者，方可回到这个界面查阅名下的预约记录与凭据。</strong>
                </p>
                <div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
                    <a href="https://wyutsg.wuyiu.edu.cn/space/login" target="_blank" rel="noopener noreferrer" style="display:inline-flex; align-items:center; gap:6px; background:#ea580c; color:#fff; font-size:13px; font-weight:700; padding:10px 22px; border-radius:6px; text-decoration:none; box-shadow:0 2px 5px rgba(234,88,12,0.3);">
                        <span>🌐 前往图书馆书目检索系统登入 ➔</span>
                    </a>
                    <button type="button" onclick="openReaderAccountSwitcherModal()" class="action-pill-btn" style="display:inline-flex; align-items:center; gap:6px; background:#0f766e; color:#fff; font-size:13px; font-weight:700; padding:10px 22px; border:none; border-radius:6px; cursor:pointer; box-shadow:0 2px 5px rgba(15,118,110,0.3);">
                        <span>👤 验证读者账号并回到此界面 ➔</span>
                    </button>
                </div>
            </div>
        `;
        return;
    }

    const list = getReservationsForCurrentAccount();
    if (!list || list.length === 0) {
        container.innerHTML = `
            <div style="padding:32px 16px; text-align:center; color:#94a3b8; font-size:13px; background:#fff; border-radius:8px; border:1px dashed #cbd5e1;">
                <div style="font-size:36px; margin-bottom:8px;">📭</div>
                <strong style="color:#0f172a; font-size:14px; display:block; margin-bottom:4px;">读者账号【${escapeHtml(currentReaderAccount.cardId)} · ${escapeHtml(currentReaderAccount.name)}】暂无预约记录</strong>
                在预约表单提交后，该学号名下的所有线下取书凭据与特藏室架位锁定信息将实时保存在此，随时可点击取消。
            </div>
        `;
        return;
    }

    container.innerHTML = list.map((item, idx) => {
        const isCancelled = item.status === "cancelled" || item.status === "已取消预约";
        const statusBadge = isCancelled 
            ? `<span style="background:#fee2e2; color:#b91c1c; font-size:11px; padding:2px 8px; border-radius:4px; font-weight:700;">⚪ 已取消预约 (架位已释放)</span>`
            : `<span style="background:#dcfce7; color:#15803d; font-size:11px; padding:2px 8px; border-radius:4px; font-weight:700;">🟢 架位已锁定待取</span>`;

        const booksHtml = (item.books || []).map(b => `
            <div style="font-size:12px; color:#334155; margin-top:3px; background:#f8fafc; padding:4px 8px; border-radius:4px; border:1px solid #e2e8f0;">
                📖 <strong>${escapeHtml(b.title)}</strong> · 索书号：<code style="color:#b45309; font-weight:700;">${escapeHtml(b.callNumber)}</code> · 馆藏：${escapeHtml(b.location)}
            </div>
        `).join("");

        return `
            <div class="my-res-item-card" style="background:#ffffff; border:1px solid ${isCancelled ? '#e2e8f0' : '#bbf7d0'}; border-radius:8px; padding:12px 14px; opacity:${isCancelled ? '0.75' : '1'}; box-shadow:0 1px 3px rgba(0,0,0,0.04);">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; flex-wrap:gap; gap:6px;">
                    <div>
                        <strong style="color:#0f172a; font-size:13.5px; font-family:monospace;">${escapeHtml(item.reservation_id)}</strong>
                        <span style="font-size:11px; color:#64748b; margin-left:8px;">提交于 ${escapeHtml(item.created_at || "")}</span>
                    </div>
                    ${statusBadge}
                </div>
                <div style="font-size:12.5px; color:#475569; line-height:1.6; margin-bottom:8px;">
                    <div>👤 <strong>读者：</strong>${escapeHtml(item.reader_name)}（证号：${escapeHtml(item.card_id)} · ${escapeHtml(item.reader_type || "本科生")}） · 📞 ${escapeHtml(item.phone)}</div>
                    <div>📍 <strong>取书场馆：</strong><span style="color:#b45309; font-weight:700;">${escapeHtml(item.pickup_location)}</span></div>
                    <div>📅 <strong>预定取书：</strong>${escapeHtml(item.pickup_date)}（架位锁定保留至 ${escapeHtml(item.valid_until || (item.pickup_date + ' 17:30'))}）</div>
                </div>
                <div style="margin-top:6px; margin-bottom:8px;">
                    <div style="font-size:12px; font-weight:700; color:#334155; margin-bottom:3px;">📚 预约借阅典籍清单：</div>
                    ${booksHtml}
                </div>
                ${!isCancelled ? `
                <div style="display:flex; justify-content:flex-end; gap:8px; border-top:1px dashed #e2e8f0; padding-top:8px; margin-top:8px;">
                    <button type="button" onclick="cancelReservation('${escapeHtml(item.reservation_id)}')" style="background:#fee2e2; color:#b91c1c; border:1px solid #fca5a5; padding:4px 12px; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer;" title="随时取消预约，释放架位">
                        ❌ 随时取消此预约
                    </button>
                </div>
                ` : ''}
            </div>
        `;
    }).join("");
}

function renderKnownAccountsChips() {
    // 已按读者规程移除所有模拟测试账号标签
}

async function cancelReservation(reservationId) {
    if (!reservationId) return;
    if (!confirm(`确认取消预约单【${reservationId}】吗？取消后逸夫图书馆特藏室架位将即刻释放给其他师生。`)) {
        return;
    }

    try {
        const res = await fetch("/api/opac/cancel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reservation_id: reservationId })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            const list = loadSubmittedReservations();
            const idx = list.findIndex(r => r.reservation_id === reservationId);
            if (idx !== -1) {
                list[idx].status = "cancelled";
                saveSubmittedReservationsList(list);
            }
            renderMyReservationRecords();
            updateReservationRecordsCount();
            showToast(`已成功取消预约【${reservationId}】，特藏架位已实时释放！`);
        } else {
            alert(data.detail || "取消预约未成功，请稍后再试");
        }
    } catch (err) {
        const list = loadSubmittedReservations();
        const idx = list.findIndex(r => r.reservation_id === reservationId);
        if (idx !== -1) {
            list[idx].status = "cancelled";
            saveSubmittedReservationsList(list);
        }
        renderMyReservationRecords();
        updateReservationRecordsCount();
        showToast(`已在本地标记取消预约【${reservationId}】`);
    }
}

async function submitReservationForm(e) {
    e.preventDefault();
    if (!currentReaderAccount.isLoggedIn || !currentReaderAccount.cardId) {
        alert("借阅预约权限未解锁：请先登入武夷学院读者账号（学号/借书证号）！");
        return;
    }

    if (reservationBooklist.length === 0) {
        alert("请先添加至少一部典籍至预约书单！");
        return;
    }

    const loginConfirmed = document.getElementById("res-login-confirmed");
    if (loginConfirmed && !loginConfirmed.checked) {
        alert("请先知悉并登入【武夷学院图书馆书目检索系统 (https://wyutsg.wuyiu.edu.cn/space/login)】，勾选确认后方可进行租借预约。");
        return;
    }

    const name = (currentReaderAccount.name || document.getElementById("res-reader-name").value).trim();
    const cardId = (currentReaderAccount.cardId || document.getElementById("res-card-id").value).trim();
    const readerType = document.getElementById("res-reader-type").value || currentReaderAccount.readerType || "本科生";
    const phone = document.getElementById("res-reader-phone").value.trim();
    const pickupLoc = document.getElementById("res-pickup-loc").value;
    const pickupDate = document.getElementById("res-pickup-date").value;
    const notes = document.getElementById("res-notes").value.trim();

    const statusEl = document.getElementById("res-submit-status");
    const submitBtn = document.getElementById("res-submit-btn");

    if (statusEl) {
        statusEl.textContent = "正在向武夷学院图书馆 OPAC 提交预约并锁定架位...";
        statusEl.style.color = "#0f766e";
    }
    if (submitBtn) submitBtn.disabled = true;

    try {
        const payload = {
            reader_name: name,
            card_id: cardId,
            phone: phone,
            reader_type: readerType,
            pickup_location: pickupLoc,
            pickup_date: pickupDate,
            notes: notes,
            books: reservationBooklist
        };

        const res = await fetch("/api/opac/reserve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok && data.success) {
            if (statusEl) statusEl.textContent = "";
            const voucherCard = document.getElementById("res-voucher-card");
            const voucherCode = document.getElementById("voucher-code");
            const voucherContent = document.getElementById("voucher-content");

            if (voucherCode) voucherCode.textContent = data.reservation_id;
            if (voucherContent) {
                const bookItemsHtml = reservationBooklist.map((b, idx) => `
                    <div style="background:#fff; border:1px solid #fed7aa; padding:6px 10px; border-radius:4px; margin-top:4px;">
                        <strong>[典籍 ${idx + 1}] ${escapeHtml(b.title)}</strong><br>
                        索书号：<code style="font-weight:700; color:#b45309;">${escapeHtml(b.callNumber)}</code> · 馆藏：${escapeHtml(b.location)}
                    </div>
                `).join("");

                voucherContent.innerHTML = `
                    <div style="margin-bottom:8px;">
                        👤 <strong>预约读者：</strong>${escapeHtml(name)}（证号：${escapeHtml(cardId)} · ${escapeHtml(readerType)}）<br>
                        📞 <strong>联系方式：</strong>${escapeHtml(phone)}<br>
                        📍 <strong>取书场馆：</strong><span style="color:#b45309; font-weight:700;">${escapeHtml(pickupLoc)}</span><br>
                        📅 <strong>预定取书：</strong>${escapeHtml(pickupDate)}（架位锁定保留至 ${escapeHtml(data.valid_until || (pickupDate + ' 17:30'))}）
                    </div>
                    <div style="margin-top:6px;">
                        <strong>📚 本次预约锁定典籍：</strong>
                        ${bookItemsHtml}
                    </div>
                    <div style="margin-top:10px; font-size:11.5px; color:#78350f; background:#fef3c7; padding:6px 10px; border-radius:4px;">
                        💡 <strong>到馆指引：</strong>请在预定日期凭校园卡或出示本预约单号（<strong>${escapeHtml(data.reservation_id)}</strong>）前往逸夫图书馆取书处直接办理借阅手续。
                    </div>
                `;
            }

            // 保存到提交记录数据库，以便随时查看凭据与取消预约
            const record = {
                reservation_id: data.reservation_id,
                created_at: new Date().toLocaleString(),
                reader_name: name,
                card_id: cardId,
                phone: phone,
                reader_type: readerType,
                pickup_location: pickupLoc,
                pickup_date: pickupDate,
                valid_until: data.valid_until || (pickupDate + ' 17:30'),
                notes: notes,
                books: [...reservationBooklist],
                status: "active"
            };
            const submittedList = loadSubmittedReservations();
            submittedList.unshift(record);
            saveSubmittedReservationsList(submittedList);

            // 自动同步并绑定为当前登入读者账号
            currentReaderAccount = {
                isLoggedIn: true,
                cardId: cardId,
                name: name,
                readerType: readerType,
                phone: phone
            };
            saveReaderAccount();

            updateReservationRecordsCount();

            if (voucherCard) voucherCard.style.display = "block";
            showToast("🎉 线下典籍借阅预约单提交成功！已为您锁定架位");
            clearReservationBooklist();
        } else {
            if (statusEl) {
                statusEl.textContent = data.detail || "预约提交未完成，请检查输入";
                statusEl.style.color = "#dc2626";
            }
        }
    } catch (err) {
        if (statusEl) {
            statusEl.textContent = "网络通讯稍阻，请稍后重试";
            statusEl.style.color = "#dc2626";
        }
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

function printReservationVoucher() {
    window.print();
}

// 实时直连武夷学院图书馆 OPAC 同步引证卡片架位状态
async function refreshCitationOpacStatus(btn, bookTitle) {
    if (!btn || !bookTitle) return;
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = "🔄 正在直连后台...";

    try {
        const res = await fetch(`/api/opac/status?book_title=${encodeURIComponent(bookTitle)}&force=true`);
        if (!res.ok) throw new Error("获取OPAC状态失败");
        const data = await res.json();

        // 查找最近的卡片容器（支持单书或多书卡片）
        const card = btn.closest(".opac-multi-book-item") || btn.closest(".opac-citation-card");
        if (card) {
            const badge = card.querySelector(".opac-status-badge");
            if (badge) {
                const isAvail = (data.status === "可借");
                badge.style.background = isAvail ? "#dcfce7" : "#fee2e2";
                badge.style.color = isAvail ? "#15803d" : "#b91c1c";
                badge.style.borderColor = isAvail ? "#86efac" : "#fca5a5";
                badge.textContent = isAvail ? "🟢 可借 (实时在架)" : "🔴 借出 (建议预约)";
            }

            card.querySelectorAll(".opac-meta-item").forEach(item => {
                const label = item.querySelector(".meta-label");
                if (!label) return;
                const txt = label.textContent || "";
                if (txt.includes("索书号")) {
                    const c = item.querySelector(".meta-callno") || item.querySelector("code");
                    if (c && data.callNumber) c.textContent = data.callNumber;
                } else if (txt.includes("馆藏地点")) {
                    const v = item.querySelector(".meta-value");
                    if (v && data.location) v.textContent = data.location;
                } else if (txt.includes("馆藏副本")) {
                    const v = item.querySelector(".meta-value");
                    if (v && (data.availableCopies !== undefined || data.totalCopies !== undefined)) {
                        v.textContent = `在馆 ${data.availableCopies || 0} 册 / 共 ${data.totalCopies || 1} 册 (实时)`;
                    }
                }
            });
        }

        // 更新本地 registry 缓存
        const key = matchOpacBookKey(bookTitle);
        if (OPAC_BOOKS_REGISTRY[key]) {
            OPAC_BOOKS_REGISTRY[key].status = data.status;
            if (data.callNumber) OPAC_BOOKS_REGISTRY[key].callNumber = data.callNumber;
            if (data.location) OPAC_BOOKS_REGISTRY[key].location = data.location;
        }

        showToast(`已成功同步【${bookTitle}】武夷学院后台实时状态：${data.status}！`);
    } catch (err) {
        console.error("实时同步OPAC失败:", err);
        showToast("实时直连学校OPAC稍有网络延迟，请稍后再试");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// 实时向学校后台刷新当前线下预约书单中所有典籍的在架借阅状态
async function refreshReservationListLiveStatus() {
    loadReservationBooklist();
    if (!reservationBooklist || reservationBooklist.length === 0) {
        showToast("预约书单当前为空，请先添加典籍");
        return;
    }

    const indicator = document.getElementById("res-live-sync-indicator");
    if (indicator) {
        indicator.textContent = "⚡ 正在同步学校OPAC...";
        indicator.style.background = "#fef3c7";
        indicator.style.color = "#b45309";
    }

    try {
        const titles = reservationBooklist.map(b => b.title);
        const res = await fetch("/api/opac/batch-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ titles: titles, force: true })
        });
        if (!res.ok) throw new Error("批量获取状态失败");
        const data = await res.json();
        const results = data.results || {};

        let updatedCount = 0;
        reservationBooklist.forEach(b => {
            const live = results[b.title];
            if (live) {
                b.status = live.status || b.status;
                if (live.callNumber) b.callNumber = live.callNumber;
                if (live.location) b.location = live.location;
                if (live.bibId) b.bibId = live.bibId;
                updatedCount++;
            }
        });

        saveReservationBooklist();
        renderReservationBooksList();

        const timeStr = new Date().toLocaleTimeString();
        if (indicator) {
            indicator.textContent = `⚡ 实时后台直连 (已同步 ${timeStr})`;
            indicator.style.background = "#dcfce7";
            indicator.style.color = "#15803d";
        }
        showToast(`已成功向武夷学院 OPAC 实时同步 ${updatedCount} 部典籍最新在架数据！`);
    } catch (err) {
        console.error("刷新预约书单实时状态失败:", err);
        if (indicator) {
            indicator.textContent = "⚡ 实时后台直连";
            indicator.style.background = "#dcfce7";
            indicator.style.color = "#15803d";
        }
        showToast("与学校OPAC直连稍有延迟，已保持当前状态");
    }
}

async function preloadOpacBooks() {
    try {
        const res = await fetch("/api/opac/books");
        if (res.ok) {
            window.opacBooksCache = await res.json();
        }
    } catch (e) {
        console.warn("OPAC预加载稍缓:", e);
    }
}


// 雅致吐司提示
function showToast(msg) {
    let toast = document.getElementById("app-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "app-toast";
        toast.style.cssText = `
            position: fixed;
            top: 24px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(30, 41, 59, 0.9);
            color: #ffffff;
            padding: 8px 18px;
            border-radius: 20px;
            font-size: 13px;
            font-family: var(--font-serif);
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            z-index: 9999;
            transition: opacity 0.3s, transform 0.3s;
            pointer-events: none;
            letter-spacing: 0.5px;
        `;
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(-50%) translateY(-8px)";
    }, 2400);
}

// ========================================================
// 模块：考亭尺牍 · 门生托付想法与朱子草书尺牍墨宝
// ========================================================
let lastLetterReplyText = "";
let lastLetterOriginalText = "";
let lastLetterDate = "";
let lastLetterSeal = "";

function quickFillLetterIdea(themeKey) {
    const input = document.getElementById("letter-content-input");
    if (!input) return;
    const presets = {
        "倾慕心仪佳人": "我喜欢上了一位温婉贤淑的姑娘，想写一封合乎宋代文人雅正礼仪、意境高古优美的情简，向她真诚倾诉爱慕心意与白首同心之期。",
        "勉励同窗立志": "同窗好友近来读书有些懈怠迷茫，我想写一封信勉励他重新立下高远志向，踏实治学，循序渐进，莫负大好光阴。",
        "自励修身戒急戒躁": "自己最近遇事容易急躁浮动，我想写一封信告诫并警策自己：收敛身心，主敬涵养，慎独存省，戒急戒躁。",
        "感恩师长教诲": "回忆求学求道之路上师长如春风化雨般的关怀与提点，我想写一封信表达深切感恩，并表明知行相须、踏实向学的决心。",
        "探讨知行并进": "平日研读典籍时，常觉知与行不易兼顾，我想写一封信与师友探讨：在实际应事接物之中，如何切实做到知之真切、行之笃实？"
    };
    if (presets[themeKey]) {
        input.value = presets[themeKey];
        input.focus();
        showToast(`已填入寄语灵感：${themeKey}`);
    }
}

function openLetterModal() {
    stopCurrentVoice(true);
    const modal = document.getElementById("letter-modal");
    if (!modal) return;
    modal.classList.add("active");
    const input = document.getElementById("letter-content-input");
    if (input) input.focus();
}

function closeLetterModal(e) {
    if (e && e.target && e.target !== document.getElementById("letter-modal")) return;
    const modal = document.getElementById("letter-modal");
    if (modal) modal.classList.remove("active");
}

function resetLetterCompose() {
    const composeArea = document.getElementById("letter-compose-area");
    const replyArea = document.getElementById("letter-reply-area");
    const input = document.getElementById("letter-content-input");
    if (composeArea) composeArea.style.display = "block";
    if (replyArea) replyArea.style.display = "none";
    if (input) {
        input.value = "";
        input.focus();
    }
}

async function sendAncientLetter() {
    const input = document.getElementById("letter-content-input");
    const text = (input ? input.value : "").trim();
    if (!text) {
        showToast("请先写下汝欲托付信札之想法或寄语");
        return;
    }

    const sendBtn = document.getElementById("letter-send-btn");
    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.innerHTML = `<span>✒️ 考亭先生正在融汇理学，草书挥毫中...</span>`;
    }

    try {
        const res = await fetch("/api/letter/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                thought: text,
                content: text
            })
        });
        const data = await res.json();
        const reply = cleanParentheses(data.reply || "");
        const dateStr = cleanParentheses(data.date || "宋庆元四年春 门生谨书");
        const sealStr = cleanParentheses(data.seal || "主敬<br>存诚");
        lastLetterReplyText = reply;
        lastLetterOriginalText = reply;
        lastLetterDate = dateStr;
        lastLetterSeal = sealStr;

        const composeArea = document.getElementById("letter-compose-area");
        const replyArea = document.getElementById("letter-reply-area");
        const contentEl = document.getElementById("letter-reply-content");
        const dateEl = document.getElementById("letter-reply-date");
        const sealEl = document.getElementById("letter-seal-stamp");

        if (composeArea) composeArea.style.display = "none";
        if (replyArea) replyArea.style.display = "block";
        if (contentEl) contentEl.innerHTML = renderMarkdown(reply);
        if (dateEl) dateEl.textContent = dateStr;
        if (sealEl) sealEl.innerHTML = sealStr;

        // 自动绘制高清宣纸毛笔长卷图片
        renderLetterToCanvas(reply, dateStr, sealStr);

        if (autoTTS && reply) {
            playVoice(reply);
        }

    } catch (err) {
        showToast(`代拟信札遇阻: ${err.message}`);
    } finally {
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.innerHTML = `<span>✒️ 呈递想法 · 请考亭先生融汇理学代拟草书尺牍</span>`;
        }
    }
}

function toggleLetterEdit() {
    const editBox = document.getElementById("letter-edit-box");
    const editTextarea = document.getElementById("letter-edit-textarea");
    if (!editBox) return;
    const isHidden = editBox.style.display === "none" || !editBox.style.display;
    if (isHidden) {
        if (editTextarea) editTextarea.value = lastLetterReplyText;
        editBox.style.display = "block";
        if (editTextarea) editTextarea.focus();
    } else {
        editBox.style.display = "none";
    }
}

function confirmLetterEdit() {
    const editTextarea = document.getElementById("letter-edit-textarea");
    const editBox = document.getElementById("letter-edit-box");
    const contentEl = document.getElementById("letter-reply-content");
    if (!editTextarea) return;

    const modified = cleanParentheses(editTextarea.value.trim());
    if (!modified) {
        showToast("信札文字不可为空");
        return;
    }

    lastLetterReplyText = modified;
    if (contentEl) contentEl.innerHTML = renderMarkdown(modified);
    if (editBox) editBox.style.display = "none";

    // 重新绘制并刷新长卷图片
    renderLetterToCanvas(modified, lastLetterDate, lastLetterSeal);
    showToast("已成功更新信札内容与草书手札长卷！");
}

function cancelLetterEdit() {
    const editBox = document.getElementById("letter-edit-box");
    if (editBox) editBox.style.display = "none";
}

function renderLetterToCanvas(text, dateStr, sealStr) {
    const canvas = document.getElementById("letter-canvas-render");
    const imgPreview = document.getElementById("letter-image-preview");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = 800;
    const height = 1100;
    canvas.width = width;
    canvas.height = height;

    // 1. 古雅宣纸底色与纸纹
    ctx.fillStyle = "#faf6ed";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(180, 83, 9, 0.02)";
    for (let x = 0; x < width; x += 4) {
        ctx.fillRect(x, 0, 2, height);
    }

    // 2. 双重古典朱红回纹边框
    ctx.strokeStyle = "#991b1b";
    ctx.lineWidth = 3;
    ctx.strokeRect(36, 36, width - 72, height - 72);
    ctx.lineWidth = 1;
    ctx.strokeRect(42, 42, width - 84, height - 84);

    const corners = [
        [36, 36], [width - 36, 36], [36, height - 36], [width - 36, height - 36]
    ];
    corners.forEach(([cx, cy]) => {
        ctx.fillStyle = "#991b1b";
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();
    });

    // 3. 顶栏题头
    ctx.fillStyle = "#78350f";
    ctx.font = "bold 26px STKaiti, KaiTi, serif";
    ctx.textAlign = "center";
    ctx.fillText("❖ 考 亭 尺 牍 · 朱 子 代 拟 墨 宝 ❖", width / 2, 90);

    ctx.strokeStyle = "#d97706";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(120, 110);
    ctx.lineTo(width - 120, 110);
    ctx.stroke();

    // 4. 正文书法排版（行草笔意，字句舒展）
    ctx.fillStyle = "#1c1917";
    ctx.font = "24px STXingkai, 'Ma Shan Zheng', KaiTi, cursive, serif";
    ctx.textAlign = "left";

    const cleanText = cleanParentheses(text || "");
    const maxWidth = width - 160;
    const lineHeight = 42;
    let startY = 165;
    const startX = 80;

    const paragraphs = cleanText.split("\n");
    for (let p of paragraphs) {
        p = p.trim();
        if (!p) {
            startY += lineHeight * 0.6;
            continue;
        }
        let line = "    ";
        for (let n = 0; n < p.length; n++) {
            const testLine = line + p[n];
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
                ctx.fillText(line, startX, startY);
                line = p[n];
                startY += lineHeight;
            } else {
                line = testLine;
            }
        }
        if (line.trim()) {
            ctx.fillText(line, startX, startY);
            startY += lineHeight;
        }
    }

    // 5. 底部落款
    const bottomY = Math.max(startY + 40, height - 190);
    ctx.fillStyle = "#451a03";
    ctx.font = "21px STXingkai, KaiTi, cursive";
    ctx.textAlign = "right";
    const finalDate = cleanParentheses(dateStr || lastLetterDate || "宋庆元四年春 门生谨书");
    ctx.fillText(finalDate, width - 80, bottomY);

    // 6. 经典印信
    const sealX = width - 150;
    const sealY = bottomY + 20;
    ctx.fillStyle = "#b91c1c";
    ctx.fillRect(sealX, sealY, 48, 48);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px STKaiti, KaiTi, serif";
    ctx.textAlign = "center";

    // 解析动态印章四字
    const sealClean = (sealStr || lastLetterSeal || "主敬存诚").replace(/<br\s*\/?>/gi, "").replace(/[\s\n]/g, "");
    const topSeal = sealClean.slice(0, 2) || "主敬";
    const btmSeal = sealClean.slice(2, 4) || "存诚";
    ctx.fillText(topSeal, sealX + 24, sealY + 22);
    ctx.fillText(btmSeal, sealX + 24, sealY + 40);

    const seal2X = sealX + 56;
    ctx.strokeStyle = "#b91c1c";
    ctx.lineWidth = 2;
    ctx.strokeRect(seal2X, sealY, 48, 48);
    ctx.fillStyle = "#b91c1c";
    ctx.fillText("考亭", seal2X + 24, sealY + 22);
    ctx.fillText("印信", seal2X + 24, sealY + 40);

    // 7. 导出至预览 <img> 标签
    if (imgPreview) {
        imgPreview.src = canvas.toDataURL("image/png");
    }
}

function downloadLetterImage() {
    const canvas = document.getElementById("letter-canvas-render");
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `考亭尺牍墨宝_${Date.now()}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("已成功保存高清尺牍墨宝图片至本地！");
}

function playVoiceFromLetter() {
    if (!lastLetterReplyText) return;
    const btn = document.getElementById("letter-tts-btn");
    playVoice(lastLetterReplyText, btn);
}

function copyLetterReply() {
    if (!lastLetterReplyText) return;
    const fullText = `【考亭尺牍·理学墨韵】\n\n${lastLetterReplyText}\n\n—— ${lastLetterDate || "宋代文人手札"}`;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(fullText).then(() => {
            showToast("先生墨宝尺牍已抄录入剪贴板");
        });
    } else {
        showToast("已呈示尺牍全文，供仁兄温习");
    }
}

// ========================================================
// 模块：武夷研学 · 考亭考校堂 (答题小课堂与當堂朱批)
// ========================================================
let quizQuestions = [];
let quizCurrentIdx = 0;
let quizSelectedAnswers = {};
let quizResultData = null;
let currentQuizCategory = "all";

async function openQuizModal() {
    stopCurrentVoice(true);
    const modal = document.getElementById("quiz-modal");
    if (!modal) return;
    modal.classList.add("active");

    const activeArea = document.getElementById("quiz-active-area");
    const resultArea = document.getElementById("quiz-result-area");
    if (activeArea) activeArea.style.display = "block";
    if (resultArea) resultArea.style.display = "none";

    if (quizQuestions.length === 0) {
        await loadQuizQuestions(currentQuizCategory);
    } else {
        renderQuizQuestion(quizCurrentIdx);
    }
}

function closeQuizModal(e) {
    if (e && e.target && e.target !== document.getElementById("quiz-modal")) return;
    const modal = document.getElementById("quiz-modal");
    if (modal) modal.classList.remove("active");
}

async function switchQuizCategory(category, btnEl) {
    currentQuizCategory = category;
    if (btnEl) {
        document.querySelectorAll(".quiz-cat-pill").forEach(p => p.classList.remove("active"));
        btnEl.classList.add("active");
    }
    quizQuestions = [];
    quizSelectedAnswers = {};
    quizResultData = null;
    const activeArea = document.getElementById("quiz-active-area");
    const resultArea = document.getElementById("quiz-result-area");
    if (activeArea) activeArea.style.display = "block";
    if (resultArea) resultArea.style.display = "none";
    await loadQuizQuestions(category);
}

async function loadQuizQuestions(category = "all") {
    const titleEl = document.getElementById("quiz-question-text");
    if (titleEl) titleEl.textContent = "夫子正在武夷精舍简选研学试题...";
    try {
        const res = await fetch(`/api/quiz/questions?category=${encodeURIComponent(category)}`);
        const data = await res.json();
        if (data.questions && data.questions.length > 0) {
            quizQuestions = data.questions;
            quizCurrentIdx = 0;
            quizSelectedAnswers = {};
            renderQuizQuestion(0);
        } else {
            if (titleEl) titleEl.textContent = "试题未能传回，请稍后重新开启";
        }
    } catch (err) {
        if (titleEl) titleEl.textContent = `试题调阅遇阻: ${err.message}`;
    }
}

function renderQuizQuestion(idx) {
    if (!quizQuestions || quizQuestions.length === 0) return;
    if (idx < 0) idx = 0;
    if (idx >= quizQuestions.length) idx = quizQuestions.length - 1;
    quizCurrentIdx = idx;

    const q = quizQuestions[idx];
    const catBadge = document.getElementById("quiz-cat-badge");
    const stepIndicator = document.getElementById("quiz-step-indicator");
    const titleEl = document.getElementById("quiz-question-text");
    const container = document.getElementById("quiz-options-container");
    const prevBtn = document.getElementById("quiz-prev-btn");
    const nextBtn = document.getElementById("quiz-next-btn");
    const submitBtn = document.getElementById("quiz-submit-btn");

    if (catBadge) catBadge.textContent = cleanParentheses(q.category || "朱子文化");
    if (stepIndicator) stepIndicator.textContent = `第 ${idx + 1} / ${quizQuestions.length} 题`;
    if (titleEl) titleEl.textContent = cleanParentheses(q.question);

    if (container) {
        container.innerHTML = "";
        const selectedVal = quizSelectedAnswers[q.id];
        const letters = ["甲", "乙", "丙", "丁"];
        q.options.forEach((opt, optIdx) => {
            const optText = typeof opt === "string" ? opt : (opt.text || "");
            const optLetter = letters[optIdx] || String(optIdx + 1);
            const isSelected = selectedVal === optIdx;
            const optBtn = document.createElement("div");
            optBtn.className = `quiz-option-card ${isSelected ? "selected" : ""}`;
            optBtn.onclick = () => selectQuizOption(optIdx);
            optBtn.innerHTML = `
                <div class="option-key-circle">${escapeHtml(optLetter)}</div>
                <div class="option-text-content">${escapeHtml(cleanParentheses(optText))}</div>
                <div class="option-radio-ring">${isSelected ? "✓" : ""}</div>
            `;
            container.appendChild(optBtn);
        });
    }

    if (prevBtn) prevBtn.style.display = idx > 0 ? "inline-flex" : "none";
    const isLast = idx === quizQuestions.length - 1;
    if (nextBtn) nextBtn.style.display = isLast ? "none" : "inline-flex";
    if (submitBtn) submitBtn.style.display = isLast ? "inline-flex" : "none";
}

function selectQuizOption(optIdx) {
    const q = quizQuestions[quizCurrentIdx];
    if (!q) return;
    quizSelectedAnswers[q.id] = optIdx;
    renderQuizQuestion(quizCurrentIdx);
}

function nextQuizQuestion() {
    if (quizCurrentIdx < quizQuestions.length - 1) {
        renderQuizQuestion(quizCurrentIdx + 1);
    }
}

function prevQuizQuestion() {
    if (quizCurrentIdx > 0) {
        renderQuizQuestion(quizCurrentIdx - 1);
    }
}

async function submitQuizExam() {
    const answeredCount = Object.keys(quizSelectedAnswers).length;
    if (answeredCount < quizQuestions.length) {
        showToast(`尚有试题未作答，共完成 ${answeredCount} / ${quizQuestions.length} 题`);
    }

    const submitBtn = document.getElementById("quiz-submit-btn");
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>呈递考卷 · 夫子审判中...</span>`;
    }

    try {
        const res = await fetch("/api/quiz/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ answers: quizSelectedAnswers })
        });
        const data = await res.json();
        quizResultData = data;

        const activeArea = document.getElementById("quiz-active-area");
        const resultArea = document.getElementById("quiz-result-area");
        if (activeArea) activeArea.style.display = "none";
        if (resultArea) resultArea.style.display = "block";

        const scoreEl = document.getElementById("quiz-final-score");
        const rankEl = document.getElementById("quiz-rank-title");
        const descEl = document.getElementById("quiz-score-desc");
        const zhupiEl = document.getElementById("quiz-zhupi-text");
        const certIdEl = document.getElementById("cert-id-val");
        const reviewListEl = document.getElementById("quiz-review-list");

        const letters = ["甲", "乙", "丙", "丁"];
        const degreeText = data.rank || data.degree || "秀才及格";
        const critiqueText = data.zhupi_comment || data.critique || "老夫观卿答卷，知平日用功颇有条理。";

        if (scoreEl) scoreEl.textContent = data.score ?? 0;
        if (rankEl) rankEl.textContent = cleanParentheses(degreeText);
        if (descEl) descEl.textContent = `答对 ${data.correct_count} 题，共 ${data.total_count || data.total || 5} 题`;
        if (zhupiEl) zhupiEl.textContent = cleanParentheses(critiqueText);
        if (certIdEl) certIdEl.textContent = data.certificate_id || `KT-2026-${Date.now().toString(36).toUpperCase()}`;

        const detailsList = data.details || [];
        if (reviewListEl && Array.isArray(detailsList)) {
            reviewListEl.innerHTML = detailsList.map((exp, i) => {
                const userChoiceLetter = exp.user_choice !== undefined && exp.user_choice !== null && letters[exp.user_choice] ? letters[exp.user_choice] : "未作答";
                const correctChoiceLetter = letters[exp.correct_choice] || "甲";
                const isRight = exp.is_correct;
                return `
                    <div class="review-item-card ${isRight ? "correct" : "wrong"}">
                        <div class="review-head">
                            <span class="review-status-tag ${isRight ? "green" : "red"}">${isRight ? "✓ 正确" : "✗ 需悟"}</span>
                            <span class="review-q-title">第 ${i + 1} 题：${escapeHtml(cleanParentheses(exp.question))}</span>
                        </div>
                        <div class="review-meta-row">
                            <span class="meta-label">汝之作答：<strong>${escapeHtml(userChoiceLetter)}</strong></span>
                            <span class="meta-label">夫子定按：<strong>${escapeHtml(correctChoiceLetter)}</strong></span>
                            <span class="meta-book-src">${escapeHtml(cleanParentheses(exp.book_title || "考亭典籍"))}</span>
                        </div>
                        <div class="review-explanation-box">
                            <div class="exp-title">【夫子义理解构】：</div>
                            <div class="exp-content">${escapeHtml(cleanParentheses(exp.explanation || exp.analysis || "考亭先生考释：学者当熟读深思，即物穷理，知行相须，方得圣贤真传。"))}</div>
                        </div>
                    </div>
                `;
            }).join("");
        }

        if (autoTTS && data.zhupi_comment) {
            playVoice(cleanParentheses(data.zhupi_comment));
        }

    } catch (err) {
        showToast(`呈交答卷遇阻: ${err.message}`);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<span>呈交答卷 · 候夫子朱批</span>`;
        }
    }
}

async function resetAndRestartQuiz() {
    quizQuestions = [];
    quizSelectedAnswers = {};
    quizResultData = null;
    const activeArea = document.getElementById("quiz-active-area");
    const resultArea = document.getElementById("quiz-result-area");
    if (activeArea) activeArea.style.display = "block";
    if (resultArea) resultArea.style.display = "none";
    await loadQuizQuestions(currentQuizCategory);
}

function printOrShareCertificate() {
    if (!quizResultData) return;
    const certText = `【宋·考亭书院武夷理学研学结业文牒】\n编号：${quizResultData.certificate_id}\n等第：${quizResultData.rank || quizResultData.degree}\n得分：${quizResultData.score} 分\n夫子朱批：“${quizResultData.zhupi_comment || quizResultData.critique}”\n立牒年月：庆元四年春 · 考亭讲筵`;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(certText).then(() => {
            showToast("已将武夷研学结业文牒复制至剪贴板");
        });
    } else {
        showToast("已呈示结业文牒，供仁兄存念");
    }
}

// ========================================================
// 模块：典籍考据 · 古籍全文精确检索引擎
// ========================================================
function openCorpusSearchModal() {
    const modal = document.getElementById("corpus-search-modal");
    if (!modal) return;
    modal.classList.add("active");
    const input = document.getElementById("corpus-keyword-input");
    if (input) {
        input.focus();
    }
}

function closeCorpusSearchModal(e) {
    if (e && e.target && e.target !== document.getElementById("corpus-search-modal")) return;
    const modal = document.getElementById("corpus-search-modal");
    if (modal) modal.classList.remove("active");
}

function clearCorpusInput() {
    const input = document.getElementById("corpus-keyword-input");
    if (input) {
        input.value = "";
        input.focus();
    }
}

function quickCorpusSearch(term) {
    const input = document.getElementById("corpus-keyword-input");
    if (input) {
        input.value = term;
    }
    executeCorpusSearch(term);
}

function highlightCorpusSnippet(text, kw) {
    if (!text || !kw) return escapeHtml(text || "");
    const safeText = escapeHtml(text);
    const safeKw = escapeHtml(kw);
    const reg = new RegExp(safeKw, "gi");
    return safeText.replace(reg, match => `<mark class="corpus-highlight-kw">${match}</mark>`);
}

async function executeCorpusSearch(termOverride) {
    const input = document.getElementById("corpus-keyword-input");
    const kw = (termOverride !== undefined ? termOverride : (input ? input.value : "")).trim();
    if (!kw) {
        showToast("请先输入欲考据之经义字词");
        return;
    }

    const summaryEl = document.getElementById("corpus-result-summary");
    const listEl = document.getElementById("corpus-results-list");

    if (summaryEl) summaryEl.textContent = `考亭先生正在23部典籍中翻阅卷目，考据“${cleanParentheses(kw)}”...`;
    if (listEl) {
        listEl.innerHTML = `<div class="corpus-loading">正在23部典籍中翻阅卷目考据...</div>`;
    }

    try {
        const res = await fetch(`/api/corpus/search?q=${encodeURIComponent(kw)}&limit=15`);
        const data = await res.json();
        const results = data.results || [];

        if (summaryEl) {
            summaryEl.textContent = `考据检得 ${results.length} 处考亭典籍卷目原文。已杜绝一切大模型虚构与伪托。`;
        }

        if (listEl) {
            if (results.length === 0) {
                listEl.innerHTML = `
                    <div class="corpus-empty-state">
                        <span class="empty-icon">📜</span>
                        <p>未在典籍库中检索到包含“${escapeHtml(cleanParentheses(kw))}”之确切文段，请尝试精简关键词或输入理学核心字词。</p>
                    </div>
                `;
            } else {
                listEl.innerHTML = results.map((item, idx) => `
                    <div class="corpus-result-card">
                        <div class="result-header">
                            <div class="result-title-group">
                                <span class="result-idx-badge">${idx + 1}</span>
                                <span class="result-book-title">${escapeHtml(cleanParentheses(item.book_title || "考亭典籍"))}</span>
                                <span class="result-chapter-badge">${escapeHtml(cleanParentheses(item.chapter || ""))}</span>
                            </div>
                            <button class="corpus-read-whole-btn" onclick="openFulltextFromProvenance('${escapeHtml(item.book_key || "")}', '${escapeHtml(cleanParentheses(item.book_title || "考亭典籍"))}', '${escapeHtml(cleanParentheses(item.snippet || kw))}', '${escapeHtml(item.filename || "")}', '${escapeHtml(cleanParentheses(item.chapter || ""))}')">
                                📖 翻阅全卷
                            </button>
                        </div>
                        <div class="result-snippet-box">
                            ${highlightCorpusSnippet(cleanParentheses(item.snippet || ""), kw)}
                        </div>
                        <div class="result-footer-row">
                            <span class="provenance-detail-tag">出处索引：${escapeHtml(cleanParentheses(item.book_title))} · ${escapeHtml(cleanParentheses(item.section || item.chapter))}</span>
                        </div>
                    </div>
                `).join("");
            }
        }
    } catch (err) {
        if (summaryEl) summaryEl.textContent = `考据发生异常: ${err.message}`;
        if (listEl) listEl.innerHTML = `<div class="corpus-empty-state"><p style="color:#ef4444;">检阅遇阻: ${escapeHtml(err.message)}</p></div>`;
    }
}

// ========================================================
// 典籍全卷映射与 RAG 考据溯源卡片呈现
// ========================================================
function mapToLibraryKey(key) {
    if (!key) return "yulei";
    const k = key.toLowerCase();
    if (k.includes("sishu") || k.includes("zhangju") || k.includes("daxue") || k.includes("lunyu") || k.includes("mengzi") || k.includes("zhongyong")) return "sishu";
    if (k.includes("yulei")) return "yulei";
    if (k.includes("jinsi")) return "jinsi";
    if (k.includes("bailu")) return "bailu";
    if (k.includes("chuci")) return "chuci";
    if (k.includes("wuyi") && k.includes("poem")) return "wuyi_poems";
    if (k.includes("wuyi")) return "wuyi_records";
    if (k.includes("wenji")) return "wenji";
    return "yulei";
}

// 直达具体文献原文阅读器，并黄色高亮特别标注，精准跳至该段落所在章节
function openFulltextFromProvenance(bookKey, bookTitle, snippet, filename = "", chapter = "") {
    const finalKey = bookKey || matchOpacBookKey(bookTitle) || "yulei";
    if (window.library3DEngine) {
        window.library3DEngine.openFulltextReader(finalKey, bookTitle || "考亭原典特藏", snippet || "", filename || "", chapter || "");
    } else {
        switchNav("recommend");
        setTimeout(() => {
            if (window.library3DEngine) {
                window.library3DEngine.openFulltextReader(finalKey, bookTitle || "考亭原典特藏", snippet || "", filename || "", chapter || "");
            }
        }, 150);
    }
}

function openBookFromProvenance(bookKey) {
    openFulltextFromProvenance(bookKey, "考亭原典", "");
}

function renderSourcesCard(bubbleEl, sources) {
    if (!bubbleEl || !Array.isArray(sources) || sources.length === 0) return;
    const existing = bubbleEl.querySelector(".rag-sources-accordion");
    if (existing) existing.remove();

    const accordion = document.createElement("div");
    accordion.className = "rag-sources-accordion";

    const cleanSources = sources.map(s => ({
        title: cleanParentheses(s.title || "考亭典籍"),
        chapter: cleanParentheses(s.chapter || ""),
        section: cleanParentheses(s.section || ""),
        book_key: s.book_key || "zhuzi_yulei",
        filename: s.filename || "",
        snippet: cleanParentheses(s.snippet || "")
    }));

    accordion.innerHTML = `
        <div class="rag-sources-header" onclick="toggleSourcesAccordion(this)">
            <span class="rag-seal-tag">原典考据</span>
            <span class="rag-title">本讲授引述 ${cleanSources.length} 处考亭原典考证</span>
            <span class="rag-toggle-icon">▼ 展开考据出处</span>
        </div>
        <div class="rag-sources-body" style="display:none;">
            ${cleanSources.map((s, idx) => `
                <div class="rag-source-item">
                    <div class="rag-item-head">
                        <span class="rag-num">第 ${idx + 1} 条</span>
                        <strong class="rag-book-title">${escapeHtml(s.title)}</strong>
                        <span class="rag-chapter-tag">${escapeHtml(s.chapter)}</span>
                    </div>
                    <div class="rag-snippet-text">${escapeHtml(s.snippet)}</div>
                    <div class="rag-item-footer">
                        <button class="rag-read-btn" onclick="openFulltextFromProvenance('${escapeHtml(s.book_key)}', '${escapeHtml(s.title)}', '${escapeHtml(cleanParentheses(s.snippet))}', '${escapeHtml(s.filename)}', '${escapeHtml(cleanParentheses(s.chapter))}');">
                            📖 翻阅全卷典籍文献（定位并标注）
                        </button>
                    </div>
                </div>
            `).join("")}
        </div>
    `;

    bubbleEl.appendChild(accordion);
}

function toggleSourcesAccordion(headerEl) {
    const body = headerEl.nextElementSibling;
    const icon = headerEl.querySelector(".rag-toggle-icon");
    if (!body) return;
    const isHidden = body.style.display === "none";
    body.style.display = isHidden ? "flex" : "none";
    if (icon) {
        icon.textContent = isHidden ? "▲ 收起考据出处" : "▼ 展开考据出处";
    }
}

// ========================================================
// 模块：语音识别输入控制器 · 实时语音转文本
// ========================================================
let activeSpeechRecognition = null;
let currentVoiceModuleKey = null;

function toggleVoiceInput(moduleKey) {
    if (activeSpeechRecognition && currentVoiceModuleKey === moduleKey) {
        stopVoiceInput(moduleKey, false);
    } else {
        startVoiceInput(moduleKey);
    }
}

function startVoiceInput(moduleKey) {
    stopCurrentVoice(true);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        showToast("当前浏览器未开放语音识别接口，建议使用 Google Chrome 或 Edge 浏览器");
        return;
    }

    if (activeSpeechRecognition) {
        try {
            activeSpeechRecognition.abort();
        } catch (e) {}
        activeSpeechRecognition = null;
    }

    currentVoiceModuleKey = moduleKey;
    const inputEl = document.getElementById(`${moduleKey}-user-input`);
    const micBtn = document.getElementById(`${moduleKey}-mic-btn`);
    const dockEl = document.getElementById(`${moduleKey}-voice-dock`);
    const labelEl = document.getElementById(`${moduleKey}-voice-label`);

    let finalTranscript = (inputEl ? inputEl.value : "").trim();
    if (finalTranscript && !finalTranscript.endsWith("，") && !finalTranscript.endsWith("。")) {
        finalTranscript += "，";
    }

    try {
        const recognition = new SpeechRecognition();
        recognition.lang = "zh-CN";
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            if (micBtn) {
                micBtn.classList.add("is-recording");
                micBtn.title = "点击结束语音输入";
            }
            if (dockEl) dockEl.style.display = "flex";
            if (labelEl) labelEl.textContent = "正在聆听仁兄问学 请开口道来...";
            if (window.avatarEngine && typeof window.avatarEngine.onUserTyping === "function") {
                window.avatarEngine.onUserTyping();
            }
        };

        recognition.onresult = (event) => {
            let interimTranscript = "";
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const chunk = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += cleanParentheses(chunk);
                } else {
                    interimTranscript += cleanParentheses(chunk);
                }
            }

            const currentText = (finalTranscript + interimTranscript).trim();
            if (inputEl) {
                inputEl.value = currentText;
            }
            if (labelEl) {
                labelEl.textContent = interimTranscript ? `已辨：“${interimTranscript}”` : "正在聆听仁兄问学 请开口道来...";
            }
            if (window.avatarEngine && typeof window.avatarEngine.onUserTyping === "function") {
                window.avatarEngine.onUserTyping();
            }
        };

        recognition.onerror = (e) => {
            console.warn("[Voice Input] 语音识别提示:", e.error);
            if (e.error === "not-allowed" || e.error === "permission-denied") {
                showToast("麦克风权限未开放，请在浏览器地址栏开放麦克风权限");
            } else if (e.error === "network") {
                showToast("语音识别网络服务连接稍缓，请检查网络或重试");
            } else if (e.error !== "no-speech" && e.error !== "aborted") {
                showToast(`语音识别提示: ${e.error}`);
            }
            stopVoiceInput(moduleKey, false);
        };

        recognition.onend = () => {
            if (activeSpeechRecognition === recognition) {
                stopVoiceInput(moduleKey, false);
            }
        };

        activeSpeechRecognition = recognition;
        recognition.start();

    } catch (err) {
        console.error("[Voice Input] 启动异常:", err);
        showToast("启动语音识别遇阻，请检查麦克风设置");
        stopVoiceInput(moduleKey, false);
    }
}

function stopVoiceInput(moduleKey, autoSend = false) {
    if (activeSpeechRecognition) {
        try {
            activeSpeechRecognition.stop();
        } catch (e) {}
        activeSpeechRecognition = null;
    }
    currentVoiceModuleKey = null;

    const micBtn = document.getElementById(`${moduleKey}-mic-btn`);
    const dockEl = document.getElementById(`${moduleKey}-voice-dock`);
    const inputEl = document.getElementById(`${moduleKey}-user-input`);

    if (micBtn) {
        micBtn.classList.remove("is-recording");
        micBtn.title = "语音输入问对";
    }
    if (dockEl) {
        dockEl.style.display = "none";
    }

    if (inputEl) {
        inputEl.focus();
        if (autoSend) {
            const val = inputEl.value.trim();
            if (val) {
                sendQuery(moduleKey);
            } else {
                showToast("未检测到语音文字，请重新开口");
            }
        }
    }
}

// 全局暴露至 window
window.quickFillLetterIdea = quickFillLetterIdea;
window.openLetterModal = openLetterModal;
window.closeLetterModal = closeLetterModal;
window.resetLetterCompose = resetLetterCompose;
window.sendAncientLetter = sendAncientLetter;
window.toggleLetterEdit = toggleLetterEdit;
window.confirmLetterEdit = confirmLetterEdit;
window.cancelLetterEdit = cancelLetterEdit;
window.downloadLetterImage = downloadLetterImage;
window.copyLetterReply = copyLetterReply;
window.playVoiceFromLetter = playVoiceFromLetter;
window.openQuizModal = openQuizModal;
window.closeQuizModal = closeQuizModal;
window.switchQuizCategory = switchQuizCategory;
window.selectQuizOption = selectQuizOption;
window.nextQuizQuestion = nextQuizQuestion;
window.prevQuizQuestion = prevQuizQuestion;
window.submitQuizExam = submitQuizExam;
window.resetAndRestartQuiz = resetAndRestartQuiz;
window.printOrShareCertificate = printOrShareCertificate;
window.openCorpusSearchModal = openCorpusSearchModal;
window.closeCorpusSearchModal = closeCorpusSearchModal;
window.clearCorpusInput = clearCorpusInput;
window.quickCorpusSearch = quickCorpusSearch;
window.executeCorpusSearch = executeCorpusSearch;
window.toggleVoiceInput = toggleVoiceInput;
window.stopVoiceInput = stopVoiceInput;
window.openBookFromProvenance = openBookFromProvenance;
window.toggleSourcesAccordion = toggleSourcesAccordion;
window.startTaskFlow = startTaskFlow;
window.exitTaskFlow = exitTaskFlow;
window.selectThesisDirection = selectThesisDirection;
window.selectPoetrySample = selectPoetrySample;
window.selectScenerySpot = selectScenerySpot;
window.selectLifeStage = selectLifeStage;
window.sendTaskFlowQuery = sendTaskFlowQuery;
window.triggerPoetryImageUpload = triggerPoetryImageUpload;
window.handlePoetryImageFile = handlePoetryImageFile;
window.toggleInstantTTS = toggleInstantTTS;
window.speakInstantText = speakInstantText;

// 书院雅乐 BGM 控制器暴露
window.toggleAcademyBGM = toggleAcademyBGM;
window.openBgmModal = openBgmModal;
window.closeBgmModal = closeBgmModal;
window.playBgmTrack = playBgmTrack;
window.nextBgmTrack = nextBgmTrack;
window.prevBgmTrack = prevBgmTrack;
window.setBgmVolume = setBgmVolume;
window.initBgmPlayer = initBgmPlayer;
window.updateBgmUI = updateBgmUI;
window.tryAutoPlayBgm = tryAutoPlayBgm;

// 武夷学院 OPAC 线下借阅预约管理器暴露
window.openReservationModal = openReservationModal;
window.closeReservationModal = closeReservationModal;
window.quickReserveThisBook = quickReserveThisBook;
window.quickReserveFromCitation = quickReserveFromCitation;
window.removeReservationBook = removeReservationBook;
window.clearReservationBooklist = clearReservationBooklist;
window.submitReservationForm = submitReservationForm;
window.printReservationVoucher = printReservationVoucher;
window.loadReservationBooklist = loadReservationBooklist;
window.switchReservationTab = switchReservationTab;
window.renderMyReservationRecords = renderMyReservationRecords;
window.cancelReservation = cancelReservation;
window.loadSubmittedReservations = loadSubmittedReservations;
window.refreshCitationOpacStatus = refreshCitationOpacStatus;
window.refreshReservationListLiveStatus = refreshReservationListLiveStatus;
window.openReaderAccountSwitcherModal = openReaderAccountSwitcherModal;
window.closeReaderAccountSwitcherModal = closeReaderAccountSwitcherModal;
window.submitReaderAccountLogin = submitReaderAccountLogin;
window.switchReaderAccount = switchReaderAccount;
window.logoutReaderAccount = logoutReaderAccount;
window.getReservationsForCurrentAccount = getReservationsForCurrentAccount;
window.loadReaderAccount = loadReaderAccount;
window.HOME_SHOWCASE_CATEGORIES = HOME_SHOWCASE_CATEGORIES;
window.switchHomeShowcaseCategory = switchHomeShowcaseCategory;
window.renderHomeShowcaseBooks = renderHomeShowcaseBooks;
window.switchOpacModalCategory = switchOpacModalCategory;
