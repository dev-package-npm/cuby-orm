import { Model } from "./core/databases/mysql/models/model";

interface IUserModel {
    id?: number,
    document_typeID?: number,
    document?: string,
    docuement_issue_date?: string,
    place_issuance_document?: string,
    first_name?: string,
    second_name?: string,
    surname?: string,
    second_surname?: string,
    genderID?: number,
    email?: string,
    cell_phone?: string,
    date_birth?: string,
    place_birth?: string,
    disability?: string,
    conveyance?: string,
    marital_status?: string,
    number_children?: number,
    stratum?: number,
    multicultural?: string,
    blood_type?: string,
    municipality_residence?: string,
    neighborhood_residence?: string,
    address?: string,
    valid?: number,
    password?: string,
    create_time?: string
}

class User extends Model<IUserModel> {
    protected fields: (keyof IUserModel)[] = ['address'];

    constructor() {
        super({ table: 'users', primaryKey: 'id', fields: ['address'] });
        console.log(this.getProperty<IUserModel>());
    }

}

const user = new User();
// const model = new Model(typeof user.table, 'id', ['']);
const build = user.select1()
    .where({ id: 1, name: 'jairo' })
    .build();
user.find({ select: { subQuery: { select: '', where: '' } }, where: { id: 1 } });

console.log(build);

export { PoolConnection } from "./core/databases/mysql/database.mysql";
export { Model } from "./core/databases/mysql/models/model";