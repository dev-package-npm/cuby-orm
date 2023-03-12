import { Database } from "./database.mysql";
import { TColumns, TForeignKey, TColumnsAttributes, TTableAttribute, TTforeignKeyStructure, TGetTableColumnAttribute, TGetTableAttribute } from "./interfaces/forge.interface";
import { TCompuestSentence } from "./interfaces/sql";

export class Forge<T> extends Database {
    protected db;
    private fields: string[] = [];
    private tableFields: string[] = [];
    private sqlQuery: string = '';

    private readonly tableColumnsAttributes: TGetTableColumnAttribute<T>[] = [
        {
            attribute: 'isPrimariKey',
            value: 'PRIMARY KEY'
        },
        {
            attribute: 'isUnique',
            value: 'UNIQUE'
        },
        {
            attribute: 'isAutoincrement',
            value: 'AUTO_INCREMENT'
        },
        {
            attribute: 'constraint',
            value: 'TABLE'
        },
        {
            attribute: 'foreignKey',
            value: <TTforeignKeyStructure>{
                foreignKey: 'FOREIGN KEY',
                reference: 'REFERENCES',
                onDelete: 'ON DELETE',
                onUpdate: 'ON UPDATE'
            }
        },
        {
            attribute: 'charset',
            value: 'CHARACTER SET'
        },
        {
            attribute: 'collation',
            value: 'COLLATE'
        },
        {
            attribute: 'isNotNull',
            value: 'NOT NULL'
        },
        {
            attribute: 'default',
            value: 'DEFAULT'
        },
        {
            attribute: 'comment',
            value: 'COMMENT'
        },
    ];

    private readonly tableAttributes: TGetTableAttribute[] = [
        {
            attribute: 'auto_icrement',
            value: 'AUTO_INCREMENT'
        },
        {
            attribute: 'default_charset',
            value: 'DEFAULT CHARSET'
        },
        {
            attribute: 'collation',
            value: 'COLLATE'
        },
        {
            attribute: 'engine',
            value: 'ENGINE'
        },
        {
            attribute: 'comment',
            value: 'COMMENT'
        }
    ];

    private sqlStr: string = '';
    private readonly createTableStr: TCompuestSentence = 'CREATE TABLE';
    private readonly dropTableStr: TCompuestSentence = 'DROP TABLE';
    private readonly alterTableStr: TCompuestSentence = 'ALTER TABLE';
    private readonly ifExistsStr: TCompuestSentence = 'IF EXISTS';
    private readonly ifNotExistsStr: TCompuestSentence = 'IF NOT EXISTS';
    private readonly addConstraintStr: TCompuestSentence = 'ADD CONSTRAINT';

    constructor() {
        super();
        this.db = async () => await this.getConnection();
    }

    protected addField(fields: TColumns<T>) {
        // console.log(Object.keys(fields));
        for (const item of Object.keys(fields)) {
            this.fields.push(this.orderFields(<any>item, fields));
        }
        if (this.sqlStr != '') {
            this.fields.push(this.sqlStr);
            this.sqlStr = '';
        }
    }

    protected async createTable(name: string, tableAttributes?: TTableAttribute) {
        if (tableAttributes != undefined) {
            for (const item of Object.keys(tableAttributes)) {
                this.tableFields.push(this.addAttributeToTable(item, tableAttributes));
            }
        }
        this.sqlQuery = `${this.createTableStr} \`${name}\` (
            ${this.fields.join(',\n')}
            )${this.tableFields.length > 0 ? this.tableFields.join('\n') : ''};`;
        this.tableFields = [];
        // Add alter table if exists instruction
        if (this.sqlStr != '') {
            this.sqlQuery += '\n' + this.sqlStr;
            this.sqlStr = '';
        }
        // console.log(this.sqlQuery);
        return await this.executeQuery(this.sqlQuery);
    }

    protected async createTableIfNotExists(name: string, tableAttributes?: TTableAttribute) {
        if (tableAttributes != undefined) {
            for (const item of Object.keys(tableAttributes)) {
                this.tableFields.push(this.addAttributeToTable(item, tableAttributes));
            }
        }
        this.sqlQuery = `${this.createTableStr} ${this.ifNotExistsStr} \`${name}\` (
            ${this.fields.join(',\n')}
            )${this.tableFields.length > 0 ? this.tableFields.join('\n') : ''};`;
        this.tableFields = [];
        if (this.sqlStr != '') {
            this.sqlQuery += '\n' + this.sqlStr;
            this.sqlStr = '';
        }
        // console.log(this.sqlQuery);
        return await this.executeQuery(this.sqlQuery);
    }

    protected async addForeignKey(table: string, data: TForeignKey<T>) {
        const tableAttributes = (<TTforeignKeyStructure>this.tableColumnsAttributes.find(item => item.attribute == 'foreignKey')?.value)
        if (this.sqlStr != '')
            this.sqlStr += `${this.alterTableStr} \`${table}\` ${this.addConstraintStr} \`FK_${table.charAt(0) + table.charAt(table.length - 1)}_${data.references.table.charAt(0) + data.references.table.charAt(data.references.table.length - 1)}\` ${tableAttributes.foreignKey} (\`${data.column}\`) ${tableAttributes.reference} \`${data.references.table}\` (\`${data.references.column}\`)`;
        else
            this.sqlStr = `${this.alterTableStr} \`${table}\` ${this.addConstraintStr} \`FK_${table.charAt(0) + table.charAt(table.length - 1)}_${data.references.table.charAt(0) + data.references.table.charAt(data.references.table.length - 1)}\` ${tableAttributes.foreignKey} (\`${data.column}\`) ${tableAttributes.reference} \`${data.references.table}\` (\`${data.references.column}\`)`;
        if (data.onDelete != undefined) {
            this.sqlStr += ` ${tableAttributes.onDelete} ${data.onDelete}`;
        }
        if (data.onUpdate != undefined) {
            this.sqlStr += ` ${tableAttributes.onUpdate} ${data.onUpdate}`;
        }
        this.sqlStr += ';\n';
    }

    protected async dropTable(name: string) {
        this.sqlQuery = `${this.dropTableStr} \`${name}\``;
        return await this.executeQuery(this.sqlQuery);
    }

    protected async dropTableIfExists(name: string) {
        this.sqlQuery = `${this.dropTableStr} ${this.ifExistsStr} \`${name}\``;
        // console.log(this.sqlQuery);
        return await this.executeQuery(this.sqlQuery);
    }

    protected async enableForeignKeyChecks() {
        return await this.executeQuery('SET FOREIGN_KEY_CHECKS=1');
    }

    protected async disableForeignKeyChecks() {
        return await this.executeQuery('SET FOREIGN_KEY_CHECKS=0');
    }

    public orderFields(item: keyof TColumns<T> extends infer K ? K extends string ? K : never : never, fields: TColumns<T>) {
        let value = `\`${item}\` ${fields[item].type}${this.validateAttributeColumns('constraint', fields[item]) ? `(${fields[item].constraint})` : ''}`;
        for (const item2 of this.tableColumnsAttributes) {
            if (this.validateAttributeColumns(item2.attribute, fields[item]) && item2.attribute != 'constraint') {
                switch (item2.attribute) {
                    case 'charset':
                        value += ` ${item2.value} ${fields[item].charset}`;
                        break;
                    case 'collation':
                        value += ` ${item2.value} ${fields[item].collation}`;
                        break;
                    case 'foreignKey':
                        this.sqlStr += `${(<TTforeignKeyStructure>item2.value).foreignKey} (\`${item}\`) ${(<TTforeignKeyStructure>item2.value).reference} \`${fields[item].foreignKey?.references.table}\`(\`${fields[item].foreignKey?.references.column}\`)`;
                        if (fields[item].foreignKey?.onDelete != undefined) {
                            this.sqlStr += ` ${(<TTforeignKeyStructure>item2.value).onDelete} ${fields[item].foreignKey?.onDelete}`;
                        }
                        if (fields[item].foreignKey?.onUpdate != undefined) {
                            this.sqlStr += ` ${(<TTforeignKeyStructure>item2.value).onUpdate} ${fields[item].foreignKey?.onUpdate} `;
                        }
                        break;
                    case 'default':
                        value += ` ${item2.value} ${fields[item].default}`;
                        break;
                    case 'comment':
                        value += ` ${item2.value} "${fields[item].comment}"`
                        break;
                    default:
                        value += ' ' + item2.value;
                        break;
                }
            }
        }
        return value;
    }

    private addAttributeToTable(item: string, tableAttribute: TTableAttribute) {
        let value = ``;
        for (const item2 of this.tableAttributes) {
            if (Object(tableAttribute)[item] != undefined && item2.attribute == item) {
                switch (item2.attribute) {
                    case 'engine':
                        value += ` ${item2.value}=${tableAttribute.engine}`;
                        break;
                    case 'collation':
                        value += ` ${item2.value}=${tableAttribute.collation}`;
                        break;
                    case 'auto_icrement':
                        value += ` ${item2.value}=${tableAttribute.auto_icrement}`;
                        break;
                    case 'comment':
                        value += ` ${item2.value}='${tableAttribute.comment}'`;
                        break;
                    case 'default_charset':
                        value += ` ${item2.value}=${tableAttribute.default_charset}`;
                        break;
                }
            }
        }
        return value;
    }

    private async executeQuery(sentence: string, values?: any): Promise<any> {
        const results = await (await this.db()).query(sentence, values);
        await (await this.db()).release();
        (await this.db()).destroy();
        return results;
    }

    private validateAttributeColumns(attribute: keyof TColumnsAttributes<T>, fields: TColumnsAttributes<T>) {
        return fields?.[attribute] != undefined && (fields?.[attribute] == true || typeof fields?.[attribute] == 'number' || typeof fields?.[attribute] == 'string' || typeof fields?.[attribute] == 'object') ? true : false;
    }

    private validateAttributeTable(attribute: keyof TTableAttribute, fields: TTableAttribute) {
        return fields?.[attribute] != undefined ? true : false;
    }
}