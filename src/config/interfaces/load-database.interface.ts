import { PoolConfig } from "promise-mysql";
import { PoolConfig as PoolConfigPG } from 'pg';

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
        connection: PoolConfigPG;
    }
);

