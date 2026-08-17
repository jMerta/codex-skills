#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const https = require("https");

const REPO_OWNER = "jMerta";
const REPO_NAME = "codex-skills";
const USER_AGENT = "codex-skills-cli";
const DEFAULT_TIMEOUT_MS = 30000;

const SKILLS_INDEX = "skills.json";

const DEFAULT_SKILLS_DIR = path.join(os.homedir(), ".agents", "skills");
const CODEX_ROOT = path.join(os.homedir(), ".codex");
const LEDGER_NAME = "AGENTS.MD";
const LEDGER_PATH = path.join(CODEX_ROOT, LEDGER_NAME);
const LEDGER_PATTERN_FILE = "LEDGER-PATTERN.md";
const AGENT_SCRIPTS_DIR = "agent-scripts";

const USE_COLOR = (process.stdout && process.stdout.isTTY && !process.env.NO_COLOR) ||
  (process.env.FORCE_COLOR && process.env.FORCE_COLOR !== "0");
const colors = USE_COLOR ? {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  red: "\x1b[31m"
} : {
  reset: "",
  bold: "",
  dim: "",
  green: "",
  yellow: "",
  blue: "",
  cyan: "",
  red: ""
};

function log(msg) {
  console.log(msg);
}
function success(msg) {
  console.log(`${colors.green}${colors.bold}${msg}${colors.reset}`);
}
function info(msg) {
  console.log(`${colors.cyan}${msg}${colors.reset}`);
}
function warn(msg) {
  console.log(`${colors.yellow}${msg}${colors.reset}`);
}
function error(msg) {
  console.log(`${colors.red}${msg}${colors.reset}`);
}

function authHeaders() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const headers = {
    "User-Agent": USER_AGENT,
    "Accept": "application/vnd.github+json"
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function rateLimitHint(headers) {
  const remaining = headers["x-ratelimit-remaining"];
  const reset = headers["x-ratelimit-reset"];
  if (remaining === "0") {
    const resetTime = reset ? new Date(parseInt(reset, 10) * 1000).toISOString() : "unknown";
    return `GitHub API rate limit exceeded. Set GITHUB_TOKEN to increase limits (resets at ${resetTime}).`;
  }
  return null;
}

function request(url, headers = {}, redirects = 0) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      const status = res.statusCode || 0;
      if (status >= 300 && status < 400 && res.headers.location && redirects < 5) {
        res.resume();
        const nextUrl = new URL(res.headers.location, url).toString();
        resolve(request(nextUrl, headers, redirects + 1));
        return;
      }
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        resolve({ status, headers: res.headers, body: Buffer.concat(chunks) });
      });
    });
    req.setTimeout(DEFAULT_TIMEOUT_MS, () => {
      req.destroy(new Error(`Request timed out after ${DEFAULT_TIMEOUT_MS}ms`));
    });
    req.on("error", reject);
  });
}

async function fetchJson(url) {
  const res = await request(url, authHeaders());
  if (res.status >= 200 && res.status < 300) {
    return JSON.parse(res.body.toString("utf8"));
  }
  const message = res.body.toString("utf8").slice(0, 200);
  const hint = rateLimitHint(res.headers);
  const err = new Error(`HTTP ${res.status} for ${url}: ${message}${hint ? `\n${hint}` : ""}`);
  err.status = res.status;
  throw err;
}

async function fetchText(url) {
  const res = await request(url, authHeaders());
  if (res.status >= 200 && res.status < 300) {
    return res.body.toString("utf8");
  }
  const message = res.body.toString("utf8").slice(0, 200);
  const hint = rateLimitHint(res.headers);
  const err = new Error(`HTTP ${res.status} for ${url}: ${message}${hint ? `\n${hint}` : ""}`);
  err.status = res.status;
  throw err;
}

async function downloadFile(url, dest, headers = authHeaders(), redirects = 0) {
  await new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      const status = res.statusCode || 0;
      if (status >= 300 && status < 400 && res.headers.location && redirects < 5) {
        res.resume();
        const nextUrl = new URL(res.headers.location, url).toString();
        resolve(downloadFile(nextUrl, dest, headers, redirects + 1));
        return;
      }
      if (status < 200 || status >= 300) {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const hint = rateLimitHint(res.headers);
          const message = Buffer.concat(chunks).toString("utf8").slice(0, 200);
          reject(new Error(`HTTP ${status} for ${url}: ${message}${hint ? `\n${hint}` : ""}`));
        });
        return;
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on("finish", () => file.close(resolve));
      file.on("error", reject);
    });
    req.setTimeout(DEFAULT_TIMEOUT_MS, () => {
      req.destroy(new Error(`Request timed out after ${DEFAULT_TIMEOUT_MS}ms`));
    });
    req.on("error", reject);
  });
}

async function resolveRef(refOverride) {
  if (refOverride) {
    return { ref: refOverride, source: "override" };
  }

  const latestReleaseUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`;
  try {
    const release = await fetchJson(latestReleaseUrl);
    if (release && release.tag_name) {
      return { ref: release.tag_name, source: "release" };
    }
  } catch (err) {
    if (err.status !== 404) {
      warn("Failed to resolve latest release; falling back to tags.");
    }
  }

  const tagsUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/tags?per_page=1`;
  const tags = await fetchJson(tagsUrl);
  if (Array.isArray(tags) && tags.length > 0 && tags[0].name) {
    return { ref: tags[0].name, source: "tag" };
  }
  throw new Error("Unable to resolve a release or tag. Use --ref main to proceed.");
}

async function loadSkillsIndex(ref) {
  const url = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${ref}/${SKILLS_INDEX}`;
  const text = await fetchText(url);
  return JSON.parse(text);
}

function parseArgs(args) {
  const result = {
    command: null,
    param: null,
    dir: null,
    deprecatedAgent: null,
    ref: null,
    force: false,
    json: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--agent" || arg === "-a") {
      const value = args[i + 1];
      if (value && !value.startsWith("-")) {
        result.deprecatedAgent = value;
        i++;
      } else {
        result.deprecatedAgent = true;
      }
      continue;
    }

    if (arg === "--dir") {
      const value = args[i + 1];
      if (value) {
        result.dir = value;
      }
      i++;
      continue;
    }

    if (arg === "--ref" || arg === "-r") {
      const value = args[i + 1];
      if (value) {
        result.ref = value;
      }
      i++;
      continue;
    }

    if (arg === "--force" || arg === "-f") {
      result.force = true;
      continue;
    }

    if (arg === "--json") {
      result.json = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      result.command = "help";
      continue;
    }

    if (arg.startsWith("--")) {
      if (!result.command) {
        result.command = arg;
      }
      continue;
    }

    if (!result.command) {
      result.command = arg;
    } else if (!result.param) {
      result.param = arg;
    }
  }

  return result;
}

function expandHomeDir(value) {
  if (!value) return value;
  if (value === "~") return os.homedir();
  if (value.startsWith("~/") || value.startsWith("~\\")) {
    return path.join(os.homedir(), value.slice(2));
  }
  return value;
}

function resolveSkillsDir(dirOverride) {
  const raw = dirOverride ? expandHomeDir(dirOverride) : DEFAULT_SKILLS_DIR;
  return path.resolve(raw);
}

function copyDir(src, dest) {
  if (fs.existsSync(dest)) {
    // Windows can transiently lock files (AV scanning, indexers). Retries help.
    fs.rmSync(dest, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function resolveSkillPath(repoRoot, skill) {
  const skillRel = skill.path || skill.name;
  if (path.isAbsolute(skillRel)) {
    throw new Error(`Invalid skill path (absolute): ${skillRel}`);
  }
  const normalized = path.normalize(skillRel);
  if (normalized === ".." || normalized.startsWith(`..${path.sep}`)) {
    throw new Error(`Invalid skill path (traversal): ${skillRel}`);
  }
  const repoRootResolved = path.resolve(repoRoot) + path.sep;
  const fullPath = path.resolve(path.join(repoRoot, normalized));
  if (!fullPath.startsWith(repoRootResolved)) {
    throw new Error(`Invalid skill path (outside repo): ${skillRel}`);
  }
  return fullPath;
}

function normalizeCategory(value) {
  return value.toLowerCase().replace(/[_\s]+/g, "-").trim();
}

function resolveCategoryId(input, categories) {
  if (!input) return null;
  const normalized = normalizeCategory(input);
  if (normalized === "other") {
    return "other";
  }
  for (const category of categories) {
    if (!category) continue;
    const id = category.id || "";
    const name = category.name || "";
    if (normalizeCategory(id) === normalized || normalizeCategory(name) === normalized) {
      return id;
    }
  }
  return null;
}

function parseFrontmatter(text) {
  const match = text.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]+/);
  if (!match) return null;
  const block = match[1];
  const data = {};
  block.split(/\r?\n/).forEach((line) => {
    const idx = line.indexOf(":");
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key && value) {
      data[key] = value;
    }
  });
  return data;
}

async function withRepoRoot(ref, action) {
  const tar = require("tar");
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "codex-skills-"));       
  const archivePath = path.join(tmpDir, "repo.tgz");
  const tarballUrl = `https://codeload.github.com/${REPO_OWNER}/${REPO_NAME}/tar.gz/${ref}`;

  try {
    info(`Downloading ${ref}...`);
    await downloadFile(tarballUrl, archivePath);

    await tar.x({ file: archivePath, cwd: tmpDir });
    const entries = fs.readdirSync(tmpDir).filter((entry) => {
      const entryPath = path.join(tmpDir, entry);
      return fs.statSync(entryPath).isDirectory();
    });
    if (entries.length === 0) {
      throw new Error("Extracted archive is empty.");
    }

    const repoRoot = path.join(tmpDir, entries[0]);
    return await action(repoRoot);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
}

function installSkillFromRepo(skill, repoRoot, destDir, options) {
  const destPath = path.join(destDir, skill.name);
  if (fs.existsSync(destPath) && !options.force) {
    return { status: "exists", path: destPath };
  }

  const skillPath = resolveSkillPath(repoRoot, skill);

  if (!fs.existsSync(skillPath)) {
    throw new Error(`Skill path not found in archive: ${skillPath}`);
  }

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  copyDir(skillPath, destPath);
  return { status: "installed", path: destPath };
}

function installAgentScriptsFromRepo(repoRoot, destDir, options) {
  const destPath = path.join(destDir, AGENT_SCRIPTS_DIR);
  if (fs.existsSync(destPath) && !options.force) {
    return { status: "exists", path: destPath };
  }

  const scriptsPath = resolveSkillPath(repoRoot, {
    name: AGENT_SCRIPTS_DIR,
    path: AGENT_SCRIPTS_DIR
  });

  if (!fs.existsSync(scriptsPath)) {
    throw new Error(`Agent scripts not found in archive: ${scriptsPath}`);
  }

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  copyDir(scriptsPath, destPath);
  return { status: "installed", path: destPath };
}

function showPostInstallInstructions(skillName, destPath) {
  log(`${colors.dim}To use it in Codex, mention "${skillName}" (or "$${skillName}") in your prompt.${colors.reset}`);
  log(`${colors.dim}If you don't see it, ensure skills are enabled (codex --enable skills).${colors.reset}`);
  info(`Location: ${destPath}`);
}

function formatCategoryName(id) {
  return id
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function listSkillsOutput(data, ref, json) {
  const skills = data.skills || [];

  if (json) {
    log(JSON.stringify(data, null, 2));
    return;
  }

  const byCategory = {};
  skills.forEach((skill) => {
    const category = skill.category || "other";
    if (!byCategory[category]) {
      byCategory[category] = [];
    }
    byCategory[category].push(skill);
  });

  log(`\n${colors.bold}Available Skills${colors.reset} (${skills.length} total) [ref: ${ref}]\n`);

  Object.keys(byCategory)
    .sort()
    .forEach((category) => {
      log(`${colors.blue}${colors.bold}${formatCategoryName(category)}${colors.reset}`);
      byCategory[category].forEach((skill) => {
        const featured = skill.featured ? ` ${colors.yellow}*${colors.reset}` : "";
        const description = skill.description || "";
        log(`  ${colors.green}${skill.name}${colors.reset}${featured}`);
        if (description) {
          log(`    ${colors.dim}${description.slice(0, 80)}${description.length > 80 ? "..." : ""}${colors.reset}`);
        }
      });
      log("");
    });

  if (skills.some((s) => s.featured)) {
    log(`${colors.dim}* = featured skill${colors.reset}`);
  }

  log(`\nInstall: ${colors.cyan}npx codex-skills install <skill-name> [--dir <dir>]${colors.reset}`);
  log(`Install by category: ${colors.cyan}npx codex-skills install-category <category> [--dir <dir>]${colors.reset}`);
  log(`Install all: ${colors.cyan}npx codex-skills install-all [--dir <dir>]${colors.reset}`);
  log(`Install scripts: ${colors.cyan}npx codex-skills install-agent-scripts [--dir <dir>]${colors.reset}`);
  log(`${colors.dim}Default install dir is ${DEFAULT_SKILLS_DIR}.${colors.reset}`);
}

function searchSkillsOutput(data, query) {
  const skills = data.skills || [];
  const q = query.toLowerCase();
  const matches = skills.filter((skill) => {
    const haystack = [skill.name, skill.description, skill.category]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });

  if (matches.length === 0) {
    warn(`No skills found matching "${query}"`);
    return;
  }

  log(`\n${colors.bold}Search Results${colors.reset} (${matches.length} matches)\n`);
  matches.forEach((skill) => {
    log(`${colors.green}${skill.name}${colors.reset} ${colors.dim}[${skill.category || "other"}]${colors.reset}`);
    if (skill.description) {
      log(`  ${skill.description.slice(0, 100)}${skill.description.length > 100 ? "..." : ""}`);
    }
    log("");
  });
}

function showInfoOutput(skill) {
  if (!skill) {
    return;
  }

  log(`\n${colors.bold}${skill.name}${colors.reset}${skill.featured ? ` ${colors.yellow}(featured)${colors.reset}` : ""}`);
  if (skill.description) {
    log(`\n${colors.dim}${skill.description}${colors.reset}\n`);
  }

  const rows = [];
  if (skill.category) rows.push(["Category", skill.category]);
  if (skill.author) rows.push(["Author", skill.author]);
  if (skill.license) rows.push(["License", skill.license]);
  if (skill.source) rows.push(["Source", skill.source]);
  if (typeof skill.stars === "number") rows.push(["Stars", skill.stars.toLocaleString()]);
  if (typeof skill.downloads === "number") rows.push(["Downloads", skill.downloads.toLocaleString()]);

  rows.forEach(([label, value]) => {
    log(`${colors.bold}${label}:${colors.reset} ${value}`);
  });

  log(`\n${colors.bold}Install:${colors.reset}`);
  log(`  npx codex-skills install ${skill.name}`);
  log(`  npx codex-skills install ${skill.name} --dir .agents/skills`);
}

function showHelp() {
  log(`
${colors.bold}Codex Skills${colors.reset}
Install skills into the standard skills catalog (${DEFAULT_SKILLS_DIR}) or a repo-local .agents/skills/.

${colors.bold}Usage:${colors.reset}
  npx codex-skills <command> [options]

${colors.bold}Commands:${colors.reset}
  ${colors.green}list${colors.reset}                          List all available skills
  ${colors.green}install <name>${colors.reset}                Install a skill   
  ${colors.green}install-category <category>${colors.reset}   Install all skills in a category
  ${colors.green}install-all${colors.reset}                   Install all skills
  ${colors.green}install-agent-scripts${colors.reset}         Install shared agent scripts
  ${colors.green}search <query>${colors.reset}               Search skills      
  ${colors.green}info <name>${colors.reset}                  Show skill details 
  ${colors.green}init-ledger${colors.reset}                  Create ${LEDGER_PATH} (not a skill)
  ${colors.green}verify <name>${colors.reset}                Verify a local skill install
  ${colors.green}help${colors.reset}                          Show this help    

${colors.bold}Options:${colors.reset}
  --dir <dir>                 Destination skills directory (default: ${DEFAULT_SKILLS_DIR})
  --ref <ref>                 Use a Git ref (tag or branch). Default: latest release
  --force                     Overwrite if the skill already exists
  --json                      Output JSON for list

${colors.bold}Examples:${colors.reset}
  npx codex-skills list
  npx codex-skills search git
  npx codex-skills install bug-triage
  npx codex-skills install bug-triage --dir .agents/skills
  npx codex-skills install-category development
  npx codex-skills install-all
  npx codex-skills install-agent-scripts
  npx codex-skills install bug-triage --ref main
  npx codex-skills init-ledger
  npx codex-skills verify bug-triage
`);
}

async function initLedgerCommand(options) {
  if (fs.existsSync(LEDGER_PATH) && !options.force) {
    error(`Ledger already exists at ${LEDGER_PATH}`);
    log("Use --force to override the existing file.");
    return;
  }

  const resolved = await resolveRef(options.ref);
  await withRepoRoot(resolved.ref, async (repoRoot) => {
    const templatePath = path.join(repoRoot, LEDGER_PATTERN_FILE);
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Ledger template not found: ${LEDGER_PATTERN_FILE}`);
    }
    fs.mkdirSync(CODEX_ROOT, { recursive: true });
    const contents = fs.readFileSync(templatePath);
    fs.writeFileSync(LEDGER_PATH, contents);
  });

  success(`Created ledger: ${LEDGER_NAME}`);
  info(`Location: ${LEDGER_PATH}`);
  info(`Ref: ${resolved.ref}`);
  log(`${colors.dim}This is a global AGENTS.MD ledger (not a skill).${colors.reset}`);
  log(`${colors.dim}Keep it updated so it applies across projects.${colors.reset}`);
}

async function verifyCommand(options) {
  if (!options.param) {
    error("Please specify a skill name to verify.");
    log("Usage: npx codex-skills verify <skill-name> [--dir <dir>]");
    process.exit(1);
  }

  const destDir = resolveSkillsDir(options.dir);

  const skillPath = path.join(destDir, options.param);
  if (!fs.existsSync(skillPath)) {
    error(`Skill not found at ${skillPath}`);
    log("Install it first with: npx codex-skills install <skill-name>");
    return;
  }

  const skillFile = path.join(skillPath, "SKILL.md");
  if (!fs.existsSync(skillFile)) {
    error(`Missing SKILL.md at ${skillFile}`);
    return;
  }

  const contents = fs.readFileSync(skillFile, "utf8");
  const frontmatter = parseFrontmatter(contents);
  if (!frontmatter) {
    error("SKILL.md is missing YAML frontmatter.");
    return;
  }

  if (!frontmatter.name || !frontmatter.description) {
    error("SKILL.md frontmatter must include non-empty name and description.");
    return;
  }

  if (frontmatter.name !== options.param) {
    warn(`Frontmatter name "${frontmatter.name}" does not match "${options.param}".`);
  }

  success(`Verified: ${options.param}`);
  info(`Location: ${skillPath}`);
}

async function listCommand(options) {
  const resolved = await resolveRef(options.ref);
  const data = await loadSkillsIndex(resolved.ref);
  listSkillsOutput(data, resolved.ref, options.json);
}

async function searchCommand(options) {
  if (!options.param) {
    error("Please specify a search query.");
    log("Usage: npx codex-skills search <query>");
    process.exit(1);
  }
  const resolved = await resolveRef(options.ref);
  const data = await loadSkillsIndex(resolved.ref);
  searchSkillsOutput(data, options.param);
}

async function infoCommand(options) {
  if (!options.param) {
    error("Please specify a skill name.");
    log("Usage: npx codex-skills info <skill-name>");
    process.exit(1);
  }
  const resolved = await resolveRef(options.ref);
  const data = await loadSkillsIndex(resolved.ref);
  const skill = (data.skills || []).find((s) => s.name === options.param);
  if (!skill) {
    error(`Skill "${options.param}" not found.`);
    return;
  }
  showInfoOutput(skill);
}

async function installCommand(options) {
  if (!options.param) {
    error("Please specify a skill name.");
    log("Usage: npx codex-skills install <skill-name> [--dir <dir>] [--ref <ref>] [--force]");
    process.exit(1);
  }

  const resolved = await resolveRef(options.ref);
  const data = await loadSkillsIndex(resolved.ref);
  const skills = data.skills || [];
  const skill = skills.find((s) => s.name === options.param);

  if (!skill) {
    error(`Skill "${options.param}" not found.`);
    log("\nAvailable skills:");
    skills.forEach((s) => log(`- ${s.name}`));
    return;
  }

  const destDir = resolveSkillsDir(options.dir);

  const destPath = path.join(destDir, skill.name);
  if (fs.existsSync(destPath) && !options.force) {
    error(`Skill already exists at ${destPath}`);
    log("Use --force to overwrite.");
    return;
  }

  await withRepoRoot(resolved.ref, async (repoRoot) => {
    const result = installSkillFromRepo(skill, repoRoot, destDir, { force: options.force });
    if (result.status === "exists") {
      error(`Skill already exists at ${result.path}`);
      log("Use --force to overwrite.");
      return;
    }

    success(`Installed: ${skill.name}`);
    info(`Ref: ${resolved.ref}`);
    showPostInstallInstructions(skill.name, result.path);
  });
}

async function installCategoryCommand(options) {
  if (!options.param) {
    error("Please specify a category.");
    log("Usage: npx codex-skills install-category <category> [--dir <dir>] [--ref <ref>] [--force]");
    process.exit(1);
  }

  const resolved = await resolveRef(options.ref);
  const data = await loadSkillsIndex(resolved.ref);
  const skills = data.skills || [];
  const categories = data.categories || [];
  const categoryId = resolveCategoryId(options.param, categories);

  if (!categoryId) {
    error(`Category "${options.param}" not found.`);
    if (categories.length) {
      log("\nAvailable categories:");
      categories.forEach((category) => log(`- ${category.id}`));
    }
    return;
  }

  const categorySkills = skills.filter(
    (skill) => (skill.category || "other") === categoryId
  );

  if (categorySkills.length === 0) {
    warn(`No skills found for category "${categoryId}".`);
    return;
  }

  const destDir = resolveSkillsDir(options.dir);

  await installSkillsBatch({
    skills: categorySkills,
    destDir,
    options,
    ref: resolved.ref,
    summaryLabel: `category "${categoryId}"`
  });
}

async function installAllCommand(options) {
  const resolved = await resolveRef(options.ref);
  const data = await loadSkillsIndex(resolved.ref);
  const skills = data.skills || [];

  if (skills.length === 0) {
    warn("No skills found to install.");
    return;
  }

  const destDir = resolveSkillsDir(options.dir);

  await installSkillsBatch({
    skills,
    destDir,
    options,
    ref: resolved.ref,
    summaryLabel: "all skills"
  });
}

async function installAgentScriptsCommand(options) {
  const resolved = await resolveRef(options.ref);
  const destDir = resolveSkillsDir(options.dir);

  await withRepoRoot(resolved.ref, async (repoRoot) => {
    const result = installAgentScriptsFromRepo(repoRoot, destDir, {
      force: options.force
    });
    if (result.status === "exists") {
      error(`Agent scripts already exist at ${result.path}`);
      log("Use --force to overwrite.");
      return;
    }

    success("Installed: agent-scripts");
    info(`Ref: ${resolved.ref}`);
    info(`Location: ${result.path}`);
    log(`${colors.dim}Add this folder to PATH if you want to run scripts directly.${colors.reset}`);
  });
}

async function installSkillsBatch({ skills, destDir, options, ref, summaryLabel }) {
  let installedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  await withRepoRoot(ref, async (repoRoot) => {
    for (const skill of skills) {
      try {
        const result = installSkillFromRepo(skill, repoRoot, destDir, { force: options.force });
        if (result.status === "exists") {
          warn(`Skipping ${skill.name} (already installed). Use --force to overwrite.`);
          skippedCount += 1;
          continue;
        }

        installedCount += 1;
        success(`Installed: ${skill.name}`);
        showPostInstallInstructions(skill.name, result.path);
      } catch (err) {
        failedCount += 1;
        error(`Failed to install ${skill.name}: ${err.message || err}`);
      }
    }
  });

  info(`Ref: ${ref}`);
  log(`\n${colors.bold}Summary:${colors.reset} installed ${installedCount}, skipped ${skippedCount}, failed ${failedCount} (${summaryLabel}).`);
  if (failedCount > 0) {
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const parsed = parseArgs(args);
  const command = parsed.command || "help";

  try {
    if (parsed.deprecatedAgent) {
      error("The --agent flag has been removed.");
      log(`Skills now install into ${DEFAULT_SKILLS_DIR} by default.`);
      log("To install into a repo, use: npx codex-skills install <skill-name> --dir .agents/skills");
      process.exit(2);
    }

    switch (command) {
      case "list":
      case "ls":
        await listCommand(parsed);
        break;
      case "install":
      case "i":
        await installCommand(parsed);
        break;
      case "install-category":
      case "install-cat":
        await installCategoryCommand(parsed);
        break;
      case "install-all":
      case "install-everything":
        await installAllCommand(parsed);
        break;
      case "install-agent-scripts":
      case "install-scripts":
        await installAgentScriptsCommand(parsed);
        break;
      case "search":
      case "s":
        await searchCommand(parsed);
        break;
      case "info":
        await infoCommand(parsed);
        break;
      case "init-ledger":
      case "ledger":
        await initLedgerCommand(parsed);
        break;
      case "verify":
      case "check":
        await verifyCommand(parsed);
        break;
      case "help":
      default:
        showHelp();
        break;
    }
  } catch (err) {
    error(err.message || String(err));
    process.exit(1);
  }
}

main();
