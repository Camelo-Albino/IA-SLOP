export class BuildScene extends Phaser.Scene {
    constructor() {
        super('BuildScene');
        this.tileSize = 40;
        this.grid = [];
        this.cols = 32;
        this.rows = 18;
        this.scrap = 500;
        this.selectedItem = 'steel';

        this.items = {
            steel: { cost: 10, color: 0x444444, label: 'Bloco Aço' },
            fake: { cost: 20, color: 0x8888ff, label: 'Bloco Falso' },
            spikes: { cost: 30, color: 0xff0000, label: 'Espinhos' },
            turret: { cost: 80, color: 0xffff00, label: 'Laser' },
            jump: { cost: 40, color: 0x00ff00, label: 'Impulso' }
        };
    }

    create() {
        this.renderGrid();
        this.createUI();
        this.createCore();

        this.input.on('pointerdown', (pointer) => this.placeItem(pointer));

        this.timeLeft = 60;
        this.timerText = this.add.text(20, 20, `TEMPO: ${this.timeLeft}s`, {
            fontSize: '28px',
            color: '#ff00ff',
            fontFamily: 'Orbitron'
        });

        this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.timeLeft--;
                this.timerText.setText(`TEMPO: ${this.timeLeft}s`);
                if (this.timeLeft <= 0) this.finishBuild();
            },
            loop: true
        });
    }

    renderGrid() {
        this.gridGraphics = this.add.graphics();
        this.gridGraphics.lineStyle(1, 0x00ffff, 0.1);

        for (let i = 0; i < this.cols; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.rows; j++) {
                this.grid[i][j] = null;
                this.gridGraphics.strokeRect(i * this.tileSize, j * this.tileSize, this.tileSize, this.tileSize);
            }
        }
    }

    createUI() {
        const { width, height } = this.scale;
        this.add.rectangle(width / 2, height - 60, 700, 100, 0x111111, 0.9).setStrokeStyle(3, 0x00ffff);

        let xOffset = width / 2 - 280;
        Object.keys(this.items).forEach(key => {
            const item = this.items[key];
            const btn = this.add.rectangle(xOffset, height - 60, 100, 60, item.color, 0.8)
                .setInteractive()
                .on('pointerdown', () => {
                    this.selectedItem = key;
                    this.highlightPalette(key);
                });

            this.add.text(xOffset, height - 60, item.label, { fontSize: '14px', fontFamily: 'Orbitron' }).setOrigin(0.5);
            xOffset += 115;

            if (key === 'steel') btn.setStrokeStyle(4, 0xffffff);
            btn.name = key;
        });

        this.scrapText = this.add.text(width - 250, 20, `SUCATA: ${this.scrap}`, {
            fontSize: '28px',
            color: '#ffff00',
            fontFamily: 'Orbitron'
        });
    }

    highlightPalette(key) {
        this.children.list.forEach(child => {
            if (child.name && Object.keys(this.items).includes(child.name)) {
                child.setStrokeStyle(child.name === key ? 4 : 0, 0xffffff);
            }
        });
    }

    createCore() {
        const x = this.cols - 3;
        const y = this.rows - 5;
        this.add.star(x * this.tileSize + 20, y * this.tileSize + 20, 5, 15, 30, 0x00ffff)
            .setStrokeStyle(2, 0xff00ff);
        this.grid[x][y] = 'core';
    }

    placeItem(pointer) {
        if (pointer.y > this.scale.height - 110) return;

        const x = Math.floor(pointer.x / this.tileSize);
        const y = Math.floor(pointer.y / this.tileSize);

        if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
            const itemConfig = this.items[this.selectedItem];

            if (this.scrap >= itemConfig.cost && !this.grid[x][y]) {
                this.scrap -= itemConfig.cost;
                this.grid[x][y] = this.selectedItem;
                this.scrapText.setText(`SUCATA: ${this.scrap}`);

                this.add.rectangle(
                    x * this.tileSize + this.tileSize / 2,
                    y * this.tileSize + this.tileSize / 2,
                    this.tileSize - 2,
                    this.tileSize - 2,
                    itemConfig.color
                );
            }
        }
    }

    finishBuild() {
        this.scene.start('ActionScene', { grid: this.grid });
    }
}
