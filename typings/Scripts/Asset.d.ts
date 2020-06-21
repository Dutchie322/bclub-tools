declare function AssetGroupAdd(NewAssetFamily: any, NewAsset: any): void;
declare function AssetAdd(NewAsset: any): void;
declare function AssetBuildLayer(NewLayers: any): {
    Name: any;
    AllowColorize: any;
    AllowTypes: any;
    HasExpression: any;
    HasType: any;
    NewParentGroupName: any;
    OverrideAllowPose: any;
}[];
declare function AssetBuildDescription(Family: any, CSV: any): void;
declare function AssetLoadDescription(Family: any): void;
declare function AssetLoad(A: any, Family: any): void;
declare function AssetLoadAll(): void;
declare function AssetGet(Family: any, Group: any, Name: any): any;
declare function AssetGetActivity(Family: any, Name: any): {
    Name: string;
    MaxProgress: number;
    TargetSelf: string[];
    Prerequisite: string[];
} | {
    Name: string;
    MaxProgress: number;
    Prerequisite: string[];
    TargetSelf?: undefined;
};
declare var Asset: any[];
declare var AssetGroup: any[];
declare var AssetCurrentGroup: any;
declare var Pose: any[];
