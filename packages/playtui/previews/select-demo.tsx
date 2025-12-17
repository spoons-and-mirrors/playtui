#!/usr/bin/env bun
import { createCliRenderer } from '@opentui/core'
import { createRoot, useKeyboard, useTerminalDimensions } from '@opentui/react'
import { useState } from 'react'

function App() {
  return (
    <box
      name="Box"
      border={['right']}
      borderStyle="heavy"
      borderColor="#a06bff"
      style={{
        width: 10,
        height: 1,
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        backgroundColor: '#f6b7a8',
      }}
    />
  )
}

const renderer = await createCliRenderer()
createRoot(renderer).render(<App />)
