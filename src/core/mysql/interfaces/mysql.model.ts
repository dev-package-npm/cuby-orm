interface IModelMysql<T> {
    beginTransaction(): Promise<{ commit: () => Promise<void>; rollback: () => Promise<void>; }>
}

export { IModelMysql };