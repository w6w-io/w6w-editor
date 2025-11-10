# Schema Generation Scripts

Utility scripts for generating JSON Schemas from Zod schemas.

## Available Scripts

### `generate-json-schemas.ts`

Converts all Zod schemas to JSON Schema 2020-12 format.

**What it does:**

- Reads all exported schemas from `src/index.ts`
- Converts Zod schemas to JSON Schema using Zod v4's native `toJSONSchema()` function
- Adds W6W metadata ($schema, $id with version)
- Outputs to `dist/` directory
- Reports generation status

**Usage:**

```bash
# Install dependencies first
npm install

# Generate JSON schemas
npm run generate-schemas

# Or run directly
tsx scripts/generate-json-schemas.ts
```

**Output:**

Generated JSON schemas are saved to `dist/` directory:

```
dist/
├── node.json
├── workflow.json
└── ...
```

Each schema includes:
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://w6w.io/schemas/{name}/v{version}",
  "type": "object",
  "properties": { ... }
}
```

## Development

### Adding New Schemas

1. **Define Zod schema** in `src/` directory
   ```typescript
   // src/myschema.ts
   import { z } from 'zod';

   export const mySchema = z.object({
     id: z.string(),
     name: z.string()
   });
   ```

2. **Export from index** in `src/index.ts`
   ```typescript
   export { mySchema } from './myschema';
   ```

3. **Generate JSON Schema**
   ```bash
   npm run generate-schemas
   ```

4. **Output** will be in `dist/my.json`

### Schema Naming Convention

The script converts schema names to filenames:
- `nodeSchema` → `node.json`
- `workflowSchema` → `workflow.json`
- `myCustomSchema` → `mycustom.json`

### Versioning

Schemas are versioned using the version from `package.json`:
- Package version: `1.0.0.alpha-1`
- Schema $id: `https://w6w.io/schemas/node/v1.0.0.alpha-1`

To update versions:
```bash
npm version patch  # 1.0.0 → 1.0.1
npm run generate-schemas
```

## Technical Details

### Dependencies

- **zod**: Provides native `toJSONSchema()` function (v4+)
- **tsx**: TypeScript execution for scripts

### Configuration

The script uses:
- Zod v4's native JSON Schema conversion
- Outputs JSON Schema 2020-12 format
- Adds W6W-specific $id format with versioning

### Limitations

1. **Complex Zod features** may not translate perfectly to JSON Schema
2. **Custom Zod refinements** are not always representable in JSON Schema
3. **Function-based schemas** (like `idSchema(prefix)`) need to be invoked before conversion

### Troubleshooting

**Issue:** Schema not generating
- Check that it's exported from `src/index.ts`
- Ensure it's a valid Zod schema object

**Issue:** Invalid JSON Schema output
- Complex Zod features may need manual adjustment
- Check console output for conversion warnings

**Issue:** Import errors
- Run `npm install` to ensure dependencies are installed
- Check that all source files compile without errors
