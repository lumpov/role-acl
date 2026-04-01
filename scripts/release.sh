#!/usr/bin/env bash
set -euo pipefail

if [ -f ".env" ]; then
    set -o allexport
    source .env
    set +o allexport
fi

PACKAGE_VERSION=$(node -p "require('./package.json').version")
TAG="v${PACKAGE_VERSION}"
REPO="lumpov/role-acl"

echo "→ Preparing release ${TAG} for ${REPO}"

# 1. No uncommitted changes
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "✗ Uncommitted changes present. Commit or stash before releasing." >&2
    exit 1
fi

# 2. Local branch is in sync with remote
git fetch origin
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse "@{u}" 2>/dev/null || echo "")
if [ -z "$REMOTE" ]; then
    echo "✗ Current branch has no upstream tracking branch." >&2
    exit 1
fi
if [ "$LOCAL" != "$REMOTE" ]; then
    echo "✗ Local branch is not in sync with remote (push or pull first)." >&2
    exit 1
fi

# 3. Tag does not exist on remote
if git ls-remote --tags origin | grep -q "refs/tags/${TAG}$"; then
    echo "✗ Tag ${TAG} already exists on remote." >&2
    exit 1
fi

# 4. Version in package.json was bumped since last tag
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
if [ -n "$LAST_TAG" ]; then
    COMMITS_SINCE=$(git rev-list "${LAST_TAG}..HEAD" --count)
    VERSION_CHANGED=$(git diff "${LAST_TAG}" HEAD -- package.json | grep -c '"version"' || true)
    if [ "$COMMITS_SINCE" -gt 0 ] && [ "$VERSION_CHANGED" -eq 0 ]; then
        echo "✗ There are ${COMMITS_SINCE} commit(s) since ${LAST_TAG} but version in package.json was not changed." >&2
        echo "  Bump version before releasing." >&2
        exit 1
    fi
fi

# 5. Run tests
echo "→ Running tests..."
npm test

# 6. Create and push tag
echo "→ Creating tag ${TAG}..."
git tag "${TAG}"
git push origin "${TAG}"
echo "✓ Tag ${TAG} pushed."

# 7. Create GitHub Release via API (requires GITHUB_TOKEN env var)
if [ -n "${GITHUB_TOKEN:-}" ]; then
    echo "→ Creating GitHub Release..."
    RESPONSE=$(curl -sf -X POST \
        -H "Authorization: token ${GITHUB_TOKEN}" \
        -H "Accept: application/vnd.github+json" \
        "https://api.github.com/repos/${REPO}/releases" \
        -d "{\"tag_name\":\"${TAG}\",\"name\":\"${TAG}\",\"generate_release_notes\":true}")
    RELEASE_URL=$(echo "$RESPONSE" | grep -o '"html_url":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "✓ Release created: ${RELEASE_URL}"
else
    echo "⚠ GITHUB_TOKEN not set — skipping GitHub Release creation."
    echo "  Create release manually: https://github.com/${REPO}/releases/new?tag=${TAG}"
fi
