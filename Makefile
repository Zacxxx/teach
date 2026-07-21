.PHONY: bootstrap dev test check demo validate-plugin

bootstrap:
	bun install --frozen-lockfile

dev:
	bun run dev

test:
	bun run test

validate-plugin:
	bun run scripts/validate-repo.ts

demo:
	TEACH_HOME=$$(mktemp -d) TEACH_SKILLS_HOME=$$(mktemp -d) TEACH_ANALYZER=fixture TEACH_RECORDER=demo bun run demo

check:
	bun run check
	$(MAKE) validate-plugin
