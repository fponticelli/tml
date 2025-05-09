import { describe, it, expect } from 'vitest'
import { parseTML } from '../src'
import { BlockNode, Node, ValueNode, StringValue } from '../src/types'

describe('Nested Multiline String Parsing', () => {
  it('should correctly parse deeply nested multiline strings', () => {
    // Create a more complex TML structure with a deeply nested multiline string
    const input = `html
  head
    title: My Page
  body
    div class=container
      header
        h1: Welcome
      main
        section id=about
          h2: About Us
          p: Some text about us
          details
            summary: More Info
            description:
              This is a multiline string
              that spans several lines
              and is parsed as one value
            p: Additional text after the multiline string
      footer
        p: Copyright 2023`

    // Parse the input
    const result = parseTML(input)

    // Find the html block
    const htmlBlock = result.find(
      (node: Node) =>
        node.type === 'Block' && (node as BlockNode).name === 'html'
    ) as BlockNode
    expect(htmlBlock).toBeDefined()

    // Navigate to the details block
    const bodyBlock = htmlBlock.children.find(
      (node: Node) =>
        node.type === 'Block' && (node as BlockNode).name === 'body'
    ) as BlockNode
    expect(bodyBlock).toBeDefined()

    const divBlock = bodyBlock.children.find(
      (node: Node) =>
        node.type === 'Block' && (node as BlockNode).name === 'div'
    ) as BlockNode
    expect(divBlock).toBeDefined()

    const mainBlock = divBlock.children.find(
      (node: Node) =>
        node.type === 'Block' && (node as BlockNode).name === 'main'
    ) as BlockNode
    expect(mainBlock).toBeDefined()

    const sectionBlock = mainBlock.children.find(
      (node: Node) =>
        node.type === 'Block' && (node as BlockNode).name === 'section'
    ) as BlockNode
    expect(sectionBlock).toBeDefined()

    const detailsBlock = sectionBlock.children.find(
      (node: Node) =>
        node.type === 'Block' && (node as BlockNode).name === 'details'
    ) as BlockNode
    expect(detailsBlock).toBeDefined()

    // Find the description block (not the first child of details)
    const descriptionBlock = detailsBlock.children.find(
      (node: Node) =>
        node.type === 'Block' && (node as BlockNode).name === 'description'
    ) as BlockNode
    expect(descriptionBlock).toBeDefined()

    // Check that the description block has a value node
    const valueNode = descriptionBlock.children.find(
      (child: Node) => child.type === 'Value'
    ) as ValueNode
    expect(valueNode).toBeDefined()

    // Check that the value node contains a string with preserved newlines
    expect(valueNode.value.type).toBe('string')
    const value = (valueNode.value as StringValue).value

    // Check the exact string value with newlines
    expect(value).toBe(
      'This is a multiline string\nthat spans several lines\nand is parsed as one value'
    )

    // Verify that there's a paragraph after the description
    const paragraphAfter = detailsBlock.children.find(
      (node: Node) =>
        node.type === 'Block' &&
        (node as BlockNode).name === 'p' &&
        node.children.some(
          child =>
            child.type === 'Value' &&
            (child as ValueNode).value.type === 'string' &&
            ((child as ValueNode).value as StringValue).value ===
              'Additional text after the multiline string'
        )
    )
    expect(paragraphAfter).toBeDefined()
  })

  it('should correctly parse multiline strings in the middle of a block', () => {
    // Create a TML structure with a multiline string in the middle
    const input = `container
  header: Top Section
  description:
    This is a multiline string
    that spans several lines
    and is parsed as one value
  footer: Bottom Section`

    // Parse the input
    const result = parseTML(input)

    // Find the container block
    const containerBlock = result.find(
      (node: Node) =>
        node.type === 'Block' && (node as BlockNode).name === 'container'
    ) as BlockNode
    expect(containerBlock).toBeDefined()

    // Find the description block (in the middle)
    const descriptionBlock = containerBlock.children.find(
      (node: Node) =>
        node.type === 'Block' && (node as BlockNode).name === 'description'
    ) as BlockNode
    expect(descriptionBlock).toBeDefined()

    // Check that the description block has a value node
    const valueNode = descriptionBlock.children.find(
      (child: Node) => child.type === 'Value'
    ) as ValueNode
    expect(valueNode).toBeDefined()

    // Check that the value node contains a string with preserved newlines
    expect(valueNode.value.type).toBe('string')
    const value = (valueNode.value as StringValue).value

    // Check the exact string value with newlines
    expect(value).toBe(
      'This is a multiline string\nthat spans several lines\nand is parsed as one value'
    )

    // Verify blocks before and after
    const headerBlock = containerBlock.children.find(
      (node: Node) =>
        node.type === 'Block' && (node as BlockNode).name === 'header'
    )
    expect(headerBlock).toBeDefined()

    const footerBlock = containerBlock.children.find(
      (node: Node) =>
        node.type === 'Block' && (node as BlockNode).name === 'footer'
    )
    expect(footerBlock).toBeDefined()
  })
})
