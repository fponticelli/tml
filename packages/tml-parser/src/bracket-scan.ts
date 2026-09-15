/**
 * Tracks how deep inside `{}` / `[]` the parser currently is while walking a
 * document one line at a time. Brackets that appear inside strings or comments
 * are ignored, so only structural brackets move the depth.
 */
export type BracketState = {
  depth: number
  inBlockComment: boolean
  /**
   * Column just past the bracket that brought the depth back to zero on the
   * scanned line, or -1 when the line did not close the span.
   */
  closeColumn: number
}

/**
 * Creates the state to start scanning a document from.
 */
export function createBracketState(): BracketState {
  return { depth: 0, inBlockComment: false, closeColumn: -1 }
}

/**
 * Advances the bracket state across one line of text.
 */
export function scanBrackets(line: string, state: BracketState): BracketState {
  let depth = state.depth
  let inBlockComment = state.inBlockComment
  let closeColumn = -1
  let inSingleQuote = false
  let inDoubleQuote = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (inBlockComment) {
      if (char === '*' && line[i + 1] === '/') {
        inBlockComment = false
        i++
      }
      continue
    }

    if (inSingleQuote) {
      if (char === '\\') i++
      else if (char === "'") inSingleQuote = false
      continue
    }

    if (inDoubleQuote) {
      if (char === '\\') i++
      else if (char === '"') inDoubleQuote = false
      continue
    }

    // A line comment hides the rest of the line
    if (char === '/' && line[i + 1] === '/') break

    if (char === '/' && line[i + 1] === '*') {
      inBlockComment = true
      i++
      continue
    }

    if (char === "'") {
      inSingleQuote = true
      continue
    }

    if (char === '"') {
      inDoubleQuote = true
      continue
    }

    if (char === '{' || char === '[') {
      depth++
    } else if (char === '}' || char === ']') {
      depth--
      if (depth === 0) closeColumn = i + 1
    }
  }

  return { depth, inBlockComment, closeColumn }
}

/**
 * Reports whether a trimmed line can open a value that spans several lines,
 * either as `name: {` / `name: [` or as a bare `{` / `[`.
 */
export function opensBracketSpan(trimmedLine: string): boolean {
  return /^[^\s:{}[\]]+:\s*[[{]/.test(trimmedLine) || /^[[{]/.test(trimmedLine)
}
