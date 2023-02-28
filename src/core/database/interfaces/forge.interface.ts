import { TDatabase, TReferenceOptions, TType } from "./sql"

interface IFields {
    [T: string]: TSqlAttribute
}

type TSqlAttribute = {
    type: TType,
    constraint?: number,
    isAutoincrement?: boolean,
    default?: string,
    isNotNull?: boolean,
    isPrimariKey?: boolean,
    isIndex?: boolean,
    isUnique?: boolean,
    comments?: string,
    charset?: string;
    foreignKey?: Omit<TForeignKey, 'column'>;
}

type TTableAttribute = {
    attribute: keyof TSqlAttribute;
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

type TTforeign = {
    foreignKey: string;
    reference: string;
    onDelete: string;
    onUpdate: string;
}

export { TTableAttribute, TSqlAttribute, IFields, TTforeign, TForeignKey };