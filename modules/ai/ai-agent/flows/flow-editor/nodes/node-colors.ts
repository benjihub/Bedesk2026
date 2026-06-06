import {useIsDarkMode} from '@ui/themes/use-is-dark-mode';
import {useMemo} from 'react';
import {FlowNodeType} from './flow-node-type';

export type NodeColor = 'showContent' | 'importantAction' | 'action';

const fgWhite = 'rgb(255, 255, 255, 0.87)';
const fgBlack = 'rgb(0, 0, 0, 0.87)';

const lightModeGray = {bg: '#62748e', fg: fgWhite};
const darkModeGray = {bg: '#62748e', fg: fgBlack};
const lightModeGreen = {bg: '#7ccf00', fg: fgWhite};
const darkModeGreen = {bg: '#7ccf00', fg: fgBlack};
const lightModePurple = {bg: '#615fff', fg: fgWhite};
const darkModePurple = {bg: '#615fff', fg: fgWhite};
const lightModeBlue = {bg: '#2b7fff', fg: fgWhite};
const darkModeBlue = {bg: '#2b7fff', fg: fgWhite};
const lightModeOrange = {bg: '#ff6900', fg: fgWhite};
const darkModeOrange = {bg: '#ff6900', fg: fgBlack};
const transparent = {bg: 'transparent', fg: fgWhite};

export const nodeColorsLight: Record<
  FlowNodeType,
  {
    bg: string;
    fg: string;
  }
> = {
  start: lightModeGray,
  message: lightModeGreen,
  buttons: lightModeGreen,
  dynamicButtons: lightModeGreen,
  buttonsItem: lightModeGreen,
  articles: lightModeGreen,
  cards: lightModeGreen,
  dynamicCards: lightModeGreen,
  collectDetails: lightModeGreen,
  tool: lightModePurple,
  toolResult: lightModePurple,
  setAttribute: lightModePurple,
  addTags: lightModePurple,
  branches: lightModeBlue,
  branchesItem: lightModeBlue,
  transfer: lightModeOrange,
  closeConversation: lightModeOrange,
  goToStep: lightModeOrange,
  goToFlow: lightModeOrange,
  placeholder: transparent,
};

export const nodeColorsDark: Record<
  FlowNodeType,
  {
    bg: string;
    fg: string;
  }
> = {
  start: darkModeGray,
  message: darkModeGreen,
  buttons: darkModeGreen,
  buttonsItem: darkModeGreen,
  dynamicButtons: darkModeGreen,
  articles: darkModeGreen,
  cards: darkModeGreen,
  dynamicCards: darkModeGreen,
  collectDetails: darkModeGreen,
  tool: darkModePurple,
  toolResult: darkModePurple,
  setAttribute: darkModePurple,
  addTags: darkModePurple,
  branches: darkModeBlue,
  branchesItem: darkModeBlue,
  transfer: darkModeOrange,
  closeConversation: darkModeOrange,
  goToStep: darkModeOrange,
  goToFlow: darkModeOrange,
  placeholder: transparent,
};

export function useAllNodeColorCssVariables() {
  const isDarkMode = useIsDarkMode();
  const colors = isDarkMode ? nodeColorsDark : nodeColorsLight;
  const variables: Record<string, string> = {};
  for (const key in colors) {
    variables[`--node-color-${key}-bg`] = colors[key as FlowNodeType].bg;
    variables[`--node-color-${key}-fg`] = colors[key as FlowNodeType].fg;
  }
  return variables;
}

export function useNodeColorCssVariables(type: FlowNodeType) {
  return useMemo(() => {
    return {
      backgroundColor: `var(--node-color-${type}-bg)`,
      color: `var(--node-color-${type}-fg)`,
    };
  }, [type]);
}
