namespace Test.One.Four {

    import x = Test.One.Two
    export function SecondFileFunction() {
        return x.TestFunc();
    }

    // Some comments
    export function FullReference() {
        
        return Test.One.Two.aVariable;
    }
}