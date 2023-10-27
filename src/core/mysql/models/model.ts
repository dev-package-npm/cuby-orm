//#region Imports
import { PoolConnection } from 'promise-mysql';
import { Pool } from 'pg';
import { Database } from '../../database';
import { BaseModel, TSubQuery } from './base-model';
import { TCondition, TDirection, TOperatorWhere } from '../interfaces/sql';
import { IModelMysql, ISchemeColums } from '../interfaces/mysql.model';
import { MySQLUtils } from '../mysql-utils';
import { QueryBuilder } from '../query-builder';
//#endregion

//#region Interface

interface IConstructorModel<T> {
    table: string;
    primaryKey: keyof T | '';
    fields: TArrayColumns<T>
}

interface IMethodReturn<T> extends IReturn {
    getInsert(): Promise<T>;
}

/**
 * En: Used to return when a record is inserted, updated or deleted
 */
interface IReturn {
    fieldCount?: number,
    affectedRows?: number,
    insertId?: number,
    serverStatus?: number,
    warningCount?: number,
    message?: string,
    protocol41?: true,
    changedRows?: number
}


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
type TAlias3<T, R extends keyof T, S extends string> = { [B in R]: S };

// extends infer K ? K extends string ? K : never : never
type TArrayColumns<T> = Array<Required<keyof T>>;
//#endregion

const database = new Database();

export abstract class Model<T> implements IModelMysql<T> {
    private _table: string = '';
    private _primaryKey: keyof T | '' = '';
    private _baseModel: BaseModel<T>;
    private _mysqlUtils: MySQLUtils<T>;
    private _queryBuilder: QueryBuilder<T>;

    private _fields: TArrayColumns<T> = [];
    private database: Promise<Database>;
    private connection?: PoolConnection | Pool;

    private executeDestroy: boolean = false;
    private executeDestroyTransaction: boolean = false;
    private results!: IMethodReturn<T>;

    transaction: { commit(): Promise<void>; rollback(): Promise<void>; } | undefined;

    constructor(params?: IConstructorModel<T>) {
        if (params != undefined) {
            const { fields, primaryKey, table } = params;
            this._table = table;
            this._primaryKey = primaryKey;
            this._fields = fields;
        }
        this._baseModel = new BaseModel<T>(this);
        this._queryBuilder = new QueryBuilder(this);
        this._mysqlUtils = new MySQLUtils(this);
        this.database = database.initialize();
    }

    //#region  Setter  and getter

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

    public async getDatabaseName() {
        try {
            return (await this.database).databaseName;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    public async beginTransaction(): Promise<{ commit(): Promise<void>; rollback(): Promise<void>; } | undefined> {
        try {
            if (this.transaction) throw new Error("A transaction instance already exists for the same model");
            else {
                // Implementación para mysql
                if ((await this.database).type == 'mysql') {
                    this.connection = await database.getConnection() as PoolConnection;
                    if (this.connection) {
                        await (this.connection as PoolConnection).beginTransaction();
                        this.executeDestroyTransaction = true;

                        this.transaction = {
                            commit: async () => {
                                await (this.connection as PoolConnection).commit();
                                this.destroyConnection(this.executeDestroyTransaction);
                            },
                            rollback: async () => {
                                await (this.connection as PoolConnection)?.rollback();
                                this.destroyConnection(this.executeDestroyTransaction);
                            }
                        };
                    }
                }
            }
            return this.transaction;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    public async query(sentence: string, values?: any): Promise<any> {
        try {
            let results;
            let database = await this.database;
            switch (database.type) {
                case 'mysql':
                    if (!this.connection) {
                        this.connection = await database.getConnection() as PoolConnection;
                        this.executeDestroy = true;
                        results = await this.connection.query(sentence, values);
                        this.destroyConnection();
                        this.connection = undefined;
                        return results;
                    }
                    return await (this.connection as PoolConnection).query(sentence, values);
                    break;
                case 'postgresql':
                    const pool = await database.getConnection() as Pool;
                    results = await pool.query(sentence, values);
                    return results.rows;
                    break;
            }
        } catch (error: any) {
            if (this.executeDestroy && !(String(error.message).includes('connect'))) {
                this.destroyConnection();
                this.connection = undefined;
            }
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
    public async create<C extends keyof T>(data: { columns: C[]; values: Required<Pick<T, C>> }): Promise<IMethodReturn<T>>
    public async create<C extends keyof T>(data: { columns: C[]; values: Required<Pick<T, C>>[] }): Promise<IReturn>
    public async create<C extends keyof T>(data: { columns: C[]; values: any }): Promise<any> {
        const sqlQuery: string = await this._queryBuilder.fillSqlQueryToInsert(data);
        this.results = await this.query(sqlQuery);
        if (!Array.isArray(data.values))
            this.results.getInsert = async (): Promise<T> => {
                const arrayKey = await this._mysqlUtils.getArrayKey();
                if (arrayKey.length == 1)
                    return <T>(await this.findId(this.results.insertId != 0 ? Number(this.results.insertId) : arrayKey[0]))[0];
                else {
                    if (arrayKey.length > 1) {
                        const where: any = Object.fromEntries(
                            Object.entries(data.values).filter(([key]) => arrayKey.includes(key))
                        );
                        return <T>(await this.find().where(where).build())[0];
                    }
                    else
                        return <T>(await this.find().where(<any>data.values).build())[0];
                }
            }
        return this.results
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
     * @example 
     * findId(2);
     * findId(alias:{ create_at: 'date' });
     * findId({ columns: ['first_name', 'age'], id: 2 });
     * findId({ columns: ['first_name', 'age'], alias:{ first_name: 'name' }, id: 2 });
     * findId({ excludeColumns: ['id', 'create_at'], id: 2 });
     * findId({ excludeColumns: ['id', 'create_at'], alias:{ create_at: 'date' }, id: 2 });
     * @param params 
     */
    public async findId<C extends keyof T, A extends C, S extends string>(params: { columns: C[], alias: TAlias3<T, A, S>, id: number }): Promise<Pick<T, Exclude<C, A>> & Partial<Record<S, T[A]>>>
    public async findId<C extends keyof T, A extends Exclude<keyof T, C>, S extends string>(params: { excludeColumns: C[], alias: TAlias3<T, A, S>, id: number }): Promise<Pick<T, Exclude<keyof T, C | A>> & Record<S, T[A]>>
    public async findId<C extends keyof T, S extends string>(params: { alias: TAlias3<T, C, S>, id: number }): Promise<Pick<T, Exclude<keyof T, C>> & Record<S, T[C]>>
    public async findId<C extends keyof T>(params: { columns: C[], id: number }): Promise<Pick<T, C>>
    public async findId<C extends keyof T>(params: { excludeColumns: C[], id: number }): Promise<Pick<T, Exclude<keyof T, C>>>
    public async findId(params: Number): Promise<T>
    public async findId(params: any): Promise<any> {
        if (typeof params == 'number')
            return (await this.query(`SELECT * FROM \`${this._table}\` WHERE \`${String(this.primaryKey)}\` = '${params}'`))[0];
        let sqlQuery = `SELECT `;
        let { columns, id, excludeColumns, alias }: { columns: any[], id: number, excludeColumns: any[], alias: any } = params;
        if (columns == undefined && excludeColumns == undefined && id != undefined)
            columns = this._fields;
        if (columns != undefined && id != undefined) {
            if (alias != undefined)
                for (const item of Object.keys(alias)) {
                    const index = columns.findIndex(column => column == item);
                    if (index != -1)
                        columns.splice(index, 1, `${item} AS "${alias[item]}"`);
                }
            sqlQuery += `${columns} \nFROM \`${this._table}\` \nWHERE \`${String(this.primaryKey)}\` = '${id}'`;
        }
        else if (excludeColumns != undefined && id != undefined)
            sqlQuery += `${this._fields.filter(column => !excludeColumns.includes(column))} \nFROM \`${this._table}\` \nWHERE \`${String(this.primaryKey)}\` = '${id}'`;
        else throw new Error("Parameters cannot be empty");
        return (await this.query(sqlQuery))[0];
    }

    /**
     * @overload
     * @example
     * findAll({ columns: ['first_name', 'age']});
     * findAll({ columns: ['first_name', 'age'], alias:{ first_name: 'name' }});
     * findAll({ excludeColumns: ['id', 'create_at'], alias:{ first_name: 'name' }});
     * findAll({ excludeColumns: ['id', 'create_at']});
     * @param params 
     */
    public async findAll<C extends keyof T, A extends C, S extends string>(params: { columns: C[], alias: TAlias3<T, A, S> }): Promise<(Pick<T, Exclude<C, A>> & Partial<Record<S, T[A]>>)[]>
    public async findAll<C extends keyof T, S extends string>(params: { alias: TAlias3<T, C, S> }): Promise<(Pick<T, Exclude<keyof T, C>> & Record<S, T[C]>)[]>
    public async findAll<C extends keyof T, A extends Exclude<keyof T, C>, S extends string>(params: { excludeColumns: C[], alias: TAlias3<T, A, S> }): Promise<(Pick<T, Exclude<keyof T, C | A>> & Record<S, T[A]>)[]>
    public async findAll<C extends keyof T>(params: { columns: C[] }): Promise<Pick<T, C>[]>
    public async findAll<C extends keyof T>(params: { excludeColumns: C[] }): Promise<Pick<T, Exclude<keyof T, C>>[]>
    public async findAll(params?: never): Promise<T[]>
    public async findAll(params: any): Promise<any[]> {
        let sqlQuery = `SELECT `;
        if (params == undefined) {
            sqlQuery += `* \nFROM \`${this._table}\``;
            return await this.query(sqlQuery);
        }

        let { columns, excludeColumns, alias }: { columns: any[], excludeColumns: any[], alias: any } = params;
        if (columns == undefined && excludeColumns == undefined && alias != undefined)
            columns = this._fields;
        if (columns != undefined) {
            if (alias != undefined)
                for (const item of Object.keys(alias)) {
                    const index = columns.findIndex(column => column == item);
                    if (index != -1)
                        columns.splice(index, 1, `${item} AS "${alias[item]}"`);
                }
            sqlQuery += `${columns} \nFROM \`${this._table}\``;
        }
        else if (excludeColumns != undefined)
            sqlQuery += `${this._fields.filter(column => !excludeColumns.includes(column))} \nFROM \`${this._table}\``;
        else throw new Error("Parameters cannot be empty");
        return await this.query(sqlQuery);
    }

    /**
     * 
     * @param param
     * @example
     * 
     * @returns 
     */
    public async update(param: { set: Partial<T>, where: { condition: Partial<T>, operator?: TCondition } }): Promise<IMethodReturn<T>> {
        const { set, where } = param;
        const sqlQuery: string = await this._queryBuilder.fillSqlQueryToUpdate(set, where);
        return await this.query(sqlQuery);
    }
    /**
     * @example
     * delete(8);
     * delete({ condition: { id: 8 } });
     * delete({ condition: { id: 8, age: 24 }, operator: 'OR' });
     * @param where 
     * @returns 
     */
    public async delete(where: number): Promise<IReturn>
    public async delete(where: { condition: Partial<T>, operator?: TCondition }): Promise<IReturn>
    public async delete(where: any): Promise<IReturn> {
        const sqlQuery: string = await this._queryBuilder.fillSqlQueryToDelete(where);
        return await this.query(sqlQuery);
    }

    protected async getColumnScheme<T extends ISchemeColums>({ scheme, table, database }: { scheme?: (keyof T)[], table: string, database?: string }): Promise<T[]> {
        const sqlQuery = `
        SELECT
        ${scheme ?? '*'}
        FROM information_schema.columns 
        WHERE TABLE_NAME = ?
        AND TABLE_SCHEMA = ?
        `;
        return await this.query(sqlQuery, [table, database ?? (await this.database).databaseName]);
    }

    //#region Private methods

    private destroyConnection(executeDestroyTransaction?: boolean) {
        if ((executeDestroyTransaction ?? this.executeDestroy) && this.connection) {
            (this.connection as PoolConnection).release();
            (this.connection as PoolConnection).destroy();
            if (executeDestroyTransaction != undefined) this.executeDestroyTransaction = false;
        }
    }

    //#endregion
}