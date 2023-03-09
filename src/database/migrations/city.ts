import { TColumns } from "../../core/databases/interfaces/forge.interface";
import { Migration } from "../../core/databases/migration";

export class City extends Migration {
    private table: string = 'city';
    async up(): Promise<void> {
        try {
            let fields: TColumns = {
                id: {
                    type: 'INT',
                    isAutoincrement: true,
                    isNotNull: true,
                    isPrimariKey: true,
                    comment: 'Esto es el identificador único'
                },
                name: {
                    type: 'VARCHAR',
                    constraint: 100
                }
            }
            this.addField(fields);
            await this.createTableIfNotExists(this.table, { engine: 'InnoDB', auto_icrement: 0, default_charset: 'UTF8', collation: 'UTF8_GENERAL_CI' });
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
