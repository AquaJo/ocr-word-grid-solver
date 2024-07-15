"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Coord {
    x;
    y;
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
class Point extends Coord {
    constructor(x, y) {
        super(x, y); // Add super() call to invoke the constructor of the base class Coord with x and y parameters.
    }
    getDistance(p) {
        let dx = p.x - this.x;
        let dy = p.y - this.y;
        return Math.sqrt(dx ** 2 + dy ** 2);
    }
}
Point.prototype.distanceFromOrigin = function () {
    return this.getDistance({ x: 0, y: 0 });
};
