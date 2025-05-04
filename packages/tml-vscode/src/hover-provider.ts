import * as vscode from 'vscode'
import {
  parseTML,
  Node,
  BlockNode,
  ValueNode,
  Attribute,
  Position,
  Point,
} from '@tml/parser'

// Type for nodes with additional value type information
type NodeWithValueType = Node & { valueType?: string }

/**
 * Converts a TML Point to a VSCode Position
 */
function tmlPointToVSCodePosition(point: Point): vscode.Position {
  // TML positions are 1-based, VSCode positions are 0-based
  return new vscode.Position(point.line - 1, point.column)
}

/**
 * Converts a TML Position to a VSCode Range
 */
function tmlPositionToVSCodeRange(position: Position): vscode.Range {
  const start = tmlPointToVSCodePosition(position.start)
  const end = tmlPointToVSCodePosition(position.end)
  return new vscode.Range(start, end)
}

/**
 * Checks if a VSCode position is within a TML position range
 */
function isPositionInRange(
  position: vscode.Position,
  tmlPosition?: Position
): boolean {
  if (!tmlPosition) return false

  const range = tmlPositionToVSCodeRange(tmlPosition)
  return range.contains(position)
}

/**
 * Recursively finds the most specific node at the given position
 */
function findNodeAtPosition(
  nodes: Node[],
  position: vscode.Position
): Node | undefined {
  // Process nodes in reverse order to prioritize later nodes (which might be more specific)
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i]

    if (isPositionInRange(position, node.position)) {
      // For block nodes, check children first
      if (node.type === 'Block') {
        const blockNode = node as BlockNode
        const childNode = findNodeAtPosition(blockNode.children, position)
        if (childNode) {
          // If we found a child node, return it immediately
          return childNode
        }
      }

      // For value nodes, check the contained value
      if (node.type === 'Value') {
        const valueNode = node as ValueNode
        if (
          valueNode.value.position &&
          isPositionInRange(position, valueNode.value.position)
        ) {
          // Create a new object with the value type information
          const result = Object.assign({}, node) as NodeWithValueType
          result.valueType = valueNode.value.type
          return result
        }
      }

      // For attribute nodes, check the value
      if (node.type === 'Attribute') {
        const attrNode = node as Attribute
        if (
          attrNode.value.position &&
          isPositionInRange(position, attrNode.value.position)
        ) {
          // Create a new object with the value type information
          const result = Object.assign({}, node) as NodeWithValueType
          result.valueType = attrNode.value.type
          return result
        }
      }

      // For comment nodes, check the position
      if (node.type === 'Comment') {
        if (node.position && isPositionInRange(position, node.position)) {
          return node
        }
      }

      // If we didn't find a more specific node, return this one
      return node
    }
  }

  return undefined
}

/**
 * Finds the parent block of a node
 */
function findParentBlock(
  nodes: Node[],
  targetNode: Node,
  currentParent?: BlockNode
): BlockNode | undefined {
  for (const node of nodes) {
    if (node === targetNode) {
      return currentParent
    }

    if (node.type === 'Block') {
      const blockNode = node as BlockNode
      const parent = findParentBlock(blockNode.children, targetNode, blockNode)
      if (parent) {
        return parent
      }
    }
  }

  return undefined
}

/**
 * Gets hover information for a node
 */
function getHoverInfo(
  node: Node,
  _document: vscode.TextDocument,
  allNodes: Node[]
): vscode.MarkdownString | undefined {
  const markdown = new vscode.MarkdownString()

  // Find parent information for all node types
  const parent = findParentBlock(allNodes, node)

  switch (node.type) {
    case 'Block': {
      const blockNode = node as BlockNode
      markdown.appendMarkdown(`**Block**: \`${blockNode.name}\`\n\n`)

      // Add number of children
      if (blockNode.children.length > 0) {
        markdown.appendMarkdown(`Children: ${blockNode.children.length}\n\n`)
      }

      // Add parent information
      if (parent) {
        markdown.appendMarkdown(`Parent: \`${parent.name}\`\n\n`)
      }

      return markdown
    }

    case 'Value': {
      const valueNode = node as ValueNode & { valueType?: string }
      markdown.appendMarkdown(`**Value Node**\n\n`)

      // Add value type information
      if (valueNode.valueType) {
        markdown.appendMarkdown(`Type: \`${valueNode.valueType}\`\n\n`)
      } else {
        markdown.appendMarkdown(`Type: \`${valueNode.value.type}\`\n\n`)
      }

      // Add parent information
      if (parent) {
        markdown.appendMarkdown(`Parent: \`${parent.name}\`\n\n`)
      }

      return markdown
    }

    case 'Attribute': {
      const attrNode = node as Attribute & { valueType?: string }
      markdown.appendMarkdown(`**Attribute**: \`${attrNode.key}\`\n\n`)

      // Add value type information
      if (attrNode.valueType) {
        markdown.appendMarkdown(`Value Type: \`${attrNode.valueType}\`\n\n`)
      } else {
        markdown.appendMarkdown(`Value Type: \`${attrNode.value.type}\`\n\n`)
      }

      // Add parent information
      if (parent) {
        markdown.appendMarkdown(`Parent: \`${parent.name}\`\n\n`)
      }

      return markdown
    }

    case 'Comment': {
      markdown.appendMarkdown(`**Comment**\n\n`)

      // Add parent information
      if (parent) {
        markdown.appendMarkdown(`Parent: \`${parent.name}\`\n\n`)
      }

      return markdown
    }

    default:
      return undefined
  }
}

/**
 * TML Hover Provider implementation
 */
export class TMLHoverProvider implements vscode.HoverProvider {
  private outputChannel: vscode.OutputChannel
  private errorChannel: vscode.OutputChannel

  // Cache for parsed documents
  private lastDocumentUri: string = ''
  private lastDocumentVersion: number = -1
  private lastDocumentText: string = ''
  private cachedNodes: Node[] = []

  constructor() {
    // Create output channels once when the provider is instantiated
    this.outputChannel = vscode.window.createOutputChannel('TML Hover')
    this.errorChannel = vscode.window.createOutputChannel('TML Hover Error')
  }

  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    // eslint-disable-next-line no-unused-vars
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    try {
      // Use the existing output channel
      this.outputChannel.clear()
      this.outputChannel.appendLine(
        `Hover requested at position: ${position.line}:${position.character}`
      )
      this.outputChannel.appendLine(
        `Document language ID: ${document.languageId}`
      )

      // Get document text
      const text = document.getText()
      let nodes: Node[]

      // Check if we need to parse the document or can use cached nodes
      const documentUri = document.uri.toString()
      const documentVersion = document.version

      if (
        documentUri === this.lastDocumentUri &&
        documentVersion === this.lastDocumentVersion &&
        text === this.lastDocumentText &&
        this.cachedNodes.length > 0
      ) {
        // Use cached nodes
        nodes = this.cachedNodes
        this.outputChannel.appendLine(
          `Using cached nodes (${nodes.length} root nodes)`
        )
      } else {
        // Parse the document and update cache
        nodes = parseTML(text)
        this.lastDocumentUri = documentUri
        this.lastDocumentVersion = documentVersion
        this.lastDocumentText = text
        this.cachedNodes = nodes
        this.outputChannel.appendLine(
          `Parsed ${nodes.length} root nodes (cached)`
        )
      }

      // Find the node at the position
      const node = findNodeAtPosition(nodes, position)
      if (!node) {
        this.outputChannel.appendLine('No node found at position')
        return null
      }

      // Log node information
      this.outputChannel.appendLine(`Found node of type: ${node.type}`)
      if (node.type === 'Block') {
        this.outputChannel.appendLine(`Block name: ${(node as BlockNode).name}`)
      } else if (node.type === 'Attribute') {
        this.outputChannel.appendLine(
          `Attribute key: ${(node as Attribute).key}`
        )
      }

      // Get hover information
      const hoverInfo = getHoverInfo(node, document, nodes)
      if (!hoverInfo) {
        this.outputChannel.appendLine('No hover information available')
        return null
      }

      // Create hover with range
      const range = node.position
        ? tmlPositionToVSCodeRange(node.position)
        : undefined

      this.outputChannel.appendLine('Hover information created successfully')
      return new vscode.Hover(hoverInfo, range)
    } catch (error) {
      // Use the existing error channel
      this.errorChannel.clear()
      this.errorChannel.appendLine(`Error in hover provider: ${error}`)
      if (error instanceof Error) {
        this.errorChannel.appendLine(error.stack || 'No stack trace available')
      }
      return null
    }
  }
}
