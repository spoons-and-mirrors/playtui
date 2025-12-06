import { useState } from "react"
import { RGBA } from "@opentui/core"
import { COLORS } from "../theme"
import type { ProjectMeta } from "../lib/projectTypes"

type ModalMode = "new" | "load" | "delete"

interface ProjectModalProps {
  mode: ModalMode
  projects: ProjectMeta[]
  currentProjectName: string
  onClose: () => void
  onCreate: (name: string) => void
  onLoad: (fileName: string) => void
  onDelete: (fileName: string) => void
  width: number
  height: number
}

export function ProjectModal({
  mode,
  projects,
  currentProjectName,
  onClose,
  onCreate,
  onLoad,
  onDelete,
  width,
  height,
}: ProjectModalProps) {
  const [inputValue, setInputValue] = useState("")
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const titles: Record<ModalMode, string> = {
    new: "New Project",
    load: "Load Project",
    delete: "Delete Project",
  }

  const modalWidth = Math.min(50, width - 10)
  const modalHeight = Math.min(20, height - 6)

  const handleCreate = () => {
    const name = inputValue.trim()
    if (name) {
      onCreate(name)
    }
  }

  const handleDelete = (fileName: string) => {
    if (confirmDelete === fileName) {
      onDelete(fileName)
      setConfirmDelete(null)
    } else {
      setConfirmDelete(fileName)
    }
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <box
      position="absolute"
      left={0}
      top={0}
      style={{
        width,
        height,
        backgroundColor: RGBA.fromInts(0, 0, 0, 180),
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
      }}
      onMouseDown={onClose}
    >
      <box
        border
        borderStyle="rounded"
        borderColor={COLORS.accent}
        title={titles[mode]}
        style={{
          width: modalWidth,
          height: modalHeight,
          backgroundColor: COLORS.card,
          flexDirection: "column",
          padding: 1,
          gap: 1,
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* New Project Mode */}
        {mode === "new" && (
          <>
            <text fg={COLORS.text}>Enter project name:</text>
            <box
              border
              borderColor={COLORS.borderFocus}
              style={{ backgroundColor: COLORS.input, padding: 0 }}
            >
              <input
                value={inputValue}
                placeholder="My Project"
                focused
                onInput={setInputValue}
                onSubmit={handleCreate}
              />
            </box>
            <box style={{ flexDirection: "row", gap: 2, justifyContent: "flex-end", marginTop: 1 }}>
              <box
                onMouseDown={onClose}
                style={{ backgroundColor: COLORS.muted, paddingLeft: 2, paddingRight: 2 }}
              >
                <text fg={COLORS.bg}>Cancel</text>
              </box>
              <box
                onMouseDown={handleCreate}
                style={{ backgroundColor: COLORS.success, paddingLeft: 2, paddingRight: 2 }}
              >
                <text fg={COLORS.bg}>Create</text>
              </box>
            </box>
          </>
        )}

        {/* Load Project Mode */}
        {mode === "load" && (
          <>
            {projects.length === 0 ? (
              <text fg={COLORS.muted}>No projects found</text>
            ) : (
              <scrollbox
                style={{
                  flexGrow: 1,
                  contentOptions: { flexDirection: "column" },
                }}
              >
                {projects.map((proj, idx) => (
                  <box
                    key={proj.fileName}
                    onMouseDown={() => {
                      setSelectedIdx(idx)
                      onLoad(proj.fileName)
                    }}
                    onMouseOver={() => setHoveredIdx(idx)}
                    onMouseOut={() => setHoveredIdx(null)}
                    style={{
                      backgroundColor:
                        selectedIdx === idx
                          ? COLORS.cardHover
                          : hoveredIdx === idx
                            ? COLORS.bgAlt
                            : "transparent",
                      paddingLeft: 1,
                      paddingRight: 1,
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <text fg={proj.name === currentProjectName ? COLORS.accent : COLORS.text}>
                      {proj.name}
                      {proj.name === currentProjectName && " (current)"}
                    </text>
                    <text fg={COLORS.muted}>{formatDate(proj.updatedAt)}</text>
                  </box>
                ))}
              </scrollbox>
            )}
            <box style={{ flexDirection: "row", gap: 2, justifyContent: "flex-end" }}>
              <box
                onMouseDown={onClose}
                style={{ backgroundColor: COLORS.muted, paddingLeft: 2, paddingRight: 2 }}
              >
                <text fg={COLORS.bg}>Cancel</text>
              </box>
            </box>
          </>
        )}

        {/* Delete Project Mode */}
        {mode === "delete" && (
          <>
            {projects.length === 0 ? (
              <text fg={COLORS.muted}>No projects found</text>
            ) : (
              <scrollbox
                style={{
                  flexGrow: 1,
                  contentOptions: { flexDirection: "column" },
                }}
              >
                {projects.map((proj) => {
                  const isCurrent = proj.name === currentProjectName
                  const isConfirming = confirmDelete === proj.fileName

                  return (
                    <box
                      key={proj.fileName}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingLeft: 1,
                        paddingRight: 1,
                        backgroundColor: isConfirming ? COLORS.dangerMuted + "40" : "transparent",
                      }}
                    >
                      <text fg={isCurrent ? COLORS.accent : COLORS.text}>
                        {proj.name}
                        {isCurrent && " (current)"}
                      </text>
                      {isCurrent ? (
                        <text fg={COLORS.muted}>-</text>
                      ) : isConfirming ? (
                        <box style={{ flexDirection: "row", gap: 1 }}>
                          <box
                            onMouseDown={() => setConfirmDelete(null)}
                            style={{ backgroundColor: COLORS.muted, paddingLeft: 1, paddingRight: 1 }}
                          >
                            <text fg={COLORS.bg}>No</text>
                          </box>
                          <box
                            onMouseDown={() => handleDelete(proj.fileName)}
                            style={{ backgroundColor: COLORS.danger, paddingLeft: 1, paddingRight: 1 }}
                          >
                            <text fg={COLORS.bg}>Yes</text>
                          </box>
                        </box>
                      ) : (
                        <box
                          onMouseDown={() => handleDelete(proj.fileName)}
                          style={{ backgroundColor: COLORS.danger, paddingLeft: 1, paddingRight: 1 }}
                        >
                          <text fg={COLORS.bg}>Del</text>
                        </box>
                      )}
                    </box>
                  )
                })}
              </scrollbox>
            )}
            <box style={{ flexDirection: "row", gap: 2, justifyContent: "flex-end" }}>
              <box
                onMouseDown={onClose}
                style={{ backgroundColor: COLORS.muted, paddingLeft: 2, paddingRight: 2 }}
              >
                <text fg={COLORS.bg}>Close</text>
              </box>
            </box>
          </>
        )}
      </box>
    </box>
  )
}
