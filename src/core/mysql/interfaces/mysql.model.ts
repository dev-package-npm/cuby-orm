interface IModelMysql<T> {
    beginTransaction(): Promise<{ commit: () => Promise<void>; rollback: () => Promise<void>; }>
}

interface ISchemeColums {
    TABLE_CATALOG: string,
    TABLE_SCHEMA: string,
    TABLE_NAME: string,
    COLUMN_NAME: string,
    ORDINAL_POSITION: number,
    COLUMN_DEFAULT: string,
    IS_NULLABLE: 'NO' | 'YES',
    DATA_TYPE: string,
    CHARACTER_MAXIMUM_LENGTH: null,
    CHARACTER_OCTET_LENGTH: null,
    NUMERIC_PRECISION: null,
    NUMERIC_SCALE: null,
    DATETIME_PRECISION: 0,
    CHARACTER_SET_NAME: null,
    COLLATION_NAME: null,
    COLUMN_TYPE: string,
    COLUMN_KEY: 'PRI' | 'MUL',
    EXTRA: string,
    PRIVILEGES: string,
    COLUMN_COMMENT: string,
    IS_GENERATED: string,
    GENERATION_EXPRESSION: null
}
export { IModelMysql, ISchemeColums };