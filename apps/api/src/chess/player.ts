import type { Color } from "types/chess";

export class Player {
    constructor(public id: string, public name: string, public color: Color) { }
}