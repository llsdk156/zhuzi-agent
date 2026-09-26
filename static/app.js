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

// 2. 考亭讲筵课程讲义数据库
const courseList = [
    {
        badge: "治学总纲",
        title: "《读书六法精讲》",
        summary: "朱子四十载校订群经所凝练之治学金针，专治学者浮躁求速、死记硬背之弊。",
        original: "“读书之法有六：一曰循序渐进，二曰熟读精思，三曰虚心涵泳，四曰切己体察，五曰着紧用力，六曰居敬持志。”",
        commentary: "以二书并观，则历落相瞒；以一书兼旬，则融液精明。小立课程，微加积叠。字求其训，句索其旨。未得乎前，不敢求乎后；未通乎上，不敢求乎下。",
        thinking: "学者且省察：今日看书是否贪多求快、走马观花？可曾字字推敲、使意融于心？"
    },
    {
        badge: "初学入德",
        title: "《大学章句》三纲八目",
        summary: "先读《大学》以定其规模。宋代理学立学之总纲领，为学与成己之蓝图。",
        original: "“大学之道，在明明德，在亲民，在止于至善。知止而后有定，定而后能静，静而后能安，安而后能虑，虑而后能得。”",
        commentary: "明明德者，去其人欲之蔽，以复其天命之初也。三纲领提其领，格致诚正修齐治平八条目举其细。由浅入深，由内圣而达外王。",
        thinking: "学者且反躬：吾胸次之中，今日可有私欲障蔽本心？当从何事何处去穷格此理？"
    },
    {
        badge: "规训立范",
        title: "《白鹿洞书院学规》",
        summary: "考亭先生重修庐山白鹿洞书院手订揭示，千年华夏书院教化之金科玉律。",
        original: "“父子有亲，君臣有义，夫妇有别，长幼有序，朋友有信。为学之序：博学之，审问之，慎思之，明辨之，笃行之。处事之要：正其义不谋其利，明其道不计其功。”",
        commentary: "学者之所以学者，将以求明夫天叙天秩之大经，以为修身齐家治国平天下之用耳。非徒记诵词章以干利禄也！",
        thinking: "面对功利与道义抉择，吾能否秉持‘正其义不谋其利’之浩然节操？"
    },
    {
        badge: "理学梯航",
        title: "《近思录》道体精微",
        summary: "考亭先生与吕祖谦编选周敦颐、程颢、程颐、张载四子之言，宋代理学之阶梯。",
        original: "“万物皆有一理，至赜而不可乱。学者当于喜怒哀乐未发之前体认气象，于事物交接之际存守天理。”",
        commentary: "老夫与东莱吕伯恭取北宋四子言论精粹，分门别类为十四卷。学者读四书六经若觉宏肆无阶，得此一编，便知由何门而入。",
        thinking: "学者日常起居应接之时，可曾体认过‘未发之中’与‘已发之和’？"
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

        // 显示并触发配音（仅在正常结束且有文字时，配音亦彻底杜绝括号）
        if (ttsBtn && fullText.trim()) {
            ttsBtn.style.display = "inline-flex";
            if (autoTTS && !controller.signal.aborted && fullText.length > 0) {
                playVoice(fullText, ttsBtn);
            }
        }

        if (input) {
            input.focus();
        }
    }
}

// ========================================================
// 考亭讲筵 GalGame 研学交互辅助函数
// ========================================================
function switchGalGameChapter(chapterId, btnEl) {
    if (btnEl) {
        document.querySelectorAll(".chapter-tab-pill").forEach(p => p.classList.remove("active"));
        btnEl.classList.add("active");
    }
    if (window.galGameEngine) {
        window.galGameEngine.loadChapter(chapterId, 0);
    }
}

function toggleGalGameSyllabusDrawer() {
    const drawer = document.getElementById("galgame-syllabus-drawer");
    if (!drawer) return;
    const isHidden = drawer.style.display === "none" || !drawer.style.display;
    drawer.style.display = isHidden ? "flex" : "none";
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
    document.getElementById("course-badge").textContent = c.badge;
    document.getElementById("course-title").textContent = c.title;
    document.getElementById("course-summary").textContent = c.summary;
    document.getElementById("course-original").textContent = c.original;
    document.getElementById("course-commentary").textContent = c.commentary;
    document.getElementById("course-thinking").textContent = c.thinking;
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

    // 极速出声优化：取先生开宗明义最核心的精妙法门（约120-150字），可在1秒内极速合成发声，告别漫长等待
    if (cleanText.length > 150) {
        const periodIdx = cleanText.indexOf("。", 90);
        if (periodIdx > 0 && periodIdx <= 180) {
            cleanText = cleanText.substring(0, periodIdx + 1);
        } else {
            cleanText = cleanText.substring(0, 140) + "。余意且待仁兄静思体味。";
        }
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

// 彻底清除所有中英文圆括号及其内容，并杜绝朱熹与朱子字样泄漏
function cleanParentheses(text) {
    if (!text) return "";
    let prev = null;
    let t = text;
    // 循环消除嵌套或多段中英文圆括号
    while (prev !== t) {
        prev = t;
        t = t.replace(/[\(（][^()（）]*?[\)）]/gs, "");
    }
    // 消除流式输出尚未闭合的括号尾巴
    t = t.replace(/[\(（][^()（）\n]*$/g, "");
    // 消除空括号残留
    t = t.replace(/[\(（]\s*[\)）]/g, "");

    // 前端二次安全屏障：彻底清除朱熹与朱子
    t = t.replace(/《朱子语类》|《朱子语录》/g, "《考亭语类》");
    t = t.replace(/《朱子读书法》/g, "《考亭读书法》");
    t = t.replace(/《朱文公文集》|《朱子文集》/g, "《考亭文集》");
    t = t.replace(/《朱子家训》/g, "《考亭家训》");
    t = t.replace(/朱子学派|朱子学/g, "考亭理学");
    t = t.replace(/朱子文化/g, "考亭理学文化");
    t = t.replace(/朱子读书法/g, "考亭读书法");
    t = t.replace(/朱子语类|朱子语录/g, "考亭语类");
    t = t.replace(/朱子文集|朱文公文集/g, "考亭文集");
    t = t.replace(/朱文公|朱夫子|朱老师|朱爷爷/g, "考亭先生");
    t = t.replace(/朱熹/g, "老夫");
    t = t.replace(/朱子/g, "老夫");
    t = t.replace(/老夫老夫+/g, "老夫");
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

function quickFillLetterIdea(themeKey) {
    const input = document.getElementById("letter-content-input");
    if (!input) return;
    const presets = {
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
        lastLetterReplyText = reply;
        lastLetterOriginalText = reply;

        const composeArea = document.getElementById("letter-compose-area");
        const replyArea = document.getElementById("letter-reply-area");
        const contentEl = document.getElementById("letter-reply-content");
        const dateEl = document.getElementById("letter-reply-date");

        if (composeArea) composeArea.style.display = "none";
        if (replyArea) replyArea.style.display = "block";
        if (contentEl) contentEl.innerHTML = renderMarkdown(reply);
        if (dateEl) dateEl.textContent = cleanParentheses(data.date || "宋庆元四年 · 考亭讲筵 晦庵朱熹 代拟手札");

        // 自动绘制高清宣纸毛笔长卷图片
        renderLetterToCanvas(reply);

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
    renderLetterToCanvas(modified);
    showToast("已成功更新信札内容与草书手札长卷！");
}

function cancelLetterEdit() {
    const editBox = document.getElementById("letter-edit-box");
    if (editBox) editBox.style.display = "none";
}

function renderLetterToCanvas(text) {
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
    ctx.fillText("宋庆元四年 · 考亭讲筵 考亭先生晦庵 代拟墨札", width - 80, bottomY);

    // 6. 经典印信
    const sealX = width - 150;
    const sealY = bottomY + 20;
    ctx.fillStyle = "#b91c1c";
    ctx.fillRect(sealX, sealY, 48, 48);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px STKaiti, KaiTi, serif";
    ctx.textAlign = "center";
    ctx.fillText("考亭", sealX + 24, sealY + 22);
    ctx.fillText("文公", sealX + 24, sealY + 40);

    const seal2X = sealX + 56;
    ctx.strokeStyle = "#b91c1c";
    ctx.lineWidth = 2;
    ctx.strokeRect(seal2X, sealY, 48, 48);
    ctx.fillStyle = "#b91c1c";
    ctx.fillText("晦翁", seal2X + 24, sealY + 22);
    ctx.fillText("之印", seal2X + 24, sealY + 40);

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
    link.download = `考亭先生草书尺牍墨宝_${Date.now()}.png`;
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
    const fullText = `【考亭先生代拟草书尺牍】\n\n${lastLetterReplyText}\n\n—— 晦庵朱熹 代拟墨札`;
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
                            <div class="exp-content">${escapeHtml(cleanParentheses(exp.analysis || exp.explanation || "考亭先生考释：学者当熟读深思，即物穷理，知行相须，方得圣贤真传。"))}</div>
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
                            <button class="corpus-read-whole-btn" onclick="openBookFromProvenance('${escapeHtml(item.book_key || "zhuzi_yulei")}')">
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

function openBookFromProvenance(bookKey) {
    const mapped = mapToLibraryKey(bookKey);
    switchNav("recommend");
    setTimeout(() => {
        if (window.library3DEngine) {
            window.library3DEngine.openBookReader(mapped);
        }
    }, 150);
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
                        <button class="rag-read-btn" onclick="openBookFromProvenance('${escapeHtml(s.book_key)}')">
                            📖 翻阅全卷典籍
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
