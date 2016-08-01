/**
 * Created by igorzinken on 26-07-15.
 */
"use strict";

const chai        = require( "chai" );
const PatternUtil = require( "../../src/js/utils/PatternUtil" );
const SongHelper  = require( "../helpers/SongHelper" );

describe( "PatternUtil", () =>
{
    /* setup */

    // use Chai assertion library
    const assert = chai.assert,
          expect = chai.expect;

    // executed before the tests start running

    before( () =>
    {

    });

    // executed when all tests have finished running

    after( () =>
    {

    });

    // executed before each individual test

    beforeEach( () =>
    {

    });

    // executed after each individual test

    afterEach( () =>
    {

    });

    /* actual unit tests */

    it( "should recognise 32 step patterns", () =>
    {
        const pattern = SongHelper.createRandomPattern( 32 );
        assert.ok( PatternUtil.has32ndNotes( pattern ),
            "expected PatternUtil to recognise a 32-step pattern" );
    });

    it( "should recognise 16 step patterns", () =>
    {
        const pattern = SongHelper.createRandomPattern( 16 );
        assert.notOk( PatternUtil.has32ndNotes( pattern ),
            "expected PatternUtil to recognise a 16-step pattern" );
    });

    it( "should be able to shrink a 32 step pattern into a 16 step pattern", () =>
    {
        const pattern = SongHelper.createRandomPattern( 32 );
        PatternUtil.shrink( pattern );

        assert.strictEqual( 16, pattern.steps,
            "expected Pattern step amount to be 16 after shrinking" );

        assert.strictEqual( 16, pattern.channels[ 0 ].length,
            "expected Pattern channel 0 length to have shrunk" );

        assert.strictEqual( 16, pattern.channels[ 1 ].length,
            "expected Pattern channel 1 length to have shrunk" );
    });
});
