#!/usr/bin/env node

/**
 * gopdf-cli Standalone Node.js Installer
 * Downloads and installs gopdf-cli into a local user directory and creates global shims.
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";
import https from "node:https";

const HOME = os.homedir();
const INSTALL_DIR = path.join(HOME, ".gopdf");
const BIN_NAME = "gopdf";

// Helper to run shell commands cleanly
function runCmd(cmd, options = {}) {
  try {
    return execSync(cmd, { stdio: "pipe", ...options }).toString().trim();
  } catch (error) {
    return null;
  }
}

// Request helper to get JSON from GitHub API
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        "User-Agent": "gopdf-install-script",
      },
    };
    https.get(url, options, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to fetch: ${res.statusCode}`));
      }
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", reject);
  });
}

async function main() {
  console.log("=========================================");
  console.log("   Installing gopdf-cli Standalone Tool   ");
  console.log("=========================================\n");

  const platform = os.platform();
  const isWindows = platform === "win32";

  console.log(`Target Directory: ${INSTALL_DIR}`);
  if (!fs.existsSync(INSTALL_DIR)) {
    fs.mkdirSync(INSTALL_DIR, { recursive: true });
  }

  // Get the latest version from npm or GitHub releases
  let version = "latest";
  try {
    console.log("Fetching latest release information...");
    const releases = await fetchJson("https://api.github.com/repos/systembugtj/gopdfjs/releases");
    if (releases && releases.length > 0) {
      // e.g. gopdf-cli-v0.1.0 -> 0.1.0
      const latestTag = releases[0].tag_name;
      const match = latestTag.match(/v?(\d+\.\d+\.\d+)/);
      if (match) {
        version = match[1];
        console.log(`Latest GitHub release version: v${version}`);
      }
    }
  } catch (error) {
    console.log("Note: Could not reach GitHub API, falling back to npm latest.");
  }

  // Create clean package.json in ~/.gopdf
  const localPkg = {
    name: "gopdf-local-install",
    version: "1.0.0",
    private: true,
    dependencies: {
      "@gopdfjs/pdf-cli": version === "latest" ? "latest" : `^${version}`,
    },
  };

  fs.writeFileSync(
    path.join(INSTALL_DIR, "package.json"),
    JSON.stringify(localPkg, null, 2),
    "utf8"
  );

  console.log(`Installing package dependencies into ${INSTALL_DIR}...`);
  const npmInstallResult = runCmd("npm install --omit=dev --no-audit --no-fund", { cwd: INSTALL_DIR });
  if (npmInstallResult === null) {
    console.error("[ERROR] Failed to run 'npm install'. Please ensure Node.js and npm are installed on your system.");
    process.exit(1);
  }

  console.log("✔ Successfully installed dependencies.");

  // Path to cli entry script
  const cliScriptPath = path.join(
    INSTALL_DIR,
    "node_modules",
    "@gopdfjs",
    "pdf-cli",
    "dist",
    "index.mjs"
  );

  if (!fs.existsSync(cliScriptPath)) {
    console.error(`[ERROR] CLI executable script not found at expected location: ${cliScriptPath}`);
    process.exit(1);
  }

  // Create global executable shims
  if (isWindows) {
    // Windows Path setting
    const localAppData = process.env.LOCALAPPDATA || path.join(HOME, "AppData", "Local");
    const windowsAppsDir = path.join(localAppData, "Microsoft", "WindowsApps");
    if (!fs.existsSync(windowsAppsDir)) {
      fs.mkdirSync(windowsAppsDir, { recursive: true });
    }

    const cmdPath = path.join(windowsAppsDir, `${BIN_NAME}.cmd`);
    const cmdCliPath = path.join(windowsAppsDir, `${BIN_NAME}-cli.cmd`);
    const batchContent = `@echo off\nnode "${cliScriptPath}" %*\n`;

    fs.writeFileSync(cmdPath, batchContent, "utf8");
    fs.writeFileSync(cmdCliPath, batchContent, "utf8");

    console.log(`\n✔ Created Windows executable shims:`);
    console.log(`  - ${cmdPath}`);
    console.log(`  - ${cmdCliPath}`);
    console.log(`\nInstallation complete! Please ensure "${windowsAppsDir}" is in your system PATH.`);
  } else {
    // Unix (macOS / Linux) global link
    const targetBinDirs = ["/usr/local/bin", "/opt/homebrew/bin", path.join(HOME, ".local", "bin")];
    let selectedBinDir = null;

    for (const dir of targetBinDirs) {
      try {
        if (fs.existsSync(dir)) {
          // Check if writable
          fs.accessSync(dir, fs.constants.W_OK);
          selectedBinDir = dir;
          break;
        }
      } catch (e) {
        // Not writable or doesn't exist, try next
      }
    }

    if (!selectedBinDir) {
      // Fallback: create in ~/.gopdf/bin and ask user to add to PATH
      selectedBinDir = path.join(INSTALL_DIR, "bin");
      fs.mkdirSync(selectedBinDir, { recursive: true });
    }

    const shimPath = path.join(selectedBinDir, BIN_NAME);
    const shimCliPath = path.join(selectedBinDir, `${BIN_NAME}-cli`);
    const shimContent = `#!/usr/bin/env bash\nnode "${cliScriptPath}" "$@"\n`;

    try {
      fs.writeFileSync(shimPath, shimContent, "utf8");
      fs.chmodSync(shimPath, "755");
      fs.writeFileSync(shimCliPath, shimContent, "utf8");
      fs.chmodSync(shimCliPath, "755");

      console.log(`\n✔ Created executable shims in: ${selectedBinDir}`);
      console.log(`  - ${BIN_NAME}`);
      console.log(`  - ${BIN_NAME}-cli`);

      // Verify path
      const pathEnv = process.env.PATH || "";
      if (!pathEnv.includes(selectedBinDir)) {
        console.log(`\n[WARNING] "${selectedBinDir}" is not in your system PATH.`);
        console.log(`Please add the following to your ~/.bashrc, ~/.zshrc, or ~/.profile:`);
        console.log(`  export PATH="${selectedBinDir}:$PATH"`);
      } else {
        console.log(`\nInstallation complete! Run "${BIN_NAME} --help" to get started.`);
      }
    } catch (err) {
      console.error(`\n[ERROR] Failed to write shims: ${err.message}`);
      console.log(`Please run with sudo or add a writable directory to your PATH.`);
    }
  }
}

main().catch((err) => {
  console.error("Installation failed:", err);
  process.exit(1);
});
