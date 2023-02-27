import { TType } from "./sql"

export interface IFields {
    [T: string]: {
        type: TType,
        unsigned?: boolean,
        constraint?: number,
        isAutoincrement?: boolean,
        default?: string,
        isNotNull?: boolean,
        isPrimariKey?: boolean,
        isIndex?: boolean,
        isUnique?: boolean,
        comments?: string,
        charset?: string;
    }
}