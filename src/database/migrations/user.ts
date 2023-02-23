import { IFields } from "../../core/database/interfaces/forge.interface";
import { Migration } from "../../core/database/migration";

class User extends Migration {
    async up(): Promise<void> {
        try {
            let fields: IFields = {
                id: {
                    type: "INT"
                }
            }
            await this.createTable('');
        } catch (error: any) {
            console.log(error.message);
        }
    }

    async down(): Promise<void> {

    }
}

const user = new User();
user.up();