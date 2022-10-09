//room min size and max size are * 2
const generationSettings = [
    {
        areaSize: 10,
        roomMinSize: 1,
        roomMaxSize: 2
    },
    {
        areaSize: 20,
        roomMinSize: 1,
        roomMaxSize: 2
    },
    {
        areaSize: 35,
        roomMinSize: 2,
        roomMaxSize: 4
    },
    {
        areaSize: 50,
        roomMinSize: 2,
        roomMaxSize: 4
    },
    {
        areaSize: 80,
        roomMinSize: 4,
        roomMaxSize: 6
    }
]

class Generator {
    constructor(roomCount, paths, size) {
        this.tiles = [];
        this.rects = [];
        let rooms = [];
        let gs = generationSettings[size];
        this.room(0, 0, 3, 3);
        for (let i = 0; i < roomCount; i++) {
            let x = this.between(-gs.areaSize, gs.areaSize);
            let y = this.between(-gs.areaSize, gs.areaSize);
            let xs = this.between(gs.roomMinSize, gs.roomMaxSize);
            let ys = this.between(gs.roomMinSize, gs.roomMaxSize);
            rooms.push({ x: x, y: y });
            this.room(x, y, xs, ys);
        }
        for (let i = 0; i < roomCount; i++) {
            for (let ii = 0; ii < paths; ii++) {
                this.path(rooms[i], rooms[(i + ii + 1) % roomCount]);
            }
        }
    }
    between(a, b) {
        return Math.floor(Math.random() * (b - a + 1)) + a;
    }
    room(x, y, xs, ys) {
        for (let xp = x - xs; xp < x + xs; xp++) {
            for (let yp = y - ys; yp < y + ys; yp++) {
                this.tiles.push({ x: xp, y: yp });
            }
        }
        this.rects.push([x - xs, y - ys, x + xs, y + ys]);
    }
    path(a, b) {
        let x;
        for (x = a.x; (a.x < b.x ? x <= b.x : x >= b.x); x += (a.x < b.x ? 1 : -1)) {
            this.tiles.push({ x: x, y: a.y });
        }
        this.rects.push([a.x, a.y, x, a.y + 1]);
        let y;
        for (y = a.y; (a.y < b.y ? y <= b.y : y >= b.y); y += (a.y < b.y ? 1 : -1)) {
            this.tiles.push({ x: x, y: y });
        }
        this.rects.push([x, a.y, x + 1, y]);
    }
}

module.exports = Generator;
