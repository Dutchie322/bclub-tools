declare function RhythmGameLoad(): void;
declare function RhythmGameRun(): void;
declare var RhythmGameBackground: string;
declare let RhythmGameBeatmap: string;
declare let RhythmGameDifficulty: string;
declare let RhythmGameStarted: boolean;
declare let RhythmGameEnded: boolean;
declare let RhythmGamePassed: boolean;
declare let RhythmGamePreloadCompleted: boolean;
declare namespace RhythmGameInit {
    function RhythmGamePreload(): void;
    function RhythmGamePreloadCheck(): void;
    function RhythmGamePostLoad(): void;
    function RhythmGameLoadingPage(): void;
}
declare namespace RhythmGameImage {
    function preload(): void;
}
declare namespace RhythmGameAudio {
    function preload_1(): void;
    export { preload_1 as preload };
    function play(offset: any): void;
    function stop(): void;
}
declare namespace RhythmGameChart {
    function preload_2(): void;
    export { preload_2 as preload };
    function load(): void;
}
declare namespace RhythmGameKey {
    const keyPressed: boolean[];
    const key_log: any[];
    const key_log_ref: any[];
    const KEY_0: string;
    const KEY_1: string;
    const KEY_2: string;
    const KEY_3: string;
    function load_1(): void;
    export { load_1 as load };
    function addKeyListener(): void;
    function removeKeyListener(): void;
    namespace keyDownEvent {
        function handleEvent(event: any): void;
    }
    namespace keyUpEvent {
        function handleEvent_1(event: any): void;
        export { handleEvent_1 as handleEvent };
    }
}
declare namespace RhythmGameKernel {
    function load_2(): void;
    export { load_2 as load };
    function update(): void;
}
declare namespace RhythmGameScript {
    const judge_perfect: number;
    const judge_great: number;
    const judge_miss: number;
    const judge_end: number;
    const score: number;
    namespace acc {
        const value: number;
        const perfect: number;
        const great: number;
        const miss: number;
        const endMiss: number;
    }
    namespace combo {
        const value_1: number;
        export { value_1 as value };
        const rendered: boolean;
        const max: number;
    }
    const judge: any[];
    const health: number;
    function load_3(): void;
    export { load_3 as load };
    function update_1(): void;
    export { update_1 as update };
    function map_judge(): void;
    function setJudge(noteID: any, judge: any): void;
    function judgeType(timeDiff: any): "late miss" | "early miss" | "early great" | "early perfect" | "late perfect" | "late great";
    function judgeToVal(judge: any): 1 | -1 | 3 | 0 | 2;
    function update_combo(): void;
    function update_accuracy(): void;
    function update_score(): void;
    function update_health(): void;
}
declare namespace RhythmGameRender {
    const scrollSpeed: number;
    namespace cache_judge {
        const val: number;
    }
    const cache_hitEffect: {
        judge: number;
    }[];
    namespace cache_sv {
        const startFrame: number;
        const endFrame: number;
        const startSpeed: number;
        const endSpeed: number;
    }
    function load_4(): void;
    export { load_4 as load };
    function update_2(): void;
    export { update_2 as update };
    function keyPressEffectStageLight(): void;
    function keyPressEffectKeyLight(): void;
    function hitEffect(): void;
    function noteDrop(): void;
    function drawSingleNote(key: any, y: any, judge: any): void;
    function drawLongNote(key: any, y: any, h: any, judge: any): void;
    function showResult(): void;
    function showJudge(): void;
    function judgeRender(obj: any): void;
    function showCombo(): void;
    function showAcc(): void;
    function showScore(): void;
    function showJudgeCount(): void;
    function showHealth(): void;
}
declare namespace RhythmGameIntegration {
    const punishment_level: number;
    function load_5(): void;
    export { load_5 as load };
    function update_3(): void;
    export { update_3 as update };
    function setPunishment(): void;
}
