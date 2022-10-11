const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const shared = require("./public/shared.js");
const Game = require("./game.js");
const Player = require("./public/player.js");

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
            games.get(gameID).players[playerID].sync.dir = shared.normalize(dir);
        }
    });
    socket.on("pop-seed", function(id) {
        if (gameID) {
            let game = games.get(gameID);
            if (!game.seedValidation) return;
            let player = game.players[playerID];
            if (!game.seeds[id]) {
                return;
            }
            let coords = [game.seeds[id].pos.x * shared.tileSize + shared.tileSize / 2, game.seeds[id].pos.y * shared.tileSize + shared.tileSize / 2];

            // console.log(player.sync.pos.x - coords[0], player.sync.pos.x, coords[0]);
            // console.log(player.sync.pos.y - coords[1], player.sync.pos.y, coords[1]);
            if (!(player && Math.abs(player.sync.pos.x - coords[0]) < shared.tileSize * 2 && Math.abs(player.sync.pos.y - coords[1]) < shared.tileSize * 2)) {
                return;
            }

            player.sync.score += 1;
            Object.values(game.players).forEach(function(player) {
                player.socket.emit("pop-seed", id);
            });
            game.seedCount--;
            delete game.seeds[id];
        }
    });
});

server.listen(3000, function() {
    console.log("Listening");
});
