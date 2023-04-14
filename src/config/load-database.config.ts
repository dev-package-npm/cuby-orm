import path from 'node:path';
import fs from 'node:fs';
import { getBuildFolder } from "../helpers/file-tsconfig.helper";
import { TConfigCuby } from "./interfaces/load-database.interface";
import { Database } from '../core/database';

export class LoaderDatabase {
    private pathConfigCuby: string = '';
    private pathBuildConfigCuby: string = '';
    private buildFolder!: any;
    public configDatabase: Promise<TConfigCuby>;
    public configDB!: TConfigCuby;

    constructor() {
        this.configDatabase = this.getConfigDatabase();
    }

    public async load(): Promise<Database> {
        return new Database(await this.configDatabase);
    }

    public async getConfigDatabase(): Promise<TConfigCuby> {
        try {
            if (this.buildFolder == undefined)
                this.buildFolder = await getBuildFolder();
            if (this.buildFolder !== undefined && this.buildFolder !== false) {
                this.pathConfigCuby = path.join(path.resolve(), 'cuby.config.ts');
                if (fs.existsSync(this.pathConfigCuby)) {
                    this.pathBuildConfigCuby = path.join(path.resolve(), `${this.buildFolder}/cuby.config.js`);
                    if (fs.existsSync(this.pathBuildConfigCuby)) {
                        const config = await import(this.pathBuildConfigCuby);
                        if (config?.configDatabase != undefined) {
                            this.configDB = config.configDatabase;
                            return config.configDatabase as TConfigCuby;
                        }
                        else throw new Error('configDatabase property not found');
                    } else throw new Error('cuby.config.js not found in ' + this.pathBuildConfigCuby);
                } else throw new Error('cuby.config.ts not found in ' + this.pathConfigCuby);
            } else {
                const config = await import(path.join(path.resolve(), './cuby.config.js'));
                if (config?.configDatabase != undefined) {
                    this.configDB = config.configDatabase;
                    return config.configDatabase as TConfigCuby;
                }
                else throw new Error('configDatabase property not found');

            }
        } catch (error: any) {
            throw new Error(error.message);
        }
    }
}