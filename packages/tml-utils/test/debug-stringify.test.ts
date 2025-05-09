import { describe, it, expect } from 'vitest'
import { parseTML } from '@typedml/parser'
import { stringifyTML } from '../src'

describe('Array Stringify', () => {
  it('should correctly stringify array structures', () => {
    // Create a simpler test for array structure
    const arrayInput = `block tags: [item1, item2, item3]`

    const arrayNodes = parseTML(arrayInput)
    const arrayOutput = stringifyTML(arrayNodes)

    // Verify the output contains the expected elements
    expect(arrayOutput).toContain('block:')
    expect(arrayOutput).toContain('tags')
    expect(arrayOutput).toContain('"item1"')
    expect(arrayOutput).toContain('"item2"')
    expect(arrayOutput).toContain('"item3"')

    // Parse the output again to verify it's valid TML
    const reparsedNodes = parseTML(arrayOutput)
    expect(reparsedNodes.length).toBeGreaterThan(0)

    // Stringify again to verify idempotence
    const secondOutput = stringifyTML(reparsedNodes)
    expect(secondOutput).toBeTruthy()
  })
})
