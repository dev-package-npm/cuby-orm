import ansiColors from "ansi-colors";
import { Model } from "./models/model";
import { TCollationCharset } from "./interfaces/forge.interface";
import { ISchemeColums } from "./interfaces/sql";

export default class SchemeMysql extends Model<any> {
    private sqlQuery: string = '';
    private _database: string = '';

    constructor() {
        super({ table: '', primaryKey: '', fields: [] });
    }

    public async createDatabase({ name, collation }: { name: string, collation: TCollationCharset }) {
        try {
            return await this.query(`CREATE DATABASE \`${name}\` ${collation != undefined ? `CHARACTER SET ${collation.charset} COLLATE ${collation.collation}` : ''}`);
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    public async getDatabaseTable(database?: string): Promise<{ table: string }[]> {
        try {
            if (database != undefined)
                this._database = database;
            this.sqlQuery = `
        SELECT table_name AS \`table\`
        FROM information_schema.tables
        WHERE TABLE_SCHEMA = '${database || await this.getDatabaseName()}'
        `;
            return await this.query(this.sqlQuery);
        } catch (error: any) {
            throw new Error(ansiColors.redBright(error.message));
        }
    }

    async getColumnScheme<T extends ISchemeColums>({ scheme, table, database }: { scheme?: (keyof T)[], table: string, database?: string }): Promise<T[]> {
        const sqlQuery = `
        SELECT
        ${scheme ?? '*'}
        FROM information_schema.columns 
        WHERE TABLE_NAME = ?
        AND TABLE_SCHEMA = ?
        `;
        return await this.query(sqlQuery, [table, database ?? await this._database]);
    }

    public async getDatabaseNames(): Promise<string[]> {
        try {
            this.sqlQuery = `
        SHOW DATABASES WHERE \`Database\` NOT LIKE 'mysql%' AND \`Database\` NOT LIKE 'information_schema%' AND \`Database\` NOT LIKE 'performance_schema%';`;
            const database = await this.query(this.sqlQuery);
            return Array.isArray(database) ? database.map((value) => value.Database) : [];
        } catch (error: any) {
            throw new Error(ansiColors.redBright(error.message));
        }
    }

    public getType(value: string) {
        const numberValues = [
            'INT',
            'TINYINT',
            'SMALLINT',
            'MEDIUMINT',
            'BIGINT',
            'DECIMAL',
            'FLOAT',
            'DOUBLE',
            'DOUBLE'
        ];
        value = value.toUpperCase();
        return numberValues.indexOf(value);
    }
}