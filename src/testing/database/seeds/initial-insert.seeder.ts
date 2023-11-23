import { Seeder } from "../../../core/mysql/seeder";
import { UserModel } from "../../models/user.model";
import { Users1Model } from "../../models/users1.model";
const userModel = new Users1Model();
export class InitialInsertSeeder extends Seeder {
    async run() {
        try {
            //Write your seeder
            //Remember to put await in the call method
            const user = await userModel.findAll({ columns: ['id', 'age'] });
            console.log(user);
        }
        catch (error: any) {
            throw new Error(error.message);
        }
    }
}

export default InitialInsertSeeder;
