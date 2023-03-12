import { Model } from "./model";

export class BaseModel<T> {
    public selectColumns: string[] = [];
    private whereConditions: string[] = [];
    private subQueries: string[] = [];
    private joinClauses: string[] = [];
    private orderByColumn: string | null = null;
    private orderByDirection: string | null = null;

    constructor(private __table: string, private model: Model<T>) {

    }

    public where(conditions: Partial<T>, operator: 'AND' | 'OR' = 'AND'): Pick<BaseModel<T>, 'orderBy' | 'build'> {
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

    public subQuery(subQuery: string): BaseModel<T> {
        this.subQueries.push(subQuery);
        return this;
    }

    public innerJoin(joinTable: string, joinCondition: string): Pick<BaseModel<T>, 'innerJoin' | 'where'> {
        this.joinClauses.push(`INNER JOIN ${joinTable} ON ${joinCondition}`);
        return this;
    }

    public orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): BaseModel<T> {
        this.orderByColumn = column;
        this.orderByDirection = direction;
        return this;
    }

    public build(): Promise<T[]> {
        let sqlQuery = `SELECT ${this.selectColumns.join(', ')} FROM ${this.__table}`;
        if (this.subQueries.length > 0) {
            sqlQuery += ` WHERE ${this.subQueries.join(' AND ')}`;
        }
        if (this.whereConditions.length > 0) {
            sqlQuery += ` WHERE ${this.whereConditions.join(' ')}`;
        }
        if (this.joinClauses.length > 0) {
            sqlQuery += ` ${this.joinClauses.join(' ')}`;
        }
        if (this.orderByColumn) {
            sqlQuery += ` ORDER BY ${this.orderByColumn} ${this.orderByDirection}`;
        }
        return new Promise(async (resolve, reject) => {
            try {
                const resultQuery = await this.model.executeQuery(sqlQuery);
                resolve(resultQuery);
            } catch (error: any) {
                reject(error.message);
            }
        });
    }

}