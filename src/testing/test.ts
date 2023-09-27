import { Database, PoolConnection } from "../core/database";

const database = new Database();

const main = async () => {
    try {
        const pool = await database.getConnection<PoolConnection>();

        const results = await pool.query('SHOW DATABASES');
        pool.destroy();
        pool.release();

        console.log(results);
    } catch (error: any) {
        console.log(error.message);
    }
}
main();