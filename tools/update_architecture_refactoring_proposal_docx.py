from __future__ import annotations

import datetime as _dt
import sys
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


@dataclass(frozen=True)
class UpdateResult:
    updated_paragraphs: int
    inserted_sections: int


def _replace_once(haystack: str, needle: str, replacement: str) -> tuple[str, int]:
    if needle not in haystack:
        return haystack, 0
    return haystack.replace(needle, replacement, 1), 1


def _xml_escape(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&apos;")
    )


def _p(text: str, style: str | None = None) -> str:
    ppr = f'<w:pPr><w:pStyle w:val="{style}"/></w:pPr>' if style else ""
    return (
        "<w:p>"
        f"{ppr}"
        "<w:r>"
        f'<w:t xml:space="preserve">{_xml_escape(text)}</w:t>'
        "</w:r>"
        "</w:p>"
    )


def _repo_root() -> Path:
    # tools/<script>.py -> repo root
    return Path(__file__).resolve().parents[1]


def _rel_paths(paths: Iterable[Path], root: Path) -> list[str]:
    seen: set[Path] = set()
    rel: list[str] = []
    for p in paths:
        try:
            rp = p.resolve()
        except FileNotFoundError:
            continue
        if rp in seen:
            continue
        seen.add(rp)
        try:
            rel.append(str(rp.relative_to(root)))
        except ValueError:
            rel.append(str(rp))
    return sorted(rel)


def _ai_agent_file_inventory(root: Path) -> list[str]:
    paths: list[Path] = []

    # Runtime entry points + primary backend surfaces.
    candidates = [
        root / "modules" / "livechat" / "src" / "Widget" / "HandleLatestUserMessage.php",
        root / "modules" / "livechat" / "src" / "Chats" / "CreateChatAsCustomer.php",
        root / "modules" / "ai" / "routes" / "api.php",
        root / "modules" / "ai" / "src" / "Controllers" / "AiAgentStatusController.php",
        root / "modules" / "ai" / "src" / "Controllers" / "AiAgentSettingsController.php",
        root / "modules" / "ai" / "src" / "Controllers" / "AiAgentsController.php",
    ]
    paths += [p for p in candidates if p.exists()]

    # Core AI engine classes.
    conv_dir = root / "modules" / "ai" / "src" / "AiAgent" / "Conversations"
    if conv_dir.exists():
        paths += sorted(conv_dir.glob("*.php"))

    # Frontend AI Agent module (two mirrored trees exist in this repo).
    for fe_dir in [
        root / "modules" / "ai" / "resources" / "client" / "ai-agent",
        root / "modules" / "ai" / "ai-agent",
    ]:
        if not fe_dir.exists():
            continue
        paths += sorted(fe_dir.rglob("*.tsx"))
        paths += sorted(fe_dir.rglob("*.ts"))

    return _rel_paths(paths, root)


def _insert_after_first(xml: str, marker: str, insert: str) -> tuple[str, int]:
    idx = xml.find(marker)
    if idx == -1:
        return xml, 0
    idx_end = idx + len(marker)
    return xml[:idx_end] + insert + xml[idx_end:], 1


def _insert_before_first(xml: str, marker: str, insert: str) -> tuple[str, int]:
    idx = xml.find(marker)
    if idx == -1:
        return xml, 0
    return xml[:idx] + insert + xml[idx:], 1


def _update_core_xml(core_xml: str, title_suffix: str) -> str:
    # Keep existing structure; only tweak title and modified timestamp.
    now = _dt.datetime.now(_dt.UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")

    # Best-effort: update <dc:title>...</dc:title> and <dcterms:modified ...>...</dcterms:modified>
    import re

    # Handle self-closing empty title first.
    if "<dc:title/>" in core_xml:
        core_xml = core_xml.replace(
            "<dc:title/>",
            f"<dc:title>{_xml_escape('Technical Documentation & Refactoring Architecture Proposal')}{_xml_escape(title_suffix)}</dc:title>",
            1,
        )

    def repl_title(m: re.Match[str]) -> str:
        inner = m.group(1)
        if title_suffix in inner:
            return m.group(0)
        if inner.strip() == "":
            return f"<dc:title>{_xml_escape('Technical Documentation & Refactoring Architecture Proposal')}{_xml_escape(title_suffix)}</dc:title>"
        return f"<dc:title>{inner}{_xml_escape(title_suffix)}</dc:title>"

    core_xml = re.sub(r"<dc:title>(.*?)</dc:title>", repl_title, core_xml, count=1, flags=re.S)
    core_xml = re.sub(
        r"(<dcterms:modified[^>]*>)(.*?)(</dcterms:modified>)",
        lambda m: m.group(1) + now + m.group(3),
        core_xml,
        count=1,
        flags=re.S,
    )
    return core_xml


def update_docx(input_path: Path, output_path: Path) -> UpdateResult:
    repo_root = _repo_root()

    with zipfile.ZipFile(input_path, "r") as zf:
        files = {name: zf.read(name) for name in zf.namelist()}

    doc_xml = files.get("word/document.xml", b"").decode("utf-8", "ignore")
    if not doc_xml:
        raise RuntimeError("Missing word/document.xml")

    updated = 0
    inserted = 0

    # 0) Align some component names with the current codebase (still conceptual, but avoid wrong names).
    # These appear in the architecture table and are safe to rename.
    if "AIIntentRouter" in doc_xml:
        doc_xml = doc_xml.replace("AIIntentRouter", "AIRoutingManager")
        updated += 1
    if "AIDepositFlowManager" in doc_xml:
        doc_xml = doc_xml.replace("AIDepositFlowManager", "AIDepositWithdrawManager")
        updated += 1
    if "AIResponseGenerator" in doc_xml:
        doc_xml = doc_xml.replace("AIResponseGenerator", "AIClientService")
        updated += 1

    # Fix the associated table descriptions where they match the previous wording.
    doc_xml, n = _replace_once(
        doc_xml,
        "Parses raw inbound text to classify semantic intents (e.g., deposit issues, withdrawal statuses, promo claims).",
        "Routes the conversation based on parsed content, intent classification, and JSON-envelope replies; coordinates coarse routing before response generation.",
    )
    updated += n
    doc_xml, n = _replace_once(
        doc_xml,
        "Owns the multi-step state machine for tracking deposit issues, managing screenshot/proof uploads, and resolving validation updates.",
        "Owns the multi-step state machine for deposit and withdrawal issues, including screenshot/proof uploads and BigMan verification.",
    )
    updated += n
    doc_xml, n = _replace_once(
        doc_xml,
        "Connects to upstream LLM providers (e.g., OpenAI endpoints). Handles structural retry rules, logging, and token usage optimization.",
        "Handles upstream LLM calls (OpenAI chat completions) used by routing/classification/rewrite managers; keeps shared client logic in one place.",
    )
    updated += n

    # 1) Fix outdated Chat Test capability (inspector panel was removed).
    doc_xml, n = _replace_once(
        doc_xml,
        "3. Localized Context Inspector Panel: Displays a lightweight structural side drawer detailing active configuration metadata, runtime parameters, selected model versions, and real-time state change flags.",
        "3. Agent picker + context summary: Shows a list of AI agents to select for testing, and a small context summary (selected agent, group, AI status) next to the preview.",
    )
    updated += n

    # 2) After the target-architecture table, add a mapping to the current codebase.
    mapping_section = "".join(
        [
            _p("2.1 Current Implementation Mapping (as of 2026-06-22)", "Heading2"),
            _p(
                "The table above is a target architecture. In the current codebase, these are the concrete classes in use:",
            ),
            _p("• DefaultAIBehaviorController: orchestrates a turn and delegates managers", "ListBullet"),
            _p("• AIRoutingManager: coarse routing and reply envelope handling", "ListBullet"),
            _p("• AIParsingManager: response parsing and safety fallbacks", "ListBullet"),
            _p("• AIClassifierManager: LLM-backed classification with retry handling", "ListBullet"),
            _p("• AIIntentManager: intent resolution and policy decisions", "ListBullet"),
            _p("• AIUserIdFlowManager: user-id collection and validation prompts", "ListBullet"),
            _p("• AIDepositWithdrawManager: deposit/withdraw states and BigMan integration", "ListBullet"),
            _p("• AISoftSellManager: soft-sell / rewrite behavior", "ListBullet"),
            _p("• AIGroupSettingsResolver: global + group override settings merge", "ListBullet"),
            _p("• AIGreetingAndPromptComposer: prompt composition and greeting selection", "ListBullet"),
            _p("• AIClientService: OpenAI chat-completion calls", "ListBullet"),
            _p(
                "Note: Some components in the target table (for example a standalone dispatcher or external gateway abstraction) are not separate classes yet and are handled inside the managers above.",
            ),
        ]
    )

    doc_xml, n = _insert_after_first(doc_xml, "</w:tbl>", mapping_section)
    inserted += n

    # 3) Append an explicit “missing/next” section at the end (before sectPr).
    inventory = _ai_agent_file_inventory(repo_root)
    next_section = "".join(
        [
            _p("11. Missing Items and Corrections", "Heading1"),
            _p(
                "This proposal has been updated to match the current implementation and UI. The remaining high-value items are:",
            ),
            _p("11.1 Remaining refactors", "Heading2"),
            _p(
                "• Extract reply parsing and routing further: consolidate parsing, coarse routing, and JSON-envelope routing into AIRoutingManager so GroupReplyEngine is orchestration-only.",
                "ListBullet",
            ),
            _p(
                "• Move remaining LLM-backed classifiers into AIClassifierManager (and keep retries/timeouts in one place).",
                "ListBullet",
            ),
            _p("11.2 Tests to add before further refactors", "Heading2"),
            _p("• AIUserIdFlowManager tests", "ListBullet"),
            _p("• AISoftSellManager tests", "ListBullet"),
            _p("• AIIntentManager tests", "ListBullet"),
            _p("• AIRoutingManager tests", "ListBullet"),
            _p("• GroupReplyEngine characterization tests for critical flows", "ListBullet"),
            _p("11.3 UI corrections", "Heading2"),
            _p(
                "• Chat Test no longer has a Preview Inspector panel. The correct behavior is: agent picker list + preview sidebar + reset test.",
                "ListBullet",
            ),
            _p(
                "• Status Connected definition: an agent is Connected only when it is enabled and currently serving an active widget conversation for its group.",
                "ListBullet",
            ),
            _p(
                "• Reports are accessed via the Analytics button (not as a primary navigation tab).",
                "ListBullet",
            ),
            _p("12. Files Involved (Appendix)", "Heading1"),
            _p(
                "This is an inventory of files directly involved in the AI Agent module (backend + frontend) for this refactor and UI.",
            ),
            _p(f"Total files listed: {len(inventory)}"),
        ]
    )
    for path in inventory:
        next_section += _p(path, "ListBullet")

    doc_xml, n = _insert_before_first(doc_xml, "<w:sectPr", next_section)
    inserted += n

    files["word/document.xml"] = doc_xml.encode("utf-8")

    core_xml_bytes = files.get("docProps/core.xml")
    if core_xml_bytes:
        core_xml = core_xml_bytes.decode("utf-8", "ignore")
        files["docProps/core.xml"] = _update_core_xml(core_xml, " (Updated 2026-06-22)").encode("utf-8")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for name, content in files.items():
            zf.writestr(name, content)

    return UpdateResult(updated_paragraphs=updated, inserted_sections=inserted)


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print("Usage: python3 tools/update_architecture_refactoring_proposal_docx.py <input.docx> <output.docx>")
        return 2

    inp = Path(argv[1]).expanduser().resolve()
    out = Path(argv[2]).expanduser().resolve()
    result = update_docx(inp, out)
    print(f"Wrote {out}")
    print(f"Updated paragraphs: {result.updated_paragraphs}")
    print(f"Inserted sections: {result.inserted_sections}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
