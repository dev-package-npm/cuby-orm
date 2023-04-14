import path from 'node:path';
import fs from 'node:fs';
import { exec } from 'node:child_process';

const pathTsConfig = path.join(path.resolve(), 'tsconfig.json');

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


