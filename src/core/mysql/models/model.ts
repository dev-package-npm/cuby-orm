//#region Imports
import { BaseModel } from './base-model';
import { IConstructorModel } from '../interfaces/mysql.model';
//#endregion

export abstract class Model<T> extends BaseModel<T> {
    constructor(params: IConstructorModel<T>) {
        super({ fields: params?.fields, primaryKey: params?.primaryKey, table: params?.table });
    }
}