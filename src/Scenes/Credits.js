class Credits extends Phaser.Scene {
    constructor() {
        super("Credits");
    }

    create() {
        
        this.exit = this.input.keyboard.addKey("E");


        this.mainMenuText = this.add.text(
        this.cameras.main.centerX, 
        this.cameras.main.centerY - 100, 
            'Credits:', 
            { fontSize: '70px', color: '#ffffff' }
        ).setOrigin(0.5);

        this.credits1Prompt = this.add.text(
            this.cameras.main.centerX, 
            this.cameras.main.centerY + 50, 
            "Creator: Beckham Reyes", 
            { fontSize: '40px', color: '#ffffff' }
        ).setOrigin(0.5);

        this.credits2Prompt = this.add.text(
            this.cameras.main.centerX, 
            this.cameras.main.centerY + 100, 
            "Assets via Kenney", 
            { fontSize: '40px', color: '#ffffff' }
        ).setOrigin(0.5);

    }

    update() {
        if (this.exit.isDown) {
            this.scene.start("MainMenu");
        }
    }
}