# cuby-orm

Cuby-ORM is an Object Relational Mapping (ORM) library for Node.js applications. It simplifies database interaction by allowing developers to scan existing database models and create new ones. Additionally, Cuby-ORM supports migrations and seeders, making it easy to manage database changes and populate initial data.

## Quick start

Install package.

```bash
npm i cuby-orm
```

To show help execute the following command:

```
npx cuby -h
```

It will display the following.

```plaintext
Database
    Example command
        cuby <command> --help More information
        cuby <flags> <options> More information

    COMMAND LINE FLAGS
        db:seed Run seed specified by name or list of names.
	db:seed:create Create file seed.
        db:model Create a model with the specified name.   
        db:scan:model Scan models from selected databases.   
        db:migration Create a model with the specified name. 
        db:config Command to configure some properties, to show more help use npx cuby db:config -h.

        --help, -h Print this message.
        --version, -v Print version with package.

    COMMAND OPTIONS
        --name Name files Not applied.
        --add Name module.
```

Create a configuration file for the database with the following content:

```ts
import { TConfigCuby } from "cuby-orm";

export const configDatabase: TConfigCuby = {
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
```

Name it `cuby.config.ts`
