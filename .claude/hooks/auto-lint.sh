#!/bin/bash
# Auto-lint JS/JSX files after Edit or Write.
# Receives tool input as JSON on stdin.

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Skip if no file path or not a JS/JSX file
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

case "$FILE_PATH" in
  *.js|*.jsx) ;;
  *) exit 0 ;;
esac

# Skip files outside src/ and config files
case "$FILE_PATH" in
  */node_modules/*|*/dist/*|*/contracts/*) exit 0 ;;
esac

# Run eslint --fix silently; don't block on failure
cd "$CLAUDE_PROJECT_DIR" 2>/dev/null
npx eslint --fix "$FILE_PATH" 2>/dev/null
exit 0
