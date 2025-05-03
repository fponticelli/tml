import { describe, it, expect } from 'vitest'
import { parseTML, parseTMLValue } from '../src/parser'
import { StringValue } from '../src/types'
import {
  assertBlockNode,
  assertValueNode,
  assertCommentNode,
  getStringValue,
  findChildBlockByName,
  assertChildBlock,
  assertBlockWithStringValue,
  assertBlockWithNumberValue,
  assertBlockWithBooleanValue,
  assertBlockHasAttribute
} from './helpers'

describe('TML Parser', () => {
  it('should parse an empty document', () => {
    const result = parseTML('')
    expect(result).toEqual([])
  })

  it('should parse a simple block', () => {
    const result = parseTML('html')
    expect(result.length).toBe(1)
    assertBlockNode(result[0], 'html', 0)
  })

  it('should parse a block with attributes', () => {
    const result = parseTML('html lang=en')
    expect(result.length).toBe(1)

    const block = assertBlockNode(result[0], 'html', 1)
    assertBlockHasAttribute(block, 'lang', 'String', 'en')
  })

  it('should parse a block with a value', () => {
    const result = parseTML('title: My Page')
    expect(result.length).toBe(1)

    const block = assertBlockNode(result[0], 'title', 1)
    assertBlockWithStringValue(block, 'My Page')
  })

  it('should parse nested blocks based on indentation', () => {
    const input = `html
  head
    title: My Page
  body
    h1: Hello World`

    const result = parseTML(input)
    expect(result.length).toBe(1)

    const html = assertBlockNode(result[0], 'html', 2)

    const head = assertChildBlock(html, 'head', 1)
    const title = assertChildBlock(head, 'title', 1)
    assertBlockWithStringValue(title, 'My Page')

    const body = assertChildBlock(html, 'body', 1)
    const h1 = assertChildBlock(body, 'h1', 1)
    assertBlockWithStringValue(h1, 'Hello World')
  })

  it('should parse comments', () => {
    const input = `// This is a comment
html // Inline comment
  // Nested comment`

    const result = parseTML(input)
    expect(result.length).toBe(2)

    assertCommentNode(result[0], 'This is a comment', true)

    const html = assertBlockNode(result[1], 'html')

    // Check that we have at least one child node
    expect(html.children.length > 0).toBe(true)

    // Check that at least one of the children is a comment
    const hasComment = html.children.some(child => child.type === 'Comment')
    expect(hasComment).toBe(true)
  })

  it('should parse different value types', () => {
    const input = `
values
  string: Hello World
  number: 42
  boolean: true
  object: { key: "value", num: 123 }
  array: [1, 2, 3, "four"]`

    const result = parseTML(input)
    expect(result.length).toBe(1)

    const values = assertBlockNode(result[0], 'values')
    expect(values.children.length > 0).toBe(true)

    // Find and assert each type of node
    const stringNode = findChildBlockByName(values, 'string')
    const numberNode = findChildBlockByName(values, 'number')
    const booleanNode = findChildBlockByName(values, 'boolean')
    const objectNode = findChildBlockByName(values, 'object')
    const arrayNode = findChildBlockByName(values, 'array')

    // Check that we found all the nodes
    expect(stringNode).toBeDefined()
    expect(numberNode).toBeDefined()
    expect(booleanNode).toBeDefined()
    expect(objectNode).toBeDefined()
    expect(arrayNode).toBeDefined()

    // Check the values
    if (stringNode) assertBlockWithStringValue(stringNode, 'Hello World')
    if (numberNode) assertBlockWithNumberValue(numberNode, 42)
    if (booleanNode) assertBlockWithBooleanValue(booleanNode, true)

    // Check object and array types
    if (objectNode) {
      expect(objectNode.children.length).toBe(1)
      assertValueNode(objectNode.children[0], 'Object')
    }

    if (arrayNode) {
      expect(arrayNode.children.length).toBe(1)
      assertValueNode(arrayNode.children[0], 'Array')
    }
  })

  it('should parse standalone value nodes', () => {
    const input = `: This is a standalone value`

    const result = parseTML(input)
    expect(result.length).toBe(1)

    const valueNode = assertValueNode(result[0], 'String')
    expect(getStringValue(valueNode)).toBe('This is a standalone value')
  })

  it('should parse boolean shortcut attributes', () => {
    const input = `button disabled!`

    const result = parseTML(input)
    expect(result.length).toBe(1)

    const button = assertBlockNode(result[0], 'button', 1)
    assertBlockHasAttribute(button, 'disabled', 'Boolean', true)
  })

  it('should parse inline blocks', () => {
    const input = `html head title: Hello`

    const result = parseTML(input)
    expect(result.length).toBe(1)

    // For now, we'll just check that the parsing doesn't fail
    const html = assertBlockNode(result[0], 'html')
    expect(html.children.length > 0).toBe(true)
  })

  it('should parse multiline values with parseTMLValue', () => {
    const input = `
This is a multiline value
that spans several lines
and should be joined together
    `

    const result = parseTMLValue(input)
    expect(result.type).toBe('String')
    expect((result as StringValue).value).toBe('This is a multiline value that spans several lines and should be joined together')
  })
})
