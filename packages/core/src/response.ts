/**
 * Custom Response class for Aura Auth.
 *
 * @experimental
 */
export class AuraResponse extends Response {
    static json<T>(body: T, init?: ResponseInit): Response {
        return Response.json(body, init)
    }
}
