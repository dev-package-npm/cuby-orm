import { TConfigCuby } from "../core/database";

export const configDatabase: TConfigCuby = {
    type: 'mysql',
    connection: {
        connectionLimit: 103,
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'testing',
        charset: 'utf8mb4'
    },
    environments: {
        production: {
            type: 'postgresql',
            connection: {
                host: 'localhost',
                user: 'postgres',
                password: 'Nunca_1999',
                database: 'testing'
            }
        },
        testing: {
            type: 'mysql',
            connection: {
                connectionLimit: 103,
                host: 'localhost',
                user: 'root',
                password: '',
                database: 'testing',
                charset: 'utf8mb4'
            }
        }
    }
}