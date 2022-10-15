var socket;
var players = {};
var seeds = {};
var data;
var screenWidth;
var screenHeight;
var screenScale;
var joined = false;
var localPlayer;
var tiles = {};
var roundStart = Date.now();
var speedTime = Date.now();
var invisTime = Date.now();
var rects = [];
var usePredrawn = false;

function resize() {
    screenHeight = window.innerHeight;
    screenWidth = screenHeight * 16 / 9;
    screenScale = screenHeight / 500;
}

resize();

function updatePlayer(player, update) {
    player.sync = update.sync;
}

function joinGame() {
    if (joined) return;
    let gameID = document.getElementById("input-game-id").value;
    let elJoinRow = document.getElementById("join-row");
    //let elInfo = document.getElementById("info");
    elJoinRow.style.opacity = "0";
    elJoinRow.style.maxHeight = "0px";
    // elInfo.style.opacity = "1";
    // elInfo.innerHTML = "Game ID: <code></code>";
    // elInfo.children[0].textContent = gameID;
    joined = true;
    console.log("created socket");
    socket = io({
        reconnect: false
    });
    socket.on("connect", function() {
        console.log("connected!");
        socket.on("generate", function(data) {
            tiles = data.t;
            rects = data.r;
            rects.forEach(function(x) {
                x[0] *= shared.tileSize;
                x[1] *= shared.tileSize;
                x[2] *= shared.tileSize;
                x[3] *= shared.tileSize;
                x[2] += 1;
                x[3] += 1;
            });
            if (usePredrawn) {
                tilesGraphic.fill(0, 200, 255);
                tilesGraphic.rectMode(CORNER);
                for (var tilesz of Object.keys(tiles)) {
                    let tile = shared.deserialize2D(tilesz);
                    tilesGraphic.rect(tile.x * shared.tileSize + 4000, tile.y * shared.tileSize + 4000, shared.tileSize + 1, shared.tileSize + 1);
                }
            }
        });
        socket.on("set-id", function(data) {
            localPlayer = data;
        });
        socket.on("set-time", function(data) {
            roundStart = data;
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
        socket.on("winner", function(data) {
            roundStart = data.roundStart;
            let winBox = document.getElementById("win-box");
            document.getElementById("win-name").innerText = data.name;
            document.getElementById("win-score").innerText = data.score;
            winBox.style.opacity = 1;
            setTimeout(function() {
                winBox.style.opacity = 0;
            }, shared.winTime);
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
        document.getElementById("join-box").style.opacity = 0;
    });
}

let img;
let tilesGraphic;

function preload() {
    img = loadImage("agouti.png");
}

function setup() {
    rectMode(CORNERS);
    createCanvas(screenWidth, screenHeight).parent("canvas-container");
    noStroke();
    textAlign(CENTER, CENTER);
    noSmooth();
    if (usePredrawn) {
        tilesGraphic = createGraphics(8000, 8000);
        tilesGraphic.noStroke();
    }
}

function drawPlayer(k, m) {
    push();
    translate(m.sync.pos.x, m.sync.pos.y);
    const drawOne = function() {
        image(img, -40, -20, 80, 40);
        if (m.sync.tagState == shared.TagState.Tagged) {
            fill(255, 100, 100);
        } else if (m.sync.tagState == shared.TagState.Cooldown) {
            fill(255, 200, 100);
        } else {
            fill(255, 255, 255);
        }
        text(m.sync.name + ": " + m.sync.score, 0, -30);
    }
    if (m.sync.invis) {
        if (k == localPlayer) {
            tint(255, 127);
            drawOne();
        }
    } else {
        drawOne();
    }
    pop();
}

var lastTime;

function draw() {
    background(100, 0, 200);
    textSize(24);
    let now = Date.now();
    let delta = now - lastTime;
    shared.tick(players, tiles, delta);
    push();
    translate(screenWidth / 2, screenHeight / 2);
    scale(screenScale);
    if (localPlayer) {
        let p = players[localPlayer];
        if (p) {
            translate(-p.sync.pos.x, -p.sync.pos.y);
        }
    }
    //if (usePredrawn) image(tilesGraphic, -4000, -4000);

    if (!usePredrawn) {
        fill(0, 200, 255);
        for (var rect2 of rects) {
            rect(...rect2);
        }
    }
    // rectMode(CORNER);
    // //fill(0, 255, 0);
    // for (var tilesz of Object.keys(tiles)) {
    //     let tile = shared.deserialize2D(tilesz);
    //     rect(tile.x * shared.tileSize, tile.y * shared.tileSize, shared.tileSize + 1, shared.tileSize + 1);
    // }
    // rectMode(CORNERS);

    for (var i in seeds) {
        let coords = [seeds[i].pos.x * shared.tileSize + shared.tileSize / 2, seeds[i].pos.y * shared.tileSize + shared.tileSize / 2];
        if (seeds[i].type == Seed.SeedType.Normal) {
            fill(255, 200, 0);
        } else if (seeds[i].type == Seed.SeedType.Big) {
            fill(0, 180, 0);
        } else if (seeds[i].type == Seed.SeedType.Speed) {
            fill(74, 92, 255);
        } else {
            fill(255, 97, 218);
        }
        circle(...coords, 30);
        if (players[localPlayer] && Math.abs(players[localPlayer].sync.pos.x - coords[0]) < shared.tileSize / 2 && Math.abs(players[localPlayer].sync.pos.y - coords[1]) < shared.tileSize / 2) {
            socket.emit("pop-seed", i);
            if (seeds[i].type == Seed.SeedType.Speed) {
                speedTime = Math.max(speedTime, Date.now());
                speedTime += 10 * 1000;
            } else if (seeds[i].type == Seed.SeedType.Invis && players[localPlayer].sync.tagState != shared.TagState.Tagged) {
                invisTime = Math.max(invisTime, Date.now());
                invisTime += 10 * 1000;
            }
            delete seeds[i];
        }
    }
    for (var key in players) {
        drawPlayer(key, players[key]);
        if (localPlayer && players[localPlayer].sync.tagState == shared.TagState.Tagged && players[key].sync.tagState == shared.TagState.Innocent && key != localPlayer) {
            if (Math.abs(players[localPlayer].sync.pos.x - players[key].sync.pos.x) < shared.tileSize && Math.abs(players[localPlayer].sync.pos.y - players[key].sync.pos.y) < shared.tileSize) {
                socket.emit("tag", key);
            }
        }
    }
    pop();
    lastTime = now;
    textSize(screenScale * 48);
    let time = (speedTime - Date.now()) / 1000;
    if (time > 0) {
        text(Math.floor(time), screenWidth - screenScale * 48, screenHeight - screenScale * 48);
    }
    time = (invisTime - Date.now()) / 1000;
    if (time > 0) {
        text(Math.floor(time), screenScale * 48, screenHeight - screenScale * 48);
    }
    fill(255, 255, 255);
    time = new Date(roundStart - now + shared.roundTime);
    if (joined) {
        text(time.getMinutes() + ":" + time.getSeconds().toString().padStart(2, "0"), screenWidth / 2, screenHeight / 8);
    }
}

function onMouseDown(e) {
    if (socket) {
        socket.emit("set-move", { x: mouseX - screenWidth / 2, y: mouseY - screenHeight / 2 });
    }
}
function onMouseUp(e) {
    if (socket) {
        socket.emit("set-move", { x: 0, y: 0 });
    }
}
function onMouseMove(e) {
    if (socket && mouseIsPressed) {
        socket.emit("set-move", { x: mouseX - screenWidth / 2, y: mouseY - screenHeight / 2 });
    }
}

window.addEventListener("resize", function() {
    resize();
    resizeCanvas(screenWidth, screenHeight);
});

window.addEventListener("mousedown", onMouseDown);
window.addEventListener("mouseup", onMouseUp);
window.addEventListener("mousemove", onMouseMove);
window.addEventListener("touchstart", onMouseDown);
window.addEventListener("touchend", onMouseUp);
window.addEventListener("touchmove", onMouseMove);
