export type Point = {
  line: number
  column: number
}

export type Position = {
  start: Point
  end: Point
}

export type Node = BlockNode | ValueNode | CommentNode

export type BlockNode = {
  type: 'Block'
  position?: Position
  name: string
  attributes: Attribute[]
  children: Node[]
}

export type Attribute = {
  key: string
  value: Value
  position?: Position
}

export type PrimitiveValue = string | number | boolean
export interface ObjectValue extends Record<string, Value> {}
export interface ArrayValue extends Array<Value> {}
export type Value = PrimitiveValue | ObjectValue | ArrayValue

export type ValueNode = {
  type: 'Value'
  position?: Position
  value: Value
}

export type CommentNode = {
  type: 'Comment'
  position?: Position
  value: string
}
