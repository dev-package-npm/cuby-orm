import { Database, PoolConnection } from "../../settings/database";
import { IFields } from "./interfaces/forge.interface";

export class Forge extends Database {
    protected db;
    protected fields = [];

    constructor() {
        super();
        this.db = async () => await this.getConnection();
    }
    public addField(fields: IFields) {
        console.log(fields['id'].type);
        let sqlQuery = 'Select %s todo';
    }

    public async createTable(name: string) {
        const data = await (await this.db()).query('select * from user');
        console.log(data);
    }
    public async enableForeignKeyChecks() {
        return await (await this.db()).query('SET FOREIGN_KEY_CHECKS=1');
    }
    public async disableForeignKeyChecks() {
        return await (await this.db()).query('SET FOREIGN_KEY_CHECKS=0');
    }
}