import { z } from "zod";

import { db } from "@/server/db";

import { type Competition } from "@prisma/client";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
export const competitionRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  /*create: publicProcedure
    .input(z.object({ name: z.string().min(1) })) 
    .mutation(async ({ ctx, input }) => {
      // simulate a slow db call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return ctx.db.competition.create({
        data: {
          title: input.name,
        },
      });
    }),
*/
  getLatest: publicProcedure
    .input(z.object({ limit: z.number() || null }))
    .query(async ({ input }: { input: { limit: number } }) => {
      const comps: Competition[] = await db.competition.findMany({
        take: input.limit,
        orderBy: {
          created_at: "desc",
        },
      });
      return comps;
    }),
  getAll: publicProcedure.query(async () => {
    const comps: Competition[] = await db.competition.findMany();
    return comps;
  }),
  getAllUpcoming: publicProcedure.query(async () => {
    const comps: Competition[] = await db.competition.findMany({
      where: {
        date: {
          gt: new Date(),
        },
      },
      orderBy: {
        date: "asc",
      },
    });
    return comps;
  }),
  getAllPrevious: publicProcedure.query(async () => {
    const comps: Competition[] = await db.competition.findMany({
      where: {
        date: {
          lt: new Date(),
        },
      },
      orderBy: {
        date: "desc",
      },
    });
    return comps;
  }),
});
