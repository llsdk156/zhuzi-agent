/**
 * 考亭先生动态数字人全时交互引擎 (Avatar Engine 2.0)
 * 1. 永动生命微动作系统（任何时候都是运动的 · 多层谐波呼吸摆动与自然微表情）
 * 2. 实时智能情境语义分析（自动感知对话主题与情感，动态呈现讲学、沉思、严正、欣慰等多姿态）
 * 3. 问答全生命周期自适应联动（倾听、穷理、讲授、授毕指津全自动流转）
 */

class AvatarEngine {
    constructor() {
        this.currentPose = "standing";
        this.currentState = "idle";
        this.currentMood = "【端坐候教】";
        this.isCollapsed = false;

        this.blinkTimer = null;
        this.bubbleTimeout = null;
        this.pulseTimeout = null;
        this.spontaneousTimer = null;
        this.gestureAlternator = 0;
        this.lastTypingTime = 0;

        // 5大高保真立绘姿态库
        this.poses = {
            standing: {
                name: "日常端立",
                src: "/static/avatar_states/avatar_pose_standing.png",
                desc: "拱手端立 · 候教诸生",
                bubble: "“诸生后学请了！凡有经义疑思，尽直道来。”"
            },
            teaching: {
                name: "挥卷讲学",
                src: "/static/avatar_states/avatar_pose_teaching.png",
                desc: "挥卷指点 · 阐发微言",
                bubble: "“为学之道：循序渐进，熟读精思，虚心涵泳，切己体察。”"
            },
            thinking: {
                name: "抚须沉思",
                src: "/static/avatar_states/avatar_pose_thinking.png",
                desc: "抚须沉思 · 研精思辨",
                bubble: "“理气太极，精微渊深。老夫正层层穷格其理...”"
            },
            explaining: {
                name: "展卷解惑",
                src: "/static/avatar_states/avatar_pose_explaining.png",
                desc: "展卷论道 · 剖析义理",
                bubble: "“知与行常相须，如目无足不行，足无目不见。”"
            },
            desk: {
                name: "伏案研读",
                src: "/static/avatar_states/avatar_pose_desk.png",
                desc: "伏案研读 · 秉笔校注",
                bubble: "“文字有未明处，且虚心涵泳，未得乎前，不敢求乎后。”"
            }
        };

        // 经典语录库（互动点击与结语启迪）
        this.wisdomQuotes = [
            "“问渠那得清如许？为有源头活水来。”",
            "“未见其功，先视其持守；小立课程，微加积叠。”",
            "“正其义不谋其利，明其道不计其功。”",
            "“学者须先立志，而后居敬持守，知行相须。”",
            "“万事皆有理在。仁兄手头所处之事，亦即穷理立命之处！”",
            "“读书之法：循序渐进，熟读精思，虚心涵泳，切己体察。”",
            "“少年易老学难成，一寸光阴不可轻。”"
        ];
    }

    init() {
        // 恢复折叠记忆
        const savedCollapsed = localStorage.getItem("zhuzi_avatar_collapsed");
        if (savedCollapsed === "true" || (window.innerWidth < 1120 && savedCollapsed !== "false")) {
            this.setCollapsed(true, false);
        }

        // 启动永动机芯：呼吸律动、自然眨眼与随机自发微动作
        this.startBlinkCycle();
        this.startSpontaneousBehaviors();
        this.setPose("standing", false);
        this.setState("idle");
        this.setMood("【端坐候教】");
    }

    // 动作切换（平滑交叉淡入淡出）
    setPose(poseKey, triggerBubble = false) {
        if (!this.poses[poseKey]) return;
        if (this.currentPose === poseKey && !triggerBubble) return;

        this.currentPose = poseKey;
        const imgEl = document.getElementById("avatar-figure-img");
        if (imgEl) {
            imgEl.style.opacity = "0.5";
            imgEl.style.transform = "scale(0.97)";
            setTimeout(() => {
                imgEl.src = this.poses[poseKey].src;
                imgEl.onload = () => {
                    imgEl.style.opacity = "1";
                    imgEl.style.transform = "scale(1)";
                };
            }, 100);
        }

        const mottoEl = document.getElementById("avatar-motto-text");
        if (mottoEl) {
            mottoEl.textContent = this.poses[poseKey].desc;
        }

        if (triggerBubble) {
            this.showBubble(this.poses[poseKey].bubble, 4500);
        }
    }

    // 实时状态切换
    setState(stateKey) {
        this.currentState = stateKey;
        const container = document.getElementById("avatar-stage-box");
        if (!container) return;

        container.classList.remove(
            "state-idle",
            "state-listening",
            "state-thinking",
            "state-speaking",
            "state-finished"
        );
        container.classList.add(`state-${stateKey}`);
    }

    // 动态情境感知标签更新
    setMood(moodLabel) {
        this.currentMood = moodLabel;
        const pill = document.getElementById("avatar-mood-pill");
        if (pill) {
            pill.textContent = moodLabel;
        }
    }

    // ========================================================
    // 智能语义与情境感知引擎 (Context & Sentiment Classifier)
    // 根据学者问题与先生论述，自动呈现匹配的体态与神韵
    // ========================================================
    classifyDialogueContext(text) {
        if (!text) return { category: "general_qa", pose: "explaining", mood: "【解难答疑】", bubble: "“世事万物皆有理在。老夫与仁兄共同剖析...”" };

        const t = text.toLowerCase();

        // 1. 形而上学与核心理学本体论 (理气心性、太极道体)
        if (/理与气|理在先|气在后|太极|天理|无极|心统性情|性即理|道体|形而上|天地之性|气质之性|阴阳/.test(t)) {
            return {
                category: "metaphysics",
                pose: "thinking",
                mood: "【穷究道体 · 抚须冥思】",
                bubble: "“理气太极，精微渊深。老夫正穷格源本，为仁兄剖析道体之妙...”"
            };
        }

        // 2. 治学次第与读书工夫 (四书、读书六法、格物致知)
        if (/读书|大学|论语|孟子|中庸|格物|致知|循序渐进|熟读精思|涵泳|切己体察|读书之法|课程|方法|计划|学规/.test(t)) {
            return {
                category: "study",
                pose: "teaching",
                mood: "【进学致知 · 挥卷引路】",
                bubble: "“为学正如造塔，须先打牢地基。循序渐进，熟读精思，工夫方能纯熟！”"
            };
        }

        // 3. 道德修身与克除私欲 (去私欲、存天理、戒勉慎独)
        if (/人欲|私欲|存天理|慎独|惩忿窒欲|居敬|敬畏|戒勉|浮躁|作弊|怠惰|克己|杂念|修身|反省/.test(t)) {
            return {
                category: "strict_discipline",
                pose: "standing",
                mood: "【端正纲纪 · 涵养用敬】",
                bubble: "“去人欲，存天理。莫教一丝私欲障蔽本心，学者切须严加检点！”"
            };
        }

        // 4. 豁然领悟与嘉勉赞许 (学者理解、欣喜、感谢)
        if (/明白了|原来如此|受教|顿悟|懂了|善哉|源头活水|豁然|欣慰|妙哉|先生高见|佩服|感谢|谢过/.test(t)) {
            return {
                category: "enlightenment",
                pose: "standing",
                mood: "【拂须欣慰 · 嘉许后学】",
                bubble: "“妙哉！后学仁兄能融会贯通、自得于心，老夫甚是欣慰！”"
            };
        }

        // 5. 经传章句与版本考校 (训诂考据、集注、朱注)
        if (/训诂|字句|版本|章句|考证|考据|注释|考亭|集注|原文|出处/.test(t)) {
            return {
                category: "desk_study",
                pose: "desk",
                mood: "【伏案秉笔 · 详校卷帙】",
                bubble: "“圣贤微言，字求其训，句索其旨。老夫且伏案详查经传原文...”"
            };
        }

        // 6. 常规解惑答疑
        return {
            category: "general_qa",
            pose: "explaining",
            mood: "【解难答疑 · 循理剖析】",
            bubble: "“事事物物皆有理在。老夫当与仁兄即物穷理，层层析解！”"
        };
    }

    // ========================================================
    // 对话生命周期全自动驱动钩子
    // ========================================================

    // 1. 学者打字输入中：先生前倾凝神倾听
    onUserTyping() {
        this.lastTypingTime = Date.now();
        if (this.currentState === "idle") {
            this.setState("listening");
            this.setMood("【倾听思索】");
            this.showBubble("“先生正凝神细听诸生之惑...”", 2500);

            // 3秒后若未继续打字，平滑回退候教
            setTimeout(() => {
                if (Date.now() - this.lastTypingTime >= 2800 && this.currentState === "listening") {
                    this.setState("idle");
                    this.setMood("【端坐候教】");
                }
            }, 3000);
        }
    }

    // 2. 学者发送提问：智能语义分析并立即自适应响应
    onUserSubmit(query) {
        const context = this.classifyDialogueContext(query);
        this.setState("thinking");
        this.setMood(context.mood);
        this.setPose(context.pose, false);
        this.showBubble(context.bubble, 5000);

        // 触发思考微动
        const figure = document.getElementById("avatar-figure-wrap");
        if (figure) {
            figure.classList.add("spontaneous-nod");
            setTimeout(() => figure.classList.remove("spontaneous-nod"), 800);
        }
    }

    // 3. 流式吐字阶段：先生挥卷讲学，声波神光起伏律动
    onTokenStream(token, fullText) {
        if (this.currentState !== "speaking") {
            this.setState("speaking");
        }

        // 生动口型/声波脉冲波
        const stage = document.getElementById("avatar-stage-box");
        if (stage) {
            stage.classList.add("avatar-speaking-pulse");
            clearTimeout(this.pulseTimeout);
            this.pulseTimeout = setTimeout(() => {
                stage.classList.remove("avatar-speaking-pulse");
            }, 260);
        }

        // 遇到重要标点符号时，自发生动变换讲学手势（挥卷与展卷交替，极具临场感）
        if (/[。！？；]/.test(token)) {
            this.gestureAlternator++;
            if (this.gestureAlternator % 2 === 1) {
                if (this.currentPose !== "teaching") this.setPose("teaching", false);
            } else {
                if (this.currentPose !== "explaining") this.setPose("explaining", false);
            }

            // 实时展示先生当前所言最新一句金句
            const sentences = fullText.split(/[。！？\n]/).filter(s => s.trim().length > 4);
            if (sentences.length > 0) {
                const latest = sentences[sentences.length - 1].trim();
                if (latest.length <= 32) {
                    this.showBubble(`“${latest}”`, 3500);
                }
            }
        }
    }

    // 4. 生成完成：先生授毕微颔、欣慰指津，而后平缓回归候教
    onComplete(fullText) {
        this.setState("finished");
        this.setMood("【授毕指津】");

        // 先生嘉勉颔首
        const figure = document.getElementById("avatar-figure-wrap");
        if (figure) {
            figure.classList.add("spontaneous-nod");
            setTimeout(() => figure.classList.remove("spontaneous-nod"), 800);
        }

        this.showBubble("“理虽在言，工夫却在诸生己身笃行。且细细体察！”", 4500);

        // 5秒后平滑回归端立候教状态
        setTimeout(() => {
            if (this.currentState === "finished") {
                this.setState("idle");
                this.setMood("【端坐候教】");
                this.setPose("standing", false);
            }
        }, 5500);
    }

    // ========================================================
    // 永动微动作与生命律动体系
    // ========================================================

    // 随机自然眨眼循环 (2.5s ~ 5s)
    startBlinkCycle() {
        const scheduleNextBlink = () => {
            const delay = 2600 + Math.random() * 2800;
            this.blinkTimer = setTimeout(() => {
                const eyeOverlay = document.getElementById("avatar-blink-overlay");
                if (eyeOverlay) {
                    eyeOverlay.classList.add("is-blinking");
                    setTimeout(() => {
                        eyeOverlay.classList.remove("is-blinking");
                    }, 140);
                }
                scheduleNextBlink();
            }, delay);
        };
        scheduleNextBlink();
    }

    // 自发生命微行为循环（每隔 6~10 秒进行一次微妙的颔首、顾盼或抚须，杜绝死板假人感）
    startSpontaneousBehaviors() {
        const scheduleNextAction = () => {
            const delay = 6000 + Math.random() * 5000;
            this.spontaneousTimer = setTimeout(() => {
                // 仅在静候状态下自发微动
                if (this.currentState === "idle") {
                    const figure = document.getElementById("avatar-figure-wrap");
                    if (figure) {
                        figure.classList.add("spontaneous-nod");
                        setTimeout(() => figure.classList.remove("spontaneous-nod"), 800);
                    }
                }
                scheduleNextAction();
            }, delay);
        };
        scheduleNextAction();
    }

    // 展示先生头顶思想/台词气泡
    showBubble(text, duration = 4000) {
        const bubble = document.getElementById("avatar-speech-bubble");
        if (!bubble) return;

        bubble.textContent = text;
        bubble.classList.add("visible");

        clearTimeout(this.bubbleTimeout);
        if (duration > 0) {
            this.bubbleTimeout = setTimeout(() => {
                bubble.classList.remove("visible");
            }, duration);
        }
    }

    // 点击立绘与先生互动问道
    interactClick() {
        const randomQuote = this.wisdomQuotes[Math.floor(Math.random() * this.wisdomQuotes.length)];
        this.showBubble(randomQuote, 5500);

        // 先生欣然颔首
        const figure = document.getElementById("avatar-figure-wrap");
        if (figure) {
            figure.classList.add("spontaneous-nod");
            setTimeout(() => figure.classList.remove("spontaneous-nod"), 800);
        }

        this.setMood("【示教开悟】");
        setTimeout(() => {
            if (this.currentState === "idle") this.setMood("【端坐候教】");
        }, 5000);

        // 若全局开启配音或支持朗诵，发声朗读
        if (typeof playVoice === "function") {
            const btn = document.getElementById("avatar-interact-btn");
            playVoice(randomQuote, btn);
        }
    }

    // 折叠与展开控制（纯净让渡空间）
    toggleCollapse() {
        this.setCollapsed(!this.isCollapsed, true);
    }

    expandIfCollapsed() {
        if (this.isCollapsed) {
            this.setCollapsed(false, true);
        }
    }

    setCollapsed(collapsed, save = true) {
        this.isCollapsed = collapsed;
        const stagePane = document.getElementById("qa-avatar-stage");
        const toggleBtn = document.getElementById("avatar-toggle-collapse-btn");

        if (stagePane) {
            if (collapsed) {
                stagePane.classList.add("collapsed");
                if (toggleBtn) {
                    toggleBtn.innerHTML = `<span>▶ 展开</span>`;
                    toggleBtn.title = "展开考亭先生数字人讲席舞台";
                }
            } else {
                stagePane.classList.remove("collapsed");
                if (toggleBtn) {
                    toggleBtn.innerHTML = `<span>◀ 收起</span>`;
                    toggleBtn.title = "收起左侧讲席舞台以获取全宽对话视野";
                }
            }
        }

        if (save) {
            localStorage.setItem("zhuzi_avatar_collapsed", collapsed ? "true" : "false");
        }
    }
}

// 挂载全局单例
if (typeof window !== "undefined") {
    window.avatarEngine = new AvatarEngine();
}
if (typeof module !== "undefined" && module.exports) {
    module.exports = { AvatarEngine };
}
