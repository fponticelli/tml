import { describe, it, expect } from 'vitest'
import { parseTML } from '../src'
import {
  assertBlockNode,
  assertValueNode,
  assertBlockWithStringValue,
  assertBlockHasAttribute,
  getStringValue,
  parseTMLAndGetFirstBlock,
  parseTMLAndAssertBlockCount,
} from './helpers'

describe('Basic TML Parser', () => {
  it('should parse an empty document', () => {
    const result = parseTMLAndAssertBlockCount('', 0)
    expect(result).toEqual([])
  })

  it('should parse a simple block', () => {
    parseTMLAndGetFirstBlock('html', 'html', 0)
  })

  it('should parse a block with one attribute', () => {
    const block = parseTMLAndGetFirstBlock('html lang=en', 'html', 1)
    assertBlockHasAttribute(block, 'lang', 'String', 'en')
  })

  it('should parse a block with a value', () => {
    const block = parseTMLAndGetFirstBlock('title: My Page', 'title', 1)
    assertBlockWithStringValue(block, 'My Page')
  })

  it('should parse boolean shortcut attributes', () => {
    const input = `button disabled!`

    const result = parseTML(input)
    expect(result.length).toBe(1)

    const button = assertBlockNode(result[0], 'button', 1)
    assertBlockHasAttribute(button, 'disabled', 'Boolean', true)
  })

  it('should parse standalone value nodes', () => {
    const input = `: This is a standalone value`

    const result = parseTML(input)
    expect(result.length).toBe(1)

    const valueNode = assertValueNode(result[0], 'String')
    expect(getStringValue(valueNode)).toBe('This is a standalone value')
  })
})
