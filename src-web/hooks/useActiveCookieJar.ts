import { useSearch } from '@tanstack/react-router';
import type { CookieJar } from '@yaakapp-internal/models';
import { atom, useAtomValue } from 'jotai/index';
import { useEffect } from 'react';
import { jotaiStore } from '../lib/jotai';
import { router } from '../lib/router';
import { cookieJarsAtom, useCookieJars } from './useCookieJars';

export const QUERY_COOKIE_JAR_ID = 'cookie_jar_id';

export const activeCookieJarIdAtom = atom<string>();

export const activeCookieJarAtom = atom<CookieJar | null>((get) => {
  const activeId = get(activeCookieJarIdAtom);
  return get(cookieJarsAtom)?.find((e) => e.id === activeId) ?? null;
});

export function setActiveCookieJar(cookieJar: CookieJar) {
  router.navigate({
    from: '/workspaces/$workspaceId',
    search: (prev) => ({ ...prev, cookie_jar_id: cookieJar.id }),
  });
}

export function useActiveCookieJar() {
  return useAtomValue(activeCookieJarAtom);
}

export function useSubscribeActiveCookieJarId() {
  const { cookie_jar_id } = useSearch({ strict: false });
  useEffect(() => {
    jotaiStore.set(activeCookieJarIdAtom, cookie_jar_id ?? undefined);
  }, [cookie_jar_id]);
}

export function getActiveCookieJar() {
  return jotaiStore.get(activeCookieJarAtom);
}

export function useEnsureActiveCookieJar() {
  const cookieJars = useCookieJars();
  const activeCookieJar = useActiveCookieJar();

  // Set the active cookie jar to the first one, if none set
  useEffect(() => {
    if (cookieJars == null) return; // Hasn't loaded yet
    if (cookieJars.find((j) => j.id === activeCookieJar?.id)) {
      return; // There's an active jar
    }

    const firstJar = cookieJars[0];
    if (firstJar == null) {
      console.log("Workspace doesn't have any cookie jars to activate");
      return;
    }

    // There's no active jar, so set it to the first one
    console.log('Setting active cookie jar to', firstJar.id);
    setActiveCookieJar(firstJar);
  }, [activeCookieJar?.id, cookieJars]);
}
