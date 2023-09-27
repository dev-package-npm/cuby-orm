import path from 'node:path';
import fs from 'node:fs';


let packageProject: any;
let packageName: string = '';
const pathPackage = path.join(path.resolve(), 'package.json');

if (fs.existsSync(pathPackage)) {
    packageProject = JSON.parse(fs.readFileSync(pathPackage, 'utf8'));
    packageName = packageProject?.name;
}

export { packageProject, pathPackage, packageName };