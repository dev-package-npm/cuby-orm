import { Forge } from "./forge";

export abstract class Migration extends Forge {
    constructor() {
        super();
    }

    abstract up(): Promise<void>;
    abstract down(): Promise<void>;
}