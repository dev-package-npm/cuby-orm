import path from 'node:path';
import fs from 'node:fs';
import { exec } from 'node:child_process';

const pathTsConfig = path.join(path.resolve(), 'tsconfig.json');

// TODO: remove
export const getBuildFolder = () => {
    if (fs.existsSync(pathTsConfig)) {
        // console.log('npx tsc --showConfig ' + pathTsConfig);
        return new Promise((resovle, rejects) => {
            exec('npx tsc --showConfig -p ' + pathTsConfig, (error, stdout, stderr) => {
                if (error != null)
                    rejects(new Error(String(error)));
                if (stderr != '')
                    rejects(new Error(String(stderr)));
                const tsconfig = JSON.parse(stdout);
                if (tsconfig?.compilerOptions?.outDir !== undefined) {
                    const dir = String(tsconfig?.compilerOptions?.outDir).replace('.', '').replace('\\', '').replace('/', '');
                    resovle(dir);
                }
                rejects(new Error("No se pudo obtener valor"));
            });
        });
    } else false
};

export const searchFileConfig = (pathDir: string, nameFileConfig: string): string => {
    const directories = fs.readdirSync(pathDir).filter(dir =>
        dir !== 'node_modules' &&
        dir.search('.json') === -1 &&
        dir.search('.md') === -1 &&
        dir.search('LICENSE') === -1 &&
        dir.search('.gitignore') === -1 &&
        dir.search('.git') === -1);

    for (const dir of directories) {
        if (fs.statSync(path.join(pathDir, dir)).isFile()) {
            if (dir.includes(nameFileConfig) && path.extname(dir) === '.js') {
                return path.join(pathDir, dir);
            }
        }
        else if (fs.statSync(path.join(pathDir, dir)).isDirectory()) {
            const result: any = searchFileConfig(path.join(pathDir, dir), nameFileConfig);
            if (result) return result;
        }
    }
    return '';
}


