import { copyToClipboard } from '../lib/copy';
import { getThemes } from '../lib/theme/themes';
import { getThemeCSS } from '../lib/theme/window';
import { useListenToTauriEvent } from './useListenToTauriEvent';

export function useGenerateThemeCss() {
  useListenToTauriEvent('generate_theme_css', async () => {
    const themes = await getThemes();
    const themesCss = themes.themes.map(getThemeCSS).join('\n\n');
    copyToClipboard(themesCss);
  });
}
