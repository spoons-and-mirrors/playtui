import { RGBA } from '@opentui/core'
import { COLORS } from '../../theme'
// @ts-ignore - Bun supports JSON imports
import pkg from '../../../package.json'

const VERSION = pkg.version

// ============================================================================
// Title (Main Export)
// ============================================================================

interface TitleProps {
  onLogoClick: () => void
}

export function Title({ onLogoClick }: TitleProps) {
  return (
    <box
      id="title"
      style={{ alignItems: 'center', marginBottom: 1, flexDirection: 'column' }}
      onMouseDown={onLogoClick}
    >
      <ascii-font text="PLAYTUI" font="tiny" color={RGBA.fromHex('#4da8da')} />
      <box
        style={{
          width: 25,
          height: 1,
          flexDirection: 'row',
          justifyContent: 'flex-end',
        }}
      >
        <text fg="#d8dce5">v{VERSION}</text>
      </box>
      <box
        border={['bottom']}
        borderStyle="single"
        borderColor="#2a3545"
        style={{ width: 25, height: 0, flexDirection: 'column' }}
      />
    </box>
  )
}
