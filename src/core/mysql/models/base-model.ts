//#region Imports
import { PoolConnection } from 'promise-mysql';
import { Pool } from 'pg';
import { Database } from '../../database';
import { TCondition, } from '../interfaces/sql';
import { IConstructorModel, IMethodReturn, IModelMysql, IReturn, TAlias3, TArrayColumns, TQueryFind } from '../interfaces/mysql.model';
import { MySQLUtils } from '../mysql-utils';
import { QueryBuilder } from '../query-builder';
//#endregion

const database = new Database();

export class BaseModel<T> implements IModelMysql<T> {
    private _table: string = '';
    private _primaryKey: keyof T | string = '';
    private _mysqlUtils: MySQLUtils<T>;
    private _queryBuilder: QueryBuilder<T>;

    private _fields: TArrayColumns<T> = [];
    private database: Promise<Database>;

    private executeDestroy: boolean = false;
    private executeDestroyTransaction: boolean = false;
    private connection?: PoolConnection | Pool;
    private results!: IMethodReturn<T>;

    static transaction?: { commit(): Promise<void>; rollback(): Promise<void>; };

    constructor(params?: IConstructorModel<T>) {
        if (params != undefined) {
            const { fields, primaryKey, table } = params;
            this._table = table;
            this._primaryKey = primaryKey;
            this._fields = fields;
        }
        this._queryBuilder = new QueryBuilder(this);
        this._mysqlUtils = new MySQLUtils(this);
        this._queryBuilder.mysqlUtils = this._mysqlUtils;
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
            if (BaseModel.transaction) throw new Error("A transaction instance already exists for the same model");
            else {
                // Implementación para mysql
                if ((await this.database).type == 'mysql') {
                    this.connection = await database.getConnection() as PoolConnection;
                    if (this.connection) {
                        await (this.connection as PoolConnection).beginTransaction();
                        this.executeDestroyTransaction = true;

                        BaseModel.transaction = {
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
            return BaseModel.transaction;
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
    create<C extends keyof T>(data: { columns: C[]; values: Required<Pick<T, C>> }): Promise<IMethodReturn<T>>;
    create<C extends keyof T>(data: { columns: C[]; values: Required<Pick<T, C>> }): Promise<IMethodReturn<T>>;
    create<C extends keyof T>(data: { columns: C[]; values: Required<Pick<T, C>>[] }): Promise<IReturn>;
    public async create<C extends keyof T>(data: { columns: C[]; values: any }): Promise<any> {
        const values = await this.validateColumns(data.values);
        data.columns = <any>Object.keys(values);
        data.values = values;
        const sqlQuery: string = await this._queryBuilder.fillSqlQueryToInsert(data);
        this.results = await this.query(sqlQuery, this._queryBuilder.values);
        await this._queryBuilder.getReturnInsertData({ results: this.results, values: data.values });
        return this.results;
    }

    public find<K extends keyof T, L extends keyof T>(params?: TQueryFind<T, K, L>): Pick<QueryBuilder<T>, 'where' | 'join' | 'subQuery' | 'build'> {
        if (params === undefined) {
            this._queryBuilder.selectColumns = ['*']
            return this._queryBuilder;
        }
        if (params.excludeColumns !== undefined) this._queryBuilder.excludeColumns = <string[]>params.excludeColumns;
        if (params?.alias != undefined)
            this._queryBuilder.alias = params.alias;
        if (params?.columns != undefined)
            if (Array.isArray(params?.columns) || typeof params?.columns === 'string')
                this._queryBuilder.selectColumns = typeof params?.columns === 'string' ? [params.columns] : <string[]>params?.columns;
        return this._queryBuilder;
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
    findId<C extends keyof T, A extends C, S extends string>(params: { columns: C[], alias: TAlias3<T, A, S>, id: number }): Promise<Pick<T, Exclude<C, A>> & Partial<Record<S, T[A]>>>;
    findId<C extends keyof T, A extends Exclude<keyof T, C>, S extends string>(params: { excludeColumns: C[], alias: TAlias3<T, A, S>, id: number }): Promise<Pick<T, Exclude<keyof T, C | A>> & Record<S, T[A]>>;
    findId<C extends keyof T, S extends string>(params: { alias: TAlias3<T, C, S>, id: number }): Promise<Pick<T, Exclude<keyof T, C>> & Record<S, T[C]>>;
    findId<C extends keyof T>(params: { columns: C[], id: number }): Promise<Pick<T, C>>;
    findId<C extends keyof T>(params: { excludeColumns: C[], id: number }): Promise<Pick<T, Exclude<keyof T, C>>>;
    findId(params: Number): Promise<T>;
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
    findAll<C extends keyof T, A extends C, S extends string>(params: { columns: C[], alias: TAlias3<T, A, S> }): Promise<(Pick<T, Exclude<C, A>> & Partial<Record<S, T[A]>>)[]>;
    findAll<C extends keyof T, S extends string>(params: { alias: TAlias3<T, C, S> }): Promise<(Pick<T, Exclude<keyof T, C>> & Record<S, T[C]>)[]>;
    findAll<C extends keyof T, A extends Exclude<keyof T, C>, S extends string>(params: { excludeColumns: C[], alias: TAlias3<T, A, S> }): Promise<(Pick<T, Exclude<keyof T, C | A>> & Record<S, T[A]>)[]>;
    findAll<C extends keyof T>(params: { columns: C[] }): Promise<Pick<T, C>[]>;
    findAll<C extends keyof T>(params: { excludeColumns: C[] }): Promise<Pick<T, Exclude<keyof T, C>>[]>;
    findAll(params?: never): Promise<T[]>;
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
        const sqlQuery: string = await this._queryBuilder.fillSqlQueryToUpdate(param.set, param.where);
        this.results = await this.query(sqlQuery, this._queryBuilder.values);
        await this._queryBuilder.getReturnInsertData({ results: this.results, values: param.where.condition });
        return this.results;
    }
    /**
     * @example
     * delete(8);
     * delete({ condition: { id: 8 } });
     * delete({ condition: { id: 8, age: 24 }, operator: 'OR' });
     * @param where 
     * @returns 
     */
    delete(where: number): Promise<IReturn>;
    delete(where: { condition: Partial<T>; operator?: TCondition | undefined; }): Promise<IReturn>;
    public async delete(where: any): Promise<IReturn> {
        const sqlQuery: string = await this._queryBuilder.fillSqlQueryToDelete(where);
        return await this.query(sqlQuery, this._queryBuilder.values);
    }

    //#region Private methods

    private destroyConnection(executeDestroyTransaction?: boolean) {
        if ((executeDestroyTransaction ?? this.executeDestroy) && this.connection) {
            (this.connection as PoolConnection).release();
            (this.connection as PoolConnection).destroy();
            if (executeDestroyTransaction != undefined) this.executeDestroyTransaction = false;
        }
    }

    public async validateColumns(values: any) {
        let objectValue: any = {};
        const columnsScheme = await this._mysqlUtils.getColumnScheme({ scheme: ['COLUMN_KEY', 'COLUMN_TYPE', 'COLUMN_DEFAULT', 'EXTRA', 'COLUMN_NAME'], table: this.table });
        console.log(columnsScheme);
        for (const scheme of columnsScheme) {
            const { COLUMN_KEY, COLUMN_DEFAULT, EXTRA, COLUMN_NAME } = scheme;
            if (COLUMN_KEY != 'PRI' && EXTRA != 'autoincrement' && COLUMN_DEFAULT != 'current_timestamp()') {
                if (COLUMN_DEFAULT != 'NULL' && COLUMN_DEFAULT != 'null') {
                    if ((values[COLUMN_NAME]) == undefined)
                        throw new Error(`The column ${COLUMN_NAME} was not defined`);
                    if ((values[COLUMN_NAME]) == null || (values[COLUMN_NAME]) == '')
                        throw new Error(`The ${COLUMN_NAME} column cannot be empty`);
                }
                if (values[COLUMN_NAME] != undefined)
                    objectValue[COLUMN_NAME] = values[COLUMN_NAME];
            } else {
                if (COLUMN_KEY == 'PRI') {
                    if (EXTRA == '') {
                        console.log(values[COLUMN_NAME]);
                        if ((values[COLUMN_NAME]) == undefined)
                            throw new Error(`The column ${COLUMN_NAME} was not defined`);
                        if ((values[COLUMN_NAME]) == null || (values[COLUMN_NAME]) == '')
                            throw new Error(`The ${COLUMN_NAME} column cannot be empty`);

                    }
                }
                if (values[COLUMN_NAME] != undefined)
                    objectValue[COLUMN_NAME] = values[COLUMN_NAME];

            }
        }
        console.log(objectValue);
        return objectValue;
    }
    //#endregion
}