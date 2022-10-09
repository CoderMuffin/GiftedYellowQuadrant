const shared = require("./public/shared.js");
const Seed = require("./public/seed.js");
const Generator = require("./generator.js");

class Game {
    constructor() {
        this.players = {};
        this.seeds = [];
        this.generator = new Generator(15, 3, 2);
        this.seedCount = 0;
    }
    start(hardTps) {
        let _this = this;
        let lastTime = Date.now();

        (function engineTick() {
            setTimeout(function() {
                let now = Date.now();
                let delta = now - lastTime;
                shared.tick(_this.players, _this.generator.tiles, delta);
                engineTick();
                lastTime = now;
            }, 16);
        })();

        (function hardTick() {
            setTimeout(function() {
                _this.hardSync();
                hardTick();
            }, 1000 / hardTps);
        })();

        for (var i = 0; i < 100; i++) {
            this.addSeed(false);
        }

        Object.values(this.players).forEach(function(player) {
            player.socket.emit("set-seeds", _this.seeds);
        });

        setInterval(function() {
            _this.addSeed();
        }, 100);
    }
    addSeed(send = true) {
        if (this.seedCount > 150) return;
        this.seedCount++;
        let tiles = Object.keys(this.generator.tiles);
        let seed = new Seed(shared.deserialize2D(tiles[Math.floor(Math.random() * tiles.length)]));
        this.seeds.push(seed);
        if (send) {
            Object.values(this.players).forEach(function(player) {
                player.socket.emit("add-seed", seed);
            });
        }
    }
    addPlayer(id, player) {
        this.players[id] = player;
        player.socket.emit("generate", { r: this.generator.rects, t: this.generator.tiles });
    }
    removePlayer(id) {
        delete this.players[id];
    }
    hardSync() { //returns all player data
        let data = Object.entries(this.players).map(function(e) {
            return {
                id: e[0],
                sync: e[1].sync
            }
        });
        Object.values(this.players).forEach(function(player) {
            player.socket.emit("hard-sync", data);
        });
    }
}

module.exports = Game
