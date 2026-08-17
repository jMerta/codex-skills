import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]


class CreatePrPolicyTest(unittest.TestCase):
    def test_ready_for_review_is_the_default(self) -> None:
        skill = (REPO_ROOT / "create-pr" / "SKILL.md").read_text(encoding="utf-8")
        evidence = (REPO_ROOT / "create-pr" / "references" / "evidence-attachments.md").read_text(
            encoding="utf-8"
        )

        self.assertIn("# Ready for review (default)", skill)
        self.assertIn("draft: <false by default; true only when a draft was explicitly requested>", skill)
        self.assertNotIn("Create the PR as a draft", evidence)


if __name__ == "__main__":
    unittest.main()
