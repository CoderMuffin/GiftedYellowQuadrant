var socket;
var players = {};
var data;
var tileSize = 50;
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
    })
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
    fill(0,0,255);
    push();
    translate(m.sync.pos.x, m.sync.pos.y);
    image(img, -40, -20, 80, 40);
    pop();
    textAlign(CENTER, CENTER);
    fill(255, 255, 255);
    textSize(24);
    text(m.sync.name, m.sync.pos.x, m.sync.pos.y - 30);
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
    // rectMode(CORNER);
    // fill(0,255,0);
    // for (var tile of tiles) {
    //     rect(tile.x * tileSize, tile.y * tileSize, tileSize, tileSize);
    // }
    fill(0, 200, 255);
    for (var rect2 of rects) {
        rect(...rect2.map(x => x * tileSize));
    }
    for (var player of Object.values(players)) {
        drawPlayer(player);
    }
    lastTime = now;
}


window.addEventListener("mousemove", function(e) {
    if (mouseIsPressed) {
        socket.emit("set-move", { x: screenWidth/2 - mouseX, y: screenHeight/2 - mouseY });
    }
});
