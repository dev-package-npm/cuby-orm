//#region Imports
import { PoolConnection } from 'promise-mysql';
import { Pool } from 'pg';
import { Database } from '../../database';
import { BaseModel, TSubQuery } from './base-model';
import { TCondition, TDirection } from '../interfaces/sql';
//#endregion

//#region Interface

interface IConstructorModel<T> {
    table: string;
    primaryKey: keyof T | '';
    fields: TArrayColumns<T>
}

interface IReturnCreate {
    fieldCount?: number,
    affectedRows?: number,
    insertId?: number,
    serverStatus?: number,
    warningCount?: number,
    message?: string,
    protocol41?: true,
    changedRows?: number
}

interface IReturnUpdate extends IReturnCreate { };
interface IReturnDelete extends IReturnCreate { };

// type TWhereUpdate<T> = T | {
//     operator: TCondition;
//     values: T;
// };

// const wheere: TWhereUpdate<{ name: string, age: number }> = { operator: 'AND', };

type TQuerySelectParams<T, K extends keyof T, L extends K, R extends K, S extends string, A extends string> = {
    where?: Partial<T>;
    alias?: { [B in R]?: S };
    orderBy?: { column: keyof T; direction: TDirection };
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
    orderBy?: { column: keyof T; direction: TDirection };
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

type TFindId = {

};
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
export abstract class Model<T> {
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
            let results;
            await this.database.initialize();
            switch (this.database.type) {
                case 'mysql':
                    const connected = await this.database.getConnection() as PoolConnection;
                    results = await connected.query(sentence, values);
                    connected.release();
                    connected.destroy();
                    return results;
                    break;
                case 'postgresql':
                    const pool = await this.database.getConnection() as Pool;
                    results = await pool.query(sentence, values);
                    return results.rows;
                    break;
            }
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    /**
     * @example
     * create({
                columns: ['first_name', 'last_name', 'user_name', 'age'],
                values: [
                    { user_name: '', age: 28, first_name: '', last_name: '' },
                    { last_name: '', user_name: '', age: 29, first_name: '' }
                ]
            });
     * @param data 
     * @returns 
     */
    public async create<C extends keyof T>(data: { columns: C[]; values: Required<Pick<T, C>> | Required<Pick<T, C>>[] }): Promise<IReturnCreate> {
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
     * @overload
     * @param { { columns: C[], id: number } } params 
     * @example 
     * findId(2);
     * findId({ columns: ['first_name', 'age'], id: 2 });
     * findId({ excludeColumns: ['id', 'create_at'], id: 2 });
     * @returns { Promise<Pick<T, C>> }
     */
    public async findId<C extends keyof T>(params: { columns: C[], id: number }): Promise<Pick<T, C>>
    public async findId<C extends keyof T>(params: { excludeColumns: C[], id: number }): Promise<Pick<T, Exclude<keyof T, C>>>
    public async findId(params: Number): Promise<T>
    public async findId(params: any): Promise<any> {
        if (typeof params == 'number')
            return (await this.select({ where: <T>{ id: params } }))[0];
        let sqlQuery = `SELECT `;
        const { columns, id, excludeColumns }: { columns: any[], id: number, excludeColumns: any[] } = params;
        if (columns != undefined && id != undefined)
            sqlQuery += `${columns} \nFROM ${this._table} \nWHERE id = "${id}"`;
        else if (excludeColumns != undefined && id != undefined)
            sqlQuery += `${this._fields.filter(column => !excludeColumns.includes(column))} \nFROM ${this._table} \nWHERE id = "${id}"`;
        else throw new Error("Parameters cannot be empty");
        return (await this.query(sqlQuery))[0];
    }
    /**
     * @overload
     * @param { { columns: C[], id: number } } params 
     * @example 
     * findAll({ columns: ['first_name', 'age']});
     * findAll({ excludeColumns: ['id', 'create_at']});
     * @returns { Promise<any[]>}
     */
    public async findAll<C extends keyof T>(params: { columns: C[] }): Promise<Pick<T, C>[]>
    public async findAll<C extends keyof T>(params: { excludeColumns: C[] }): Promise<Pick<T, Exclude<keyof T, C>>[]>
    public async findAll(params?: never): Promise<T[]>
    public async findAll(params: any): Promise<any[]> {
        let sqlQuery = `SELECT `;
        if (params == undefined) {
            sqlQuery += `${this._fields} \nFROM ${this._table}`;
            return await this.query(sqlQuery);
        }

        const { columns, excludeColumns }: { columns: any[], excludeColumns: any[] } = params;
        if (columns != undefined)
            sqlQuery += `${columns} \nFROM ${this._table}`;
        else if (excludeColumns != undefined)
            sqlQuery += `${this._fields.filter(column => !excludeColumns.includes(column))} \nFROM ${this._table}`;
        else throw new Error("Parameters cannot be empty");
        return await this.query(sqlQuery);
    }

    /**
     * @param { TQuerySelect<T, K, L, R, S, A> } params
     * @example 
     * select( { columns: ['id', 'name'], alias: { name: 'Name' },  where: { id:1 } )
     * select( { alias: { name: 'Name' }, excludeColumns:['id']  where: { id:1 } )
     * select( { orderBy:{ columns: 'create_time', direction: 'ASC' }, alias: { name:'Name' } } )
     * @returns { T[] }
     */
    public async select(): Promise<T[]>;

    public async select<K extends keyof T, L extends keyof T>(params: Required<Pick<TQuerySelect<T, K, L>, 'excludeColumns' | 'subQuery' | 'where'>> | Required<Pick<TQuerySelect<T, K, L>, 'excludeColumns' | 'subQuery' | 'where' | 'orderBy'>>): Promise<T[] | Pick<T, Exclude<K, L>>[]>;
    public async select<K extends keyof T, L extends keyof T>(params: Required<Pick<TQuerySelect<T, K, L>, 'excludeColumns' | 'where'>> | Required<Pick<TQuerySelect<T, K, L>, 'excludeColumns' | 'where' | 'orderBy'>>): Promise<T[] | Pick<T, Exclude<K, L>>[]>;
    public async select<K extends keyof T, L extends keyof T, R extends keyof T, S extends string>(params: Required<Pick<TQuerySelect<T, K, L, R, S, any>, 'excludeColumns' | 'subQuery' | 'alias' | 'where'>> | Required<Pick<TQuerySelect<T, K, L, R, S, any>, 'excludeColumns' | 'subQuery' | 'alias' | 'where' | 'orderBy'>>): Promise<(Omit<Pick<T, Exclude<K, L>>, R> & Record<S, any>)[]>;


    public async select<K extends keyof T, A extends string>(params: Required<Pick<TQuerySelect<T, K, any, any, any, A>, 'columns' | 'subQuery' | 'where'>> | Required<Pick<TQuerySelect<T, K, any, any, any, A>, 'columns' | 'subQuery' | 'where' | 'orderBy'>>): Promise<(Pick<T, K> & Record<A, any>)[]>;
    public async select<K extends keyof T, R extends keyof T, S extends string, A extends string>(params: Required<Pick<TQuerySelect<T, K, any, R, S, A>, 'columns' | 'alias' | 'subQuery' | 'where'>> | Required<Pick<TQuerySelect<T, K, any, R, S, A>, 'columns' | 'alias' | 'subQuery' | 'where' | 'orderBy'>>): Promise<(Omit<Pick<T, K>, R> & Record<S | A, any>)[]>;
    public async select<K extends keyof T, R extends keyof T, S extends string>(params: Required<Pick<TQuerySelect<T, K, any, R, S>, 'columns' | 'alias' | 'where'>> | Required<Pick<TQuerySelect<T, K, any, R, S>, 'columns' | 'alias' | 'where' | 'orderBy'>>): Promise<(Omit<Pick<T, K>, R> & Record<S, any>)[]>;
    public async select<K extends keyof T>(params: Required<Pick<TQuerySelect<T, K>, 'columns'>> | Required<Pick<TQuerySelect<T, K>, 'columns' | 'orderBy'>> | Required<Pick<TQuerySelect<T, K>, 'columns' | 'where'>> | Required<Pick<TQuerySelect<T, K>, 'columns' | 'where' | 'orderBy'>>): Promise<Pick<T, K>[]>;

    public async select<R extends keyof T, S extends string, A extends string>(params: Required<Pick<TQuerySelect<T, any, any, R, S, A>, 'alias' | 'subQuery' | 'where'>> | Required<Pick<TQuerySelect<T, any, any, R, S, A>, 'alias' | 'subQuery' | 'where' | 'orderBy'>>): Promise<(Omit<T, R> & Record<S | A, any>)[]>;

    public async select<A extends string>(params: Required<Pick<TQuerySelect<T, any, any, any, any, A>, 'subQuery' | 'where'>> | Required<Pick<TQuerySelect<T, any, any, any, any, A>, 'subQuery' | 'where' | 'orderBy'>>): Promise<(T & Record<A, any>)[]>;
    public async select<R extends keyof T, S extends string>(params: Required<Pick<TQuerySelect<T, any, any, R, S>, 'alias' | 'where'>> | Required<Pick<TQuerySelect<T, any, any, R, S>, 'alias' | 'where' | 'orderBy'>>): Promise<(Omit<T, R> & Record<S, any>)[]>;
    public async select(params: Pick<TQuerySelect<T, any, any, any, any, any>, 'where' | 'orderBy'>): Promise<T[]>;
    public async select(params: Pick<TQuerySelect<T, any, any, any, any, any>, 'where'>): Promise<T[]>;

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

    /**
     * 
     * @param param0 
     * @example
     * 
     * @returns 
     */
    public async update({ set, where }: { set: Partial<T>, where: Partial<T> }): Promise<IReturnUpdate> {
        const sqlQuery: string = this.fillSqlQueryToUpdate(set, where);
        return await this.query(sqlQuery);
    }

    public async delete(where: Partial<T>): Promise<IReturnDelete> {
        const sqlQuery: string = this.fillSqlQueryToDelete(where);
        return await this.query(sqlQuery);
    }

    public async truncate(): Promise<any> {
        const sqlQuery: string = `TRUNCATE TABLE ${this._table}`;
        return await this.query(sqlQuery);
    }

    //#region Private methods

    private fillSqlQueryToInsert<C extends keyof T>({ columns, values }: { columns: C[], values: any }): string {
        if (values == undefined || columns == undefined || (Array.isArray(values) && values.length == 0))
            throw new Error('Parameters cannot be empty or undefined');

        let sqlQuery: string = `INSERT INTO ${this._table}(${columns.map(column => `\`${<string>column}\``)}) `;
        if (Array.isArray(values)) {
            sqlQuery += `VALUES${values.map(item => `(${columns.map(column => `"${item[column]}"`)})`).join(', \n')}`;
            return sqlQuery;
        }
        else {
            sqlQuery += `VALUES(${columns.map(column => `"${values[column]}"`)})`;
            return sqlQuery;
        }
    }

    private fillSqlQueryToUpdate(data: any, where: any): string {
        if (Object.entries(data).length == 0 || Object.entries(where).length == 0) throw new Error("Parameters cannot be empty");

        let sqlQuery = `UPDATE ${this._table}\nSET ${Object.keys(data).map(key => `${key} = "${data[key]}"`)}\nWHERE ${Object.keys(where).map(key => `${key} = "${where[key]}"`).join('\nAND ')}`;
        console.log(sqlQuery);
        return sqlQuery;
    }

    private fillSqlQueryToDelete(where: any): string {
        if (Object.entries(where).length == 0) throw new Error("Parameters cannot be empty");
        let sqlQuery: string = `DELETE FROM ${this._table}\nWHERE ${Object.keys(where).map(key => `${key} = "${where[key]}"`).join('\nAND ')}`;
        return sqlQuery;
    }

    //#endregion
}