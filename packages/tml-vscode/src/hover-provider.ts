import * as vscode from 'vscode'
import {
  parseTML,
  Node,
  BlockNode,
  ValueNode,
  Attribute,
  Position,
  Point,
} from '@typedml/parser'
import {
  findNodeAtPosition as findNodeAtPositionUtil,
  findParentBlock,
  PositionIndex,
} from '@typedml/utils'

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
        (acc: Record<string, number>, child: Node) => {
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
        // Special case for values in attr blocks
        if (parent.name === 'attr') {
          // This is a value inside an attr block
          // Find the attribute node in the parent's children
          const attrNode = parent.children.find(
            (child: Node) => child.type === 'Attribute'
          ) as Attribute
          if (attrNode) {
            markdown.appendMarkdown(`\n\nAttribute: \`${attrNode.key}\``)
          } else {
            markdown.appendMarkdown(`\n\nParent: \`${parent.name}\``)
          }
        } else {
          markdown.appendMarkdown(`\n\nParent: \`${parent.name}\``)
        }
      }

      return markdown
    }

    case 'Attribute': {
      const attrNode = node as Attribute
      markdown.appendMarkdown(`**Attribute**: \`${attrNode.key}\``)

      // Add value type information
      markdown.appendMarkdown(`: \`${attrNode.value.type}\``)

      // Add parent information
      if (parent) {
        // Special case for attributes in attr blocks
        if (parent.name === 'attr') {
          // This is an attribute inside an attr block
          // Find the parent of the attr block
          const grandParent = findParentBlock(allNodes, parent)
          if (grandParent) {
            markdown.appendMarkdown(`\n\nParent: \`${grandParent.name}\``)
          } else {
            markdown.appendMarkdown(`\n\nParent: \`${parent.name}\``)
          }
        } else {
          markdown.appendMarkdown(`\n\nParent: \`${parent.name}\``)
        }
      }

      return markdown
    }

    case 'Comment': {
      markdown.appendMarkdown(`**Comment**`)

      // Add parent information
      if (parent) {
        // Special case for comments in attr blocks
        if (parent.name === 'attr') {
          // This is a comment inside an attr block
          // Find the parent of the attr block
          const grandParent = findParentBlock(allNodes, parent)
          if (grandParent) {
            markdown.appendMarkdown(`\n\nParent: \`${grandParent.name}\``)
          } else {
            markdown.appendMarkdown(`\n\nParent: \`${parent.name}\``)
          }
        } else {
          markdown.appendMarkdown(`\n\nParent: \`${parent.name}\``)
        }
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
  private positionIndex?: PositionIndex

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
        // Use cached nodes and position index
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

        // Create a new position index for the nodes
        this.positionIndex = new PositionIndex(nodes)

        this.outputChannel.appendLine(
          `Parsed ${nodes.length} root nodes and created position index (cached)`
        )
      }

      // Find the node at the position using the position index
      const positionLike = {
        line: position.line + 1, // Convert from 0-based to 1-based
        column: position.character,
      }

      // Use the position index if available, otherwise fall back to the utility function
      const node = this.positionIndex
        ? this.positionIndex.findNodeAtPosition(positionLike)
        : findNodeAtPosition(nodes, position)
      if (!node) {
        this.outputChannel.appendLine('No node found at position')
        return null
      }

      // Node found at position

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
