import { describe, it, expect } from 'vitest'
import { parseTML } from '../src'
import {
  BlockNode,
  Node,
  Attribute,
  StringValue,
  BooleanValue,
  ValueNode,
} from '../src/types'
import {
  assertBlockNode,
  assertChildBlock,
  assertBlockWithStringValue,
  assertBlockHasAttributes,
  findValueNode,
  assertBlockChildCounts,
  parseAndAssertStructure,
} from './helpers'

describe('Nested TML Structures', () => {
  it('should parse nested blocks based on indentation', () => {
    const input = `html
  head
    title: My Page
  body
    h1: Hello World`

    parseAndAssertStructure(input, result => {
      expect(result.length).toBe(1)

      const html = assertBlockNode(result[0], 'html', 2)

      const head = assertChildBlock(html, 'head', 1)
      const title = assertChildBlock(head, 'title', 1)
      assertBlockWithStringValue(title, 'My Page')

      const body = assertChildBlock(html, 'body', 1)
      const h1 = assertChildBlock(body, 'h1', 1)
      assertBlockWithStringValue(h1, 'Hello World')
    })
  })

  it('should parse multiple attributes nested on multiple lines', () => {
    // Simplify the test to focus on the core functionality
    const formInput = `form
  input type=text id=username
  button type=submit disabled!`

    const result = parseTML(formInput)
    expect(result.length).toBeGreaterThan(0)

    // Find the form block
    const form = result.find(
      (node: Node) =>
        node.type === 'Block' && (node as BlockNode).name === 'form'
    ) as BlockNode

    expect(form).toBeDefined()

    if (form) {
      // Find the input element
      const input = form.children.find(
        (child: Node) =>
          child.type === 'Block' && (child as BlockNode).name === 'input'
      ) as BlockNode

      expect(input).toBeDefined()

      if (input) {
        // Check that input has type and id attributes
        const typeAttr = input.children.find(
          (child: Node) =>
            child.type === 'Attribute' && (child as Attribute).key === 'type'
        ) as Attribute

        const idAttr = input.children.find(
          (child: Node) =>
            child.type === 'Attribute' && (child as Attribute).key === 'id'
        ) as Attribute

        expect(typeAttr).toBeDefined()
        expect(idAttr).toBeDefined()

        if (typeAttr) {
          expect(typeAttr.value.type).toBe('string')
          expect((typeAttr.value as StringValue).value).toBe('text')
        }

        if (idAttr) {
          expect(idAttr.value.type).toBe('string')
          expect((idAttr.value as StringValue).value).toBe('username')
        }
      }

      // Find the button element
      const button = form.children.find(
        (child: Node) =>
          child.type === 'Block' && (child as BlockNode).name === 'button'
      ) as BlockNode

      expect(button).toBeDefined()

      if (button) {
        // Check that button has type and disabled attributes
        const typeAttr = button.children.find(
          (child: Node) =>
            child.type === 'Attribute' && (child as Attribute).key === 'type'
        ) as Attribute

        const disabledAttr = button.children.find(
          (child: Node) =>
            child.type === 'Attribute' &&
            (child as Attribute).key === 'disabled'
        ) as Attribute

        expect(typeAttr).toBeDefined()
        expect(disabledAttr).toBeDefined()

        if (typeAttr) {
          expect(typeAttr.value.type).toBe('string')
          expect((typeAttr.value as StringValue).value).toBe('submit')
        }

        if (disabledAttr) {
          expect(disabledAttr.value.type).toBe('boolean')
          expect((disabledAttr.value as BooleanValue).value).toBe(true)
        }
      }
    }
  })

  it('should parse attributes followed by a value node', () => {
    // Use a different approach with a newline
    const input = `div id=content class=wrapper
  : This is the content`

    const result = parseTML(input)
    expect(result.length).toBeGreaterThan(0)

    // Find the div block
    const div = result.find(
      (node: Node) =>
        node.type === 'Block' && (node as BlockNode).name === 'div'
    ) as BlockNode

    expect(div).toBeDefined()

    if (div) {
      // Check attributes
      const idAttr = div.children.find(
        (child: Node) =>
          child.type === 'Attribute' && (child as Attribute).key === 'id'
      ) as Attribute

      const classAttr = div.children.find(
        (child: Node) =>
          child.type === 'Attribute' && (child as Attribute).key === 'class'
      ) as Attribute

      expect(idAttr).toBeDefined()
      expect(classAttr).toBeDefined()

      if (idAttr) {
        expect(idAttr.value.type).toBe('string')
        expect((idAttr.value as StringValue).value).toBe('content')
      }

      if (classAttr) {
        expect(classAttr.value.type).toBe('string')
        expect((classAttr.value as StringValue).value).toBe('wrapper')
      }

      // Check for a value node
      const valueNode = div.children.find(
        (child: Node) => child.type === 'Value'
      ) as ValueNode
      expect(valueNode).toBeDefined()

      if (valueNode) {
        expect(valueNode.value.type).toBe('string')
        expect((valueNode.value as StringValue).value).toContain(
          'This is the content'
        )
      }
    }
  })

  it('should parse attributes followed by a block node', () => {
    const input = `div id=container class=wrapper
  span: Hello`

    const result = parseTML(input)
    expect(result.length).toBe(1)

    const div = assertBlockNode(result[0], 'div')

    // Check attributes
    assertBlockHasAttributes(div, [
      { key: 'id', valueType: 'string', value: 'container' },
      { key: 'class', valueType: 'string', value: 'wrapper' },
    ])

    // Check span block
    const span = assertChildBlock(div, 'span', 1)
    assertBlockWithStringValue(span, 'Hello')

    // Verify counts
    assertBlockChildCounts(div, { attributes: 2, blocks: 1 })
  })

  it('should parse a value node (quoted) followed by an attribute node', () => {
    const input = `div: "This is quoted content"
  class=highlight`

    const result = parseTML(input)
    expect(result.length).toBe(1)

    const div = assertBlockNode(result[0], 'div')

    // Check value node
    const valueNode = findValueNode(div)
    expect(valueNode).toBeDefined()
    if (valueNode) {
      expect(getStringValue(valueNode)).toBe('This is quoted content')
    }

    // Check attribute
    assertBlockHasAttribute(div, 'class', 'string', 'highlight')

    // Verify counts
    assertBlockChildCounts(div, { attributes: 1, values: 1 })
  })

  it('should parse a value node (quoted) followed by a block node', () => {
    const input = `div: "This is quoted content"
  span: Nested content`

    const result = parseTML(input)
    expect(result.length).toBe(1)

    const div = assertBlockNode(result[0], 'div')

    // Check value node
    const valueNode = findValueNode(div)
    expect(valueNode).toBeDefined()
    if (valueNode) {
      expect(getStringValue(valueNode)).toBe('This is quoted content')
    }

    // Check span block
    const span = assertChildBlock(div, 'span', 1)
    assertBlockWithStringValue(span, 'Nested content')

    // Verify counts
    assertBlockChildCounts(div, { values: 1, blocks: 1 })
  })
})

// Helper function to get a string value from a value node
function getStringValue(valueNode: ValueNode): string {
  expect(valueNode.value.type).toBe('string')
  return (valueNode.value as StringValue).value
}

// Helper function to assert that a block has a specific attribute
function assertBlockHasAttribute(
  block: BlockNode,
  key: string,
  valueType: string,
  value?: any
): void {
  const attribute = block.children.find(
    child => child.type === 'Attribute' && (child as Attribute).key === key
  ) as Attribute | undefined

  expect(attribute).toBeDefined()
  expect(attribute!.value.type).toBe(valueType)

  if (value !== undefined) {
    if (valueType === 'string') {
      expect((attribute!.value as StringValue).value).toBe(value)
    } else if (valueType === 'boolean') {
      expect((attribute!.value as BooleanValue).value).toBe(value)
    }
  }
}
