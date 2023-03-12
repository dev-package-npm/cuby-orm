import { TColumns } from "../../core/mysql/interfaces/forge.interface";
import { Migration } from "../../core/mysql/migration.mysql";

interface IUser {
    id: number,
    user_id: number,
    city_id: number,
    user_name: string,
    first_name: string,
    last_name: string,
    full_name: string,
    create_at: string,
    update_at?: string
}

export class User extends Migration<IUser> {
    private table: string = 'users2';
    async up(): Promise<void> {
        try {
            let fields: TColumns<IUser> = {
                id: {
                    type: 'INT',
                    isAutoincrement: true,
                    isNotNull: true,
                    isPrimariKey: true,
                    comment: 'Esto es el identificador único'
                },
                user_id: {
                    type: 'INT',
                    isNotNull: true,
                },
                city_id: {
                    type: 'INT',
                    isIndex: true,
                    isNotNull: true
                },
                user_name: {
                    type: 'VARCHAR',
                    charset: 'UTF8MB4',
                    collation: 'UTF8MB4_UNICODE_CI',
                    constraint: 50,
                    default: 'NULL'
                },
                first_name: {
                    type: 'TEXT',
                    comment: 'primer nombre',
                    charset: 'UTF8MB4',
                    collation: 'UTF8MB4_GENERAL_CI',
                    isNotNull: true,
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
                },
                update_at: {
                    type: 'DATETIME',
                    default: 'NULL ON UPDATE NOW()',
                }
            }
            this.addField(fields);
            this.addForeignKey(this.table, { column: 'user_id', references: { column: 'id', table: 'users1' }, onDelete: 'CASCADE' });
            // this.addForeignKey(this.table, { column: 'city_id', references: { column: 'id', table: 'city' } });
            await this.createTableIfNotExists(this.table, { engine: 'InnoDB', auto_icrement: 0, default_charset: 'UTF8', collation: 'UTF8_GENERAL_CI', comment: 'Usuarios de prueba' });
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
