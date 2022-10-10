var socket;
var players = {};
var seeds = {};
var data;
var screenWidth = 800;
var screenHeight = 600;
var joined = false;
var localPlayer;
var tiles = {};
var rects = [];

let walls = shared.walls;
//engine.gravity.y = 0;

function updatePlayer(player, update) {
    player.sync = update.sync;
}

function joinGame() {
    if (joined) return;
    let gameID = document.getElementById("input-game-id").value;
    let elJoinRow = document.getElementById("join-row");
    let elInfo = document.getElementById("info");
    elJoinRow.style.opacity = "0";
    elJoinRow.style.maxHeight = "0px";
    elInfo.style.opacity = "1";
    elInfo.innerHTML = "Game ID: <code></code>";
    elInfo.children[0].textContent = gameID;
    joined = true;
    socket = io({
        reconnect: false
    });
    socket.on("generate", function(data) {
        tiles = data.t;
        rects = data.r;
    });
    socket.on("set-id", function(data) {
        localPlayer = data;
    });
    socket.on("set-seeds", function(data) {
        seeds = data;
    });
    socket.on("add-seed", function(data) {
        seeds[data.id] = data.data;
    });
    socket.on("pop-seed", function(data) {
        delete seeds[data];
    });
    socket.on("hard-sync", function(data) {
        for (var update of data) {
            if (players[update.id]) {
                updatePlayer(players[update.id], update);
            } else {
                let player = new Player(update.name, null);
                updatePlayer(player, update);
                players[update.id] = player;
            }
        }
    });
    socket.on("client-disconnect", function(data) {
        delete players[data.id];
    });
    socket.on("disconnect", function() {
        alert("Disconnected, reload to reconnect");
    });
    socket.emit("join-game", {
        gameID: gameID,
        name: document.getElementById("input-name").value
    });
}

let img;

function preload() {
    img = loadImage("agouti.png");
}

function setup() {
    rectMode(CORNERS);
    createCanvas(screenWidth, screenHeight).parent("canvas-container");
    noStroke();
    noSmooth();
}

function drawPlayer(m) {
    fill(0, 0, 255);
    push();
    translate(m.sync.pos.x, m.sync.pos.y);
    image(img, -40, -20, 80, 40);
    pop();
    textAlign(CENTER, CENTER);
    fill(255, 255, 255);
    textSize(24);
    text(m.sync.name + ": " + m.sync.score, m.sync.pos.x, m.sync.pos.y - 30);
}

var lastTime;

function draw() {
    background(100, 0, 200);
    let now = Date.now();
    let delta = now - lastTime;
    shared.tick(players, tiles, delta);
    translate(screenWidth / 2, screenHeight / 2);
    if (localPlayer) {
        let p = players[localPlayer];
        if (p) {
            translate(-p.sync.pos.x, -p.sync.pos.y);
        }
    }
    fill(0, 200, 255);
    for (var rect2 of rects) {
        let rect3 = rect2.map(x => x * shared.tileSize);
        //+1 to prevent texture issues (grainy lines)
        rect3[2] += 1;
        rect3[3] += 1;
        rect(...rect3);
    }
    fill(255, 200, 0);
    for (var i in seeds) {
        let coords = [seeds[i].pos.x * shared.tileSize + shared.tileSize / 2, seeds[i].pos.y * shared.tileSize + shared.tileSize / 2];
        circle(...coords, 30);
        if (players[localPlayer] && Math.abs(players[localPlayer].sync.pos.x - coords[0]) < shared.tileSize / 2 && Math.abs(players[localPlayer].sync.pos.y - coords[1]) < shared.tileSize / 2) {
            socket.emit("pop-seed", i);
            delete seeds[i];
        }
    }
    for (var player of Object.values(players)) {
        drawPlayer(player);
    }
    lastTime = now;
}

window.addEventListener("mousemove", function() {
    if (socket && mouseIsPressed) {
        socket.emit("set-move", { x: mouseX - screenWidth / 2, y: mouseY - screenHeight / 2 });
    }
});

window.addEventListener("mouseup", function() {
    if (socket) {
        socket.emit("set-move", { x: 0, y: 0 });
    }
});
