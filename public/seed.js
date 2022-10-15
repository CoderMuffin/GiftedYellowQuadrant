let Seed;

(function() {
    class _Seed {
        constructor(pos) {
            this.pos = pos;
            if (Math.random() > 0.95) {
                if (Math.random() < 0.3) {
                    this.type = _Seed.SeedType.Invis;
                } else if (Math.random() < 0.5) {
                    this.type = _Seed.SeedType.Big;
                } else {
                    this.type = _Seed.SeedType.Speed;
                }
            } else {
                this.type = _Seed.SeedType.Normal;
            }
        }
        static get SeedType() {
            return {
                Normal: "Normal",
                Big: "Big",
                Speed: "Speed",
                Invis: "Invis"
            }
        }
    }
    if (typeof window === "undefined") {
        module.exports = _Seed;
    } else {
        Seed = _Seed;
    }
})();
