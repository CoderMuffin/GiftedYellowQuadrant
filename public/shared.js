let shared = {
    tileSize: 50,
    roundTime: 0.1666 * 60 * 1000,
    tick(players, tiles, delta) {
        for (var key in players) {
            let player = players[key];
            //console.log(player);
            let occupied = (x, y) => tiles[shared.serialize2D(Math.floor(x / shared.tileSize), Math.floor(y / shared.tileSize))];
            let rposx = player.sync.pos.x + player.sync.dir.x * delta * 0.5;
            let rposy = player.sync.pos.y + player.sync.dir.y * delta * 0.5;
            if (occupied(rposx, player.sync.pos.y)) {
                player.sync.pos.x = rposx;
            }
            if (occupied(player.sync.pos.x, rposy)) {
                player.sync.pos.y = rposy;
            }
        }
    },
    serialize2D(x, y) {
        return x.toString() + "," + y.toString();
    },
    deserialize2D(str) {
        let s = str.split(",");
        return { x: parseInt(s[0]), y: parseInt(s[1]) };
    },
    normalize(obj) {
        let mag = Math.sqrt(obj.x ** 2 + obj.y ** 2);
        return { x: obj.x / mag, y: obj.y / mag };
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
