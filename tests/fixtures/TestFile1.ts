namespace Test.One.Two {

    export interface AnInterface {
        one: number;
        two: number;
    }

    export class AClass {
        public one: number = 1;
        public two: number = 2;
    }

    export enum AnEnum {
        blue,
        red,
        yellow
    }

    export let aVariable = "123";

    export function TestFunc() {
        const x = 3;

        let y = 2;
        let z = 4;

        return 1
    }
}