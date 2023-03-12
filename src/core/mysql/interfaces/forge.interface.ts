import { ICollation, TCharset, TCollation, TDatabase, TEngine, TReferenceOptions, TType } from "./sql"

type TColumns<T> = {
    [B in keyof Required<T>]: TColumnsAttributes<T>
}

type TColumnsAttributes<T> = {
    type: TType,
    constraint?: number,
    isAutoincrement?: boolean,
    default?: string,
    isNotNull?: boolean,
    isPrimariKey?: boolean,
    isIndex?: boolean,
    isUnique?: boolean,
    comment?: string,
    charset?: TCharset;
    collation?: TCollation;
    foreignKey?: Omit<TForeignKey<T>, 'column'>;
}

type TGetTableColumnAttribute<T> = {
    attribute: keyof TColumnsAttributes<T>;
    value: TDatabase | object;
}

type TGetTableAttribute = {
    attribute: keyof TTableAttribute;
    value: TDatabase | object;
}

type TForeignKey<T> = {
    column: keyof T extends infer K ? K extends string ? K : never : never;
    references: {
        table: string;
        column: string;
    },
    onDelete?: TReferenceOptions;
    onUpdate?: TReferenceOptions;
}

type TTforeignKeyStructure = {
    foreignKey: string;
    reference: string;
    onDelete: string;
    onUpdate: string;
}


type TTableAttribute = {
    engine: TEngine;
    collation?: TCollation;
    comment?: string;
    default_charset?: TCharset;
    auto_icrement?: number;
};

export {
    TGetTableColumnAttribute,
    TColumnsAttributes,
    TColumns,
    TTforeignKeyStructure,
    TForeignKey,
    TTableAttribute,
    TGetTableAttribute
};