import {getAttributeLabel} from '@app/attributes/rendering/attribute-renderer';
import {FullConversationResponse} from '@app/dashboard/conversation';
import {getCountryList} from '@ui/utils/intl/countries';
import {getLanguageList} from '@ui/utils/intl/languages';

// Regex pattern matching the PHP version: <be-variable name="..." type="..." fallback="..."></be-variable>
// Made fallback attribute optional to handle cases where it's not present
const regex =
  /<be-variable name="([a-zA-Z0-9_-]+)" type="([a-zA-Z0-9_-]+)"(?:\s+fallback="([a-zA-Z0-9_-]*)")?><\/be-variable>/gi;

export function replaceVariables(
  text: string,
  data: FullConversationResponse,
): string {
  return text.replace(regex, (match, name, type, fallback) => {
    const value = replaceVariable(name, type, fallback || '', data);

    return Array.isArray(value) || (typeof value === 'object' && value !== null)
      ? JSON.stringify(value)
      : String(value);
  });
}

function replaceVariable(
  name: string,
  type: string,
  fallback: string | undefined,
  data: FullConversationResponse,
): any {
  // Handle fallback - convert 'null' string or empty to actual null
  const actualFallback = !fallback || fallback === 'null' ? null : fallback;

  let value: any = null;

  // look in attributes first
  const attribute = data.attributes.find(
    attr => attr.type === type && attr.key === name,
  );

  if (attribute) {
    value = getAttributeLabel(attribute, attribute.value);
  }

  // next try user and conversation objects
  if (value == null) {
    if (type === 'user') {
      value = data.user[name as keyof typeof data.user];
    } else if (type === 'conversation') {
      value = data.conversation[name as keyof typeof data.conversation];
    }
  }

  if (name === 'language' && value) {
    const displayName = getLanguageList().find(
      lang => lang.code === value,
    )?.name;
    if (displayName) value = displayName;
  }

  if (name === 'country' && value) {
    const displayName = getCountryList().find(
      country => country.code === value,
    )?.name;
    if (displayName) value = displayName;
  }

  // Return the found value, fallback, or the original name as last resort
  return value !== null && value !== undefined ? value : actualFallback || name;
}
