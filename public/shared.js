let shared = {};

(function() {
    shared = {
        tick(players, tiles, delta) {
            Object.values(players).forEach(function(player) {
                //console.log(player);
                let occupied = (x,y) => tiles[shared.serialize2D(Math.floor(x/50), Math.floor(y/50))];
                let rposx = player.sync.pos.x + player.sync.dir.x * delta * 0.5;
                let rposy = player.sync.pos.y + player.sync.dir.y * delta * 0.5;
                if (occupied(rposx, player.sync.pos.y)) {
                    player.sync.pos.x = rposx;
                }
                if (occupied(player.sync.pos.x, rposy)) {
                    player.sync.pos.y = rposy;
                }
                else {
                    //console.log("move denied",shared.serialize2D(Math.round(rposx), Math.round(rposy)));
                }
            });
        },
        serialize2D(x, y) {
            return x.toString() + "," + y.toString();
        },
        normalize(obj) {
            let mag = Math.sqrt(obj.x ** 2 + obj.y ** 2);
            return { x: obj.x/mag, y: obj.y/mag };
        },
        TagState: {
            Innocent: "Innocent",
            Cooldown: "Cooldown",
            Tagged: "Tagged",
        }
    };
    if (typeof window === "undefined") {
        module.exports = shared;
    }
})();
