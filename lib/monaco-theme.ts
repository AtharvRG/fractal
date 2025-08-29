import { editor } from 'monaco-editor';

// This is the definition for our custom theme, "FractalOneDark"
export const theme: editor.IStandaloneThemeData = {
  base: 'vs-dark', // Start with the vs-dark theme as a base
  inherit: true,
  rules: [
    { token: 'comment', foreground: '7f848e' },
    { token: 'string', foreground: '88f9b5' }, // strings
    { token: 'regexp', foreground: '56b6c2' },
    { token: 'keyword', foreground: 'c678dd' },
    { token: 'number', foreground: 'd19a66' },
    { token: 'boolean', foreground: 'd19a66' },
    { token: 'delimiter', foreground: 'abb2bf' },
    { token: 'delimiter.parenthesis', foreground: 'abb2bf' },
    { token: 'delimiter.bracket', foreground: 'abb2bf' },
    { token: 'delimiter.brace', foreground: 'abb2bf' },
    { token: 'operator', foreground: '56b6c2' },
    { token: 'tag', foreground: 'e06c75' }, // HTML/XML tag name
    { token: 'metatag', foreground: 'e06c75' },
    { token: 'attribute.name', foreground: 'd19a66' },
    { token: 'attribute.value', foreground: '88f9b5' },
    { token: 'type', foreground: 'e5c07b' },
    { token: 'interface', foreground: 'e5c07b' },
    { token: 'enum', foreground: 'e5c07b' },
    { token: 'namespace', foreground: '61afef' },
    { token: 'predefined', foreground: '61afef' },
    { token: 'variable.predefined', foreground: '61afef' },
    { token: 'variable.parameter', foreground: 'dcdfe4' },
    { token: 'entity.name.function', foreground: '61afef' },
    { token: 'support.function', foreground: '61afef' },
    { token: 'support.class', foreground: 'e5c07b' },
    { token: 'punctuation.definition.tag', foreground: 'e06c75' },
    { token: 'punctuation.definition.template-expression.begin', foreground: 'c678dd' },
    { token: 'punctuation.definition.template-expression.end', foreground: 'c678dd' },
  ],
  semanticTokenColors: {
    function: '#61afef',
    method: '#61afef',
    variable: '#abb2bf',
    'variable.readonly': '#d19a66',
    parameter: '#dcdfe4',
    property: '#abb2bf',
    enumMember: '#d19a66',
    type: '#e5c07b',
    class: '#e5c07b',
    interface: '#e5c07b',
    enum: '#e5c07b',
    struct: '#e5c07b',
    namespace: '#61afef',
    keyword: '#c678dd',
    string: '#88f9b5',
    number: '#d19a66',
    regexp: '#56b6c2',
    operator: '#56b6c2',
    comment: '#7f848e',
    macro: '#c678dd',
    modifier: '#c678dd',
    boolean: '#d19a66',
    escapeSequence: '#56b6c2',
    formatSpecifier: '#56b6c2',
    'punctuation.bracket': '#abb2bf',
    'punctuation.delimiter': '#abb2bf',
    tag: '#e06c75',
    attribute: '#d19a66'
  },
  colors: {
    'editor.background': '#282634', // A slightly lighter tuna for the editor pane
    'editor.foreground': '#abb2bf',
    'editor.lineHighlightBackground': '#32303f', // Tuna
    'editorCursor.foreground': '#88f9b5', // Aquamarine
    'editorWhitespace.foreground': '#3b4048',
    'editor.selectionBackground': '#4f5666',
    'editorGutter.background': '#282634',
    // Bracket pair highlight colors (Monaco picks sequentially)
    'editorBracketHighlight.foreground1': '#88f9b5',
    'editorBracketHighlight.foreground2': '#e5c07b',
    'editorBracketHighlight.foreground3': '#61afef',
    'editorBracketHighlight.foreground4': '#c678dd',
    'editorBracketHighlight.foreground5': '#d19a66',
    'editorBracketHighlight.foreground6': '#56b6c2',
    'editorBracketHighlight.unexpectedBracket.foreground': '#ff5555'
  },
};