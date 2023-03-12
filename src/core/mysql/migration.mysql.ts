import { Forge } from "./forge.mysql";

export abstract class Migration<T> extends Forge<T> {
    constructor() {
        super();
    }

    abstract up(): Promise<void>;
    abstract down(): Promise<void>;
}