export interface IButton {
  buttonId: string;
  buttonText: {
    displayText: string;
  };
  type?: number;
}

export type MyButtons = {
  text?: string;
  footer?: string;
  buttons: IButton[];
  mentions?: string[];
  caption?: string;
};
