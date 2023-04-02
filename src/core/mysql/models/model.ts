//#region Imports
import { Database } from '../database.mysql';
import { BaseModel, TSubQuery } from './base-model';
//#endregion

//#region Interface

interface IConstructorModel<T> {
    table: string;
    primaryKey: keyof T | '';
    fields: TArrayColumns<T>
}

type TQuerySelectParams<T, K extends keyof T, L extends K, R extends K, S extends string, A extends string> = {
    where?: Partial<T>;
    alias?: { [B in R]?: S };
    orderBy?: { column: keyof T; direction: 'ASC' | 'DESC' };
    subQuery?: TSubQuery<A> | TSubQuery<A>[];
} & (
        {
            columns?: TColumn<K>;
            excludeColumns?: never;
        } | {
            columns?: never;
            excludeColumns?: L[];
        }
    );
type TQuerySelect<T, K extends keyof T = keyof T, L extends keyof T = keyof T, R extends keyof T = keyof T, S extends string = string, A extends string = string> = {
    where?: Partial<T>;
    alias?: { [B in R]?: S };
    orderBy?: { column: keyof T; direction: 'ASC' | 'DESC' };
    subQuery?: TSubQuery<A> | TSubQuery<A>[];
} & TConditionColumns<L, K>;

// type TQuerySelect<T, K, L, R extends keyof T, S, A extends string> = {
//     where?: Partial<T>;
//     alias?: { [B in R]?: S };
//     orderBy?: { column: keyof T; direction: 'ASC' | 'DESC' };
//     subQuery?: TSubQuery<A> | TSubQuery<A>[];
// } & TConditionColumns<L, K>;

// type TQuerySelect<T, K, L, R, S> = {
//     where?: Partial<T>;
//     alias?: TAlias2<R, S> | TAlias2<R, S>[];
// } & TConditionColumns<L, K>;

type TQueryFind<T, K, L> = {
    alias?: TAlias<T> | TAlias<T>[];
} & TConditionColumns<L, K>;

type TConditionColumns<L, K> = (
    {
        columns?: TColumn<K>;
        excludeColumns?: never
    } | {
        columns?: never;
        excludeColumns?: L[]
    }
);

type TColumn<K> = K[] | '*'

export type TAlias<T> = { column: keyof T extends string ? keyof T : never, name: string };
export type TAlias2<T, S> = { column: T extends string ? T : never, name: S };

// extends infer K ? K extends string ? K : never : never
type TArrayColumns<T> = Array<Required<keyof T>>;
//#endregion

const database = new Database();

export class Model<T> {
    private _table: string = '';
    private _primaryKey: keyof T | '' = '';
    private _baseModel: BaseModel<T>;

    protected _fields: TArrayColumns<T> = [];
    protected database: Database;


    constructor(params?: IConstructorModel<T>) {
        if (params != undefined) {
            const { fields, primaryKey, table } = params;
            this._table = table;
            this._primaryKey = primaryKey;
            this._fields = fields;
        }
        this.database = database;
        this._baseModel = new BaseModel<T>(this._table, this);
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

    public async query(sentence: string, values?: any): Promise<any> {
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

    public async create(data: T | Array<T>): Promise<{ insertId?: string }> {
        const sqlQuery: string = this.fillSqlQueryToInsert(data);
        return await this.query(sqlQuery);
    }

    public find<K extends keyof T, L extends keyof T>(params?: TQueryFind<T, K, L>): Pick<BaseModel<T>, 'where' | 'join' | 'subQuery' | 'build'> {
        if (params === undefined) {
            this._baseModel.selectColumns = ['*']
            return this._baseModel;
        }
        if (params.excludeColumns !== undefined) this._baseModel.excludeColumns = <string[]>params.excludeColumns;
        if (params?.alias != undefined)
            this._baseModel.alias = params.alias;
        if (params?.columns != undefined)
            if (Array.isArray(params?.columns) || typeof params?.columns === 'string')
                this._baseModel.selectColumns = typeof params?.columns === 'string' ? [params.columns] : <string[]>params?.columns;
        return this._baseModel;
    }

    /**
     * @param { TQuerySelect<T, K, L, R, S, A> } params
     * @example 
     * select( { columns: ['id', 'name'], alias: { name: 'Name' },  where: { id:1 } )
     * select( { alias: { name: 'Name' }, excludeColumns:['id']  where: { id:1 } )
     * select( { orderBy:{ columns: 'create_time', direction: 'ASC' }, alias: { name:'Name' } } )
     * @returns { T[] | T }
     */
    public async select(): Promise<T[] | T>;

    public async select<K extends keyof T, L extends keyof T>(params: Required<Pick<TQuerySelect<T, K, L>, 'excludeColumns' | 'subQuery' | 'where'>> | Required<Pick<TQuerySelect<T, K, L>, 'excludeColumns' | 'subQuery' | 'where' | 'orderBy'>>): Promise<T[] | Pick<T, Exclude<K, L>> | Pick<T, Exclude<K, L>>[]>;
    public async select<K extends keyof T, L extends keyof T>(params: Required<Pick<TQuerySelect<T, K, L>, 'excludeColumns' | 'where'>> | Required<Pick<TQuerySelect<T, K, L>, 'excludeColumns' | 'where' | 'orderBy'>>): Promise<T[] | Pick<T, Exclude<K, L>> | Pick<T, Exclude<K, L>>[]>;
    public async select<K extends keyof T, L extends keyof T, R extends keyof T, S extends string>(params: Required<Pick<TQuerySelect<T, K, L, R, S, any>, 'excludeColumns' | 'subQuery' | 'alias' | 'where'>> | Required<Pick<TQuerySelect<T, K, L, R, S, any>, 'excludeColumns' | 'subQuery' | 'alias' | 'where' | 'orderBy'>>): Promise<(Omit<Pick<T, Exclude<K, L>>, R> & Record<S, any>) | (Omit<Pick<T, Exclude<K, L>>, R> & Record<S, any>)[]>;


    public async select<K extends keyof T, A extends string>(params: Required<Pick<TQuerySelect<T, K, any, any, any, A>, 'columns' | 'subQuery' | 'where'>> | Required<Pick<TQuerySelect<T, K, any, any, any, A>, 'columns' | 'subQuery' | 'where' | 'orderBy'>>): Promise<(Pick<T, K> & Record<A, any>)[] | (Pick<T, K> & Record<A, any>)>;
    public async select<K extends keyof T, R extends keyof T, S extends string, A extends string>(params: Required<Pick<TQuerySelect<T, K, any, R, S, A>, 'columns' | 'alias' | 'subQuery' | 'where'>> | Required<Pick<TQuerySelect<T, K, any, R, S, A>, 'columns' | 'alias' | 'subQuery' | 'where' | 'orderBy'>>): Promise<(Omit<Pick<T, K>, R> & Record<S | A, any>)[] | (Omit<Pick<T, K>, R> & Record<S | A, any>)>;
    public async select<K extends keyof T, R extends keyof T, S extends string>(params: Required<Pick<TQuerySelect<T, K, any, R, S>, 'columns' | 'alias' | 'where'>> | Required<Pick<TQuerySelect<T, K, any, R, S>, 'columns' | 'alias' | 'where' | 'orderBy'>>): Promise<(Omit<Pick<T, K>, R> & Record<S, any>)[] | (Omit<Pick<T, K>, R> & Record<S, any>)>;
    public async select<K extends keyof T>(params: Required<Pick<TQuerySelect<T, K>, 'columns'>> | Required<Pick<TQuerySelect<T, K>, 'columns' | 'orderBy'>> | Required<Pick<TQuerySelect<T, K>, 'columns' | 'where'>> | Required<Pick<TQuerySelect<T, K>, 'columns' | 'where' | 'orderBy'>>): Promise<Pick<T, K>[] | Pick<T, K>>;

    public async select<R extends keyof T, S extends string, A extends string>(params: Required<Pick<TQuerySelect<T, any, any, R, S, A>, 'alias' | 'subQuery' | 'where'>> | Required<Pick<TQuerySelect<T, any, any, R, S, A>, 'alias' | 'subQuery' | 'where' | 'orderBy'>>): Promise<(Omit<T, R> & Record<S | A, any>)[] | (Omit<T, R> & Record<S | A, any>)>;

    public async select<A extends string>(params: Required<Pick<TQuerySelect<T, any, any, any, any, A>, 'subQuery' | 'where'>> | Required<Pick<TQuerySelect<T, any, any, any, any, A>, 'subQuery' | 'where' | 'orderBy'>>): Promise<(T & Record<A, any>)[] | (T & Record<A, any>)>;
    public async select<R extends keyof T, S extends string>(params: Required<Pick<TQuerySelect<T, any, any, R, S>, 'alias' | 'where'>> | Required<Pick<TQuerySelect<T, any, any, R, S>, 'alias' | 'where' | 'orderBy'>>): Promise<(Omit<T, R> & Record<S, any>)[] | (Omit<T, R> & Record<S, any>)>;
    public async select(params: Pick<TQuerySelect<T, any, any, any, any, any>, 'where' | 'orderBy'>): Promise<T | T[]>;

    public async select<K extends keyof T, L extends K, R extends K, S extends string, A extends string>(params?: TQuerySelect<T, K, L, R, S, A>): Promise<any> {
        if (params === undefined)
            this._baseModel.selectColumns = ['*']
        else if (params.excludeColumns !== undefined) this._baseModel.excludeColumns = <string[]>params.excludeColumns;
        if (params?.alias != undefined)
            this._baseModel.alias = params.alias;

        if (params?.columns != undefined)
            if (Array.isArray(params?.columns) || typeof params?.columns === 'string')
                this._baseModel.selectColumns = typeof params?.columns === 'string' ? [params.columns] : <string[]>params?.columns;

        if (params?.where != undefined)
            this._baseModel.where(params.where);

        if (params?.orderBy != undefined)
            this._baseModel.orderBy(params.orderBy)

        if (params?.subQuery != undefined)
            this._baseModel.subQuery(params.subQuery);
        return this._baseModel.build();
    }

    public async update(params: { set: Partial<T>, where: Partial<T> }): Promise<any> {
        const { set: data, where } = params;
        const sqlQuery: string = this.fillSqlQueryToUpdate(data, where);
        return await this.query(sqlQuery);
    }

    public async delete(where: Partial<T>): Promise<any> {
        const sqlQuery: string = this.fillSqlQueryToDelete(where);
        return await this.query(sqlQuery);
    }

    public async truncate(): Promise<any> {
        const sqlQuery: string = `TRUNCATE TABLE ${this._table}`;
        return await this.query(sqlQuery);
    }

    //#region Private methods

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
                            throw new Error('Parameters cannot be empty');
                    }
                    sqlQuery = sqlQuery.slice(0, sqlQuery.length - 1);
                    return `INSERT INTO ${sqlQuery}`;
                }
                else
                    throw new Error('Parameters cannot be empty');
            }
            else
                throw new Error('Parameters cannot be empty');
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
                throw new Error('Parameters cannot be empty');
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
        } else
            throw new Error("Parameters cannot be empty");
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