declare function WardrobeLoadCharacterNames(): void;
declare function WardrobeFixLength(): void;
declare function WardrobeLoadCharacters(Fast: any): void;
declare function WardrobeLoad(): void;
declare function WardrobeRun(): void;
declare function WardrobeClick(): void;
declare function WardrobeExit(): void;
declare function WardrobeSetCharacterName(W: any, Name: any, Push: any): void;
declare function WardrobeAssetBundle(A: any): {
    Name: any;
    Group: any;
    Color: any;
};
declare function WardrobeFastLoad(C: any, W: any, Update: any): void;
declare function WardrobeFastSave(C: any, W: any, Push: any): void;
declare function WardrobeGetExpression(C: any): {};
declare var WardrobeBackground: string;
declare var WardrobeCharacter: any[];
declare var WardrobeSelection: number;
