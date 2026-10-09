# CLAUDE.md: Token-Saving Rules

Keep token usage low. Be efficient in what you read, what you write, and what you say.

## Project
Fact or Fake: a static HTML/CSS/vanilla JS party game hosted on GitHub Pages. The full design is in `MDD.md`. No frameworks, no build step, no external libraries, relative paths only.

## Reading files
- Do **not** read `MDD.md` in full more than once per session. After that, read only the section you need (use Grep for the heading, then read that range).
- Never read `data/statements.js` unless the task is about card content. It is large. Use Grep to find a specific card ID instead.
- Read only the files the task touches. Do not scan the whole repo "to get oriented".
- Use Grep or Glob to locate things before opening a file. Read line ranges, not whole files, when a file is over about 150 lines.
- Do not re-read a file you just edited or wrote.

## Writing code
- Make small, targeted edits with Edit. Do not rewrite a whole file to change a few lines.
- Do not regenerate or paste back the 250 statements. If card data needs a change, edit that single entry.
- Build in the phases listed in `MDD.md` section 8, one phase at a time. Do not start the next phase until asked.
- Do not add features, refactors, comments, or files that were not requested.
- Reuse existing functions and CSS classes before writing new ones.
- No dependencies. Do not install packages.

## Responses
- Be brief. After finishing a task, give 1 to 3 sentences: what changed and which files.
- Do not repeat code back in chat after writing it to a file.
- Do not restate my request, summarize your plan at length, or explain what is obvious from the diff.
- No preamble, no recap, no "next steps" list unless I ask.
- If something is ambiguous and the answer would change the work substantially, ask one short question. Otherwise pick the simplest reasonable option and mention it in one line.

## Commands and testing
- Do not run the same command twice. Keep command output short (pipe through `head`, `tail`, or `wc -l` when output could be long).
- Do not launch servers, browsers, or screenshot loops unless I ask. For verification, prefer a quick Node script or a Grep check over visual testing.
- For the statements file, a one-line count check is enough (125 true, 125 false, unique IDs).

## Git
- Commit once per finished phase with a short message. Do not push unless I ask.

## Context hygiene
- Stay on one task per session. Suggest `/clear` when switching to an unrelated task.
- Suggest `/compact` if the conversation gets long, before it becomes expensive.
- Do not spawn subagents unless I ask for one.
