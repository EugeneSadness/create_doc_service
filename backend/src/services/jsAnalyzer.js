const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const fs = require('fs').promises;
const path = require('path');

async function analyzeJavaScriptFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const isTypeScript = filePath.endsWith('.ts') || filePath.endsWith('.tsx');
    const isReact = filePath.endsWith('.jsx') || filePath.endsWith('.tsx') || content.includes('React');
    
    const ast = parser.parse(content, {
      sourceType: 'module',
      plugins: [
        'jsx',
        isTypeScript && 'typescript',
        'classProperties',
        'decorators-legacy'
      ].filter(Boolean)
    });
    
    const result = {
      functions: [],
      classes: [],
      components: []
    };
    
    traverse(ast, {
      FunctionDeclaration(path) {
        const node = path.node;
        const leadingComments = node.leadingComments || [];
        const docComment = leadingComments.find(comment => comment.type === 'CommentBlock' && comment.value.startsWith('*'));
        
        result.functions.push({
          name: node.id.name,
          params: node.params.map(param => {
            if (param.type === 'Identifier') {
              return param.name;
            } else if (param.type === 'AssignmentPattern' && param.left.type === 'Identifier') {
              return `${param.left.name} = ${param.right.value}`;
            }
            return 'unknown';
          }),
          description: docComment ? parseJSDoc(docComment.value) : 'No description',
          line: node.loc.start.line
        });
      },
      
      ClassDeclaration(path) {
        const node = path.node;
        const leadingComments = node.leadingComments || [];
        const docComment = leadingComments.find(comment => comment.type === 'CommentBlock' && comment.value.startsWith('*'));
        
        const methods = [];
        node.body.body.forEach(member => {
          if (member.type === 'ClassMethod') {
            const methodComments = member.leadingComments || [];
            const methodDocComment = methodComments.find(comment => comment.type === 'CommentBlock' && comment.value.startsWith('*'));
            
            methods.push({
              name: member.key.name,
              params: member.params.map(param => {
                if (param.type === 'Identifier') {
                  return param.name;
                } else if (param.type === 'AssignmentPattern' && param.left.type === 'Identifier') {
                  return `${param.left.name} = ${param.right.value}`;
                }
                return 'unknown';
              }),
              description: methodDocComment ? parseJSDoc(methodDocComment.value) : 'No description',
              line: member.loc.start.line
            });
          }
        });
        
        result.classes.push({
          name: node.id.name,
          description: docComment ? parseJSDoc(docComment.value) : 'No description',
          methods,
          line: node.loc.start.line
        });
      },
      
      VariableDeclaration(path) {
        const node = path.node;
        
        node.declarations.forEach(declaration => {
          if (!declaration.init) return;
          
          // Detect React components (function components)
          if (isReact && 
              (declaration.init.type === 'ArrowFunctionExpression' || 
               declaration.init.type === 'FunctionExpression') && 
              declaration.id && 
              declaration.id.name && 
              /^[A-Z]/.test(declaration.id.name)) {
            
            const leadingComments = node.leadingComments || [];
            const docComment = leadingComments.find(comment => comment.type === 'CommentBlock' && comment.value.startsWith('*'));
            
            result.components.push({
              name: declaration.id.name,
              description: docComment ? parseJSDoc(docComment.value) : 'No description',
              props: extractPropsFromComponent(declaration.init),
              line: node.loc.start.line
            });
          }
          
          // Regular functions assigned to variables
          if ((declaration.init.type === 'ArrowFunctionExpression' || 
               declaration.init.type === 'FunctionExpression') && 
              declaration.id && 
              declaration.id.name) {
            
            const leadingComments = node.leadingComments || [];
            const docComment = leadingComments.find(comment => comment.type === 'CommentBlock' && comment.value.startsWith('*'));
            
            result.functions.push({
              name: declaration.id.name,
              params: declaration.init.params.map(param => {
                if (param.type === 'Identifier') {
                  return param.name;
                } else if (param.type === 'AssignmentPattern' && param.left.type === 'Identifier') {
                  return `${param.left.name} = ${param.right.value}`;
                } else if (param.type === 'ObjectPattern') {
                  return `{${param.properties.map(p => p.key.name).join(', ')}}`;
                }
                return 'unknown';
              }),
              description: docComment ? parseJSDoc(docComment.value) : 'No description',
              line: node.loc.start.line
            });
          }
        });
      }
    });
    
    return result;
  } catch (error) {
    console.error(`Error analyzing JavaScript file ${filePath}:`, error);
    return { functions: [], classes: [], components: [] };
  }
}

function parseJSDoc(comment) {
  // Remove * at the beginning of each line and trim
  const lines = comment.split('\n')
    .map(line => line.replace(/^\s*\*\s?/, '').trim())
    .filter(line => line);
  
  // Extract description (everything before the first @tag)
  const descriptionLines = [];
  let i = 0;
  while (i < lines.length && !lines[i].startsWith('@')) {
    descriptionLines.push(lines[i]);
    i++;
  }
  
  return descriptionLines.join(' ').trim();
}

function extractPropsFromComponent(node) {
  if (!node.params || node.params.length === 0) {
    return [];
  }
  
  const propsParam = node.params[0];
  
  if (propsParam.type === 'ObjectPattern') {
    return propsParam.properties.map(prop => ({
      name: prop.key.name,
      required: !prop.value || prop.value.type !== 'AssignmentPattern'
    }));
  }
  
  return [];
}

module.exports = {
  analyzeJavaScriptFile
}; 