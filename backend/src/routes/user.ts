import { Hono } from "hono";
import { sign } from "hono/jwt";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { signinInput, signupInput } from "@gouraviscoding/medium-common";

// Create the main Hono user
const user = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
  };
}>();

user.post("/signup", async (c) => {
  try {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    const { email, password, name } = await c.req.json();

    const valid = signupInput.safeParse({ email, password, name });
    if (!valid.success) {
      c.status(411);
      return c.json({ error: "Invalid Input" });
    }

    const result = await prisma.user.create({
      data: {
        email,
        password,
        name,
      },
    });

    const jwt = await sign({ id: result.id }, c.env.JWT_SECRET);
    return c.json({ jwt });
  } catch (error) {
    c.status(403);
    return c.json({ error: "could not sign up" });
  }
});

user.post("/signin", async (c) => {
  try {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    const { email, password } = await c.req.json();
    const valid = signupInput.safeParse({ email, password });
    if (!valid.success) {
      c.status(411);
      return c.json({ error: "Invalid Input" });
    }
    const result = await prisma.user.findUnique({
      where: {
        email,
        password,
      },
    });
    if (!result) {
      c.status(403);
      return c.json({ error: "wrong email or password" });
    }
    const jwt = await sign({ id: result.id }, c.env.JWT_SECRET);
    return c.json({ jwt });
  } catch (error) {
    c.status(403);
    return c.json({ error: "could not sign up" });
  }
});

export default user;
