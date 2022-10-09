const shared = require("./public/shared.js");
const Seed = require("./public/seed.js");
const Generator = require("./generator.js");

class Game {
    constructor() {
        this.players = {};
        this.seeds = {};
        this.generator = new Generator(15, 3, 2);
    }
    start(hardTps) {
        let _this = this;

        setInterval(function() {
            shared.tick(_this.players, 16);
        }, 16);

        (function hardTick() {
            setTimeout(function() {
                _this.hardSync();
                hardTick();
            }, 1000 / hardTps);
        })();
    }
    addSeed() {
        let seed = new Seed({ x: 100, y: 100 });
        let id = Math.random().toString();
        this.seeds[id] = seed;
        Object.values(this.players).forEach(function(player) {
            player.socket.emit("add-seed", {
                id: id,
                data: seed
            });
        });
    }
    addPlayer(id, player) {
        this.players[id] = player;
        player.socket.emit("generate", {r: this.generator.rects,t:this.generator.tiles});
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
