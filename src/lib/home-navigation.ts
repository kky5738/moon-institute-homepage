export function isBeforeHome(homeTop: number | undefined, navBottom: number) {
  return homeTop === undefined || homeTop > navBottom;
}

export function isOnManifesto(manifestoTop: number | undefined, homeTop: number | undefined, navBottom: number) {
  return manifestoTop !== undefined && manifestoTop <= navBottom && isBeforeHome(homeTop, navBottom);
}
