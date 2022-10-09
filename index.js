const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
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
            })
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
            if (dir.type == "xmove") {
                player.sync.dir.x = dir.value;
            } else if (dir.type == "ymove") {
                player.sync.dir.y = dir.value;
            }
        }
    });
});

server.listen(3000, () => {
    console.log("Listening");
});
