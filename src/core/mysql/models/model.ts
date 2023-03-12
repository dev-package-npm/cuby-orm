//#region Imports
import { Database } from "../database.mysql";
import { BaseModel } from "./base-model";
//#endregion


//#region Interface

interface IConstructorModel<T> {
    table: string;
    primaryKey: keyof T | '';
    fields: TArrayColumns<T>
}

interface IQuerySelect<T> {
    select?: ISelect<T>,
    where: Partial<T>
}

interface ISelectReturn {
    array?: boolean;
}

type ISelect<T> = TArrayColumns<T> | '*' | { subQuery: TSubQuery };

type TSubQuery = string | Array<string> | {
    select: string;
    where: string
}


// extends infer K ? K extends string ? K : never : never
type TArrayColumns<T> = Array<Required<keyof T>>;
//#endregion

const database = new Database();

export class Model<T> {
    //#region Porpertties
    // private
    private _table: string = '';
    private _primaryKey: keyof T | '' = '';
    private _fields: TArrayColumns<T> = [];
    private _baseModel = new BaseModel<T>(this._table, this);
    // protected
    protected database: Database;
    //#endregion

    constructor(params: IConstructorModel<T>) {
        const { fields, primaryKey, table } = params;
        this._table = table;
        this._primaryKey = primaryKey;
        this._fields = fields;
        this.database = database;
    }

    //#region  Setter  and getter
    set table(table: string) {
        this._table = table;
    }

    set primaryKey(primaryKey: keyof T | '') {
        this._primaryKey = primaryKey;
    }

    get fields() {
        return this._fields;
    }

    get primaryKey() {
        return this._primaryKey;
    }

    get table() {
        return this._table;
    }
    //#endregion

    //#region  public methods
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

    public async findAll(value?: IQuerySelect<T>, condition?: ISelectReturn): Promise<T> {
        const sqlQuery: string = this.fillSqlQueryToSelect(value?.where, value?.select);
        const resultQuery = await this.executeQuery(sqlQuery);
        return condition?.array != undefined && condition.array == true ? resultQuery : resultQuery.length > 1 ? resultQuery : resultQuery[0];
    }

    public select(columns: (keyof Partial<T>)[]): Pick<BaseModel<T>, 'where' | 'innerJoin'>;
    public async select(value?: Partial<IQuerySelect<T>>, condition?: ISelectReturn): Promise<T | T[]>;
    public select(args: any, condition?: ISelectReturn): (Promise<T | T[]>) | Pick<BaseModel<T>, 'where' | 'innerJoin'> {
        if (Array.isArray(args)) {
            this._baseModel.selectColumns = args;
            return this._baseModel;
        } else {
            const sqlQuery: string = this.fillSqlQueryToSelect(args?.select, args?.where);
            return new Promise(async (resolve, reject) => {
                try {
                    const resultQuery = await this.executeQuery(sqlQuery);
                    resolve(condition?.array != undefined && condition.array == true ? resultQuery : resultQuery.length > 1 ? resultQuery : resultQuery[0]);
                } catch (error: any) {
                    reject(error.message);
                }
            });
        }
    }

    public async create(data: T | Array<T>): Promise<any> {
        const sqlQuery: string = this.fillSqlQueryToInsert(data);
        return await this.executeQuery(sqlQuery);
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

    //#endregion


    //#region private methods
    private fillSqlQueryToSelect(data?: any, where?: any): string {
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
        if (where != undefined)
            sqlQuery += this.fillSqlQueryToWhere(where);
        return sqlQuery;
    }

    private fillSqlQueryToInsert(data: any): string {

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

    private fillSqlQueryToUpdate(data: any, where: any): string {
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

    private fillSqlQueryToDelete(where: any): string {
        let sqlQuery: string = `DELETE FROM ${this._table}`;
        sqlQuery += this.fillSqlQueryToWhere(where);
        return sqlQuery;
    }

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
    //#endregion

}

