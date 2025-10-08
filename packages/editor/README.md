# @w6w/editor

A powerful, open-source visual workflow editor built with React 19 and TypeScript.

## Features

- 🎨 **Visual Canvas** - Intuitive drag-and-drop interface for workflow design
- ⚡ **High Performance** - Optimized for workflows with thousands of nodes
- 🔌 **Extensible** - Plugin architecture for custom nodes and integrations
- ♿ **Accessible** - WCAG 2.1 AA compliant
- 📦 **Type Safe** - Built with TypeScript for excellent developer experience
- 🎯 **Redux Powered** - Predictable state management with Redux Toolkit

## Installation

```bash
npm install @w6w/editor react react-dom
# or
pnpm add @w6w/editor react react-dom
# or
yarn add @w6w/editor react react-dom
```

## Quick Start

```tsx
import { WorkflowEditor } from '@w6w/editor';
import '@w6w/editor/styles';

function App() {
  return (
    <WorkflowEditor
      initialWorkflow={{
        nodes: [],
        edges: []
      }}
      onChange={(workflow) => {
        console.log('Workflow updated:', workflow);
      }}
    />
  );
}
```

## Documentation

Coming soon...

## Development

This package is part of the [W6W Editor monorepo](https://github.com/w6w-io/editor).

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test
```

## License

MIT © W6W Team

## Contributing

Contributions are welcome! Please read our [Contributing Guide](../../CONTRIBUTING.md) and [Code of Conduct](../../CODE_OF_CONDUCT.md).
