import ansiColors from "ansi-colors";
import { Model } from "./models/model";

interface ISchemeColums {
    TABLE_CATALOG: string,
    TABLE_SCHEMA: string,
    TABLE_NAME: string,
    COLUMN_NAME: string,
    ORDINAL_POSITION: number,
    COLUMN_DEFAULT: string,
    IS_NULLABLE: 'NO' | 'YES',
    DATA_TYPE: string,
    CHARACTER_MAXIMUM_LENGTH: null,
    CHARACTER_OCTET_LENGTH: null,
    NUMERIC_PRECISION: null,
    NUMERIC_SCALE: null,
    DATETIME_PRECISION: 0,
    CHARACTER_SET_NAME: null,
    COLLATION_NAME: null,
    COLUMN_TYPE: string,
    COLUMN_KEY: 'PRI' | 'MUL',
    EXTRA: string,
    PRIVILEGES: string,
    COLUMN_COMMENT: string,
    IS_GENERATED: string,
    GENERATION_EXPRESSION: null
}

export default class scanSchemeMysql extends Model<any> {
    private sqlQuery: string = '';
    private _database: string = '';

    constructor() {
        super({ table: '', primaryKey: '', fields: [] });
    }

    public async getDatabaseTable(database?: string): Promise<{ table: string }[]> {
        try {
            if (database != undefined)
                this._database = database;
            this.sqlQuery = `
        SELECT table_name AS \`table\`
        FROM information_schema.tables
        WHERE TABLE_SCHEMA = '${database || await this.getNameDatabase()}'
        `;
            return await this.query(this.sqlQuery);
        } catch (error: any) {
            throw new Error(ansiColors.redBright(error.message));
        }
    }

    public async getColumnScheme(scheme: (keyof ISchemeColums)[], table: string, database?: string): Promise<ISchemeColums[]> {
        this.sqlQuery = `
        SELECT
        ${scheme}
        FROM information_schema.columns 
        WHERE TABLE_NAME = '${table}'
        AND TABLE_SCHEMA = '${database || this._database}'
        `;
        return await this.query(this.sqlQuery);
    }

    public async getDatabase(): Promise<string[]> {
        try {
            this.sqlQuery = `
        SHOW DATABASES WHERE \`Database\` NOT LIKE 'mysql%' AND \`Database\` NOT LIKE 'information_schema%' AND \`Database\` NOT LIKE 'performance_schema%';`;
            const database = await this.query(this.sqlQuery);
            return Array.isArray(database) ? database.map((value) => value.Database) : [];
        } catch (error: any) {
            throw new Error(ansiColors.redBright(error.message));
        }
    }

    public async getNameDatabase(): Promise<string> {
        try {
            await this.database.initialize();
            if (this.database.type == 'mysql')
                return (await this.database.getConfigDatabase<'mysql'>()).database || '';
            else return (await this.database.getConfigDatabase<'postgresql'>()).database || ''
        } catch (error: any) {
            throw new Error(error.message);
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