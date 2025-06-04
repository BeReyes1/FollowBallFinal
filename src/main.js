"use strict"

// game config
let config = {
    parent: 'phaser-game',
    type: Phaser.CANVAS,
    render: {
        pixelArt: true  // prevent pixel art from getting blurred when scaled
    },
    width: 1440,
    height: 900,
    backgroundColor: '#222222',
    scene: [MainMenu, FollowBall, Credits]
}

var cursors;
var my = {sprite: {}, text: {}, vfx: {}};

const game = new Phaser.Game(config);