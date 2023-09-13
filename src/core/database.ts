import mysql, { PoolConfig, PoolConnection } from 'promise-mysql';
import { PoolConfig as PoolConfigPg, Pool } from 'pg';
import path from 'node:path';

import { loadEnvFile } from '../helpers/common-function.helper';
import { searchFileConfig } from '../helpers/file-tsconfig.helper';
export { PoolConnection };

export type TConfigCuby = TConfigCubyEnv & ({
    environments?: {
        [environment: string]: TConfigCubyEnv;
    };
});

type TConfigCubyEnv = (
    {
        type: 'mysql';
        connection: PoolConfig;
    } |
    {
        type: 'postgresql';
        connection: PoolConfigPg;
    }
);

type TConfigType = 'mysql' | 'postgresql';
type TConfigPool = PoolConfig | PoolConfigPg;


export class Database {
    protected config!: TConfigPool;
    public type!: TConfigCuby['type'];

    private rootDir: string = path.resolve();

    constructor(private _config?: TConfigCuby) {
    }

    public async getConnection<T extends mysql.PoolConnection | Pool>(params?: Omit<TConfigCuby, 'environments'>): Promise<T> {
        await this.initialize();
        try {
            switch (params !== undefined ? params.type : this.type) {
                case 'mysql':
                    const pool = await mysql.createPool(params !== undefined ? params.connection as mysql.PoolConfig : this.config as mysql.PoolConfig);
                    return <T>await pool.getConnection();
                    break;
                case 'postgresql':
                    return <T>new Pool(params !== undefined ? params.connection as PoolConfigPg : this.config as PoolConfigPg);
                    break;
            }
        } catch (error: any) {
            throw new Error("Database: " + error.message);
        }
    }

    public async getConfigDatabase<T extends TConfigType>(): Promise<T extends 'mysql' ? PoolConfig : PoolConfigPg>
    public async getConfigDatabase<T extends TConfigType>(): Promise<T extends 'postgresql' ? PoolConfigPg : never>
    public async getConfigDatabase(): Promise<any> {
        return this.config;
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

    public async initialize() {
        loadEnvFile();

        const env: string = process.env.NODE_ENV as string;
        if (this._config == undefined) {
            this._config = await this.getConfigDatabaseForFile();
        }

        if (env !== undefined && this._config?.environments !== undefined && Object.hasOwn(this._config?.environments, env)) {
            this.setValue(this._config?.environments[env]);
        } else
            this.setValue(this._config);
    }

    private async getConfigDatabaseForFile(): Promise<TConfigCuby> {
        try {
            const pathConfigFile = searchFileConfig(this.rootDir, 'cuby.config');
            if (pathConfigFile !== '' && pathConfigFile !== undefined) {
                const config = await import(pathConfigFile) as { configDatabase?: TConfigCuby };
                if (config?.configDatabase != undefined)
                    return config.configDatabase;
                else throw new Error('configDatabase property not found');
            } else throw new Error('Configuration file cuby.config not found');
        } catch (error: any) {
            throw new Error(error.message);
        }
    }
}