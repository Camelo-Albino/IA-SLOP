// Configuração Global e Cenas Consolidadas para evitar erros de Módulos (CORS)

class Boot extends Phaser.Scene {
    constructor() { super('Boot'); }
    create() { this.scene.start('Preloader'); }
}

class Preloader extends Phaser.Scene {
    constructor() { super('Preloader'); }
    preload() {
        const { width, height } = this.scale;
        let bar = this.add.graphics();
        this.load.on('progress', (v) => {
            bar.clear();
            bar.fillStyle(0x00ffff, 1);
            bar.fillRect(width / 4, height / 2 - 25, (width / 2) * v, 50);
        });
        this.add.text(width / 2, height / 2 - 50, 'CARREGANDO SISTEMAS...', { fontSize: '24px', fontFamily: 'Orbitron', color: '#00ffff' }).setOrigin(0.5);
    }
    create() { this.scene.start('MainMenu'); }
}

class MainMenu extends Phaser.Scene {
    constructor() { super('MainMenu'); }
    create() {
        const { width, height } = this.scale;
        this.add.text(width / 2, height / 3, 'ROBO SIEGE', { fontSize: '112px', fontFamily: 'Orbitron', color: '#00ffff', stroke: '#ff00ff', strokeThickness: 12 }).setOrigin(0.5).setShadow(0, 0, '#00ffff', 20, true, true);
        const playBtn = this.add.text(width / 2, height / 1.6, 'INICIAR PROJETO', { fontSize: '42px', fontFamily: 'Orbitron', color: '#ffffff', backgroundColor: '#ff00ff', padding: { x: 40, y: 20 } }).setOrigin(0.5).setInteractive();
        playBtn.on('pointerdown', () => this.scene.start('BuildScene'));
        playBtn.on('pointerover', () => playBtn.setScale(1.1));
        playBtn.on('pointerout', () => playBtn.setScale(1.0));
    }
}

class BuildScene extends Phaser.Scene {
    constructor() {
        super('BuildScene');
        this.tileSize = 40;
        this.grid = [];
        this.cols = 32; this.rows = 18;
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
        this.grid = [];
        for (let i = 0; i < this.cols; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.rows; j++) this.grid[i][j] = null;
        }

        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0x00ffff, 0.1);
        for (let i = 0; i <= this.cols; i++) graphics.lineBetween(i * 40, 0, i * 40, 720);
        for (let j = 0; j <= this.rows; j++) graphics.lineBetween(0, j * 40, 1280, j * 40);

        this.createUI();
        this.createCore();

        this.input.on('pointerdown', (pointer) => this.placeItem(pointer));
        this.timeLeft = 60;
        this.timerText = this.add.text(20, 20, `TEMPO: ${this.timeLeft}s`, { fontSize: '28px', color: '#ff00ff', fontFamily: 'Orbitron' });
        this.time.addEvent({ delay: 1000, callback: () => { this.timeLeft--; this.timerText.setText(`TEMPO: ${this.timeLeft}s`); if (this.timeLeft <= 0) this.finishBuild(); }, loop: true });
    }

    createUI() {
        const { width, height } = this.scale;
        this.add.rectangle(width / 2, height - 60, 700, 100, 0x111111, 0.9).setStrokeStyle(3, 0x00ffff);
        let xOffset = width / 2 - 280;
        Object.keys(this.items).forEach(key => {
            const item = this.items[key];
            const btn = this.add.rectangle(xOffset, height - 60, 100, 60, item.color, 0.8).setInteractive().on('pointerdown', () => { this.selectedItem = key; this.highlightButtons(key); });
            this.add.text(xOffset, height - 60, item.label, { fontSize: '14px', fontFamily: 'Orbitron' }).setOrigin(0.5);
            btn.setData('key', key);
            xOffset += 115;
        });
        this.scrapText = this.add.text(width - 250, 20, `SUCATA: ${this.scrap}`, { fontSize: '28px', color: '#ffff00', fontFamily: 'Orbitron' });
    }

    highlightButtons(key) {
        // UI de destaque simples
    }

    createCore() {
        const x = this.cols - 3; const y = this.rows - 5;
        this.add.star(x * 40 + 20, y * 40 + 20, 5, 15, 30, 0x00ffff).setStrokeStyle(2, 0xff00ff);
        this.grid[x][y] = 'core';
    }

    placeItem(pointer) {
        if (pointer.y > 610) return;
        const x = Math.floor(pointer.x / 40);
        const y = Math.floor(pointer.y / 40);
        if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
            const item = this.items[this.selectedItem];
            if (this.scrap >= item.cost && !this.grid[x][y]) {
                this.scrap -= item.cost;
                this.grid[x][y] = this.selectedItem;
                this.scrapText.setText(`SUCATA: ${this.scrap}`);
                this.add.rectangle(x * 40 + 20, y * 40 + 20, 38, 38, item.color);
            }
        }
    }

    finishBuild() { this.scene.start('ActionScene', { grid: this.grid }); }
}

class ActionScene extends Phaser.Scene {
    constructor() { super('ActionScene'); }
    init(data) { this.gridData = data.grid; }
    create() {
        const { width, height } = this.scale;
        this.platforms = this.physics.add.staticGroup();
        this.hazards = this.physics.add.staticGroup();
        this.projectiles = this.physics.add.group();
        this.jumpPads = this.physics.add.staticGroup();
        this.coreGroup = this.physics.add.staticGroup();

        for (let i = 0; i < 32; i++) {
            for (let j = 0; j < 18; j++) {
                const item = this.gridData[i][j];
                const x = i * 40 + 20; const y = j * 40 + 20;
                if (item === 'steel') this.platforms.create(x, y, null).setDisplaySize(40, 40).setTint(0x555555).refreshBody();
                else if (item === 'spikes') { this.hazards.create(x, y + 10, null).setDisplaySize(30, 20).setTint(0xff0000).refreshBody(); this.add.triangle(x, y + 10, 0, 10, 15, -10, 30, 10, 0xff0000); }
                else if (item === 'core') { this.coreGroup.create(x, y, null).setDisplaySize(60, 60).refreshBody(); this.add.star(x, y, 5, 15, 30, 0x00ffff).setStrokeStyle(3, 0xff00ff); }
                else if (item === 'fake') this.add.rectangle(x, y, 40, 40, 0x444444);
                else if (item === 'jump') { this.jumpPads.create(x, y + 15, null).setDisplaySize(40, 10).setTint(0x00ff00).refreshBody(); this.add.rectangle(x, y + 15, 40, 10, 0x00ff00); }
                else if (item === 'turret') { this.add.rectangle(x, y, 30, 30, 0xffff00); this.time.addEvent({ delay: 2000, callback: () => this.fireTurret(x, y), loop: true }); }
            }
        }

        this.player = this.physics.add.sprite(80, height - 100, null).setSize(30, 40);
        this.player.setCollideWorldBounds(true).setTint(0x00ffff);
        this.pRect = this.add.rectangle(0, 0, 30, 40, 0x00ffff);
        this.cursors = this.input.keyboard.createCursorKeys();
        this.dashKey = this.input.keyboard.addKey('SHIFT');
        this.attackKey = this.input.keyboard.addKey('SPACE');

        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.overlap(this.player, this.hazards, () => this.scene.restart(), null, this);
        this.physics.add.overlap(this.player, this.jumpPads, () => this.player.setVelocityY(-900), null, this);
        this.physics.add.overlap(this.player, this.coreGroup, () => { if (Phaser.Input.Keyboard.JustDown(this.attackKey)) { alert("NÚCLEO DESTRUÍDO!"); this.scene.start('MainMenu'); } }, null, this);
        this.physics.add.overlap(this.player, this.projectiles, () => this.scene.restart(), null, this);
        this.physics.add.collider(this.projectiles, this.platforms, (p) => p.destroy());

        this.canDoubleJump = true; this.isDashing = false; this.dashCooldown = false;
        this.add.text(20, 20, 'MISSÃO: DESTRUA O NÚCLEO', { color: '#ff00ff', fontSize: '24px', fontFamily: 'Orbitron' });
    }

    fireTurret(x, y) {
        const p = this.projectiles.create(x, y, null).setDisplaySize(10, 10).setTint(0xffff00);
        p.body.setAllowGravity(false); p.setVelocityX(-400);
    }

    update() {
        if (this.isDashing) return;
        this.pRect.copyPosition(this.player);
        const onGround = this.player.body.blocked.down;
        const onWall = this.player.body.blocked.left || this.player.body.blocked.right;

        if (this.cursors.left.isDown) this.player.setVelocityX(-350);
        else if (this.cursors.right.isDown) this.player.setVelocityX(350);
        else this.player.setVelocityX(0);

        if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            if (onGround) { this.player.setVelocityY(-600); this.canDoubleJump = true; }
            else if (onWall) { this.player.setVelocityY(-600); this.player.setVelocityX(this.player.body.blocked.left ? 400 : -400); }
            else if (this.canDoubleJump) { this.player.setVelocityY(-550); this.canDoubleJump = false; }
        }

        if (Phaser.Input.Keyboard.JustDown(this.dashKey) && !this.dashCooldown) {
            this.isDashing = true; this.dashCooldown = true;
            this.player.setVelocity((this.cursors.left.isDown ? -900 : 900), 0);
            this.player.body.setAllowGravity(false);
            this.time.delayedCall(250, () => { this.isDashing = false; this.player.body.setAllowGravity(true); });
            this.time.delayedCall(1200, () => this.dashCooldown = false);
        }
    }
}

const config = {
    type: Phaser.AUTO, width: 1280, height: 720, parent: 'game-container', backgroundColor: '#0a0a0c',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: 'arcade', arcade: { gravity: { y: 1200 }, debug: false } },
    scene: [Boot, Preloader, MainMenu, BuildScene, ActionScene]
};

new Phaser.Game(config);
