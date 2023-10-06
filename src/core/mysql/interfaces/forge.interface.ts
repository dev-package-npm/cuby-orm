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
    foreignKey?: Omit<TForeignKey<T>, 'column'>;
} & TCollationCharset;

//#region  Tcollation charset
export type TCollationCharset = (
    {
        charset?: 'UTF8';
        collation?: TCollation<'UTF8'>
    } |
    {
        charset?: 'UTF8MB4';
        collation?: TCollation<'UTF8MB4'>
    } |
    {
        charset?: 'BIG5';
        collation?: TCollation<'BIG5'>
    } |
    {
        charset?: 'DEC8';
        collation?: TCollation<'DEC8'>
    } |
    {
        charset?: 'CP850';
        collation?: TCollation<'CP850'>
    } |
    {
        charset?: 'HP8';
        collation?: TCollation<'HP8'>
    } |
    {
        charset?: 'KOI8R';
        collation?: TCollation<'KOI8R'>
    } |
    {
        charset?: 'LATIN1';
        collation?: TCollation<'LATIN1'>
    } |
    {
        charset?: 'LATIN2';
        collation?: TCollation<'LATIN2'>
    } |
    {
        charset?: 'SWE7';
        collation?: TCollation<'SWE7'>
    } |
    {
        charset?: 'ASCII';
        collation?: TCollation<'ASCII'>
    } |
    {
        charset?: 'UJIS';
        collation?: TCollation<'UJIS'>
    } |
    {
        charset?: 'SJEUCKRIS';
        collation?: TCollation<'SJIS'>
    } |
    {
        charset?: 'HEBREW';
        collation?: TCollation<'HEBREW'>
    } |
    {
        charset?: 'TIS620';
        collation?: TCollation<'TIS620'>
    } |
    {
        charset?: 'EUCKR';
        collation?: TCollation<'EUCKR'>
    } |
    {
        charset?: 'KOI8U';
        collation?: TCollation<'KOI8U'>
    } |
    {
        charset?: 'GB2312';
        collation?: TCollation<'GB2312'>
    } |
    {
        charset?: 'GREEK';
        collation?: TCollation<'GREEK'>
    } |
    {
        charset?: 'CP1250';
        collation?: TCollation<'CP1250'>
    } |
    {
        charset?: 'GBK';
        collation?: TCollation<'GBK'>
    } |
    {
        charset?: 'LATIN5';
        collation?: TCollation<'LATIN5'>
    } |
    {
        charset?: 'ARMSCII8';
        collation?: TCollation<'ARMSCII8'>
    } |
    {
        charset?: 'UCS2';
        collation?: TCollation<'UCS2'>
    } |
    {
        charset?: 'CP866';
        collation?: TCollation<'CP866'>
    } |
    {
        charset?: 'KEYBCS2';
        collation?: TCollation<'KEYBCS2'>
    } |
    {
        charset?: 'MACCE';
        collation?: TCollation<'MACCE'>
    } |
    {
        charset?: 'MACROMAN';
        collation?: TCollation<'MACROMAN'>
    } |
    {
        charset?: 'CP852';
        collation?: TCollation<'CP852'>
    } |
    {
        charset?: 'LATIN7';
        collation?: TCollation<'LATIN7'>
    } |
    {
        charset?: 'CP1251';
        collation?: TCollation<'CP1251'>
    } |
    {
        charset?: 'UTF16';
        collation?: TCollation<'UTF16'>
    } |
    {
        charset?: 'CP1256';
        collation?: TCollation<'CP1256'>
    } |
    {
        charset?: 'CP1257';
        collation?: TCollation<'CP1257'>
    } |
    {
        charset?: 'UTF32';
        collation?: TCollation<'UTF32'>
    } |
    {
        charset?: 'BINARY';
        collation?: TCollation<'BINARY'>
    } |
    {
        charset?: 'GEOSTD8';
        collation?: TCollation<'GEOSTD8'>
    } |
    {
        charset?: 'CP932';
        collation?: TCollation<'CP932'>
    } |
    {
        charset?: 'EUCJPMS';
        collation?: TCollation<'EUCJPMS'>
    }
);
//#endregion

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
    comment?: string;
    auto_icrement?: number;
} & TCollationCharset;

export {
    TGetTableColumnAttribute,
    TColumnsAttributes,
    TColumns,
    TTforeignKeyStructure,
    TForeignKey,
    TTableAttribute,
    TGetTableAttribute
};