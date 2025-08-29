// Simple test to understand web-tree-sitter structure
import('web-tree-sitter').then(TreeSitter => {
  // Intentionally minimal: only surface errors when inspecting module shape.
  if (!TreeSitter) return;
  if (TreeSitter.default && TreeSitter.default.init == null && TreeSitter.init == null) {
    // nothing to report by default
  }
}).catch(error => {
  console.error('Error inspecting web-tree-sitter module:', error);
});
