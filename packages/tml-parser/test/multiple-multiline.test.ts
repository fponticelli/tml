import { describe, it, expect } from 'vitest'
import { parseTML } from '../src'
import { BlockNode, Node, ValueNode, StringValue } from '../src/types'

describe('Multiple Multiline String Parsing', () => {
  it('should correctly parse multiple multiline strings in the same document', () => {
    // Create a TML structure with multiple multiline strings
    const input = `document
  title: My Document
  abstract:
    This is the first multiline string
    that spans multiple lines
    and should be parsed correctly
  section id=intro
    heading: Introduction
    content:
      This is the second multiline string
      with different content
      that should also be parsed correctly
  section id=conclusion
    heading: Conclusion
    summary:
      This is the third multiline string
      with yet another content
      that should be parsed with newlines preserved`

    // Parse the input
    const result = parseTML(input)

    // Find the document block
    const documentBlock = result.find(
      (node: Node) =>
        node.type === 'Block' && (node as BlockNode).name === 'document'
    ) as BlockNode
    expect(documentBlock).toBeDefined()

    // Find and check the first multiline string (abstract)
    const abstractBlock = documentBlock.children.find(
      (node: Node) =>
        node.type === 'Block' && (node as BlockNode).name === 'abstract'
    ) as BlockNode
    expect(abstractBlock).toBeDefined()

    const abstractValueNode = abstractBlock.children.find(
      (child: Node) => child.type === 'Value'
    ) as ValueNode
    expect(abstractValueNode).toBeDefined()
    expect(abstractValueNode.value.type).toBe('String')
    const abstractValue = (abstractValueNode.value as StringValue).value
    expect(abstractValue).toBe(
      'This is the first multiline string\nthat spans multiple lines\nand should be parsed correctly'
    )

    // Find the intro section
    const introSection = documentBlock.children.find(
      (node: Node) =>
        node.type === 'Block' &&
        (node as BlockNode).name === 'section' &&
        node.children.some(
          child =>
            child.type === 'Attribute' &&
            child.key === 'id' &&
            child.value.type === 'String' &&
            (child.value as StringValue).value === 'intro'
        )
    ) as BlockNode
    expect(introSection).toBeDefined()

    // Find and check the second multiline string (content)
    const contentBlock = introSection.children.find(
      (node: Node) =>
        node.type === 'Block' && (node as BlockNode).name === 'content'
    ) as BlockNode
    expect(contentBlock).toBeDefined()

    const contentValueNode = contentBlock.children.find(
      (child: Node) => child.type === 'Value'
    ) as ValueNode
    expect(contentValueNode).toBeDefined()
    expect(contentValueNode.value.type).toBe('String')
    const contentValue = (contentValueNode.value as StringValue).value
    expect(contentValue).toBe(
      'This is the second multiline string\nwith different content\nthat should also be parsed correctly'
    )

    // Find the conclusion section
    const conclusionSection = documentBlock.children.find(
      (node: Node) =>
        node.type === 'Block' &&
        (node as BlockNode).name === 'section' &&
        node.children.some(
          child =>
            child.type === 'Attribute' &&
            child.key === 'id' &&
            child.value.type === 'String' &&
            (child.value as StringValue).value === 'conclusion'
        )
    ) as BlockNode
    expect(conclusionSection).toBeDefined()

    // Find and check the third multiline string (summary)
    const summaryBlock = conclusionSection.children.find(
      (node: Node) =>
        node.type === 'Block' && (node as BlockNode).name === 'summary'
    ) as BlockNode
    expect(summaryBlock).toBeDefined()

    const summaryValueNode = summaryBlock.children.find(
      (child: Node) => child.type === 'Value'
    ) as ValueNode
    expect(summaryValueNode).toBeDefined()
    expect(summaryValueNode.value.type).toBe('String')
    const summaryValue = (summaryValueNode.value as StringValue).value
    expect(summaryValue).toBe(
      'This is the third multiline string\nwith yet another content\nthat should be parsed with newlines preserved'
    )
  })
})
