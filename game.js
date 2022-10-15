const shared = require("./public/shared.js");
const Seed = require("./public/seed.js");
const Generator = require("./generator.js");

class Game {
    constructor() {
        this.players = {};
        this.seeds = {};
        this.generator = new Generator(15, 3, 2);
        this.seedCount = 0;
        this.roundStart = Date.now();
        this.seedValidation = false;
        this.tagValidation = false;
    }
    start(hardTps) {
        let _this = this;
        let lastTime = Date.now();
        this.roundStart = Date.now();

        (function engineTick() {
            setTimeout(function() {
                let now = Date.now();
                let delta = now - lastTime;
                shared.tick(_this.players, _this.generator.tiles, delta);
                engineTick();
                lastTime = now;
            }, 16);
        })();

        setInterval(function() {
            _this.roundStart = Date.now();
            _this.gameOver();
        }, shared.roundTime);

        (function hardTick() {
            setTimeout(function() {
                _this.hardSync();
                hardTick();
            }, 1000 / hardTps);
        })();

        for (var i = 0; i < 100; i++) {
            this.addSeed(false);
        }

        setInterval(function() {
            _this.addSeed();
        }, 100);
    }
    gameOver() {
        let _this = this;
        let winner = Object.values(this.players).reduce((prev, current) => (prev.sync.score > current.sync.score) ? prev : current, { sync: { score: -1 } })
        for (var key in this.players) {
            let player = this.players[key];
            player.sync.speed = 0;
            player.socket.emit("winner", {
                name: winner.sync.name,
                score: winner.sync.score,
                roundStart: _this.roundStart
            });
        }
        setTimeout(function() {
            console.log("reset");
            for (var key in _this.players) {
                let player = _this.players[key];
                player.sync.pos = { x: 0, y: 0 };
                player.sync.score = 0;
                player.sync.invis = false;
                player.sync.speed = 1;
                player.speedEnd = 0;
                player.invisEnd = 0;
                clearTimeout(player.speedTimeout);
                clearTimeout(player.invisTimeout);
            }
        }, shared.winTime);
    }
    addSeed(send = true) {
        if (this.seedCount > 150) return;
        this.seedCount++;
        let id = Math.random().toString();
        let tiles = Object.keys(this.generator.tiles);
        let seed = new Seed(shared.deserialize2D(tiles[Math.floor(Math.random() * tiles.length)]));

        // if (this.seedCount == 1) {
        //     seed.pos = { x: 2, y: 2 };
        //     seed.type = "Invis";
        // }

        this.seeds[id] = seed;
        if (send) {
            for (var key in this.players) {
                this.players[key].socket.emit("add-seed", {
                    id: id,
                    data: seed
                });
            }
        }
    }
    addPlayer(id, player) {
        if (!Object.values(this.players).some(x => x.sync.tagState == shared.TagState.Tagged)) {
            player.sync.tagState = shared.TagState.Tagged;
        }
        this.players[id] = player;
        player.socket.emit("generate", { r: this.generator.rects, t: this.generator.tiles });
        player.socket.emit("set-seeds", this.seeds);
        player.socket.emit("set-time", this.roundStart);
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
