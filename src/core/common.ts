import path from 'node:path';
import fs from 'node:fs';


let packageProject: any;
let packageName: string = '';
const pathPackage = path.join(path.resolve(), 'package.json');

if (fs.existsSync(pathPackage)) {
    packageProject = JSON.parse(fs.readFileSync(pathPackage, 'utf8'));
    packageName = packageProject?.name;
}

function fileGetProperties({ fileName, propertie }: { fileName: string, pathFileName?: string, propertie?: string }) {
    const pathFile = path.join(path.resolve(), fileName);
    if (fs.existsSync(pathFile)) {
        let content = fs.readFileSync(pathFile, 'utf-8');
        content = content.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');
        content = JSON.parse(content);
        let propertieObjet = content;
        const properties: any = propertie?.split('.');
        if (properties)
            for (const item of properties) {
                if (propertieObjet[item] != undefined)
                    propertieObjet = propertieObjet[item];
                else break;
            }
        if (propertieObjet)
            return propertieObjet;
        return propertie ? propertieObjet || undefined : content;
    }
}

export { packageProject, pathPackage, packageName, fileGetProperties };