# Publishing to npm

How to release `@morphatar/core` and `@morphatar/react` to the npm registry.

`apps/web` (the playground) and the monorepo root are `private` and are never
published.

| Package | Published from | Depends on |
| --- | --- | --- |
| `@morphatar/core` | `packages/core` | nothing |
| `@morphatar/react` | `packages/react` | `@morphatar/core` (+ `react` as a peer) |

Both packages are versioned together (same version number) and published in
that order: core first, then react.

---

## 1. One-time setup

### npm account

1. Create an account at <https://www.npmjs.com/signup>.
2. Enable two-factor authentication (**Account → Two-Factor Authentication**).
   npm requires 2FA to publish.

### The `@morphatar` scope

Scoped package names (`@morphatar/...`) can only be published by the npm user
or organisation that owns the scope.

1. Go to <https://www.npmjs.com/org/create>.
2. Create an organisation named **`morphatar`** on the free plan (unlimited
   public packages).

If the `morphatar` org name is already taken, publish under your own scope
instead — rename the packages to `@<your-npm-username>/core` and
`@<your-npm-username>/react`. That rename has to be applied everywhere:

- `name` in `packages/core/package.json` and `packages/react/package.json`
- the `@morphatar/core` dependency in `packages/react/package.json`
- imports in `packages/react/src/index.tsx` and `apps/web`
- `transpilePackages` in `apps/web/next.config.mjs`
- the `--filter` names in the root `package.json` scripts
- every README

### Log in

```bash
npm login          # opens the browser to authenticate
npm whoami         # should print your username
```

### Tools

- Node ≥ 18
- pnpm — the version pinned in the root `package.json` (`packageManager`).
  Run `corepack enable` to pick it up automatically.

---

## 2. What gets shipped

Each package tarball contains only:

- `dist/` — compiled ESM JavaScript, `.d.ts` types and source maps
- `src/` — the TypeScript sources the source maps point to
- `README.md`, `LICENSE`, `package.json`

`package.json` already carries what npm needs:

- `"publishConfig": { "access": "public" }` — scoped packages are private by
  default, and a private publish fails without a paid plan.
- `repository`, `homepage`, `bugs`, `author`, `license`, `keywords` — shown on
  the npm page.
- `"prepublishOnly"` — rebuilds (and for core, re-runs the tests) right before
  publishing, so a stale or broken `dist/` cannot ship.

To see exactly what a tarball will contain:

```bash
cd packages/core && pnpm pack --dry-run
```

---

## 3. Why pnpm, not npm

`packages/react/package.json` depends on core as `"@morphatar/core": "workspace:*"`.
`pnpm publish` rewrites that to the real version (for example `"0.1.0"`) inside
the published tarball. Plain `npm publish` does **not**, and would ship a
package nobody can install.

**Always publish with `pnpm publish` / `pnpm release`.**

---

## 4. Release checklist

### 4.1 Choose the version

Follow [semver](https://semver.org). For this library, *what counts as breaking*
is unusual:

> Users store nothing — they regenerate avatars from seeds. So **any change
> that alters the SVG produced for existing options changes every user's
> avatar**. Treat that as a breaking change.

| Change | Bump (≥ 1.0) | Bump (while 0.x) |
| --- | --- | --- |
| Docs, internal refactor, output byte-identical | patch | patch |
| New option or export, existing output unchanged | minor | patch or minor |
| Existing avatars look different (PRNG call order, palette maths, shape maths) or an option is removed/renamed | **major** | **minor** |

The test suite's determinism tests do not compare against stored snapshots,
so it will not catch an accidental visual change on its own — render a few
seeds before and after if you touched `packages/core/src`.

### 4.2 Bump the version in both packages

```bash
# pick one: patch | minor | major | an exact version like 0.2.0
pnpm --filter "./packages/*" exec npm version patch --no-git-tag-version
```

Check both `package.json` files show the same new version. (The root
`package.json` version is not published; bump it too if you want it to match.)

### 4.3 Run the full dry run

```bash
pnpm install --frozen-lockfile
pnpm release:check
```

`release:check` runs, in order: build → typecheck → tests → size budget
(8 KB gzipped for core) → `pnpm -r publish --dry-run`. Read the dry-run output:
the file list should be `dist/`, `src/`, `README.md`, `LICENSE` and
`package.json`, and nothing else.

### 4.4 Commit and tag

```bash
git add -A
git commit -m "release: v0.1.1"
git tag v0.1.1
```

`pnpm publish` refuses to run with uncommitted changes or from a branch other
than `main`, which keeps what is on npm matching a commit.

### 4.5 Publish

```bash
pnpm release
```

This runs `pnpm -r publish`, which publishes every non-private workspace
package in dependency order (core, then react) and skips any version that is
already on the registry. npm will ask for your 2FA code; you can also pass it
directly:

```bash
pnpm release --otp=123456
```

### 4.6 Push

```bash
git push origin main --tags
```

Optionally create a GitHub release from the tag with release notes.

### 4.7 Verify

```bash
npm view @morphatar/core version
npm view @morphatar/react version dependencies
```

`dependencies` for react must show a real version, not `workspace:*`.

Then install it from the registry in a throwaway project:

```bash
mkdir /tmp/morphatar-smoke && cd /tmp/morphatar-smoke
npm init -y && npm pkg set type=module
npm install @morphatar/core
node -e "import('@morphatar/core').then(m => console.log(m.morphatar({ seed: 'smoke' }).slice(0, 60)))"
```

---

## 5. Pre-releases

Publish betas under a separate dist-tag, so `npm install @morphatar/core`
keeps resolving to the latest stable version:

```bash
pnpm --filter "./packages/*" exec npm version 0.2.0-beta.0 --no-git-tag-version
pnpm release --tag next
```

Users opt in with `npm install @morphatar/core@next`. When the stable version
ships, it goes out under the default `latest` tag as usual.

---

## 6. Automating releases with GitHub Actions (optional)

Publishing from CI adds a **provenance** badge on npm (a signed statement of
which commit and workflow built the package) and removes the need for a
long-lived token on anyone's laptop.

### Trusted publishing (recommended — no token)

1. Do the **first** publish manually (sections 1–4); npm's trusted publisher
   settings are per package, so the package has to exist first.
2. On npmjs.com, for each package: **Settings → Trusted Publisher → GitHub
   Actions**, and enter owner `saranshhardaha`, repository `morphatar`,
   workflow `release.yml`.
3. Add `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    tags: ['v*']

permissions:
  contents: read
  id-token: write # lets npm verify this workflow via OIDC

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4 # reads the pinned pnpm version from package.json
      - uses: actions/setup-node@v4
        with:
          node-version: 24 # ships npm 11, which supports trusted publishing
          cache: pnpm
          registry-url: https://registry.npmjs.org

      - run: pnpm install --frozen-lockfile
      - run: pnpm build && pnpm typecheck && pnpm test && pnpm size

      # pnpm pack rewrites workspace:* to the real version; npm publish then
      # handles the OIDC handshake and provenance.
      - name: Pack
        run: |
          mkdir -p .release
          (cd packages/core && pnpm pack --pack-destination ../../.release)
          (cd packages/react && pnpm pack --pack-destination ../../.release)

      - name: Publish
        run: |
          npm publish .release/morphatar-core-*.tgz --access public
          npm publish .release/morphatar-react-*.tgz --access public
```

From then on a release is: bump (4.2), `release:check` (4.3), commit and tag
(4.4), `git push origin main --tags`. The tag push publishes.

### With an access token instead

If you would rather not set up trusted publishing, create a **granular access
token** on npmjs.com (**Access Tokens → Generate New Token**, read and write,
limited to the `@morphatar` packages), save it as a repository secret named
`NPM_TOKEN`, and change the publish step to:

```yaml
      - name: Publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
        run: |
          npm publish .release/morphatar-core-*.tgz --access public --provenance
          npm publish .release/morphatar-react-*.tgz --access public --provenance
```

Granular tokens expire, so rotate the secret before it does.

---

## 7. Mistakes and how to undo them

- **A bad version went out.** Publish a fixed patch version. Version numbers
  can never be reused, even after unpublishing.
- **Warn people off a version:**
  `npm deprecate @morphatar/core@0.1.1 "Broken output, use 0.1.2"`
- **Move the `latest` tag back to a good version:**
  `npm dist-tag add @morphatar/core@0.1.0 latest`
- **Unpublish** is only allowed within 72 hours of publishing, or later if the
  package has no dependents and very few downloads. Prefer deprecating.

---

## 8. Troubleshooting

| Error | Cause | Fix |
| --- | --- | --- |
| `E402 Payment Required` | Scoped package published as private | `publishConfig.access` must be `"public"` (already set), or pass `--access public` |
| `E403 Forbidden` / `E404 Not Found` on `PUT` | You don't own the `@morphatar` scope, or aren't logged in | Create or join the `morphatar` org; `npm whoami` |
| `ENEEDAUTH` | Not logged in | `npm login` |
| `EOTP` | 2FA code required | Re-run with `--otp=<code>` |
| `E403 … cannot publish over the previously published versions` | Version already exists | Bump the version (4.2) |
| `ERR_PNPM_GIT_UNCLEAN` | Uncommitted changes | Commit first (or `--no-git-checks` for a dry run only) |
| `ERR_PNPM_GIT_NOT_CORRECT_BRANCH` | Not on `main` | Switch to `main`, or pass `--publish-branch <branch>` |
| Installed package has `"@morphatar/core": "workspace:*"` | Published with `npm publish` | Publish a new patch version with `pnpm release` |
| `Cannot find module '@morphatar/core'` while building react | Core not built yet | `pnpm build` (builds core before react) |
