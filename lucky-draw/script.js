const app = {
    // State
    currentMode: null,
    isSpinning: false,

    // Red Grid Config
    redGridSize: 16, // 4x4
    redPrizes: [
        "頭獎\n整單免運", "貳獎\n500點", "肆獎\n200點", "伍獎\n100點", "參獎\n300點",
        "伍獎\n100點", "參獎\n300點", "頭獎\n整單免運", "伍獎\n100點",
        "肆獎\n200點", "貳獎\n500點", "參獎\n300點", "肆獎\n200點",
        "頭獎\n整單免運", "伍獎\n100點", "肆獎\n200點", "伍獎\n100點"
    ],
    // Correct 16 items for 4x4
    // R1: 0,1,2,3
    // R2: 4,5,6,7
    // R3: 8,9,10,11
    // R4: 12,13,14,15
    // But usually lottery grid is outer ring?
    // User image shows full 4x4 grid. The light jumps randomly or sequentially?
    // "Red is grid jumping" usually means sequential jumping around or random.
    // I'll implement sequential jumping for now (0->1->2...->15->0).

    // Green Wheel Config
    greenSegments: [
        "整單免運", "紅利 100點", "紅利 300點", "銘謝惠顧",
        "紅利 50點", "神秘小禮", "紅利 200點", "再接再厲"
    ],
    wheelColors: ['#FF0000', '#FFFFFF', '#FF0000', '#FFFFFF', '#FF0000', '#FFFFFF', '#FF0000', '#FFFFFF'],

    // DOM Elements
    elMainMenu: document.getElementById('mainMenu'),
    elRedMode: document.getElementById('redMode'),
    elGreenMode: document.getElementById('greenMode'),
    elGrid: document.getElementById('lotteryGrid'),
    elWheelCanvas: document.getElementById('wheelCanvas'),
    elResultModal: document.getElementById('resultModal'),
    elResultTitle: document.getElementById('resultTitle'),
    elResultPrize: document.getElementById('resultPrize'),

    init() {
        this.renderGrid();
        this.drawWheel(0);

        document.getElementById('btnRedStart').addEventListener('click', () => this.startRedGame());
        document.getElementById('btnGreenStart').addEventListener('click', () => this.startGreenGame());
    },

    // Navigation
    switchMode(mode) {
        this.currentMode = mode;
        this.elMainMenu.classList.remove('active');
        this.elMainMenu.classList.add('hidden');

        if (mode === 'red') {
            this.elRedMode.classList.remove('hidden');
            this.elRedMode.classList.add('active');
        } else {
            this.elGreenMode.classList.remove('hidden');
            this.elGreenMode.classList.add('active');
            this.drawWheel(0); // Redraw
        }
    },

    goHome() {
        this.currentMode = null;
        this.elRedMode.classList.add('hidden');
        this.elRedMode.classList.remove('active');
        this.elGreenMode.classList.add('hidden');
        this.elGreenMode.classList.remove('active');

        this.elMainMenu.classList.remove('hidden');
        this.elMainMenu.classList.add('active');
        this.isSpinning = false;
    },

    // Modal
    showResult(prize) {
        this.elResultPrize.textContent = prize;
        this.elResultModal.classList.remove('hidden');
        // Confetti?
    },

    closeModal() {
        this.elResultModal.classList.add('hidden');
        this.isSpinning = false;
    },

    // --- Red Grid Logic ---
    renderGrid() {
        this.elGrid.innerHTML = '';
        this.redPrizes.slice(0, 16).forEach((prize, idx) => {
            const div = document.createElement('div');
            div.className = 'grid-item';
            div.id = `grid-${idx}`;
            div.innerText = prize;
            this.elGrid.appendChild(div);
        });
    },

    async startRedGame() {
        if (this.isSpinning) return;
        this.isSpinning = true;

        // Random target
        const targetIndex = Math.floor(Math.random() * 16);
        const rounds = 3; // Spin at least 3 rounds
        const totalSteps = (rounds * 16) + targetIndex;

        let currentStep = 0;
        let speed = 100;
        let currentIndex = 0;

        const spin = () => {
            return new Promise(resolve => {
                const run = () => {
                    // Highlight current
                    document.querySelectorAll('.grid-item').forEach(el => el.classList.remove('active'));
                    document.getElementById(`grid-${currentIndex}`).classList.add('active');

                    // Audio effect here?

                    currentIndex = (currentIndex + 1) % 16;
                    currentStep++;

                    // Speed control
                    if (currentStep < totalSteps - 5) {
                        speed = Math.max(50, speed - 5); // Accelerate
                    } else {
                        speed += 100; // Decelerate at end
                    }

                    if (currentStep <= totalSteps) {
                        setTimeout(run, speed);
                    } else {
                        // Stop at target (targetIndex is effectively currentIndex - 1 because we incremented)
                        // Actually logic needs check.
                        // Let's rely on totalSteps.
                        // If currentStep == totalSteps + 1, we stopped.
                        // The last highlighted was targetIndex.
                        resolve();
                    }
                };
                run();
            });
        };

        // My logic above is slightly off.
        // Let's rewrite loop.
        let activeIdx = 0;
        for (let i = 0; i < totalSteps; i++) {
            // Unhighlight all
            document.querySelectorAll('.grid-item').forEach(el => el.classList.remove('active'));
            // Highlight current
            activeIdx = i % 16;
            document.getElementById(`grid-${activeIdx}`).classList.add('active');

            // Calculate delay
            let delay = 50;
            if (i < 5) delay = 200 - (i * 20); // Start slow
            else if (i > totalSteps - 8) delay = 100 + ((i - (totalSteps - 8)) * 50); // End slow

            await new Promise(r => setTimeout(r, delay));
        }

        // Done
        setTimeout(() => this.showResult(this.redPrizes[activeIdx]), 500);
    },

    // --- Green Wheel Logic ---
    drawWheel(angleOffset) {
        const ctx = this.elWheelCanvas.getContext('2d');
        const cx = 250;
        const cy = 250;
        const radius = 240;
        const numSegments = this.greenSegments.length;
        const arcSize = (2 * Math.PI) / numSegments;

        ctx.clearRect(0, 0, 500, 500);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angleOffset); // Rotate the whole wheel

        for (let i = 0; i < numSegments; i++) {
            const angle = i * arcSize;
            ctx.beginPath();
            ctx.fillStyle = this.wheelColors[i % this.wheelColors.length];
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius, angle, angle + arcSize);
            ctx.lineTo(0, 0);
            ctx.fill();
            ctx.stroke();

            // Text
            ctx.save();
            ctx.translate(Math.cos(angle + arcSize / 2) * (radius * 0.7), Math.sin(angle + arcSize / 2) * (radius * 0.7));
            ctx.rotate(angle + arcSize / 2 + Math.PI / 2); // Rotate text to face center
            ctx.fillStyle = i % 2 === 0 ? '#FFF' : '#d93025';
            ctx.font = 'bold 20px Noto Sans TC';
            ctx.textAlign = 'center';
            ctx.fillText(this.greenSegments[i], 0, 0);
            ctx.restore();
        }
        ctx.restore();
    },

    startGreenGame() {
        if (this.isSpinning) return;
        this.isSpinning = true;

        const targetIndex = Math.floor(Math.random() * this.greenSegments.length);
        // Calculate angle to land on target
        // Pointer is at top (270 deg or -90 deg).
        // Segment 0 starts at 0 deg (right).
        // To land on segment i, we need segment i to be at top.
        // Rotation = (360 - (i * arc + arc/2)) - 90?
        // It's easier to just spin random amount + correction.

        const numSegments = this.greenSegments.length;
        const arcSize = (2 * Math.PI) / numSegments;

        // We want the POINTER (top, -PI/2) to be inside the target segment.
        // Segment i spans [i*arc, (i+1)*arc].
        // If we want segment `targetIndex` to be at -PI/2, we need to rotate wheel by R.
        // (starting angle of seg i + R) must allow -PI/2.

        // Let's use simple physics: Final Angle.
        // Random spins (e.g. 5 full rounds + random).
        // Then calculate which segment is at Top.

        const rounds = 5 + Math.random() * 3;
        const finalAngle = rounds * 2 * Math.PI; // Random addition is built in rounds float
        const duration = 5000; // 5s

        const start = performance.now();
        const easeOutCubic = t => (--t) * t * t + 1;

        const animate = (time) => {
            const elapsed = time - start;
            const progress = Math.min(elapsed / duration, 1);
            const ease = easeOutCubic(progress);

            const currentRotation = finalAngle * ease;
            this.drawWheel(currentRotation);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Done. Calculate prize.
                // Normalize angle to [0, 2PI)
                const normAngle = currentRotation % (2 * Math.PI);
                // Pointer is at -PI/2 (Top).
                // Effectively, we checking what is at 270 deg (-90).
                // In canvas, 0 is Right, PI/2 is Bottom, PI is Left, 3PI/2 is Top.
                // We rotated the grid by `currentRotation`.
                // The Segment i was at [i*arc, (i+1)*arc]. Now it is at [i*arc + rot, (i+1)*arc + rot].
                // We want to know which i contains 3PI/2 (Top).

                // Angle at top relative to wheel rotation 0:
                // TopInWheelSpace = (3PI/2 - rot) normalized.

                let angleAtPointer = (Math.PI * 1.5 - normAngle) % (2 * Math.PI);
                if (angleAtPointer < 0) angleAtPointer += 2 * Math.PI;

                const winningIndex = Math.floor(angleAtPointer / arcSize);
                const prize = this.greenSegments[winningIndex];

                this.showResult(prize);
            }
        };
        requestAnimationFrame(animate);
    }
};

app.init();
