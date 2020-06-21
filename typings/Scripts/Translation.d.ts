declare function TranslationAvailable(FullPath: any): boolean;
declare function TranslationParseTXT(str: any): any[];
declare function TranslationString(S: any, T: any, CharacterName: any): any;
declare function TranslationDialogArray(C: any, T: any): void;
declare function TranslationTextArray(S: any, T: any): void;
declare function TranslationDialog(C: any): void;
declare function TranslationText(Text: any): void;
declare function TranslationAssetProcess(T: any): void;
declare function TranslationAsset(Family: any): void;
declare function TranslationNextLanguage(): void;
declare function TranslationLoad(): void;
declare var TranslationLanguage: string;
declare var TranslationCache: {};
declare var TranslationDictionary: {
    LanguageCode: string;
    LanguageName: string;
    EnglishName: string;
    Files: string[];
}[];
