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


publish:
	npm version patch --no-git-tag-version

	VERSION="$$(node -p "require('./package.json').version")"

	read -p "Release message: " message

	git add .
	git commit -m "release: v$$VERSION - $$message"

	git tag -a "v$$VERSION" \
		-m "release: v$$VERSION - $$message"

	git push origin main
	git push origin "v$$VERSION"

	npm publish

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