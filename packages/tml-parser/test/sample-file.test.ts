import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { parseTML } from '../src'
import { BlockNode, Node, ValueNode, StringValue } from '../src/types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('Sample TML File Parsing', () => {
  it('should correctly parse the sample.tml file with multiline strings', () => {
    // Read the sample file
    const samplePath = path.resolve(
      __dirname,
      '../../tml-vscode/examples/sample.tml'
    )
    const sampleContent = fs.readFileSync(samplePath, 'utf8')

    // Parse the file
    const result = parseTML(sampleContent)

    // Find the html block
    const htmlBlock = result.find(
      (node: Node) =>
        node.type === 'Block' && (node as BlockNode).name === 'html'
    ) as BlockNode
    expect(htmlBlock).toBeDefined()

    // Find the body block
    const bodyBlock = htmlBlock.children.find(
      (node: Node) =>
        node.type === 'Block' && (node as BlockNode).name === 'body'
    ) as BlockNode
    expect(bodyBlock).toBeDefined()

    // Find the description block
    const descriptionBlock = bodyBlock.children.find(
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
  })
})
