import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useCatch, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";

import { deleteNote, getNote, summarizeNote } from "~/models/note.server";
import { requireUserId } from "~/session.server";

type ActionData = {
  summary: string;
  error?: string;
};

export async function loader({ request, params }: LoaderArgs) {
  const userId = await requireUserId(request);
  invariant(params.noteId, "noteId not found");

  const note = await getNote({ userId, id: params.noteId });
  if (!note) {
    throw new Response("Not Found", { status: 404 });
  }
  return json({ note });
}

export async function action({ request, params }: ActionArgs) {
  const userId = await requireUserId(request);
  invariant(params.noteId, "noteId not found");
  const body = await request.formData();
  const action = body.get("_action");
  invariant(action, "_action not found");

  if (action === "delete") {
    await deleteNote({ userId, id: params.noteId });
    return redirect("/notes");
  } else if (action === "summarize") {
    const summary = await summarizeNote({ userId, id: params.noteId });
    if (summary) {
      return json<ActionData>({ summary });
    } else {
      return json<ActionData>({
        summary: "",
        error: "Error summarizing note",
      });
    }
  }
}

export default function NoteDetailsPage() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();

  return (
    <div>
      {actionData?.summary ? (
        <>
          <h1 className="mb-2 text-xl">Summary</h1>
          <p className="mb-10 text-lg">{actionData.summary}</p>
        </>
      ) : null}
      <h3 className="text-2xl font-bold">{data.note.title}</h3>
      <p className="py-6">{data.note.body}</p>
      <hr className="my-4" />
      <Form method="post">
        <input type="hidden" name="_action" value="delete" />
        <button
          type="submit"
          className="rounded bg-red-500  py-2 px-4 text-white hover:bg-red-600 focus:bg-blue-400"
        >
          Delete
        </button>
        <Form method="post">
          <input type="hidden" name="_action" value="summarize" />
          <button
            type="submit"
            className="rounded bg-blue-500  py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
          >
            Summarize
          </button>
        </Form>
      </Form>
    </div>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  return <div>An unexpected error occurred: {error.message}</div>;
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 404) {
    return <div>Note not found</div>;
  }

  throw new Error(`Unexpected caught response with status: ${caught.status}`);
}
