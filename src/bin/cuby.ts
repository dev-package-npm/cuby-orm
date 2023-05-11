import inquirer from 'inquirer';
import ansiColors from 'ansi-colors';
import fs from 'node:fs';
import path from 'node:path';
import MakeModel from '../make/make-model';
import { Mixin } from 'ts-mixer';

//#region  Interfaces
interface ICubyConfig {
    model: {
        name: string;
        path: string;
    },
    index_folder: string;
    database: {
        seeders: {
            path: string;
            name: string
        };
        migrations: {
            path: string;
            name: string
        }
    },
}
//#endregion

const { model, index_folder }: ICubyConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../../.cuby.json'), 'utf8'));
// const packageNpm2 = JSON.parse(fs.readFileSync(path.join(path.resolve(), './package.json'), 'utf8'));
const { version }: { version: string } & { [k: string]: any } = JSON.parse(fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8'));

export class Cuby extends Mixin(MakeModel) {
    //#region Private properties
    private input: string[];
    private abrevCommand: string = 'cuby';
    private pathPackage = path.join(path.resolve(), '/package.json');
    private regExpEspecialCharacter: RegExp = /[!@#$%^&*()+={}\[\]|\\:;'",.<>/?]/;
    private pathConfig: string = path.join(__dirname, '../../.cuby.json');

    private help: string = `
${ansiColors.yellowBright('Database')}
    Example command
        ${ansiColors.cyan(this.abrevCommand + ' <command> --help ')}More information
        ${ansiColors.cyan(this.abrevCommand + ' <flags> <options> ')}More information
    
    COMMAND LINE FLAGS
        ${ansiColors.cyan('db:seed ')}Initialize a folder structure for the api, with some utilities.
        ${ansiColors.cyan('db:model ')}Create a model with the specified name.
        ${ansiColors.cyan('db:scan:model ')}Scan models from selected databases.
        ${ansiColors.cyan('db:migration ')}Create a model with the specified name.
        ${ansiColors.cyan('db:config ')}Command to configure some properties, to show more help use ${ansiColors.yellowBright('npx cuby db:config -h')}.
        
        ${ansiColors.cyan('--help, -h ')}Print this message.
        ${ansiColors.cyan('--version, -v ')}Print version with package.
    
    COMMAND OPTIONS
        ${ansiColors.cyan('--name ')}Name files ${ansiColors.redBright('Not applied')}.
        ${ansiColors.cyan('--add ')}Name module.`;

    protected version: string = version;
    protected pathIndex: string = path.join(path.resolve(), index_folder);

    //#endregion

    constructor() {
        super({ fileNameModel: model.name, pathModel: path.join(path.resolve(), model.path) });
        //? Takes the data entered by the terminal, and stores it
        process.title = `${Array.from(process.argv).slice(2).join(" ")}`;
        this.input = process.title.split(" ");
    }

    public async interpreInput(input?: string[]): Promise<void> {
        try {
            input !== undefined ? this.input = input : '';
            const params = this.input[0];
            if (params === "--help" || params === "-h" || params == "") {
                if (this.validateQuantityArguments(this.input, 0))
                    this.printHelp();
            }
            else if (params == '-v' || params == '--version') {
                if (this.validateQuantityArguments(this.input, 0))
                    console.log('Version', ansiColors.cyan(this.version));
                // console.log(import('../../cuby.config'));
            }
            else if (this.input[1] == '--help' || this.input[1] == '-h') {
                if (this.validateQuantityArguments(this.input, 1))
                    this.printHelpForCommand(this.input[0]);
            }
            else if (fs.existsSync(this.pathPackage)) {
                if (!fs.existsSync(this.pathIndex))
                    throw new Error(ansiColors.blueBright('You must initialize your project'));

                else if (params == 'db:model' || params == 'db:m') {
                    if (fs.existsSync(this.pathModel))
                        await this.model(this.input.slice(1));
                    else throw new Error(ansiColors.yellowBright('The directory provided is invalid or does not exist. Path: ') + ansiColors.blueBright(this.pathModel));
                }
                else if (params == 'db:seed') {
                    console.log(ansiColors.yellowBright('no implementation'));
                }
                else if (params == 'db:scan:model') {
                    await this.scanModel();
                }
                else if (params == 'db:migration') {
                    console.log(ansiColors.yellowBright('no implementation'));
                }
                else if (params == 'db:config') {
                    this.setConfig(this.input.slice(1));
                }
                else throw new Error(ansiColors.yellowBright('Command is not valid'));
            }
            else throw new Error(ansiColors.yellowBright('Command is not valid'));
        } catch (error: any) {
            console.error(error.message);
        }
    }

    public getHelp(): string {
        return this.help;
    }

    //#region Private methods
    private printHelp(): void {
        if (fs.existsSync(this.pathPackage))
            console.log(this.help);
        else throw new Error(ansiColors.yellowBright('No initialized node project exists'));
    }

    protected printHelpForCommand(params: string, abrevCommand?: string): void {
        try {
            const objParams: any = {};

            switch (params) {
                case 'db:config':
                    console.log(`${abrevCommand || this.abrevCommand} ${params} ${ansiColors.blueBright('model.path <path>')}`);
                    break;
                case 'db:model':
                    console.log(`${abrevCommand || this.abrevCommand} ${params} ${ansiColors.blueBright('<model1 model2>')} separated by a space`);
                    break;
                default:
                    throw new Error(ansiColors.yellowBright(`The ${ansiColors.blueBright(params[0])} command has no help `));
                    break;
            }
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    protected setConfig(params: string[]): void {
        try {
            const objParams: any = {};

            for (let i = 0; i < params.length; i += 2) {
                const key = params[i];
                const value = params[i + 1];
                objParams[key] = value;
            }
            const config = fs.readFileSync(this.pathConfig, 'utf8');
            let content: ICubyConfig = JSON.parse(config);
            for (const item of Object.keys(objParams)) {
                switch (item) {
                    case 'model.path':
                        if (objParams[item].charAt(objParams[item].length - 1) != '/')
                            objParams[item] += '/';
                        content.model.path = objParams[item];
                        this.pathModel = objParams[item];
                        break;

                    default:
                        throw new Error(ansiColors.yellowBright('Invalid attribute ' + ansiColors.blueBright(item)));
                        break;
                }
                fs.writeFileSync(this.pathConfig, JSON.stringify(content, null, 4));
                console.log(`${ansiColors.yellowBright(`Done changing path from ${ansiColors.blueBright(JSON.parse(config).model.path)} to ${ansiColors.blueBright(content.model.path)}`)}`);
            }
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    private validateQuantityArguments(params: string[], quantity: number): boolean {
        if (params.length - 1 > quantity)
            throw new Error(ansiColors.redBright(`This action does not accept more than '${ansiColors.yellowBright(String(quantity))}' arguments`));
        else if (params.length - 1 < quantity)
            throw new Error(ansiColors.redBright(`This action expects '${ansiColors.yellowBright(String(quantity))}' arguments`));
        else return true;
    }

    private async interpretAttibutes(input: Array<string>): Promise<void> {
        try {
            if (input.length > 2) {
                var attributes = input.slice(1);
                switch (attributes[0]) {
                    case '--add':
                        attributes = attributes.slice(1);
                        break;
                    case '--name':
                        break;
                    default:
                        throw new Error(ansiColors.redBright('Invalid attribute'));
                        break;
                }
            } else if (input.length < 1) throw new Error('A value is expected in the argument');
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    private async model(params: Array<string>) {
        try {
            let response;
            if (params.length != 0)
                for (const item of params) {
                    if (this.regExpEspecialCharacter.test(item) || item.charAt(0) == '-' || item.charAt(0) == '_') {
                        console.log(ansiColors.redBright("Unsupported characters: " + item));
                        continue;
                    }
                    await this.executeAction(item, 'model');
                }
            else
                await inquirer.prompt({
                    type: 'input',
                    name: 'models',
                    message: 'Write the name of models separated by space: ',
                }).then(async (answer) => {
                    for (const item of String(answer.models).split(' ')) {
                        if (this.regExpEspecialCharacter.test(item) || item.charAt(0) == '-' || item.charAt(0) == '_') {
                            console.log(ansiColors.redBright("Unsupported characters: " + item));
                            continue;
                        }

                        await this.executeAction(item, 'model');
                    }
                });
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    private async scanModel() {
        try {
            const db = await this.getDatabase();
            if (Array.isArray(db) && db.length > 0)
                await inquirer.prompt({
                    type: 'checkbox',
                    name: 'databases',
                    choices: db,
                    message: 'Select one or more databases to scan: ',
                }).then(async (answer) => {
                    if (answer.databases.length != 0) {
                        this.folderDatabaseModel = answer.databases;
                        await this.createFolderModelScaned();
                        for (const db of answer.databases) {
                            await this.executeAction(db, 'scan:model');
                        }
                        this.pathModel = this.originalPathModel;
                    }
                    else throw new Error(ansiColors.yellowBright('You have not selected any value'));
                });
            else throw new Error(ansiColors.yellowBright('No databases found'));
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    private async executeAction(value: string, type: 'seed' | 'migration' | 'model' | 'scan:model') {
        try {
            switch (type) {
                case 'scan:model':
                    await this.generateScanModel(value);
                    break;
                case 'seed':
                    break;
                case 'migration':
                    break;
                case 'model':
                    let model = String(value).toLocaleLowerCase();
                    model = model.charAt(0).toUpperCase() + model.slice(1);
                    let nameClassModel = this.addPrefix(model, 'Model');
                    if (fs.existsSync(this.pathModel + this.replaceAll(value.toLocaleLowerCase(), '-') + '.' + this.fileNameModel)) {
                        console.log(ansiColors.redBright(`Controller '${value.toLocaleLowerCase()}' already exists`));
                        await inquirer.prompt({
                            type: 'confirm',
                            name: 'res',
                            message: `you want to override the '${value.toLocaleLowerCase()}' model`,
                            default: false
                        }).then(async (answer2) => {
                            if (answer2.res)
                                await this.createModel(nameClassModel, value.toLocaleLowerCase());
                        });
                    } else
                        await this.createModel(nameClassModel, value.toLocaleLowerCase());
                    break;
            }
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    //#endregion
}