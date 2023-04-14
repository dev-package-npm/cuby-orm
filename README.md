# cuby-orm

Cuby-ORM is an Object Relational Mapping (ORM) library for Node.js applications. It simplifies database interaction by allowing developers to scan existing database models and create new ones. Additionally, Cuby-ORM supports migrations and seeders, making it easy to manage database changes and populate initial data.

## Quick start

Install package.

```bash
npm i cuby-orm
```


You need to create an environment variable file with the following name `.env` in the root directory. With the following content.

```plaintext
# system environments
NODE_ENV=development
# NODE_ENV=production
# DB config
HOST_DB_DEVELOPMENT=127.0.0.1
USER_DB_DEVELOPMENT=root
USER_PASSWORD_DEVELOPMENT=
DB_NAME_DEVELOPMENT=testing

HOST_DB_PRODUCTION=127.0.0.1
USER_DB_PRODUCTION=user_test
USER_PASSWORD_PRODUCTION=12345
DB_NAME_PRODUCTION=db_test
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
        db:seed Initialize a folder structure for the api, with some utilities.
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
