#!/usr/bin/env node
import inquirer from 'inquirer';
import ansiColors from 'ansi-colors';
import fs from 'fs';
import path from 'path';

export default class Cuby {
    //#region Private properties
    private input: string[];
    private abrevCommand: string = 'aec';
    private pathPackage = path.join(path.resolve(), '/package.json');
    private regExpEspecialCharacter: RegExp = /[!@#$%^&*()+={}\[\]|\\:;'",.<>/?]/;

    private help: string = `
${ansiColors.yellowBright('Database')}
Example command
    ${ansiColors.cyan(this.abrevCommand + '<command> --help ')}More information
    ${ansiColors.cyan(this.abrevCommand + '<flags> <options> ')}More information

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
    protected pathIndex: string = '';
    protected pathModel: string = '';
    //#endregion

    constructor() {
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
                    else throw new Error(ansiColors.yellowBright('You can\'t create an entity because you haven\'t added the database module. ') + ansiColors.blueBright('Use aec or api-express-cli add db:mysql'));
                }
                else if (params == 'db:seed') {
                }
                else if (params == 'db:scan:model') {
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
            console.log(ansiColors.redBright('This action does not allow any arguments'));
            return false;
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




    private async executeAction(value: string, type: 'seed' | 'migration' | 'model' | 'scan:model') {
        try {
            // let indexSeparator = this.getIndexSeparator(value).index;
            let route = String(value).toLocaleLowerCase();
            // let nameRoute = this.addPrefix(indexSeparator, route, 'Router');
            switch (type) {
                case 'scan:model':
                    break;

                case 'seed':
                    break;
                case 'migration':
                    break;
                case 'model':
                    break;
            }
        } catch (error: any) {
            throw new Error(error.message);
        }
    }
    //#endregion
    //#endregion
}