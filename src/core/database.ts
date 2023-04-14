import mysql, { PoolConnection } from 'promise-mysql';
import { PoolConfig, Pool } from 'pg';
import { TConfigCuby } from '../config/interfaces/load-database.interface';
import { loadEnvFile } from '../helpers/common-function.helper';
export { PoolConnection };

export class Database {
    protected config!: mysql.PoolConfig | PoolConfig;
    public type!: TConfigCuby['type'];

    constructor(config: TConfigCuby) {
        loadEnvFile();

        try {
            const env: string = process.env.NODE_ENV as string;
            if (env !== undefined && config?.environments !== undefined && Object.hasOwn(config?.environments, env)) {
                console.log("entra");
                const { type, connection } = config?.environments[env];

                this.setValue({ type, connection });
            } else
                this.setValue({ type: config.type, connection: config.connection });
        } catch (error: any) {
            throw new Error("Database: " + error.message);
        }
    }

    public async getConnection<T extends mysql.PoolConnection | Pool>(params?: Omit<TConfigCuby, 'environments'>): Promise<T> {
        try {
            if (params !== undefined) {
                switch (params.type) {
                    case 'mysql':
                        const pool = await mysql.createPool(params.connection as mysql.PoolConfig);
                        return <T>await pool.getConnection();
                        break;
                    case 'postgresql':
                        return <T>new Pool(params.connection as PoolConfig);
                        break;
                }
            } else {
                switch (this.type) {
                    case 'mysql':
                        const pool = await mysql.createPool(this.config as mysql.PoolConfig);
                        return <Exclude<T, Pool>>await pool.getConnection();
                        break;
                    case 'postgresql':
                        return <T>new Pool(this.config as PoolConfig);
                        break;
                }
            }
        } catch (error: any) {
            throw new Error("Database: " + error.message);
        }
    }

    private setValue(params: Omit<TConfigCuby, 'environments'>) {
        const { type, connection } = params;
        switch (type) {
            case 'mysql':
                this.type = 'mysql';
                this.config = connection;
                break;
            case 'postgresql':
                this.type = 'postgresql';
                this.config = connection;
                break;
        }
    }
}