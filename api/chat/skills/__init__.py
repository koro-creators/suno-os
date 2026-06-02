"""
Skill Loader — carrega SKILL.md + references/ para cada skill do sunOS.

Cada skill é um diretório com:
  skills/<slug>/SKILL.md          — overview, quando usar, tools
  skills/<slug>/references/*.md   — domain knowledge files
"""

from dataclasses import dataclass, field
from pathlib import Path

SKILLS_DIR = Path(__file__).parent


@dataclass
class SkillContent:
    """Loaded skill content."""

    slug: str
    overview: str
    references: list[str] = field(default_factory=list)


class SkillLoader:
    """Loads skill directories into structured content for agents."""

    def __init__(self, skills_dir: Path = SKILLS_DIR):
        self._skills_dir = skills_dir

    def load(self, skill_slug: str) -> SkillContent | None:
        """Load a skill by slug. Returns None if skill not found."""
        skill_dir = self._skills_dir / skill_slug
        skill_md = skill_dir / "SKILL.md"

        if not skill_md.exists():
            return None

        overview = skill_md.read_text(encoding="utf-8")
        references: list[str] = []

        ref_dir = skill_dir / "references"
        if ref_dir.exists():
            for f in sorted(ref_dir.glob("*.md")):
                references.append(f.read_text(encoding="utf-8"))

        return SkillContent(slug=skill_slug, overview=overview, references=references)

    def list_skills(self) -> list[str]:
        """List all available skill slugs."""
        return [
            d.name for d in self._skills_dir.iterdir() if d.is_dir() and (d / "SKILL.md").exists()
        ]


def load_skill_reference(skill_slug: str, ref_name: str) -> str | None:
    """Load a single reference file from a skill directory."""
    ref_path = SKILLS_DIR / skill_slug / "references" / f"{ref_name}.md"
    if ref_path.exists():
        return ref_path.read_text(encoding="utf-8")
    return None


# Singleton loader
skill_loader = SkillLoader()
