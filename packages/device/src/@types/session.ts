export interface User {
    sub: string
    name?: string | null
    image?: string | null
    email?: string | null
}

export interface Session<DefaultUser = User> {
    session: DefaultUser
    expires: string
}
