const animatingMessages = new Set<string>();

export function addAnimatingMessage(uuid: string) {
  animatingMessages.add(uuid);
}

export function removeAnimatingMessage(uuid: string) {
  animatingMessages.delete(uuid);
}

export function shouldAnimate(uuid: string) {
  return animatingMessages.has(uuid);
}
