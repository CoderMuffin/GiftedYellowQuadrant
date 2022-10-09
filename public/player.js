let Player;
(function() {
    class _Player {
        constructor(name, socket) {
            this.sync = {
                score: 0,
                name: name,
                pos: { x: 0, y: 0 },
                dir: { x: 0, y: 0 }
            };
            this.socket = socket;
        }
    }
    if (typeof window === "undefined") {
        module.exports = _Player;
    } else {
        Player = _Player;
    }
})();
