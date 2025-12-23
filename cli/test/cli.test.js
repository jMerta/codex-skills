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
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

test("help lists verify and init-ledger", () => {
  const result = runCli(["help"]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /init-ledger/);
  assert.match(result.stdout, /verify <name>/);
});

test("verify succeeds for a well-formed skill", () => {
  withTempDir((tempDir) => {
    const skillDir = path.join(tempDir, ".skills", "agents-md");
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, "SKILL.md"),
      "---\nname: agents-md\ndescription: Test skill\n---\n\n# Sample\n",
      "utf8"
    );

    const result = runCli(["verify", "agents-md", "--agent", "project"], {
      cwd: tempDir
    });

    assert.equal(result.status, 0);
    assert.match(result.stdout, /Verified: agents-md/);
  });
});

test("verify warns on name mismatch", () => {
  withTempDir((tempDir) => {
    const skillDir = path.join(tempDir, ".skills", "agents-md");
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, "SKILL.md"),
      "---\nname: other-skill\ndescription: Test skill\n---\n\n# Sample\n",
      "utf8"
    );

    const result = runCli(["verify", "agents-md", "--agent", "project"], {
      cwd: tempDir
    });

    assert.equal(result.status, 0);
    assert.match(result.stdout, /does not match/);
    assert.match(result.stdout, /Verified: agents-md/);
  });
});

test("verify reports missing skill directory", () => {
  withTempDir((tempDir) => {
    const result = runCli(["verify", "missing-skill", "--agent", "project"], {
      cwd: tempDir
    });

    assert.equal(result.status, 0);
    assert.match(result.stdout, /Skill not found/);
  });
});

test("verify reports missing SKILL.md", () => {
  withTempDir((tempDir) => {
    const skillDir = path.join(tempDir, ".skills", "missing-skill");
    fs.mkdirSync(skillDir, { recursive: true });

    const result = runCli(["verify", "missing-skill", "--agent", "project"], {
      cwd: tempDir
    });

    assert.equal(result.status, 0);
    assert.match(result.stdout, /Missing SKILL\.md/);
  });
});

test("verify reports missing frontmatter", () => {
  withTempDir((tempDir) => {
    const skillDir = path.join(tempDir, ".skills", "no-frontmatter");
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, "SKILL.md"), "# Missing frontmatter\n", "utf8");

    const result = runCli(["verify", "no-frontmatter", "--agent", "project"], {
      cwd: tempDir
    });

    assert.equal(result.status, 0);
    assert.match(result.stdout, /missing YAML frontmatter/i);
  });
});

test("verify reports missing name or description", () => {
  withTempDir((tempDir) => {
    const skillDir = path.join(tempDir, ".skills", "no-description");
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, "SKILL.md"),
      "---\nname: no-description\n---\n\n# Sample\n",
      "utf8"
    );

    const result = runCli(["verify", "no-description", "--agent", "project"], {
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
