import path from 'node:path';
import fs from 'node:fs';
import { ICubyConfig } from "../../bin/cuby";
import ansiColors from "ansi-colors";
import { fileGetProperties, packageName } from '../common';

let name = packageName;
const nameConfigFile = name == 'cuby-orm' ? '.cuby.dev.json' : '.cuby.json';
let seederPath: string;
const pathPackage = path.join(__dirname, '../../../', nameConfigFile);
const { database: databaseFolder }: ICubyConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../', nameConfigFile), 'utf8'));
if (fs.existsSync(pathPackage)) {
    // TODO Resolver si src es dinámico
    const build = fileGetProperties({ fileName: 'tsconfig.json', propertie: 'compilerOptions.outDir' });
    seederPath = path.join(name != 'cuby-orm' ? path.join(path.resolve(), build != undefined ? path.normalize(build) : '') : __dirname, name != 'cuby-orm' ? databaseFolder?.seeds.path.replace('src/', '') : '../../testing/database/seeds');
}


export class Seeder {
    public seederPath = seederPath;
    static filesSeed: string[] = [];

    //! Be careful because it can generate a loop, if the same method is called in the seeder
    //? It was fixed
    public async call({ fileNameSeed }: { fileNameSeed: string | string[] }): Promise<any> {
        try {
            if (Array.isArray(fileNameSeed)) {
                for (let fileSeed of fileNameSeed) {
                    await this.normalize({ fileNameSeed: fileSeed });
                }
            } else {
                await this.normalize({ fileNameSeed });
            }
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    public async getFileSeeder(): Promise<string[]> {
        const seeder = fs.readdirSync(seederPath);
        return seeder.filter(fileSeed => this.chackInTs(fileSeed)).map(fileSeed => fileSeed.replace('.js', ''));
    }

    /**
     * Toma el valor pasado por fileNameSeed y le agreaga .js o seeder si no vienen incluidos, para poder construir el nombre del seeder correcto.
     * Adicionalmente valida si se está llamando múltiples veces un seeder. 
     * Por último ejecuta el seeder
     * @param param0 
     */
    private async normalize({ fileNameSeed }: { fileNameSeed: string }) {
        if (path.extname(fileNameSeed) == '.ts') {
            fileNameSeed = fileNameSeed.replace('.ts', '.js');
        }

        if (!fileNameSeed.includes('seeder')) {
            fileNameSeed = path.extname(fileNameSeed) == '.js' ?
                fileNameSeed.replace('.js', '.seeder.js') :
                path.extname(fileNameSeed) == '.ts' ?
                    fileNameSeed.replace('.ts', '.seeder.ts') :
                    fileNameSeed + '.seeder.js';
        }
        fileNameSeed = path.extname(fileNameSeed) != '.js' ? fileNameSeed + '.js' : fileNameSeed;
        const filePathSeed = path.join(seederPath, fileNameSeed);

        if (this.validateDuplicateFile({ fileNameSeed }))
            throw new Error(ansiColors.yellowBright(`Cannot call itself or duplicate call to same seed file: ${ansiColors.blueBright(fileNameSeed)}`));
        Seeder.filesSeed.push(fileNameSeed);

        await this.runMethod({ filePathSeed, fileSeed: fileNameSeed });
    }

    private async runMethod({ filePathSeed, fileSeed }: { filePathSeed: string, fileSeed: string }): Promise<any> {
        try {
            if (!fs.existsSync(filePathSeed) || !this.chackInTs(fileSeed))
                throw new Error(ansiColors.yellowBright(`Cannot find seed ${ansiColors.blueBright(fileSeed.replace('.js', ''))}`));

            if (path.extname(filePathSeed) == '.js') {
                const { default: Class } = await import(path.resolve(filePathSeed));
                const seedInstance = new Class();
                await seedInstance.run();
            }
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    private validateDuplicateFile({ fileNameSeed }: { fileNameSeed: string }) {
        return Seeder.filesSeed.find((file) => file == fileNameSeed);
    }

    private chackInTs(fileNameSeed: string) {
        if (fs.existsSync(path.join(path.resolve(), databaseFolder.seeds.path, fileNameSeed.replace('.js', '.ts')))) {
            return true;
        }
        else return false;
    }

}