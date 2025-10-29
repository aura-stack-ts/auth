export class AuraResponse extends Response {
    static json<T>(body: T, init?: ResponseInit): Response {
        return Response.json(body, init)
    }
}
