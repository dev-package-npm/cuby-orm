import { Forge } from "./forge.mysql";
import { TColumns } from "./interfaces/forge.interface";

export abstract class Migration<T> extends Forge<T> {
    abstract fields: TColumns<T>;
    constructor() {
        super();
    }

    abstract up(): Promise<void>;
    abstract down(): Promise<void>;
}