//#region Imports
import { Database } from "../databases/mysql.database";
//#endregion

//#region Interface
export interface IQuerySelect {
    select: Array<any>,
    where: any
}

interface ISelectReturn {
    array?: boolean;
}
//#endregion

const database = new Database();

export abstract class Model {
    protected table: string;
    protected primaryKey: string;
    protected fields: Array<string>;
    protected database: Database;

    private selectColumns: string[] = [];
    private whereConditions: string[] = [];
    private subQueries: string[] = [];
    private joinClauses: string[] = [];
    private orderByColumn: string | null = null;
    private orderByDirection: string | null = null;
    constructor(table: string, primaryKey: string, fields: Array<string>) {
        this.table = table;
        this.primaryKey = primaryKey;
        this.fields = fields;
        this.database = database;
    }

    public async executeQuery(sentence: string, values?: any): Promise<any> {
        try {
            const connected = await this.database.getConnection();
            const results = await connected.query(sentence, values);
            connected.release();
            connected.destroy();
            return results;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    public async create(data: object | Array<any>): Promise<any> {
        const sqlQuery: string = this.fillSqlQueryToInsert(data);
        return await this.executeQuery(sqlQuery);
    }

    public async select<T>(value?: Partial<IQuerySelect>, condition?: ISelectReturn): Promise<T> {
        const sqlQuery: string = this.fillSqlQueryToSelect(value?.select || [], value?.where);
        const resultQuery = await this.executeQuery(sqlQuery);
        return condition?.array != undefined && condition.array == true ? <T>resultQuery : resultQuery.length > 1 ? <T>resultQuery : <T>resultQuery[0];
    }

    public async update(data: object, where: object): Promise<any> {
        const sqlQuery: string = this.fillSqlQueryToUpdate(data, where);
        return await this.executeQuery(sqlQuery);
    }

    public async delete(where: object): Promise<any> {
        const sqlQuery: string = this.fillSqlQueryToDelete(where);
        return await this.executeQuery(sqlQuery);
    }

    public async truncate(): Promise<any> {
        const sqlQuery: string = `TRUNCATE TABLE ${this.table}`;
        return await this.executeQuery(sqlQuery);
    }

    select1(...columns: string[]): Model {
        this.selectColumns = columns;
        return this;
    }

    where(conditions: { [key: string]: any }, operator: 'AND' | 'OR' = 'AND'): Model {
        let whereClause = '';
        for (const key in conditions) {
            if (conditions.hasOwnProperty(key)) {
                const value = conditions[key];
                whereClause += `${key} = ${value} ${operator} `;
            }
        }
        whereClause = whereClause.substring(0, whereClause.lastIndexOf(operator));
        this.whereConditions.push(`(${whereClause})`);
        return this;
    }

    subQuery(subQuery: string): Model {
        this.subQueries.push(subQuery);
        return this;
    }

    innerJoin(joinTable: string, joinCondition: string): Model {
        this.joinClauses.push(`INNER JOIN ${joinTable} ON ${joinCondition}`);
        return this;
    }

    orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): Model {
        this.orderByColumn = column;
        this.orderByDirection = direction;
        return this;
    }

    build(): string {
        let query = `SELECT ${this.selectColumns.join(', ')} FROM ${this.table}`;
        if (this.subQueries.length > 0) {
            query += ` WHERE ${this.subQueries.join(' AND ')}`;
        }
        if (this.whereConditions.length > 0) {
            query += ` WHERE ${this.whereConditions.join(' ')}`;
        }
        if (this.joinClauses.length > 0) {
            query += ` ${this.joinClauses.join(' ')}`;
        }
        if (this.orderByColumn) {
            query += ` ORDER BY ${this.orderByColumn} ${this.orderByDirection}`;
        }
        return query;
    }
    protected fillSqlQueryToSelect(data: Array<any>, where: any): string {
        let sqlQuery: string = 'SELECT ';
        if (data !== undefined && data.length !== 0) {
            for (const key in data) {
                sqlQuery += `${this.table}.${data[key]},`
            }
            sqlQuery = sqlQuery.slice(0, sqlQuery.length - 1);
        }
        else {
            sqlQuery += ' *';
        }
        sqlQuery += ` FROM ${this.table}`;

        sqlQuery += this.fillSqlQueryToWhere(where);
        return sqlQuery;
    }

    protected fillSqlQueryToInsert(data: any): string {

        if (Array.isArray(data)) {
            if (data.length > 0) {
                if (Object.entries(data[0]).length !== 0) {
                    let sqlQuery: string = `${this.table}(`;
                    for (const key in data[0]) {
                        sqlQuery += `\`${key}\`,`;
                    }
                    sqlQuery = sqlQuery.slice(0, sqlQuery.length - 1);
                    sqlQuery += ') VALUES';
                    for (const iterator of data) {
                        if (Object.entries(iterator).length !== 0) {
                            sqlQuery += '('
                            for (const key in data[0]) {
                                sqlQuery += `'${iterator[key]}',`;
                            }
                            sqlQuery = sqlQuery.slice(0, sqlQuery.length - 1);
                            sqlQuery += '),';
                        } else
                            throw new Error('parameters cannot be empty');
                    }
                    sqlQuery = sqlQuery.slice(0, sqlQuery.length - 1);
                    return `INSERT INTO ${sqlQuery}`;
                }
                else
                    throw new Error('parameters cannot be empty');
            }
            else
                throw new Error('parameters cannot be empty');
        }
        else {
            if (Object.entries(data).length !== 0) {
                let sqlQuery: string = `${this.table}(`;
                for (const key in data) {
                    sqlQuery += `\`${key}\`,`;
                }
                sqlQuery = sqlQuery.slice(0, sqlQuery.length - 1);
                sqlQuery += ') VALUES(';
                for (const key in data) {
                    sqlQuery += `'${data[key]}',`;
                }
                sqlQuery = sqlQuery.slice(0, sqlQuery.length - 1);
                sqlQuery += ')';
                return `INSERT INTO ${sqlQuery}`;
            } else
                throw new Error('parameters cannot be empty');
        }
    }

    protected fillSqlQueryToUpdate(data: any, where: any): string {
        const value: any = data;
        const valueWhere: any = where;
        let sqlQuery: string = '';
        if (Object.entries(value).length !== 0 && Object.entries(valueWhere).length !== 0) {
            for (const key in value) {
                sqlQuery += `${this.table}.${key}='${value[key]}',`;
            }
            sqlQuery = `UPDATE ${this.table} SET ${sqlQuery.slice(0, sqlQuery.length - 1)} WHERE `;
            for (const key in valueWhere) {
                sqlQuery += `${this.table}.${key}='${valueWhere[key]}' AND `;
            }
            sqlQuery = sqlQuery.slice(0, sqlQuery.length - 5);
            return sqlQuery;
        }
        throw new Error("parameters cannot be empty");
    }


    protected fillSqlQueryToDelete(where: any): string {
        let sqlQuery: string = `DELETE FROM ${this.table}`;
        sqlQuery += this.fillSqlQueryToWhere(where);
        return sqlQuery;
    }

    //#region
    private fillSqlQueryToWhere(valueWhere: any): string {
        let sqlQuery: string = ' WHERE ';
        if (valueWhere !== undefined) {
            if (Object.entries(valueWhere).length !== 0) {
                for (const key in valueWhere) {
                    sqlQuery += `${this.table}.${key}='${valueWhere[key]}' AND `;
                }
                sqlQuery = sqlQuery.slice(0, sqlQuery.length - 5);
                return sqlQuery;
            }
        }
        return '';
    }
    //#endregion
}

