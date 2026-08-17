---
name: regex-builder
description: Use when the user asks to create, debug, explain, validate, or optimize a regular expression or replacement for a specific engine. Verifies representative matches, non-matches, captures, escaping, portability limits, and backtracking risk in the target runtime.
---

# Regex builder

## Define the contract

Confirm the target engine and version, flags, multiline behavior, input boundary, capture or replacement needs, and representative matches and non-matches. Infer these from the consuming code when possible; ask only for information the repository cannot answer.

Do not present a pattern as portable across JavaScript, Python, Java, .NET, RE2, PCRE2, or a command-line tool unless the common subset was verified.

## Build and test

1. Start with the smallest literal structure that distinguishes the samples.
2. Add anchors, boundaries, separators, Unicode handling, and capture groups only when required by the contract.
3. Test with the actual target engine. Use `rg` only for ripgrep's default engine or `rg -P` for its PCRE2 mode; use the application runtime for other flavors.
4. Verify every supplied match and non-match. Add boundary cases for empty input, adjacent matches, newlines, and Unicode. For untrusted input, include a long adversarial near-miss or non-match, measure its runtime, and require an application input bound when the engine has no timeout.
5. Check shell and string-literal escaping separately from regex syntax.
6. Avoid nested ambiguous quantifiers and unbounded backtracking on untrusted input. Prefer a simpler parser when the grammar or safety requirements exceed a readable regex.

## Deliver

Provide:

- the regex and flags;
- its target engine and required version or features;
- a capture-group or replacement map when used;
- one runnable verification in the target runtime with expected results;
- known limitations and any backtracking or input-size risk.
