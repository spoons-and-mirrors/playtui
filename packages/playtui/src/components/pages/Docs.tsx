import { useState, useRef } from "react"
import { COLORS } from "../../theme"
import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import type { ScrollBoxRenderable } from "@opentui/core"

const __dirname = dirname(fileURLToPath(import.meta.url))
const docsContent = readFileSync(join(__dirname, "../../docs.md"), "utf-8")

interface DocLine {
  type: "heading" | "subheading" | "h3" | "text" | "table-header" | "table-row" | "list" | "divider" | "empty" | "code" | "code-block"
  content: string
  key?: string
  action?: string
}

interface TocEntry {
  title: string
  level: number
  index: number
}

function parseMarkdown(md: string): { lines: DocLine[]; toc: TocEntry[] } {
  const rawLines = md.split("\n")
  const lines: DocLine[] = []
  const toc: TocEntry[] = []
  let inCodeBlock = false
  let codeBlockContent = ""

  for (const line of rawLines) {
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        lines.push({ type: "code-block", content: codeBlockContent.trimEnd() })
        codeBlockContent = ""
        inCodeBlock = false
      } else {
        inCodeBlock = true
      }
      continue
    }

    if (inCodeBlock) {
      codeBlockContent += line + "\n"
      continue
    }

    if (line.startsWith("### ")) {
      const title = line.slice(4)
      toc.push({ title, level: 3, index: lines.length })
      lines.push({ type: "h3", content: title })
    } else if (line.startsWith("## ")) {
      const title = line.slice(3)
      toc.push({ title, level: 2, index: lines.length })
      lines.push({ type: "subheading", content: title })
    } else if (line.startsWith("# ")) {
      const title = line.slice(2)
      toc.push({ title, level: 1, index: lines.length })
      lines.push({ type: "heading", content: title })
    } else if (line.startsWith("| Key") || line.startsWith("| Mode") || line.startsWith("| Element") || line.startsWith("|---")) {
      continue
    } else if (line.startsWith("| ")) {
      const parts = line.split("|").filter(p => p.trim())
      if (parts.length >= 2) {
        lines.push({ type: "table-row", content: "", key: parts[0].trim(), action: parts[1].trim() })
      }
    } else if (line.startsWith("- ")) {
      lines.push({ type: "list", content: line.slice(2) })
    } else if (line.startsWith("---")) {
      lines.push({ type: "divider", content: "" })
    } else if (line.startsWith("*") && line.endsWith("*")) {
      lines.push({ type: "text", content: line.slice(1, -1) })
    } else if (line.trim() === "") {
      lines.push({ type: "empty", content: "" })
    } else if (line.includes("`")) {
      lines.push({ type: "code", content: line })
    } else {
      lines.push({ type: "text", content: line })
    }
  }

  return { lines, toc }
}

const { lines: parsedDocs, toc } = parseMarkdown(docsContent)

function renderInlineCode(text: string) {
  const parts = text.split(/(`[^`]+`)/)
  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return <span key={i} fg={COLORS.accent}>{part.slice(1, -1)}</span>
    }
    return <span key={i}>{part}</span>
  })
}

function TocItem({ entry, isSelected, onClick }: { entry: TocEntry; isSelected: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const indent = entry.level === 3 ? 2 : entry.level === 2 ? 1 : 0

  return (
    <box
      id={`toc-${entry.index}`}
      style={{
        paddingLeft: indent,
        backgroundColor: hovered ? COLORS.cardHover : isSelected ? COLORS.bgAlt : "transparent",
      }}
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
      onMouseUp={onClick}
    >
      <text fg={isSelected ? COLORS.accent : entry.level === 1 ? COLORS.text : COLORS.muted}>
        {entry.level === 1 ? <strong>{entry.title}</strong> : entry.title}
      </text>
    </box>
  )
}

export function DocsPanel() {
  const [selectedToc, setSelectedToc] = useState(0)
  const scrollRef = useRef<ScrollBoxRenderable>(null)

  const scrollToSection = (index: number) => {
    setSelectedToc(index)
    const targetLine = toc[index]?.index ?? 0
    const estimatedY = targetLine * 1.2
    scrollRef.current?.scrollTo(estimatedY)
  }

  return (
    <box
      id="docs-panel"
      style={{
        flexGrow: 1,
        backgroundColor: COLORS.bg,
        flexDirection: "row",
      }}
    >
      <box
        id="docs-toc"
        style={{
          width: 28,
          flexDirection: "column",
          paddingTop: 1,
          paddingLeft: 1,
          paddingRight: 1,
          borderColor: COLORS.border,
        }}
        border={["right"]}
      >
        <box style={{ marginBottom: 1 }}>
          <text fg={COLORS.accent}><strong>Contents</strong></text>
        </box>
        <scrollbox
          id="toc-scroll"
          style={{
            flexGrow: 1,
            contentOptions: { flexDirection: "column", gap: 0 },
            scrollbarOptions: { showArrows: false, trackOptions: { foregroundColor: "transparent", backgroundColor: "transparent" } },
          }}
        >
          {toc.map((entry, idx) => (
            <TocItem
              key={idx}
              entry={entry}
              isSelected={idx === selectedToc}
              onClick={() => scrollToSection(idx)}
            />
          ))}
        </scrollbox>
      </box>

      <box
        id="docs-content"
        style={{
          flexGrow: 1,
          flexDirection: "column",
          paddingTop: 1,
          paddingBottom: 2,
          paddingLeft: 2,
          paddingRight: 1,
        }}
      >
        <scrollbox
          id="docs-scroll"
          ref={scrollRef}
          style={{
            flexGrow: 1,
            contentOptions: { flexDirection: "column", gap: 0 },
            scrollbarOptions: { showArrows: false, trackOptions: { foregroundColor: COLORS.muted, backgroundColor: "transparent" } },
          }}
        >
          {parsedDocs.map((line, idx) => {
            switch (line.type) {
              case "heading":
                return (
                  <box key={idx} style={{ marginBottom: 1 }}>
                    <text fg={COLORS.accent}><strong>{line.content}</strong></text>
                  </box>
                )
              case "subheading":
                return (
                  <box key={idx} style={{ marginTop: 1, marginBottom: 0 }}>
                    <text fg={COLORS.accent}><strong>{line.content}</strong></text>
                  </box>
                )
              case "h3":
                return (
                  <box key={idx} style={{ marginTop: 1, paddingLeft: 1 }}>
                    <text fg={COLORS.accent}><strong>{line.content}</strong></text>
                  </box>
                )
              case "table-row":
                return (
                  <box key={idx} style={{ flexDirection: "row", paddingLeft: 1 }}>
                    <box style={{ width: 16 }}>
                      <text fg={COLORS.text}>{line.key}</text>
                    </box>
                    <text fg={COLORS.muted}>{line.action}</text>
                  </box>
                )
              case "list":
                return (
                  <box key={idx} style={{ paddingLeft: 1 }}>
                    <text fg={COLORS.muted}>• {renderInlineCode(line.content)}</text>
                  </box>
                )
              case "divider":
                return (
                  <box key={idx} style={{ marginTop: 1, marginBottom: 1 }}>
                    <text fg={COLORS.muted}>─────────────────────────────</text>
                  </box>
                )
              case "code":
                return (
                  <box key={idx}>
                    <text fg={COLORS.text}>{renderInlineCode(line.content)}</text>
                  </box>
                )
              case "code-block":
                return (
                  <box key={idx} style={{ backgroundColor: COLORS.bgAlt, paddingLeft: 1, paddingRight: 1, marginTop: 1, marginBottom: 1 }}>
                    <text fg={COLORS.muted}>{line.content}</text>
                  </box>
                )
              case "text":
                return (
                  <box key={idx}>
                    <text fg={COLORS.text}>{line.content}</text>
                  </box>
                )
              case "empty":
                return <box key={idx} style={{ height: 1 }} />
              default:
                return null
            }
          })}
        </scrollbox>
      </box>
    </box>
  )
}
