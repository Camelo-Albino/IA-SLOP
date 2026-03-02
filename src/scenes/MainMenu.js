export class MainMenu extends Phaser.Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        const { width, height } = this.scale;

        this.add.text(width / 2, height / 3, 'ROBO SIEGE', {
            fontSize: '112px',
            fontFamily: 'Orbitron',
            color: '#00ffff',
            stroke: '#ff00ff',
            strokeThickness: 12
        }).setOrigin(0.5).setShadow(0, 0, '#00ffff', 20, true, true);

        const playBtn = this.add.text(width / 2, height / 1.6, 'INICIAR PROJETO', {
            fontSize: '42px',
            fontFamily: 'Orbitron',
            color: '#ffffff',
            backgroundColor: '#ff00ff',
            padding: { x: 40, y: 20 }
        }).setOrigin(0.5).setInteractive();

        playBtn.on('pointerdown', () => this.scene.start('BuildScene'));
        playBtn.on('pointerover', () => playBtn.setScale(1.1));
        playBtn.on('pointerout', () => playBtn.setScale(1.0));
    }
}
