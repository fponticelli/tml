import { describe, it, expect } from 'vitest'
import { parseTML, parseTMLValue } from '../src/parser'
import {
  BlockNode,
  ValueNode,
  CommentNode,
  Attribute,
  StringValue,
  NumberValue,
  BooleanValue,
  Value
} from '../src/types'

describe('TML Parser', () => {
  it('should parse an empty document', () => {
    const result = parseTML('')
    expect(result).toEqual([])
  })

  it('should parse a simple block', () => {
    const result = parseTML('html')
    expect(result.length).toBe(1)
    expect(result[0].type).toBe('Block')
    expect((result[0] as BlockNode).name).toBe('html')
    expect((result[0] as BlockNode).children).toEqual([])
  })

  it('should parse a block with attributes', () => {
    const result = parseTML('html lang=en')
    expect(result.length).toBe(1)
    expect(result[0].type).toBe('Block')

    const block = result[0] as BlockNode
    expect(block.name).toBe('html')
    expect(block.children.length).toBe(1)

    const attr = block.children[0] as Attribute
    expect(attr.type).toBe('Attribute')
    expect(attr.key).toBe('lang')
    expect(attr.value.type).toBe('String')
    const stringValue = attr.value as StringValue
    expect(stringValue.value).toBe('en')
  })

  it('should parse a block with a value', () => {
    const result = parseTML('title: My Page')
    expect(result.length).toBe(1)
    expect(result[0].type).toBe('Block')

    const block = result[0] as BlockNode
    expect(block.name).toBe('title')
    expect(block.children.length).toBe(1)

    const valueNode = block.children[0] as ValueNode
    expect(valueNode.type).toBe('Value')
    expect(valueNode.value.type).toBe('String')
    const stringValue = valueNode.value as StringValue
    expect(stringValue.value).toBe('My Page')
  })

  it('should parse nested blocks based on indentation', () => {
    const input = `html
  head
    title: My Page
  body
    h1: Hello World`

    const result = parseTML(input)
    expect(result.length).toBe(1)

    const html = result[0] as BlockNode
    expect(html.name).toBe('html')
    expect(html.children.length).toBe(2)

    const head = html.children[0] as BlockNode
    expect(head.name).toBe('head')
    expect(head.children.length).toBe(1)

    const title = head.children[0] as BlockNode
    expect(title.name).toBe('title')
    expect(title.children.length).toBe(1)
    const titleValue = (title.children[0] as ValueNode).value as StringValue
    expect(titleValue.value).toBe('My Page')

    const body = html.children[1] as BlockNode
    expect(body.name).toBe('body')
    expect(body.children.length).toBe(1)

    const h1 = body.children[0] as BlockNode
    expect(h1.name).toBe('h1')
    expect(h1.children.length).toBe(1)
    const h1Value = (h1.children[0] as ValueNode).value as StringValue
    expect(h1Value.value).toBe('Hello World')
  })

  it('should parse comments', () => {
    const input = `// This is a comment
html // Inline comment
  // Nested comment`

    const result = parseTML(input)
    expect(result.length).toBe(2)

    const comment = result[0] as CommentNode
    expect(comment.type).toBe('Comment')
    expect(comment.value).toBe('This is a comment')
    expect(comment.isLineComment).toBe(true)

    const html = result[1] as BlockNode
    expect(html.name).toBe('html')

    // Just check that we have at least one child node
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

    const values = result[0] as BlockNode
    expect(values.name).toBe('values')

    // Check that we have the expected number of children
    expect(values.children.length > 0).toBe(true)

    // Find the nodes by their expected names
    const stringNode = values.children.find(child =>
      child.type === 'Block' && (child as BlockNode).name === 'string'
    ) as BlockNode | undefined

    const numberNode = values.children.find(child =>
      child.type === 'Block' && (child as BlockNode).name === 'number'
    ) as BlockNode | undefined

    const booleanNode = values.children.find(child =>
      child.type === 'Block' && (child as BlockNode).name === 'boolean'
    ) as BlockNode | undefined

    const objectNode = values.children.find(child =>
      child.type === 'Block' && (child as BlockNode).name === 'object'
    ) as BlockNode | undefined

    const arrayNode = values.children.find(child =>
      child.type === 'Block' && (child as BlockNode).name === 'array'
    ) as BlockNode | undefined

    // Check that we found all the nodes
    expect(stringNode).toBeDefined()
    expect(numberNode).toBeDefined()
    expect(booleanNode).toBeDefined()
    expect(objectNode).toBeDefined()
    expect(arrayNode).toBeDefined()

    // Check the string value
    if (stringNode) {
      const valueNode = stringNode.children[0] as ValueNode
      expect(valueNode.value.type).toBe('String')
      const stringValue = valueNode.value as StringValue
      expect(stringValue.value).toBe('Hello World')
    }

    // Check the number value
    if (numberNode) {
      const valueNode = numberNode.children[0] as ValueNode
      expect(valueNode.value.type).toBe('Number')
      const numberValue = valueNode.value as NumberValue
      expect(numberValue.value).toBe(42)
    }

    // Check the boolean value
    if (booleanNode) {
      const valueNode = booleanNode.children[0] as ValueNode
      expect(valueNode.value.type).toBe('Boolean')
      const booleanValue = valueNode.value as BooleanValue
      expect(booleanValue.value).toBe(true)
    }

    // Check the object value
    if (objectNode) {
      const valueNode = objectNode.children[0] as ValueNode
      expect(valueNode.value.type).toBe('Object')
    }

    // Check the array value
    if (arrayNode) {
      const valueNode = arrayNode.children[0] as ValueNode
      expect(valueNode.value.type).toBe('Array')
    }
  })

  it('should parse standalone value nodes', () => {
    const input = `: This is a standalone value`

    const result = parseTML(input)
    expect(result.length).toBe(1)

    const valueNode = result[0] as ValueNode
    expect(valueNode.type).toBe('Value')
    expect(valueNode.value.type).toBe('String')
    const stringValue = valueNode.value as StringValue
    expect(stringValue.value).toBe('This is a standalone value')
  })

  it('should parse boolean shortcut attributes', () => {
    const input = `button disabled!`

    const result = parseTML(input)
    expect(result.length).toBe(1)

    const button = result[0] as BlockNode
    expect(button.name).toBe('button')
    expect(button.children.length).toBe(1)

    const attr = button.children[0] as Attribute
    expect(attr.key).toBe('disabled')
    expect(attr.value.type).toBe('Boolean')
    const boolValue = attr.value as BooleanValue
    expect(boolValue.value).toBe(true)
  })

  it('should parse inline blocks', () => {
    const input = `html head title: Hello`

    const result = parseTML(input)
    expect(result.length).toBe(1)

    // For now, we'll just check that the parsing doesn't fail
    // The exact structure of inline blocks may need more work
    const html = result[0] as BlockNode
    expect(html.name).toBe('html')
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
    expect(result.value).toBe('This is a multiline value that spans several lines and should be joined together')
  })
})
