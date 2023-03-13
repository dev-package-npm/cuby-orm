import { TColumns } from "../../../../src/core/mysql/interfaces/forge.interface";
import { Migration } from "../../../../src/core/mysql/migration.mysql";

interface ICity {
    id: number;
    name: string;
}
export class City extends Migration<ICity> {
    private table: string = 'city';
    async up(): Promise<void> {
        try {
            let fields: TColumns<ICity> = {
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
