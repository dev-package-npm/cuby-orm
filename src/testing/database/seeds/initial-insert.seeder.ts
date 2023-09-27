import { Seeder } from "../../../core/seeds/seeder";

export class InitialInsertSeeder extends Seeder {
    async run() {
        try {
            //Write your seeder
            //Remember to put await in the call method
            console.log("Testing seeder");
        }
        catch (error: any) {
            throw new Error(error.message);
        }
    }
}

export default InitialInsertSeeder;
