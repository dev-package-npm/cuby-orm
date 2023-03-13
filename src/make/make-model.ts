import fs from 'node:fs';
import path from 'node:path';
import { createFile, InterfacePropertyStructure } from "ts-code-generator";
import { Common } from "./common";
import ansiColors from "ansi-colors";
import scanSchemeMysql from '../core/mysql/scan-scheme.mysql';

export default class MakeModel extends Common {
    protected fileNameModel: string;
    protected pathModel: string;
    protected scanScheme = new scanSchemeMysql();
    private interface: InterfacePropertyStructure[] = [];
    private fields: string = '';
    private primariKey: string = '';

    constructor(params: { fileNameModel: string, pathModel: string }) {
        super();
        this.fileNameModel = params.fileNameModel;
        this.pathModel = params.pathModel;
    }

    protected createModel(nameClass: string, inputModel: string) {
        const file = createFile({
            fileName: `${this.replaceAll(inputModel, '-')}.${this.fileNameModel}`,
            classes: [
                {
                    name: nameClass,
                    isExported: true,
                    extendsTypes: [`Model<I${nameClass}>`],
                    staticProperties: [
                        {
                            name: `fields: (keyof I${nameClass})[]`,
                            scope: 'private',
                            defaultExpression: this.fields || '[]'
                        }
                    ],
                    constructorDef: {
                        onWriteFunctionBody: writer => writer.write(`super({ table: '${this.replaceAll(inputModel, '_')}', primaryKey: '${this.primariKey}', fields: ${nameClass}.fields });`)
                    }
                }
            ],
            imports: [
                { moduleSpecifier: 'cuby-orm', namedImports: [{ name: ' Model ' }] },
            ],
            interfaces: [
                {
                    name: `I${nameClass}`,
                    isExported: true,
                    properties: this.interface,
                    onAfterWrite: writer => writer.writeLine('//#endregion'),
                    onBeforeWrite: writer => writer.writeLine('//#region Interface')
                },
            ]
        });
        if (fs.existsSync(this.pathModel)) {
            fs.writeFileSync(`${this.pathModel}${file.fileName}`, file.write());
        }
        else {
            let folder: any = this.pathModel.split(path.sep);
            folder = folder[folder.length - 2];
            throw new Error(ansiColors.blueBright(`There is no folder '${ansiColors.redBright(folder)}' to create this file`));
        }
    }

    protected async generateScanModel(database: string) {
        const tables = await this.scanScheme.getDatabaseTable(database);
        for (const item of tables) {
            const columns = await this.scanScheme.getColumnScheme(['COLUMN_NAME', 'DATA_TYPE', 'COLUMN_KEY', 'COLUMN_TYPE', 'IS_NULLABLE', 'COLUMN_DEFAULT'], item.table);
            this.fields += '[';
            // console.log(item, columns);
            for (const item2 of columns) {
                this.interface.push({
                    name: item2.COLUMN_NAME,
                    type: this.getType(item2.DATA_TYPE) !== -1 ? 'number' : 'string',
                    isOptional: item2.IS_NULLABLE == 'YES' ? true : false,
                });
                this.fields += `'${item2.COLUMN_NAME}', `;
                if (item2.COLUMN_KEY == 'PRI') {
                    this.primariKey = item2.COLUMN_NAME;
                }
            }
            let model = String(item.table).toLocaleLowerCase();
            model = model.charAt(0).toUpperCase() + model.slice(1);
            let nameClassModel = this.addPrefix(model, 'Model');
            this.fields = this.fields.slice(0, this.fields.length - 2);
            this.fields += ']';
            this.createModel(nameClassModel, item.table.toLocaleLowerCase());
            // console.log(this.interface);
            this.fields = '';
            this.interface = [];
        }
    }

    private getType(value: string) {
        const numberValues = [
            'INT',
            'TINYINT',
            'SMALLINT',
            'MEDIUMINT',
            'BIGINT',
            'DECIMAL',
            'FLOAT',
            'DOUBLE',
            'DOUBLE'
        ];
        value = value.toUpperCase();
        return numberValues.indexOf(value);
    }

}