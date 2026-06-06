export function searchParamsFromUrl(url: string) {
  const urlObject = new URL(url);
  return Object.fromEntries(urlObject.searchParams.entries());
}
