import { TArrayColumns } from "./interfaces/mysql.model";
import { ISchemeColums } from "./interfaces/sql";
import { BaseModel } from "./models/base-model";

// Métodos específicos de MySQL, como obtener información sobre tablas, esquemas, etc.
export class MySQLUtils<T> {
    constructor(private model: BaseModel<T>) { }

    async getColumnScheme<T extends keyof ISchemeColums>({ scheme, table, database }: { scheme?: T[], table: string, database?: string }): Promise<Pick<ISchemeColums, T>[]> {
        const sqlQuery = `
        SELECT
        ${scheme ?? '*'}
        FROM information_schema.columns 
        WHERE TABLE_NAME = ?
        AND TABLE_SCHEMA = ?
        `;
        return await this.model.query(sqlQuery, [table, database ?? await this.model.getDatabaseName()]);
    }


    public async getArrayKey() {
        const scheme = await this.getColumnScheme({ scheme: ['COLUMN_KEY', 'EXTRA', 'IS_NULLABLE', 'COLUMN_NAME', 'COLUMN_DEFAULT', 'DATA_TYPE'], table: this.model.table });
        let result: any[] = [];
        for (const schem of scheme) {
            if (schem.COLUMN_KEY == 'PRI')
                result.push(schem.COLUMN_NAME);
        }
        return result;
    }

    public async getPrimaryKey() {
        const keys = await this.getArrayKey();
        if (keys && keys.length == 1) return keys[0];
        return '';
    }

    public async getFields(): Promise<TArrayColumns<T>> {
        const results = await this.getColumnScheme({ scheme: ['COLUMN_NAME'], table: this.model.table });

        let columns: TArrayColumns<T> = [];
        for (const column of results) {
            columns.push(<any>(column.COLUMN_NAME));
        }
        return columns;
    }

}