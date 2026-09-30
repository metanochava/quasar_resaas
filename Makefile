SHELL := /bin/bash
.ONESHELL:
.SHELLFLAGS := -eu -o pipefail -c


# =========================================================
# NPM / GIT RELEASE
# =========================================================

push:
	npm version patch --no-git-tag-version

	VERSION="$$(node -p "require('./package.json').version")"

	read -p "Release message: " message

	git add .
	git commit -m "release: v$$VERSION - $$message"
	git push origin main

	echo "Release v$$VERSION pushed successfully."


pushtag:
	npm version patch --no-git-tag-version

	VERSION="$$(node -p "require('./package.json').version")"

	read -p "Release message: " message

	git add .
	git commit -m "release: v$$VERSION - $$message"

	git tag -a "v$$VERSION" \
		-m "release: v$$VERSION - $$message"

	git push origin main
	git push origin "v$$VERSION"

	echo "Release v$$VERSION pushed and tagged successfully."


# release-check: clean tree -> tests -> what `npm publish` would ship.
# publish: release-check -> version commit + tag (local) -> npm publish ->
# only then push. If npm publish fails, the local commit and tag are undone
# and nothing reached GitHub or the registry.

release-check:
	if [[ -n "$$(git status --porcelain)" ]]; then
		echo "Working tree is not clean: commit or stash first."
		exit 1
	fi

	npm test

	npm pack --dry-run --json > /tmp/quasar_resaas-pack.json
	node -e '
	const pack = require("/tmp/quasar_resaas-pack.json")[0]
	const files = pack.files.map((f) => f.path)
	const bad = files.filter((f) => /\.spec\.js$$|^tests\/|Makefile|vitest\.config|\.env/.test(f))
	for (const needed of ["index.js", "auto-imports.cjs", "package.json"])
	  if (!files.includes(needed)) bad.push("missing " + needed)
	if (bad.length) { console.error("package check failed:", bad); process.exit(1) }
	console.log(`package OK: $${files.length} files, $${(pack.size / 1024).toFixed(0)} KB`)
	'
	rm -f /tmp/quasar_resaas-pack.json


publish: release-check
	npm version patch --no-git-tag-version

	VERSION="$$(node -p "require('./package.json').version")"

	read -p "Release message: " message

	git add package.json package-lock.json
	git commit -m "release: v$$VERSION - $$message"

	git tag -a "v$$VERSION" \
		-m "release: v$$VERSION - $$message"

	if ! npm publish; then
		echo "npm publish failed: undoing the local release commit and tag (nothing was pushed)."
		git tag -d "v$$VERSION"
		git reset --hard HEAD~1
		exit 1
	fi

	git push origin main
	git push origin "v$$VERSION"

	echo "Release v$$VERSION published successfully."


# =========================================================
# GIT UTILITIES
# =========================================================

gitback:
	echo "Reverting the last commit while keeping the changes..."
	git reset --soft HEAD~1
	echo "Last commit reverted successfully."


gitrmc:
	read -p "File or directory to remove from Git tracking: " path

	if [[ -z "$$path" ]]; then
		echo "A file or directory path is required."
		exit 1
	fi

	git rm --cached -r -- "$$path"

	echo "$$path removed from Git tracking."