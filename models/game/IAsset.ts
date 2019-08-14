
export interface IAsset {
    AllowBlock: undefined;
    AllowEffect: undefined;
    AllowLock: boolean;
    AllowPose: undefined;
    Alpha: undefined;
    Block: undefined;
    Bonus: undefined;
    BuyGroup: undefined;
    Description: 'College';
    Difficulty: 0;
    DrawingPriority: undefined;
    Effect: undefined;
    Enable: true;
    Expose: any[];
    ExpressionTrigger: undefined;
    Extended: boolean;
    Group: {
        AllowColorize: true;
        AllowCustomize: true;
        AllowExpression: undefined;
        AllowNone: true;
        AllowPose: string[]; // ["BackBoxTie", "BackCuffs", "BackElbowTouch", … ]
        Category: 'Appearance';
        Clothing: true
        ColorSchema: string[]; // ["Default", "#202020", "#808080", … ]
        Description: 'Cloth';
        DrawingBlink: false;
        DrawingFullAlpha: true;
        DrawingLeft: 0;
        DrawingPriority: 26;
        DrawingTop: 0;
        Effect: undefined;
        Family: 'Female3DCG';
        IsDefault: true;
        IsRestraint: false;
        KeepNaked: false;
        Name: 'Cloth';
        ParentColor: '';
        ParentGroupName: 'BodyUpper';
        ParentSize: '';
        SetPose: undefined;
        Underwear: false;
        Zone: undefined;
    };
    HeightModifier: 0;
    Hide: string[]; // ["ClothLower", "ItemNeck"]
    HideItem: undefined;
    IsLock: boolean;
    Layer: undefined;
    Name: string; // "CollegeOutfit1";
    OwnerOnly: false;
    ParentItem: undefined;
    Prerequisite: undefined;
    Random: true;
    RemoveAtLogin: false;
    RemoveTime: 0;
    RemoveTimer: 0;
    Require: undefined;
    SelfBondage: true;
    SetPose: undefined;
    Value: -1;
    Visible: true;
    Wear: true;
    WearTime: 0;
}
