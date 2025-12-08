import { COLORS } from "../../theme"
import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const docsContent = readFileSync(join(__dirname, "../../docs.md"), "utf-8")

interface DocLine {
  type: "heading" | "subheading" | "text" | "table-header" | "table-row" | "list" | "divider" | "empty"
  content: string
  key?: string
  action?: string
}

function parseMarkdown(md: string): DocLine[] {
  const lines = md.split("\n")
  const result: DocLine[] = []
  
  for (const line of lines) {
    if (line.startsWith("# ")) {
      result.push({ type: "heading", content: line.slice(2) })
    } else if (line.startsWith("## ")) {
      result.push({ type: "subheading", content: line.slice(3) })
    } else if (line.startsWith("| Key") || line.startsWith("|---")) {
      // Skip table headers and separators
      continue
    } else if (line.startsWith("| ")) {
      // Table row: | key | action |
      const parts = line.split("|").filter(p => p.trim())
      if (parts.length >= 2) {
        result.push({ type: "table-row", content: "", key: parts[0].trim(), action: parts[1].trim() })
      }
    } else if (line.startsWith("- ")) {
      result.push({ type: "list", content: line.slice(2) })
    } else if (line.startsWith("---")) {
      result.push({ type: "divider", content: "" })
    } else if (line.startsWith("*") && line.endsWith("*")) {
      result.push({ type: "text", content: line.slice(1, -1) })
    } else if (line.trim() === "") {
      result.push({ type: "empty", content: "" })
    } else {
      result.push({ type: "text", content: line })
    }
  }
  
  return result
}

const parsedDocs = parseMarkdown(docsContent)

export function DocsPanel() {
  return (
    <box
      id="docs-panel"
      style={{
        flexGrow: 1,
        backgroundColor: COLORS.bg,
        flexDirection: "column",
        paddingTop: 2,
        paddingBottom: 2,
        paddingLeft: 2,
        paddingRight: 0,
      }}
    >
      <scrollbox
        id="docs-scroll"
        style={{
          flexGrow: 1,
          contentOptions: { flexDirection: "column", gap: 0 },
          scrollbarOptions: { showArrows: false, trackOptions: { foregroundColor: "transparent", backgroundColor: "transparent" } },
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
            case "table-row":
              return (
                <box key={idx} style={{ flexDirection: "row", paddingLeft: 1 }}>
                  <box style={{ width: 22 }}>
                    <text fg={COLORS.text}>{line.key}</text>
                  </box>
                  <text fg={COLORS.muted}>{line.action}</text>
                </box>
              )
            case "list":
              return (
                <box key={idx} style={{ paddingLeft: 1 }}>
                  <text fg={COLORS.muted}>• {line.content}</text>
                </box>
              )
            case "divider":
              return (
                <box key={idx} style={{ marginTop: 1, marginBottom: 1 }}>
                  <text fg={COLORS.muted}>─────────────────────────────</text>
                </box>
              )
            case "text":
              return (
                <box key={idx}>
                  <text fg={COLORS.muted}>{line.content}</text>
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
  )
}
