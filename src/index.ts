import { User } from "./database/migrations/user";

const user = new User();
const main = async () => {
    await user.down();
    await user.up();
}

main();