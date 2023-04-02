interface MyInterface {
    name: string;
    age: number;
    gender: string;
}

type TTest<K> = {
    values: K[] | '*';
}

function myFunction<K extends keyof MyInterface>(params: MyInterface, data: TTest<K>): Pick<MyInterface, K> {
    const result: Partial<MyInterface> = {};
    if (data.values === '*') {
        data.values = <K[]>Object.keys(params);
    }
    data.values.forEach(key => {
        result[key] = params[key];
    });
    return result as Pick<MyInterface, K>;
}

const person: MyInterface = { name: 'jairo', age: 20, gender: 'male' };
console.log(myFunction(person, { values: ['name'] }).name); // 'jairo'
console.log(myFunction(person, { values: ['age', 'gender'] })); // { age: 20, gender: 'male' }
console.log(myFunction(person, { values: '*' })); // { name: 'jairo', age: 20, gender: 'male' }

type TCollationUtf8 = 'UTF8_GENERAL_CI' | 'UTF8_BIN';
type TCollationUtf8mb4 = 'UTF8MB4_GENERAL_CI' | 'UTF8MB4_BIN' | 'UTF8MB4_UNICODE_CI';

type TCollationByCharset<C extends 'UTF8' | 'UTF8MB4' | undefined> = C extends 'UTF8'
    ? TCollationUtf8
    : C extends 'UTF8MB4'
    ? TCollationUtf8mb4
    : never;

type TColumnsAttributes = {
    type: 'VARCHAR' | 'INT',
    constraint?: number,
    isAutoincrement?: boolean,
    default?: string,
    isNotNull?: boolean,
    isPrimariKey?: boolean,
    isIndex?: boolean,
    isUnique?: boolean,
    comment?: string,
    charset?: 'UTF8' | 'UTF8MB4';
    collation?: TCollationByCharset<TColumnsAttributes['charset']>;
    foreignKey?: string;
};

// ejemplo de uso
const column: TColumnsAttributes = {
    type: 'VARCHAR',
    charset: 'UTF8MB4',
    collation: 'UTF8MB4_BIN'
};