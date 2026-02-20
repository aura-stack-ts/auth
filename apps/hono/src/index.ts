import { Hono } from 'hono'
import { toHonoHandler } from './lib/handler'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.all("/api/auth/*", toHonoHandler)

app.get("/api/protected", async (ctx) => {
  ctx.set
})

export default app
