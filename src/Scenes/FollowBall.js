class FollowBall extends Phaser.Scene {
    constructor() {
        super("FollowBall");
    }

    preload() {
        this.load.setPath("./assets/");

        this.load.image("playerBall", "blueball.png");
        this.load.image("aiBall", "pinkball.png");
        this.load.image("defaultBall", "defaultball.png");
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
        this.aiTargetBall.setTexture("aiBall");

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

        console.log("AI guessed ball at index: " + this.balls.indexOf(guess));
        console.log("Correct ball was at index: " + this.balls.indexOf(this.aiTargetBall));
        this.aiGuess = guess;
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