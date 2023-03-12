import mysql, { PoolConnection } from 'promise-mysql';
import path from 'node:path';
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
export { PoolConnection };

export class Database {
    protected config: mysql.PoolConfig;
    constructor(config?: mysql.PoolConfig) {
        const envConfig = dotenv.config({ path: path.resolve() + '/.env' });
        dotenvExpand.expand(envConfig);
        if (config != undefined) {
            this.config = config;
        } else {
            this.config = {
                connectionLimit: 113,
                host: process.env[`HOST_DB_${String(process.env.NODE_ENV).toUpperCase()}`],
                user: process.env[`USER_DB_${String(process.env.NODE_ENV).toUpperCase()}`],
                password: process.env[`USER_PASSWORD_${String(process.env.NODE_ENV).toUpperCase()}`],
                database: process.env[`DB_NAME_${String(process.env.NODE_ENV).toUpperCase()}`],
                multipleStatements: true
            };
        }
    }

    public async getConnection(config: mysql.PoolConfig = this.config): Promise<PoolConnection> {
        try {
            const pool = await mysql.createPool(config);
            return await pool.getConnection();
        } catch (error: any) {
            throw new Error("Database: " + error.message);
        }
    }
}