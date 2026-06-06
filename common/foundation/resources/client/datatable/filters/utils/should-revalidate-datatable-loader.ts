// only run loader on initial page load, when query/filters/page are changed show previous data and <GlobalLoadingProgress query={query} /> instead
export function shouldRevalidateDatatableLoader() {
  return false;
}
