import { describe, it, expect } from 'vitest'
import { parseTML } from '../src'
import {
  BlockNode,
  CommentNode,
  ValueNode,
  Attribute,
  StringValue,
} from '../src/types'

describe('Inline Multiline Block Comment', () => {
  it('should correctly parse a block with attribute, multiline block comment, and value', () => {
    const input = `description class="a" /* This is a block comment
    that spans multiple lines */: "value"`

    // Parse the input
    const result = parseTML(input)

    // There should be one block
    expect(result.length).toBe(1)

    // The block should be a description block
    const block = result[0] as BlockNode
    expect(block.type).toBe('Block')
    expect(block.name).toBe('description')

    // The block should have 3 children: attribute, comment, and value
    expect(block.children.length).toBe(3)

    // Check the attribute
    const attribute = block.children.find(
      child => child.type === 'Attribute'
    ) as Attribute
    expect(attribute).toBeDefined()
    expect(attribute.key).toBe('class')
    expect(attribute.value.type).toBe('string')
    expect((attribute.value as StringValue).value).toBe('a')

    // Check the comment
    const comment = block.children.find(
      child => child.type === 'Comment'
    ) as CommentNode
    expect(comment).toBeDefined()
    expect(comment.isLineComment).toBe(false)
    expect(comment.value).toBe(
      'This is a block comment\n    that spans multiple lines'
    )

    // Check the value
    const value = block.children.find(
      child => child.type === 'Value'
    ) as ValueNode
    expect(value).toBeDefined()
    expect(value.value.type).toBe('string')
    expect((value.value as StringValue).value).toBe('value')
  })
})
