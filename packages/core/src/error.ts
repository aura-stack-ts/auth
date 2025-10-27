export class AuraStackError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "AuraStackError"
    }
}
