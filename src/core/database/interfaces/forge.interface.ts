import { ICollation, TCharset, TCollation, TDatabase, TEngine, TReferenceOptions, TType } from "./sql"

type TColumns = {
    [T: string]: TColumnsAttributes
}

type TColumnsAttributes = {
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
    foreignKey?: Omit<TForeignKey, 'column'>;
}

type TGetTableColumnAttribute = {
    attribute: keyof TColumnsAttributes;
    value: TDatabase | object;
}

type TGetTableAttribute = {
    attribute: keyof TTableAttribute;
    value: TDatabase | object;
}

type TForeignKey = {
    column: string;
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