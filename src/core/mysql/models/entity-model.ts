import moment from "moment";
import { BaseModel } from "./base-model";
import { QueryBuilder } from "../query-builder";
import { MySQLUtils } from "../mysql-utils";
import { TArrayColumns } from "../interfaces/mysql.model";

export class EntityModel<T extends any> {
    private model!: BaseModel<T>
    private queryBuilder!: QueryBuilder<T>;
    private mysqlUtils!: MySQLUtils<T>;

    constructor(private table?: string) {
        this.model = new BaseModel({ fields: [], primaryKey: '', table: this.table ?? '' });
        this.queryBuilder = new QueryBuilder(this.model);
        this.mysqlUtils = new MySQLUtils(this.model);
    }

    private async loadModelData() {
        this.model = new BaseModel({ fields: this.table != undefined && this.table != '' ? await this.mysqlUtils.getFields() : [], primaryKey: this.table != undefined && this.table != '' ? await this.mysqlUtils.getPrimaryKey() : '', table: this.table ?? '' });
    }


    /**
        * create_by se tome automáticamente
        * Si el id es auto incrementado no tomar
        * las fechas que tengan por defecto ignorarlas
        * Si la columna de la tabla permite null comparar con lo que viene para que lo pueda tomar o no. Y si no permite null tiene que venir.
        * Retornar todos los datos
        * @param 
        * @returns 
        */
    async create({ values }: { values: any }) {
        try {
            const table = values['_table_'];
            this.table = table;
            await this.loadModelData();
            const scheme = await this.mysqlUtils.getColumnScheme({ scheme: ['COLUMN_KEY', 'COLUMN_TYPE', 'COLUMN_DEFAULT', 'EXTRA', 'COLUMN_NAME'], table });
            let objectValue: any = {};
            let keys: any[] = [];
            let data: any = [];
            for (const item of scheme) {
                const { COLUMN_KEY, COLUMN_DEFAULT, EXTRA, COLUMN_NAME } = item;
                if (COLUMN_KEY != 'PRI' && EXTRA != 'autoincrement' && COLUMN_DEFAULT != 'current_timestamp()') {
                    if (COLUMN_DEFAULT != 'NULL' && COLUMN_DEFAULT != null) {
                        if ((values[COLUMN_NAME]) == undefined)
                            throw new Error("No se definió la columna " + COLUMN_NAME);
                        if ((values[COLUMN_NAME]) == null || (values[COLUMN_NAME]) == '')
                            throw new Error("La columna " + COLUMN_NAME + " no puede estar vacia");
                    }
                    if (values[COLUMN_NAME] != undefined)
                        objectValue[COLUMN_NAME] = values[COLUMN_NAME];
                } else {
                    if (COLUMN_KEY == 'PRI') {
                        keys.push(COLUMN_NAME);
                        if (EXTRA == '') {
                            if ((values[COLUMN_NAME]) == undefined)
                                throw new Error("No se definió la columna " + COLUMN_NAME);
                            if ((values[COLUMN_NAME]) == null || (values[COLUMN_NAME]) == '')
                                throw new Error("La columna " + COLUMN_NAME + " no puede estar vacia");
                        }
                    }
                    if (values[COLUMN_NAME] != undefined)
                        objectValue[COLUMN_NAME] = values[COLUMN_NAME];

                }
            }
            const results = await this.model.create({ columns: <any>(Object.keys(objectValue)), values: objectValue });
            if (keys.length == 1)
                data = await this.read({ table, where: `${[keys[0]]} = '${results.insertId}'` });
            else {
                let values: string = '';
                for (const item of keys) {
                    if (values == '') values = `${item} = '${objectValue[item]}'`;
                    else values += ` AND ${item} = '${objectValue[item]}'`;
                    data = await this.model.query(`SELECT * FROM \`${table}\` WHERE ${values}`);
                }
            }
            for (const item of scheme) {
                if (data.length != 0) {
                    if (item.COLUMN_TYPE == 'datatime' || item.COLUMN_TYPE == 'timestamp' || item.COLUMN_TYPE == 'date') {
                        moment.locale("es");
                        data[0][item.COLUMN_NAME] = moment(data[0][item.COLUMN_NAME]).format("D [de] MMMM [de] YYYY h:mm a");
                    } else if (item.COLUMN_NAME == 'create_by' || item.COLUMN_NAME == 'created_by' || item.COLUMN_NAME == 'updated_by') {
                        data[0][item.COLUMN_NAME + '_full_name'] = (await this.read({ table: 'users', columns: ['full_name'], where: `id = '${objectValue[item.COLUMN_NAME]}'` }))[0]?.full_name;
                    }
                }
            }
            return data[0];
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    async read({ table, columns, where }: { table?: string, columns?: string[], where: string }) {
        await this.loadModelData();
        // console.log(await this.mysqlUtils.getFields(), await this.mysqlUtils.getPrimaryKey());
        // let sqlQuery = `
        //     SELECT
        //         ${columns ?? '*'} 
        //     FROM ${this.table} 
        //     ${where !== undefined && where != '' ? ` WHERE ${where}` : ''}`;
        await this.model.validateColumns({ age: 2, user_name: ' ' });
        return this.model.query('');
    }

    async update({ table, values, where }: { table: string, values: string[], where: string }) {
        const entriesValue = Object.entries(values);
        let setSqlQuery = '';
        for (const item of entriesValue) {
            setSqlQuery += `${item[0]} = '${item[1]}', `;
        }
        let sqlQuery = `
            UPDATE ${table} 
            SET ${setSqlQuery.slice(0, -2)} 
            WHERE ${where}`;
        return this.model.query(sqlQuery);
    }

    async updateAndReturnData({ values }: { values: any }) {
        try {
            const table = values['_table_'];
            const scheme = await this.mysqlUtils.getColumnScheme({ scheme: ['COLUMN_KEY', 'COLUMN_TYPE', 'COLUMN_NAME'], table });
            let keys: string[] = [];
            let objectValueToUdate: any = {};
            for (const item of scheme) {
                const { COLUMN_KEY, COLUMN_NAME } = item;
                if (COLUMN_KEY == 'PRI') {
                    if ((values[COLUMN_NAME]) == undefined)
                        throw new Error("No se definió la columna " + COLUMN_NAME);
                    if ((values[COLUMN_NAME]) == null || (values[COLUMN_NAME]) == '')
                        throw new Error("La columna " + COLUMN_NAME + " no puede estar vacia");
                    keys.push(COLUMN_NAME);
                } else if (values[COLUMN_NAME] != undefined) objectValueToUdate[COLUMN_NAME] = values[COLUMN_NAME];
            }
            let _values: string = '';
            for (const item of keys) {
                if (_values == '') _values = `${item} = '${values[item]}'`;
                else _values += ` AND ${item} = '${values[item]}'`;
            }
            await this.update({ table, values: objectValueToUdate, where: _values });

            let data: any[] = [];
            if (keys.length == 1)
                data = await this.read({ table, where: `${[keys[0]]} = '${values[keys[0]]}'` });
            else {
                let _values: string = '';
                for (const item of keys) {
                    if (_values == '') _values = `${item} = "${values[item]}"`;
                    else _values += ` AND ${item} = "${values[item]}"`;
                    data = await this.model.query(`SELECT * FROM \`${table}\` WHERE ${_values}`);
                }
            }
            for (const item of scheme) {
                if (data.length != 0) {
                    if (item.COLUMN_TYPE == 'datatime' || item.COLUMN_TYPE == 'timestamp' || item.COLUMN_TYPE == 'date') {
                        moment.locale("es");
                        data[0][item.COLUMN_NAME] = moment(data[0][item.COLUMN_NAME]).format("D [de] MMMM [de] YYYY h:mm a");
                    } else if (item.COLUMN_NAME == 'create_by' || item.COLUMN_NAME == 'created_by' || item.COLUMN_NAME == 'updated_by') {
                        data[0][item.COLUMN_NAME + '_full_name'] = (await this.read({ table: 'users', columns: ['full_name'], where: `id = '${values[item.COLUMN_NAME]}'` }))[0]?.full_name;
                    }
                }
            }
            return data[0];
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    async delete({ values }: { values: any }) {
        try {
            const table = values['_table_'];
            const scheme = await this.mysqlUtils.getColumnScheme({ scheme: ['COLUMN_KEY', 'COLUMN_TYPE', 'COLUMN_NAME'], table });
            let keys = [];
            for (const item of scheme) {
                const { COLUMN_KEY, COLUMN_NAME } = item;
                if (COLUMN_KEY == 'PRI') {
                    if ((values[COLUMN_NAME]) == undefined)
                        throw new Error("No se definió la columna " + COLUMN_NAME);
                    if ((values[COLUMN_NAME]) == null || (values[COLUMN_NAME]) == '')
                        throw new Error("La columna " + COLUMN_NAME + " no puede estar vacia");
                    keys.push(COLUMN_NAME);
                }
            }
            let _values: string = '';
            for (const item of keys) {
                if (_values == '') _values = `${item} = "${values[item]}"`;
                else _values += ` AND ${item} = "${values[item]}"`;
            }
            await this.model.query(`DELETE FROM ${table} WHERE ${_values}`);
        } catch (error: any) {
            throw new Error(error.message);
        }
    }
}
