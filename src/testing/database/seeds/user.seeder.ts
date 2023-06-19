import { Seeder } from "../../../core/seeds/seeder";

export class UserSeeder extends Seeder {
    async run() {
        console.log("hola 1");
        this.call({ fileNameSeed: 'user2.seeder' });
    }
}

export default UserSeeder;
