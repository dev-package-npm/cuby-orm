import { Database, PoolConnection } from "../../settings/database";
import { IFields, TForeignKey, TSqlAttribute, TTableAttribute, TTforeign as TTforeignKeyStructure } from "./interfaces/forge.interface";

export class Forge extends Database {
    protected db;
    private fields: string[] = [];
    private sqlQuery: string = '';

    private tableAttributes: TTableAttribute[] = [
        {
            attribute: 'isPrimariKey',
            value: 'PRIMARY KEY'
        },
        {
            attribute: 'isNotNull',
            value: 'NOT NULL'
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
            attribute: 'comments',
            value: 'COMMENT'
        },
        {
            attribute: 'default',
            value: 'DEFAULT'
        },
        {
            attribute: 'foreignKey',
            value: <TTforeignKeyStructure>{
                foreignKey: 'FOREIGN KEY',
                reference: 'REFERENCES',
                onDelete: 'ON DELETE',
                onUpdate: 'ON UPDATE'
            }
        }
    ]

    private sqlStr: string = '';
    private createTableStr: string = 'CREATE TABLE';
    private dropTableStr: string = 'DROP TABLE';
    private alterTableStr: string = 'ALTER TABLE';
    private ifExistsStr: string = 'IF EXISTS';
    private addConstraintStr: string = 'ADD CONSTRAINT';

    constructor() {
        super();
        this.db = async () => await this.getConnection();
    }

    protected addField(fields: IFields) {
        // console.log(Object.keys(fields));
        for (const item of Object.keys(fields)) {
            this.fields.push(this.orderFields(item, fields));
        }
        if (this.sqlStr != '') {
            this.fields.push(this.sqlStr);
            this.sqlStr = '';
        }
    }

    protected async createTable(name: string) {
        this.sqlQuery = `${this.createTableStr} \`${name}\` (
            ${this.fields.join(',\n')}
            );`;
        if (this.sqlStr != '') {
            this.sqlQuery += '\n' + this.sqlStr;
            this.sqlStr = '';
        }
        // console.log(this.sqlQuery);
        return await this.executeQuery(this.sqlQuery);
    }

    protected async addForeignKey(table: string, data: TForeignKey) {
        const tableAttributes = (<TTforeignKeyStructure>this.tableAttributes.find(item => item.attribute == 'foreignKey')?.value)
        this.sqlStr = `${this.alterTableStr} \`${table}\` ${this.addConstraintStr} \`FK_\` ${tableAttributes.foreignKey} (\`${data.column}\`) ${tableAttributes.reference} \`${data.references.table}\` (\`${data.references.column}\`)`;
        if (data.onDelete != undefined) {
            this.sqlStr += ` ${tableAttributes.onDelete} ${data.onDelete}`;
        }
        if (data.onUpdate != undefined) {
            this.sqlStr += ` ${tableAttributes.onUpdate} ${data.onUpdate}`;
        }
        this.sqlStr += ';';
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

    private orderFields(item: string, fields: IFields) {
        let value = `\`${item}\` ${fields[item].type}${this.validateAttribute('constraint', fields[item]) ? `(${fields[item].constraint})` : ''}`;

        for (const item2 of this.tableAttributes) {
            if (this.validateAttribute(item2.attribute, fields[item]) && item2.attribute != 'constraint') {
                if (item2.attribute == 'comments') {
                    value += ` ${item2.value} "${fields[item].comments}"`
                } else if (item2.attribute == 'default') {
                    value += ` ${item2.value} ${fields[item].default}`;
                }
                else if (item2.attribute != 'foreignKey')
                    value += ' ' + item2.value;
                else if (item2.attribute == 'foreignKey') {
                    this.sqlStr += `${(<TTforeignKeyStructure>item2.value).foreignKey} (\`${item}\`) ${(<TTforeignKeyStructure>item2.value).reference} \`${fields[item].foreignKey?.references.table}\`(\`${fields[item].foreignKey?.references.column}\`)`;
                    if (fields[item].foreignKey?.onDelete != undefined) {
                        this.sqlStr += ` ${(<TTforeignKeyStructure>item2.value).onDelete} ${fields[item].foreignKey?.onDelete}`;
                    }
                    if (fields[item].foreignKey?.onUpdate != undefined) {
                        this.sqlStr += ` ${(<TTforeignKeyStructure>item2.value).onUpdate} ${fields[item].foreignKey?.onUpdate} `;
                    }
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

    private validateAttribute(attribute: keyof TSqlAttribute, fields: TSqlAttribute) {
        return fields?.[attribute] != undefined && (fields?.[attribute] == true || typeof fields?.[attribute] == 'number' || typeof fields?.[attribute] == 'string' || typeof fields?.[attribute] == 'object') ? true : false;
    }
}