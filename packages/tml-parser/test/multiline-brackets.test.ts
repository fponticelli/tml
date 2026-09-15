import { describe, it, expect } from 'vitest'
import { parseTML } from '../src'
import { BlockNode, ObjectValue, ArrayValue, ValueNode } from '../src/types'
import { assertBlockNode, findValueNode } from './helpers'

/**
 * Returns the value a block holds, failing the test when there is none.
 */
function valueOf(block: BlockNode): ValueNode {
  const valueNode = findValueNode(block)
  expect(valueNode).toBeDefined()
  return valueNode as ValueNode
}

/**
 * A `{}` or `[]` value may be written across several lines. The whole span is
 * one value, not one block per line.
 */
describe('Values that span several lines', () => {
  it('should parse an object written across several lines as one value', () => {
    const result = parseTML(`config: {
  name: "My App",
  version: 1.0,
  enabled: true
}`)

    expect(result.length).toBe(1)

    const config = assertBlockNode(result[0], 'config')
    const value = valueOf(config).value
    expect(value.type).toBe('Object')

    const fields = (value as ObjectValue).fields
    expect(
      fields.map(field => (field.type === 'Field' ? field.key : null))
    ).toEqual(['name', 'version', 'enabled'])
  })

  it('should parse an array written across several lines as one value', () => {
    const result = parseTML(`items: [
  "Item 1",
  "Item 2",
  "Item 3"
]`)

    expect(result.length).toBe(1)

    const value = valueOf(assertBlockNode(result[0], 'items')).value
    expect(value.type).toBe('Array')

    const elements = (value as ArrayValue).elements
    expect(elements.length).toBe(3)
  })

  it('should not leave the closing bracket behind as a block', () => {
    const result = parseTML(`items: [\n  1,\n  2\n]`)

    expect(result.length).toBe(1)
    expect((result[0] as BlockNode).name).toBe('items')
  })

  it('should treat commas as optional across lines', () => {
    const result = parseTML(`items: [\n  1\n  2\n  3\n]`)
    const value = valueOf(assertBlockNode(result[0], 'items')).value

    expect(value.type).toBe('Array')
    expect((value as ArrayValue).elements.length).toBe(3)
  })

  it('should parse structures nested inside each other', () => {
    const result = parseTML(`config: {
  server: {
    host: "localhost",
    ports: [
      80,
      443
    ]
  }
}`)

    const value = valueOf(assertBlockNode(result[0], 'config')).value
    expect(value.type).toBe('Object')

    const server = (value as ObjectValue).fields[0]
    expect(server.type).toBe('Field')
    if (server.type !== 'Field') return
    expect(server.key).toBe('server')
    expect(server.value.type).toBe('Object')

    const ports = (server.value as ObjectValue).fields.find(
      field => field.type === 'Field' && field.key === 'ports'
    )
    expect(ports?.type).toBe('Field')
    if (ports?.type !== 'Field') return
    expect(ports.value.type).toBe('Array')
    expect((ports.value as ArrayValue).elements.length).toBe(2)
  })

  it('should ignore brackets that sit inside a string', () => {
    const result = parseTML(`config: {
  pattern: "a ] and a } inside text",
  done: true
}`)

    expect(result.length).toBe(1)

    const value = valueOf(assertBlockNode(result[0], 'config')).value
    const fields = (value as ObjectValue).fields.filter(
      field => field.type === 'Field'
    )
    expect(fields.length).toBe(2)
  })

  it('should ignore brackets that sit inside a comment', () => {
    const result = parseTML(`items: [
  // a stray ] in a comment
  1,
  2
]`)

    expect(result.length).toBe(1)

    const value = valueOf(assertBlockNode(result[0], 'items')).value
    const elements = (value as ArrayValue).elements
    expect(elements.filter(el => el.type === 'Element').length).toBe(2)
    expect(elements.filter(el => el.type === 'Comment').length).toBe(1)
  })

  it('should keep the blocks that follow the closing bracket', () => {
    const result = parseTML(`config: {\n  a: 1\n}\nafter: "yes"`)

    expect(result.length).toBe(2)
    expect((result[0] as BlockNode).name).toBe('config')
    expect((result[1] as BlockNode).name).toBe('after')
  })

  it('should nest a spanning value under its parent block', () => {
    const result = parseTML(`page\n  config: {\n    a: 1\n  }\n  title: "Home"`)

    expect(result.length).toBe(1)

    const page = assertBlockNode(result[0], 'page')
    expect(page.children.length).toBe(2)
    expect((page.children[0] as BlockNode).name).toBe('config')
    expect((page.children[1] as BlockNode).name).toBe('title')
  })

  it('should parse a bare array at the top level as one value', () => {
    const result = parseTML(`[\n  1,\n  2\n]`)

    expect(result.length).toBe(1)
    expect(result[0].type).toBe('Value')
    expect((result[0] as ValueNode).value.type).toBe('Array')
  })

  it('should give each field the span of its own line', () => {
    const result = parseTML(`config: {\n  name: "My App",\n  version: 1.0\n}`)
    const value = valueOf(assertBlockNode(result[0], 'config')).value

    const fields = (value as ObjectValue).fields
    expect(fields[0].position?.start).toEqual({ line: 2, column: 2 })
    expect(fields[0].position?.end).toEqual({ line: 2, column: 16 })
    expect(fields[1].position?.start).toEqual({ line: 3, column: 2 })
    expect(fields[1].position?.end).toEqual({ line: 3, column: 14 })
  })
})
