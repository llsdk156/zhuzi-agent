/**
 * 朱子书院 · 动态水墨微风竹叶特效引擎 (Bamboo Leaves Falling Effect Engine)
 * 移动端优化：使用视口固定尺寸杜绝 iOS Safari 超大 Canvas 崩溃，自适应粒子数与 reduced-motion 支持
 */

(function () {
    class BambooLeavesEngine {
        constructor() {
            this.canvas = null;
            this.ctx = null;
            this.leaves = [];
            this.maxLeaves = 26;
            this.animationFrameId = null;
            this.isRunning = false;
            this.wind = 0.4;
            this.windTarget = 0.4;
            this.windTimer = 0;
            this.homeSection = null;
            this.prefersReducedMotion = false;

            this.leafColors = [
                { r: 48, g: 82, b: 56, a: 0.80 },
                { r: 68, g: 108, b: 78, a: 0.75 },
                { r: 88, g: 128, b: 96, a: 0.68 },
                { r: 110, g: 145, b: 115, a: 0.62 },
                { r: 125, g: 138, b: 98, a: 0.65 }
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

            if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                this.prefersReducedMotion = true;
                this.canvas.style.display = 'none';
                return;
            }

            this.ctx = this.canvas.getContext('2d');
            this.handleResize();
            window.addEventListener('resize', this.handleResize, { passive: true });

            this.resetLeaves();

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

        resetLeaves() {
            const isMobile = window.innerWidth < 768;
            this.maxLeaves = isMobile ? 10 : 26;
            this.leaves = [];
            for (let i = 0; i < this.maxLeaves; i++) {
                this.leaves.push(this.createLeaf(true));
            }
        }

        handleResize() {
            if (!this.canvas || !this.homeSection) return;
            // 始终以可视视口尺寸渲染（绝不使用整页 scrollHeight，彻底杜绝 iOS Safari 4096px 崩溃）
            const rect = this.homeSection.getBoundingClientRect();
            const width = Math.min(Math.max(rect.width || window.innerWidth, 320), window.innerWidth);
            const height = Math.min(window.innerHeight || 800, 1440);

            const isMobile = window.innerWidth < 768;
            const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
            this.canvas.width = Math.round(width * dpr);
            this.canvas.height = Math.round(height * dpr);
            this.canvas.style.width = width + 'px';
            this.canvas.style.height = height + 'px';

            if (this.ctx) {
                this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            }
            this.viewportWidth = width;
            this.viewportHeight = height;

            const desired = isMobile ? 10 : 26;
            if (this.leaves.length !== desired && this.leaves.length > 0) {
                this.resetLeaves();
            }
        }

        createLeaf(randomY = false) {
            const width = this.viewportWidth || window.innerWidth || 1200;
            const height = this.viewportHeight || window.innerHeight || 800;

            const colorObj = this.leafColors[Math.floor(Math.random() * this.leafColors.length)];
            const sizeBase = (window.innerWidth < 768 ? 14 : 18) + Math.random() * 14;

            return {
                x: Math.random() * (width + 120) - 60,
                y: randomY ? Math.random() * height : -30 - Math.random() * 40,
                length: sizeBase,
                width: sizeBase * (0.28 + Math.random() * 0.12),
                color: `rgba(${colorObj.r}, ${colorObj.g}, ${colorObj.b}, ${colorObj.a})`,
                opacity: colorObj.a,
                speedY: 0.8 + Math.random() * 1.1,
                speedX: 0.25 + Math.random() * 0.6,
                sway: Math.random() * Math.PI * 2,
                swaySpeed: 0.018 + Math.random() * 0.02,
                swayWidth: 0.7 + Math.random() * 1.1,
                angle: Math.random() * Math.PI * 2,
                rotateSpeed: (Math.random() - 0.5) * 0.025,
                flip: Math.random() * Math.PI * 2,
                flipSpeed: 0.02 + Math.random() * 0.03,
                curvature: (Math.random() - 0.5) * 4
            };
        }

        start() {
            if (this.isRunning || this.prefersReducedMotion) return;
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
            if (!this.homeSection || this.prefersReducedMotion) return;
            const isHomeActive = this.homeSection.classList.contains('active') &&
                                 window.getComputedStyle(this.homeSection).display !== 'none';
            if (isHomeActive) {
                this.handleResize();
                this.start();
            } else {
                this.stop();
            }
        }

        render() {
            if (!this.isRunning) return;

            const w = this.viewportWidth || window.innerWidth;
            const h = this.viewportHeight || window.innerHeight;
            this.ctx.clearRect(0, 0, w, h);

            this.windTimer += 0.01;
            if (Math.sin(this.windTimer) > 0.9) {
                this.windTarget = 0.3 + Math.random() * 0.7;
            }
            this.wind += (this.windTarget - this.wind) * 0.02;

            for (let i = 0; i < this.leaves.length; i++) {
                const leaf = this.leaves[i];
                leaf.sway += leaf.swaySpeed;
                leaf.flip += leaf.flipSpeed;
                leaf.angle += leaf.rotateSpeed;

                const swayOffset = Math.sin(leaf.sway) * leaf.swayWidth;
                leaf.x += leaf.speedX + this.wind + swayOffset * 0.5;
                leaf.y += leaf.speedY;

                this.ctx.save();
                this.ctx.translate(leaf.x, leaf.y);
                this.ctx.rotate(leaf.angle);
                const flipScale = Math.cos(leaf.flip);
                this.ctx.scale(flipScale, 1);

                this.ctx.globalAlpha = leaf.opacity * (0.65 + Math.abs(flipScale) * 0.35);
                this.ctx.fillStyle = leaf.color;

                const hl = leaf.length / 2;
                const hw = leaf.width / 2;
                const curve = leaf.curvature;

                this.ctx.beginPath();
                this.ctx.moveTo(0, -hl);
                this.ctx.quadraticCurveTo(hw + curve, 0, 0, hl);
                this.ctx.quadraticCurveTo(-hw + curve, 0, 0, -hl);
                this.ctx.closePath();
                this.ctx.fill();

                this.ctx.beginPath();
                this.ctx.moveTo(curve * 0.5, -hl + 2);
                this.ctx.lineTo(curve * 0.2, hl - 2);
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
                this.ctx.lineWidth = 0.75;
                this.ctx.stroke();
                this.ctx.restore();

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
