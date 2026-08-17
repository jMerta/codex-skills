import tempfile
import unittest
from pathlib import Path

from scripts.validate_skills import load_mapping, validate_openai_yaml


class ValidateSkillsTest(unittest.TestCase):
    def test_rejects_non_string_mapping_keys(self) -> None:
        data, errors = load_mapping("name: ok\n1: value\n", "frontmatter")

        self.assertEqual(data, {})
        self.assertEqual(errors, ["frontmatter keys must be strings"])

    def test_requires_exact_skill_token(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            skill_dir = Path(temp_dir)
            agents_dir = skill_dir / "agents"
            agents_dir.mkdir()
            metadata = agents_dir / "openai.yaml"

            for prompt, valid in (("Use $foo.", True), ("Use $foobar.", False), ("Use $foo-bar.", False)):
                with self.subTest(prompt=prompt):
                    metadata.write_text(
                        "interface:\n"
                        "  display_name: Foo\n"
                        "  short_description: A valid short description for this skill\n"
                        f"  default_prompt: '{prompt}'\n",
                        encoding="utf-8",
                    )
                    errors = validate_openai_yaml(skill_dir, "foo")
                    self.assertEqual(errors == [], valid)


if __name__ == "__main__":
    unittest.main()
