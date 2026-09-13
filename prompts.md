# PROMPTS.md - [Product name]
**Student:** [Your name] · **Course:** MGMT 6110 · **Problem Set 1**
**User sentence:** A [user] opens this screen to [job], and knows it worked when [what they see].
**Live link:** [your Vercel production URL, the short one, tested in a private window]

---

## Prompt 1 - the master prompt
```
ROLE: ...
GOAL: ...
OUTPUT: ...
GUARDRAILS: ...
CONTEXT: ...
```
**What came back:** A running app, 7 files, preview loaded. It also added a
settings page I never asked for.
**What I changed next and why:** Added "no settings page" to the Guardrails, because
a missing guardrail is why it appeared.

---

## Prompt 2 - fix the empty state
```
When the list has no rows, show "Nothing due today" instead of an empty table.
Change nothing else.
```
**What came back:** Correct, one file touched.
**What I changed next and why:** Nothing. Moved to the next item on the Goal list.

---

## Prompt 3 - [and so on, one entry per prompt, in order]
