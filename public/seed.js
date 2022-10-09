let Seed;

(function() {
    class _Seed {
        constructor(pos) {
            this.pos = pos;
        }
    }
    if (typeof window === "undefined") {
        module.exports = _Seed;
    } else {
        Seed = _Seed;
    }
})();
