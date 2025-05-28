class FollowBall extends Phaser.Scene {
    constructor() {
        super("FollowBall");
    }

    preload() {
        this.load.setPath("./assets/");

        this.load.image("playerBall", "blueball.png");
        this.load.image("defaultBall", "defaultball.png");
    }


    create() {

        this.numBalls = 4;
        this.balls = [];
        this.positions = [200, 300, 400, 500]; //positions for balls
        this.swapCount = 5; //min swaps
        this.maxSwapCount = 8; 
        this.swapSpeed = 200;
        this.speedIncrement = 200; //speed increase per round
        this.allowGuess = false;

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
                this.allowGuess = true;
                return;
            }

            // Pick two different balls
            let a = Phaser.Math.Between(0, this.numBalls - 1);
            let b;
            do {
                b = Phaser.Math.Between(0, this.numBalls - 1);
            } while (b === a);

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
        this.targetBall.setTexture("playerBall");

        if (ball === this.targetBall) {
            console.log("Correct!");
        } else {
            console.log("Incorrect");
        }

        //wait then prepare next round
        this.time.delayedCall(1500, () => {
            //increasing difficulty
            this.swapCount = Math.min(this.swapCount + 1, this.maxSwapCount);
            this.swapSpeed += this.speedIncrement; 

            this.PrepareNextRound();
        });
    }

    //function for moving to next round
    PrepareNextRound() {
        //Hide balls
        this.balls.forEach(ball => ball.setTexture("defaultBall"));

        this.time.delayedCall(300, () => {
            this.StartSwapping();
        });
    }
}