# @w6w-io/schema

Type-safe schema definitions for W6W using Zod with automatic JSON Schema generation.

## Overview

This package provides:
- **Zod schemas** for runtime validation and TypeScript types
- **Automatic JSON Schema generation** for documentation and tooling
- **Versioned schemas** following W6W conventions

## Installation

```bash
npm install @w6w-io/schema
```

## Usage

### TypeScript/JavaScript

```typescript
import { nodeSchema } from '@w6w-io/schema';
import { z } from 'zod';

// Validate data
const node = nodeSchema.parse({
  id: 'node_1',
  type: 'action',
  position: [100, 200]
});

// Type inference
type Node = z.infer<typeof nodeSchema>;
```

### JSON Schema

Generate JSON Schemas from Zod schemas:

```bash
npm run generate-schemas
```

Output will be in `dist/` directory.

## Available Schemas

### Core Schemas

- **`nodeSchema`** - Workflow node definition
- **`positionSchema`** - Node position [x, y] or [x, y, z]
- **`idSchema(prefix)`** - ID validation with prefix (e.g., `wf_`, `node_`)

More schemas coming soon!

## Development

### Adding New Schemas

1. Create schema file in `src/`:
   ```typescript
   // src/myschema.ts
   import { z } from 'zod';

   export const mySchema = z.object({
     id: z.string(),
     name: z.string()
   });
   ```

2. Export from `src/index.ts`:
   ```typescript
   export { mySchema } from './myschema';
   ```

3. Generate JSON Schema:
   ```bash
   npm run generate-schemas
   ```

### Scripts

- `npm run generate-schemas` - Generate JSON Schemas from Zod
- `npm run build` - Alias for generate-schemas

### Versioning

Schemas are versioned using package.json version:
```json
{
  "version": "1.0.0.alpha-1"
}
```

Generated schemas include versioned $id:
```json
{
  "$id": "https://w6w.io/schemas/node/v1.0.0.alpha-1"
}
```

## Schema Conventions

### ID Format

IDs follow the pattern: `{type}_{identifier}`

Examples:
- Workflow: `wf_customer_onboarding`
- Node: `node_start`, `node_action_1`
- Trigger: `trigger_webhook_1`

### Position Format

Positions are arrays of 2-3 numbers:
- 2D: `[x, y]` - e.g., `[100, 200]`
- 3D: `[x, y, z]` - e.g., `[100, 200, 50]`

## Links

- [Script Documentation](scripts/README.md)
- [W6W JSON Schemas Repository](https://github.com/w6w-io/schemas)

## Purpose

The `@w6w-io/schema` package contains schema definitions for W6W (Workflow) components and configurations. 