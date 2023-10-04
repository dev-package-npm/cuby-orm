import path from 'node:path';
import fs from 'node:fs';

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


