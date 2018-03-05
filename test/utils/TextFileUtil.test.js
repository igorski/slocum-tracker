"use strict";

const chai         = require( "chai" );
const TextFileUtil = require( "../../src/js/utils/TextFileUtil" );

describe( "PatternUtil", () =>
{
    /* setup */

    // use Chai assertion library
    const assert = chai.assert,
          expect = chai.expect;

    /* actual unit tests */

    it( "should be able to retrieve values from a list as a Number", () => {
        const key = "HATSTART equ";
        const expectedValue = 127;
        const list = [
            `${key} ${expectedValue}`
        ];
        const actualValue = TextFileUtil.getValueForKey( list, key, 0 );

        assert.strictEqual(
            expectedValue, actualValue,
            "expected value to have been retrieved as a Number"
        );
    });

    it( "should be able to retrieve values from a list as a String", () => {
        const key = "HATSTART equ";
        const expectedValue = 127;
        const list = [
            `${key} ${expectedValue}`
        ];
        const actualValue = TextFileUtil.getValueForKey( list, key, "0" );
        assert.strictEqual(
            expectedValue.toString(), actualValue,
            "expected value to have been retrieved as a String"
        );
    });

    it( "should be able to retrieve values from a list when the key is prefixed", () => {
        const key = "HATSTART equ";
        const expectedValue = 127;
        const list = [
            `MUSIC_TRACK0_${key} ${expectedValue}`
        ];
        const actualValue = TextFileUtil.getValueForKey(
            list, key, expectedValue,
            "expected value to have been returned for key with prefix"
        );
        assert.strictEqual( expectedValue, actualValue );
    });

    it( "should be able to return the specified fallback value when the key cannot be found", () => {
        const key = "DOESN'T EXIST";
        const expectedValue = 127;
        const list = [
            `SOMETHING ELSE 666`
        ];
        const actualValue = TextFileUtil.getValueForKey( list, key, expectedValue );

        assert.strictEqual( expectedValue, actualValue, "expecged fallback value to have ben returned" );
    });
});
