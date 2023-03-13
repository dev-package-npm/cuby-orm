import inquirer from 'inquirer';
import ansiColors from 'ansi-colors';
import fs from 'fs';
import path from 'path';
import MakeModel from '../make/make-model';

export default class Cuby extends MakeModel {
    //#region Private properties
    private input: string[];
    private abrevCommand: string = 'cuby';
    private pathPackage = path.join(path.resolve(), '/package.json');
    private regExpEspecialCharacter: RegExp = /[!@#$%^&*()+={}\[\]|\\:;'",.<>/?]/;

    private help: string = `
${ansiColors.yellowBright('Database')}
    Example command
        ${ansiColors.cyan(this.abrevCommand + ' <command> --help ')}More information
        ${ansiColors.cyan(this.abrevCommand + ' <flags> <options> ')}More information
    
    COMMAND LINE FLAGS
        ${ansiColors.cyan('db:seed ')}Initialize a folder structure for the api, with some utilities.
        ${ansiColors.cyan('db:model ')}Create a model with the specified name.
        ${ansiColors.cyan('db:scan:model ')}Create a model with the specified name.
        ${ansiColors.cyan('db:migration ')}Create a model with the specified name.
        ${ansiColors.cyan('--help, -h ')}Print this message.
        ${ansiColors.cyan('--version, -v ')}Print version with package.
    
    COMMAND OPTIONS
        ${ansiColors.cyan('--name ')}Name files ${ansiColors.redBright('Not applied')}.
        ${ansiColors.cyan('--add ')}Name module.`;

    private helpInitial: string = `
    Example command
        ${ansiColors.cyan(this.abrevCommand + ' <flags> <name> ')}
    
    COMMAND LINE FLAGS
        ${ansiColors.cyan('create, c ')}Create project name with given name.
        ${ansiColors.cyan('--help, -h ')}Print this message.
        ${ansiColors.cyan('--version, -v ')}Print version with package.
`;

    protected version: string = '';
    protected pathIndex: string = path.join(path.resolve(), 'testing');

    //#endregion

    constructor() {
        super({ fileNameModel: 'model.ts', pathModel: path.join(path.resolve(), '/testing/models/') });
        //? Takes the data entered by the terminal, and stores it
        process.title = `${Array.from(process.argv).slice(2).join(" ")}`;
        this.input = process.title.split(" ");
    }

    async interpreInput(): Promise<void> {
        try {
            const params = this.input[0];
            // console.log(params);
            if (params === "--help" || params === "-h" || params == "") {
                if (this.validateQuantityArguments(this.input, 1))
                    this.printHelp();
            }
            else if (params == '-v' || params == '--version') {
                if (this.validateQuantityArguments(this.input, 1))
                    console.log('Version', ansiColors.cyan(this.version));
            }
            else if (fs.existsSync(this.pathPackage)) {
                if (!fs.existsSync(this.pathIndex))
                    throw new Error(ansiColors.blueBright('You must initialize your project'));

                else if (params == 'db:model' || params == 'm') {
                    if (fs.existsSync(this.pathModel))
                        await this.model(this.input.slice(1));
                    else throw new Error(ansiColors.yellowBright('The directory provided is invalid or does not exist. Path: ') + ansiColors.blueBright(this.pathModel));
                }
                else if (params == 'db:seed') {
                }
                else if (params == 'db:scan:model') {
                    if (this.validateQuantityArguments(this.input, 2))
                        await this.scanModel(this.input.slice(1));
                }
                else if (params == 'db:migration') {
                }
                else throw new Error(ansiColors.yellowBright('Command is not valid'));
            }
            else throw new Error(ansiColors.yellowBright('Command is not valid'));
        } catch (error: any) {
            console.error(error.message);
        }
    }

    //#region Private methods
    private printHelp(): void {
        if (fs.existsSync(this.pathPackage))
            console.log(this.help);
        else console.log(this.helpInitial);
    }

    private validateQuantityArguments(params: string[], quantity: number): boolean {
        if (params.length != quantity) {
            throw new Error(ansiColors.redBright(`This action does not accept more than '${ansiColors.yellowBright(String(quantity))}' arguments`));
        }
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

    private async interpretAnswer(answer: string, action: 'add' | 'rm' = 'add') {
        try {
            switch (answer) {
                case 'ws':
                    // if (action == 'add')
                    // await this.initWs(answer);
                    // else if (action == 'rm')
                    // await this.removeWs(answer);
                    break;
                case 'db:mysql':
                    // if (action == 'add')
                    //     await this.initDatabase(answer);
                    // else if (action == 'rm') {
                    //     await this.removeDatabase(answer);
                    // }
                    break;
                default:
                    throw new Error(ansiColors.redBright(ansiColors.redBright(`Invalid '${answer}' value`)));
                    break;
            }
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    //#region 
    private async model(params: Array<string>) {
        try {
            if (params.length != 0)
                for (const item of params) {
                    await this.executeAction(item, 'model');
                }
            else
                await inquirer.prompt({
                    type: 'input',
                    name: 'model',
                    message: 'Write the name of the model: ',
                }).then(async (answer) => {
                    await this.executeAction(answer.model, 'model');
                });
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    private async scanModel(params: Array<string>) {
        try {
            if (params.length != 0)
                for (const item of params) {
                    await this.executeAction(item, 'scan:model');
                }
            else
                await inquirer.prompt({
                    type: 'input',
                    name: 'table',
                    message: 'Write the name of the table to scan: ',
                }).then(async (answer) => {
                    await this.executeAction(answer.table, 'scan:model');
                });
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
                        }).then((answer2) => {
                            if (answer2.res)
                                this.createModel(nameClassModel, value.toLocaleLowerCase());
                        });
                    } else
                        this.createModel(nameClassModel, value.toLocaleLowerCase());
                    break;
            }
        } catch (error: any) {
            throw new Error(error.message);
        }
    }
    //#endregion
    //#endregion
}