export interface Html {
  readonly __html: string;
}

class SafeHtml implements Html {
  readonly __html: string;

  constructor(value: string) {
    this.__html = value;
  }
}

function escape(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function render(value: unknown): string {
  if (value instanceof SafeHtml) return value.__html;
  if (Array.isArray(value)) return value.map(render).join('');
  if (value === null || value === undefined || value === false) return '';
  return escape(String(value));
}

export function html(strings: TemplateStringsArray, ...values: unknown[]): Html {
  let result = strings[0];
  for (let i = 0; i < values.length; i++) {
    result += render(values[i]) + strings[i + 1];
  }
  return new SafeHtml(result);
}
