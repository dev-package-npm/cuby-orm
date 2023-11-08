import { IMethodReturn } from "./interfaces/mysql.model";
import { TCondition } from "./interfaces/sql";
import { BaseModel } from "./models/base-model";
import { MySQLUtils } from "./mysql-utils";

export type TSubQuery<A extends string> = string | {
    select: string;
    table: string;
    where: string;
    as: A;
}

// Métodos para construir consultas complejas
export class QueryBuilder<T> {
    mysqlUtils!: MySQLUtils<T>;
    values: any[] = [];
    public selectColumns: string[] = [];
    public excludeColumns: string[] = [];
    public alias: any = {};
    public whereConditions: string[] = [];
    public orderByDirection: string | null = null;
    public orderByColumn: string | null = null;
    public subQueries: string[] = [];

    private joinClauses: string[] = [];
    private _mysqlUtils: MySQLUtils<T>;

    constructor(private baseModel: BaseModel<T>) {
        this._mysqlUtils = new MySQLUtils(this.baseModel);
    }


    public where(conditions: Partial<T>, operator: 'AND' | 'OR' = 'AND'): Pick<QueryBuilder<T>, 'orderBy' | 'build'> {
        if (conditions == undefined) throw new Error("Parameters cannot be empty in the where method");
        let whereClause = '';
        for (const key in conditions) {
            if (conditions.hasOwnProperty(key)) {
                const value = conditions[key];
                whereClause += `${key} = ? ${operator} `;
                this.values.push(value);
            }
        }
        whereClause = whereClause.substring(0, whereClause.lastIndexOf(operator));
        this.whereConditions.push(`${whereClause}`);
        return this;
    }

    public subQuery<A extends string>(subQuery: TSubQuery<A> | TSubQuery<A>[]): Pick<QueryBuilder<T>, 'where' | 'join' | 'build' | 'orderBy'> {
        if (Array.isArray(subQuery)) {
            for (const item of subQuery) {
                if (typeof item === 'string')
                    this.subQueries.push(item);
                else
                    this.subQueries.push(`(SELECT ${item.select} FROM ${item.table} WHERE ${item.where} LIMIT 1) AS ${item.as}`);
            }
        } else if (!Array.isArray(subQuery)) {
            if (typeof subQuery === 'string')
                this.subQueries.push(subQuery);
            else
                this.subQueries.push(`(SELECT ${subQuery.select} FROM ${subQuery.table} WHERE ${subQuery.where} LIMIT 1) AS ${subQuery.as}`);
        }
        return this;
    }

    public join(params: { joinTable: string, joinCondition: string, type: 'INNER' | 'LEFT' | 'RIGHT' }): Pick<QueryBuilder<T>, 'where'> {
        const { type, joinTable, joinCondition } = params;
        this.joinClauses.push(`${type} JOIN ${joinTable} ON ${joinCondition}`);
        return this;
    }

    public orderBy(params: { column: keyof T | string, direction?: 'ASC' | 'DESC' }): QueryBuilder<T> {
        this.orderByColumn = <string>params.column;
        this.orderByDirection = params?.direction || 'ASC';
        return this;
    }

    public async build(): Promise<T[]> {
        try {
            if (Object.keys(this.alias).length != 0) {
                if (this.selectColumns.length == 0 || this.selectColumns[0] == '*') {
                    this.selectColumns = [];
                    for (const item of this.baseModel.fields) {
                        const index = this.excludeColumns.findIndex(column => column == item);
                        if (index == -1)
                            this.selectColumns.push(<string>item);
                    }
                }
                // alias
                if (Array.isArray(this.alias))
                    for (const item of this.alias) {
                        const index = this.selectColumns.findIndex(column => column === item.column);
                        if (index != -1) {
                            this.selectColumns.splice(index, 1, `${item.column} AS ${item.name}`);
                        }
                    }
                else {
                    const index = this.selectColumns.findIndex(column => column === this.alias.column);
                    if (index != -1) {
                        this.selectColumns.splice(index, 1, `${this.alias.column} AS ${this.alias.name}`);
                    }
                }
            }

            if (this.excludeColumns.length != 0) {
                this.selectColumns = <string[]>this.baseModel.fields.filter(field => !this.excludeColumns.includes(<string>field))
            }

            if (this.subQueries.length !== 0)
                for (const item of this.subQueries) {
                    this.selectColumns.push(item);
                }
            let sqlQuery = `SELECT ${this.selectColumns || '*'} FROM ${this.baseModel.table}`;

            if (this.joinClauses.length > 0) {
                sqlQuery += ` ${this.joinClauses.join(' ')}`;
            }

            if (this.whereConditions.length > 0) {
                sqlQuery += ` WHERE ${this.whereConditions.join(' ')}`;
            }

            if (this.orderByColumn) {
                sqlQuery += ` ORDER BY ${this.orderByColumn} ${this.orderByDirection}`;
            }
            const resultQuery = await this.baseModel.query(sqlQuery, this.values);
            this.clearVariable();
            return Promise.resolve(resultQuery);
        } catch (error: any) {
            return Promise.reject(error.message);
        }
    }

    private clearVariable() {
        this.alias = {};
        this.selectColumns = [];
        this.excludeColumns = [];
        this.whereConditions = [];
        this.orderByColumn = null;
        this.orderByDirection = null;
        this.subQueries = [];
        this.joinClauses = [];
    }

    async fillSqlQueryToInsert<C extends keyof T>({ columns, values }: { columns: C[], values: any }): Promise<string> {
        if (values == undefined || columns == undefined || (Array.isArray(values) && values.length == 0))
            throw new Error('Parameters cannot be empty or undefined');

        let sqlQuery: string = `INSERT INTO \`${this.baseModel.table}\`(${columns.map(column => `\`${<string>column}\``)}) `;
        if (Array.isArray(values)) {
            sqlQuery += `VALUES${values.map(item => `(${columns.map(column => {
                this.values.push(item[column]);
                return `?`;
            })})`).join(', \n')}`;
            return sqlQuery;
        }
        else {
            sqlQuery += `VALUES(${columns.map(column => {
                this.values.push(values[column]);
                return `?`;
            })})`;
            return sqlQuery;
        }
    }

    async fillSqlQueryToUpdate(data: any, where: { condition: any, operator?: TCondition }): Promise<string> {
        if (Object.entries(data).length == 0 || Object.entries(where.condition).length == 0) throw new Error("Parameters cannot be empty");

        let sqlQuery = `UPDATE \`${this.baseModel.table}\`\nSET ${Object.keys(data).map(key => {
            this.values.push(data[key]);
            return `${key} = ?`;
        })}\nWHERE ${Object.keys(where.condition).map(key => {
            this.values.push(where.condition[key]);
            return `${key} = ?`;
        }).join(`\n${where.operator || 'AND'} `)}`;
        return sqlQuery;
    }

    async fillSqlQueryToDelete(where: { condition: any, operator?: TCondition } | number): Promise<string> {
        if (typeof where != 'number' && Object.entries(where.condition).length == 0)
            throw new Error("Parameters cannot be empty");
        if (typeof where == 'number') this.values.push(where);
        let sqlQuery: string = `DELETE FROM \`${this.baseModel.table}\`\nWHERE ${typeof where == 'number' ? `${String(this.baseModel.primaryKey)} = ?` : Object.keys(where.condition).map(key => {
            this.values.push(where.condition[key]);
            return `${key} = ?`;
        }).join(`\n${where.operator || 'AND'} `)}`;
        return sqlQuery;
    }

    async getReturnInsertData({ values, results }: { values: any, results: IMethodReturn<T> }) {
        if (!Array.isArray(values))
            results.getValues = async (): Promise<T> => {
                const arrayKey = await this.mysqlUtils.getArrayKey();
                if (arrayKey.length == 1) {
                    console.log(results.insertId != 0);
                    return <T>(await this.baseModel.findId(results.insertId != 0 ? Number(results.insertId) : values[arrayKey[0]]));
                }
                else {
                    if (arrayKey.length > 1) {
                        const where: any = Object.fromEntries(
                            Object.entries(values).filter(([key]) => arrayKey.includes(key))
                        );
                        return <T>(await this.baseModel.find().where(where).build())[0];
                    }
                    else
                        return <T>(await this.baseModel.find().where(<any>values).build())[0];
                }
            }
    }
}
