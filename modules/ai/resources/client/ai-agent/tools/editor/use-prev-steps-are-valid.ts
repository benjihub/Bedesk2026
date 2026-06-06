import {ToolEditorStep} from '@ai/ai-agent/tools/editor/tool-editor-step';
import {useToolEditorStore} from '@ai/ai-agent/tools/editor/tool-editor-store';

export function usePrevStepsAreValid(step: ToolEditorStep) {
  return useToolEditorStore(s => {
    const steps = Object.values(ToolEditorStep);
    const index = steps.indexOf(step);
    const prevSteps = steps.slice(0, index);
    return prevSteps.every(step => s[step].isValid && !s[step].isDirty);
  });
}
