import { createAuth } from "@/createAuth.ts"
import type { JWTPayload } from "@/jose.ts"
import type { OAuthProviderCredentials, User } from "@/@types/index.ts"

export const oauthCustomService: OAuthProviderCredentials = {
    id: "oauth-provider",
    name: "OAuth",
    authorize: "https://example.com/oauth/authorize",
    accessToken: "https://example.com/oauth/access_token",
    scope: "profile email",
    responseType: "code",
    userInfo: "https://example.com/oauth/userinfo",
    clientId: "oauth_client_id",
    clientSecret: "oauth_client_secret",
}

export const openIDCustomProvider = {
    id: "oidc-provider",
    name: "OIDC",
    issuer: "https://id.example.com",
    clientId: "oidc_client_id",
    clientSecret: "oidc_client_secret",
}

export const openIDMetadata = {
    issuer: "https://id.example.com",
    authorization_endpoint: "https://id.example.com/oauth/authorize",
    token_endpoint: "https://id.example.com/oauth/token",
    userinfo_endpoint: "https://id.example.com/oauth/userinfo",
    jwks_uri: "https://id.example.com/oauth/jwks",
    grant_types_supported: ["authorization_code"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
}

export const oauthCustomServiceProfile: OAuthProviderCredentials = {
    ...oauthCustomService,
    id: "oauth-profile",
    profile(profile) {
        return {
            sub: profile.id,
            name: profile.name,
            email: profile.email,
            image: profile.image,
            nickname: profile.nickname,
            email_verified: profile.email_verified,
        }
    },
}

export const sessionPayload: JWTPayload = {
    sub: "1234567890",
    email: "john@example.com",
    name: "John Doe",
    image: "https://example.com/image.jpg",
}

const auth = createAuth({
    oauth: [oauthCustomService, oauthCustomServiceProfile],
    logger: true,
    credentials: {
        authorize: async ({ credentials }) => {
            const { username } = credentials
            return {
                sub: "1234567890",
                email: `${username}@example.com`,
                name: username,
                image: "https://example.com/image.jpg",
            }
        },
    },
    signUp: {
        onCreateUser: ({ payload }) => {
            const { name, email, image } = payload
            return {
                sub: "1234567890",
                name,
                email,
                image,
            } as User
        },
    },
})

export const {
    handlers: { GET, POST, PATCH },
    jose,
    api,
} = auth

const RSA256PublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAv5eSIl71g3dyLEFYbv3B
i93M9nCBLWkbI8mOQLmGgXEj3k92rwfF/+B5gCr1OMUmV+aSLsDvdhDiljQAUpQO
3ziLaYlk0k8paw7fZjkIejz5BwiWFODTqg9HWSOGr5hfJzyL9gvzaAI2Sp7htei/
En0u79eRNQNII0dmQtwiMpIEQbisadUEp5+s0Dd7yGUoR18V7pv2A/Ohii8lMUUL
Efs71Ypf0L5rO9SAhjztxhR6wGWYe+uCNDEF0wuQ/ZL9TvI46Zpf+Z1z+0CzpXYr
Eloe8oqcCuPIJ1GszZst+qkgFdyo0BXGa1nuA/21ZLmAwUXdzmF1nsGg0J/sUcEQ
TwIDAQAB
-----END PUBLIC KEY-----`

const RSA256PrivateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC/l5IiXvWDd3Is
QVhu/cGL3cz2cIEtaRsjyY5AuYaBcSPeT3avB8X/4HmAKvU4xSZX5pIuwO92EOKW
NABSlA7fOItpiWTSTylrDt9mOQh6PPkHCJYU4NOqD0dZI4avmF8nPIv2C/NoAjZK
nuG16L8SfS7v15E1A0gjR2ZC3CIykgRBuKxp1QSnn6zQN3vIZShHXxXum/YD86GK
LyUxRQsR+zvVil/Qvms71ICGPO3GFHrAZZh764I0MQXTC5D9kv1O8jjpml/5nXP7
QLOldisSWh7yipwK48gnUazNmy36qSAV3KjQFcZrWe4D/bVkuYDBRd3OYXWewaDQ
n+xRwRBPAgMBAAECggEACh2r77IMck7cUbDexSsTZo0LlUsWzvmya9ib10s60MFs
1hnJyu91CVyy6maaQJwyn5TpgAJCdbBQWANSRwnq1RqZTDVSBCnkDNm7eukk/otG
NmEolENteZh8uTY/SZMygJHzIK0iqQm0D/GR0+oZ+JU9seUzlTuuOeQ7TOluY5wR
i/V6ldrDSOxd2xIKUnxemw0qwbUz0oZ5CKo22K+VksGwa/PempkpyZloSGsE+QR5
5cZwWxGelzUCDyflOImX+TCKI4IsuBOI+CaQohY3j3xSEunSyE4BCITgtIjlHJOB
OspOYs/rYQt9xe1ZzBlRTbq/iZAonMgRS1ELm75eWQKBgQD2dlyaZIMpuhKWBWgb
tPC0CrPLxOqWi5TSkaR+kk389xOqi6m62mPph5dCxv/TrvrXD+v/uST2aAYPnLSY
3ieVF+KN5fc64M2rgUYR9kOE0ubiir1RI7L7yhYo/bmtSnpd1Wr6vJBU6zEBayTL
X4Uw+nABrO/Si5SEssb9LGF/RwKBgQDHAZ+iiOhzOJCp9kCqHYJ5ageNVT/Fc85W
40pYSAiuPlolJV43oG0EnFI7MVkvqSExHfNtk7PgQsahPTsWThJRL4stzbBINmDW
Fxl505BOoXhnJHLqnQgzmNTinnupumnENImm5ChWbujRREi6kIiZYqUlKjQjN1j1
9TTGCto6uQKBgQCb6NA30vGuSclMIetz64iBPGv0sYL87RueAQggEYlIRzynnGYo
j9K4fk/PrHdVf9GqjqXqRUL+pVuAMM+GDLLZfByTSzCUjHVO0x5yamjX81qfYMjW
NVEaOwK9t5Pn7b9u8H0WVIaxUX7UuOSzyp9FFogYZz/m3ul68GU07whWLQKBgEhP
Mbb4MiYzpnTrUmG9qTv+p9HV6P8Q7ieqHMhpHCZb55tZsZtawmILfuGdM7/an4He
VSY6pgBVoyDRQ9f99C/lq5ewBl6my5be+9XFZsj7aOlpWAwhlOpSnP/fACYS4v10
7ZNjkbieQiBPxHFttQSu0Dzp0dn98WgledB//v2ZAoGAFdsS7VxBMCBcJIgPoYiX
GDUYZsTiISPnSRqRk1hXkRt1woAa8CK3zsCyrruoCj3VJFk6gb+TWuyBXv4kfRkv
TGcJZ3AYFKmelXl+1+rRXhe+f79+Z8kRdRSonuG/l1PdtG3P1uglzvksQcSMfOfA
41a79/alPIgWSGQhEbPxR8I=
-----END PRIVATE KEY-----`

const RSAOAEP256PublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqFSzD1nqVd91MIYMxqdG
le/v4BFyNFcdWQgFcxGcfOy+r2tpnGEgN7WmDe/59MGwGP1/al74qWJLvEkqBW/b
QCEyVX8KcL47p1N88efwR4wBiNseb+qYfdEvb00np8UVhK4QnJlUNHI5t/I9xQr7
9cieQEGb4C5SzUsetzlVsPq5r0fqOhE8j3mDoGrQO7n6Uc3xssebNNeLTBei4YPr
2FTbgI9jGYiR8fOgefSSZUAqP7MIhEzpgqBMYQ1IYhoDMR//S5ftye78X266MHCR
501DT1lkGX3Eem2C8lT8TONyCx4bORIs3401PsfzgEyl4dRvngIE6Qqmvn5zQSkF
RwIDAQAB
-----END PUBLIC KEY-----`

const RSAOAEP256PrivateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCoVLMPWepV33Uw
hgzGp0aV7+/gEXI0Vx1ZCAVzEZx87L6va2mcYSA3taYN7/n0wbAY/X9qXvipYku8
SSoFb9tAITJVfwpwvjunU3zx5/BHjAGI2x5v6ph90S9vTSenxRWErhCcmVQ0cjm3
8j3FCvv1yJ5AQZvgLlLNSx63OVWw+rmvR+o6ETyPeYOgatA7ufpRzfGyx5s014tM
F6Lhg+vYVNuAj2MZiJHx86B59JJlQCo/swiETOmCoExhDUhiGgMxH/9Ll+3J7vxf
browcJHnTUNPWWQZfcR6bYLyVPxM43ILHhs5EizfjTU+x/OATKXh1G+eAgTpCqa+
fnNBKQVHAgMBAAECggEAOX/ZPHSv5c5zdvRLV+5a36u6qjT7aGKbjUZ+qgxJgqjS
CBTuWfMZcL41b0xaex9QWnD5PaocUavYiAQL/Rh08eaFDYxcUh/BO8p6gx2Bx8bM
3WVP89XUaiHzDJdz5MyfKZfV59A+Yb3k9m8iZ3T1lUMGv5dJuh3IvgSbhOXqXg3x
SE2UqsGGx5/IEvqRcLZ9GMjp/yOPyjwUmqfuN6xPuy698EdLJgzrfX0CCNBvdjsV
WT2SA1t4pptX+IPikXglsVokv/jEHIAdpNHQDzFLlAL89AxKg9K/7XD+xGkInFVD
JRKnFcXSS5Nt/n/P1ZnBghDxFwF6DV40hbaVK7+ZTQKBgQDXAlQPMF3XvC9Bah0f
YSW5yVv3nnr9gQmIcoghUgInOdRTvfagEwkDY1vh5FsQcgQOxyOgbT3yJcQAI32O
YBWVvaTHy6l4q3PL6ERkplz9aOKCAOH1Ds8JyyiyDtOdE/cylc1Kan+4eg68Lex0
0kxNb4F5FYaFkyupR1xfh1JBfQKBgQDIbDTfTiDcAn61+d8DfS5HTLZCsaIo6g/Q
CJ36p70Cs80Js3n0nICOl6TZaIV5qco+VX6H2leQb9xR3ktTDOPUMuDnzf7X8+YO
y2TOF4phRs47i6S6mamu7rmfAh7Qr8GDiRQXbuX6gFYSFDFsPbLHCn2apOGyCsQF
VAN7mJ8dEwKBgQCuSRDijw5CxiR4HhAlU5ZFF1gZTLndrC+SD2URvWxJZ7MZfq7f
6w4vVOcyIO1AU2u+nuXeMS85jitnAV3Rf0l/7A4adpiVXEWtUEXAYKqYL+EMCLMg
9jQVeD0wuJwIhBqpQoz6eYG2hBpVp9Q4jg+T5YNKJ4y30iheO55BQWwH8QKBgBQE
ytsrIJkZHrLqfF4K2N6CSQosV/giOOYcljr9GiH095vqc1n9b9HOT8bva7WVQgAr
5fGH24svwR/kRj3LYc5GLrS4nKXRVL9RjYYQT+AbhGnqLs/8nTg93AiH27AYfgm3
XWxhxVLaEr7HiZA4MW00HQufQHPaI24s0BQ+UFZFAoGALRr4XkBKSFSZXo5/zO85
FwWzwouGrZmIlL4flHagvqx94ObCk+aKxR7H2oPdgb0FDIJu7h7XMrZo3T2jOjfp
3Rs0CexilYo91sin1Bu5/1fYuBEt/AP39t5cjyUhOooE+D+Bn1P6mvKnmZYPDdTR
B+P4zFojgfEO6TszdVGgCkU=
-----END PRIVATE KEY-----`

/**
 * Test-only RSA key pairs for unit testing PEM import functionality.
 * DO NOT use these keys in production - they are publicly visible.
 */
export const RS256PEMFormat = {
    publicKey: RSA256PublicKey,
    privateKey: RSA256PrivateKey,
}

/**
 * Test-only RSA key pairs for unit testing PEM import functionality.
 * DO NOT use these keys in production - they are publicly visible.
 */
export const RSAOAEP256PEMFormat = {
    publicKey: RSAOAEP256PublicKey,
    privateKey: RSAOAEP256PrivateKey,
}
