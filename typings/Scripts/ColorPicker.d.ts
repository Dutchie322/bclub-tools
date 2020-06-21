declare function ColorPickerAttachEventListener(): void;
declare function ColorPickerRemoveEventListener(): void;
declare function ColorPickerStartPick(Event: any): void;
declare function ColorPickerEndPick(Event: any): void;
declare function ColorPickerGetCoordinates(Event: any): {
    X: number;
    Y: number;
};
declare function ColorPickerPickHue(Event: any): void;
declare function ColorPickerPickSV(Event: any): void;
declare function ColorPickerSelectFromPallete(Event: any): void;
declare function ColorPickerNotify(): void;
declare function ColorPickerHide(): void;
declare function ColorPickerCSSColorEquals(Color1: any, Color2: any): boolean;
declare function ColorPickerDraw(X: any, Y: any, Width: any, Height: any, Src: any, Callback: any): void;
declare function ColorPickerCSSToHSV(Color: any, DefaultHSV: any): any;
declare function ColorPickerHSVToCSS(HSV: any): string;
declare var ColorPickerX: any;
declare var ColorPickerY: any;
declare var ColorPickerWidth: any;
declare var ColorPickerHeight: any;
declare var ColorPickerInitialHSV: any;
declare var ColorPickerLastHSV: any;
declare var ColorPickerHSV: any;
declare var ColorPickerCallback: any;
declare var ColorPickerSourceElement: any;
declare var ColorPickerHueBarHeight: number;
declare var ColorPickerSVPanelGap: number;
declare var ColorPickerPalleteHeight: number;
declare var ColorPickerPalleteGap: number;
declare namespace ColorPickerLayout {
    const HueBarOffset: number;
    const HueBarHeight: number;
    const SVPanelOffset: number;
    const SVPanelHeight: number;
    const PalleteOffset: number;
    const PalleteHeight: number;
}
