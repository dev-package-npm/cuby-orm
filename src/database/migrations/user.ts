import { IFields } from "../../core/database/interfaces/forge.interface";
import { Migration } from "../../core/database/migration";

export class User extends Migration {
    private table: string = 'users2';
    async up(): Promise<void> {
        try {
            let fields: IFields = {
                id: {
                    type: 'INT',
                    isPrimariKey: true
                },
                user_name: {
                    type: 'VARCHAR',
                    constraint: 50,
                    isNotNull: true
                },
                first_name: {
                    type: 'TEXT'
                },
                last_name: {
                    type: 'TEXT'
                }
            }
            this.addField(fields);
            await this.createTable(this.table);
        } catch (error: any) {
            console.log(error.message);
        }
    }

    async down(): Promise<void> {
        try {
            // await this.dropTable(this.table);
        } catch (error: any) {
            console.log(error.message);
        }
    }
}
