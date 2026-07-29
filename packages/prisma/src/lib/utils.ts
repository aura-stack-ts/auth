export const stripNullishValues = <T extends Record<string, any>>(obj: T): Partial<T> => {
    return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== null && v !== undefined)) as Partial<T>
}

export const setUndefinedToNull = <T extends Record<string, any>>(obj: T): Partial<T> => {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v === undefined ? null : v])) as Partial<T>
}
