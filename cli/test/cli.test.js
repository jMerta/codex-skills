const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { spawnSync } = require("node:child_process");

const CLI_PATH = path.join(__dirname, "..", "bin", "codex-skills.js");

function runCli(args, options = {}) {
  const result = spawnSync(process.execPath, [CLI_PATH, ...args], {
    cwd: options.cwd,
    env: { ...process.env, ...options.env },
    encoding: "utf8"
  });
  if (result.error) {
    throw result.error;
  }
  return result;
}

function withTempDir(fn) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "codex-skills-test-"));
  try {
    return fn(tempDir);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
}

test("help lists verify, init-ledger, and install-agent-scripts", () => {
  const result = runCli(["help"]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /init-ledger/);
  assert.match(result.stdout, /verify <name>/);
  assert.match(result.stdout, /install-agent-scripts/);
});

test("--agent exits with a helpful error", () => {
  const result = runCli(["list", "--agent", "codex"]);
  assert.equal(result.status, 2);
  assert.match(result.stdout, /--agent flag has been removed/i);
});

test("verify succeeds for a well-formed skill", () => {
  withTempDir((tempDir) => {
    const skillsDir = path.join(tempDir, ".agents", "skills");
    const skillDir = path.join(skillsDir, "sample-skill");
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, "SKILL.md"),
      "---\nname: sample-skill\ndescription: Test skill\n---\n\n# Sample\n",
      "utf8"
    );

    const result = runCli(["verify", "sample-skill", "--dir", skillsDir], {
      cwd: tempDir
    });

    assert.equal(result.status, 0);
    assert.match(result.stdout, /Verified: sample-skill/);
  });
});

test("verify warns on name mismatch", () => {
  withTempDir((tempDir) => {
    const skillsDir = path.join(tempDir, ".agents", "skills");
    const skillDir = path.join(skillsDir, "sample-skill");
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, "SKILL.md"),
      "---\nname: other-skill\ndescription: Test skill\n---\n\n# Sample\n",
      "utf8"
    );

    const result = runCli(["verify", "sample-skill", "--dir", skillsDir], {
      cwd: tempDir
    });

    assert.equal(result.status, 0);
    assert.match(result.stdout, /does not match/);
    assert.match(result.stdout, /Verified: sample-skill/);
  });
});

test("verify reports missing skill directory", () => {
  withTempDir((tempDir) => {
    const skillsDir = path.join(tempDir, ".agents", "skills");
    const result = runCli(["verify", "missing-skill", "--dir", skillsDir], {
      cwd: tempDir
    });

    assert.equal(result.status, 0);
    assert.match(result.stdout, /Skill not found/);
  });
});

test("verify reports missing SKILL.md", () => {
  withTempDir((tempDir) => {
    const skillsDir = path.join(tempDir, ".agents", "skills");
    const skillDir = path.join(skillsDir, "missing-skill");
    fs.mkdirSync(skillDir, { recursive: true });

    const result = runCli(["verify", "missing-skill", "--dir", skillsDir], {
      cwd: tempDir
    });

    assert.equal(result.status, 0);
    assert.match(result.stdout, /Missing SKILL\.md/);
  });
});

test("verify reports missing frontmatter", () => {
  withTempDir((tempDir) => {
    const skillsDir = path.join(tempDir, ".agents", "skills");
    const skillDir = path.join(skillsDir, "no-frontmatter");
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, "SKILL.md"), "# Missing frontmatter\n", "utf8");

    const result = runCli(["verify", "no-frontmatter", "--dir", skillsDir], {
      cwd: tempDir
    });

    assert.equal(result.status, 0);
    assert.match(result.stdout, /missing YAML frontmatter/i);
  });
});

test("verify reports missing name or description", () => {
  withTempDir((tempDir) => {
    const skillsDir = path.join(tempDir, ".agents", "skills");
    const skillDir = path.join(skillsDir, "no-description");
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, "SKILL.md"),
      "---\nname: no-description\n---\n\n# Sample\n",
      "utf8"
    );

    const result = runCli(["verify", "no-description", "--dir", skillsDir], {
      cwd: tempDir
    });

    assert.equal(result.status, 0);
    assert.match(result.stdout, /must include non-empty name and description/);
  });
});

test("init-ledger warns about existing file and suggests --force", () => {
  withTempDir((tempDir) => {
    const codexRoot = path.join(tempDir, ".codex");
    fs.mkdirSync(codexRoot, { recursive: true });
    fs.writeFileSync(path.join(codexRoot, "AGENTS.MD"), "existing", "utf8");

    const result = runCli(["init-ledger"], {
      env: {
        USERPROFILE: tempDir,
        HOME: tempDir,
        HOMEDRIVE: "C:",
        HOMEPATH: tempDir
      }
    });

    assert.equal(result.status, 0);
    assert.match(result.stdout, /Ledger already exists/);
    assert.match(result.stdout, /Use --force to override the existing file\./);
  });
});
