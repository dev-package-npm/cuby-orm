import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import path from 'path';

//#region deleteProperty

function deleteProperty(data: any, arrayProperty: Array<any>): void {
    for (const item of arrayProperty) {
        delete data[item];
    }
}
//#endregion


const loadEnvFile = () => {
    const config = dotenv.config({ path: path.resolve() + '/.env' });
    dotenvExpand.expand(config);
};


export { loadEnvFile, deleteProperty };