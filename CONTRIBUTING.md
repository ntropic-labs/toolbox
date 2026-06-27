# Contributing

This repo is a pnpm/Turbo monorepo for browser-only web tools.

## Local setup

```sh
pnpm -C . install
pnpm dev
```

## Quality checks

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Package boundaries

- Keep product UI in `apps/*`.
- Keep reusable logic in `packages/*`.
- Do not introduce a backend unless a tool explicitly requires one.
- Export engines should remain deterministic and browser-compatible.
