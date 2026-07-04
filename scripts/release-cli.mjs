#!/usr/bin/env node

/**
 * gopdf-cli Release Automation Script
 * Bumps the version of packages/pdf-cli/package.json, commits it, tags it, and creates a GitHub Release.
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgPath = path.resolve(__dirname, "../packages/pdf-cli/package.json");

// Helper to run shell commands cleanly
function runCmd(cmd) {
  console.log(`> ${cmd}`);
  try {
    return execSync(cmd, { stdio: "inherit" });
  } catch (error) {
    console.error(`[ERROR] Command failed: ${cmd}`);
    process.exit(1);
  }
}

// Helper to ask user input
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    })
  );
}

// Calculate next version
function bumpVersion(current, type) {
  const [major, minor, patch] = current.split(".").map(Number);
  if (type === "major") return `${major + 1}.0.0`;
  if (type === "minor") return `${major}.${minor + 1}.0`;
  if (type === "patch") return `${major}.${minor}.${patch + 1}`;
  return null;
}

async function main() {
  if (!fs.existsSync(pkgPath)) {
    console.error(`[ERROR] package.json not found at ${pkgPath}`);
    process.exit(1);
  }

  // Read current version
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const currentVersion = pkg.version;
  console.log(`Current gopdf-cli version: ${currentVersion}`);

  let newVersion = "";
  const args = process.argv.slice(2);
  const versionArgIndex = args.indexOf("--version");
  const bumpArgIndex = args.indexOf("--bump");

  if (versionArgIndex !== -1 && args[versionArgIndex + 1]) {
    newVersion = args[versionArgIndex + 1];
  } else if (bumpArgIndex !== -1 && args[bumpArgIndex + 1]) {
    const bumpType = args[bumpArgIndex + 1].toLowerCase();
    newVersion = bumpVersion(currentVersion, bumpType);
    if (!newVersion) {
      console.error(`[ERROR] Invalid bump type "${bumpType}". Expected major, minor, or patch.`);
      process.exit(1);
    }
  } else {
    // Interactive prompt
    console.log("\nChoose release type:");
    console.log(`1) patch (${bumpVersion(currentVersion, "patch")})`);
    console.log(`2) minor (${bumpVersion(currentVersion, "minor")})`);
    console.log(`3) major (${bumpVersion(currentVersion, "major")})`);
    console.log("4) custom version");

    const choice = await askQuestion("Select option (1-4): ");
    if (choice === "1") {
      newVersion = bumpVersion(currentVersion, "patch");
    } else if (choice === "2") {
      newVersion = bumpVersion(currentVersion, "minor");
    } else if (choice === "3") {
      newVersion = bumpVersion(currentVersion, "major");
    } else if (choice === "4") {
      newVersion = await askQuestion("Enter custom version (e.g. 1.2.3): ");
    } else {
      console.error("[ERROR] Invalid choice. Aborting.");
      process.exit(1);
    }
  }

  if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
    console.error(`[ERROR] Invalid version format: "${newVersion}". Must be X.Y.Z.`);
    process.exit(1);
  }

  console.log(`\nBumping version: ${currentVersion} -> ${newVersion}`);
  const confirm = await askQuestion("Are you sure you want to proceed with this release? (y/N): ");
  if (confirm.toLowerCase() !== "y" && confirm.toLowerCase() !== "yes") {
    console.log("Release cancelled.");
    process.exit(0);
  }

  // Update package.json
  pkg.version = newVersion;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
  console.log(`✔ Updated packages/pdf-cli/package.json to version ${newVersion}`);

  // Git operations
  const tagName = `gopdf-cli-v${newVersion}`;
  console.log(`\nStarting Git Release Process for Tag: ${tagName}...`);

  runCmd(`git add packages/pdf-cli/package.json`);
  runCmd(`git commit -m "chore(release): gopdf-cli v${newVersion}"`);
  runCmd(`git tag -a ${tagName} -m "gopdf-cli v${newVersion} release"`);
  
  const pushConfirm = await askQuestion("\nDo you want to push commits and tags to origin? (y/N): ");
  if (pushConfirm.toLowerCase() === "y" || pushConfirm.toLowerCase() === "yes") {
    runCmd(`git push origin HEAD`);
    runCmd(`git push origin ${tagName}`);

    // GitHub Release creation
    const ghConfirm = await askQuestion("\nDo you want to create a GitHub Release using the 'gh' CLI? (y/N): ");
    if (ghConfirm.toLowerCase() === "y" || ghConfirm.toLowerCase() === "yes") {
      runCmd(`gh release create ${tagName} --title "gopdf-cli v${newVersion}" --notes "Release of gopdf-cli v${newVersion}" --generate-notes`);
      console.log(`✔ Created GitHub Release ${tagName}`);
    }
  }

  console.log("\nRelease process finished successfully!");
}

main().catch((err) => {
  console.error("Unhandle release error:", err);
  process.exit(1);
});
