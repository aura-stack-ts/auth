import { beforeAll, afterEach, afterAll } from "vitest"
import { server } from "@test/mocks/node.ts"

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }))

afterEach(() => server.resetHandlers())

afterAll(() => server.close())
