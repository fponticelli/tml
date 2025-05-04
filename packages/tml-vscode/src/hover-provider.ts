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
import {
  findNodeAtPosition as findNodeAtPositionUtil,
  findParentBlock,
  stringifyTML,
} from '@tml/utils'

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
 * Adapter function to use the findNodeAtPosition utility with VSCode positions
 */
function findNodeAtPosition(
  nodes: Node[],
  position: vscode.Position
): Node | undefined {
  return findNodeAtPositionUtil(nodes, {
    line: position.line + 1, // Convert from 0-based to 1-based
    column: position.character,
  })
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
      markdown.appendMarkdown(`**Block**: \`${blockNode.name}\``)

      const counts = blockNode.children.reduce(
        (acc, child) => {
          acc[child.type] = (acc[child.type] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )

      // Add number of children
      if (blockNode.children.length > 0) {
        markdown.appendMarkdown(`\n\nchildren: `)
        for (const [type, count] of Object.entries(counts)) {
          if (count === 0) continue
          markdown.appendMarkdown(
            `\n- ${count} ${type.toLocaleLowerCase()}${count > 1 ? 's' : ''}`
          )
        }
      }

      // Add parent information
      if (parent) {
        markdown.appendMarkdown(`\n\nParent: \`${parent.name}\``)
      }

      return markdown
    }

    case 'Value': {
      const valueNode = node as ValueNode
      markdown.appendMarkdown(`**Value:**`)

      // Add value type information
      markdown.appendMarkdown(` \`${valueNode.value.type}\``)

      // Add parent information
      if (parent) {
        markdown.appendMarkdown(`\n\nParent: \`${parent.name}\``)
      }

      return markdown
    }

    case 'Attribute': {
      const attrNode = node as Attribute
      markdown.appendMarkdown(`**Attribute**: \`${attrNode.key}\``)

      // Add value type information
      markdown.appendMarkdown(` \`${attrNode.value.type}\``)

      // Add parent information
      if (parent) {
        markdown.appendMarkdown(`\n\nParent: \`${parent.name}\``)
      }

      return markdown
    }

    case 'Comment': {
      markdown.appendMarkdown(`**Comment**`)

      // Add parent information
      if (parent) {
        markdown.appendMarkdown(`\n\nParent: \`${parent.name}\``)
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
      this.outputChannel.appendLine(stringifyTML(nodes))
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
