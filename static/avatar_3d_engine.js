/**
 * 考亭先生无界 3D 立体数字人系统 (Avatar 3D Standalone Engine v8.0)
 * 100% 依准参考图2规范 · 零边框零底座纯净立显 · 全时段无缝连贯视频体系
 * 动态双缓冲瞬态交叉淡入淡出 · 零卡顿零突变 · 具身理学开示
 */

class Avatar3DEngine {
    constructor() {
        this.paneEl = null;
        this.boxEl = null;
        this.wrapperEl = null;
        this.mainImg = null;
        this.angleBadge = null;
        this.speechBubble = null;
        this.moodPill = null;
        this.statusOrb = null;

        // 双缓冲视频核心
        this.videoStage = null;
        this.videoPrimary = null;
        this.videoSecondary = null;
        this.activeBuffer = "primary"; // 'primary' | 'secondary'
        this.crossfadeTimeout = null;

        // 顶栏状态指示与智能应答追踪
        this.actionTextEl = null;
        this.liveDotEl = null;
        this.questionSubmitTime = 0;
        this.streamTransitionTimer = null;

        // 状态与视角
        this.currentState = "idle"; // 'idle' | 'listening' | 'thinking' | 'speaking' | 'complete'
        this.currentViewKey = "three_quarter"; // 'three_quarter' | 'front' | 'side' | 'back'
        this.isCollapsed = false;
        this.bubbleTimeout = null;
        this.typingTimeout = null;
        this.completeResetTimeout = null;

        // 动作循环演示游标
        this.actionSequence = ["idle", "thinking", "speaking", "listening", "complete"];
        this.actionIndex = 0;

        // 3D 鼠标视差与凝视追踪动力学参数
        this.mouse = { x: 0, y: 0 };
        this.currentTilt = { x: 0, y: 0 };
        this.targetTilt = { x: 0, y: 0 };
        this.rafId = null;

        // 3D 拖拽旋转视角
        this.isDragging = false;
        this.dragStartX = 0;
        this.orbitAngle = 0;
        this.targetOrbitAngle = 0;
        this.dragStartAngle = 0;
        this.badgeTimeout = null;

        // 纯白底全场景连贯情境视频体系 (H.264 MP4 优先 + WebM 回退)
        const canPlayMp4 = typeof document !== 'undefined' && document.createElement('video').canPlayType && document.createElement('video').canPlayType('video/mp4') !== '';
        const ext = canPlayMp4 ? '.mp4' : '.webm';
        this.videoAssets = {
            idle: `/static/avatar_videos/avatar_idle${ext}`,
            listening: `/static/avatar_videos/avatar_listening${ext}`,
            thinking: `/static/avatar_videos/avatar_thinking${ext}`,
            speaking: `/static/avatar_videos/avatar_speaking${ext}`,
            complete: `/static/avatar_videos/avatar_smile${ext}`
        };

        // 360° 旋转视角静态切面资产 (旋转拖拽时无缝呈现不同角度)
        this.assets = {
            three_quarter: "/static/avatar_standalone/master_standing.png",
            front: "/static/avatar_standalone/master_standing_front.png",
            side: "/static/avatar_standalone/master_standing_side.png",
            back: "/static/avatar_standalone/master_standing_back.png"
        };

        // 理学开示金句库
        this.wisdomQuotes = [
            "“问渠那得清如许？为有源头活水来。”",
            "“涵养须用敬，进学在致知。”",
            "“知之愈明，则行之愈笃；行之愈笃，则知之益明。”",
            "“学者须先立志，而后居敬持守，知行相须。”",
            "“万事皆有理在。贤生手头所处之事，亦即穷理立命之处！”",
            "“读书之法：循序渐进，熟读精思，虚心涵泳，切己体察。”",
            "“人心虚灵不昧，以具众理而应万事。”",
            "“未有这事，先有这理。天地之间，理气常相循也。”",
            "“不矜细行，终累大德。学者当于幽暗独处之时，念念存诚。”"
        ];

        this.preloadAssets();
        this.preloadVideos();
    }

    preloadAssets() {
        Object.values(this.assets).forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }

    preloadVideos() {
        // 预加载所有状态视频，确保情境切换零等待、零卡顿
        Object.values(this.videoAssets).forEach(src => {
            const v = document.createElement("video");
            v.src = src;
            v.preload = "auto";
            v.load();
        });
    }

    init() {
        this.paneEl = document.getElementById("qa-avatar-stage");
        this.boxEl = document.getElementById("avatar-stage-box");
        this.wrapperEl = document.getElementById("figure-3d-wrapper");
        this.mainImg = document.getElementById("avatar-main-img");
        if (this.mainImg) {
            this.mainImg.src = this.assets.three_quarter;
            this.mainImg.classList.add("visible");
        }
        this.angleBadge = document.getElementById("orbit-angle-badge");
        this.speechBubble = document.getElementById("avatar-speech-bubble");
        this.moodPill = document.getElementById("avatar-mood-pill");
        this.statusOrb = document.getElementById("avatar-status-orb");

        // 顶栏状态指示
        this.actionTextEl = document.getElementById("avatar-action-text");
        this.liveDotEl = document.getElementById("avatar-live-dot");

        // 视频缓冲组件
        this.videoStage = document.getElementById("avatar-video-stage");
        this.videoPrimary = document.getElementById("avatar-video-primary");
        this.videoSecondary = document.getElementById("avatar-video-secondary");

        if (!this.boxEl) {
            console.warn("[Avatar3D] 数字人容器核心元素未就绪");
            return;
        }

        // 绑定状态标签点击轮播动作（方便随时演示检验各情境视频）
        if (this.moodPill) {
            this.moodPill.style.cursor = "pointer";
            this.moodPill.title = "点击可手动轮播不同情境动作";
            this.moodPill.addEventListener("click", (e) => {
                e.stopPropagation();
                this.cycleNextAction();
            });
        }
        if (this.actionTextEl && this.actionTextEl.parentElement) {
            this.actionTextEl.parentElement.style.cursor = "pointer";
            this.actionTextEl.parentElement.title = "点击可手动轮播不同情境动作";
            this.actionTextEl.parentElement.addEventListener("click", (e) => {
                e.stopPropagation();
                this.cycleNextAction();
            });
        }

        // 默认显示待机候教情境
        this.setState("idle");

        // 绑定事件
        this.bindEvents();

        // 启动 3D 渲染动力学物理循环 (鼠标视差追踪与惯性平滑)
        this.startPhysicsLoop();

        // 1.5秒后轻柔浮现初始欢迎箴规
        setTimeout(() => {
            if (this.currentState === "idle") {
                this.showSpeechBubble("“诸生后学请了！凡有经义疑思，尽直道来。”", 4500);
            }
        }, 1500);

        console.log("✔ 考亭先生无界 3D 连贯视频数字人系统初始化完毕");
    }

    // 手动循环演示所有动作
    cycleNextAction() {
        this.actionIndex = (this.actionIndex + 1) % this.actionSequence.length;
        const nextState = this.actionSequence[this.actionIndex];
        this.setState(nextState);
        const tips = {
            idle: "“待机候教：老夫正视诸生，虚位以俟。”",
            thinking: "“沉思穷理：理气之辨、心统性情，当深究其本。”",
            speaking: "“正在讲学：读书穷理、循序渐进，细听老夫道来。”",
            listening: "“侧耳倾听：身躯前倾、侧耳恭听仁兄所言。”",
            complete: "“抚须赞许：揖礼赞许，学贵日进有功。”"
        };
        this.showSpeechBubble(tips[nextState] || "“理学之要，即物穷理。”", 4000);
    }

    bindEvents() {
        if (!this.boxEl) return;

        // 1. 全局鼠标视差与凝视追踪 (鼠标在界面移动，先生自然转头转向倾听)
        window.addEventListener("mousemove", (e) => {
            if (this.isCollapsed) return;
            const rect = this.boxEl.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;

            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height * 0.4;

            const dx = (e.clientX - centerX) / (window.innerWidth / 2);
            const dy = (e.clientY - centerY) / (window.innerHeight / 2);

            this.mouse.x = Math.max(-1.2, Math.min(1.2, dx));
            this.mouse.y = Math.max(-1.0, Math.min(1.0, dy));

            // 当鼠标偏右（在对话框打字），先生向右侧微转以注视对话区
            this.targetTilt.y = this.mouse.x * 10; // -10° ~ 10°
            this.targetTilt.x = -this.mouse.y * 5; // -5° ~ 5°
        });

        // 2. 拖拽 360° 旋转视角
        this.boxEl.addEventListener("mousedown", (e) => {
            if (e.button !== 0) return;
            this.isDragging = true;
            this.dragStartX = e.clientX;
            this.dragStartAngle = this.targetOrbitAngle;
            e.preventDefault();
        });

        window.addEventListener("mousemove", (e) => {
            if (!this.isDragging) return;
            const deltaX = e.clientX - this.dragStartX;
            this.targetOrbitAngle = (this.dragStartAngle + deltaX * 0.6) % 360;
            this.onOrbitAngleChange(this.targetOrbitAngle);
        });

        window.addEventListener("mouseup", () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.snapToNearestAngle();
            }
        });

        // 移动端触摸支持
        this.boxEl.addEventListener("touchstart", (e) => {
            if (e.touches.length === 1) {
                this.isDragging = true;
                this.dragStartX = e.touches[0].clientX;
                this.dragStartAngle = this.targetOrbitAngle;
            }
        }, { passive: true });

        window.addEventListener("touchmove", (e) => {
            if (!this.isDragging || e.touches.length !== 1) return;
            const deltaX = e.touches[0].clientX - this.dragStartX;
            this.targetOrbitAngle = (this.dragStartAngle + deltaX * 0.6) % 360;
            this.onOrbitAngleChange(this.targetOrbitAngle);
        }, { passive: true });

        window.addEventListener("touchend", () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.snapToNearestAngle();
            }
        });
    }

    // 动力学平滑渲染循环 (Spring Lerp)
    startPhysicsLoop() {
        const update = () => {
            this.currentTilt.x += (this.targetTilt.x - this.currentTilt.x) * 0.08;
            this.currentTilt.y += (this.targetTilt.y - this.currentTilt.y) * 0.08;
            this.orbitAngle += (this.targetOrbitAngle - this.orbitAngle) * 0.12;

            if (this.wrapperEl && !this.isCollapsed) {
                const combinedRotY = this.currentTilt.y + (this.isDragging ? (this.orbitAngle % 30) * 0.2 : 0);
                const rotX = this.currentTilt.x;
                this.wrapperEl.style.transform = `perspective(900px) rotateY(${combinedRotY.toFixed(2)}deg) rotateX(${rotX.toFixed(2)}deg)`;
            }

            this.rafId = requestAnimationFrame(update);
        };
        this.rafId = requestAnimationFrame(update);
    }

    onOrbitAngleChange(angle) {
        let normAngle = ((angle % 360) + 360) % 360;
        let viewKey = "three_quarter";
        let label = "3/4视角";

        if (normAngle >= 315 || normAngle < 45) {
            viewKey = "three_quarter";
            label = "正面 3/4 视角";
        } else if (normAngle >= 45 && normAngle < 135) {
            viewKey = "side";
            label = "侧面视角";
        } else if (normAngle >= 135 && normAngle < 225) {
            viewKey = "back";
            label = "背面视角";
        } else {
            viewKey = "front";
            label = "正身直视";
        }

        if (this.currentViewKey !== viewKey) {
            this.currentViewKey = viewKey;
            if (viewKey === "three_quarter") {
                if (this.mainImg) {
                    this.mainImg.src = this.assets.three_quarter;
                    this.mainImg.classList.add("visible");
                }
                if (this.videoPrimary && this.videoSecondary) {
                    this.playStateVideo(this.currentState, true);
                }
            } else {
                if (this.mainImg) {
                    this.mainImg.src = this.assets[viewKey] || this.assets.three_quarter;
                    this.mainImg.classList.add("visible");
                }
                if (this.videoPrimary) this.videoPrimary.classList.remove("active");
                if (this.videoSecondary) this.videoSecondary.classList.remove("active");
            }
        }

        this.showAngleBadge(label);
    }

    snapToNearestAngle() {
        let normAngle = ((this.targetOrbitAngle % 360) + 360) % 360;
        let snapTarget = 0;
        if (normAngle >= 45 && normAngle < 135) snapTarget = 90;
        else if (normAngle >= 135 && normAngle < 225) snapTarget = 180;
        else if (normAngle >= 225 && normAngle < 315) snapTarget = 270;
        else snapTarget = 0;

        this.targetOrbitAngle = snapTarget;
        setTimeout(() => {
            this.hideAngleBadge();
        }, 1500);
    }

    snapCameraView(viewName) {
        if (viewName === "front") {
            this.targetOrbitAngle = 270;
            this.onOrbitAngleChange(270);
            this.showAngleBadge("正面视角");
        } else if (viewName === "side") {
            this.targetOrbitAngle = 90;
            this.onOrbitAngleChange(90);
            this.showAngleBadge("侧面视角");
        } else if (viewName === "back") {
            this.targetOrbitAngle = 180;
            this.onOrbitAngleChange(180);
            this.showAngleBadge("背面视角");
        } else {
            this.targetOrbitAngle = 0;
            this.onOrbitAngleChange(0);
            this.showAngleBadge("正面 3/4 视角");
        }
        setTimeout(() => this.hideAngleBadge(), 1800);
    }

    showAngleBadge(text) {
        if (!this.angleBadge) return;
        this.angleBadge.textContent = text;
        this.angleBadge.style.opacity = "1";
        clearTimeout(this.badgeTimeout);
        this.badgeTimeout = setTimeout(() => {
            this.hideAngleBadge();
        }, 2200);
    }

    hideAngleBadge() {
        if (this.angleBadge) {
            this.angleBadge.style.opacity = "0";
        }
    }

    /**
     * 双缓冲无缝连贯视频播放器 (Dual-Buffer Seamless Video Switcher)
     * 在视频间通过瞬态交叉淡入淡出 (Cross-Fade) 实现零卡顿、无缝连贯
     */
    playStateVideo(stateName, shouldLoop = true) {
        if (!this.videoPrimary || !this.videoSecondary) return;

        // 如果处于 360° 旋转的侧面或背面模式，则保留切面视图
        if (this.currentViewKey !== "three_quarter") {
            return;
        }

        const targetSrc = this.videoAssets[stateName] || this.videoAssets.idle;
        const currentVideo = this.activeBuffer === "primary" ? this.videoPrimary : this.videoSecondary;
        const nextVideo = this.activeBuffer === "primary" ? this.videoSecondary : this.videoPrimary;

        const currentActiveSrc = currentVideo.currentSrc || currentVideo.src || "";
        // 如果当前视频已在播放该源且正在运行，则直接更新 loop 属性，无需重置
        if (currentActiveSrc.includes(targetSrc) && !currentVideo.paused) {
            currentVideo.loop = shouldLoop;
            return;
        }

        // 装填非活跃视频缓冲槽位，强制 muted 确保浏览器无阻碍自启动播放
        nextVideo.muted = true;
        nextVideo.defaultMuted = true;
        nextVideo.playsInline = true;
        nextVideo.setAttribute("muted", "");
        nextVideo.setAttribute("playsinline", "");
        nextVideo.src = targetSrc;
        nextVideo.loop = shouldLoop;
        nextVideo.currentTime = 0;

        const executeCrossfade = () => {
            nextVideo.muted = true;
            const playPromise = nextVideo.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    // 开启瞬态双缓冲交叉淡入淡出（0.35s 极柔过渡）
                    nextVideo.classList.add("active");
                    currentVideo.classList.remove("active");

                    if (this.mainImg) {
                        this.mainImg.classList.remove("visible");
                    }

                    this.activeBuffer = this.activeBuffer === "primary" ? "secondary" : "primary";

                    // 交叉淡出完成后暂停上一视频，节省系统 GPU/CPU
                    clearTimeout(this.crossfadeTimeout);
                    this.crossfadeTimeout = setTimeout(() => {
                        const oldVideo = this.activeBuffer === "primary" ? this.videoSecondary : this.videoPrimary;
                        if (oldVideo !== nextVideo) {
                            oldVideo.pause();
                        }
                    }, 380);
                }).catch(err => {
                    console.warn("[Avatar3D] 视频自动播放策略提示:", err);
                    // 绑定一次性点击/按键激活播放
                    const resume = () => {
                        nextVideo.play().then(() => {
                            nextVideo.classList.add("active");
                            currentVideo.classList.remove("active");
                            if (this.mainImg) this.mainImg.classList.remove("visible");
                        }).catch(() => {});
                        window.removeEventListener("click", resume);
                        window.removeEventListener("keydown", resume);
                    };
                    window.addEventListener("click", resume, { once: true });
                    window.addEventListener("keydown", resume, { once: true });
                });
            }
        };

        if (nextVideo.readyState >= 2) {
            executeCrossfade();
        } else {
            nextVideo.oncanplay = () => {
                nextVideo.oncanplay = null;
                executeCrossfade();
            };
            nextVideo.load();
        }
    }

    // 智能理学问对意图分类器 (Question Intent Classifier)
    // 根据学生提问深浅、主题与性质，自动触发对应情境动作视频
    classifyQuestionAction(query) {
        if (!query || typeof query !== "string") return "thinking";
        const q = query.trim().toLowerCase();

        // 1. 微笑/赞许/揖礼类 (致谢、领悟、问候、求签、称赞)
        const smilePatterns = [
            /谢/, /受教/, /明白/, /懂了/, /恍然大悟/, /茅塞顿开/, /领悟/, /有理/,
            /善哉/, /妙/, /先生好/, /夫子好/, /老师好/, /拜见/, /请安/, /早安/,
            /晚安/, /晨策/, /灵签/, /签文/, /圣明/, /高见/, /佩服/, /敬佩/, /再见/, /多谢/
        ];
        if (smilePatterns.some(re => re.test(q))) {
            return "smile";
        }

        // 2. 讲述/教学类 (读书次第、治学方法、经书章句、步骤规则、知行践履)
        const teachingPatterns = [
            /读书次第/, /读书六法/, /如何读/, /怎样读/, /怎么读/, /学规/, /白鹿洞/,
            /格物致知/, /即物穷理/, /知行/, /践履/, /笃行/, /涵养须用敬/, /居敬/,
            /大学章句/, /中庸/, /论语/, /孟子/, /四书/, /五经/, /经书/, /章句/,
            /如何做/, /怎样做/, /如何实行/, /方法/, /步骤/, /次第/, /教我/, /请讲/,
            /讲授/, /讲讲/, /阐释/, /讲解/, /指导/, /治学/, /规矩/, /门径/
        ];
        if (teachingPatterns.some(re => re.test(q))) {
            return "speaking";
        }

        // 3. 侧耳倾听类 (短促探问、在线问讯、招呼)
        const listeningPatterns = [
            /^在[吗么呢]?[？?]?$/, /^听得到[吗么]?[？?]?$/, /^先生在[吗否]?[？?]?$/,
            /^请问[？?]?$/, /^敢问[？?]?$/, /^在不[？?]?$/
        ];
        if (listeningPatterns.some(re => re.test(q))) {
            return "listening";
        }

        // 4. 沉思穷理类 (哲思疑难、本体探究、理气心性、先后辩析、根源追问)
        const thinkingPatterns = [
            /理气/, /理与气/, /气与理/, /先有理/, /先有气/, /孰先孰后/, /先后/,
            /心统性情/, /性情/, /道心/, /人心/, /天命之性/, /气质之性/,
            /太极/, /阴阳/, /万物/, /形而上/, /本体/, /本质/, /奥义/, /奥秘/,
            /为什么/, /为何/, /何以/, /何者/, /何谓/, /怎么理解/, /深层/, /根源/,
            /疑难/, /困惑/, /不解/, /矛盾/, /辩析/, /区别/, /究竟/
        ];
        if (thinkingPatterns.some(re => re.test(q))) {
            return "thinking";
        }

        // 默认较长或严肃提问进入沉思穷理，日常简短互动进入倾听
        if (q.length > 8) {
            return "thinking";
        }
        return "listening";
    }

    // 状态切换 (idle | listening | thinking | speaking | complete)
    setState(state) {
        if (this.currentState === state) return;
        this.currentState = state;

        if (this.boxEl) {
            this.boxEl.classList.remove(
                "state-idle",
                "state-listening",
                "state-thinking",
                "state-speaking",
                "state-complete",
                "avatar-speaking-pulse"
            );
            this.boxEl.classList.add(`state-${state}`);
        }

        // 同步更新顶栏状态指示文字与呼吸微光点
        const labelMap = {
            idle: "待机候教",
            listening: "侧耳倾听",
            thinking: "沉思穷理",
            speaking: "正在讲学",
            complete: "抚须赞许"
        };
        const activeLabel = labelMap[state] || "待机候教";

        if (this.actionTextEl) {
            this.actionTextEl.textContent = activeLabel;
        }

        if (this.liveDotEl) {
            this.liveDotEl.className = `live-dot-pulse ${state}`;
        }

        switch (state) {
            case "listening":
                this.setMood("侧耳倾听");
                this.playStateVideo("listening", true);
                break;
            case "thinking":
                this.setMood("穷理深思");
                this.playStateVideo("thinking", true);
                break;
            case "speaking":
                this.setMood("传道示教");
                if (this.boxEl) this.boxEl.classList.add("avatar-speaking-pulse");
                this.playStateVideo("speaking", true);
                break;
            case "complete":
                this.setMood("答毕赞许");
                this.playStateVideo("complete", false);
                break;
            case "idle":
            default:
                this.setMood("候教");
                this.playStateVideo("idle", true);
                break;
        }
    }

    setMood(moodText) {
        if (this.moodPill) {
            this.moodPill.textContent = `【${moodText}】`;
        }
    }

    // 用户打字事件触发 (即时响应，转入倾听视频)
    onUserTyping() {
        if (this.currentState === "thinking" || this.currentState === "speaking") return;
        this.setState("listening");

        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            if (this.currentState === "listening") {
                this.setState("idle");
            }
        }, 3200);
    }

    // 用户提交问题 (根据提问内容自动选择不同场景动作)
    onUserSubmit(query) {
        clearTimeout(this.typingTimeout);
        clearTimeout(this.completeResetTimeout);
        if (this.streamTransitionTimer) {
            clearTimeout(this.streamTransitionTimer);
            this.streamTransitionTimer = null;
        }

        const action = this.classifyQuestionAction(query);
        this.currentQuestionAction = action;
        this.questionSubmitTime = Date.now();

        if (action === "smile") {
            this.setState("complete");
            this.showSpeechBubble("“善哉！学贵有得，日新又新。贤生聪颖通透，老夫甚为欣慰！”", 4500);
        } else if (action === "speaking") {
            this.setState("speaking");
            if (query.includes("读书") || query.includes("次第")) {
                this.showSpeechBubble("“读书之法：循序渐进，熟读精思。且听老夫层层剖析——”", 4500);
            } else if (query.includes("格物") || query.includes("致知")) {
                this.showSpeechBubble("“致知在格物，即物而穷其理。且听老夫条分缕析——”", 4500);
            } else {
                this.showSpeechBubble("“圣人之学，明体达用。贤生且细听老夫讲来——”", 4500);
            }
        } else if (action === "listening") {
            this.setState("listening");
            this.showSpeechBubble("“后学但讲无妨，老夫正侧耳细听...”", 4000);
        } else {
            // 默认沉思穷理
            this.setState("thinking");
            if (query.includes("理") && query.includes("气")) {
                this.showSpeechBubble("“天地之间，理气常相循也。待老夫从容推究理气孰先孰后...”", 5000);
            } else if (query.includes("心") || query.includes("性")) {
                this.showSpeechBubble("“心统性情，涵养居敬。待老夫为贤生推勘心性之源...”", 5000);
            } else {
                this.showSpeechBubble("“万事皆有理在。且容老夫详审此问义理脉络...”", 5000);
            }
        }
    }

    // AI 生成流式吐字 (自沉思自然过渡至讲述授课视频)
    onTokenStream(token, fullText) {
        const now = Date.now();
        const timeSinceSubmit = now - (this.questionSubmitTime || 0);

        // 如果处于沉思状态，保持至少 1.8 秒深思抚须动作，随后自然过渡到讲学授课
        if (this.currentState === "thinking" && timeSinceSubmit < 1800) {
            if (!this.streamTransitionTimer) {
                this.streamTransitionTimer = setTimeout(() => {
                    this.streamTransitionTimer = null;
                    if (this.currentState === "thinking") {
                        this.setState("speaking");
                    }
                }, Math.max(200, 1800 - timeSinceSubmit));
            }
        } else if (this.currentState !== "speaking" && this.currentState !== "complete") {
            this.setState("speaking");
        }

        // 动态从长文中提取最新一句话放入浮动气泡
        if (fullText && fullText.length > 8) {
            const clean = fullText.replace(/[#*`_]/g, "").trim();
            const sentences = clean.split(/[。！？\n]/).filter(s => s.trim().length >= 4);
            if (sentences.length > 0) {
                const latestSentence = sentences[sentences.length - 1] || sentences[0];
                const snippet = latestSentence.length > 32 ? latestSentence.slice(0, 32) + "..." : latestSentence;
                this.showSpeechBubble(`“${snippet}”`, 3500);
            }
        }
    }

    // 回复生成完成 (转入答毕微笑赞许视频，后平稳回到待机)
    onComplete(fullText) {
        if (this.streamTransitionTimer) {
            clearTimeout(this.streamTransitionTimer);
            this.streamTransitionTimer = null;
        }

        this.setState("complete");
        this.showSpeechBubble("“知行相须，日进高明。贤生可有更深体会？”", 4500);

        // 4.2秒后平稳连贯地恢复候教视频
        clearTimeout(this.completeResetTimeout);
        this.completeResetTimeout = setTimeout(() => {
            if (this.currentState === "complete") {
                this.setState("idle");
            }
        }, 4200);
    }

    // 显示开示浮动气泡
    showSpeechBubble(text, duration = 4000) {
        if (!this.speechBubble) return;
        this.speechBubble.textContent = text;
        this.speechBubble.classList.add("visible");

        clearTimeout(this.bubbleTimeout);
        this.bubbleTimeout = setTimeout(() => {
            this.hideSpeechBubble();
        }, duration);
    }

    hideSpeechBubble() {
        if (this.speechBubble) {
            this.speechBubble.classList.remove("visible");
        }
    }

    // 点击互动：先生开示箴言并抚须微笑致意
    interactClick() {
        if (this.currentState === "thinking" || this.currentState === "speaking") return;

        // 随机求取理学金句
        const quote = this.wisdomQuotes[Math.floor(Math.random() * this.wisdomQuotes.length)];
        this.setState("complete");
        this.setMood("开示箴言");
        this.showSpeechBubble(quote, 5500);

        // 状态 orb 呼吸脉冲
        if (this.statusOrb) {
            this.statusOrb.style.transform = "scale(1.3)";
            setTimeout(() => {
                if (this.statusOrb) this.statusOrb.style.transform = "scale(1)";
            }, 300);
        }

        clearTimeout(this.completeResetTimeout);
        this.completeResetTimeout = setTimeout(() => {
            if (this.currentState === "complete") {
                this.setState("idle");
            }
        }, 4200);
    }

    // 展开/收起
    toggleCollapse() {
        if (!this.paneEl) return;
        this.isCollapsed = !this.isCollapsed;
        if (this.isCollapsed) {
            this.paneEl.classList.add("collapsed");
        } else {
            this.paneEl.classList.remove("collapsed");
        }
    }

    expandIfCollapsed() {
        if (this.paneEl && this.isCollapsed) {
            this.toggleCollapse();
        }
    }

    onResize() {
        // 自适应调整
    }

    setPose(poseName, resetMode = false) {
        if (this.videoAssets[poseName]) {
            this.setState(poseName);
        } else if (this.assets[poseName]) {
            this.onOrbitAngleChange(poseName === "front" ? 270 : poseName === "side" ? 90 : 180);
        }
    }
}

// 挂载全局单例，保持全栈兼容
window.avatar3DEngine = new Avatar3DEngine();
window.avatarEngine = window.avatar3DEngine;
