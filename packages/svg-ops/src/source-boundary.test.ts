import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./index.ts', import.meta.url), 'utf8');

function extractFunctionBlock(sourceText: string, declaration: string): string {
  const start = sourceText.indexOf(declaration);
  const bodyStart = sourceText.indexOf('{\n', start);
  if (bodyStart === -1) return '';

  let depth = 0;
  for (let index = bodyStart; index < sourceText.length; index += 1) {
    const char = sourceText[index];
    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;
    if (depth === 0) {
      return sourceText.slice(start, index + 1);
    }
  }

  return '';
}

describe('svg-ops dependency boundary', () => {
  it('keeps SVGO out of static and module-level runtime imports', () => {
    const operationBlock = extractFunctionBlock(source, 'export async function optimizeSvgText');
    const dynamicImports = [...source.matchAll(/import\s*\(\s*['"]svgo\/browser['"]\s*\)/gu)].map((match) => match[0]);
    const operationDynamicImports = [...operationBlock.matchAll(/import\s*\(\s*['"]svgo\/browser['"]\s*\)/gu)].map((match) => match[0]);

    expect(source).not.toMatch(/^import\s+(?!type\b)[^;]*\sfrom ['"]svgo(?:\/browser)?['"]/mu);
    expect(source).not.toMatch(/^import\s+['"]svgo(?:\/browser)?['"]/mu);
    expect(operationBlock).not.toHaveLength(0);
    expect(dynamicImports).toEqual(operationDynamicImports);
    expect(operationDynamicImports).not.toHaveLength(0);
  });
});
