# @tml/utils

Utility functions for working with Typed Markup Language (TML) nodes.

## Features

- Find nodes in a TML node tree by position
- Find parent blocks of nodes
- Find nodes by type
- Find blocks by name

## Installation

```bash
yarn add @tml/utils
```

## Usage

```typescript
import { parseTML } from '@tml/parser'
import {
  findNodeAtPosition,
  findParentBlock,
  findNodesByType,
  findBlocksByName,
} from '@tml/utils'

// Parse TML content
const nodes = parseTML(`
div
  h1: Hello World
  p: This is a paragraph
`)

// Find a node at a specific position
const node = findNodeAtPosition(nodes, { line: 2, column: 5 })

// Find the parent block of a node
const parent = findParentBlock(nodes, node)

// Find all nodes of a specific type
const blockNodes = findNodesByType(nodes, 'Block')

// Find all blocks with a specific name
const divBlocks = findBlocksByName(nodes, 'div')
```

## License

MIT
