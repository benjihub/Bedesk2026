export function getConversationPageLink(
  conversation: {id: number},
  {viewId}: {viewId?: number | string | null} = {},
): string {
  if (!viewId) viewId = 'all';
  return `/dashboard/conversations/${conversation.id}?viewId=${viewId}`;
}
