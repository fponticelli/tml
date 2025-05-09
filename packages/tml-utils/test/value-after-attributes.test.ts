import { describe, it, expect } from 'vitest'
import { parseTML } from '@typedml/parser'
import { findNodeAtPosition, findNodeAtPositionWithIndex } from '../src'

describe('Value Node Position After Attributes', () => {
  it('should find a value node when it follows attributes', () => {
    // TML with a block that has attributes followed by a value
    const tml = 'div id=main class=container: This is a value'
    const nodes = parseTML(tml)

    // Position within the value part
    const position = { line: 1, column: 35 }

    // Get the expected result from the original implementation
    const originalNode = findNodeAtPosition(nodes, position)

    // Check that the original implementation finds a Value node
    expect(originalNode).toBeDefined()
    expect(originalNode?.type).toBe('Value')

    // Now check our new implementation
    const newNode = findNodeAtPositionWithIndex(nodes, position)

    // Check that the new implementation also finds a Value node
    expect(newNode).toBeDefined()
    expect(newNode?.type).toBe('Value')
  })

  it('should find a value node when it directly follows a block name', () => {
    // TML with a block that has a value directly after the name
    const tml = 'div: This is a value'
    const nodes = parseTML(tml)

    // Position within the value part
    const position = { line: 1, column: 10 }

    // Get the expected result from the original implementation
    const originalNode = findNodeAtPosition(nodes, position)

    // Check that the original implementation finds a Value node
    expect(originalNode).toBeDefined()
    expect(originalNode?.type).toBe('Value')

    // Now check our new implementation
    const newNode = findNodeAtPositionWithIndex(nodes, position)

    // Check that the new implementation also finds a Value node
    expect(newNode).toBeDefined()
    expect(newNode?.type).toBe('Value')
  })

  it('should find a value node when it is on a new line', () => {
    // TML with a standalone value node
    const tml = ': This is a standalone value'
    const nodes = parseTML(tml)

    // Position within the value part
    const position = { line: 1, column: 10 }

    // Get the expected result from the original implementation
    const originalNode = findNodeAtPosition(nodes, position)

    // Check that the original implementation finds a Value node
    expect(originalNode).toBeDefined()
    expect(originalNode?.type).toBe('Value')

    // Now check our new implementation
    const newNode = findNodeAtPositionWithIndex(nodes, position)

    // Check that the new implementation also finds a Value node
    expect(newNode).toBeDefined()
    expect(newNode?.type).toBe('Value')
  })
})
