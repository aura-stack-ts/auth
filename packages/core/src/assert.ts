export const isFalsy = (value: unknown): boolean => {
    return value === false || value === 0 || value === "" || value === null || value === undefined || Number.isNaN(value)
}
