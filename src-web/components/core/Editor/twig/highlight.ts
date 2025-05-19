import { styleTags, tags as t } from '@lezer/highlight';

export const highlight = styleTags({
  "${[": t.bracket,
  "]}": t.bracket,
  "(": t.bracket,
  ")": t.bracket,
  "=": t.bracket,
  ",": t.bracket,
  Tag: t.keyword,
  Identifier: t.variableName,
  ChainedIdentifier: t.variableName,
  Boolean: t.bool,
});
