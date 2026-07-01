interface Declaration {
  readonly prop: string;
  readonly value: string;
}

function parse(style: string | undefined): Declaration[] {
  return (style ?? '')
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map((part) => {
      const index = part.indexOf(':');
      return { prop: part.slice(0, index).trim(), value: part.slice(index + 1).trim() };
    })
    .filter((declaration) => declaration.prop.length > 0 && declaration.value.length > 0);
}

export function readStyleProperty(style: string | undefined, prop: string): string | null {
  const target = prop.toLowerCase();
  const found = parse(style).find((declaration) => declaration.prop.toLowerCase() === target);
  return found ? found.value : null;
}

export function writeStyleProperty(
  style: string | undefined,
  prop: string,
  value: string | null
): string {
  const target = prop.toLowerCase();
  const existing = parse(style);
  const remove = value === null || value.length === 0;
  const declarations: Declaration[] = [];
  let replaced = false;
  for (const declaration of existing) {
    if (declaration.prop.toLowerCase() !== target) {
      declarations.push(declaration);
    } else if (!remove) {
      declarations.push({ prop, value });
      replaced = true;
    }
  }
  if (!remove && !replaced) {
    declarations.push({ prop, value });
  }
  return declarations.map((declaration) => `${declaration.prop}:${declaration.value}`).join(';');
}
