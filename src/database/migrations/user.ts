import { IFields } from "../../core/database/interfaces/forge.interface";
import { Migration } from "../../core/database/migration";

export class User extends Migration {
    private table: string = 'users2';
    async up(): Promise<void> {
        try {
            let fields: IFields = {
                id: {
                    type: 'INT',
                    isAutoincrement: true,
                    isNotNull: true,
                    isPrimariKey: true
                },
                user_id: {
                    type: 'INT'
                },
                age: {
                    type: 'INT',
                    isUnique: true,
                },
                user_name: {
                    type: 'VARCHAR',
                    constraint: 50,
                    isNotNull: true
                },
                first_name: {
                    type: 'TEXT',
                    comments: 'primer nombre'
                },
                last_name: {
                    type: 'TEXT',
                    comments: 'segundo nombre'
                },
                create_at: {
                    type: 'DATETIME',
                    default: 'NOW()'
                }
            }
            this.addField(fields);
            this.addForeignKey(this.table, { column: 'user_id', references: { column: 'id', table: 'users1' }, onDelete: 'CASCADE' });
            await this.createTable(this.table);
        } catch (error: any) {
            console.log(error.message);
        }
    }

    async down(): Promise<void> {
        try {
            await this.dropTableIfExists(this.table);
        } catch (error: any) {
            console.log(error.message);
        }
    }
}
