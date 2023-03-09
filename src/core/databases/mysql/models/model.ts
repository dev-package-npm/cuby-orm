//#region Imports
import { Database } from "../database.mysql";
//#endregion

//#region Interface

interface IConstructorModel<T> {
    table: string;
    primaryKey: string;
    fields: TArrayColumns<T>
}

export interface IQuerySelect<T> {
    select?: ISelect<T>,
    where: T
}

interface ISelectReturn {
    array?: boolean;
}

type ISelect<T> = TArrayColumns<T> | '*' | { subQuery: TSubQuery };

type Column = '*' | string;
type TSubQuery = string | Array<string> | {
    select: string;
    where: string
}

type TArrayColumns<T> = Array<Required<keyof T>>;
//#endregion

const database = new Database();

export class Model<T> {
    private _table: string = '';
    private _primaryKey: string = '';
    protected fields: TArrayColumns<T> = [];
    protected database: Database;

    private selectColumns: string[] = [];
    private whereConditions: string[] = [];
    private subQueries: string[] = [];
    private joinClauses: string[] = [];
    private orderByColumn: string | null = null;
    private orderByDirection: string | null = null;

    constructor(params?: IConstructorModel<T>) {
        if (params != undefined) {
            const { fields, primaryKey, table } = params;
            this._table = table;
            this._primaryKey = primaryKey || 'id';
            this.fields = fields;
        }
        this.database = database;
    }


    set table(table: string) {
        this._table = table;
    }

    set primaryKey(primaryKey: string) {
        this._primaryKey = primaryKey;
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

    public async create(data: T | Array<T>): Promise<any> {
        const sqlQuery: string = this.fillSqlQueryToInsert(data);
        return await this.executeQuery(sqlQuery);
    }

    public async find(value: IQuerySelect<T>, condition?: ISelectReturn): Promise<T> {
        const sqlQuery: string = this.fillSqlQueryToSelect(value?.where, value?.select);
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
        const sqlQuery: string = `TRUNCATE TABLE ${this._table}`;
        return await this.executeQuery(sqlQuery);
    }

    select1(...columns: string[]): Pick<Model<T>, 'where' | 'innerJoin'> {
        this.selectColumns = columns;
        return this;
    }

    where(conditions: { [key: string]: any }, operator: 'AND' | 'OR' = 'AND'): Pick<Model<T>, 'build' | 'orderBy'> {
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

    subQuery(subQuery: string): Model<T> {
        this.subQueries.push(subQuery);
        return this;
    }

    innerJoin(joinTable: string, joinCondition: string): Pick<Model<T>, 'innerJoin' | 'where'> {
        this.joinClauses.push(`INNER JOIN ${joinTable} ON ${joinCondition}`);
        return this;
    }

    orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): Model<T> {
        this.orderByColumn = column;
        this.orderByDirection = direction;
        return this;
    }

    build(): T {
        let query = `SELECT ${this.selectColumns.join(', ')} FROM ${this._table}`;
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
        return <T>query;
    }

    protected fillSqlQueryToSelect(where: any, data?: Array<any> | string,): string {
        let sqlQuery: string = 'SELECT ';
        if (data !== undefined && data.length !== 0 && data instanceof Array) {
            for (const key in data) {
                sqlQuery += `${this._table}.${data[key]},`
            }
            sqlQuery = sqlQuery.slice(0, sqlQuery.length - 1);
        }
        else {
            sqlQuery += ' *';
        }
        sqlQuery += ` FROM ${this._table}`;

        sqlQuery += this.fillSqlQueryToWhere(where);
        return sqlQuery;
    }

    protected fillSqlQueryToInsert(data: any): string {

        if (Array.isArray(data)) {
            if (data.length > 0) {
                if (Object.entries(data[0]).length !== 0) {
                    let sqlQuery: string = `${this._table}(`;
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
                let sqlQuery: string = `${this._table}(`;
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
                sqlQuery += `${this._table}.${key}='${value[key]}',`;
            }
            sqlQuery = `UPDATE ${this._table} SET ${sqlQuery.slice(0, sqlQuery.length - 1)} WHERE `;
            for (const key in valueWhere) {
                sqlQuery += `${this._table}.${key}='${valueWhere[key]}' AND `;
            }
            sqlQuery = sqlQuery.slice(0, sqlQuery.length - 5);
            return sqlQuery;
        }
        throw new Error("parameters cannot be empty");
    }


    protected fillSqlQueryToDelete(where: any): string {
        let sqlQuery: string = `DELETE FROM ${this._table}`;
        sqlQuery += this.fillSqlQueryToWhere(where);
        return sqlQuery;
    }

    //#region
    private fillSqlQueryToWhere(valueWhere: any): string {
        let sqlQuery: string = ' WHERE ';
        if (valueWhere !== undefined) {
            if (Object.entries(valueWhere).length !== 0) {
                for (const key in valueWhere) {
                    sqlQuery += `${this._table}.${key}='${valueWhere[key]}' AND `;
                }
                sqlQuery = sqlQuery.slice(0, sqlQuery.length - 5);
                return sqlQuery;
            }
        }
        return '';
    }

    protected getProperty<T>(): Array<string> {
        const valores: string[] = [];
        for (const propiedad in {} as T) {
            valores.push(propiedad);
        }
        return valores;
    }
    //#endregion
}

