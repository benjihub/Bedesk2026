import {onFormQueryError} from '@common/errors/on-form-query-error';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {apiClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {UseFormReturn} from 'react-hook-form';

interface Response extends BackendResponse {
  content: string;
}

export enum EnhanceTextWithAiInstruction {
  Simplify = 'simplify',
  Shorten = 'shorten',
  Lengthen = 'lengthen',
  FixSpelling = 'fixSpelling',
  Translate = 'translate',
  ChangeTone = 'changeTone',
}

export enum EnhanceTextWithAiTone {
  casual = 'casual',
  formal = 'formal',
  confident = 'confident',
  friendly = 'friendly',
  inspirational = 'inspirational',
  motivational = 'motivational',
  nostalgic = 'nostalgic',
  professional = 'professional',
  playful = 'playful',
  scientific = 'scientific',
  witty = 'witty',
  straightforward = 'straightforward',
}

export interface EnhanceTextWithAiPayload {
  instruction: EnhanceTextWithAiInstruction;
  text: string;
  tone?: EnhanceTextWithAiTone;
  language?: string;
}

interface Options {
  onSuccess: (response: Response) => void;
}

export function useEnhanceTextWithAi(
  form?: UseFormReturn<EnhanceTextWithAiPayload>,
  options?: Options,
) {
  return useMutation({
    mutationKey: ['modifyTextWithAi'],
    mutationFn: (payload: EnhanceTextWithAiPayload) => modifyText(payload),
    onSuccess: response => {
      options?.onSuccess(response);
    },
    onError: err =>
      form ? onFormQueryError(err, form) : showHttpErrorToast(err),
  });
}

async function modifyText(payload: EnhanceTextWithAiPayload) {
  return apiClient.post<Response>('ai/modify-text', payload).then(r => r.data);
}
