export function isBeforeHome(homeTop: number | undefined, navBottom: number) {
  return homeTop === undefined || homeTop > navBottom;
}
