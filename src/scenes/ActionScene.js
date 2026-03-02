export class ActionScene extends Phaser.Scene {
    constructor() {
        super('ActionScene');
        this.tileSize = 40;
    }

    init(data) {
        this.gridData = data.grid;
    }

    create() {
        const { width, height } = this.scale;

        this.platforms = this.physics.add.staticGroup();
        this.hazards = this.physics.add.staticGroup();
        this.projectiles = this.physics.add.group();
        this.jumpPads = this.physics.add.staticGroup();
        this.coreGroup = this.physics.add.staticGroup();

        this.parseGrid();

        this.player = this.physics.add.sprite(80, height - 100, null).setSize(30, 40);
        this.player.setCollideWorldBounds(true);
        this.player.setTint(0x00ffff);

        this.pRect = this.add.rectangle(0, 0, 30, 40, 0x00ffff);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.dashKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
        this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.overlap(this.player, this.hazards, this.die, null, this);
        this.physics.add.overlap(this.player, this.jumpPads, this.useJumpPad, null, this);
        this.physics.add.overlap(this.player, this.coreGroup, this.destroyCore, null, this);
        this.physics.add.collider(this.projectiles, this.platforms, (proj) => proj.destroy());
        this.physics.add.overlap(this.player, this.projectiles, this.die, null, this);

        this.canDoubleJump = true;
        this.isDashing = false;
        this.dashCooldown = false;

        this.add.text(20, 20, 'MISSÃO: DESTRUA O NÚCLEO', { color: '#ff00ff', fontSize: '24px', fontFamily: 'Orbitron' });
    }

    parseGrid() {
        for (let i = 0; i < this.gridData.length; i++) {
            for (let j = 0; j < this.gridData[i].length; j++) {
                const item = this.gridData[i][j];
                const x = i * this.tileSize + this.tileSize / 2;
                const y = j * this.tileSize + this.tileSize / 2;

                if (item === 'steel') {
                    this.platforms.create(x, y, null).setDisplaySize(40, 40).setTint(0x555555).refreshBody();
                } else if (item === 'spikes') {
                    this.hazards.create(x, y + 10, null).setDisplaySize(30, 20).setTint(0xff0000).refreshBody();
                    this.add.triangle(x, y + 10, 0, 10, 15, -10, 30, 10, 0xff0000);
                } else if (item === 'core') {
                    this.coreGroup.create(x, y, null).setDisplaySize(60, 60).refreshBody();
                    this.add.star(x, y, 5, 15, 30, 0x00ffff).setStrokeStyle(3, 0xff00ff);
                } else if (item === 'fake') {
                    this.add.rectangle(x, y, 40, 40, 0x444444);
                } else if (item === 'jump') {
                    this.jumpPads.create(x, y + 15, null).setDisplaySize(40, 10).setTint(0x00ff00).refreshBody();
                    this.add.rectangle(x, y + 15, 40, 10, 0x00ff00);
                } else if (item === 'turret') {
                    this.add.rectangle(x, y, 30, 30, 0xffff00);
                    this.time.addEvent({
                        delay: 2000,
                        callback: () => this.fireTurret(x, y),
                        loop: true
                    });
                }
            }
        }
    }

    fireTurret(x, y) {
        const proj = this.projectiles.create(x, y, null).setDisplaySize(10, 10);
        proj.setTint(0xffff00);
        proj.body.setAllowGravity(false);
        proj.setVelocityX(-400);
    }

    update() {
        if (this.isDashing) return;

        this.pRect.x = this.player.x;
        this.pRect.y = this.player.y;

        const onGround = this.player.body.blocked.down;
        const onWall = this.player.body.blocked.left || this.player.body.blocked.right;

        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-350);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(350);
        } else {
            this.player.setVelocityX(0);
        }

        if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            if (onGround) {
                this.player.setVelocityY(-600);
                this.canDoubleJump = true;
            } else if (onWall) {
                this.player.setVelocityY(-600);
                this.player.setVelocityX(this.player.body.blocked.left ? 400 : -400);
            } else if (this.canDoubleJump) {
                this.player.setVelocityY(-550);
                this.canDoubleJump = false;
            }
        }

        if (Phaser.Input.Keyboard.JustDown(this.dashKey) && !this.dashCooldown) {
            this.performDash();
        }

        if (onWall && !onGround) {
            this.player.setVelocityY(150);
        }
    }

    performDash() {
        this.isDashing = true;
        this.dashCooldown = true;
        const dir = this.cursors.left.isDown ? -1 : 1;
        this.player.setVelocity(900 * dir, 0);
        this.player.body.setAllowGravity(false);
        this.pRect.setFillStyle(0xffffff);

        this.time.delayedCall(250, () => {
            this.isDashing = false;
            this.player.body.setAllowGravity(true);
            this.pRect.setFillStyle(0x00ffff);
        });

        this.time.delayedCall(1200, () => this.dashCooldown = false);
    }

    useJumpPad(p, pad) {
        this.player.setVelocityY(-900);
    }

    destroyCore() {
        if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
            alert("SISTEMA INVADIDO! NÚCLEO DESTRUÍDO.");
            this.scene.start('MainMenu');
        }
    }

    die() {
        this.scene.restart();
    }
}
