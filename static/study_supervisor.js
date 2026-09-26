/**
 * 白鹿督学堂 · 夫子伴学与智能行为视觉督导系统 (Study Supervisor v2.0)
 * 100% 依准参考图2督学规范 · 夫子讲座看书伴读 · 摄像头真实/智能模拟督导 · 语音交互浮窗
 */

class StudySupervisor {
    constructor() {
        // UI DOM Elements
        this.containerEl = null;
        this.masterVideoEl = null;
        this.timerDisplayEl = null;
        this.statusBadgeEl = null;
        this.webcamEl = null;
        this.canvasEl = null;
        this.simCanvasEl = null;
        this.warningBannerEl = null;
        this.warningDescEl = null;
        this.praiseBannerEl = null;
        this.praiseDescEl = null;
        this.reverenceScoreEl = null;
        this.micBtnEl = null;
        this.voiceFeedbackEl = null;
        this.timerToggleBtn = null;
        this.webcamBtn = null;
        this.webcamPlaceholder = null;
        this.pipStatusDot = null;
        this.pipModeLabel = null;
        this.pipFooterTag = null;
        this.voiceModalEl = null;

        // 番茄钟状态
        this.totalDurationSeconds = 45 * 60; // 默认 45 分钟自习
        this.remainingSeconds = 45 * 60;
        this.timerInterval = null;
        this.isStudying = false;
        this.isPaused = false;

        // 督学统计与评分
        this.distractionCount = 0;
        this.reverenceScore = 100;
        this.distractionHistory = [];

        // 真实物理摄像头与视觉检测 (仅关注看到学者本人在现实中的自习状态)
        this.webcamStream = null;
        this.isCameraActive = false;
        this.isSimulationActive = false;
        this.simAnimId = null;
        this.simTick = 0;
        this.detectionInterval = null;
        this.headDownFrames = 0;
        this.awayFrames = 0;
        this.lastWarningTime = 0;

        // 语音识别 (ASR)
        this.recognition = null;
        this.isListening = false;

        // 修省抽屉
        this.isDrawerOpen = false;

        this.init();
    }

    init() {
        this.containerEl = document.getElementById("supervisor-stage-wrap");
        this.masterVideoEl = document.getElementById("supervisor-master-video");
        this.timerDisplayEl = document.getElementById("supervisor-timer-text");
        this.statusBadgeEl = document.getElementById("supervisor-status-pill");
        this.webcamEl = document.getElementById("supervisor-webcam-feed");
        this.canvasEl = document.getElementById("supervisor-cv-canvas");
        this.simCanvasEl = document.getElementById("supervisor-sim-canvas");
        this.warningBannerEl = document.getElementById("supervisor-warning-banner");
        this.warningDescEl = document.getElementById("supervisor-warning-desc");
        this.praiseBannerEl = document.getElementById("supervisor-praise-banner");
        this.praiseDescEl = document.getElementById("supervisor-praise-desc");
        this.reverenceScoreEl = document.getElementById("supervisor-score-val");
        this.micBtnEl = document.getElementById("supervisor-mic-btn");
        this.voiceFeedbackEl = document.getElementById("supervisor-voice-text");
        this.timerToggleBtn = document.getElementById("timer-toggle-btn");
        this.webcamBtn = document.getElementById("webcam-btn");
        this.webcamPlaceholder = document.getElementById("webcam-placeholder");
        this.pipStatusDot = document.getElementById("pip-status-dot");
        this.pipModeLabel = document.getElementById("pip-mode-label");
        this.pipFooterTag = document.getElementById("pip-footer-tag");
        this.voiceModalEl = document.getElementById("voice-interaction-modal");

        // 确保夫子案前看书伴读视频静音顺畅播放
        if (this.masterVideoEl) {
            this.masterVideoEl.muted = true;
            this.masterVideoEl.play().catch(() => {});
        }

        // 初始化语音识别引擎 (Web Speech API)
        this.initSpeechRecognition();
    }

    // 初始化语音识别
    initSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.log("[Supervisor] 浏览器未内置 Web Speech API，使用古雅语音请益浮窗");
            return;
        }

        try {
            this.recognition = new SpeechRecognition();
            this.recognition.lang = "zh-CN";
            this.recognition.continuous = false;
            this.recognition.interimResults = false;

            this.recognition.onstart = () => {
                this.isListening = true;
                if (this.micBtnEl) this.micBtnEl.classList.add("recording");
                const micLabel = document.getElementById("supervisor-mic-label");
                if (micLabel) micLabel.textContent = "正在聆听中...";
                this.showVoiceFeedback("🎤 正在聆听仁兄所言...");
            };

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                console.log("[Supervisor ASR] 识别学者语音:", transcript);
                this.handleVoiceQuery(transcript);
            };

            this.recognition.onerror = (e) => {
                console.warn("[Supervisor ASR] 语音识别提示:", e.error);
                this.isListening = false;
                if (this.micBtnEl) this.micBtnEl.classList.remove("recording");
                const micLabel = document.getElementById("supervisor-mic-label");
                if (micLabel) micLabel.textContent = "语音汇报";

                // 若网络受限，自动开启古典语音交互浮窗
                if (e.error === 'network' || e.error === 'not-allowed') {
                    this.openVoiceModal();
                }
            };

            this.recognition.onend = () => {
                this.isListening = false;
                if (this.micBtnEl) this.micBtnEl.classList.remove("recording");
                const micLabel = document.getElementById("supervisor-mic-label");
                if (micLabel) micLabel.textContent = "语音汇报";
            };
        } catch (err) {
            console.warn("[Supervisor ASR] 初始化异常:", err);
        }
    }

    // 触发语音识别麦克风
    toggleVoiceInput() {
        if (!this.recognition) {
            this.openVoiceModal();
            return;
        }

        if (this.isListening) {
            this.recognition.stop();
        } else {
            try {
                this.recognition.start();
            } catch (err) {
                // 如果启动抛错，优雅降级为交互浮窗
                this.openVoiceModal();
            }
        }
    }

    // 打开语音问学浮窗
    openVoiceModal() {
        if (!this.voiceModalEl) this.voiceModalEl = document.getElementById("voice-interaction-modal");
        if (this.voiceModalEl) {
            this.voiceModalEl.style.display = "flex";
            const input = document.getElementById("voice-modal-text-input");
            if (input) setTimeout(() => input.focus(), 100);
        }
    }

    // 关闭语音问学浮窗
    closeVoiceModal() {
        if (this.voiceModalEl) {
            this.voiceModalEl.style.display = "none";
        }
    }

    // 从浮窗提交快捷词条
    submitVoiceModalQuery(text) {
        this.closeVoiceModal();
        this.handleVoiceQuery(text);
    }

    // 从浮窗提交自定义文本
    submitVoiceModalText() {
        const input = document.getElementById("voice-modal-text-input");
        if (input && input.value.trim()) {
            const val = input.value.trim();
            input.value = "";
            this.closeVoiceModal();
            this.handleVoiceQuery(val);
        }
    }

    // 语音交互处理与夫子回答 (同时在右侧对话框呈现流式论道与语音朗读)
    handleVoiceQuery(query) {
        if (!query || !query.trim()) return;
        const q = query.trim();
        this.showVoiceFeedback(`仁兄呈报：“${q}”`);

        // 1. 同步将语音问题发送至右侧【白鹿督学·独立对话流】中完整呈现
        if (window.sendQuery) {
            window.sendQuery('plan', q);
        }

        // 2. 夫子案头气泡提点
        let reply = "“学者善进！凡有读书得失，老夫在此随时开导。”";
        if (/读完|看完了|完成了|读好了|第一节/.test(q)) {
            reply = "“善哉！小立课程，微加积叠。且闭目静思片刻，方可翻入下一篇章。”";
            this.reverenceScore = Math.min(100, this.reverenceScore + 3);
            this.updateScoreDisplay();
            this.setMasterState("praise", "功课严谨，已记积功！且涵泳深思！");
        } else if (/还有多[长久少]|时间|进度/.test(q)) {
            const min = Math.ceil(this.remainingSeconds / 60);
            reply = `“本节研学尚余约 ${min} 分钟，贤生且收敛心神，切勿懈怠迁延。”`;
        } else if (/心烦|浮躁|静不下来|学不进去/.test(q)) {
            reply = "“涵养须用敬！学者先须整齐严肃，正衣冠，尊瞻视。心中杂念自当冰消瓦解。”";
            this.triggerMasterWarning("drowsy", "先生警语：涵养须用敬，整齐严肃！");
        } else if (/考校|背诵|要义/.test(q)) {
            reply = "“善！《大学》之书，首在三纲八目。试问何谓‘明明德’？仁兄当默诵三遍，切己体察。”";
        }

        const bubbleEl = document.getElementById("supervisor-speech-bubble");
        if (bubbleEl) {
            bubbleEl.textContent = reply;
            bubbleEl.style.opacity = "1";
        }

        // 3. 语音播放夫子点拨
        if (window.playVoiceByText) {
            window.playVoiceByText(reply, "yunjian");
        }
    }

    showVoiceFeedback(text) {
        if (this.voiceFeedbackEl) {
            this.voiceFeedbackEl.textContent = text;
            this.voiceFeedbackEl.style.opacity = "1";
        }
    }

    // 设定自习时长 (分钟) 并切换选项药丸高亮
    setDuration(minutes, pillEl) {
        if (this.isStudying) return;
        this.totalDurationSeconds = minutes * 60;
        this.remainingSeconds = this.totalDurationSeconds;
        this.updateTimerDisplay();

        if (pillEl) {
            document.querySelectorAll("#view-plan .preset-pill").forEach(p => p.classList.remove("active"));
            pillEl.classList.add("active");
        }
    }

    // 开启/停止自习伴学
    toggleStudy() {
        if (this.isStudying) {
            this.finishStudySession();
        } else {
            this.startStudy();
        }
    }

    // 开启自习
    startStudy() {
        this.isStudying = true;
        this.isPaused = false;

        const toggleBtn = document.getElementById("timer-toggle-btn");
        if (toggleBtn) {
            toggleBtn.innerHTML = `<span id="timer-toggle-icon">■</span> <span id="timer-toggle-label">结束自习</span>`;
            toggleBtn.className = "timer-action-btn complete-btn";
        }

        // 1. 若物理摄像头未开启，提示学者可开启摄像头让夫子在现实中看到本人
        if (!this.isCameraActive && !this.isSimulationActive) {
            this.showVoiceFeedback("▶ 自习已开启！仁兄可开启摄像头，让夫子在现实中看到您端正坐姿！");
        }

        // 2. 夫子案前伴读状态 (大屏视频循环播放)
        this.setMasterState("reading");

        // 3. 倒计时循环
        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            if (this.isPaused) return;

            if (this.remainingSeconds > 0) {
                this.remainingSeconds--;
                this.updateTimerDisplay();
            } else {
                this.finishStudySession();
            }
        }, 1000);

        if (this.statusBadgeEl) {
            this.statusBadgeEl.textContent = "● 考亭夫子案前伴读督学中";
            this.statusBadgeEl.className = "strip-status-pill active";
        }

        this.showVoiceFeedback("“后学入席！老夫于此端坐伴读。四十五分之内，毋得懈弛心猿！”");
    }

    // 暂停/继续
    pauseStudy() {
        if (!this.isStudying) return;
        this.isPaused = !this.isPaused;
        if (this.statusBadgeEl) {
            this.statusBadgeEl.textContent = this.isPaused ? "● 自习小憩暂歇中" : "● 考亭夫子案前伴读督学中";
            this.statusBadgeEl.className = this.isPaused ? "strip-status-pill paused" : "strip-status-pill active";
        }
    }

    // 重置自习
    resetStudy() {
        clearInterval(this.timerInterval);
        this.isStudying = false;
        this.isPaused = false;
        this.remainingSeconds = this.totalDurationSeconds;
        this.updateTimerDisplay();

        const toggleBtn = document.getElementById("timer-toggle-btn");
        if (toggleBtn) {
            toggleBtn.innerHTML = `<span id="timer-toggle-icon">▶</span> <span id="timer-toggle-label">开启自习伴学</span>`;
            toggleBtn.className = "timer-action-btn primary";
        }

        if (this.statusBadgeEl) {
            this.statusBadgeEl.textContent = "● 待开启自习伴学";
            this.statusBadgeEl.className = "strip-status-pill";
        }

        this.setMasterState("reading");
    }

    // 结束并出具评卷
    finishStudySession() {
        clearInterval(this.timerInterval);
        this.isStudying = false;

        const toggleBtn = document.getElementById("timer-toggle-btn");
        if (toggleBtn) {
            toggleBtn.innerHTML = `<span id="timer-toggle-icon">▶</span> <span id="timer-toggle-label">开启自习伴学</span>`;
            toggleBtn.className = "timer-action-btn primary";
        }

        this.setMasterState("praise", "功课圆满完成！贤生笃学有恒，老夫深感欣慰！");
        if (this.statusBadgeEl) {
            this.statusBadgeEl.textContent = "● 功课圆满完成";
            this.statusBadgeEl.className = "strip-status-pill complete";
        }

        // 弹出白鹿洞督考评卷
        this.showStudyCompletionModal();
    }

    // 切换真实物理摄像头开启/关闭 (看到学者本人在现实中自习)
    async toggleCamera() {
        if (this.isCameraActive) {
            this.stopWebcamInspection();
            this.updateVisionUI();
            this.showVoiceFeedback("📷 物理摄像头已关闭");
        } else {
            this.stopSimulation();
            const success = await this.startRealCamera();
            if (!success) {
                this.updateVisionUI();
            }
        }
    }

    // 尝试开启真实物理摄像头 (获取学者本人在现实中的自习画面)
    async startRealCamera() {
        const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
        if (!window.isSecureContext && !isLocal) {
            this.showInsecureContextModal("摄像头");
            return false;
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            this.showInsecureContextModal("摄像头");
            return false;
        }

        // 设备前置探测：检查电脑是否安装/插入物理摄像头硬件
        if (navigator.mediaDevices.enumerateDevices) {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(d => d.kind === 'videoinput');
                if (videoDevices.length === 0) {
                    this.showCameraNotFoundModal();
                    return false;
                }
            } catch (devErr) {
                console.log("[Supervisor Camera] 设备探测跳过:", devErr.message);
            }
        }

        try {
            let stream = null;
            // 依次降级尝试不同摄像头参数，保证绝大多数物理摄像头均能成功启动
            const constraintOptions = [
                { video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" }, audio: false },
                { video: { facingMode: "user" }, audio: false },
                { video: true, audio: false }
            ];

            for (const option of constraintOptions) {
                try {
                    stream = await navigator.mediaDevices.getUserMedia(option);
                    if (stream) break;
                } catch (e) {
                    console.log("[Supervisor Camera] 尝试约束降级:", e.message);
                }
            }

            if (!stream) {
                throw new Error("无法从浏览器获取摄像头视频流");
            }

            this.webcamStream = stream;
            if (this.webcamEl) {
                this.webcamEl.srcObject = this.webcamStream;
                await this.webcamEl.play();
                this.webcamEl.style.display = "block";
            }

            if (this.simCanvasEl) this.simCanvasEl.style.display = "none";
            if (this.webcamPlaceholder) this.webcamPlaceholder.style.display = "none";

            this.isCameraActive = true;
            this.isSimulationActive = false;

            if (this.webcamBtn) {
                this.webcamBtn.textContent = "⏹️ 关闭摄像头";
                this.webcamBtn.classList.add("active");
            }
            if (this.pipStatusDot) this.pipStatusDot.className = "live-dot-green";
            if (this.pipModeLabel) this.pipModeLabel.textContent = "学者本人现实镜头";
            if (this.pipFooterTag) this.pipFooterTag.textContent = "🔒 夫子正在现实中看着仁兄 · 严谨自习中";

            // 监听摄像头意外断开
            const track = stream.getVideoTracks()[0];
            if (track) {
                track.onended = () => {
                    this.stopWebcamInspection();
                    this.updateVisionUI();
                };
            }

            // 启动本地帧分析循环 (每 1.2 秒检测一次学者坐姿)
            clearInterval(this.detectionInterval);
            this.detectionInterval = setInterval(() => {
                this.analyzeStudentBehavior();
            }, 1200);

            this.showVoiceFeedback("📷 物理摄像头连接成功！夫子正在现实中看着仁兄，请居敬持志、端正坐姿！");
            console.log("✔ 本地物理摄像头视觉督导通道就绪");
            return true;
        } catch (err) {
            console.warn("[Supervisor Vision] 真实摄像头未能启动:", err);
            const isNotFound = err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError' || (err.message && (err.message.includes('not found') || err.message.includes('No video') || err.message.includes('无法从浏览器')));
            const isDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
            const isBusy = err.name === 'NotReadableError' || err.name === 'TrackStartError';

            if (isNotFound) {
                this.showCameraNotFoundModal();
            } else if (isDenied) {
                this.showCameraPermissionModal();
            } else if (isBusy) {
                this.showCameraBusyModal();
            } else {
                this.showCameraNotFoundModal(err.message);
            }
            return false;
        }
    }

    // 停止真实物理摄像头
    stopWebcamInspection() {
        clearInterval(this.detectionInterval);
        if (this.webcamStream) {
            this.webcamStream.getTracks().forEach(track => track.stop());
            this.webcamStream = null;
        }
        if (this.webcamEl) {
            this.webcamEl.srcObject = null;
            this.webcamEl.style.display = "none";
        }
        this.isCameraActive = false;
        if (this.webcamBtn) {
            this.webcamBtn.textContent = "📷 开启摄像头";
            this.webcamBtn.classList.remove("active");
        }
    }

    // 停止模拟动画
    stopSimulation() {
        this.isSimulationActive = false;
        cancelAnimationFrame(this.simAnimId);
        if (this.simCanvasEl) {
            this.simCanvasEl.style.display = "none";
        }
    }

    // 启动智能伴学模拟视窗 (仅作无物理摄像头时的备用)
    startSmartSimulation(showNotice = false) {
        this.stopWebcamInspection();
        this.isSimulationActive = true;
        this.isCameraActive = false;

        if (this.webcamEl) this.webcamEl.style.display = "none";
        if (this.webcamPlaceholder) this.webcamPlaceholder.style.display = "none";

        if (this.simCanvasEl) {
            this.simCanvasEl.style.display = "block";
            this.startSimulationAnimation();
        }

        if (this.webcamBtn) {
            this.webcamBtn.textContent = "📷 开启摄像头";
            this.webcamBtn.classList.remove("active");
        }
        if (this.pipStatusDot) this.pipStatusDot.className = "live-dot-amber";
        if (this.pipModeLabel) this.pipModeLabel.textContent = "智能伴学模拟视窗";
        if (this.pipFooterTag) this.pipFooterTag.textContent = "💡 智能模拟伴学 · 姿态心性实时评估";

        if (showNotice) {
            this.showVoiceFeedback("💡 已为仁兄开启【智能伴学模拟视窗】");
        }
    }

    // 启动智能模拟伴学 Canvas 动画
    startSimulationAnimation() {
        if (!this.simCanvasEl) return;
        const canvas = this.simCanvasEl;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        cancelAnimationFrame(this.simAnimId);

        const render = () => {
            if (!this.isSimulationActive) return;
            this.simTick += 0.04;

            const w = canvas.width;
            const h = canvas.height;

            // 1. 古典书斋书案背景
            ctx.fillStyle = "#0c1322";
            ctx.fillRect(0, 0, w, h);

            // 2. 案头书灯温润暖光
            const lampGlow = ctx.createRadialGradient(50, 45, 5, 60, 50, 90);
            lampGlow.addColorStop(0, "rgba(254, 240, 138, 0.45)");
            lampGlow.addColorStop(0.6, "rgba(245, 158, 11, 0.15)");
            lampGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
            ctx.fillStyle = lampGlow;
            ctx.fillRect(0, 0, w, h);

            // 3. 古典木质书案
            ctx.fillStyle = "#291508";
            ctx.fillRect(10, h - 32, w - 20, 24);
            ctx.fillStyle = "#451a03";
            ctx.fillRect(10, h - 32, w - 20, 3);

            // 4. 案头翻开的典籍与毛笔架
            ctx.fillStyle = "#fefce8";
            ctx.fillRect(35, h - 28, 48, 14);
            ctx.strokeStyle = "#b45309";
            ctx.lineWidth = 1;
            ctx.strokeRect(35, h - 28, 48, 14);

            // 5. 学者伏案坐姿剪影与呼吸律动
            const breathOffset = Math.sin(this.simTick) * 2;
            ctx.save();
            ctx.translate(w / 2 + 10, h - 20 + breathOffset);

            // 衣服躯干
            ctx.fillStyle = "#1e293b";
            ctx.beginPath();
            ctx.ellipse(0, -32, 28, 36, 0, 0, Math.PI * 2);
            ctx.fill();

            // 儒生方巾与头部
            ctx.fillStyle = "#0f172a";
            ctx.beginPath();
            ctx.arc(0, -78, 15, 0, Math.PI * 2);
            ctx.fill();

            // 方巾折角
            ctx.fillRect(-12, -94, 24, 8);

            // 双手捧卷
            ctx.fillStyle = "#334155";
            ctx.beginPath();
            ctx.ellipse(-14, -20, 8, 12, -0.4, 0, Math.PI * 2);
            ctx.ellipse(14, -20, 8, 12, 0.4, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();

            // 6. HUD 督学状态数据层
            ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
            ctx.fillRect(8, 8, w - 16, 22);
            ctx.strokeStyle = "rgba(197, 155, 76, 0.4)";
            ctx.strokeRect(8, 8, w - 16, 22);

            ctx.font = "10.5px 'Noto Serif SC', serif";
            ctx.fillStyle = "#86efac";
            ctx.fillText("● 坐姿端正 · 居敬持志", 16, 23);

            ctx.fillStyle = "#fef08a";
            ctx.fillText("专注度 98%", w - 74, 23);

            this.simAnimId = requestAnimationFrame(render);
        };

        render();
    }

    // 关闭一切视觉
    stopAllVision() {
        this.stopWebcamInspection();
        this.stopSimulation();
        this.updateVisionUI();
    }

    // 更新视窗 UI 状态
    updateVisionUI() {
        if (!this.isCameraActive && !this.isSimulationActive) {
            if (this.webcamEl) this.webcamEl.style.display = "none";
            if (this.simCanvasEl) this.simCanvasEl.style.display = "none";
            if (this.webcamPlaceholder) this.webcamPlaceholder.style.display = "flex";

            if (this.webcamBtn) {
                this.webcamBtn.textContent = "📷 开启摄像头";
                this.webcamBtn.classList.remove("active");
            }
            if (this.pipStatusDot) this.pipStatusDot.className = "live-dot-green";
            if (this.pipModeLabel) this.pipModeLabel.textContent = "学者本人自习视窗";
            if (this.pipFooterTag) this.pipFooterTag.textContent = "🔒 本地AI督导 · 现实中看到学者本人 · 防玩手机/防离席";
        }
    }

    // 显示非安全域 (LAN IP) 切换提示弹窗
    showInsecureContextModal(featureName = "摄像头") {
        const oldModal = document.getElementById("insecure-context-modal");
        if (oldModal) oldModal.remove();

        const currentOrigin = window.location.origin;
        const modalHtml = `
            <div class="modal-overlay" id="insecure-context-modal" style="display:flex; z-index:9999;">
                <div class="ancient-modal-card" style="max-width: 520px; text-align: left; padding: 24px;">
                    <div class="modal-seal-badge">浏览器安全策略提示</div>
                    <h3 style="font-family: var(--font-serif); color: #991b1b; margin-top: 8px; font-size: 18px;">
                        🛡️ 浏览器${featureName}权限说明
                    </h3>
                    <div style="font-size: 13.5px; line-height: 1.7; color: #334155; margin: 14px 0 18px;">
                        <p>现代主流浏览器（Chrome、Edge 等）出于保护系统安全与隐私的严格规范（Secure Contexts），<strong>仅允许在本地安全地址（127.0.0.1 或 localhost）</strong>调用物理摄像头硬件。</p>
                        <div style="margin-top: 10px; background: #fff7ed; border-left: 3px solid #f97316; padding: 10px 14px; border-radius: 6px; font-size: 12.5px;">
                            📌 当前访问地址：<code style="background:#fed7aa; padding:2px 6px; border-radius:3px;">${currentOrigin}</code><br>
                            只需点击下方按钮，一键切换至 <strong>127.0.0.1</strong> 安全地址访问，即可<strong>直接开启物理摄像头，让夫子在现实中看到仁兄</strong>！
                        </div>
                    </div>
                    <div style="display:flex; gap:12px; justify-content:flex-end;">
                        <button class="modal-close-btn-clean" onclick="document.getElementById('insecure-context-modal').remove()" style="padding:7px 16px; border-radius:6px; border:1px solid #cbd5e1; background:#f1f5f9; cursor:pointer;">
                            暂不切换
                        </button>
                        <a href="http://127.0.0.1:8000/#plan" style="padding:7px 18px; border-radius:6px; background:#b91c1c; color:#ffffff; font-weight:600; text-decoration:none; display:inline-flex; align-items:center; gap:6px;">
                            🚀 一键切换至 127.0.0.1 开启摄像头
                        </a>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML("beforeend", modalHtml);
    }

    // 未检测到硬件物理摄像头提示弹窗
    showCameraNotFoundModal(extraMsg = "") {
        const oldModal = document.getElementById("camera-diag-modal");
        if (oldModal) oldModal.remove();

        const modalHtml = `
            <div class="modal-overlay" id="camera-diag-modal" style="display:flex; z-index:9999;">
                <div class="ancient-modal-card" style="max-width: 520px; text-align: left; padding: 24px;">
                    <div class="modal-seal-badge" style="background:#b45309;">硬件诊断说明</div>
                    <h3 style="font-family: var(--font-serif); color: #78350f; margin-top: 8px; font-size: 18px; display:flex; align-items:center; gap:8px;">
                        📷 未检测到电脑物理摄像头设备
                    </h3>
                    <div style="font-size: 13.5px; line-height: 1.7; color: #334155; margin: 14px 0 18px;">
                        <p>当前电脑（台式机或外接屏）<strong>未插接外置 USB 摄像头或没有物理前置镜头</strong>，因此浏览器无法读取到现实中的自习画面。</p>
                        <div style="margin-top: 10px; background: #fefce8; border: 1px solid #fef08a; border-left: 3px solid #ca8a04; padding: 10px 14px; border-radius: 6px; font-size: 13px;">
                            <strong>💡 夫子圆融之策（无需硬件即可研习）：</strong><br>
                            仁兄可一键开启<strong>【智能模拟伴学】</strong>！系统将以智能模拟姿态伴读，45分钟自习专注、敬业日课打卡、朱子考校对答<strong>全部 100% 完整可用</strong>！
                        </div>
                        <div style="margin-top: 10px; font-size: 12px; color: #64748b;">
                            📌 若仁兄确实想在现实中看到自己：只需插入任意外置 USB 摄像头设备，或使用手机摄像头连接即可。
                        </div>
                    </div>
                    <div style="display:flex; gap:10px; justify-content:flex-end;">
                        <button onclick="document.getElementById('camera-diag-modal').remove()" style="padding:7px 16px; border-radius:6px; border:1px solid #cbd5e1; background:#f1f5f9; cursor:pointer; font-family:var(--font-serif);">
                            暂不开启
                        </button>
                        <button onclick="document.getElementById('camera-diag-modal').remove(); studySupervisor.startSmartSimulation();" style="padding:7px 18px; border-radius:6px; background:#16a34a; color:#ffffff; font-weight:600; border:none; cursor:pointer; font-family:var(--font-serif); display:inline-flex; align-items:center; gap:6px;">
                            💡 立即开启智能模拟伴学
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML("beforeend", modalHtml);

        // 同步更新占位小视窗文本，贴心指引学者
        const subEl = document.getElementById("webcam-placeholder-sub");
        if (subEl) subEl.textContent = "未检测到物理摄像头 · 点击【模拟伴学】即可开启";
    }

    // 浏览器权限被阻止提示
    showCameraPermissionModal() {
        const oldModal = document.getElementById("camera-diag-modal");
        if (oldModal) oldModal.remove();

        const modalHtml = `
            <div class="modal-overlay" id="camera-diag-modal" style="display:flex; z-index:9999;">
                <div class="ancient-modal-card" style="max-width: 520px; text-align: left; padding: 24px;">
                    <div class="modal-seal-badge" style="background:#dc2626;">权限指引</div>
                    <h3 style="font-family: var(--font-serif); color: #991b1b; margin-top: 8px; font-size: 18px;">
                        🚫 摄像头访问权限被禁止
                    </h3>
                    <div style="font-size: 13.5px; line-height: 1.7; color: #334155; margin: 14px 0 18px;">
                        <p>浏览器阻止了本页面读取物理摄像头。请按以下简易步骤解封：</p>
                        <div style="margin-top: 10px; background: #fef2f2; border: 1px solid #fecaca; border-left: 3px solid #ef4444; padding: 10px 14px; border-radius: 6px; font-size: 13px;">
                            1. 点击浏览器顶部地址栏最左侧的 <strong>🔒 图标（或权限设置图标）</strong>；<br>
                            2. 找到<strong>【摄像头】</strong>选项，将其切换为<strong>【允许】</strong>；<br>
                            3. 按键盘 <strong>F5</strong> 刷新页面即可生效！
                        </div>
                    </div>
                    <div style="display:flex; gap:10px; justify-content:flex-end;">
                        <button onclick="document.getElementById('camera-diag-modal').remove()" style="padding:7px 16px; border-radius:6px; border:1px solid #cbd5e1; background:#f1f5f9; cursor:pointer; font-family:var(--font-serif);">
                            稍后设置
                        </button>
                        <button onclick="document.getElementById('camera-diag-modal').remove(); studySupervisor.startSmartSimulation();" style="padding:7px 18px; border-radius:6px; background:#16a34a; color:#fff; border:none; cursor:pointer; font-family:var(--font-serif);">
                            💡 先用智能模拟伴学
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML("beforeend", modalHtml);
    }

    // 摄像头被占用提示
    showCameraBusyModal() {
        const oldModal = document.getElementById("camera-diag-modal");
        if (oldModal) oldModal.remove();

        const modalHtml = `
            <div class="modal-overlay" id="camera-diag-modal" style="display:flex; z-index:9999;">
                <div class="ancient-modal-card" style="max-width: 520px; text-align: left; padding: 24px;">
                    <div class="modal-seal-badge" style="background:#d97706;">设备冲突</div>
                    <h3 style="font-family: var(--font-serif); color: #b45309; margin-top: 8px; font-size: 18px;">
                        ⚠️ 摄像头正被其他软件占用
                    </h3>
                    <div style="font-size: 13.5px; line-height: 1.7; color: #334155; margin: 14px 0 18px;">
                        <p>系统摄像头正在被微信视频、腾讯会议、钉钉或系统相机独占，请先关闭其他视频软件，然后点击重试。</p>
                    </div>
                    <div style="display:flex; gap:10px; justify-content:flex-end;">
                        <button onclick="document.getElementById('camera-diag-modal').remove(); studySupervisor.startRealCamera();" style="padding:7px 18px; border-radius:6px; background:#16a34a; color:#fff; border:none; cursor:pointer; font-family:var(--font-serif);">
                            🔄 重新尝试连接
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML("beforeend", modalHtml);
    }

    // 本地视觉帧分析 (真实摄像头下判定低头/玩手机/离席)
    analyzeStudentBehavior() {
        if (!this.webcamEl || !this.canvasEl || !this.isCameraActive) return;
        const ctx = this.canvasEl.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        this.canvasEl.width = 160;
        this.canvasEl.height = 120;
        ctx.drawImage(this.webcamEl, 0, 0, 160, 120);

        try {
            const frame = ctx.getImageData(0, 0, 160, 120);
            const data = frame.data;

            let totalLum = 0;
            let upperLum = 0;
            let lowerLum = 0;

            for (let i = 0; i < data.length; i += 16) {
                const r = data[i], g = data[i+1], b = data[i+2];
                const lum = 0.299 * r + 0.587 * g + 0.114 * b;
                totalLum += lum;
                const y = Math.floor(i / (160 * 4));
                if (y < 60) upperLum += lum;
                else lowerLum += lum;
            }

            const isDarkOrAway = (totalLum / (data.length / 16)) < 15;
            const headDropRatio = lowerLum / (upperLum + 1);

            const now = Date.now();
            if (now - this.lastWarningTime < 9000) return;

            // 1. 低头玩手机特征判定
            if (headDropRatio > 1.85) {
                this.headDownFrames++;
                if (this.headDownFrames >= 3) {
                    this.triggerMasterWarning("phone", "夫子警示：学者莫低头把玩机巧之物！当正襟危坐、涵养求益！");
                    this.headDownFrames = 0;
                }
            } else {
                this.headDownFrames = Math.max(0, this.headDownFrames - 1);
            }

            // 2. 擅自离席特征判定
            if (isDarkOrAway) {
                this.awayFrames++;
                if (this.awayFrames >= 4) {
                    this.triggerMasterWarning("away", "夫子警示：案前虚位！学者擅离讲筵，工夫何以相续？");
                    this.awayFrames = 0;
                }
            } else {
                this.awayFrames = Math.max(0, this.awayFrames - 1);
            }
        } catch (e) {
            // 忽略跨域像素安全错误
        }
    }

    // 触发夫子严肃警省 (戒尺微叩，语音训勉)
    triggerMasterWarning(reasonType, message) {
        this.lastWarningTime = Date.now();
        this.distractionCount++;
        this.reverenceScore = Math.max(40, this.reverenceScore - 6);
        this.updateScoreDisplay();

        this.distractionHistory.push({
            time: new Date().toLocaleTimeString(),
            reason: reasonType === "phone" ? "低头玩手机/心驰外物" : "擅离书案/注意力脱离"
        });

        // 1. 夫子警示状态浮层 (视觉温和诫勉，不突兀惊扰读书)
        this.setMasterState("stern", message);
    }

    // 模拟测试分心提醒
    simulateDistractionTest(reason = "phone") {
        if (reason === "phone") {
            this.triggerMasterWarning("phone", "夫子警省：学者莫低头把玩机巧之物！居敬持志，收敛心神！");
        } else {
            this.triggerMasterWarning("away", "夫子警省：案前虚位！学者离席心散，工夫何以相继？");
        }
    }

    // 设置夫子伴学状态 (确保大屏伴读视频始终顺畅播放，浮层提示不遮挡核心画面)
    setMasterState(stateName, customText = "") {
        // 确保视频持续播放
        if (this.masterVideoEl) {
            this.masterVideoEl.style.display = "block";
            this.masterVideoEl.play().catch(() => {});
        }

        if (stateName === "stern") {
            if (this.warningBannerEl) {
                if (this.warningDescEl && customText) this.warningDescEl.textContent = customText;
                this.warningBannerEl.style.display = "flex";
                setTimeout(() => {
                    if (this.warningBannerEl) this.warningBannerEl.style.display = "none";
                }, 4500);
            }
        } else if (stateName === "praise") {
            if (this.praiseBannerEl) {
                if (this.praiseDescEl && customText) this.praiseDescEl.textContent = customText;
                this.praiseBannerEl.style.display = "flex";
                setTimeout(() => {
                    if (this.praiseBannerEl) this.praiseBannerEl.style.display = "none";
                }, 4500);
            }
        } else {
            if (this.warningBannerEl) this.warningBannerEl.style.display = "none";
            if (this.praiseBannerEl) this.praiseBannerEl.style.display = "none";
        }
    }

    // 折叠/展开修省笔记抽屉
    toggleReflectionDrawer() {
        const drawer = document.getElementById("compact-reflection-drawer");
        const btn = document.getElementById("reflection-drawer-btn");
        if (!drawer) return;

        this.isDrawerOpen = !this.isDrawerOpen;
        drawer.style.display = this.isDrawerOpen ? "block" : "none";
        if (btn) btn.textContent = this.isDrawerOpen ? "收起 ▴" : "记一笔 ▾";
        if (this.isDrawerOpen) {
            const textarea = document.getElementById("reflection-text");
            if (textarea) setTimeout(() => textarea.focus(), 80);
        }
    }

    updateTimerDisplay() {
        if (!this.timerDisplayEl) return;
        const m = Math.floor(this.remainingSeconds / 60);
        const s = this.remainingSeconds % 60;
        this.timerDisplayEl.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }

    updateScoreDisplay() {
        if (this.reverenceScoreEl) {
            this.reverenceScoreEl.textContent = this.reverenceScore;
        }
        const chatScore = document.getElementById("chat-score-val");
        if (chatScore) chatScore.textContent = this.reverenceScore;
    }

    // 展现结课督考卷
    showStudyCompletionModal() {
        const existing = document.querySelector(".supervisor-modal-overlay");
        if (existing) existing.remove();

        const modalHtml = `
            <div class="supervisor-report-card">
                <button class="report-close-x" onclick="this.closest('.modal-overlay').remove()">✕</button>
                <div class="report-header">
                    <span class="report-seal">白鹿督考</span>
                    <h3>考亭夫子 · 研学功课考评卷</h3>
                    <p class="report-date">${new Date().toLocaleDateString()} · 白鹿洞督学堂手定</p>
                </div>
                <div class="report-body">
                    <div class="report-stat-row">
                        <div class="stat-box">
                            <span class="stat-label">自习笃学时长</span>
                            <span class="stat-val">${Math.round(this.totalDurationSeconds / 60)} 分钟</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-label">持敬修身积分</span>
                            <span class="stat-val ${this.reverenceScore >= 80 ? 'high' : 'warn'}">${this.reverenceScore} 分</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-label">分心警诫次数</span>
                            <span class="stat-val">${this.distractionCount} 次</span>
                        </div>
                    </div>

                    <div class="master-verdict-box">
                        <h4>考亭夫子御批考语：</h4>
                        <p class="verdict-quote">
                            ${this.reverenceScore >= 90
                                ? "“贤生自习四十五分，能居敬持志、心无旁骛！深合白鹿洞‘日间力行，未得乎前，不敢求乎后’之规，善莫大焉！赐印「敬业乐群」。”"
                                : "“学问之道，首在收敛心神。贤生虽有向学之心，然中途略有浮动神散。当紧记‘不矜细行，终累大德’，下番自习须着紧收摄心猿！”"}
                        </p>
                    </div>
                </div>
                <div class="report-actions">
                    <button class="report-confirm-btn" onclick="this.closest('.modal-overlay').remove()">领受夫子训勉</button>
                </div>
            </div>
        `;

        const overlay = document.createElement("div");
        overlay.className = "modal-overlay supervisor-modal-overlay";
        overlay.innerHTML = modalHtml;
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) overlay.remove();
        });
        document.body.appendChild(overlay);
    }
}

// 实例化全局伴学督导控制器
window.studySupervisor = new StudySupervisor();
