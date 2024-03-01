import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import {
  createPostInput,
  updatePostInput,
} from "@gouraviscoding/medium-common";

// Create the main Hono user
const blog = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
  };
}>();

blog.get("/bulk", async (c) => {
  try {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    const posts = await prisma.post.findMany({});

    return c.json(posts);
  } catch (error) {
    console.log(error);
    c.status(400);
    return c.json({ error: "could not update blog" });
  }
});

blog.get("/:id", async (c) => {
  try {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    const id = c.req.param("id");

    const result = await prisma.post.findUnique({
      where: {
        id,
      },
    });
    if (!result) return c.json({ error: "could not find blog" });

    return c.json({ result });
  } catch (error) {
    console.log(error);
    c.status(400);
    return c.json({ error: "could not update blog" });
  }
});

blog.post("", async (c) => {
  try {
    const userId = c.get("userId");
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    const { title, content } = await c.req.json();
    const valid = createPostInput.safeParse({ title, content });
    if (!valid.success) {
      c.status(411);
      return c.json({ error: "Invalid Input" });
    }
    const result = await prisma.post.create({
      data: {
        title,
        content,
        authorId: userId,
      },
    });
    return c.json({ id: result.id });
  } catch (error) {
    c.status(403);
    return c.json({ error: "could not create blog" });
  }
});

blog.put("/:id", async (c) => {
  try {
    const userId = c.get("userId");
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    const id = c.req.param("id");
    console.log(id);
    const { title, content } = await c.req.json();
    const valid = updatePostInput.safeParse({ title, content });
    if (!valid.success) {
      c.status(411);
      return c.json({ error: "Invalid Input" });
    }
    const result = await prisma.post.update({
      where: {
        id,
        authorId: userId,
      },
      data: {
        title,
        content,
      },
    });
    return c.json({ message: "blog updated successfully" });
  } catch (error) {
    console.log(error);
    c.status(400);
    return c.json({ error: "could not update blog" });
  }
});

export default blog;
