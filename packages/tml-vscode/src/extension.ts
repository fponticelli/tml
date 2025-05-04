import * as vscode from 'vscode'
import { TMLHoverProvider } from './hover-provider'

export function activate(context: vscode.ExtensionContext) {
  console.log('TML Language Support extension is now active')
  context.subscriptions.push(
    vscode.languages.registerHoverProvider('tml', new TMLHoverProvider())
  )
}

export function deactivate() {
  console.log('TML Language Support extension is now inactive')
}
