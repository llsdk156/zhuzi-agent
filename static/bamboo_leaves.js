/**
 * 朱子书院 · 动态水墨微风竹叶特效引擎 (Bamboo Leaves Falling Effect Engine)
 * 原生 Canvas 60FPS 竹叶3D翻转与随风飘逸动效
 */

(function () {
    class BambooLeavesEngine {
        constructor() {
            this.canvas = null;
            this.ctx = null;
            this.leaves = [];
            this.maxLeaves = 32;
            this.animationFrameId = null;
            this.isRunning = false;
            this.wind = 0.4;
            this.windTarget = 0.4;
            this.windTimer = 0;
            this.homeSection = null;

            // 宋代美学水墨竹青色系
            this.leafColors = [
                { r: 48, g: 82, b: 56, a: 0.82 },   // 深竹青
                { r: 68, g: 108, b: 78, a: 0.78 },  // 苍竹绿
                { r: 88, g: 128, b: 96, a: 0.72 },  // 嫩竹色
                { r: 110, g: 145, b: 115, a: 0.68 },// 水墨微青
                { r: 125, g: 138, b: 98, a: 0.70 }  // 竹黄泛青
            ];

            this.init = this.init.bind(this);
            this.render = this.render.bind(this);
            this.handleResize = this.handleResize.bind(this);
            this.checkVisibility = this.checkVisibility.bind(this);
        }

        init() {
            this.homeSection = document.getElementById('view-home');
            this.canvas = document.getElementById('home-bamboo-leaves-canvas');
            if (!this.canvas || !this.homeSection) {
                setTimeout(this.init, 100);
                return;
            }

            this.ctx = this.canvas.getContext('2d');
            this.handleResize();
            window.addEventListener('resize', this.handleResize);

            // 初始化竹叶群
            this.leaves = [];
            for (let i = 0; i < this.maxLeaves; i++) {
                this.leaves.push(this.createLeaf(true));
            }

            // 监听页面可见性与tab切换
            const observer = new MutationObserver(this.checkVisibility);
            observer.observe(this.homeSection, { attributes: true, attributeFilter: ['class', 'style'] });

            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.stop();
                } else {
                    this.checkVisibility();
                }
            });

            this.checkVisibility();
        }

        handleResize() {
            if (!this.canvas || !this.homeSection) return;
            const rect = this.homeSection.getBoundingClientRect();
            const width = rect.width || window.innerWidth;
            const height = rect.height || window.innerHeight;

            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            this.canvas.width = width * dpr;
            this.canvas.height = height * dpr;
            this.canvas.style.width = width + 'px';
            this.canvas.style.height = height + 'px';

            if (this.ctx) {
                this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            }
            this.viewportWidth = width;
            this.viewportHeight = height;
        }

        createLeaf(randomY = false) {
            const width = this.viewportWidth || window.innerWidth || 1200;
            const height = this.viewportHeight || window.innerHeight || 800;

            const colorObj = this.leafColors[Math.floor(Math.random() * this.leafColors.length)];
            const sizeBase = 18 + Math.random() * 16; // 18px - 34px

            return {
                x: Math.random() * (width + 120) - 60,
                y: randomY ? Math.random() * height : -30 - Math.random() * 40,
                length: sizeBase,
                width: sizeBase * (0.28 + Math.random() * 0.12), // 细长柳叶/竹叶形态
                color: `rgba(${colorObj.r}, ${colorObj.g}, ${colorObj.b}, ${colorObj.a})`,
                baseOpacity: colorObj.a,
                opacity: colorObj.a,
                speedY: 0.9 + Math.random() * 1.3,           // 下落速度
                speedX: 0.3 + Math.random() * 0.7,
                sway: Math.random() * Math.PI * 2,
                swaySpeed: 0.02 + Math.random() * 0.025,     // 摇曳频率
                swayWidth: 0.8 + Math.random() * 1.2,        // 摇曳幅度
                angle: Math.random() * Math.PI * 2,          // 平面旋转角
                rotateSpeed: (Math.random() - 0.5) * 0.03,   // 旋转速度
                flip: Math.random() * Math.PI * 2,           // 3D 翻转角
                flipSpeed: 0.025 + Math.random() * 0.035,    // 3D 翻转速度
                curvature: (Math.random() - 0.5) * 4         // 叶脉自然微弯弧度
            };
        }

        start() {
            if (this.isRunning) return;
            this.isRunning = true;
            this.render();
        }

        stop() {
            if (!this.isRunning) return;
            this.isRunning = false;
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
        }

        checkVisibility() {
            if (!this.homeSection) return;
            const isHomeActive = this.homeSection.classList.contains('active') && 
                                 window.getComputedStyle(this.homeSection).display !== 'none';
            if (isHomeActive) {
                this.start();
            } else {
                this.stop();
            }
        }

        render() {
            if (!this.isRunning) return;

            const w = this.viewportWidth || this.canvas.width;
            const h = this.viewportHeight || this.canvas.height;

            this.ctx.clearRect(0, 0, w, h);

            // 动态微风模拟（随时间平滑变化）
            this.windTimer += 0.01;
            if (Math.sin(this.windTimer) > 0.9) {
                this.windTarget = 0.3 + Math.random() * 0.8;
            }
            this.wind += (this.windTarget - this.wind) * 0.02;

            for (let i = 0; i < this.leaves.length; i++) {
                const leaf = this.leaves[i];

                // 运动物理计算
                leaf.sway += leaf.swaySpeed;
                leaf.flip += leaf.flipSpeed;
                leaf.angle += leaf.rotateSpeed;

                const swayOffset = Math.sin(leaf.sway) * leaf.swayWidth;
                leaf.x += leaf.speedX + this.wind + swayOffset * 0.5;
                leaf.y += leaf.speedY;

                // 绘制单片竹叶
                this.ctx.save();
                this.ctx.translate(leaf.x, leaf.y);
                this.ctx.rotate(leaf.angle);

                // 3D 翻转模拟 (通过水平缩放营造叶片在空中翻飞的透视感)
                const flipScale = Math.cos(leaf.flip);
                this.ctx.scale(flipScale, 1);

                this.ctx.globalAlpha = leaf.opacity * (0.65 + Math.abs(flipScale) * 0.35);
                this.ctx.fillStyle = leaf.color;

                // 竹叶形态：两端尖细、中间微宽、带有微弧度
                const hl = leaf.length / 2;
                const hw = leaf.width / 2;
                const curve = leaf.curvature;

                this.ctx.beginPath();
                this.ctx.moveTo(0, -hl); // 叶尖
                // 右叶缘
                this.ctx.quadraticCurveTo(hw + curve, 0, 0, hl); // 叶柄基部
                // 左叶缘
                this.ctx.quadraticCurveTo(-hw + curve, 0, 0, -hl);
                this.ctx.closePath();
                this.ctx.fill();

                // 叶片中脊脉络（细白色半透明微光）
                this.ctx.beginPath();
                this.ctx.moveTo(curve * 0.5, -hl + 2);
                this.ctx.lineTo(curve * 0.2, hl - 2);
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
                this.ctx.lineWidth = 0.75;
                this.ctx.stroke();

                this.ctx.restore();

                // 越界重置循环
                if (leaf.y > h + 30 || leaf.x > w + 60 || leaf.x < -80) {
                    this.leaves[i] = this.createLeaf(false);
                }
            }

            this.animationFrameId = requestAnimationFrame(this.render);
        }
    }

    window.bambooLeavesEngine = new BambooLeavesEngine();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.bambooLeavesEngine.init());
    } else {
        window.bambooLeavesEngine.init();
    }
})();
