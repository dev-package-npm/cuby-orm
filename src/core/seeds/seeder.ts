import { Model } from "../mysql/models/model";
import path from 'node:path';
import fs from 'node:fs';
import { ICubyConfig } from "../../bin/cuby";
import ansiColors from "ansi-colors";
const { name }: { version: string } & { [k: string]: any } = JSON.parse(fs.readFileSync(path.join(path.resolve(), 'package.json'), 'utf8'));
const nameConfigFile = name == 'cuby-orm' ? '.cuby.dev.json' : '.cuby.json';
const { database }: ICubyConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../', nameConfigFile), 'utf8'));
const seederPath = path.join(name != 'cuby-orm' ? path.resolve() : __dirname, name != 'cuby-orm' ? database.seeds.path : '../../testing/database/seeds');

export class Seeder extends Model<any> {
    public seederPath = seederPath;
    static filesSeed: string[] = [];
    //! Be careful because it can generate a loop, if the same method is called in the seeder
    public async call({ fileNameSeed }: { fileNameSeed: string | string[] }): Promise<any> {
        try {

            if (Array.isArray(fileNameSeed)) {
                for (let fileSeed of fileNameSeed) {
                    let _fileNameSeed = fileSeed;
                    if (path.extname(fileSeed) == '.ts') {
                        fileSeed = fileSeed.replace('.ts', '.js');
                    }
                    if (!fileSeed.includes('seeder')) {
                        _fileNameSeed = path.extname(fileSeed) == '.js' ? fileSeed.replace('.js', '.seeder.js') : path.extname(fileSeed) == '.ts' ? fileSeed.replace('.ts', '.seeder.ts') : fileSeed + '.seeder.js';
                    }
                    const _fileSeed = path.extname(_fileNameSeed) != '.js' ? _fileNameSeed + '.js' : _fileNameSeed;
                    const filePathSeed = path.join(seederPath, _fileSeed);
                    if (this.validateDuplicateFile({ fileNameSeed: fileSeed }))
                        throw new Error(ansiColors.yellowBright(`Cannot call itself or duplicate call to same seed file: ${ansiColors.blueBright(fileSeed)}`));
                    Seeder.filesSeed.push(_fileSeed);

                    await this.runMethod({ filePathSeed, fileSeed: _fileSeed });
                }
            } else {
                if (path.extname(fileNameSeed) == '.ts') {
                    fileNameSeed = fileNameSeed.replace('.ts', '.js');
                }
                if (!fileNameSeed.includes('seeder')) {
                    fileNameSeed = path.extname(fileNameSeed) == '.js' ? fileNameSeed.replace('.js', '.seeder.js') : path.extname(fileNameSeed) == '.ts' ? fileNameSeed.replace('.ts', '.seeder.ts') : fileNameSeed + '.seeder.js';
                }
                const _fileSeed = path.extname(fileNameSeed) != '.js' ? fileNameSeed + '.js' : fileNameSeed;
                const filePathSeed = path.join(seederPath, _fileSeed);

                if (this.validateDuplicateFile({ fileNameSeed }))
                    throw new Error(ansiColors.yellowBright(`Cannot call itself or duplicate call to same seed file: ${ansiColors.blueBright(fileNameSeed)}`));
                Seeder.filesSeed.push(_fileSeed);

                await this.runMethod({ filePathSeed, fileSeed: _fileSeed });
            }
        } catch (error: any) {
            throw new Error(error.message);
        }
    }


    public async getFileSeeder(): Promise<string[]> {
        const seeder = fs.readdirSync(seederPath);
        return seeder.filter(fileSeed => this.chackInTs(fileSeed)).map(fileSeed => fileSeed.replace('.js', ''));
    }

    private async runMethod({ filePathSeed, fileSeed }: { filePathSeed: string, fileSeed: string }): Promise<any> {
        try {
            if (path.extname(filePathSeed) == '.js') {
                if (fs.existsSync(filePathSeed)) {
                    if (this.chackInTs(fileSeed)) {
                        const { default: Class } = await import(path.resolve(filePathSeed));
                        const seedInstance = new Class();
                        await seedInstance.run();
                    } else throw new Error(ansiColors.yellowBright(`Cannot find seed ${ansiColors.blueBright(filePathSeed.split(path.sep)[filePathSeed.split(path.sep).length - 1].replace('.js', ''))}`));
                } else throw new Error(ansiColors.yellowBright(`Cannot find seed ${ansiColors.blueBright(filePathSeed.split(path.sep)[filePathSeed.split(path.sep).length - 1].replace('.js', ''))}`));
            }
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    private validateDuplicateFile({ fileNameSeed }: { fileNameSeed: string }) {
        return Seeder.filesSeed.find((file) => file == fileNameSeed + '.js');
    }

    private chackInTs(fileNameSeed: string) {
        if (fs.existsSync(path.join(path.resolve(), database.seeds.path, fileNameSeed.replace('.js', '.ts')))) {
            return true;
        }
        else return false;
    }

}