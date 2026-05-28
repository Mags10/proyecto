const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const openapiDocument = require(path.join(rootDir, 'backend/src/docs/openapi'));
const outputPath = path.join(rootDir, 'frontend/src/app/api/schema.d.ts');
const tempPath = path.join(os.tmpdir(), 'kitchenflow-openapi.json');

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(tempPath, JSON.stringify(openapiDocument, null, 2));

execFileSync(path.join(rootDir, 'node_modules/.bin/openapi-typescript'), [tempPath, '-o', outputPath], {
  stdio: 'inherit',
});
