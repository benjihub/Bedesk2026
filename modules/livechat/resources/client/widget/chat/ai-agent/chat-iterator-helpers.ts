import {
  AiAgentIteratorItem,
  DeltaItem,
  FormattedHtmlItem,
} from '@livechat/widget/chat/ai-agent/ai-agent-event-source-message';
import {EventSourceParserStream} from 'eventsource-parser/stream';
import MarkdownIt from 'markdown-it';

export const createIterator = (
  response: Response,
  abortController: AbortController,
) => {
  return smoothAsyncIterator(
    emitFullWords(
      emitParsedMarkdown(
        showTypingIndicatorForMinDuration(
          responseToIterator(response, abortController),
        ),
      ),
    ),
  );
};

async function* responseToIterator(
  response: Response,
  abortController: AbortController,
): AsyncGenerator<AiAgentIteratorItem> {
  if (!response.body) {
    throw Error('Response for endpoint had no body');
  }

  const reader = response.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new EventSourceParserStream())
    .getReader();

  // Handle any cases where we must abort
  reader.closed.then(() => abortController.abort());

  // Handle logic for aborting
  abortController.signal.addEventListener('abort', () => reader.cancel());

  while (!abortController.signal.aborted) {
    const {done, value} = await reader.read();
    if (done) {
      abortController.abort();
      break;
    }

    if (!value || !value.event) continue;

    if (value.event === 'delta') {
      yield {
        event: value.event,
        data: JSON.parse(value.data),
      } as DeltaItem;
    } else if (value.event === 'message' || value.event === 'debug') {
      const e = {
        event: value.event,
        data: JSON.parse(value.data),
      } as const;

      // end stream
      if (e.data.type === 'endStream') {
        abortController.abort();
        break;
      }

      // emit
      yield e;
    }
  }
}

async function* showTypingIndicatorForMinDuration(
  iterator: AsyncGenerator<AiAgentIteratorItem>,
) {
  let lastEmitTime = performance.now();
  let lastItem: AiAgentIteratorItem | null = null;
  const minDelay = 600; // ms

  for await (const item of iterator) {
    const currentTime = performance.now();
    const timeSinceLastEmit = currentTime - lastEmitTime;

    yield item;

    if (
      item.event === 'message' &&
      item.data.type === 'typing' &&
      (!lastItem ||
        lastItem.event !== 'message' ||
        lastItem.data.type !== 'typing') &&
      timeSinceLastEmit < minDelay
    ) {
      await new Promise(resolve =>
        setTimeout(resolve, minDelay - timeSinceLastEmit),
      );
    }

    lastEmitTime = currentTime;
    lastItem = item;
  }
}

async function* emitParsedMarkdown(
  iterator: AsyncGenerator<AiAgentIteratorItem>,
): AsyncGenerator<AiAgentIteratorItem> {
  let fullMessage = '';

  for await (const item of iterator) {
    // Pass through non-delta messages directly
    if (item.event !== 'delta') {
      yield item;
      continue;
    }

    fullMessage += item.data.delta;
    yield markdownToFormattedHtmlItem(fullMessage);
  }
}

async function markdownToFormattedHtmlItem(
  markdown: string,
): Promise<FormattedHtmlItem> {
  const md = await getMdRenderer();

  // new lines might be escaped with \\n
  markdown = markdown.replaceAll('\\n', '\n');

  // remove trailing - it can be interpreted as a header
  markdown = markdown.replace(/-$/, '');

  const html = md.render(autocompleteMarkdown(markdown));

  return {
    event: 'message',
    data: {
      type: 'formattedHtml',
      content: html,
    },
  };
}

let md: MarkdownIt;
async function getMdRenderer() {
  if (!md) {
    md = (await import('markdown-it')).default();

    const defaultRender =
      md.renderer.rules.link_open ||
      function (tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options);
      };

    md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
      tokens[idx].attrSet('target', '_blank');
      return defaultRender(tokens, idx, options, env, self);
    };
  }

  return md;
}

function autocompleteMarkdown(input: string) {
  let output = input;

  // 1. Inline code (`)
  const inlineCodeMatches = (input.match(/`/g) || []).length;
  if (inlineCodeMatches % 2 !== 0) {
    output += '`';
  }

  // 2. Fenced code blocks (```...```)
  const fencedCodeMatches = (input.match(/```/g) || []).length;
  if (fencedCodeMatches % 2 !== 0) {
    output += '\n```';
  }

  // 3. Links [text](url)
  const linkStart = input.lastIndexOf('[');
  const linkMid = input.lastIndexOf('](');
  const linkEnd = input.lastIndexOf(')');

  if (linkStart !== -1 && (linkMid === -1 || linkEnd < linkMid)) {
    if (linkMid === -1) {
      output += '](';
    }
    output += ')';
  }

  // 4. Fix bold and italic (supports *, **, _, __)
  const countChar = (char: string) =>
    (input.match(new RegExp(`\\${char}`, 'g')) || []).length;

  const asteriskCount = countChar('*');
  if (asteriskCount % 2 !== 0) {
    output += '*';
  }

  const underscoreCount = countChar('_');
  if (underscoreCount % 2 !== 0) {
    output += '_';
  }

  return output;
}

async function* emitFullWords(
  iterator: AsyncGenerator<AiAgentIteratorItem>,
): AsyncGenerator<AiAgentIteratorItem> {
  let bufferedUpdates: DeltaItem[] = [];

  const endAlphanumeric = /[a-zA-Z0-9À-ž'`]+$/;
  const beginnningAlphanumeric = /^[a-zA-Z0-9À-ž'`]+/;

  for await (const item of iterator) {
    if (item.event === 'message' && item.data.type === 'endDeltaStream') {
      for (const update of bufferedUpdates) yield update;
      bufferedUpdates = [];
      continue;
    }

    if (item.event !== 'delta') {
      yield item;
      continue;
    }

    bufferedUpdates.push(item);

    let lastIndexEmitted = 0;
    for (let i = 1; i < bufferedUpdates.length; i++) {
      const prevEndsAlphanumeric = endAlphanumeric.test(
        bufferedUpdates[i - 1].data.delta,
      );
      const currBeginsAlphanumeric = beginnningAlphanumeric.test(
        bufferedUpdates[i].data.delta,
      );
      const shouldCombine = prevEndsAlphanumeric && currBeginsAlphanumeric;
      const combinedTooMany = i - lastIndexEmitted >= 5;
      if (shouldCombine && !combinedTooMany) continue;

      // Combine tokens together and emit
      yield {
        event: 'delta',
        data: {
          delta: bufferedUpdates
            .slice(lastIndexEmitted, i)
            .map(_ => _.data)
            .join(''),
        },
      };
      lastIndexEmitted = i;
    }
    bufferedUpdates = bufferedUpdates.slice(lastIndexEmitted);
  }
  for (const update of bufferedUpdates) yield update;
}

async function* smoothAsyncIterator<T>(
  iterator: AsyncGenerator<T>,
): AsyncGenerator<T> {
  const eventTarget = new EventTarget();
  let done = false;
  const valuesBuffer: T[] = [];
  const valueTimesMS: number[] = [];

  const next = async () => {
    const obj = await iterator.next();
    if (obj.done) {
      done = true;
    } else {
      valuesBuffer.push(obj.value);
      valueTimesMS.push(performance.now());
      next();
    }
    eventTarget.dispatchEvent(new Event('next'));
  };
  next();

  let timeOfLastEmitMS = performance.now();
  while (!done || valuesBuffer.length > 0) {
    // Only consider the last X times between tokens
    const sampledTimesMS = valueTimesMS.slice(-30);

    // Get the total time spent in abnormal periods
    const anomalyThresholdMS = 2000;
    const anomalyDurationMS = sampledTimesMS
      .map((time, i, times) => time - times[i - 1])
      .slice(1)
      .filter(time => time > anomalyThresholdMS)
      .reduce((a, b) => a + b, 0);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const totalTimeMSBetweenValues = sampledTimesMS.at(-1)! - sampledTimesMS[0];
    const timeMSBetweenValues = totalTimeMSBetweenValues - anomalyDurationMS;

    const averageTimeMSBetweenValues = Math.min(
      200,
      timeMSBetweenValues / (sampledTimesMS.length - 1),
    );
    const timeSinceLastEmitMS = performance.now() - timeOfLastEmitMS;

    // Emit after waiting duration or cancel if "next" event is emitted
    const gotNext = await Promise.race([
      sleep(Math.max(5, averageTimeMSBetweenValues - timeSinceLastEmitMS)),
      waitForEvent(eventTarget, 'next'),
    ]);

    // Go to next iteration so we can re-calculate when to emit
    if (gotNext) continue;

    // Nothing in buffer to emit
    if (valuesBuffer.length === 0) continue;

    // Emit
    timeOfLastEmitMS = performance.now();
    yield valuesBuffer.shift()!;
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const waitForEvent = (eventTarget: EventTarget, eventName: string) =>
  new Promise<boolean>(resolve =>
    eventTarget.addEventListener(eventName, () => resolve(true), {once: true}),
  );
