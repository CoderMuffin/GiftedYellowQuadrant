const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const shared = require("./public/shared.js");
const Game = require("./game.js");
const Player = require("./public/player.js");
const Seed = require("./public/seed.js");

app.use(express.static("public"));

var games = new Map();

io.on("connection", function(socket) {
    let playerID = Math.random().toString();
    let gameID;
    socket.once("disconnect", function() {
        console.log("disconnected");
        if (gameID) {
            games.get(gameID)?.removePlayer(playerID);
            Object.values(games.get(gameID).players).forEach(function(player) {
                player.socket.emit("client-disconnect", { id: playerID });
            });
        }
    });
    socket.once("join-game", function(args) {
        gameID = args.gameID;
        if (!games.get(gameID)) {
            console.log("Created game " + gameID);
            games.set(gameID, new Game());
            games.get(gameID).start(20);
        }
        let player = new Player(args.name, socket);
        games.get(gameID).addPlayer(playerID, player);
        socket.emit("set-id", playerID);
        console.log("Joined game " + gameID);
    });
    socket.on("set-move", function(dir) {
        if (gameID) {
            let player = games.get(gameID).players[playerID];
            if (player && player.sync.tagState !== shared.TagState.Cooldown) {
                player.sync.dir = shared.normalize(dir);
            }
        }
    });
    socket.on("pop-seed", function(id) {
        if (gameID) {
            let game = games.get(gameID);
            let player = game.players[playerID];
            if (!game.seeds[id]) {
                return;
            }
            if (game.seedValidation) {
                let coords = [game.seeds[id].pos.x * shared.tileSize + shared.tileSize / 2, game.seeds[id].pos.y * shared.tileSize + shared.tileSize / 2];
                // console.log(player.sync.pos.x - coords[0], player.sync.pos.x, coords[0]);
                // console.log(player.sync.pos.y - coords[1], player.sync.pos.y, coords[1]);
                if (!(player && Math.abs(player.sync.pos.x - coords[0]) < shared.tileSize * 2 && Math.abs(player.sync.pos.y - coords[1]) < shared.tileSize * 2)) {
                    return;
                }
            }
            if (game.seeds[id].type == Seed.SeedType.Normal) {
                player.sync.score += 1;
            } else if (game.seeds[id].type == Seed.SeedType.Big) {
                player.sync.score += 10;
            } else if (game.seeds[id].type == Seed.SeedType.Invis) {
                if (player.sync.tagState == shared.TagState.Tagged) {
                    player.sync.score += 10;
                } else {
                    player.sync.invis = true;
                    player.invisEnd = Math.max(Date.now(), player.invisEnd);
                    player.invisEnd += 10000;
                    clearTimeout(player.invisTimeout);
                    player.invisTimeout = setTimeout(function() {
                        player.sync.invis = false;
                        player.invisEnd = 0;
                    }, player.invisEnd - Date.now());
                }
            } else {
                player.sync.speed = 1.3;
                player.speedEnd = Math.max(Date.now(), player.speedEnd);
                player.speedEnd += 10000;
                clearTimeout(player.speedTimeout);
                player.speedTimeout = setTimeout(function() {
                    player.sync.speed = 1;
                    player.speedEnd = 0;
                }, player.speedEnd - Date.now());
            }
            Object.values(game.players).forEach(function(player) {
                player.socket.emit("pop-seed", id);
            });
            game.seedCount--;
            delete game.seeds[id];
        }
    });
    socket.on("tag", function(p) {
        //console.log("tag");
        let game = games.get(gameID);
        let tagger = game.players[playerID];
        let victim = game.players[p];
        //console.log(tagger != undefined, victim != undefined);
        if (!tagger) return;
        if (!victim) return;
        //console.log(tagger.sync.tagState, victim.sync.tagState);
        if (game.tagValidation &&
            !(Math.abs(tagger.sync.pos.x - victim.sync.pos.x) < shared.tileSize * 4 &&
                Math.abs(tagger.sync.pos.y - victim.sync.pos.y) < shared.tileSize * 4)) {
            return;
        }
        if (tagger.sync.tagState == shared.TagState.Tagged && victim.sync.tagState == shared.TagState.Innocent && !victim.sync.invis) {
            victim.sync.tagState = shared.TagState.Cooldown;
            victim.sync.dir = { x: 0, y: 0 };
            let seedsTake = Math.floor(victim.sync.score / 2);
            victim.sync.score -= seedsTake;
            tagger.sync.score += seedsTake;
            setTimeout(function() {
                victim.sync.tagState = shared.TagState.Tagged;
            }, 5000);
            tagger.sync.tagState = shared.TagState.Innocent;
        }
    });
});

server.listen(3000, function() {
    console.log("Listening");
});
