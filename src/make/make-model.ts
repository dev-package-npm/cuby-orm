import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import readLine from 'node:readline';
import { createFile, InterfacePropertyStructure } from "ts-code-generator";
import { Common } from "./common";
import ansiColors from "ansi-colors";
import scanSchemeMysql from '../core/mysql/scan-scheme.mysql';
import { Mixin } from 'ts-mixer';

const { name }: { name: string } & { [k: string]: any } = JSON.parse(fs.readFileSync(path.join(path.resolve(), './package.json'), 'utf8'));


export default class MakeModel extends Mixin(Common) {
    protected fileNameModel: string;
    protected fileNameSeed: string;
    protected pathModel: string;
    protected pathSeed: string;
    protected folderDatabaseModel: string[] = [];
    protected originalPathModel: string = '';
    protected scanScheme = new scanSchemeMysql();
    private interface: InterfacePropertyStructure[] = [];
    private fields: string = '';
    private primariKey: string = '';
    private folderModel: string = '';
    private isScan: boolean = false;
    public namePackage = name;

    constructor({ fileNameModel, pathModel, pathSeed, fileNameSeed }: { fileNameModel: string, pathModel: string, pathSeed: string, fileNameSeed: string }) {
        super();
        this.fileNameModel = fileNameModel;
        this.pathModel = pathModel;
        this.originalPathModel = this.pathModel;
        this.pathSeed = pathSeed;
        this.fileNameSeed = fileNameSeed;
    }

    protected async createModel(nameClass: string, inputModel: string) {
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
            if (this.folderModel !== await this.scanScheme.getDatabaseName())
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

    protected async createSeeder({ nameClass, inputSeed }: { nameClass: string, inputSeed: string }) {
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
                { moduleSpecifier: this.namePackage == 'cuby-orm' ? '../../../core/seeds/seeder' : this.namePackage, namedImports: [{ name: ' Seeder ' }] },
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
        const tables = await this.scanScheme.getDatabaseTable(database);
        for (const item of tables) {
            const columns = await this.scanScheme.getColumnScheme(['COLUMN_NAME', 'DATA_TYPE', 'COLUMN_KEY', 'COLUMN_TYPE', 'IS_NULLABLE', 'COLUMN_DEFAULT'], item.table);
            this.fields += '[';
            for (const item2 of columns) {
                this.interface.push({
                    name: item2.COLUMN_NAME,
                    type: this.scanScheme.getType(item2.DATA_TYPE) !== -1 ? 'number' : 'string',
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
            await this.createModel(nameClassModel, item.table.toLocaleLowerCase());
            this.fields = '';
            this.interface = [];
        }
    }

    protected async getDatabase() {
        return this.scanScheme.getDatabase();
    }

    protected async createFolderModelScaned() {
        if (this.folderDatabaseModel.length !== 0) {
            this.folderDatabaseModel.forEach(async folder => {
                if (!fs.existsSync(path.join(this.pathModel, folder))) {
                    const nameDatabase = await this.scanScheme.getDatabaseName();
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