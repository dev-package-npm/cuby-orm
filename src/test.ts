// import { LoaderDatabase } from "./config/load-database.config";

import { Model } from "./core/mysql/models/model";
// const loaderDatabase = new LoaderDatabase();
// loaderDatabase.load().then((result) => {

//     console.log();
// }).catch(error => {
//     console.log(error);
// })

// #region Interface
export interface IUsers1Model {
}
//#endregion

class Users1Model extends Model<IUsers1Model> {
    private static fields: (keyof IUsers1Model)[] = [];

    constructor() {
        super({ table: 'users1', primaryKey: '', fields: Users1Model.fields });
    }
}

const user1 = new Users1Model();
user1.select().then(users => {
    console.log(users);
}).catch(error => console.log(error.message));