import { Model } from "./model";

export type TSubQuery<A extends string> = string | {
    select: string;
    table: string;
    where: string;
    as: A;
}

export class BaseModel<T> {
    public selectColumns: string[] = [];
    public excludeColumns: string[] = [];
    public alias: any = {};
    public whereConditions: string[] = [];
    public orderByDirection: string | null = null;
    public orderByColumn: string | null = null;
    public subQueries: string[] = [];

    private joinClauses: string[] = [];

    constructor(private __table: string, private model: Model<T>) {
    }

    public where(conditions: Partial<T>, operator: 'AND' | 'OR' = 'AND'): Pick<BaseModel<T>, 'orderBy' | 'build'> {
        let whereClause = '';
        for (const key in conditions) {
            if (conditions.hasOwnProperty(key)) {
                const value = conditions[key];
                whereClause += `${key} = '${value}' ${operator} `;
            }
        }
        whereClause = whereClause.substring(0, whereClause.lastIndexOf(operator));
        this.whereConditions.push(`${whereClause}`);
        return this;
    }

    public subQuery<A extends string>(subQuery: TSubQuery<A> | TSubQuery<A>[]): Pick<BaseModel<T>, 'where' | 'join' | 'build' | 'orderBy'> {
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

    public join(params: { joinTable: string, joinCondition: string, type: 'INNER' | 'LEFT' | 'RIGHT' }): Pick<BaseModel<T>, 'where'> {
        const { type, joinTable, joinCondition } = params;
        this.joinClauses.push(`${type} JOIN ${joinTable} ON ${joinCondition}`);
        return this;
    }

    public orderBy(params: { column: keyof T | string, direction?: 'ASC' | 'DESC' }): BaseModel<T> {
        this.orderByColumn = <string>params.column;
        this.orderByDirection = params?.direction || 'ASC';
        return this;
    }

    public async build(): Promise<T[] | T> {
        if (Object.keys(this.alias).length != 0) {
            console.log(this.selectColumns);
            if (this.selectColumns.length == 0 || this.selectColumns[0] == '*') {
                this.selectColumns = [];
                for (const item of this.model.fields) {
                    const index = this.excludeColumns.findIndex(column => column == item);
                    if (index == -1)
                        this.selectColumns.push(<string>item);
                }
            }
            for (const item of Object.keys(this.alias)) {
                const index = this.selectColumns.findIndex(column => column === item);
                if (index != -1) {
                    this.selectColumns.splice(index, 1, `${item} AS ${this.alias[item]}`);
                }
            }
        }

        if (this.subQueries.length !== 0)
            for (const item of this.subQueries) {
                this.selectColumns.push(item);
            }
        let sqlQuery = `SELECT ${this.selectColumns.join(', ')} FROM ${this.__table}`;

        if (this.joinClauses.length > 0) {
            sqlQuery += ` ${this.joinClauses.join(' ')}`;
        }
        if (this.whereConditions.length > 0) {
            sqlQuery += ` WHERE ${this.whereConditions.join(' ')}`;
        }
        if (this.orderByColumn) {
            sqlQuery += ` ORDER BY ${this.orderByColumn} ${this.orderByDirection}`;
        }
        const resultQuery = await this.model.query(sqlQuery);
        this.clearVariable();
        return Promise.resolve(resultQuery);
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

}