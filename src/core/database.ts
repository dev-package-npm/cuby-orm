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
    private configPool!: TConfigPool;
    public type!: TConfigCuby['type'];
    public databaseName!: string;

    private rootDir: string = path.resolve();

    constructor(private _config?: TConfigCuby) {
    }

    public async getConnection<T extends mysql.PoolConnection | Pool>(params?: Omit<TConfigCuby, 'environments'>): Promise<T> {
        try {
            await this.initialize();
            switch (params !== undefined ? params.type : this.type) {
                case 'mysql':
                    const pool = await mysql.createPool(params !== undefined ? params.connection as mysql.PoolConfig : this.configPool as mysql.PoolConfig);
                    return <T>await pool.getConnection();
                    break;
                case 'postgresql':
                    return <T>new Pool(params !== undefined ? params.connection as PoolConfigPg : this.configPool as PoolConfigPg);
                    break;
            }
        } catch (error: any) {
            throw new Error("Database: " + error.message);
        }
    }

    public async getConfigDatabase<T extends TConfigType>(): Promise<T extends 'mysql' ? PoolConfig : PoolConfigPg>
    public async getConfigDatabase<T extends TConfigType>(): Promise<T extends 'postgresql' ? PoolConfigPg : never>
    public async getConfigDatabase(): Promise<any> {
        return this.configPool;
    }

    private setValue(params: Omit<TConfigCuby, 'environments'>) {
        const { type, connection } = params;
        switch (type) {
            case 'mysql':
                this.type = 'mysql';
                this.databaseName = connection.database || '';
                this.configPool = connection;
                break;
            case 'postgresql':
                this.type = 'postgresql';
                this.databaseName = connection.database || '';
                this.configPool = connection;
                break;
        }
    }

    public async initialize(): Promise<Database> {
        try {
            loadEnvFile();

            const env: string = process.env.NODE_ENV as string;
            if (this._config == undefined) {
                this._config = await this.getConfigDatabaseForFile();
            }
            // Configurar entorno
            if (this._config != undefined) {
                if (env !== undefined && this._config?.environments !== undefined && Object.hasOwn(this._config?.environments, env)) {
                    this.setValue(this._config?.environments[env]);
                } else
                    this.setValue(this._config);
            }
            return this;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    private async getConfigDatabaseForFile(): Promise<TConfigCuby | undefined> {
        try {
            const pathConfigFile = searchFileConfig(this.rootDir, 'cuby.config');
            if (pathConfigFile !== '' && pathConfigFile !== undefined) {
                const config = await import(pathConfigFile);
                if (Object.entries(config).length != 0 && config?.[Object.keys(config)[0]] != undefined)
                    return config?.[Object.keys(config)[0]] as TConfigCuby;
                else throw new Error('No configuration found, make sure to export the configuration');
            }
            // NOTE pone problema cuando no hay un archivo de configuración, buscar otra opción de disparar este error
            else throw new Error('No database configuration file found');
        } catch (error: any) {
            throw new Error(error.message);
        }
    }
}