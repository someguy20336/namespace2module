namespace Test.One.Four {

    import x = Test.One.Two;

    const fullyQualifiedType: Test.One.Two.AnInterface = { one: 1, two: 2 };

    export class AnotherClass {
        public full: Test.One.Two.AnInterface;
        public part: x.AClass;
        public enumProp: x.AnEnum;
    }

    export function SecondFileFunction() {
        return x.TestFunc();
    }

    // Some comments
    export function FullReference(full: Test.One.Two.AnInterface, part: x.AnInterface, enumParam: Test.One.Two.AnEnum) {
        
        const setToFull: Test.One.Two.AnInterface = full;
        const setToPart: x.AnInterface = part;
        return Test.One.Two.aVariable;
    }
}