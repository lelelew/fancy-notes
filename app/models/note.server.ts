import type { User, Note } from "@prisma/client";

import { prisma } from "~/db.server";
import { OpenAI } from "~/openai.server";

export type { Note } from "@prisma/client";

export function getNote({
  id,
  userId,
}: Pick<Note, "id"> & {
  userId: User["id"];
}) {
  return prisma.note.findFirst({
    select: { id: true, body: true, title: true },
    where: { id, userId },
  });
}

export async function summarizeNote({
  id,
  userId,
}: Pick<Note, "id"> & {
  userId: User["id"];
}) {
  const note = await prisma.note.findFirst({
    select: { id: true, body: true, title: true },
    where: { id, userId },
  });
  if (note) {
    const completion = await OpenAI.createCompletion({
      model: "text-davinci-003",
      prompt: `Create a summary of the following note: ${note.body.substring(
        0,
        3000
      )}
    
Summary:`,
      max_tokens: 256,
    });
    return completion.data.choices[0].text;
  }
  return "Summarization failed";
}

export function getNoteListItems({ userId }: { userId: User["id"] }) {
  return prisma.note.findMany({
    where: { userId },
    select: { id: true, title: true },
    orderBy: { updatedAt: "desc" },
  });
}

export function createNote({
  body,
  title,
  userId,
}: Pick<Note, "body" | "title"> & {
  userId: User["id"];
}) {
  return prisma.note.create({
    data: {
      title,
      body,
      user: {
        connect: {
          id: userId,
        },
      },
    },
  });
}

export function deleteNote({
  id,
  userId,
}: Pick<Note, "id"> & { userId: User["id"] }) {
  return prisma.note.deleteMany({
    where: { id, userId },
  });
}
