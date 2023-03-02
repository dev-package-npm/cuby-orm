import { TColumns } from "../../core/database/interfaces/forge.interface";
import { Migration } from "../../core/database/migration";

export class User extends Migration {
    private table: string = 'users2';
    async up(): Promise<void> {
        try {
            let fields: TColumns = {
                id: {
                    type: 'INT',
                    isAutoincrement: true,
                    isNotNull: true,
                    isPrimariKey: true
                },
                user_id: {
                    type: 'INT',
                    isNotNull: true
                },
                age: {
                    type: 'INT',
                    isUnique: true,
                },
                user_name: {
                    type: 'VARCHAR',
                    charset: 'UTF8',
                    collation: 'UTF8_GENERAL_CI',
                    constraint: 50,
                    isNotNull: true
                },
                first_name: {
                    type: 'TEXT',
                    comment: 'primer nombre',
                },
                last_name: {
                    type: 'TEXT',
                    comment: 'segundo nombre'
                },
                full_name: {
                    type: 'VARCHAR',
                    constraint: 100,
                    isNotNull: true
                },
                create_at: {
                    type: 'DATETIME',
                    default: 'NOW()'
                }
            }
            this.addField(fields);
            this.addForeignKey(this.table, { column: 'user_id', references: { column: 'id', table: 'users1' }, onDelete: 'CASCADE' });
            await this.createTableIfNotExists(this.table, { engine: 'InnoDB', auto_icrement: 0, default_charset: 'UTF8', comment: 'Usuarios de prueba' });
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
