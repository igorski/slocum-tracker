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

    it( "should be able to expand a 16 step pattern into a 32 step pattern", () =>
    {
        const pattern = SongHelper.createRandomPattern( 16 );
        PatternUtil.expand( pattern );

        assert.strictEqual( 32, pattern.steps,
            "expected Pattern step amount to be 32 after expanding" );

        assert.strictEqual( 32, pattern.channels[ 0 ].length,
            "expected Pattern channel 0 length to have expanded" );

        assert.strictEqual( 32, pattern.channels[ 1 ].length,
            "expected Pattern channel 1 length to have expanded" );
    });

    it( "should be able to shrink individual patterns within a list of patterns", () =>
    {
        const list = [
            SongHelper.createRandomPattern( 32 ),
            SongHelper.createRandomPattern( 16 ),
            SongHelper.createRandomPattern( 32 )
        ];

        // expand second pattern to 32 steps (will still hold no 32nd-note content)
        PatternUtil.expand( list[ 1 ]);

        PatternUtil.sanitizePatternPrecision( list );

        assert.strictEqual( 32, list[ 0 ].steps,
            "expected first pattern to remain unsanitized at 32 steps" );

        assert.strictEqual( 16, list[ 1 ].steps,
            "expected second pattern to be sanitized to 16 steps" );

        assert.strictEqual( 32, list[ 2 ].steps,
            "expected third pattern to remain unsanitized at 32 steps" );
    });
});
