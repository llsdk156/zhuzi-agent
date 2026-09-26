/**
 * 考亭先生超高清 2.5D / Pseudo-3D 电影级多视角数字人系统 (Avatar Living Engine)
 * 100% 还原角色全案三视图与五大动作 · 支持 360° 多视角拖拽旋转与智能情境自适应
 */

class AvatarLivingEngine {
    constructor() {
        this.container = null;
        this.stageEl = null;
        this.mainImg = null;
        this.angleBadge = null;
        this.hintEl = null;

        this.currentMode = "pose"; // 'pose' | 'orbit'
        this.currentState = "idle";
        this.currentPose = "standing";
        this.currentAngle = 0; // 0 ~ 360 degrees
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartAngle = 0;
        this.orbitTimer = null;
        this.bubbleTimeout = null;
        this.lastTypingTime = 0;
        this.isCollapsed = false;

        // 5大电影级动作姿态资产路径 (全部基于三视图全案 2x 高清重构)
        this.poses = {
            standing: {
                name: "日常站立",
                src: "/static/avatar_living/pose_standing.png",
                mood: "【端坐候教】",
                bubble: "“诸生后学请了！凡有经义疑思，尽直道来。”"
            },
            lecture: {
                name: "讲学授课",
                src: "/static/avatar_living/pose_lecture.png",
                mood: "【进学致知 · 挥卷引路】",
                bubble: "“读书之要，在循序渐进、熟读精思。且听老夫细细讲授！”"
            },
            thinking: {
                name: "思考沉思",
                src: "/static/avatar_living/pose_thinking.png",
                mood: "【穷究道体 · 抚须冥思】",
                bubble: "“万事皆有理在。待老夫穷究此问义理脉络...”"
            },
            explaining: {
                name: "答疑解惑",
                src: "/static/avatar_living/pose_explaining.png",
                mood: "【解难答疑 · 展开卷帙】",
                bubble: "“此间疑窦，正在即物穷理之处。且随老夫层层剖析。”"
            },
            desk: {
                name: "伏案研读",
                src: "/static/avatar_living/pose_desk.png",
                mood: "【伏案秉笔 · 详校卷帙】",
                bubble: "“老夫一生精力，尽在注经考据之中。此章古训尤当切察！”"
            }
        };

        // 360° 旋转视角资产 (4 大主向无缝平滑衔接)
        this.orbitViews = {
            front: "/static/avatar_living/view_front.png",
            side_right: "/static/avatar_living/view_side.png",
            back: "/static/avatar_living/view_back.png",
            side_left: "/static/avatar_living/view_side_left.png"
        };

        // 理学示教箴言金句库
        this.wisdomQuotes = [
            "“问渠那得清如许？为有源头活水来。”",
            "“涵养须用敬，进学在致知。”",
            "“知之愈明，则行之愈笃；行之愈笃，则知之益明。”",
            "“学者须先立志，而后居敬持守，知行相须。”",
            "“万事皆有理在。仁兄手头所处之事，亦即穷理立命之处！”",
            "“读书之法：循序渐进，熟读精思，虚心涵泳，切己体察。”",
            "“人心虚灵不昧，以具众理而应万事。”"
        ];

        // 预加载所有高清资产，确保切换零闪烁
        this.preloadAssets();
    }

    preloadAssets() {
        const urls = [
            ...Object.values(this.poses).map(p => p.src),
            ...Object.values(this.orbitViews)
        ];
        urls.forEach(u => {
            const img = new Image();
            img.src = u;
        });
    }

    init() {
        this.stageEl = document.getElementById("avatar-stage-box");
        this.mainImg = document.getElementById("avatar-main-img");
        this.angleBadge = document.getElementById("orbit-angle-badge");
        this.hintEl = document.getElementById("stage-interaction-hint");

        if (!this.stageEl || !this.mainImg) {
            console.warn("[AvatarLiving] 舞台 DOM 尚未就绪，延迟重试");
            setTimeout(() => this.init(), 100);
            return;
        }

        // 绑定鼠标拖拽 360° 旋转观察
        this.bindOrbitDrag();

        // 绑定 2.5D 鼠标视差微动
        this.bindParallax();

        // 恢复折叠历史记忆
        const savedCollapsed = localStorage.getItem("zhuzi_avatar_collapsed");
        if (savedCollapsed === "true" || (window.innerWidth < 1120 && savedCollapsed !== "false")) {
            this.setCollapsed(true, false);
        }

        console.log("[AvatarLiving] 考亭先生超高清多视角数字人系统加载就绪！");
    }

    // ========================================================
    // 360° 拖拽旋转观察 (Turnaround Orbit)
    // ========================================================
    bindOrbitDrag() {
        if (!this.stageEl) return;

        const onStart = (clientX) => {
            this.isDragging = true;
            this.dragStartX = clientX;
            this.dragStartAngle = this.currentAngle;
            this.switchMode("orbit", false);
            clearTimeout(this.orbitTimer);
            if (this.stageEl) this.stageEl.classList.add("is-dragging");
        };

        const onMove = (clientX) => {
            if (!this.isDragging) return;
            const deltaX = clientX - this.dragStartX;
            // 灵敏度：水平拖拽 250px 旋转 360 度
            const angleDelta = (deltaX / 250) * 360;
            let targetAngle = (this.dragStartAngle + angleDelta) % 360;
            if (targetAngle < 0) targetAngle += 360;

            this.updateOrbitAngle(targetAngle);
        };

        const onEnd = () => {
            if (!this.isDragging) return;
            this.isDragging = false;
            if (this.stageEl) this.stageEl.classList.remove("is-dragging");

            // 停止拖动 3.5 秒后，若处于闲置状态，平滑切回正面问学姿态
            this.orbitTimer = setTimeout(() => {
                if (!this.isDragging && this.currentMode === "orbit") {
                    this.switchMode("pose", true);
                }
            }, 3500);
        };

        // 鼠标事件
        this.stageEl.addEventListener("mousedown", (e) => {
            if (e.target.closest("button") || e.target.closest(".stage-mode-switch-bar")) return;
            onStart(e.clientX);
        });

        window.addEventListener("mousemove", (e) => {
            if (this.isDragging) onMove(e.clientX);
        });

        window.addEventListener("mouseup", () => {
            if (this.isDragging) onEnd();
        });

        // 触摸屏移动端支持
        this.stageEl.addEventListener("touchstart", (e) => {
            if (e.touches.length === 1) {
                if (e.target.closest("button") || e.target.closest(".stage-mode-switch-bar")) return;
                onStart(e.touches[0].clientX);
            }
        }, { passive: true });

        window.addEventListener("touchmove", (e) => {
            if (this.isDragging && e.touches.length === 1) {
                onMove(e.touches[0].clientX);
            }
        }, { passive: true });

        window.addEventListener("touchend", () => {
            if (this.isDragging) onEnd();
        });
    }

    // 更新 360° 旋转角度并自适应切换视角
    updateOrbitAngle(angle) {
        this.currentAngle = Math.round(angle);

        // 确定 4 大象限视图
        // 0° (正面): 315° ~ 360° 或 0° ~ 45°
        // 90° (右侧面): 45° ~ 135°
        // 180° (背面): 135° ~ 225°
        // 270° (左侧面): 225° ~ 315°
        let viewKey = "front";
        let label = `正面 ${this.currentAngle}°`;

        if (this.currentAngle >= 45 && this.currentAngle < 135) {
            viewKey = "side_right";
            label = `右侧面 ${this.currentAngle}°`;
        } else if (this.currentAngle >= 135 && this.currentAngle < 225) {
            viewKey = "back";
            label = `背面 ${this.currentAngle}°`;
        } else if (this.currentAngle >= 225 && this.currentAngle < 315) {
            viewKey = "side_left";
            label = `左侧面 ${this.currentAngle}°`;
        } else {
            viewKey = "front";
            label = `正面 ${this.currentAngle}°`;
        }

        const src = this.orbitViews[viewKey];
        if (this.mainImg && this.mainImg.src !== src && !this.mainImg.src.endsWith(src)) {
            this.mainImg.src = src;
        }

        if (this.angleBadge) {
            this.angleBadge.textContent = label;
            this.angleBadge.style.opacity = "1";
        }
    }

    // 切换模式：'pose' (问学姿态) | 'orbit' (360° 旋转观察)
    switchMode(mode, updateUI = true) {
        this.currentMode = mode;

        const btnPose = document.getElementById("btn-mode-pose");
        const btnOrbit = document.getElementById("btn-mode-orbit");
        if (btnPose && btnOrbit) {
            if (mode === "pose") {
                btnPose.classList.add("active");
                btnOrbit.classList.remove("active");
                if (this.angleBadge) this.angleBadge.style.opacity = "0";
                if (this.hintEl) {
                    this.hintEl.innerHTML = `<span class="hint-3d-tag">高精真容</span> 🖱️ 点击示教 · 拖拽进入 360° 旋转`;
                }
                this.setPose(this.currentPose, false);
            } else {
                btnOrbit.classList.add("active");
                btnPose.classList.remove("active");
                if (this.angleBadge) this.angleBadge.style.opacity = "1";
                if (this.hintEl) {
                    this.hintEl.innerHTML = `<span class="hint-3d-tag">360° 观察</span> 🖱️ 按住左右拖动可全方位审视身姿`;
                }
                this.updateOrbitAngle(this.currentAngle || 0);
            }
        }
    }

    // ========================================================
    // 2.5D 鼠标视差微动 (Parallax Depth Illusion)
    // ========================================================
    bindParallax() {
        window.addEventListener("mousemove", (e) => {
            if (!this.stageEl || this.isDragging) return;
            const rect = this.stageEl.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const normX = Math.max(-1, Math.min(1, (e.clientX - centerX) / (window.innerWidth / 2)));
                const normY = Math.max(-1, Math.min(1, (e.clientY - centerY) / (window.innerHeight / 2)));

                // 2.5D 空间轻微透视倾斜
                const rotY = normX * 4.5;
                const rotX = -normY * 3.0;

                const wrapper = document.getElementById("avatar-living-stage");
                if (wrapper) {
                    wrapper.style.transform = `perspective(750px) rotateY(${rotY}deg) rotateX(${rotX}deg)`;
                }

                // 神光跟随产生景深差
                const aura = document.getElementById("avatar-aura-ring");
                if (aura) {
                    aura.style.transform = `translateX(${normX * 8}px) translateY(${normY * 6}px)`;
                }
            }
        });
    }

    // ========================================================
    // 动作姿态切换与生命周期管理
    // ========================================================
    setPose(poseKey, force = false) {
        if (!this.poses[poseKey]) return;
        this.currentPose = poseKey;

        // 若当前在旋转模式且未强制，则不覆盖旋转画面
        if (this.currentMode === "orbit" && !force) return;

        const p = this.poses[poseKey];
        if (this.mainImg) {
            this.mainImg.classList.add("switching");
            this.mainImg.src = p.src;
            setTimeout(() => {
                if (this.mainImg) this.mainImg.classList.remove("switching");
            }, 180);
        }

        this.setMood(p.mood);
    }

    // 设置状态
    setState(st) {
        this.currentState = st;
        if (this.stageEl) {
            this.stageEl.className = `avatar-stage-box state-${st}`;
        }
        if (st === "idle") {
            this.setPose("standing");
        }
    }

    // 智能语义分类器
    classifyContext(text) {
        if (!text) return { pose: "explaining", mood: "【解难答疑 · 展开卷帙】" };
        const t = text.toLowerCase();
        if (/理与气|理在先|气在后|太极|天理|无极|心统性情|性即理|道体|形而上|天地之性|气质之性|阴阳/.test(t)) {
            return { pose: "thinking", mood: "【穷究道体 · 抚须冥思】" };
        }
        if (/读书|大学|论语|孟子|中庸|格物|致知|循序渐进|熟读精思|涵泳|切己体察|读书之法|课程|方法|计划|学规/.test(t)) {
            return { pose: "lecture", mood: "【进学致知 · 挥卷引路】" };
        }
        if (/人欲|私欲|存天理|慎独|惩忿窒欲|居敬|敬畏|戒勉|浮躁|作弊|怠惰|克己|杂念|修身|反省/.test(t)) {
            return { pose: "standing", mood: "【端正纲纪 · 涵养用敬】" };
        }
        if (/训诂|字句|版本|章句|考证|考据|注释|集注|原文|出处|著述/.test(t)) {
            return { pose: "desk", mood: "【伏案秉笔 · 详校卷帙】" };
        }
        return { pose: "explaining", mood: "【解难答疑 · 展开卷帙】" };
    }

    // 学者打字输入中：身体轻微前倾倾听
    onUserTyping() {
        this.lastTypingTime = Date.now();
        if (this.currentState === "idle") {
            this.currentState = "listening";
            this.setMood("【倾听思索】");
            this.showBubble("“先生正凝神细听诸生之惑...”", 2400);

            setTimeout(() => {
                if (Date.now() - this.lastTypingTime >= 2800 && this.currentState === "listening") {
                    this.currentState = "idle";
                    this.setMood("【端坐候教】");
                }
            }, 3000);
        }
    }

    // 提交问题：根据语义进入思考、讲学或考勘姿态
    onUserSubmit(query) {
        this.switchMode("pose", true);
        const ctx = this.classifyContext(query);
        this.currentState = "thinking";
        this.setPose(ctx.pose);
        this.setMood(ctx.mood);
        const p = this.poses[ctx.pose] || this.poses.thinking;
        this.showBubble(p.bubble, 5000);
    }

    // 流式吐字接收中：讲学与答疑手势交替脉动
    onTokenStream(token, fullText) {
        if (this.currentState !== "speaking") {
            this.currentState = "speaking";
            if (this.currentPose === "thinking") {
                this.setPose("lecture");
            }
        }

        // 遇到重要标点符号时，自发展开金句思想气泡
        if (/[。！？；]/.test(token)) {
            const sentences = fullText.split(/[。！？\n]/).filter(s => s.trim().length > 4);
            if (sentences.length > 0) {
                const latest = sentences[sentences.length - 1].trim();
                if (latest.length <= 32) {
                    this.showBubble(`“${latest}”`, 3500);
                }
            }
        }
    }

    // 生成完成
    onComplete(fullText) {
        this.currentState = "finished";
        this.setMood("【授毕指津】");
        this.showBubble("“理虽在言，工夫却在诸生己身笃行。且细细体察！”", 4500);

        setTimeout(() => {
            if (this.currentState === "finished") {
                this.currentState = "idle";
                this.setPose("standing");
                this.setMood("【端坐候教】");
            }
        }, 5000);
    }

    // 点击示教互动
    interactClick() {
        const quote = this.wisdomQuotes[Math.floor(Math.random() * this.wisdomQuotes.length)];
        this.switchMode("pose", true);
        this.setPose("lecture");
        this.showBubble(quote, 5500);
        this.setMood("【示教开悟】");

        setTimeout(() => {
            if (this.currentState === "idle") {
                this.setPose("standing");
                this.setMood("【端坐候教】");
            }
        }, 5000);

        if (typeof playVoice === "function") {
            const btn = document.getElementById("avatar-interact-btn");
            playVoice(quote, btn);
        }
    }

    // 视口尺寸自适应
    onResize() {
        // 自适应重绘保持
    }

    // 更新情绪标签
    setMood(moodLabel) {
        const pill = document.getElementById("avatar-mood-pill");
        if (pill) {
            pill.textContent = moodLabel;
        }
    }

    // 头顶思想台词气泡
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

    // 舞台收起与展开
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
                    toggleBtn.innerHTML = `<span>▶ 展开讲席</span>`;
                    toggleBtn.title = "展开考亭先生讲席";
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

// 挂载全局实例 (保持与历史代码全方位兼容)
if (typeof window !== "undefined") {
    window.avatarLivingEngine = new AvatarLivingEngine();
    window.avatarEngine = window.avatarLivingEngine;
    window.avatar3DEngine = window.avatarLivingEngine;
}
if (typeof module !== "undefined" && module.exports) {
    module.exports = { AvatarLivingEngine };
}

