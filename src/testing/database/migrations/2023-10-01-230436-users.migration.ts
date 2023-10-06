import { Migration } from "../../../core/mysql/migration.mysql";
import { TColumns } from "../../../core/mysql/interfaces/forge.interface";

//#region Interface
interface IUsersMigration {
}
//#endregion

export class UsersMigration extends Migration<IUsersMigration> {
    private table: string = "users";
    fields: TColumns<IUsersMigration>;

    constructor() {
        super();
        this.fields = {};
    }

    async up() {
        try {
            this.addField(this.fields);
            await this.createTableIfNotExists(this.table, { engine: 'InnoDB', auto_icrement: 0, charset: 'UTF8', collation: 'UTF8_GENERAL_CI' });
        } catch (error: any) {
            console.log(error.message);
        }
    }

    async down() {
        try {
            await this.dropTableIfExists(this.table);
        } catch (error: any) {
            console.log(error.message);
        }
    }
}
