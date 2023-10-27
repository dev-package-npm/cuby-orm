import { TCondition } from "./interfaces/sql";
import { Model } from "./models/model";

// Métodos para construir consultas complejas
export class QueryBuilder<T> {
    constructor(private model: Model<T>) { }

    async fillSqlQueryToInsert<C extends keyof T>({ columns, values }: { columns: C[], values: any }): Promise<string> {
        if (values == undefined || columns == undefined || (Array.isArray(values) && values.length == 0))
            throw new Error('Parameters cannot be empty or undefined');

        let sqlQuery: string = `INSERT INTO \`${this.model.table}\`(${columns.map(column => `\`${<string>column}\``)}) `;
        if (Array.isArray(values)) {
            sqlQuery += `VALUES${values.map(item => `(${columns.map(column => `'${item[column]}'`)})`).join(', \n')}`;
            return sqlQuery;
        }
        else {
            sqlQuery += `VALUES(${columns.map(column => `'${values[column]}'`)})`;
            return sqlQuery;
        }
    }

    async fillSqlQueryToUpdate(data: any, where: { condition: any, operator?: TCondition }): Promise<string> {
        if (Object.entries(data).length == 0 || Object.entries(where.condition).length == 0) throw new Error("Parameters cannot be empty");

        let sqlQuery = `UPDATE \`${this.model.table}\`\nSET ${Object.keys(data).map(key => `${key} = '${data[key]}'`)}\nWHERE ${Object.keys(where.condition).map(key => `${key} = '${where.condition[key]}'`).join(`\n${where.operator || 'AND'} `)}`;
        return sqlQuery;
    }

    async fillSqlQueryToDelete(where: { condition: any, operator?: TCondition } | number): Promise<string> {
        if (typeof where != 'number' && Object.entries(where.condition).length == 0)
            throw new Error("Parameters cannot be empty");
        let sqlQuery: string = `DELETE FROM \`${this.model.table}\`\nWHERE ${typeof where == 'number' ? `${String(this.model.primaryKey)} = '${where}'` : Object.keys(where.condition).map(key => `${key} = '${where.condition[key]}'`).join(`\n${where.operator || 'AND'} `)}`;
        return sqlQuery;
    }

}
