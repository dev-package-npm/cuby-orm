import { PoolConnection } from "promise-mysql";
import { Pool } from 'pg';
import { Database } from "../../database";
import { BaseModel, } from "../models/base-model";
import { MySQLUtils } from "../mysql-utils";
import { QueryBuilder, TSubQuery } from "../query-builder";
import { TCondition, TDirection } from "./sql";

//#region Interface

export interface IConstructorModel<T> {
    table: string;
    primaryKey: keyof T | string;
    fields: TArrayColumns<T>
}

type TQuerySelectParams<T, K extends keyof T, L extends K, R extends K, S extends string, A extends string> = {
    where?: Partial<T>;
    alias?: { [B in R]?: S };
    orderBy?: { column: keyof T; direction: TDirection };
    subQuery?: TSubQuery<A> | TSubQuery<A>[];
} & (
        {
            columns?: TColumn<K>;
            excludeColumns?: never;
        } | {
            columns?: never;
            excludeColumns?: L[];
        }
    );
type TQuerySelect<T, K extends keyof T = keyof T, L extends keyof T = keyof T, R extends keyof T = keyof T, S extends string = string, A extends string = string> = {
    where?: Partial<T>;
    alias?: { [B in R]?: S };
    orderBy?: { column: keyof T; direction: TDirection };
    subQuery?: TSubQuery<A> | TSubQuery<A>[];
} & TConditionColumns<L, K>;

// type TQuerySelect<T, K, L, R extends keyof T, S, A extends string> = {
//     where?: Partial<T>;
//     alias?: { [B in R]?: S };
//     orderBy?: { column: keyof T; direction: 'ASC' | 'DESC' };
//     subQuery?: TSubQuery<A> | TSubQuery<A>[];
// } & TConditionColumns<L, K>;

// type TQuerySelect<T, K, L, R, S> = {
//     where?: Partial<T>;
//     alias?: TAlias2<R, S> | TAlias2<R, S>[];
// } & TConditionColumns<L, K>;

export type TQueryFind<T, K, L> = {
    alias?: TAlias<T> | TAlias<T>[];
} & TConditionColumns<L, K>;

type TConditionColumns<L, K> = (
    {
        columns?: TColumn<K>;
        excludeColumns?: never
    } | {
        columns?: never;
        excludeColumns?: L[]
    }
);

type TColumn<K> = K[] | '*'

export type TAlias<T> = { column: keyof T extends string ? keyof T : never, name: string };
export type TAlias2<T, S> = { column: T extends string ? T : never, name: S };

// extends infer K ? K extends string ? K : never : never
//#endregion


export type TAlias3<T, R extends keyof T, S extends string> = { [B in R]: S };
export type TArrayColumns<T> = Array<Required<keyof T>>;


interface IModelMysql<T> {
    transaction?: { commit(): Promise<void>; rollback(): Promise<void>; };

    beginTransaction(): Promise<{ commit(): Promise<void>; rollback(): Promise<void>; } | undefined>;
    create<C extends keyof T>(data: { columns: C[]; values: Required<Pick<T, C>> }): Promise<IMethodReturn<T>>;
    create<C extends keyof T>(data: { columns: C[]; values: Required<Pick<T, C>> }): Promise<IMethodReturn<T>>;
    create<C extends keyof T>(data: { columns: C[]; values: Required<Pick<T, C>>[] }): Promise<IReturn>;
    findId<C extends keyof T, A extends C, S extends string>(params: { columns: C[], alias: TAlias3<T, A, S>, id: number }): Promise<Pick<T, Exclude<C, A>> & Partial<Record<S, T[A]>>>;
    findId<C extends keyof T, A extends Exclude<keyof T, C>, S extends string>(params: { excludeColumns: C[], alias: TAlias3<T, A, S>, id: number }): Promise<Pick<T, Exclude<keyof T, C | A>> & Record<S, T[A]>>;
    findId<C extends keyof T, S extends string>(params: { alias: TAlias3<T, C, S>, id: number }): Promise<Pick<T, Exclude<keyof T, C>> & Record<S, T[C]>>;
    findId<C extends keyof T>(params: { columns: C[], id: number }): Promise<Pick<T, C>>;
    findId<C extends keyof T>(params: { excludeColumns: C[], id: number }): Promise<Pick<T, Exclude<keyof T, C>>>;
    findId(params: Number): Promise<T>;
    findAll<C extends keyof T, A extends C, S extends string>(params: { columns: C[], alias: TAlias3<T, A, S> }): Promise<(Pick<T, Exclude<C, A>> & Partial<Record<S, T[A]>>)[]>;
    findAll<C extends keyof T, S extends string>(params: { alias: TAlias3<T, C, S> }): Promise<(Pick<T, Exclude<keyof T, C>> & Record<S, T[C]>)[]>;
    findAll<C extends keyof T, A extends Exclude<keyof T, C>, S extends string>(params: { excludeColumns: C[], alias: TAlias3<T, A, S> }): Promise<(Pick<T, Exclude<keyof T, C | A>> & Record<S, T[A]>)[]>;
    findAll<C extends keyof T>(params: { columns: C[] }): Promise<Pick<T, C>[]>;
    findAll<C extends keyof T>(params: { excludeColumns: C[] }): Promise<Pick<T, Exclude<keyof T, C>>[]>;
    findAll(params?: never): Promise<T[]>;
    delete(where: number): Promise<IReturn>;
    delete(where: { condition: Partial<T>, operator?: TCondition }): Promise<IReturn>;
    delete(where: any): Promise<IReturn>;
}


interface IMethodReturn<T> extends IReturn {
    getValues(): Promise<T>;
}

/**
 * En: Used to return when a record is inserted, updated or deleted
 */
interface IReturn {
    fieldCount?: number,
    affectedRows?: number,
    insertId?: number,
    serverStatus?: number,
    warningCount?: number,
    message?: string,
    protocol41?: true,
    changedRows?: number
}
export {
    IModelMysql,
    IMethodReturn,
    IReturn
};