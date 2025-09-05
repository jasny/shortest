export const buildSystemPrompt = (
  template: string,
  blocks: Record<string, string>,
): string =>
  Object.entries(blocks).reduce(
    (prompt, [key, value]) => prompt.replace(`{{${key}}}`, value),
    template,
  );
