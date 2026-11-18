#!/usr/bin/env node
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const inventoryPath = "SOURCE_INVENTORY.sha256";
const mode = process.argv[2];

if (mode !== "--check" && mode !== "--write") {
  console.error("Usage: node scripts/update-source-inventory.mjs --check|--write");
  process.exit(2);
}

const trackedPaths = execFileSync("git", ["ls-files", "-z"], {
  encoding: "buffer",
})
  .toString("utf8")
  .split("\0")
  .filter((path) => path && path !== inventoryPath)
  .sort();

const entries = trackedPaths
  .map((path) => {
    const digest = createHash("sha256")
      .update(readFileSync(path))
      .digest("hex");
    return `${digest}  ${path}`;
  });

const expected = entries
  .sort()
  .join("\n")
  .concat("\n");

if (mode === "--write") {
  writeFileSync(inventoryPath, expected);
  console.log(`Updated ${inventoryPath} with ${trackedPaths.length} tracked files.`);
  process.exit(0);
}

const actual = readFileSync(inventoryPath, "utf8");
if (actual !== expected) {
  console.error(`${inventoryPath} does not match tracked files.`);
  console.error("Run `pnpm run inventory:update` after staging source changes.");
  process.exit(1);
}

console.log(`${inventoryPath} matches ${trackedPaths.length} tracked files.`);
