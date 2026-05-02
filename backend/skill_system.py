"""
JARVIS Skill System
Laedt Skills aus Ordnern mit SKILL.md Dateien.
Skills erweitern die Sub-Agenten um neue Faehigkeiten.

Struktur:
  jarvis_skills/
    kabelquerschnitt/
      SKILL.md          (Pflicht: YAML frontmatter + Anweisungen)
      berechnung.py     (Optional: ausfuehrbares Skript)
    vde_prueffristen/
      SKILL.md
      fristen.json      (Optional: Referenzdaten)

SKILL.md Format:
  ---
  name: Kabelquerschnitt berechnen
  description: Berechnet den Kabelquerschnitt nach VDE 0298-4
  agent: sap                    # welcher Agent den Skill nutzt (oder "all")
  trigger: kabelquerschnitt|querschnitt|kabel berechnen
  ---
  # Anweisungen fuer den Agenten
  Du kannst Kabelquerschnitte nach VDE 0298-4 berechnen...
"""

import re
import yaml
import subprocess
from pathlib import Path
from typing import Optional
from dataclasses import dataclass, field

SKILLS_DIR = Path(__file__).parent / "jarvis_skills"
SKILLS_DIR.mkdir(exist_ok=True)


@dataclass
class Skill:
    name:        str
    description: str
    agent:       str = "all"        # welcher Agent, oder "all"
    trigger:     str = ""           # regex pattern fuer Auto-Matching
    instructions:str = ""           # Markdown body
    path:        Path = field(default_factory=lambda: Path("."))
    scripts:     list = field(default_factory=list)
    references:  list = field(default_factory=list)


def parse_skill_md(filepath: Path) -> Optional[Skill]:
    """Parst eine SKILL.md Datei in ein Skill-Objekt."""
    try:
        content = filepath.read_text(encoding="utf-8")
    except Exception:
        return None

    # YAML frontmatter extrahieren
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)', content, re.DOTALL)
    if not match:
        return None

    try:
        meta = yaml.safe_load(match.group(1)) or {}
    except Exception:
        return None

    name = meta.get("name", filepath.parent.name)
    desc = meta.get("description", "")
    agent = meta.get("agent", "all")
    trigger = meta.get("trigger", "")
    instructions = match.group(2).strip()

    skill_dir = filepath.parent
    scripts = [str(f.relative_to(skill_dir)) for f in skill_dir.rglob("*.py")]
    scripts += [str(f.relative_to(skill_dir)) for f in skill_dir.rglob("*.ps1")]
    references = [str(f.relative_to(skill_dir)) for f in skill_dir.rglob("*.json")]
    references += [str(f.relative_to(skill_dir)) for f in skill_dir.rglob("*.txt")]
    references += [str(f.relative_to(skill_dir)) for f in skill_dir.rglob("*.csv")]

    return Skill(
        name=name, description=desc, agent=agent, trigger=trigger,
        instructions=instructions, path=skill_dir,
        scripts=scripts, references=references,
    )


class SkillManager:
    def __init__(self, skills_dir: Path = SKILLS_DIR):
        self.skills_dir = skills_dir
        self.skills: dict[str, Skill] = {}
        self.reload()

    def reload(self):
        """Alle Skills aus dem Verzeichnis laden."""
        self.skills = {}
        if not self.skills_dir.exists():
            return

        for skill_dir in self.skills_dir.iterdir():
            if not skill_dir.is_dir():
                continue
            skill_md = skill_dir / "SKILL.md"
            if not skill_md.exists():
                continue
            skill = parse_skill_md(skill_md)
            if skill:
                self.skills[skill.name] = skill

    def get_skills_for_agent(self, agent_name: str) -> list[Skill]:
        """Gibt alle Skills zurueck die fuer einen bestimmten Agenten gelten."""
        return [
            s for s in self.skills.values()
            if s.agent == "all" or s.agent == agent_name
        ]

    def match_skills(self, user_input: str) -> list[Skill]:
        """Findet Skills die zum User-Input passen (via trigger regex)."""
        matches = []
        lower = user_input.lower()
        for skill in self.skills.values():
            if skill.trigger:
                try:
                    if re.search(skill.trigger, lower):
                        matches.append(skill)
                except re.error:
                    if skill.trigger.lower() in lower:
                        matches.append(skill)
        return matches

    def get_skill_context(self, agent_name: str, user_input: str = "") -> str:
        """Generiert den Kontext-Block der in den System-Prompt injiziert wird."""
        agent_skills = self.get_skills_for_agent(agent_name)
        if not agent_skills:
            return ""

        # Matching Skills priorisieren
        matched = set()
        if user_input:
            for s in self.match_skills(user_input):
                matched.add(s.name)

        lines = ["\n--- VERFUEGBARE SKILLS ---"]
        for skill in agent_skills:
            is_match = skill.name in matched
            if is_match:
                # Volle Anweisungen fuer gematchte Skills
                lines.append(f"\n## SKILL: {skill.name}")
                lines.append(skill.instructions)
            else:
                # Nur Name + Beschreibung fuer nicht-gematchte
                lines.append(f"- {skill.name}: {skill.description}")

        lines.append("--- ENDE SKILLS ---\n")
        return "\n".join(lines)

    def execute_script(self, skill_name: str, script_name: str,
                       args: list[str] | None = None) -> dict:
        """Fuehrt ein Skript aus einem Skill aus."""
        args = args or []
        skill = self.skills.get(skill_name)
        if not skill:
            return {"error": f"Skill '{skill_name}' nicht gefunden"}

        script_path = skill.path / script_name
        if not script_path.exists():
            return {"error": f"Skript '{script_name}' nicht in Skill '{skill_name}'"}

        ext = script_path.suffix.lower()
        if ext == ".py":
            cmd = ["python", str(script_path)] + args
        elif ext == ".ps1":
            cmd = ["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass",
                   "-File", str(script_path)] + args
        else:
            return {"error": f"Unbekannter Skripttyp: {ext}"}

        try:
            r = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            return {
                "output": r.stdout.strip(),
                "error": r.stderr.strip() if r.returncode != 0 else "",
                "returncode": r.returncode,
            }
        except Exception as e:
            return {"error": str(e)}

    def load_reference(self, skill_name: str, ref_name: str) -> str:
        """Laedt eine Referenzdatei aus einem Skill."""
        skill = self.skills.get(skill_name)
        if not skill:
            return ""
        ref_path = skill.path / ref_name
        if not ref_path.exists():
            return ""
        try:
            return ref_path.read_text(encoding="utf-8")
        except Exception:
            return ""

    def create_skill(self, name: str, description: str, agent: str,
                     trigger: str, instructions: str) -> dict:
        """Erstellt einen neuen Skill."""
        slug = re.sub(r'[^a-z0-9_]', '_', name.lower().strip())
        skill_dir = self.skills_dir / slug
        skill_dir.mkdir(exist_ok=True)

        frontmatter = {
            "name": name,
            "description": description,
            "agent": agent,
            "trigger": trigger,
        }

        content = f"---\n{yaml.dump(frontmatter, allow_unicode=True, default_flow_style=False).strip()}\n---\n\n{instructions}"

        (skill_dir / "SKILL.md").write_text(content, encoding="utf-8")
        self.reload()
        return {"ok": True, "path": str(skill_dir), "name": name}

    def delete_skill(self, name: str) -> dict:
        """Loescht einen Skill."""
        skill = self.skills.get(name)
        if not skill:
            return {"error": f"Skill '{name}' nicht gefunden"}
        import shutil
        shutil.rmtree(skill.path)
        self.reload()
        return {"ok": True, "deleted": name}

    def list_skills(self) -> list[dict]:
        """Alle Skills als Liste."""
        return [
            {
                "name": s.name, "description": s.description,
                "agent": s.agent, "trigger": s.trigger,
                "scripts": s.scripts, "references": s.references,
                "path": str(s.path),
            }
            for s in self.skills.values()
        ]


# Singleton
_manager: Optional[SkillManager] = None

def get_skill_manager() -> SkillManager:
    global _manager
    if _manager is None:
        _manager = SkillManager()
    return _manager


# ── FastAPI Routes ────────────────────────────────────────────────────
def create_skills_router():
    from fastapi import APIRouter
    from pydantic import BaseModel
    router = APIRouter(tags=["skills"])

    class CreateSkillRequest(BaseModel):
        name: str
        description: str
        agent: str = "all"
        trigger: str = ""
        instructions: str = ""

    @router.get("/list")
    async def list_skills():
        return {"skills": get_skill_manager().list_skills()}

    @router.post("/create")
    async def create_skill(req: CreateSkillRequest):
        return get_skill_manager().create_skill(
            name=req.name, description=req.description,
            agent=req.agent, trigger=req.trigger,
            instructions=req.instructions,
        )

    @router.delete("/{skill_name}")
    async def delete_skill(skill_name: str):
        return get_skill_manager().delete_skill(skill_name)

    @router.post("/reload")
    async def reload_skills():
        get_skill_manager().reload()
        return {"ok": True, "count": len(get_skill_manager().skills)}

    @router.get("/{skill_name}")
    async def get_skill(skill_name: str):
        s = get_skill_manager().skills.get(skill_name)
        if not s:
            return {"error": "Nicht gefunden"}
        return {
            "name": s.name, "description": s.description,
            "agent": s.agent, "trigger": s.trigger,
            "instructions": s.instructions,
            "scripts": s.scripts, "references": s.references,
        }

    return router
