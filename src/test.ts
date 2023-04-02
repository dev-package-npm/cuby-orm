import scanSchemeMysql from "./core/mysql/scan-scheme.mysql";

interface IUserModel {
    id?: number,
    document_typeID: number,
    document?: string,
    docuement_issue_date?: string,
    place_issuance_document?: string,
    first_name: string,
    second_name?: string,
    surname: string,
    second_surname?: string,
    genderID?: number,
    email?: string,
    cell_phone?: string
}


const main = async (): Promise<void> => {
    try {
        const scheme = new scanSchemeMysql();
        const tables: any[] = await scheme.getDatabaseTable('');
        // for (const item of tables) {
        //     console.log(item.table);
        // }
        const columns = await scheme.getColumnScheme(['COLUMN_NAME', 'DATA_TYPE', 'COLUMN_KEY', 'COLUMN_TYPE', 'IS_NULLABLE'], 'chat');
        console.log(columns[0]);
    } catch (error: any) {
        throw new Error(error.message);
    }
}
// main().then(() => {

// }).catch(error => {
//     console.log(error);
// });
// class User extends Model<IUserModel> {
//     private static fields: (keyof IUserModel)[] = ['id', 'document_typeID', 'document', 'docuement_issue_date', 'place_issuance_document', 'first_name', 'second_name', 'surname', 'second_surname', 'genderID', 'email', 'cell_phone'];

//     constructor() {
//         super({ table: 'users', primaryKey: 'id', fields: User.fields });
//     }
// }

// const user = new User();
// const build = user.select(['id', 'document_typeID'])
//     .where({ id: 1, first_name: 'jairo' }, 'OR')
//     .build().then(value => {
//         // console.log(value);
//     }).catch(error => {
//         console.log(error);
//     });
// console.log(build);
// user.find({ columns: ["cell_phone", "docuement_issue_date"] }).where({ id: 1 }).build().catch(value => {
//     if (!(value instanceof Array))
//         console.log(value.cell_phone);
// });
// user.select({ columns: ['cell_phone', 'first_name'], where: { id: 1 } }).then(value => {
//     if (!(value instanceof Array)) {
//         console.log(value.cell_phone);
//     } else {
//         value[0].cell_phone;
//     }
// })
// user.findAll({ select: { subQuery: { select: '', where: '' } }, where: { id: 1 } });