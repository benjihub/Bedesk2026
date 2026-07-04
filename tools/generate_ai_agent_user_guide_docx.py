from __future__ import annotations

import datetime as _dt
import os
import zipfile
from pathlib import Path
from typing import Iterable, Optional

EMU_PER_INCH = 914400


def _xml_escape(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&apos;")
    )


def _p(text: str, style: Optional[str] = None) -> str:
    ppr = f'<w:pPr><w:pStyle w:val="{style}"/></w:pPr>' if style else ""
    # preserve spaces so "1. " and leading/trailing whitespace survive
    return (
        "<w:p>"
        f"{ppr}"
        "<w:r>"
        f'<w:t xml:space="preserve">{_xml_escape(text)}</w:t>'
        "</w:r>"
        "</w:p>"
    )


def _blank() -> str:
    return "<w:p/>"


def _image_paragraph(rel_id: str, name: str, cx: int, cy: int, docpr_id: int) -> str:
    # Minimal inline image drawing (enough for Word/LibreOffice to render).
    return f"""
<w:p>
  <w:r>
    <w:drawing>
      <wp:inline distT="0" distB="0" distL="0" distR="0">
        <wp:extent cx="{cx}" cy="{cy}"/>
        <wp:docPr id="{docpr_id}" name="{_xml_escape(name)}"/>
        <a:graphic>
          <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
            <pic:pic>
              <pic:nvPicPr>
                <pic:cNvPr id="0" name="{_xml_escape(name)}"/>
                <pic:cNvPicPr/>
              </pic:nvPicPr>
              <pic:blipFill>
                <a:blip r:embed="{rel_id}"/>
                <a:stretch><a:fillRect/></a:stretch>
              </pic:blipFill>
              <pic:spPr>
                <a:xfrm>
                  <a:off x="0" y="0"/>
                  <a:ext cx="{cx}" cy="{cy}"/>
                </a:xfrm>
                <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
              </pic:spPr>
            </pic:pic>
          </a:graphicData>
        </a:graphic>
      </wp:inline>
    </w:drawing>
  </w:r>
</w:p>
""".strip()


def _readme_paths(root: Path) -> list[tuple[str, str]]:
    return [
        ("Figure 1. AI Agent Status page", str(root / "01-status.png")),
        ("Figure 2. AI Agent list (Agents tab)", str(root / "02-agents.png")),
        ("Figure 3. AI Agent settings panels", str(root / "03-settings.png")),
        ("Figure 4. Chat Test with preview sidebar", str(root / "04-chat-test.png")),
    ]


def _build_document_xml(screenshots_dir: Path, image_rel_map: dict[str, str]) -> str:
    parts: list[str] = []

    parts.append(_p("AI Agent User Guide", style="Title"))
    parts.append(_p(f"Date: {_dt.date.today().isoformat()}"))
    parts.append(_blank())

    parts.append(_p("Overview", style="Heading1"))
    parts.append(
        _p(
            "This guide explains how to use the AI Agent module in the dashboard: "
            "Status, Agents, Settings, and Chat Test."
        )
    )
    parts.append(_blank())

    parts.append(_p("Navigation", style="Heading1"))
    parts.append(_p("Open the dashboard and go to: AI Agent"))
    parts.append(_p("Tabs: Status, Agents, Settings, Chat Test"))
    parts.append(_blank())

    parts.append(_p("Status (Live Status)", style="Heading1"))
    parts.append(
        _p(
            "Use Status to monitor each AI agent and see whether it is currently connected."
        )
    )
    parts.append(_p("What “Connected” means", style="Heading2"))
    parts.append(
        _p(
            "An AI agent is Connected when it is enabled and there is an active widget "
            "conversation being served by AI for that agent’s group."
        )
    )
    parts.append(_p("Summary cards", style="Heading2"))
    parts.append(_p("- Connected: agents currently serving an active widget conversation"))
    parts.append(_p("- Disconnected: paused agents or no active widget conversation"))
    parts.append(_p("- Average response time: average across recent runs (if available)"))
    parts.append(_p("- Token usage: token usage across recent runs (if available)"))
    parts.append(_p("Agent cards", style="Heading2"))
    parts.append(
        _p(
            "Each agent card shows status, status detail, last activity, basic metrics, "
            "and a Reconnect action for offline agents."
        )
    )
    parts.append(_blank())

    # Figures
    docpr_id = 1
    for caption, path_str in _readme_paths(screenshots_dir):
        parts.append(_p(caption, style="Caption"))
        file_path = Path(path_str)
        rel_id = image_rel_map.get(file_path.name)
        if rel_id:
            # Fixed size for predictability (approx 6.5" x 3.6")
            cx = int(6.5 * EMU_PER_INCH)
            cy = int(3.6 * EMU_PER_INCH)
            parts.append(_image_paragraph(rel_id, file_path.name, cx, cy, docpr_id))
            docpr_id += 1
        else:
            parts.append(
                _p(
                    f"[Screenshot missing: place file at {file_path.as_posix()} to embed it.]"
                )
            )
        parts.append(_blank())

    parts.append(_p("Agents (Create and Manage)", style="Heading1"))
    parts.append(_p("1. Go to AI Agent > Agents"))
    parts.append(_p("2. Click Add AI Agent"))
    parts.append(_p("3. Enter the agent name and assign a group if applicable"))
    parts.append(_p("4. Save"))
    parts.append(_blank())

    parts.append(_p("Settings (Behavior Configuration)", style="Heading1"))
    parts.append(_p("Settings can be Global or Group-specific."))
    parts.append(_p("Identity", style="Heading2"))
    parts.append(_p("Configure the agent name and avatar shown to customers."))
    parts.append(_p("Personality", style="Heading2"))
    parts.append(_p("Choose a tone of voice for AI generated messages."))
    parts.append(_p("Start of the conversation (Greeting)", style="Heading2"))
    parts.append(_p("Choose Basic greeting or start with a Flow."))
    parts.append(_p("If AI agent is unable to assist user", style="Heading2"))
    parts.append(_p("Add an optional instruction for fallback behavior."))
    parts.append(_p("Transfer to human", style="Heading2"))
    parts.append(_p("Choose Basic transfer or Custom instruction."))
    parts.append(_blank())

    parts.append(_p("Chat Test (Preview Mode)", style="Heading1"))
    parts.append(_p("Use Chat Test to test behavior without touching the live inbox flow."))
    parts.append(_p("1. Open AI Agent > Chat Test"))
    parts.append(_p("2. Click an agent card to load its group configuration"))
    parts.append(_p("3. Use Reset test to start from a clean conversation"))
    parts.append(_blank())

    parts.append(_p("Troubleshooting", style="Heading1"))
    parts.append(_p("Disconnected while enabled can be normal if no active widget conversation exists."))
    parts.append(_p("If settings do not appear, confirm the correct group scope and click Save."))

    body = "\n".join(parts)

    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:body>
    {body}
    <w:sectPr/>
  </w:body>
</w:document>
""".strip()


def _content_types_xml(has_png: bool, has_jpg: bool) -> str:
    defaults = [
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
        '<Default Extension="xml" ContentType="application/xml"/>',
    ]
    if has_png:
        defaults.append('<Default Extension="png" ContentType="image/png"/>')
    if has_jpg:
        defaults.append('<Default Extension="jpg" ContentType="image/jpeg"/>')
        defaults.append('<Default Extension="jpeg" ContentType="image/jpeg"/>')

    overrides = [
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>',
        '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>',
        '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>',
    ]
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        + "".join(defaults)
        + "".join(overrides)
        + "</Types>"
    )


def _rels_xml(document_target: str = "word/document.xml") -> str:
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="{document_target}"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>
""".strip()


def _document_rels_xml(image_rels: list[tuple[str, str]]) -> str:
    rels = [
        f'<Relationship Id="{rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/{_xml_escape(target)}"/>'
        for rid, target in image_rels
    ]
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + "".join(rels)
        + "</Relationships>"
    )


def _core_xml(title: str) -> str:
    now = _dt.datetime.now(_dt.UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties
  xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:dcterms="http://purl.org/dc/terms/"
  xmlns:dcmitype="http://purl.org/dc/dcmitype/"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>{_xml_escape(title)}</dc:title>
  <dc:creator>LiveChat Dashboard</dc:creator>
  <cp:lastModifiedBy>LiveChat Dashboard</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">{now}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">{now}</dcterms:modified>
</cp:coreProperties>
""".strip()


def _app_xml() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties
  xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"
  xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Microsoft Office Word</Application>
</Properties>
""".strip()


def _detect_image_types(files: Iterable[Path]) -> tuple[bool, bool]:
    has_png = False
    has_jpg = False
    for f in files:
        suffix = f.suffix.lower()
        if suffix == ".png":
            has_png = True
        if suffix in (".jpg", ".jpeg"):
            has_jpg = True
    return has_png, has_jpg


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    screenshots_dir = repo_root / "docs" / "ai-agent" / "screenshots"
    out_path = repo_root / "docs" / "AI_Agent_User_Guide.docx"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    screenshots_dir.mkdir(parents=True, exist_ok=True)

    expected = [Path(p) for _, p in _readme_paths(screenshots_dir)]
    present = [p for p in expected if p.exists()]
    has_png, has_jpg = _detect_image_types(present)

    # Build image relationship ids in a stable order.
    image_rels: list[tuple[str, str]] = []
    image_rel_map: dict[str, str] = {}
    next_rid = 10
    next_img_index = 1
    for file_path in expected:
        if not file_path.exists():
            continue
        rid = f"rId{next_rid}"
        next_rid += 1
        target_name = f"image{next_img_index}{file_path.suffix.lower()}"
        next_img_index += 1
        image_rels.append((rid, target_name))
        image_rel_map[file_path.name] = rid

    document_xml = _build_document_xml(screenshots_dir, image_rel_map)

    with zipfile.ZipFile(out_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", _content_types_xml(has_png, has_jpg))
        zf.writestr("_rels/.rels", _rels_xml())
        zf.writestr("docProps/core.xml", _core_xml("AI Agent User Guide"))
        zf.writestr("docProps/app.xml", _app_xml())
        zf.writestr("word/document.xml", document_xml)
        zf.writestr("word/_rels/document.xml.rels", _document_rels_xml(image_rels))

        # Copy images into the docx if present.
        # Target names must match document.xml.rels above.
        for (rid, target_name), file_path in zip(image_rels, present, strict=False):
            zf.write(file_path, arcname=f"word/media/{target_name}")

    print(f"Wrote {out_path}")
    if not present:
        print("No screenshots found. Add PNGs to docs/ai-agent/screenshots and re-run to embed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
