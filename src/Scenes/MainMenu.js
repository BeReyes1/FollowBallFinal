class MainMenu extends Phaser.Scene {
    constructor() {
        super("MainMenu");
    }

    preload() {
        this.load.setPath("./assets/");
        this.load.image("checkeredBackground", "checkeredbackground.png");
    }

    create() {
        
        this.start = this.input.keyboard.addKey("S");
        
        this.mainMenuText = this.add.text(
        this.cameras.main.centerX, 
        this.cameras.main.centerY - 100, 
            'Follow Ball: VS!!!', 
            { fontSize: '70px', color: '#ffa500' }
        ).setOrigin(0.5);

        // Start Prompt
        this.startPrompt = this.add.text(
            this.cameras.main.centerX, 
            this.cameras.main.centerY + 50, 
            "Press 'S' to Start", 
            { fontSize: '40px', color: '#ffa500' }
        ).setOrigin(0.5);

        this.background = this.add.image(0, 0, 'checkeredBackground').setOrigin(0).setDepth(-10);
        this.background.setDisplaySize(this.sys.game.config.width, this.sys.game.config.height);
    }

    update() {
        if (this.start.isDown) {
            this.scene.start("FollowBall");
        }
    }

}