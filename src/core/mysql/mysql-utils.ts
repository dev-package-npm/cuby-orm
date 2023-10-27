import { ISchemeColums } from "./interfaces/mysql.model";
import { Model } from "./models/model";

// Métodos específicos de MySQL, como obtener información sobre tablas, esquemas, etc.
export class MySQLUtils<T> {
    constructor(private model: Model<T>) { }

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

}