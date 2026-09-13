# 13 — Git & GitHub Workflow

## Repository

- Local: `/home/heisenberg/Projects/solcontacts/mobildapp`
- Default branch: `main`
- Remote: **`git@github.com:heisenbergsolana/SolContacts.git`** (SSH, currently **private**)

Note the remote is named `SolContacts` while the package slug stays `solcontacts` — GitHub
paths are case-insensitive, so both resolve. Keep the slug lowercase everywhere in code.

## Commit discipline

**One logical step, one commit.** A commit should be reviewable in a couple of minutes and
should leave the project in a working state — lint, typecheck and tests green.

Never commit:

- a broken build "to save progress" (use a scratch branch if you must)
- generated output (`android/`, `ios/`, `node_modules/`, `*.apk`)
- keystores, `.env`, or anything with a credential
- unrelated changes bundled together

## Conventional Commits

```
<type>(<scope>): <subject>

<optional body: why, not what>
```

**Types:**

| Type       | Use                                   |
| ---------- | ------------------------------------- |
| `feat`     | new user-visible capability           |
| `fix`      | bug fix                               |
| `refactor` | restructuring with no behavior change |
| `test`     | adding or fixing tests                |
| `docs`     | documentation only                    |
| `chore`    | tooling, dependencies, config         |
| `style`    | formatting only                       |
| `perf`     | performance                           |
| `build`    | build system, release artifacts       |

**Scopes:** `contacts`, `storage`, `solana`, `qr`, `ui`, `nav`, `theme`, `config`, `store`, `deps`

**Examples:**

```
feat(contacts): add contact creation with local persistence
feat(solana): validate addresses with isAddress before save
fix(storage): preserve contacts when the stored document is corrupt
test(solana): cover formatSol precision above MAX_SAFE_INTEGER
docs(stack): record why AsyncStorage was chosen over MMKV
chore(deps): add expo-camera for QR scanning
```

Subject line: imperative mood, lowercase, no trailing period, ≤ 72 characters.
Body: explain **why**, and any consequence a reviewer would not guess.

## Branching

For a solo project, keep it simple:

- `main` — always working
- `feat/<short-name>` — anything non-trivial or experimental
- Merge with `--no-ff` so the phase's work stays visible as a group

```bash
git switch -c feat/qr-scanner
# ... work, commit in small steps ...
git switch main
git merge --no-ff feat/qr-scanner
git branch -d feat/qr-scanner
```

Small, obviously-safe changes can go straight to `main`.

## Tags and releases

Tag at the end of every phase (see [09-ROADMAP.md](09-ROADMAP.md)):

```bash
git tag -a v0.2.0 -m "Phase 2: contact CRUD with local storage"
git push origin v0.2.0
```

| Tag      | Meaning                         |
| -------- | ------------------------------- |
| `v0.0.1` | Phase 1 — project skeleton runs |
| `v0.2.0` | Phase 2 — contact MVP           |
| `v0.3.0` | Phase 3 — Solana functionality  |
| `v0.4.0` | Phase 4 — QR                    |
| `v0.5.0` | Phase 5 — polish                |
| `v0.6.0` | Phase 6 — wallet integration    |
| `v1.0.0` | Phase 7 — dApp Store submission |

`versionName` in `app.json` must match the tag. `versionCode` increments on every store build
and never goes backwards.

## The remote

Already configured, over SSH with the existing `~/.ssh/id_ed25519` key:

```bash
git remote -v
# origin  git@github.com:heisenbergsolana/SolContacts.git (fetch/push)
```

HTTPS is **not** set up (no credential helper), and it does not need to be — SSH authenticates
as `heisenbergsolana` and needs no token stored on disk. If a command ever asks for a GitHub
username, it is being pointed at the HTTPS URL by mistake; check `git remote -v`.

Everyday push:

```bash
git push
git push origin --tags   # tags are not pushed by `git push` alone
```

### Making the repository public

It is private today. Before flipping it (see `docs/12-SOCIAL-LAUNCH.md`), confirm:

- [ ] No secret has ever been committed — check the whole history, not just the working tree
- [ ] `README.md` is accurate and has screenshots
- [ ] The repository description and topics are set
- [ ] `LICENSE` and `LICENSE-TEMPLATE-APACHE-2.0` are both present

On github.com: _Settings → General → Danger Zone → Change visibility_. With the `gh` CLI
installed it would be:

```bash
gh repo edit --visibility public --accept-visibility-change-consequences
```

## Before every push

```bash
npm run lint && npm run typecheck && npm test
git status          # nothing unexpected staged
git diff --cached   # read what you are actually committing
```

Specifically confirm no `.keystore`, `.env`, or `android/` artifacts are staged.

## Recovering from mistakes

```bash
git commit --amend            # fix the most recent commit message or contents (before pushing)
git restore --staged <file>   # unstage
git restore <file>            # discard local changes to a file
git reset --soft HEAD~1       # undo the last commit, keep the changes staged
git revert <sha>              # undo a pushed commit safely
```

Never rewrite history that has already been pushed to a shared remote.

## If a secret is ever committed

1. **Rotate the secret immediately** — assume it is public the moment it is pushed.
2. Remove it from history (`git filter-repo`, or delete and recreate the repo if it is early).
3. Force-push, and verify the old blobs are gone.
4. Add whatever pattern let it through to `.gitignore`.

For a signing keystore, rotation is not possible — the key _is_ the app's identity on the
dApp Store. That is why keystores never go near the repository in the first place.
