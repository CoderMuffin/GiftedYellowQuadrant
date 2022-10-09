let shared = {};

(function() {
    shared = {
        tick(players, delta) {
            Object.values(players).forEach(function(player) {
                //console.log(player);
                player.sync.pos.x += player.sync.dir.x * delta * 0.3;
                player.sync.pos.y += player.sync.dir.y * delta * 0.3;
            });
        },
        serialize2D(obj) {
            return obj;
        }
    };
    if (typeof window === "undefined") {
        module.exports = shared;
    }
})();

