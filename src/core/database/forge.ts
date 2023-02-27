import { Database, PoolConnection } from "../../settings/database";
import { IFields } from "./interfaces/forge.interface";

export class Forge extends Database {
    protected db;
    private fields: string[] = [];
    private sqlQuery: string = '';

    private createTableStr: string = 'CREATE TABLE';
    private dropTableStr: string = 'DROP TABLE';
    private ifExistsStr: string = 'IF EXISTS';
    private primaryKeyStr: string = 'PRIMARY KEY';
    private notNullStr: string = 'NOT NULL';
    private unsignedStr: string = 'UNSIGNED';

    constructor() {
        super();
        this.db = async () => await this.getConnection();
    }

    protected addField(fields: IFields) {
        // console.log(Object.keys(fields));
        for (const item of Object.keys(fields)) {
            this.fields.push(this.orderFields(item, fields));
        }
    }

    protected async createTable(name: string) {
        this.sqlQuery = `${this.createTableStr} \`${name}\` (
            ${this.fields}
            )`;
        console.log(this.sqlQuery);

        // return await this.executeQuery(this.sqlQuery);
        // const data = await (await this.db()).query('select * from users');
    }

    protected async dropTable(name: string) {
        this.sqlQuery = `${this.dropTableStr} \`${name}\``;
        console.log(this.sqlQuery);
        // const data = await (await this.db()).query('select * from users');
        return await this.executeQuery(this.sqlQuery);
    }

    protected async enableForeignKeyChecks() {
        return await this.executeQuery('SET FOREIGN_KEY_CHECKS=1');
    }

    protected async disableForeignKeyChecks() {
        return await this.executeQuery('SET FOREIGN_KEY_CHECKS=0');
    }

    private orderFields(item: string, fields: IFields) {
        let value = `\`${item}\` ${fields[item].type}${fields[item].constraint != undefined ? `(${fields[item].constraint})` : ''}`;
        console.log(Object.getOwnPropertyNames(fields[item]));
        // switch (Object.getOwnPropertyNames(item)) {
        //     case :

        //         break;

        //     default:
        //         break;
        // }
        return value;
    }

    private async executeQuery(sentence: string, values?: any): Promise<any> {
        const results = await (await this.db()).query(sentence, values);
        await (await this.db()).release();
        (await this.db()).destroy();
        return results;
    }
}