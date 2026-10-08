import { beforeEach, vi } from "vitest"

beforeEach(() => {
    vi.stubEnv("BASE_URL", undefined)
})
