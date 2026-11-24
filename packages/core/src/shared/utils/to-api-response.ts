interface APIResponseOptions extends Record<string, unknown> {
    headers: Headers
    success: boolean
    status?: number
    silent?: Record<string, unknown>
}

export const toAPIResponse = <Return>({ success, headers, status, silent, ...content }: APIResponseOptions): Return => {
    return {
        success,
        headers,
        ...silent,
        ...content,
        toResponse: () => {
            return Response.json({ success, ...content }, { headers, status: status ?? 200 })
        },
    } as Return
}
