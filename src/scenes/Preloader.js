export class Preloader extends Phaser.Scene {
    constructor() {
        super('Preloader');
    }

    preload() {
        let width = this.cameras.main.width;
        let height = this.cameras.main.height;

        let bar = this.add.graphics();
        this.load.on('progress', (value) => {
            bar.clear();
            bar.fillStyle(0x00ffff, 1);
            bar.fillRect(width / 4, height / 2 - 25, (width / 2) * value, 50);
        });

        this.add.text(width / 2, height / 2 - 50, 'CARREGANDO SISTEMAS...', {
            fontSize: '24px',
            fontFamily: 'Orbitron',
            color: '#00ffff'
        }).setOrigin(0.5);
    }

    create() {
        this.scene.start('MainMenu');
    }
}
