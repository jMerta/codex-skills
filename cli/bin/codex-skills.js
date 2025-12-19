#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const https = require("https");
const tar = require("tar");

const REPO_OWNER = "jMerta";
const REPO_NAME = "codex-skills";
const DEFAULT_AGENT = "codex";
const USER_AGENT = "codex-skills-cli";
const DEFAULT_TIMEOUT_MS = 30000;

const SKILLS_INDEX = "skills.json";

const AGENT_PATHS = {
  claude: path.join(os.homedir(), ".claude", "skills"),
  cursor: path.join(process.cwd(), ".cursor", "skills"),
  amp: path.join(os.homedir(), ".amp", "skills"),
  vscode: path.join(process.cwd(), ".github", "skills"),
  copilot: path.join(process.cwd(), ".github", "skills"),
  project: path.join(process.cwd(), ".skills"),
  goose: path.join(os.homedir(), ".config", "goose", "skills"),
  opencode: path.join(os.homedir(), ".opencode", "skills"),
  codex: path.join(os.homedir(), ".codex", "skills")
};

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
    agent: DEFAULT_AGENT,
    ref: null,
    force: false,
    json: false
  };

  const validAgents = Object.keys(AGENT_PATHS);

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--agent" || arg === "-a") {
      const value = args[i + 1];
      if (value) {
        const cleaned = value.replace(/^-+/, "");
        result.agent = validAgents.includes(cleaned) ? cleaned : DEFAULT_AGENT;
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
      const potentialAgent = arg.replace(/^--/, "");
      if (validAgents.includes(potentialAgent)) {
        result.agent = potentialAgent;
      } else if (!result.command) {
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

function copyDir(src, dest) {
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
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

async function withRepoRoot(ref, action) {
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
    fs.rmSync(tmpDir, { recursive: true, force: true });
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

function showAgentInstructions(agent, skillName, destPath) {
  switch (agent) {
    case "codex":
      log(`${colors.dim}The skill is now available in Codex.${colors.reset}`);
      log(`${colors.dim}Run: codex --enable skills${colors.reset}`);
      log(`${colors.dim}Then mention "${skillName}" in your prompt.${colors.reset}`);
      break;
    case "claude":
      log(`${colors.dim}The skill is now available in Claude Code.${colors.reset}`);
      log(`${colors.dim}Mention "${skillName}" in your prompt to trigger it.${colors.reset}`);
      break;
    case "cursor":
      log(`${colors.dim}Installed in .cursor/skills/ for this project.${colors.reset}`);
      break;
    case "amp":
      log(`${colors.dim}The skill is now available in Amp.${colors.reset}`);
      break;
    case "vscode":
    case "copilot":
      log(`${colors.dim}Installed in .github/skills/ for this project.${colors.reset}`);
      break;
    case "project":
      log(`${colors.dim}Installed in .skills/ in the current directory.${colors.reset}`);
      break;
    default:
      log(`${colors.dim}The skill is ready to use with ${agent}.${colors.reset}`);
  }
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

  log(`\nInstall: ${colors.cyan}npx codex-skills install <skill-name> [--agent <agent>]${colors.reset}`);
  log(`Install by category: ${colors.cyan}npx codex-skills install-category <category> [--agent <agent>]${colors.reset}`);
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
  log(`  npx codex-skills install ${skill.name} --agent cursor`);
}

function showHelp() {
  log(`
${colors.bold}Codex Skills${colors.reset}
Install skills for Codex and compatible agents.

${colors.bold}Usage:${colors.reset}
  npx codex-skills <command> [options]

${colors.bold}Commands:${colors.reset}
  ${colors.green}list${colors.reset}                          List all available skills
  ${colors.green}install <name>${colors.reset}                Install a skill   
  ${colors.green}install-category <category>${colors.reset}   Install all skills in a category
  ${colors.green}search <query>${colors.reset}               Search skills      
  ${colors.green}info <name>${colors.reset}                  Show skill details 
  ${colors.green}help${colors.reset}                          Show this help    

${colors.bold}Options:${colors.reset}
  --agent <agent>             Target agent (default: codex)
  --ref <ref>                 Use a Git ref (tag or branch). Default: latest release
  --force                     Overwrite if the skill already exists
  --json                      Output JSON for list

${colors.bold}Agents:${colors.reset}
  ${colors.cyan}codex${colors.reset}   ~/.codex/skills/ (default)
  ${colors.cyan}claude${colors.reset}  ~/.claude/skills/
  ${colors.cyan}cursor${colors.reset}  .cursor/skills/ in current project
  ${colors.cyan}amp${colors.reset}     ~/.amp/skills/
  ${colors.cyan}vscode${colors.reset}  .github/skills/ in current project
  ${colors.cyan}copilot${colors.reset} .github/skills/ (alias for vscode)
  ${colors.cyan}project${colors.reset} .skills/ in current directory (portable)
  ${colors.cyan}goose${colors.reset}   ~/.config/goose/skills/
  ${colors.cyan}opencode${colors.reset} ~/.opencode/skills/

${colors.bold}Examples:${colors.reset}
  npx codex-skills list
  npx codex-skills search browser
  npx codex-skills install agents-md
  npx codex-skills install-category development
  npx codex-skills install agents-md --ref main
`);
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
    log("Usage: npx codex-skills install <skill-name> [--agent <agent>] [--ref <ref>] [--force]");
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

  const destDir = AGENT_PATHS[options.agent] || AGENT_PATHS[DEFAULT_AGENT];     
  if (!destDir) {
    error(`Unknown agent: ${options.agent}`);
    return;
  }

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
    showAgentInstructions(options.agent, skill.name, result.path);
  });
}

async function installCategoryCommand(options) {
  if (!options.param) {
    error("Please specify a category.");
    log("Usage: npx codex-skills install-category <category> [--agent <agent>] [--ref <ref>] [--force]");
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

  const destDir = AGENT_PATHS[options.agent] || AGENT_PATHS[DEFAULT_AGENT];
  if (!destDir) {
    error(`Unknown agent: ${options.agent}`);
    return;
  }

  let installedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  await withRepoRoot(resolved.ref, async (repoRoot) => {
    for (const skill of categorySkills) {
      try {
        const result = installSkillFromRepo(skill, repoRoot, destDir, { force: options.force });
        if (result.status === "exists") {
          warn(`Skipping ${skill.name} (already installed). Use --force to overwrite.`);
          skippedCount += 1;
          continue;
        }

        installedCount += 1;
        success(`Installed: ${skill.name}`);
        showAgentInstructions(options.agent, skill.name, result.path);
      } catch (err) {
        failedCount += 1;
        error(`Failed to install ${skill.name}: ${err.message || err}`);
      }
    }
  });

  info(`Ref: ${resolved.ref}`);
  log(`\n${colors.bold}Summary:${colors.reset} installed ${installedCount}, skipped ${skippedCount}, failed ${failedCount}.`);
  if (failedCount > 0) {
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const parsed = parseArgs(args);
  const command = parsed.command || "help";

  try {
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
      case "search":
      case "s":
        await searchCommand(parsed);
        break;
      case "info":
        await infoCommand(parsed);
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
