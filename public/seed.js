let Seed;

(function() {
    class _Seed {
        constructor(pos) {
            this.pos = pos;
            this.id = Math.random().toString();
        }
    }
    if (typeof window === "undefined") {
        module.exports = _Seed;
    } else {
        Seed = _Seed;
    }
})();
