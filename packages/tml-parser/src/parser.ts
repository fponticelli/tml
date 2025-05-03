import { BlockNode, Node, Value, ValueNode } from '@/types'
import { createPosition } from './position'
import { parseValue } from './value-parsers'
import { parseLine } from './line-parser'

/**
 * Main parser function that converts a TML string into an AST.
 */
export function parseTML(input: string): Node[] {
  // Handle empty input
  if (!input.trim()) {
    return []
  }

  // Normalize line endings
  const normalizedInput = input.replace(/\r\n/g, '\n')

  // Check if this is a multiline object or array
  const trimmed = normalizedInput.trim()
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    // If it's a standalone object/array, return it as a value node
    if (!trimmed.includes('\n')) {
      const valueNode: ValueNode = {
        type: 'Value',
        value: parseValue(trimmed),
        position: {
          start: { line: 1, column: 0 },
          end: { line: 1, column: trimmed.length },
        },
      }
      return [valueNode]
    }
  }

  // Check for unbalanced quotes or braces - attempt to fix them for better error recovery
  let processedInput = normalizedInput

  // Handle unbalanced quotes
  const singleQuoteCount = (processedInput.match(/'/g) || []).length
  const doubleQuoteCount = (processedInput.match(/"/g) || []).length

  if (singleQuoteCount % 2 !== 0) {
    // Add a closing quote at the end
    processedInput += "'"
  }

  if (doubleQuoteCount % 2 !== 0) {
    // Add a closing quote at the end
    processedInput += '"'
  }

  // Handle unbalanced braces
  const openBraceCount = (processedInput.match(/{/g) || []).length
  const closeBraceCount = (processedInput.match(/}/g) || []).length

  if (openBraceCount > closeBraceCount) {
    // Add closing braces at the end
    processedInput += '}'.repeat(openBraceCount - closeBraceCount)
  }

  const lines = processedInput.split(/\n/)
  const root: Node[] = []
  const stack: { indent: number; node: BlockNode }[] = []

  // Track multiline value collection
  let collectingValue: {
    blockNode: BlockNode
    startIndent: number
    lines: string[]
  } | null = null

  // Process each line
  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1
    const line = lines[i]
    const indent = line.search(/\S/)

    // Skip empty lines
    if (indent === -1) {
      continue
    }

    // Check if we're collecting a multiline value
    if (collectingValue) {
      // If this line has more indentation than the block with the multiline value,
      // add it to the collected lines
      if (indent > collectingValue.startIndent) {
        collectingValue.lines.push(line)
        continue
      } else {
        // We've reached the end of the multiline value, process it
        const valueText = collectingValue.lines.join('\n')
        const valueNode: ValueNode = {
          type: 'Value',
          value: parseTMLValue(valueText),
          position: createPosition(
            lineNumber - collectingValue.lines.length,
            collectingValue.startIndent,
            lineNumber - 1,
            collectingValue.lines[collectingValue.lines.length - 1].length
          ),
        }

        collectingValue.blockNode.children.push(valueNode)
        collectingValue = null

        // Continue processing with the current line
      }
    }

    // Check if this line is a block with a colon but no value (potential multiline value start)
    if (line.trim().endsWith(':')) {
      const { indent: blockIndent, node } = parseLine(line, lineNumber)

      if (node && node.type === 'Block') {
        // Start collecting a multiline value
        collectingValue = {
          blockNode: node,
          startIndent: blockIndent,
          lines: [],
        }

        // Handle indentation to build the hierarchy
        while (
          stack.length > 0 &&
          blockIndent <= stack[stack.length - 1].indent
        ) {
          stack.pop()
        }

        if (stack.length === 0) {
          // Add to root if there's no parent
          root.push(node)
        } else {
          // Add to parent's children
          stack[stack.length - 1].node.children.push(node)
        }

        // Push block node to the stack for potential children
        stack.push({ indent: blockIndent, node })

        continue
      }
    }

    // Normal line processing
    const { indent: nodeIndent, node } = parseLine(line, lineNumber)

    // Skip null nodes
    if (!node) {
      continue
    }

    // Handle indentation to build the hierarchy
    while (stack.length > 0 && nodeIndent <= stack[stack.length - 1].indent) {
      stack.pop()
    }

    if (stack.length === 0) {
      // Add to root if there's no parent
      root.push(node)
    } else {
      // Add to parent's children
      stack[stack.length - 1].node.children.push(node)
    }

    // Push block nodes to the stack for potential children
    if (node.type === 'Block') {
      stack.push({ indent: nodeIndent, node })
    }
  }

  // Process any remaining multiline value
  if (collectingValue) {
    const valueText = collectingValue.lines.join('\n')
    const valueNode: ValueNode = {
      type: 'Value',
      value: parseTMLValue(valueText),
      position: createPosition(
        lines.length - collectingValue.lines.length + 1,
        collectingValue.startIndent,
        lines.length,
        collectingValue.lines[collectingValue.lines.length - 1].length
      ),
    }

    collectingValue.blockNode.children.push(valueNode)
  }

  return root
}

/**
 * Parses a multiline TML string into a single value.
 */
export function parseTMLValue(input: string): Value {
  // Check if this is a multiline object or array
  const trimmed = input.trim()
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    // Make sure we preserve comments in the object/array
    try {
      return parseValue(trimmed)
    } catch (error) {
      // If parsing fails, fall back to treating it as a string
      // eslint-disable-next-line no-console
      console.warn(
        'Failed to parse structured value, falling back to string:',
        error
      )
    }
  }

  // Handle multiline text according to the spec (section 1.4)
  const lines = input.split(/\r?\n/)

  if (lines.length > 1) {
    // Find the minimum indentation (excluding empty lines)
    const nonEmptyLines = lines.filter(line => line.trim().length > 0)

    if (nonEmptyLines.length > 0) {
      const indentations = nonEmptyLines.map(
        line => line.match(/^(\s*)/)?.[1].length || 0
      )

      const minIndent = Math.min(...indentations)

      // Remove the common indentation from each line
      const processedLines = lines.map(line => {
        if (line.trim().length === 0) return ''
        return line.substring(Math.min(minIndent, line.length))
      })

      // Join with spaces as per the spec
      const processed = processedLines
        .filter(line => line.length > 0)
        .join(' ')
        .trim()

      return {
        type: 'String',
        value: processed,
      }
    }
  }

  // Standard behavior - join with spaces
  const trimmedLines = lines
    .map(line => line.trim())
    .filter(line => line.length > 0)
  const joined = trimmedLines.join(' ')

  return parseValue(joined)
}
