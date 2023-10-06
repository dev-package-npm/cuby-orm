import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import readLine from 'node:readline';
import { createFile, InterfacePropertyStructure } from "ts-code-generator";
import { Common } from "./common";
import ansiColors from "ansi-colors";
import SchemeMysql from '../core/mysql/scan-scheme.mysql';
import { Mixin } from 'ts-mixer';
import { packageName } from '../core/common';

// const schemeMysql = new SchemeMysql();

interface IConstrucMakeModel {
    fileNameModel: string,
    pathModel: string,
    pathSeed: string,
    fileNameSeed: string,
    pathMigration: string,
    fileNameMigration: string
}

export default class MakeModel extends Mixin(Common) {
    protected fileNameModel: string;
    protected fileNameSeed: string;
    protected pathModel: string;
    protected pathMigration: string;
    protected fileNameMigration: string;
    protected pathSeed: string;
    protected folderDatabaseModel: string[] = [];
    protected originalPathModel: string = '';
    private interface: InterfacePropertyStructure[] = [];
    private fields: string = '';
    private primariKey: string = '';
    private folderModel: string = '';
    private isScan: boolean = false;
    public namePackage = packageName;

    constructor({ fileNameModel, pathModel, pathSeed, fileNameSeed, pathMigration, fileNameMigration }: IConstrucMakeModel) {
        super();
        this.fileNameModel = fileNameModel;
        this.pathModel = pathModel;
        this.originalPathModel = this.pathModel;
        this.pathSeed = pathSeed;
        this.fileNameSeed = fileNameSeed;
        this.pathMigration = pathMigration;
        this.fileNameMigration = fileNameMigration;
    }

    protected async createModelFile(nameClass: string, inputModel: string) {
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
                { moduleSpecifier: this.namePackage == 'cuby-orm' ? '../../core/mysql/models/model' : 'cuby-orm', namedImports: [{ name: ' Model ' }] },
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

        if (this.folderDatabaseModel.length !== 0) {
            this.pathModel = this.originalPathModel;
            const schemeMysql = new SchemeMysql();

            if (this.folderModel !== await schemeMysql.getDatabaseName())
                this.pathModel = path.join(this.pathModel, this.folderModel, path.sep);
        }

        if (fs.existsSync(this.pathModel)) {
            if (this.isScan && fs.existsSync(path.join(this.pathModel, file.fileName))) {
                let content = new Readable({ encoding: 'utf-8', read() { this.push(file.write()), this.push(null) } });
                this.updateModelFile(path.join(this.pathModel, file.fileName), content);
            } else
                fs.writeFileSync(`${this.pathModel}${file.fileName}`, file.write());
        }
        else {
            let folder: any = this.pathModel.split(path.sep);
            folder = folder[folder.length - 2];
            throw new Error(ansiColors.blueBright(`There is no folder '${ansiColors.redBright(folder)}' to create this file`));
        }
    }

    protected async createMigrationFile(nameClass: string, inputMigration: string) {
        const file = createFile({
            fileName: `${this.replaceAll(inputMigration, '-')}.${this.fileNameMigration}`,
            classes: [
                {
                    name: nameClass,
                    isExported: true,
                    extendsTypes: [`Migration<I${nameClass}>`],
                    staticProperties: [

                    ],
                    properties: [
                        {
                            name: 'table',
                            type: `string = "${inputMigration.split('-').slice(-1)[0]}"`,
                            scope: 'private'
                        },
                        {
                            name: 'fields',
                            type: `TColumns<I${nameClass}>`,
                            scope: 'public'
                        }
                    ],
                    constructorDef: {
                        onWriteFunctionBody: writer => {
                            writer.writeLine("super();");
                            writer.write("this.fields = {};");
                        }
                    },
                    methods: [
                        {
                            name: 'up',
                            isAsync: true,
                            returnType: 'Promise<void>',
                            onWriteFunctionBody: writer => {
                                writer.write(`try {
    this.addField(this.fields);
    await this.createTableIfNotExists(this.table, { engine: 'InnoDB', auto_icrement: 0, charset: 'UTF8', collation: 'UTF8_GENERAL_CI' });
} catch (error: any) {
    console.log(error.message);
}`);
                            }
                        },
                        {
                            name: 'down',
                            isAsync: true,
                            returnType: 'Promise<void>',
                            onWriteFunctionBody: writer => {
                                writer.write(`try {
    await this.dropTableIfExists(this.table);
} catch (error: any) {
    console.log(error.message);
}`);
                            }
                        }
                    ]
                }
            ],
            imports: [
                { moduleSpecifier: this.namePackage == 'cuby-orm' ? '../../../core/mysql/migration.mysql' : 'cuby-orm', namedImports: [{ name: ' Migration ' }] },
                { moduleSpecifier: this.namePackage == 'cuby-orm' ? '../../../core/mysql/interfaces/forge.interface' : 'cuby-orm', namedImports: [{ name: ' TColumns ' }] }
            ],
            interfaces: [
                {
                    name: `I${nameClass}`,
                    properties: this.interface,
                    onAfterWrite: writer => writer.writeLine('//#endregion'),
                    onBeforeWrite: writer => writer.writeLine('//#region Interface')
                },
            ]
        });


        if (fs.existsSync(this.pathMigration)) {
            fs.writeFileSync(`${this.pathMigration}${file.fileName}`, file.write());
        }
        else {
            let folder: any = this.pathMigration.split(path.sep);
            folder = folder[folder.length - 2];
            throw new Error(ansiColors.blueBright(`There is no folder '${ansiColors.redBright(folder)}' to create this file`));
        }
    }

    protected async createSeederFile({ nameClass, inputSeed }: { nameClass: string, inputSeed: string }) {
        const file = createFile({
            fileName: `${this.replaceAll(inputSeed, '-')}.${this.fileNameSeed}`,
            classes: [
                {
                    name: nameClass,
                    isExported: true,
                    extendsTypes: [`Seeder`],
                    methods: [
                        {
                            name: 'run',
                            isAsync: true,
                            onWriteFunctionBody: (writer) => {
                                writer.write('try').block(() => {
                                    writer.writeLine("//Write your seeder")
                                        .writeLine("//Remember to put await in the call method")
                                        .writeLine("console.log(\"Testing seeder\");");
                                }).write("catch (error: any)")
                                    .block(() => {
                                        writer.writeLine('throw new Error(error.message);');
                                    });
                            }
                        }
                    ]
                }
            ],
            imports: [
                { moduleSpecifier: this.namePackage == 'cuby-orm' ? '../../../core/seeds/seeder' : 'cuby-orm', namedImports: [{ name: ' Seeder ' }] },
            ],
            defaultExportExpression: nameClass
        });

        if (fs.existsSync(this.pathSeed)) {
            fs.writeFileSync(`${this.pathSeed}${file.fileName}`, file.write());
        }
        else {
            let folder: any = this.pathSeed.split(path.sep);
            folder = folder[folder.length - 2];
            throw new Error(ansiColors.blueBright(`There is no folder '${ansiColors.redBright(folder)}' to create this file`));
        }
    }

    protected async generateScanModel(database: string) {
        this.folderModel = database;
        this.isScan = true;
        const schemeMysql = new SchemeMysql();

        const tables = await schemeMysql.getDatabaseTable(database);
        for (const item of tables) {
            const columns = await schemeMysql.getColumnScheme(['COLUMN_NAME', 'DATA_TYPE', 'COLUMN_KEY', 'COLUMN_TYPE', 'IS_NULLABLE', 'COLUMN_DEFAULT'], item.table);
            this.fields += '[';
            for (const item2 of columns) {
                this.interface.push({
                    name: item2.COLUMN_NAME,
                    type: schemeMysql.getType(item2.DATA_TYPE) !== -1 ? 'number' : 'string',
                    isOptional: item2.IS_NULLABLE == 'YES' ? true :
                        item2.COLUMN_KEY == 'PRI' ? true :
                            item2.COLUMN_DEFAULT != null ? true : false,
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
            await this.createModelFile(nameClassModel, item.table.toLocaleLowerCase());
            this.fields = '';
            this.interface = [];
        }
    }

    protected async createFolderModelScaned() {
        const schemeMysql = new SchemeMysql();

        if (this.folderDatabaseModel.length !== 0) {
            this.folderDatabaseModel.forEach(async folder => {
                if (!fs.existsSync(path.join(this.pathModel, folder))) {
                    const nameDatabase = await schemeMysql.getDatabaseName();
                    if (folder !== nameDatabase)
                        fs.mkdirSync(path.join(this.pathModel, folder), { recursive: true });
                }
            });
        }
    }

    private updateModelFile(filePath: string, readbleStream: Readable) {
        const originalContent = fs.createReadStream(filePath, 'utf8');

        let interfaceModels = '';
        let superModels = '';
        let fieldsModels = '';

        let rl = readLine.createInterface({ input: readbleStream });
        let controlReadSection = false

        rl.on('line', (line: string) => {
            if (controlReadSection)
                interfaceModels += line + '\n';

            if (controlReadSection && line.includes('}') != false)
                controlReadSection = false;

            if (line.includes('//#region Interface') != false)
                controlReadSection = true;
            else if (line.includes('private static fields:') != false)
                fieldsModels += line + '\n';
            else if (line.includes('super({') != false)
                superModels += line + '\n';
        });

        // Se escribe en el archivo original
        rl = readLine.createInterface({ input: originalContent });
        let mergedContent = '';
        rl.on('line', (line: string) => {

            if (controlReadSection && line.includes('}') != false) {
                mergedContent += interfaceModels;
                controlReadSection = false;
            } else if (line.includes('//#region Interface') != false) {
                controlReadSection = true;
                mergedContent += line + '\n';
            }
            else if (line.includes('private static fields:') != false)
                mergedContent += fieldsModels;
            else if (line.includes('super({') != false)
                mergedContent += superModels;
            else if (!controlReadSection)
                mergedContent += line + '\n';
        });

        rl.on('close', () => {
            fs.writeFileSync(filePath, mergedContent);
        });
    }

}