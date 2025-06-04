class FollowBall extends Phaser.Scene {
    constructor() {
        super("FollowBall");
    }

    preload() {
        this.load.setPath("./assets/");

        this.load.image("playerBall", "blueball.png");
        this.load.image("aiBall", "pinkball.png");
        this.load.image("defaultBall", "defaultball.png");
        this.load.image("arrowDown", "navigation_s.png");
        this.load.image("checkeredBackground", "checkeredbackground.png");

        this.load.audio("swap", "card-shove-1.ogg");
        this.load.audio("good", "jingles_SAX10.ogg");
        this.load.audio("mistake", "jingles_SAX07.ogg");
        this.load.audio("start", "jingles_PIZZI09.ogg");

        this.load.multiatlas("kenny-particles", "kenny-particles.json");
    }


    create() {

        //Ball Data
        this.numBalls = 4;
        this.balls = [];
        this.positions = [200, 300, 400, 500]; //positions for balls
        this.swapCount = 5; //min swaps
        this.maxSwapCount = 8; 
        this.swapSpeed = 200;
        this.speedIncrement = 200; //speed increase per round
        this.allowGuess = false;

        //AI
        this.randomGuessSpeed = 1000; //when the balls move too fast for the ai 
        this.lastTargetSwap;

        //Round data
        this.totalRounds = 10;
        this.currentRound = 1;

        //Round score
        this.roundScore = 1; //how many points each round is
        this.playerScore = 0;
        this.aiScore = 0; 

        //set balls and let them be clickable
        for (let i = 0; i < this.numBalls; i++) {
            const ball = this.add.image(this.positions[i], 300, 'defaultBall')
            .setOrigin(0.5)
            .setScale(0.5);
            ball.setInteractive();
            ball.ballIndex = i;
            ball.on('pointerdown', () => this.HandlePlayerGuess(ball));
            this.balls.push(ball);
        }

        // Randomly choose target ball
        this.targetBall = this.balls[Phaser.Math.Between(0, this.numBalls - 1)];
        this.targetBall.setTexture("playerBall");

        //Randomly choose AI target's ball
        this.aiTargetBall = this.balls[Phaser.Math.Between(0, this.numBalls - 1)];

        // Ensure they aren't the same
        while (this.aiTargetBall === this.targetBall) {
            this.aiTargetBall = this.balls[Phaser.Math.Between(0, this.numBalls - 1)];
        }
        this.aiTargetBall.setTexture("aiBall");

        //pops up for AI guess
        this.aiIndicator = this.add.image(100, 100, "arrowDown");
        this.aiIndicator.setScale(1); 
        this.aiIndicator.setVisible(false);
        this.aiIndicator.setDepth(1);

        this.background = this.add.image(0, 0, 'checkeredBackground').setOrigin(0).setDepth(-10);
        this.background.setDisplaySize(this.sys.game.config.width, this.sys.game.config.height);

        //Text
        this.chooseText = this.add.text(300, 150, 'Choose Now!', {
            fontSize: '32px',
            fill: '#0000ff'
        }).setOrigin(0.5).setVisible(false);

        this.playerScoreText = this.add.text(20, 20, 'Player Score: 0', {
            fontSize: '24px',
            fill: '#0000ff',
            fontFamily: 'Arial'
        });

        this.aiScoreText = this.add.text(20, 50, 'AI Score: 0', {
            fontSize: '24px',
            fill: '#ff00ff',
            fontFamily: 'Arial'
        });

        //vfx
        this.vfx = {};
        this.vfx.correct = this.add.particles(0, 0, "kenny-particles", {
            frame: ['star_01.png', 'star_09.png'],
            scale: {start: 0.03, end: 0.15},
            maxAliveParticles: 5,
            lifespan: 600,
            alpha: {start: 1, end: 0.1}, 
        });

        this.vfx.correct.stop();

        this.vfx.wrong = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_01.png', 'smoke_10.png'],
            scale: {start: 0.03, end: 0.15},
            maxAliveParticles: 5,
            lifespan: 600,
            alpha: {start: 1, end: 0.1}, 
        });

        this.vfx.wrong.stop();

        // After 1.5s, start the game!
        this.time.delayedCall(1500, () => {
            this.balls.forEach(ball => ball.setTexture('defaultBall')); // hide all
            this.StartSwapping();
        });

    }

    //function for handling the swapping of the balls
     StartSwapping() {
        let swapsDone = 0;

        let maxSwapsRound = Phaser.Math.Between(this.swapCount, this.maxSwapCount);

        const doSwap = () => {
            if (swapsDone >= maxSwapsRound) { //when done allow guess
                this.chooseText.setVisible(true);
                this.SimulateAIGuess();
                this.allowGuess = true;
                return;
            }

            // Pick two different balls
            let a = Phaser.Math.Between(0, this.numBalls - 1);
            let b;
            do {
                b = Phaser.Math.Between(0, this.numBalls - 1);
            } while (b === a);

            this.sound.play("swap");

            const ballA = this.balls[a];
            const ballB = this.balls[b];
            const tempX = ballA.x;

            // Calculate distance between them
            const distance = Math.abs(ballA.x - ballB.x);
            const duration = (distance / this.swapSpeed) * 1000; 

            this.lastTargetSwap = { a: ballA, b: ballB };
            // Tween A to B's x
            this.tweens.add({
                targets: ballA,
                x: ballB.x,
                duration: duration
            });

            this.tweens.add({
                targets: ballB,
                x: tempX,
                duration: duration,
                onComplete: () => {
                    [this.balls[a], this.balls[b]] = [this.balls[b], this.balls[a]];
                    swapsDone++;
                    // Wait until the swap finishes, small buffer before next
                    this.time.delayedCall(duration * 0.25, doSwap);
                }
            });
                    };

        doSwap();
    }

    //function for handling the player's guess when the click the ball
    HandlePlayerGuess(ball) {
        if (!this.allowGuess) return;

        this.allowGuess = false;
        this.chooseText.setVisible(false);
        this.targetBall.setTexture("playerBall");
        this.aiTargetBall.setTexture("aiBall");

        if (ball === this.targetBall) {
            this.vfx.correct.explode(80, ball.x, ball.y);
            this.sound.play("good");

            this.playerScore += this.roundScore;
        } else {
            this.vfx.wrong.explode(80, ball.x, ball.y);
            this.sound.play("mistake");
        }

        this.UpdateScores();

        //wait then prepare next round
        this.time.delayedCall(1500, () => {
            //increasing difficulty
            this.swapCount = Math.min(this.swapCount + 1, this.maxSwapCount);
            this.swapSpeed += this.speedIncrement; 

            this.PrepareNextRound();
        });
    }

    //AI
    //AI's accuracy decays exponetially in realtion to the speed
    GetAIAccuracy(currentSpeed) {
         const initialAccuracy = 0.95;
         const decayRate = 0.0005; 
         return Math.max(0.1, initialAccuracy * Math.exp(-decayRate * currentSpeed));
    }


    //function calculates guess based on parameters
    SimulateAIGuess() {
        const aiAccuracy = this.GetAIAccuracy(this.swapSpeed);
        const makesCorrectGuess = Math.random() < aiAccuracy;

        let guess;
        //if swaps too fast, ai guesses randomly 
        if (this.swapSpeed >= this.randomGuessSpeed) {
            console.log("AI overwhelmed — choosing at random.");
            guess = Phaser.Utils.Array.GetRandom(this.balls);
        }else if (makesCorrectGuess) {//ai guessed correctly
            guess = this.aiTargetBall;
            console.log("Ai guessed correctly!");
        } else {//ai guessed wrong, calculates if it will guess the ball next from the correct ball
            const confusedChance = 0.7;
            if (Math.random() < confusedChance && this.lastTargetSwap) {
                guess = this.lastTargetSwap.a === this.aiTargetBall
                    ? this.lastTargetSwap.b
                    : this.lastTargetSwap.a;
            } else {
                const wrongBalls = this.balls.filter(b => b !== this.aiTargetBall);
                guess = Phaser.Utils.Array.GetRandom(wrongBalls);
            }
        }

         if (this.balls.indexOf(guess) == this.balls.indexOf(this.aiTargetBall)) {
            this.aiScore += this.roundScore;
        }

        console.log("AI guessed ball at index: " + this.balls.indexOf(guess));
        console.log("Correct ball was at index: " + this.balls.indexOf(this.aiTargetBall));
        this.aiGuess = guess;
        this.ShowAIPick(this.aiGuess);
    }

    ShowAIPick(ball) {
        // Remove previous indicator if it exist

        const arrowOffset = 60;
        const x = ball.x;
        const y = ball.y - arrowOffset;

         this.aiIndicator.setPosition(x, y);
        this.aiIndicator.setVisible(true);
    }

    //function for moving to next round
    PrepareNextRound() {
        this.currentRound++;
        this.roundScore++;

        //Hide balls+indicator
        this.balls.forEach(ball => ball.setTexture("defaultBall"));
        this.aiIndicator.setVisible(false);

        console.log("Current Round" + this.currentRound);

        if (this.currentRound > this.totalRounds) {
             this.add.text(400, 200, "Game Over!", { fontSize: '64px', color: '#ffa500' }).setOrigin(0.5);
             
            if (this.playerScore > this.aiScore) {
                this.add.text(400, 100, "You Win!", { fontSize: '64px', color: '#ffa500' }).setOrigin(0.5);
            }else if (this.aiScore > this.playerScore){
                this.add.text(400, 100, "You Lose!", { fontSize: '64px', color: '#ffa500' }).setOrigin(0.5);
            }else {
                this.add.text(400, 100, "Draw", { fontSize: '64px', color: '#ffa500' }).setOrigin(0.5);
            }

            this.add.text(400, 300, "Press R to Restart", { fontSize: '32px', color: '#ffa500' }).setOrigin(0.5);
            this.add.text(400, 350, "Press C for Credits", { fontSize: '32px', color: '#ffa500' }).setOrigin(0.5);

            this.input.keyboard.once('keydown-C', () => {
                this.scene.start('Credits'); 
            });

            this.add.text(400, 300, "Press R to Restart", { fontSize: '32px', color: '#ffa500' }).setOrigin(0.5);
            this.input.keyboard.once('keydown-R', () => {
                this.scene.start('FollowBall'); 
            });

            return;

        }

        this.sound.play("start");


        this.time.delayedCall(300, () => {
            this.StartSwapping();
        });
    }

    UpdateScores() {
        this.playerScoreText.setText('Player Score: ' + this.playerScore);
        this.aiScoreText.setText('AI Score: ' + this.aiScore);
    }
}