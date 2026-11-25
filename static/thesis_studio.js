// ========================================================
// 考亭研撰 · 朱子文化学术论文写作工作台（内嵌于考亭答疑专修区）
// 纯中文宋版书院排版规范，不新增任何 emoji 图标
// 支持多篇论文持久化、六阶段全流程、真 RAG/OPAC 引文与 Word/Markdown 导出
// ========================================================

(function () {
    const STORAGE_KEY = "kaoting_thesis_projects_v1";

    const STAGES = [
        { id: 1, num: "一", label: "选题立项" },
        { id: 2, num: "二", label: "特藏引文" },
        { id: 3, num: "三", label: "提纲编排" },
        { id: 4, num: "四", label: "分章撰润" },
        { id: 5, num: "五", label: "审稿答辩" },
        { id: 6, num: "六", label: "成稿导出" },
    ];

    const THESIS_TYPES = ["本科毕业论文", "课程论文", "研学报告", "学术期刊论文"];
    const DISCIPLINES = [
        "朱子理学与哲学",
        "四书经学与文献考据",
        "武夷书院与儒家教育",
        "五夫社仓与经世实学",
        "朱子诗学美学与闽北家风",
        "朱子文化海外传播与当代转化",
    ];
    const WORD_TARGETS = [3000, 6000, 8000, 10000, 15000];

    function esc(str) {
        return String(str == null ? "" : str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function countChineseWords(text) {
        return String(text || "").replace(/\s+/g, "").length;
    }

    function createBlankProject(seq = 1) {
        const now = new Date().toLocaleString();
        return {
            id: "th_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6),
            title: "",
            thesis_type: "本科毕业论文",
            discipline: "朱子理学与哲学",
            target_words: 6000,
            keyword_hint: "",
            author_name: "",
            student_id: "",
            college: "武夷学院",
            advisor: "",
            problem_statement: "",
            literature_review_guide: "",
            abstract: "",
            keywords: ["朱子文化", "宋明理学", "武夷特藏"],
            citations: [],
            chapters: [],
            review: null,
            defense_questions: [],
            defense_answers: {},
            defense_evals: {},
            updated_at: now,
            _seq: seq,
        };
    }

    class ThesisStudioController {
        constructor() {
            this.projects = [];
            this.activeProjectId = null;
            this.currentStage = 1;
            this.activeChapterIndex = 0;
            this.mobileWriteTab = "editor"; // editor | mentor
            this.suggestedTopics = [];
            this.topicMentorNote = "";
            this.topicWarning = "";
            this.searchResults = [];
            this.searchQuery = "";
            this.isSearchingCitations = false;
            this.isGeneratingTopics = false;
            this.isGeneratingOutline = false;
            this.isReviewing = false;
            this.isGeneratingDefense = false;
            this.evaluatingDefenseId = null;
            this.exportingKey = "";

            // 分章流式辅助状态
            this.assistAbortController = null;
            this.assistSessionId = "thesis_" + Date.now().toString(36);
            this.isAssisting = false;
            this.assistOutput = "";
            this.assistActionLabel = "";
            this.assistFallback = false;
            this.customAskText = "";

            this._loadProjects();
        }

        _loadProjects() {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                const parsed = raw ? JSON.parse(raw) : [];
                if (Array.isArray(parsed) && parsed.length > 0) {
                    this.projects = parsed;
                    this.activeProjectId = this.projects[0].id;
                    return;
                }
            } catch (e) {
                console.warn("读取本地论文项目失败:", e);
            }
            const init = createBlankProject(1);
            this.projects = [init];
            this.activeProjectId = init.id;
        }

        _saveProjects() {
            const p = this.getActiveProject();
            if (p) p.updated_at = new Date().toLocaleString();
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(this.projects.slice(0, 15)));
            } catch (e) {
                console.warn("保存本地论文项目遇限:", e);
            }
        }

        getActiveProject() {
            let p = this.projects.find(item => item.id === this.activeProjectId);
            if (!p) {
                if (this.projects.length === 0) {
                    this.projects.push(createBlankProject(1));
                }
                p = this.projects[0];
                this.activeProjectId = p.id;
            }
            return p;
        }

        getTotalWords(project) {
            const p = project || this.getActiveProject();
            return (p.chapters || []).reduce((sum, ch) => sum + countChineseWords(ch.content || ""), 0);
        }

        open() {
            const host = document.getElementById("thesis-inline-workspace");
            if (!host) return;
            host.style.display = "flex";
            const qaView = document.getElementById("view-qa");
            if (qaView) qaView.classList.add("thesis-active-mode");
            const p = this.getActiveProject();
            if (p.chapters && p.chapters.length > 0 && this.activeChapterIndex >= p.chapters.length) {
                this.activeChapterIndex = 0;
            }
            this.render();
        }

        close() {
            this.stopAssist();
            const host = document.getElementById("thesis-inline-workspace");
            if (host) host.style.display = "none";
            const qaView = document.getElementById("view-qa");
            if (qaView) qaView.classList.remove("thesis-active-mode");
        }

        notify(msg) {
            if (typeof showToast === "function") showToast(msg);
        }

        // ---------- 项目切换与管理 ----------
        switchProject(projectId) {
            this.stopAssist();
            this.activeProjectId = projectId;
            this.activeChapterIndex = 0;
            this.assistOutput = "";
            this.searchResults = [];
            this.suggestedTopics = [];
            this.topicWarning = "";
            this.render();
        }

        createNewProject() {
            this.stopAssist();
            const nextProj = createBlankProject(this.projects.length + 1);
            this.projects.unshift(nextProj);
            this.activeProjectId = nextProj.id;
            this.currentStage = 1;
            this.activeChapterIndex = 0;
            this.assistOutput = "";
            this.searchResults = [];
            this.suggestedTopics = [];
            this.topicWarning = "";
            this._saveProjects();
            this.render();
            this.notify("已新建空白朱子文化论文项目");
        }

        deleteActiveProject() {
            if (this.projects.length <= 1) {
                const fresh = createBlankProject(1);
                this.projects = [fresh];
                this.activeProjectId = fresh.id;
                this.currentStage = 1;
                this.activeChapterIndex = 0;
                this.assistOutput = "";
                this._saveProjects();
                this.render();
                this.notify("已重置当前论文项目");
                return;
            }
            const cur = this.getActiveProject();
            const name = cur.title || "未命名论文";
            if (!window.confirm(`确定删除论文项目“${name}”吗？删除后不可恢复。`)) return;
            this.projects = this.projects.filter(x => x.id !== cur.id);
            this.activeProjectId = this.projects[0].id;
            this.activeChapterIndex = 0;
            this.assistOutput = "";
            this._saveProjects();
            this.render();
            this.notify("已删除该项目");
        }

        setStage(stageId) {
            this.currentStage = stageId;
            const p = this.getActiveProject();
            if (stageId === 2 && this.searchResults.length === 0) {
                this.searchCitations(p.title || p.keyword_hint || "朱子 理学");
            } else {
                this.render();
            }
        }

        updateField(field, value) {
            const p = this.getActiveProject();
            if (field === "target_words") {
                p.target_words = Math.max(1500, Math.min(30000, parseInt(value, 10) || 6000));
            } else if (field === "keywords") {
                p.keywords = String(value || "")
                    .split(/[，,；;、\s]+/)
                    .map(s => s.trim())
                    .filter(Boolean)
                    .slice(0, 8);
            } else {
                p[field] = value;
            }
            this._saveProjects();
            // 同步更新顶部项目标题下拉文本，避免整页重绘打断中文输入法
            if (field === "title") {
                const sel = document.getElementById("ts-project-select");
                if (sel) {
                    const opt = sel.querySelector(`option[value="${p.id}"]`);
                    if (opt) opt.textContent = p.title ? p.title.slice(0, 26) : "未命名朱子文化论文";
                }
            }
        }

        // ---------- 阶段一：智能拟题 ----------
        async requestTopicSuggestions() {
            if (this.isGeneratingTopics) return;
            const p = this.getActiveProject();
            this.isGeneratingTopics = true;
            this.topicWarning = "";
            this.render();

            try {
                const res = await fetch("/api/thesis/topics", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        keyword: p.keyword_hint || p.title || "",
                        thesis_type: p.thesis_type,
                        discipline: p.discipline,
                    }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || `请求失败 (${res.status})`);
                this.suggestedTopics = Array.isArray(data.topics) ? data.topics : [];
                this.topicMentorNote = data.mentor_note || "";
                if (data.accepted === false && data.message) {
                    this.topicWarning = data.message;
                }
            } catch (err) {
                this.notify(`拟题遇阻：${err.message}`);
            } finally {
                this.isGeneratingTopics = false;
                this.render();
            }
        }

        adoptSuggestedTopic(idx) {
            const item = this.suggestedTopics[idx];
            if (!item) return;
            const p = this.getActiveProject();
            p.title = item.title || "";
            if (item.problem) {
                p.problem_statement = item.problem + (item.innovation ? `\n\n创新切入：${item.innovation}` : "");
            }
            this._saveProjects();
            this.topicWarning = "";
            this.render();
            this.notify("已采用该选题，可继续前往第二步检索武夷特藏引文");
        }

        // ---------- 阶段二：武夷特藏引文库 ----------
        async searchCitations(customQuery = null) {
            if (this.isSearchingCitations) return;
            const p = this.getActiveProject();
            const q = customQuery !== null ? customQuery : (this.searchQuery || p.title || p.keyword_hint || "朱子 格物致知");
            this.searchQuery = q;
            this.isSearchingCitations = true;
            this.render();

            try {
                const res = await fetch("/api/thesis/citations/search", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        topic: p.title || "",
                        query: q,
                        top_k: 6,
                    }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || `检索失败 (${res.status})`);
                this.searchResults = Array.isArray(data.citations) ? data.citations : [];
            } catch (err) {
                this.notify(`特藏检索失败：${err.message}`);
            } finally {
                this.isSearchingCitations = false;
                this.render();
            }
        }

        toggleCollectCitation(idx) {
            const item = this.searchResults[idx];
            if (!item) return;
            const p = this.getActiveProject();
            const existsIdx = (p.citations || []).findIndex(c => c.id === item.id);
            if (existsIdx >= 0) {
                p.citations.splice(existsIdx, 1);
                this.notify("已从本文引文库移除");
            } else {
                p.citations.push({ ...item });
                this.notify("已收入本文引文库并生成 GB/T 7714 规范条目");
            }
            this._saveProjects();
            this.render();
        }

        removeCollectedCitation(idx) {
            const p = this.getActiveProject();
            if (!p.citations || idx < 0 || idx >= p.citations.length) return;
            p.citations.splice(idx, 1);
            this._saveProjects();
            this.render();
        }

        moveCollectedCitation(idx, delta) {
            const p = this.getActiveProject();
            const target = idx + delta;
            if (!p.citations || target < 0 || target >= p.citations.length) return;
            const tmp = p.citations[idx];
            p.citations[idx] = p.citations[target];
            p.citations[target] = tmp;
            this._saveProjects();
            this.render();
        }

        addManualCitation() {
            const authorEl = document.getElementById("ts-manual-author");
            const titleEl = document.getElementById("ts-manual-title");
            const pubEl = document.getElementById("ts-manual-pub");
            const yearEl = document.getElementById("ts-manual-year");
            const typeEl = document.getElementById("ts-manual-type");
            const author = (authorEl && authorEl.value || "").trim();
            const title = (titleEl && titleEl.value || "").trim();
            const pub = (pubEl && pubEl.value || "").trim();
            const year = (yearEl && yearEl.value || "").trim();
            const docType = (typeEl && typeEl.value) || "M";
            if (!title) {
                this.notify("请至少填写文献题名");
                return;
            }
            const cleanAuthor = author || "佚名";
            const cleanPub = pub || "出版项待补";
            const gbt = `${cleanAuthor}. ${title.replace(/[《》]/g, "")}[${docType}]. ${cleanPub}${year ? ", " + year : ""}.`;
            const p = this.getActiveProject();
            p.citations.push({
                id: "man_" + Date.now().toString(36),
                book_key: "",
                book_title: title.startsWith("《") ? title : `《${title}》`,
                author: cleanAuthor,
                call_number: "自添文献",
                location: "外部学术参考文献",
                status: "自录",
                detail_url: "",
                filename: "",
                chapter: "参考文献",
                quote: "",
                gbt7714: gbt,
            });
            this._saveProjects();
            this.render();
            this.notify("已新增至 GB/T 7714 参考文献列表");
        }

        copyAllReferences() {
            const p = this.getActiveProject();
            if (!p.citations || p.citations.length === 0) {
                this.notify("当前引文库为空，请先收编特藏文献");
                return;
            }
            const text = p.citations.map((c, i) => `[${i + 1}] ${c.gbt7714}`).join("\n");
            if (typeof copyTextSafe === "function") {
                copyTextSafe(text, "已复制全部 GB/T 7714 参考文献");
            }
        }

        openCitationReader(idx, fromCollected = false) {
            const p = this.getActiveProject();
            const list = fromCollected ? (p.citations || []) : (this.searchResults || []);
            const item = list[idx];
            if (!item) return;
            if (typeof openFulltextFromProvenance === "function") {
                openFulltextFromProvenance(
                    item.book_key || "yulei",
                    item.book_title || "考亭原典",
                    (item.quote || "").slice(0, 36),
                    item.filename || "",
                    item.chapter || ""
                );
            }
        }

        // ---------- 阶段三：三级结构化大纲 ----------
        async requestGenerateOutline() {
            if (this.isGeneratingOutline) return;
            const p = this.getActiveProject();
            if (!p.title || !p.title.trim()) {
                this.notify("请先在第一步填写或采用一个朱子文化论文题目");
                this.setStage(1);
                return;
            }
            this.isGeneratingOutline = true;
            this.render();

            try {
                const res = await fetch("/api/thesis/outline/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        topic: p.title,
                        thesis_type: p.thesis_type,
                        discipline: p.discipline,
                        target_words: p.target_words,
                        citations: p.citations || [],
                    }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || `生成大纲失败 (${res.status})`);

                // 保留已有章节正文（若同序位已写字则保留提示）
                const oldContents = (p.chapters || []).map(c => c.content || "");
                const newChapters = (data.chapters || []).map((ch, idx) => ({
                    ...ch,
                    content: oldContents[idx] || ch.content || "",
                }));
                p.abstract = data.abstract || p.abstract;
                p.keywords = Array.isArray(data.keywords) && data.keywords.length ? data.keywords : p.keywords;
                p.problem_statement = data.problem_statement || p.problem_statement;
                p.literature_review_guide = data.literature_review_guide || p.literature_review_guide;
                p.chapters = newChapters;
                this.activeChapterIndex = 0;
                this._saveProjects();
                this.notify(data.fallback ? "已由考亭本地引擎生成三级结构大纲" : "三级结构化大纲已生成");
            } catch (err) {
                this.notify(`生成大纲遇阻：${err.message}`);
            } finally {
                this.isGeneratingOutline = false;
                this.render();
            }
        }

        addChapter() {
            const p = this.getActiveProject();
            const n = (p.chapters || []).length + 1;
            const cnNums = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
            const cn = cnNums[n - 1] || String(n);
            p.chapters.push({
                id: "ch_" + Date.now().toString(36),
                title: `第${cn}章 新增论题章节`,
                target_words: 1200,
                summary: "请填写本章核心论证思路与拟征引典籍。",
                sections: [`${n}.1 第一小节`, `${n}.2 第二小节`],
                suggested_sources: [],
                content: "",
            });
            this._saveProjects();
            this.render();
        }

        removeChapter(idx) {
            const p = this.getActiveProject();
            if (!p.chapters || idx < 0 || idx >= p.chapters.length) return;
            p.chapters.splice(idx, 1);
            if (this.activeChapterIndex >= p.chapters.length) {
                this.activeChapterIndex = Math.max(0, p.chapters.length - 1);
            }
            this._saveProjects();
            this.render();
        }

        moveChapter(idx, delta) {
            const p = this.getActiveProject();
            const target = idx + delta;
            if (!p.chapters || target < 0 || target >= p.chapters.length) return;
            const tmp = p.chapters[idx];
            p.chapters[idx] = p.chapters[target];
            p.chapters[target] = tmp;
            this._saveProjects();
            this.render();
        }

        updateChapterMeta(idx, field, value) {
            const p = this.getActiveProject();
            const ch = p.chapters && p.chapters[idx];
            if (!ch) return;
            if (field === "target_words") {
                ch.target_words = Math.max(200, parseInt(value, 10) || 1000);
            } else if (field === "sections") {
                ch.sections = String(value || "")
                    .split("\n")
                    .map(s => s.trim())
                    .filter(Boolean);
            } else {
                ch[field] = value;
            }
            this._saveProjects();
        }

        jumpToChapterWrite(idx) {
            this.activeChapterIndex = idx;
            this.currentStage = 4;
            this.mobileWriteTab = "editor";
            this.render();
        }

        // ---------- 阶段四：分章正文与专项 AI 精批 ----------
        selectWriteChapter(idx) {
            this.stopAssist();
            this.activeChapterIndex = idx;
            this.assistOutput = "";
            this.assistActionLabel = "";
            this.render();
        }

        setMobileWriteTab(tab) {
            this.mobileWriteTab = tab;
            this.render();
        }

        updateChapterDraft(value) {
            const p = this.getActiveProject();
            const ch = p.chapters && p.chapters[this.activeChapterIndex];
            if (!ch) return;
            ch.content = value;
            this._saveProjects();

            const chCountEl = document.getElementById("ts-chapter-word-count");
            if (chCountEl) chCountEl.textContent = `${countChineseWords(value)} / ${ch.target_words || 1000} 字`;
            const totalEl = document.getElementById("ts-total-word-badge");
            if (totalEl) totalEl.textContent = `总计 ${this.getTotalWords(p)} 字`;
            const savedEl = document.getElementById("ts-autosave-hint");
            if (savedEl) savedEl.textContent = `已自动保存 ${new Date().toLocaleTimeString()}`;
        }

        insertCitationIntoDraft(citIdx) {
            const p = this.getActiveProject();
            const ch = p.chapters && p.chapters[this.activeChapterIndex];
            const cit = p.citations && p.citations[citIdx];
            if (!ch || !cit) return;
            const refNum = citIdx + 1;
            const snippet = cit.quote
                ? `\n> ${cit.book_title}（${cit.chapter || "原文"}）云：“${cit.quote}”[${refNum}]\n`
                : `（见${cit.book_title}[${refNum}]）`;
            const ta = document.getElementById("ts-draft-textarea");
            if (ta) {
                const start = ta.selectionStart || ta.value.length;
                const end = ta.selectionEnd || ta.value.length;
                ta.value = ta.value.slice(0, start) + snippet + ta.value.slice(end);
                this.updateChapterDraft(ta.value);
                if (typeof safeFocus === "function") safeFocus(ta);
            } else {
                ch.content = (ch.content || "") + snippet;
                this._saveProjects();
                this.render();
            }
            this.notify(`已插入 ${cit.book_title} 原文与角标 [${refNum}]`);
        }

        triggerDraftFileImport() {
            const input = document.getElementById("ts-draft-file-input");
            if (input) input.click();
        }

        async handleDraftFileImport(input) {
            const file = input && input.files && input.files[0];
            if (!file) return;
            const p = this.getActiveProject();
            if (!p.chapters || p.chapters.length === 0) {
                this.addChapter();
            }
            const formData = new FormData();
            formData.append("file", file);
            this.notify(`正在导入草稿《${file.name}》...`);

            try {
                const res = await fetch("/api/thesis/import-draft", {
                    method: "POST",
                    body: formData,
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || `导入失败 (${res.status})`);
                const ch = p.chapters[this.activeChapterIndex];
                if (ch) {
                    ch.content = ch.content ? `${ch.content}\n\n${data.text}` : data.text;
                    this._saveProjects();
                    this.render();
                    this.notify(`已导入《${data.filename}》（约 ${data.char_count} 字），可进行学术润色或逻辑诊断`);
                }
            } catch (err) {
                this.notify(`导入失败：${err.message}`);
            } finally {
                if (input) input.value = "";
            }
        }

        stopAssist() {
            if (this.assistAbortController) {
                try { this.assistAbortController.abort(); } catch (e) {}
                this.assistAbortController = null;
            }
            if (this.isAssisting) {
                fetch("/api/chat/stop", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ session_id: this.assistSessionId }),
                }).catch(() => {});
            }
            this.isAssisting = false;
        }

        async runChapterAssist(action) {
            const p = this.getActiveProject();
            if (!p.title || !p.title.trim()) {
                this.notify("请先在第一步确定朱子文化论文题目");
                this.setStage(1);
                return;
            }
            if (!p.chapters || p.chapters.length === 0) {
                this.addChapter();
            }
            const ch = p.chapters[this.activeChapterIndex];
            if (!ch) return;

            this.stopAssist();
            this.isAssisting = true;
            this.assistOutput = "";
            this.assistFallback = false;
            const labelMap = {
                draft: "按提纲生成参考初稿",
                polish: "学术化表达润色",
                cite: "原典考据增补",
                diagnose: "论证逻辑诊断",
                ask: "考亭研撰答疑",
            };
            this.assistActionLabel = labelMap[action] || "学术精批";
            if (window.innerWidth <= 767) {
                this.mobileWriteTab = "mentor";
            }
            this.assistSessionId = "thesis_" + Date.now().toString(36);
            const controller = new AbortController();
            this.assistAbortController = controller;
            this.render();

            const customInst = action === "ask" ? (this.customAskText || "").trim() : "";
            if (action === "ask" && !customInst) {
                this.isAssisting = false;
                this.notify("请先输入欲向先生请教的论文问题");
                this.render();
                return;
            }

            try {
                const res = await fetch("/api/thesis/assist/stream", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    signal: controller.signal,
                    body: JSON.stringify({
                        action,
                        topic: p.title,
                        chapter_title: ch.title,
                        chapter_summary: ch.summary || "",
                        sections: ch.sections || [],
                        current_draft: ch.content || "",
                        citations: p.citations || [],
                        custom_instruction: customInst,
                        target_words: ch.target_words || 1200,
                        session_id: this.assistSessionId,
                    }),
                });
                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.detail || `HTTP ${res.status}`);
                }

                const reader = res.body.getReader();
                const decoder = new TextDecoder("utf-8");
                let buffer = "";

                const updateDomStream = () => {
                    const outEl = document.getElementById("ts-mentor-output");
                    if (outEl) {
                        outEl.innerHTML = this._renderPlainAcademic(this.assistOutput);
                        outEl.scrollTop = outEl.scrollHeight;
                    }
                };

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split("\n");
                    buffer = lines.pop() || "";

                    for (const line of lines) {
                        const s = line.trim();
                        if (!s.startsWith("data:")) continue;
                        const rawJson = s.slice(5).trim();
                        if (!rawJson || rawJson === "[DONE]") continue;
                        try {
                            const evt = JSON.parse(rawJson);
                            if (evt.type === "token" && evt.content) {
                                this.assistOutput += evt.content;
                                updateDomStream();
                            } else if (evt.type === "done" && evt.fallback) {
                                this.assistFallback = true;
                            }
                        } catch (e) {}
                    }
                }
                if (action === "ask") this.customAskText = "";
            } catch (err) {
                if (err.name !== "AbortError") {
                    this.assistOutput = this.assistOutput || `请求遇阻：${err.message}`;
                }
            } finally {
                if (this.assistAbortController === controller) {
                    this.assistAbortController = null;
                }
                this.isAssisting = false;
                this.render();
            }
        }

        adoptAssistText(mode = "append") {
            const p = this.getActiveProject();
            const ch = p.chapters && p.chapters[this.activeChapterIndex];
            if (!ch || !this.assistOutput.trim()) return;
            // 若为润色结果且含【修改要点说明】，提取正文部分采纳
            let body = this.assistOutput.trim();
            if (body.includes("【润色后正文") && body.includes("【修改要点说明】")) {
                body = body
                    .replace(/^【润色后正文[^】]*】\s*/, "")
                    .split("【修改要点说明】")[0]
                    .trim();
            }
            if (mode === "replace") {
                ch.content = body;
            } else {
                ch.content = ch.content ? `${ch.content.trim()}\n\n${body}` : body;
            }
            this._saveProjects();
            if (window.innerWidth <= 767) this.mobileWriteTab = "editor";
            this.render();
            this.notify(mode === "replace" ? "已采纳并替换本章正文" : "已追加至本章正文末尾");
        }

        copyAssistOutput() {
            if (!this.assistOutput.trim()) return;
            if (typeof copyTextSafe === "function") {
                copyTextSafe(this.assistOutput, "已复制导师精批内容");
            }
        }

        // ---------- 阶段五：五维体检与互动模拟答辩 ----------
        async requestReview() {
            if (this.isReviewing) return;
            const p = this.getActiveProject();
            if (!p.title || !p.title.trim()) {
                this.notify("请先确立论文题目");
                return;
            }
            this.isReviewing = true;
            this.render();
            try {
                const res = await fetch("/api/thesis/review", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ project: p }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || `审稿失败 (${res.status})`);
                p.review = data;
                this._saveProjects();
                this.notify("五维学术体检报告已生成");
            } catch (err) {
                this.notify(`学术体检遇阻：${err.message}`);
            } finally {
                this.isReviewing = false;
                this.render();
            }
        }

        async requestDefenseQuestions() {
            if (this.isGeneratingDefense) return;
            const p = this.getActiveProject();
            if (!p.title || !p.title.trim()) {
                this.notify("请先确立论文题目");
                return;
            }
            this.isGeneratingDefense = true;
            this.render();
            try {
                const res = await fetch("/api/thesis/defense", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "questions", project: p }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || `生成质询失败 (${res.status})`);
                p.defense_questions = Array.isArray(data.questions) ? data.questions : [];
                p.defense_evals = {};
                this._saveProjects();
                this.notify("已生成针对本文的三道答辩质询");
            } catch (err) {
                this.notify(`生成质询遇阻：${err.message}`);
            } finally {
                this.isGeneratingDefense = false;
                this.render();
            }
        }

        updateDefenseAnswer(qId, val) {
            const p = this.getActiveProject();
            if (!p.defense_answers) p.defense_answers = {};
            p.defense_answers[qId] = val;
            this._saveProjects();
        }

        async submitDefenseAnswer(qId) {
            const p = this.getActiveProject();
            const qObj = (p.defense_questions || []).find(q => q.id === qId);
            const ans = (p.defense_answers && p.defense_answers[qId] || "").trim();
            if (!qObj) return;
            if (ans.length < 10) {
                this.notify("请至少撰写 10 字以上的答辩陈词再提交评阅");
                return;
            }
            this.evaluatingDefenseId = qId;
            this.render();
            try {
                const res = await fetch("/api/thesis/defense", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "evaluate",
                        project: p,
                        question: qObj.question,
                        answer: ans,
                    }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || `评阅失败 (${res.status})`);
                if (!p.defense_evals) p.defense_evals = {};
                p.defense_evals[qId] = data;
                this._saveProjects();
                this.notify("答辩评阅已完成");
            } catch (err) {
                this.notify(`答辩评阅遇阻：${err.message}`);
            } finally {
                this.evaluatingDefenseId = null;
                this.render();
            }
        }

        // ---------- 阶段六：Word / Markdown / JSON 真文件导出 ----------
        async exportFile(format = "docx", template = "full") {
            const p = this.getActiveProject();
            if (!p.title || !p.title.trim()) {
                this.notify("请先填写论文题目后再导出文档");
                return;
            }
            const key = `${format}_${template}`;
            this.exportingKey = key;
            this.render();

            try {
                const res = await fetch("/api/thesis/export", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        project: p,
                        format,
                        template,
                    }),
                });
                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.detail || `导出失败 (${res.status})`);
                }
                const blob = await res.blob();
                const safeTitle = (p.title || "朱子文化论文").replace(/[\\/:*?"<>|\r\n]+/g, "_").slice(0, 42);
                const suffix = template === "proposal" ? "开题报告书" : "完整论文";
                const fname = `${safeTitle}_${suffix}.${format}`;

                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = fname;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 1500);
                this.notify(`已导出：${fname}`);
            } catch (err) {
                this.notify(`导出遇阻：${err.message}`);
            } finally {
                this.exportingKey = "";
                this.render();
            }
        }

        exportProjectJson() {
            const p = this.getActiveProject();
            const blob = new Blob([JSON.stringify(p, null, 2)], { type: "application/json;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${(p.title || "朱子论文项目").replace(/[\\/:*?"<>|]+/g, "_").slice(0, 32)}_备份.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1500);
            this.notify("已导出本地项目 JSON 备份");
        }

        triggerJsonImport() {
            const el = document.getElementById("ts-json-import-input");
            if (el) el.click();
        }

        handleJsonImport(input) {
            const file = input && input.files && input.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const obj = JSON.parse(String(reader.result || "{}"));
                    if (!obj || typeof obj !== "object" || (!obj.title && !Array.isArray(obj.chapters))) {
                        throw new Error("文件内容不是有效的考亭论文项目备份");
                    }
                    obj.id = "th_" + Date.now().toString(36);
                    obj.updated_at = new Date().toLocaleString();
                    this.projects.unshift(obj);
                    this.activeProjectId = obj.id;
                    this.activeChapterIndex = 0;
                    this._saveProjects();
                    this.render();
                    this.notify(`已恢复论文项目《${obj.title || "未命名"}》`);
                } catch (e) {
                    this.notify(`导入备份失败：${e.message}`);
                } finally {
                    if (input) input.value = "";
                }
            };
            reader.readAsText(file, "utf-8");
        }

        // ---------- 纯净学术文本渲染（无 emoji，防 XSS） ----------
        _renderPlainAcademic(text) {
            if (!text) return "";
            const lines = String(text).split("\n");
            const out = [];
            for (const raw of lines) {
                const ln = raw.trim();
                if (!ln) {
                    out.push('<div class="ts-md-gap"></div>');
                    continue;
                }
                const safe = esc(ln).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
                if (ln.startsWith("### ")) {
                    out.push(`<h4 class="ts-md-h4">${esc(ln.slice(4))}</h4>`);
                } else if (ln.startsWith("## ")) {
                    out.push(`<h3 class="ts-md-h3">${esc(ln.slice(3))}</h3>`);
                } else if (ln.startsWith("> ")) {
                    out.push(`<blockquote class="ts-md-quote">${safe.slice(5)}</blockquote>`);
                } else {
                    out.push(`<p class="ts-md-p">${safe}</p>`);
                }
            }
            return out.join("");
        }

        // ---------- 总渲染入口 ----------
        render() {
            const host = document.getElementById("thesis-inline-workspace");
            if (!host || host.style.display === "none") return;

            const p = this.getActiveProject();
            const totalWords = this.getTotalWords(p);

            host.innerHTML = `
                <div class="ts-top-bar">
                    <div class="ts-project-switcher">
                        <span class="ts-seal-badge">考亭研撰</span>
                        <select id="ts-project-select" class="ts-select" onchange="thesisStudio.switchProject(this.value)" title="切换已保存的朱子文化论文项目">
                            ${this.projects.map(item => `<option value="${esc(item.id)}"${item.id === p.id ? " selected" : ""}>${esc(item.title ? item.title.slice(0, 22) : "未命名朱子文化论文")}</option>`).join("")}
                        </select>
                        <button type="button" class="ts-btn-subtle" onclick="thesisStudio.createNewProject()">新建论文</button>
                        <button type="button" class="ts-btn-subtle danger" onclick="thesisStudio.deleteActiveProject()">删除</button>
                    </div>
                    <div class="ts-top-metrics">
                        <span class="ts-metric-pill" id="ts-total-word-badge">总计 ${totalWords} 字</span>
                        <span class="ts-metric-pill">引文 ${(p.citations || []).length} 条</span>
                        <button type="button" class="ts-btn-primary compact" onclick="thesisStudio.setStage(6)">导出文档</button>
                    </div>
                </div>

                <div class="ts-stepper-bar" role="tablist">
                    ${STAGES.map(st => {
                        const active = this.currentStage === st.id;
                        let countBadge = "";
                        if (st.id === 2 && (p.citations || []).length > 0) countBadge = ` (${p.citations.length})`;
                        if (st.id === 3 && (p.chapters || []).length > 0) countBadge = ` (${p.chapters.length}章)`;
                        return `
                            <button type="button" role="tab" aria-selected="${active}" class="ts-step-tab ${active ? "active" : ""}" onclick="thesisStudio.setStage(${st.id})">
                                <span class="ts-step-num">${st.num}</span>
                                <span class="ts-step-label">${st.label}${countBadge}</span>
                            </button>
                        `;
                    }).join("")}
                </div>

                <div class="ts-stage-body">
                    ${this._renderCurrentStage(p)}
                </div>
            `;
        }

        _renderCurrentStage(p) {
            switch (this.currentStage) {
                case 1: return this._renderStage1(p);
                case 2: return this._renderStage2(p);
                case 3: return this._renderStage3(p);
                case 4: return this._renderStage4(p);
                case 5: return this._renderStage5(p);
                case 6: return this._renderStage6(p);
                default: return this._renderStage1(p);
            }
        }

        _renderStage1(p) {
            return `
                <div class="ts-stage-pane">
                    <div class="ts-card">
                        <div class="ts-card-head">
                            <h4>一、朱子文化论文立项信息</h4>
                            <span class="ts-head-note">聚焦朱子理学、四书经义、武夷书院、五夫社仓与闽北文脉</span>
                        </div>
                        <div class="ts-form-grid">
                            <div class="ts-field ts-field-full">
                                <label>论文题目（支持自拟任意朱子文化论题）</label>
                                <input type="text" class="ts-input" value="${esc(p.title)}" placeholder="例如：论朱熹“格物致知”工夫论与当代高校通识育人价值" oninput="thesisStudio.updateField('title', this.value)">
                            </div>
                            <div class="ts-field">
                                <label>论文体裁</label>
                                <select class="ts-input" onchange="thesisStudio.updateField('thesis_type', this.value)">
                                    ${THESIS_TYPES.map(t => `<option value="${esc(t)}" ${p.thesis_type === t ? "selected" : ""}>${esc(t)}</option>`).join("")}
                                </select>
                            </div>
                            <div class="ts-field">
                                <label>朱子文化研究方向</label>
                                <select class="ts-input" onchange="thesisStudio.updateField('discipline', this.value)">
                                    ${DISCIPLINES.map(d => `<option value="${esc(d)}" ${p.discipline === d ? "selected" : ""}>${esc(d)}</option>`).join("")}
                                </select>
                            </div>
                            <div class="ts-field">
                                <label>目标字数</label>
                                <select class="ts-input" onchange="thesisStudio.updateField('target_words', this.value)">
                                    ${WORD_TARGETS.map(w => `<option value="${w}" ${Number(p.target_words) === w ? "selected" : ""}>约 ${w} 字</option>`).join("")}
                                </select>
                            </div>
                        </div>

                        <div class="ts-field" style="margin-top:10px;">
                            <label>核心问题意识与破题思路（可选，将在开题报告与大纲中自动沿用）</label>
                            <textarea class="ts-textarea" rows="3" placeholder="简述本文希望回应的学术问题、拟辨析的理学分歧或当代观照方向..." oninput="thesisStudio.updateField('problem_statement', this.value)">${esc(p.problem_statement || "")}</textarea>
                        </div>

                        <div class="ts-stage-footer-bar">
                            <span class="ts-muted-tip">所有填写内容自动留存于本机浏览器，刷新不丢失。</span>
                            <button type="button" class="ts-btn-primary" onclick="thesisStudio.setStage(2)">下一步：检索武夷特藏引文</button>
                        </div>
                    </div>

                    <div class="ts-card">
                        <div class="ts-card-head">
                            <h4>考亭智能拟题与破题参考</h4>
                            <span class="ts-head-note">输入朱子文化关键词，请先生拟定五个兼具原典依据与可行性的参考题目</span>
                        </div>
                        <div class="ts-inline-search-row">
                            <input type="text" class="ts-input" value="${esc(p.keyword_hint || "")}" placeholder="输入关键词，如：白鹿洞学规、五夫社仓、理一分殊、武夷茶理、海外传播..." oninput="thesisStudio.updateField('keyword_hint', this.value)" onkeydown="if(event.key==='Enter'){event.preventDefault(); thesisStudio.requestTopicSuggestions();}">
                            <button type="button" class="ts-btn-primary" ${this.isGeneratingTopics ? "disabled" : ""} onclick="thesisStudio.requestTopicSuggestions()">
                                ${this.isGeneratingTopics ? "先生拟题中..." : "请先生拟定五题"}
                            </button>
                        </div>

                        ${this.topicWarning ? `<div class="ts-notice-warn">${esc(this.topicWarning)}</div>` : ""}
                        ${this.topicMentorNote ? `<div class="ts-mentor-quote-box"><strong>考亭导师寄语：</strong>${esc(this.topicMentorNote)}</div>` : ""}

                        ${this.suggestedTopics.length > 0 ? `
                            <div class="ts-topic-list">
                                ${this.suggestedTopics.map((t, idx) => `
                                    <div class="ts-topic-card">
                                        <div class="ts-topic-top">
                                            <div class="ts-topic-title-wrap">
                                                <span class="ts-index-tag">选题 ${idx + 1}</span>
                                                <strong class="ts-topic-title">${esc(t.title)}</strong>
                                            </div>
                                            <button type="button" class="ts-btn-outline" onclick="thesisStudio.adoptSuggestedTopic(${idx})">采用此题</button>
                                        </div>
                                        <div class="ts-topic-meta">
                                            <span>视角：${esc(t.angle || p.discipline)}</span>
                                            ${(t.primary_sources && t.primary_sources.length) ? `<span>原典：${esc(t.primary_sources.join("、"))}</span>` : ""}
                                        </div>
                                        ${t.problem ? `<p class="ts-topic-desc"><strong>问题意识：</strong>${esc(t.problem)}</p>` : ""}
                                        ${t.innovation ? `<p class="ts-topic-desc"><strong>可行创新：</strong>${esc(t.innovation)}</p>` : ""}
                                    </div>
                                `).join("")}
                            </div>
                        ` : `
                            <div class="ts-empty-state">尚未生成参考选题。可直接在上栏自拟题目，或输入朱子文化关键词点击“请先生拟定五题”。</div>
                        `}
                    </div>
                </div>
            `;
        }

        _renderStage2(p) {
            const collectedIds = new Set((p.citations || []).map(c => c.id));
            return `
                <div class="ts-stage-pane">
                    <div class="ts-card">
                        <div class="ts-card-head">
                            <h4>二、武夷学院逸夫图书馆特藏实时检索引文</h4>
                            <span class="ts-head-note">联动本校 23 部宋明理学原典与 OPAC 排架号，真实引文一键收入</span>
                        </div>
                        <div class="ts-inline-search-row">
                            <input type="text" class="ts-input" id="ts-cit-search-input" value="${esc(this.searchQuery || p.title || "")}" placeholder="输入经义概念、典籍名或论文关键词检索真实原文..." oninput="thesisStudio.searchQuery = this.value" onkeydown="if(event.key==='Enter'){event.preventDefault(); thesisStudio.searchCitations();}">
                            <button type="button" class="ts-btn-primary" ${this.isSearchingCitations ? "disabled" : ""} onclick="thesisStudio.searchCitations()">
                                ${this.isSearchingCitations ? "检阅馆藏中..." : "检索特藏原文"}
                            </button>
                        </div>

                        ${this.searchResults.length > 0 ? `
                            <div class="ts-cit-grid">
                                ${this.searchResults.map((c, idx) => {
                                    const picked = collectedIds.has(c.id);
                                    return `
                                        <div class="ts-cit-card ${picked ? "collected" : ""}">
                                            <div class="ts-cit-head">
                                                <strong>${esc(c.book_title)}</strong>
                                                <span class="ts-callno-tag">索书号：${esc(c.call_number)}</span>
                                            </div>
                                            <div class="ts-cit-meta">
                                                <span>著者：${esc(c.author)}</span>
                                                <span>馆藏：${esc(c.location)}（${esc(c.status)}）</span>
                                            </div>
                                            <blockquote class="ts-cit-quote">“${esc(c.quote)}”</blockquote>
                                            <div class="ts-cit-gbt">国标格式：${esc(c.gbt7714)}</div>
                                            <div class="ts-cit-actions">
                                                <button type="button" class="${picked ? "ts-btn-collected" : "ts-btn-primary compact"}" onclick="thesisStudio.toggleCollectCitation(${idx})">
                                                    ${picked ? "已收编（点击移出）" : "收入本文引文库"}
                                                </button>
                                                <button type="button" class="ts-btn-subtle" onclick="thesisStudio.openCitationReader(${idx}, false)">翻阅原文</button>
                                                ${c.detail_url ? `<a class="ts-btn-subtle ts-link-btn" href="${esc(c.detail_url)}" target="_blank" rel="noopener noreferrer">OPAC 馆藏</a>` : ""}
                                            </div>
                                        </div>
                                    `;
                                }).join("")}
                            </div>
                        ` : `
                            <div class="ts-empty-state">${this.isSearchingCitations ? "正在检索武夷学院逸夫图书馆特藏典籍..." : "点击“检索特藏原文”即可按当前选题调取真实古籍引文与索书号。"}</div>
                        `}
                    </div>

                    <div class="ts-card">
                        <div class="ts-card-head">
                            <h4>本文已收编参考文献库（GB/T 7714-2015，共 ${(p.citations || []).length} 条）</h4>
                            <div class="ts-head-actions">
                                <button type="button" class="ts-btn-subtle" onclick="thesisStudio.copyAllReferences()">复制全部参考文献</button>
                                <button type="button" class="ts-btn-primary compact" onclick="thesisStudio.setStage(3)">下一步：编排论文大纲</button>
                            </div>
                        </div>

                        ${(p.citations || []).length > 0 ? `
                            <div class="ts-ref-list">
                                ${p.citations.map((c, idx) => `
                                    <div class="ts-ref-row">
                                        <div class="ts-ref-body">
                                            <div class="ts-ref-gbt"><strong>[${idx + 1}]</strong> ${esc(c.gbt7714)}</div>
                                            <div class="ts-ref-sub">索书号：${esc(c.call_number || "自添")} · ${esc(c.location || "")}</div>
                                        </div>
                                        <div class="ts-ref-ops">
                                            <button type="button" class="ts-btn-mini" ${idx === 0 ? "disabled" : ""} onclick="thesisStudio.moveCollectedCitation(${idx}, -1)">上移</button>
                                            <button type="button" class="ts-btn-mini" ${idx === p.citations.length - 1 ? "disabled" : ""} onclick="thesisStudio.moveCollectedCitation(${idx}, 1)">下移</button>
                                            <button type="button" class="ts-btn-mini danger" onclick="thesisStudio.removeCollectedCitation(${idx})">移除</button>
                                        </div>
                                    </div>
                                `).join("")}
                            </div>
                        ` : `<div class="ts-empty-state">尚未收编文献。建议从上方武夷特藏检索结果中收编 3 至 6 部核心原典，亦可下方手动补充现代学者专著。</div>`}

                        <div class="ts-manual-ref-box">
                            <div class="ts-sub-label">手工增补参考文献（如陈来、钱穆等现代研究专著或期刊论文）</div>
                            <div class="ts-manual-grid">
                                <input type="text" id="ts-manual-author" class="ts-input" placeholder="著者（如：陈来）">
                                <input type="text" id="ts-manual-title" class="ts-input" placeholder="书名或论文篇名（如：朱子哲学研究）">
                                <input type="text" id="ts-manual-pub" class="ts-input" placeholder="出版地:出版社 或 期刊名">
                                <input type="text" id="ts-manual-year" class="ts-input" placeholder="年份（如：2000）">
                                <select id="ts-manual-type" class="ts-input">
                                    <option value="M">专著 [M]</option>
                                    <option value="J">期刊 [J]</option>
                                    <option value="D">学位论文 [D]</option>
                                    <option value="C">论文集 [C]</option>
                                </select>
                                <button type="button" class="ts-btn-outline" onclick="thesisStudio.addManualCitation()">添加条目</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        _renderStage3(p) {
            const chapters = p.chapters || [];
            return `
                <div class="ts-stage-pane">
                    <div class="ts-card">
                        <div class="ts-card-head">
                            <h4>三、三级结构化大纲与摘要草案</h4>
                            <div class="ts-head-actions">
                                <button type="button" class="ts-btn-primary compact" ${this.isGeneratingOutline ? "disabled" : ""} onclick="thesisStudio.requestGenerateOutline()">
                                    ${this.isGeneratingOutline ? "生成大纲中..." : (chapters.length ? "重新智能生成大纲" : "一键生成三级大纲")}
                                </button>
                                <button type="button" class="ts-btn-outline" onclick="thesisStudio.addChapter()">新增一章</button>
                            </div>
                        </div>

                        <div class="ts-form-grid">
                            <div class="ts-field ts-field-full">
                                <label>中文摘要草案</label>
                                <textarea class="ts-textarea" rows="3" placeholder="点击“一键生成三级大纲”自动拟定摘要，亦可直接手工撰修..." oninput="thesisStudio.updateField('abstract', this.value)">${esc(p.abstract || "")}</textarea>
                            </div>
                            <div class="ts-field ts-field-full">
                                <label>关键词（以中文分号或逗号分隔）</label>
                                <input type="text" class="ts-input" value="${esc((p.keywords || []).join("；"))}" placeholder="朱子文化；格物致知；武夷精舍；当代转化" oninput="thesisStudio.updateField('keywords', this.value)">
                            </div>
                            <div class="ts-field ts-field-full">
                                <label>文献综述脉络（将自动编入开题报告书）</label>
                                <textarea class="ts-textarea" rows="2" placeholder="梳理宋明清以降原典注疏与现当代学术史分歧..." oninput="thesisStudio.updateField('literature_review_guide', this.value)">${esc(p.literature_review_guide || "")}</textarea>
                            </div>
                        </div>
                    </div>

                    <div class="ts-card">
                        <div class="ts-card-head">
                            <h4>章节结构编排（共 ${chapters.length} 章）</h4>
                            <button type="button" class="ts-btn-primary compact" onclick="thesisStudio.setStage(4)">下一步：进入分章撰润</button>
                        </div>

                        ${chapters.length > 0 ? `
                            <div class="ts-chapter-list">
                                ${chapters.map((ch, idx) => `
                                    <div class="ts-chapter-card">
                                        <div class="ts-chapter-top">
                                            <input type="text" class="ts-input ts-ch-title-input" value="${esc(ch.title)}" oninput="thesisStudio.updateChapterMeta(${idx}, 'title', this.value)">
                                            <div class="ts-ch-word-wrap">
                                                <span>目标字数</span>
                                                <input type="number" class="ts-input ts-num-input" value="${Number(ch.target_words || 1000)}" min="200" max="15000" step="100" oninput="thesisStudio.updateChapterMeta(${idx}, 'target_words', this.value)">
                                            </div>
                                            <div class="ts-ref-ops">
                                                <button type="button" class="ts-btn-mini" ${idx === 0 ? "disabled" : ""} onclick="thesisStudio.moveChapter(${idx}, -1)">上移</button>
                                                <button type="button" class="ts-btn-mini" ${idx === chapters.length - 1 ? "disabled" : ""} onclick="thesisStudio.moveChapter(${idx}, 1)">下移</button>
                                                <button type="button" class="ts-btn-mini accent" onclick="thesisStudio.jumpToChapterWrite(${idx})">撰稿</button>
                                                <button type="button" class="ts-btn-mini danger" onclick="thesisStudio.removeChapter(${idx})">删除</button>
                                            </div>
                                        </div>
                                        <div class="ts-ch-body-grid">
                                            <div class="ts-field">
                                                <label>本章论证提要</label>
                                                <textarea class="ts-textarea" rows="2" oninput="thesisStudio.updateChapterMeta(${idx}, 'summary', this.value)">${esc(ch.summary || "")}</textarea>
                                            </div>
                                            <div class="ts-field">
                                                <label>二级小节（每行一节）</label>
                                                <textarea class="ts-textarea" rows="3" oninput="thesisStudio.updateChapterMeta(${idx}, 'sections', this.value)">${esc((ch.sections || []).join("\n"))}</textarea>
                                            </div>
                                        </div>
                                        <div class="ts-ch-status-line">
                                            已撰正文：<strong>${countChineseWords(ch.content || "")} 字</strong>
                                            ${(ch.suggested_sources && ch.suggested_sources.length) ? ` · 建议参引：${esc(ch.suggested_sources.join("、"))}` : ""}
                                        </div>
                                    </div>
                                `).join("")}
                            </div>
                        ` : `
                            <div class="ts-empty-state">尚无大纲章节。请点击上方“一键生成三级大纲”由先生按当前题目与特藏引文自动编排，或点击“新增一章”自行构建。</div>
                        `}
                    </div>
                </div>
            `;
        }

        _renderStage4(p) {
            const chapters = p.chapters || [];
            if (chapters.length === 0) {
                return `
                    <div class="ts-stage-pane">
                        <div class="ts-card">
                            <div class="ts-empty-state">
                                尚未建立章节大纲。请先返回第三步一键生成三级大纲，或直接新增一章开始撰稿。
                                <div style="margin-top:12px; display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
                                    <button type="button" class="ts-btn-primary" onclick="thesisStudio.setStage(3)">前往编排大纲</button>
                                    <button type="button" class="ts-btn-outline" onclick="thesisStudio.addChapter()">立即新增第一章</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }

            if (this.activeChapterIndex >= chapters.length) this.activeChapterIndex = 0;
            const ch = chapters[this.activeChapterIndex];
            const chWords = countChineseWords(ch.content || "");

            return `
                <div class="ts-stage-pane ts-write-stage">
                    <div class="ts-chapter-tabs-strip">
                        ${chapters.map((item, idx) => `
                            <button type="button" class="ts-ch-pill ${idx === this.activeChapterIndex ? "active" : ""}" onclick="thesisStudio.selectWriteChapter(${idx})">
                                ${esc(item.title.slice(0, 14))}${item.title.length > 14 ? "…" : ""}（${countChineseWords(item.content || "")}字）
                            </button>
                        `).join("")}
                    </div>

                    <div class="ts-mobile-subtabs">
                        <button type="button" class="ts-subtab-btn ${this.mobileWriteTab === "editor" ? "active" : ""}" onclick="thesisStudio.setMobileWriteTab('editor')">正文编辑（${chWords}字）</button>
                        <button type="button" class="ts-subtab-btn ${this.mobileWriteTab === "mentor" ? "active" : ""}" onclick="thesisStudio.setMobileWriteTab('mentor')">考亭导师精批${this.isAssisting ? "（生成中）" : ""}</button>
                    </div>

                    <div class="ts-write-split">
                        <!-- 左栏：章节正文编辑器 -->
                        <div class="ts-write-editor-col ${this.mobileWriteTab === "editor" ? "mobile-show" : ""}">
                            <div class="ts-editor-toolbar">
                                <div class="ts-editor-meta">
                                    <strong>${esc(ch.title)}</strong>
                                    <span id="ts-chapter-word-count" class="ts-word-counter">${chWords} / ${ch.target_words || 1000} 字</span>
                                </div>
                                <div class="ts-editor-tools">
                                    ${(p.citations || []).length > 0 ? `
                                        <select class="ts-select compact" onchange="if(this.value!==''){thesisStudio.insertCitationIntoDraft(Number(this.value)); this.value='';}">
                                            <option value="">插入特藏引文...</option>
                                            ${p.citations.map((c, ci) => `<option value="${ci}">[${ci + 1}] ${esc(c.book_title)}</option>`).join("")}
                                        </select>
                                    ` : ""}
                                    <button type="button" class="ts-btn-subtle" onclick="thesisStudio.triggerDraftFileImport()">导入草稿</button>
                                    <input type="file" id="ts-draft-file-input" accept=".docx,.txt,.md,.pdf" style="display:none;" onchange="thesisStudio.handleDraftFileImport(this)">
                                </div>
                            </div>

                            ${ch.summary ? `<div class="ts-chapter-guide-strip"><strong>本章提要：</strong>${esc(ch.summary)}</div>` : ""}

                            <textarea id="ts-draft-textarea" class="ts-draft-textarea" placeholder="在此撰写或粘贴本章正文，或点击下方专项学术工具请考亭导师辅助起草、润色与考据增补..." oninput="thesisStudio.updateChapterDraft(this.value)">${esc(ch.content || "")}</textarea>

                            <div class="ts-ai-tools-bar">
                                <button type="button" class="ts-btn-primary compact" ${this.isAssisting ? "disabled" : ""} onclick="thesisStudio.runChapterAssist('draft')">按提纲生成参考初稿</button>
                                <button type="button" class="ts-btn-outline" ${this.isAssisting ? "disabled" : ""} onclick="thesisStudio.runChapterAssist('polish')">学术化润色</button>
                                <button type="button" class="ts-btn-outline" ${this.isAssisting ? "disabled" : ""} onclick="thesisStudio.runChapterAssist('cite')">原典考据增补</button>
                                <button type="button" class="ts-btn-outline" ${this.isAssisting ? "disabled" : ""} onclick="thesisStudio.runChapterAssist('diagnose')">论证逻辑诊断</button>
                            </div>
                            <div class="ts-editor-footnote">
                                <span id="ts-autosave-hint">研学草稿辅助工具：生成文本请结合武夷特藏原典自行核校与改写</span>
                                <button type="button" class="ts-btn-subtle" onclick="thesisStudio.setStage(5)">前往五维审稿与模拟答辩</button>
                            </div>
                        </div>

                        <!-- 右栏：考亭导师流式精批区 -->
                        <div class="ts-write-mentor-col ${this.mobileWriteTab === "mentor" ? "mobile-show" : ""}">
                            <div class="ts-mentor-head">
                                <strong>考亭导师学术精批${this.assistActionLabel ? " · " + esc(this.assistActionLabel) : ""}</strong>
                                ${this.isAssisting ? `<button type="button" class="ts-btn-mini danger" onclick="thesisStudio.stopAssist()">停止生成</button>` : ""}
                            </div>

                            <div id="ts-mentor-output" class="ts-mentor-output">
                                ${this.assistOutput
                                    ? this._renderPlainAcademic(this.assistOutput)
                                    : `<div class="ts-empty-state">点击左侧“按提纲生成参考初稿”“学术化润色”“原典考据增补”或“论证逻辑诊断”，考亭导师将紧扣朱子原典与本章提要在此实时批注。</div>`}
                            </div>

                            ${this.assistFallback ? `<div class="ts-fallback-tip">注：当前云端模型暂忙，以上由考亭本地学术引擎提供参考指引。</div>` : ""}

                            ${this.assistOutput && !this.isAssisting ? `
                                <div class="ts-adopt-bar">
                                    <button type="button" class="ts-btn-primary compact" onclick="thesisStudio.adoptAssistText('append')">追加至本章末尾</button>
                                    <button type="button" class="ts-btn-outline" onclick="thesisStudio.adoptAssistText('replace')">采纳替换本章</button>
                                    <button type="button" class="ts-btn-subtle" onclick="thesisStudio.copyAssistOutput()">复制</button>
                                </div>
                            ` : ""}

                            <div class="ts-mentor-ask-row">
                                <input type="text" class="ts-input" value="${esc(this.customAskText)}" placeholder="就本章义理、引文或论证思路向先生追问..." oninput="thesisStudio.customAskText = this.value" onkeydown="if(event.key==='Enter'){event.preventDefault(); thesisStudio.runChapterAssist('ask');}">
                                <button type="button" class="ts-btn-outline" ${this.isAssisting ? "disabled" : ""} onclick="thesisStudio.runChapterAssist('ask')">请益</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        _renderStage5(p) {
            const rev = p.review;
            const dqs = p.defense_questions || [];
            return `
                <div class="ts-stage-pane">
                    <!-- 五维学术体检 -->
                    <div class="ts-card">
                        <div class="ts-card-head">
                            <h4>五、考亭五维学术体检审稿</h4>
                            <button type="button" class="ts-btn-primary compact" ${this.isReviewing ? "disabled" : ""} onclick="thesisStudio.requestReview()">
                                ${this.isReviewing ? "审阅全文中..." : (rev ? "重新体检评分" : "发起全文五维体检")}
                            </button>
                        </div>

                        ${rev ? `
                            <div class="ts-review-summary">
                                <div class="ts-score-box">
                                    <div class="ts-score-big">${rev.overall_score}</div>
                                    <div class="ts-score-label">综合评分</div>
                                </div>
                                <div class="ts-review-meta">
                                    <div class="ts-grade-line">评审等第：<strong>${esc(rev.grade)}</strong></div>
                                    <div class="ts-stat-line">当前正文 ${rev.total_words || this.getTotalWords(p)} 字 · 已撰 ${rev.filled_chapters || 0}/${rev.chapter_count || (p.chapters || []).length} 章 · 特藏引文 ${rev.citation_count || (p.citations || []).length} 条</div>
                                    ${rev.mentor_verdict ? `<p class="ts-verdict-p">${esc(rev.mentor_verdict)}</p>` : ""}
                                </div>
                            </div>

                            <div class="ts-dim-list">
                                ${(rev.dimensions || []).map(d => `
                                    <div class="ts-dim-row">
                                        <div class="ts-dim-top">
                                            <strong>${esc(d.name)}</strong>
                                            <span>${d.score} 分</span>
                                        </div>
                                        <div class="ts-dim-track"><div class="ts-dim-fill" style="width:${Math.max(4, Math.min(100, d.score))}%"></div></div>
                                        <div class="ts-dim-comment">${esc(d.comment)}</div>
                                    </div>
                                `).join("")}
                            </div>

                            ${(rev.revisions || []).length > 0 ? `
                                <div class="ts-rev-list">
                                    <div class="ts-sub-label">可执行修改清单</div>
                                    ${rev.revisions.map(r => `
                                        <div class="ts-rev-item">
                                            <span class="ts-prio-tag prio-${r.priority === "高" ? "high" : "mid"}">${esc(r.priority || "中")}优</span>
                                            <div class="ts-rev-text">
                                                <strong>${esc(r.target)}</strong>：${esc(r.issue)}
                                                <div class="ts-rev-sugg">修订建议：${esc(r.suggestion)}</div>
                                            </div>
                                        </div>
                                    `).join("")}
                                </div>
                            ` : ""}
                        ` : `
                            <div class="ts-empty-state">点击“发起全文五维体检”，考亭导师将从选题立意、原典考据、论证逻辑、学术规范与行文风骨五个维度出具客观评分与修改清单。</div>
                        `}
                    </div>

                    <!-- 互动式模拟答辩 -->
                    <div class="ts-card">
                        <div class="ts-card-head">
                            <h4>互动式模拟答辩质询</h4>
                            <div class="ts-head-actions">
                                <button type="button" class="ts-btn-outline" ${this.isGeneratingDefense ? "disabled" : ""} onclick="thesisStudio.requestDefenseQuestions()">
                                    ${this.isGeneratingDefense ? "命制质询中..." : (dqs.length ? "重拟答辩质询" : "围绕本文生成三道质询")}
                                </button>
                                <button type="button" class="ts-btn-primary compact" onclick="thesisStudio.setStage(6)">下一步：成稿导出</button>
                            </div>
                        </div>

                        ${dqs.length > 0 ? `
                            <div class="ts-defense-list">
                                ${dqs.map((q, idx) => {
                                    const ansVal = (p.defense_answers && p.defense_answers[q.id]) || "";
                                    const ev = p.defense_evals && p.defense_evals[q.id];
                                    const busy = this.evaluatingDefenseId === q.id;
                                    return `
                                        <div class="ts-defense-card">
                                            <div class="ts-def-head">
                                                <span class="ts-index-tag">质询 ${idx + 1} · ${esc(q.category)}</span>
                                                <span class="ts-def-focus">考查要点：${esc(q.focus)}</span>
                                            </div>
                                            <div class="ts-def-q">${esc(q.question)}</div>
                                            <textarea class="ts-textarea" rows="3" placeholder="在此输入你的答辩陈词（结合朱子原典与本文论点回应）..." oninput="thesisStudio.updateDefenseAnswer('${esc(q.id)}', this.value)">${esc(ansVal)}</textarea>
                                            <div class="ts-def-actions">
                                                <button type="button" class="ts-btn-primary compact" ${busy ? "disabled" : ""} onclick="thesisStudio.submitDefenseAnswer('${esc(q.id)}')">
                                                    ${busy ? "评阅陈词中..." : "提交陈词请先生评阅"}
                                                </button>
                                            </div>
                                            ${ev ? `
                                                <div class="ts-def-eval">
                                                    <div class="ts-def-eval-top">
                                                        <strong>评阅得分：${ev.score} 分</strong>
                                                        <span>${esc(ev.verdict)}</span>
                                                    </div>
                                                    <p>${esc(ev.comment)}</p>
                                                    ${(ev.gaps && ev.gaps.length) ? `<div class="ts-def-gaps">补强提示：${esc(ev.gaps.join("；"))}</div>` : ""}
                                                    ${ev.model_answer ? `<div class="ts-def-model"><strong>参考应答思路：</strong>${esc(ev.model_answer)}</div>` : ""}
                                                </div>
                                            ` : ""}
                                        </div>
                                    `;
                                }).join("")}
                            </div>
                        ` : `
                            <div class="ts-empty-state">点击“围绕本文生成三道质询”，即可进行答辩委员会实战问答演练并获得逐题评分与应答示范。</div>
                        `}
                    </div>
                </div>
            `;
        }

        _renderStage6(p) {
            const totalWords = this.getTotalWords(p);
            const chCount = (p.chapters || []).length;
            const filledCount = (p.chapters || []).filter(c => countChineseWords(c.content || "") >= 60).length;
            const citCount = (p.citations || []).length;

            return `
                <div class="ts-stage-pane">
                    <div class="ts-card">
                        <div class="ts-card-head">
                            <h4>六、论文封面与署名信息（写入 Word 与开题报告抬头）</h4>
                            <span class="ts-head-note">均为可选项，留空则标注“待填写”</span>
                        </div>
                        <div class="ts-form-grid">
                            <div class="ts-field">
                                <label>作者姓名</label>
                                <input type="text" class="ts-input" value="${esc(p.author_name || "")}" placeholder="填写学生姓名" oninput="thesisStudio.updateField('author_name', this.value)">
                            </div>
                            <div class="ts-field">
                                <label>学号</label>
                                <input type="text" class="ts-input" value="${esc(p.student_id || "")}" placeholder="填写学号" oninput="thesisStudio.updateField('student_id', this.value)">
                            </div>
                            <div class="ts-field">
                                <label>所属学院 / 专业</label>
                                <input type="text" class="ts-input" value="${esc(p.college || "武夷学院")}" placeholder="例如：武夷学院人文与教师教育学院" oninput="thesisStudio.updateField('college', this.value)">
                            </div>
                            <div class="ts-field">
                                <label>指导教师</label>
                                <input type="text" class="ts-input" value="${esc(p.advisor || "")}" placeholder="填写指导教师姓名" oninput="thesisStudio.updateField('advisor', this.value)">
                            </div>
                        </div>
                    </div>

                    <div class="ts-card">
                        <div class="ts-card-head">
                            <h4>成稿核验与一键规范导出</h4>
                            <span class="ts-head-note">自动内嵌 GB/T 7714-2015 参考文献与武夷学院逸夫图书馆 OPAC 索书号对照表</span>
                        </div>

                        <div class="ts-export-summary-grid">
                            <div class="ts-export-stat"><span>论文题目</span><strong>${esc(p.title || "尚未拟题")}</strong></div>
                            <div class="ts-export-stat"><span>正文进度</span><strong>${totalWords} 字（已撰 ${filledCount}/${chCount} 章）</strong></div>
                            <div class="ts-export-stat"><span>参考文献</span><strong>${citCount} 条（国标规范）</strong></div>
                            <div class="ts-export-stat"><span>五维审稿</span><strong>${p.review ? `${p.review.overall_score} 分 · ${esc(p.review.grade)}` : "尚未体检（可选）"}</strong></div>
                        </div>

                        <div class="ts-export-cards-row">
                            <div class="ts-export-option">
                                <div class="ts-exp-title">Word 完整论文版（.docx）</div>
                                <p class="ts-exp-desc">包含标准中文字体排版、摘要与关键词、多级章节正文、原典楷体引文块、GB/T 7714 参考文献及武夷馆藏索书号附录。</p>
                                <button type="button" class="ts-btn-primary" ${this.exportingKey === "docx_full" ? "disabled" : ""} onclick="thesisStudio.exportFile('docx', 'full')">
                                    ${this.exportingKey === "docx_full" ? "正在生成 Word..." : "下载完整论文（.docx）"}
                                </button>
                            </div>

                            <div class="ts-export-option">
                                <div class="ts-exp-title">Word 开题报告书版（.docx）</div>
                                <p class="ts-exp-desc">按高校开题报告体例编排：基本信息表、选题依据、学术史综述脉络、章节框架、进度安排表、特藏书目与考亭评审意见栏。</p>
                                <button type="button" class="ts-btn-primary" ${this.exportingKey === "docx_proposal" ? "disabled" : ""} onclick="thesisStudio.exportFile('docx', 'proposal')">
                                    ${this.exportingKey === "docx_proposal" ? "正在生成开题报告..." : "下载开题报告书（.docx）"}
                                </button>
                            </div>

                            <div class="ts-export-option">
                                <div class="ts-exp-title">Markdown 文本版（.md）</div>
                                <p class="ts-exp-desc">纯净无冗余格式的 Markdown 文稿，便于导入 Typora、飞书文档、LaTeX 或版本管理工具继续协作排版。</p>
                                <div class="ts-md-export-btns">
                                    <button type="button" class="ts-btn-outline" ${this.exportingKey === "md_full" ? "disabled" : ""} onclick="thesisStudio.exportFile('md', 'full')">下载完整论文（.md）</button>
                                    <button type="button" class="ts-btn-subtle" ${this.exportingKey === "md_proposal" ? "disabled" : ""} onclick="thesisStudio.exportFile('md', 'proposal')">下载开题报告（.md）</button>
                                </div>
                            </div>
                        </div>

                        <div class="ts-backup-row">
                            <span class="ts-muted-tip">跨设备迁移草稿：</span>
                            <button type="button" class="ts-btn-subtle" onclick="thesisStudio.exportProjectJson()">导出项目 JSON 备份</button>
                            <button type="button" class="ts-btn-subtle" onclick="thesisStudio.triggerJsonImport()">导入项目 JSON 备份</button>
                            <input type="file" id="ts-json-import-input" accept=".json" style="display:none;" onchange="thesisStudio.handleJsonImport(this)">
                        </div>
                    </div>
                </div>
            `;
        }
    }

    window.thesisStudio = new ThesisStudioController();
})();
