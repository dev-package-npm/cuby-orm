import { TType } from "./sql"

export interface IFields {
    [T: string]: {
        type: TType,
        unsigned?: boolean,
        constraint?: number
    }
}