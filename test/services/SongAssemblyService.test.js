/**
 * Created by igorzinken on 26-07-15.
 */
"use strict";

const chai                = require( "chai" );
const MockBrowser         = require( "mock-browser" ).mocks.MockBrowser;
const SongHelper          = require( "../helpers/SongHelper" );
const SongAssemblyService = require( "../../src/js/services/SongAssemblyService" );
const SongModel           = require( "../../src/js/model/SongModel" );
const TIA                 = require( "../../src/js/definitions/TIA" );
const Time                = require( "../../src/js/utils/Time" );
const ObjectUtil          = require( "../../src/js/utils/ObjectUtil" );
const TextFileUtil        = require( "../../src/js/utils/TextFileUtil" );
const Rand                = require( "../helpers/Rand" );

describe( "SongAssemblyService", () =>
{
    /* setup */

    // use Chai assertion library
    const assert = chai.assert,
          expect = chai.expect;

    let song, model, browser;

    // executed before the tests start running

    before( () =>
    {
        browser       = new MockBrowser();
        global.window = browser.getWindow();

        model = new SongModel();
    });

    // executed when all tests have finished running

    after( () =>
    {

    });

    // executed before each individual test

    beforeEach( () =>
    {
        song = model.createSong();
    });

    // executed after each individual test

    afterEach( () =>
    {

    });

    /* actual unit tests */

    it( "should show the author, title and date in the assembly output", () =>
    {
        song.meta.title  = "foo";
        song.meta.author = "bar";

        const asm = TextFileUtil.textToLineArray( SongAssemblyService.assemble( song ));

        assert.ok( asm[ TextFileUtil.getLineNumForText( asm, "@title" ) ].indexOf( song.meta.title ) > -1,
            "expected assembly output to contain song title" );

        assert.ok( asm[ TextFileUtil.getLineNumForText( asm, "@author" ) ].indexOf( song.meta.author ) > -1,
            "expected assembly output to contain song title" );

        assert.ok( asm[ TextFileUtil.getLineNumForText( asm, "@created" ) ].indexOf(
                Time.timestampToDate( song.meta.created )) > -1,
            "expected assembly output to contain song title" );
    });

    it( "should have the correct tempo value in the assembly output", () =>
    {
        song.meta.tempo = Rand.randomNumber( 1, 10 );

        const asm = TextFileUtil.textToLineArray( SongAssemblyService.assemble( song ));

        const TEMPO_KEY = "TEMPODELAY equ ";
        const lineNum = TextFileUtil.getLineNumForText( asm, TEMPO_KEY );
        
        assert.ok( asm[ lineNum ].indexOf( TEMPO_KEY + song.meta.tempo ) > -1,
            "expected assembly output to contain correct tempo value" );
    });

    it( "should translate the hat pattern correctly into the assembly output", () =>
    {
        let pattern = song.hats.pattern;

        for ( let i = 0; i < pattern.length; ++i )
            pattern[ i ] = ( Rand.randBool() ) ? 1 : 0;

        const asm = TextFileUtil.textToLineArray( SongAssemblyService.assemble( song ));
        let lineStart = TextFileUtil.getLineNumForText( asm, "hatPattern" ) + 1;
        let lineEnd   = lineStart + 4; // 4 lines in total (32 steps divided by 8)
        let pIndex    = 0;
        let lookup;

        for ( lineStart; lineStart < lineEnd; ++lineStart, ++pIndex )
        {
            lookup = "    byte %" + pattern.slice( pIndex * 8, ( pIndex * 8 ) + 8 ).join( "" );
            assert.ok( asm[ lineStart ].indexOf( lookup ) > -1,
                "expected line to contain correct hat pattern definition" );
        }
    });

    it( "should translate the hat pattern properties correctly into the assembly output", () =>
    {
        const hats = song.hats;

        hats.start  = Rand.randomNumber( 0, 255 );
        hats.pitch  = Rand.randomNumber( 0, 31 );
        hats.volume = Rand.randomNumber( 0, 15 );
        hats.sound  = Rand.randomNumber( 1, 15 );

        const asm = TextFileUtil.textToLineArray( SongAssemblyService.assemble( song ));

        assert.ok( asm[ TextFileUtil.getLineNumForText( asm, "HATSTART equ" )].indexOf( hats.start ) > -1,
            "expected hat start offset to have been translated correctly" );

        assert.ok( asm[ TextFileUtil.getLineNumForText( asm, "HATVOLUME equ" )].indexOf( hats.volume ) > -1,
            "expected hat volume to have been translated correctly" );

        assert.ok( asm[ TextFileUtil.getLineNumForText( asm, "HATPITCH equ" )].indexOf( hats.pitch ) > -1,
            "expected hat pitch to have been translated correctly" );

        assert.ok( asm[ TextFileUtil.getLineNumForText( asm, "HATSOUND equ" )].indexOf( hats.sound ) > -1,
            "expected hat sound to have been translated correctly" );
    });

    it( "should declare silent patterns only once to save space", () =>
    {
        const channel1 = song.patterns[ 0 ].channels[ 0 ];
        const bank     = TIA.table.tunings[ 0 ].BASS;
        let i, l, def;

        // add some random notes for the first quaver of the first channels bar

        for ( i = 0, l = song.patterns[0].steps / 4; i < l; ++i )
        {
            def = bank[ Rand.randomNumber( 0, bank.length - 1 )];
            channel1[ i ] = {
                sound: "BASS",
                note: def.note,
                octave: def.octave,
                accent: Rand.randBool()
            };
        }

        const asm = TextFileUtil.textToLineArray( SongAssemblyService.assemble( song ));
        const patternDef = TextFileUtil.getLineNumForText( asm, "Higher volume patterns" ) + 3;

        assert.ok( asm[ patternDef ].indexOf( "word .Pattern1T, .Pattern2T, .Pattern2T, .Pattern2T" ) > -1,
            "expected one unique and three re-used patterns for channel 1" );

        assert.ok( asm[ patternDef + 1 ].indexOf( "word .Pattern2T, .Pattern2T, .Pattern2T, .Pattern2T" ) > -1,
            "expected four re-used patterns for channel 2" );
    });

    it( "should write patterns into the appropriate volume arrays", () =>
    {
        const channel1 = song.patterns[ 0 ].channels[ 0 ];
        const channel2 = song.patterns[ 0 ].channels[ 1 ];
        const bank     = TIA.table.tunings[ 0 ].BASS;
        let i, j, l, def, out;

        song.patterns[ 0 ].channel2attenuation = true; // attenuate channel 2

        // add some random notes for the first quaver of each channel

       for ( i = 0; i < 2; ++i )
        {
            for ( j = 0, l = song.patterns[ 0 ].steps / 4; j < l; ++j )
            {
                def = bank[ Rand.randomNumber( 0, bank.length - 1 )];
                out = {
                    sound: "BASS",
                    note: def.note,
                    octave: def.octave,
                    accent: Rand.randBool()
                };

                if ( i === 0 )
                    channel1[ j ] = out;
                else
                    channel2[ j ] = out;
            }
        }

        // assert results

        let asm = TextFileUtil.textToLineArray( SongAssemblyService.assemble( song ));
        let patternDef = TextFileUtil.getLineNumForText( asm, "Higher volume patterns" ) + 3;

        assert.ok( asm[ patternDef ].indexOf( "word .Pattern1T, .Pattern2T, .Pattern2T, .Pattern2T ; 0" ) > -1,
            "expected channel 1 pattern to be in the higher volume Array starting at index 0" );

        asm = TextFileUtil.textToLineArray( SongAssemblyService.assemble( song ));
        patternDef = TextFileUtil.getLineNumForText( asm, "Lower volume patterns" ) + 3;

        assert.ok( asm[ patternDef ].indexOf( "word .Pattern3T, .Pattern2T, .Pattern2T, .Pattern2T ; 128" ) > -1,
            "expected channel 2 pattern to be in the lower volume Array starting at index 128" );
    });

    it( "should define duplicate subpatterns only once to save space", () =>
    {
        const channel1 = song.patterns[ 0 ].channels[ 0 ];
        const channel2 = song.patterns[ 0 ].channels[ 1 ];
        const bank     = TIA.table.tunings[ 0 ].BASS;
        let i, j, l, def;

        // add some random notes for the first quaver of the first channels bar

        for ( i = 0, l = song.patterns[0].steps / 4; i < l; ++i )
        {
            def = bank[ Rand.randomNumber( 0, bank.length - 1 )];
            channel1[ i ] = {
                sound: "BASS",
                note: def.note,
                octave: def.octave,
                accent: Rand.randBool()
            };
        }

        // copy the 1st quaver defined in channel 1 into channel 2 at the start of its 2nd quaver

        for ( i = 0, j = 4; i < 4; ++i, ++j )
            channel2[ j ] = ObjectUtil.clone( channel1[ i ]);

        let asm = TextFileUtil.textToLineArray( SongAssemblyService.assemble( song ));
        let patternDef = TextFileUtil.getLineNumForText( asm, "Higher volume patterns" ) + 3;

        assert.ok( asm[ patternDef ].indexOf( "word .Pattern1T, .Pattern2T, .Pattern2T, .Pattern2T" ) > -1,
            "expected one unique and three re-used patterns for channel 1" );

        assert.ok( asm[ patternDef + 1 ].indexOf( "word .Pattern2T, .Pattern1T, .Pattern2T, .Pattern2T" ) > -1,
            "expected three re-used silent and one re-used pattern for channel 2" );

        // add some random notes for the last quaver of the second channels bar

        for ( i = 12, l = 16; i < l; ++i )
        {
            def = bank[ Rand.randomNumber( 0, bank.length - 1 )];
            channel2[ i ] = {
                sound: "BASS",
                note: def.note,
                octave: def.octave,
                accent: Rand.randBool()
            };
        }
        asm = TextFileUtil.textToLineArray( SongAssemblyService.assemble( song ));
        patternDef = TextFileUtil.getLineNumForText( asm, "Higher volume patterns" ) + 3;

        assert.ok( asm[ patternDef ].indexOf( "word .Pattern1T, .Pattern2T, .Pattern2T, .Pattern2T" ) > -1,
            "expected one unique and three re-used patterns for channel 1" );

        assert.ok( asm[ patternDef + 1 ].indexOf( "word .Pattern2T, .Pattern1T, .Pattern2T, .Pattern3T" ) > -1,
            "expected two re-used silent, one re-used pattern and one unique pattern for channel 2" );
    });

    it( "should duplicate pattern words only once to save space", () =>
    {
        const channel1 = song.patterns[ 0 ].channels[ 0 ];
        const channel2 = song.patterns[ 0 ].channels[ 1 ];
        const steps    = song.patterns[ 0 ].steps;
        const bank     = TIA.table.tunings[ 0 ].BASS;
        let i, l, def;

        // add some random notes for the first measure of the first channels bar

        for ( i = 0, l = steps; i < l; ++i )
        {
            def = bank[ Rand.randomNumber( 0, bank.length - 1 )];
            channel1[ i ] = {
                sound: "BASS",
                note: def.note,
                octave: def.octave,
                accent: Rand.randBool()
            };
        }

        // copy the first channels measure over onto the second channel

        for ( i = 0; i < steps; ++i )
            channel2[ i ] = ObjectUtil.clone( channel1[ i ]);

        const asm        = TextFileUtil.textToLineArray( SongAssemblyService.assemble( song ));
        const patternDef = TextFileUtil.getLineNumForText( asm, "Higher volume patterns" ) + 3;

        assert.ok( asm[ patternDef ].indexOf( "word .Pattern1T, .Pattern2T, .Pattern3T, .Pattern4T" ) > -1,
             "expected pattern declaration to match expectation" );

        assert.ok( asm[ patternDef + 1 ].length === 0,
             "expected only one pattern to have been declared as duplicates should be omitted" );

        let songDef = TextFileUtil.getLastLineNumForText( asm, "song1", true ) + 1;

        assert.ok( asm[ songDef ].indexOf( "byte 0" ) > -1,
            "expected byte 0 to have been declared for song 1" );

        songDef = TextFileUtil.getLastLineNumForText( asm, "song2", true ) + 1;

        assert.ok( asm[ songDef ].indexOf( "byte 0" ) > -1,
            "expected byte 0 to have been redeclared for song 2" );
    });

    it( "should duplicate pattern words when it doesn't exist for the specified volume pattern", () =>
    {
        const channel1 = song.patterns[ 0 ].channels[ 0 ];
        const channel2 = song.patterns[ 0 ].channels[ 1 ];
        const steps    = song.patterns[ 0 ].steps;
        const bank     = TIA.table.tunings[ 0 ].BASS;
        let i, j, l, def;

        // add some random notes for the first measure of the first channels bar

        for ( i = 0, l = steps; i < l; ++i )
        {
            def = bank[ Rand.randomNumber( 0, bank.length - 1 )];
            channel1[ i ] = {
                sound: "BASS",
                note: def.note,
                octave: def.octave,
                accent: Rand.randBool()
            };
        }

        // copy the first channels measure over onto the second channel

        for ( i = 0; i < steps; ++i )
            channel2[ i ] = ObjectUtil.clone( channel1[ i ]);

        // attenuate channel 2 (its pattern will now be part of the lower volume pattern Array)

        song.patterns[ 0 ].channel2attenuation = true;

        const asm      = TextFileUtil.textToLineArray( SongAssemblyService.assemble( song ));
        let patternDef = TextFileUtil.getLineNumForText( asm, "Higher volume patterns" ) + 3;

        assert.ok( asm[ patternDef ].indexOf( "word .Pattern1T, .Pattern2T, .Pattern3T, .Pattern4T" ) > -1,
             "expected pattern declaration to match expectation" );

        patternDef = TextFileUtil.getLineNumForText( asm, "Lower volume patterns" ) + 3;

        assert.ok( asm[ patternDef ].indexOf( "word .Pattern1T, .Pattern2T, .Pattern3T, .Pattern4T" ) > -1,
             "expected pattern to have been redeclared as it didn't exist in the lower volume Array yet" );

        let songDef = TextFileUtil.getLastLineNumForText( asm, "song1", true ) + 1;

        assert.ok( asm[ songDef ].indexOf( "byte 0" ) > -1,
            "expected byte 0 to have been declared for song 1" );

        songDef = TextFileUtil.getLastLineNumForText( asm, "song2", true ) + 1;

        assert.ok( asm[ songDef ].indexOf( "byte 128" ) > -1,
            "expected byte 128 to have been declared for song 2" );
    });

    it( "should redeclare a pattern that is a duplicate by notes, but not by accents", () =>
    {
        const channel1 = song.patterns[ 0 ].channels[ 0 ];
        const channel2 = song.patterns[ 0 ].channels[ 1 ];
        const bank     = TIA.table.tunings[ 0 ].BASS;
        let i, j, l, def;

        // add some random notes for the first quaver of the first channels bar

        for ( i = 0, l = song.patterns[0].steps / 4; i < l; ++i )
        {
          def = bank[ Rand.randomNumber( 0, bank.length - 1 )];
          channel1[ i ] = {
              sound: "BASS",
              note: def.note,
              octave: def.octave,
              accent: Rand.randBool()
          };
        }

        // copy the 1st quaver defined in channel 1 into channel 2 at the start of its 2nd quaver

        for ( i = 0, j = 4; i < 4; ++i, ++j ) {
            channel2[ j ] = ObjectUtil.clone( channel1[ i ] );
            channel2[ j ].accent = !channel1[ i ].accent; // flip the accent
        }

        const asm = TextFileUtil.textToLineArray( SongAssemblyService.assemble( song ));
        let patternDef = TextFileUtil.getLineNumForText( asm, "Higher volume patterns" ) + 3;

        assert.ok( asm[ patternDef ].indexOf( "word .Pattern1T, .Pattern2T, .Pattern2T, .Pattern2T" ) > -1,
            "expected one unique and three re-used patterns for channel 1" );

        assert.ok( asm[ patternDef + 1 ].indexOf( "word .Pattern2T, .Pattern3T, .Pattern2T, .Pattern2T" ) > -1,
            "expected two re-used silent, one re-used pattern and one unique pattern (different by accents) for channel 2" );
    });

    it( "should be able to disassemble a header file back into a Slocum Tracker song", () => {

        const song = SongHelper.createRandomSong();

        const exportedFile = SongAssemblyService.assemble( song );
        const importedSong = SongAssemblyService.disassemble( exportedFile );

        assert.ok( typeof importedSong === "object",
            "expected imported file to be converted from String to an Object" );

        // align properties that could not be restored through assembly process
        // or that lose resolution (e.g. timestamps few milliseconds off)
        importedSong.id            = song.id;
        importedSong.meta.created  = song.meta.created;
        importedSong.meta.modified = song.meta.modified;

        assert.deepEqual( song, importedSong,
            "expected imported file to equal the source Song properties" );
    });

    it( "should be able to disassemble a header file back into a Slocum Tracker song and back and forth " +
        "without loss of data", () => {

        const song = SongHelper.createRandomSong();

        const exportedFile = SongAssemblyService.assemble( song );
        const importedSong = SongAssemblyService.disassemble( exportedFile );

        // align properties that could not be restored through assembly process
        // or that lose resolution (e.g. timestamps few milliseconds off)
        importedSong.id            = song.id;
        importedSong.meta.created  = song.meta.created;
        importedSong.meta.modified = song.meta.modified;

        const assembledImportedSong = SongAssemblyService.assemble( importedSong );
        const exportImportedSong    = SongAssemblyService.disassemble( assembledImportedSong );

        // align properties that could not be restored through assembly process
        exportImportedSong.id            = song.id;
        exportImportedSong.meta.created  = song.meta.created;
        exportImportedSong.meta.modified = song.meta.modified;

        assert.deepEqual( song, exportImportedSong,
            "expected imported file to equal the source Song properties" );
    });

    it( "should be able to disassemble a header file that was optimized back into a Slocum Tracker song", () => {

        const optimizedSong = `
;-------------------------------------------------------------
; @title "foo"
; @author bar
; @created 12 Sep 2016 12:07:07.263
; @tuning 2
;

;-------------------------------------------------------------
; CONFIGURATION
;-------------------------------------------------------------
; tempo range 1 (fast) - 10 (slow)

TEMPODELAY equ 3

; global normalization of sounds

soundTurnArray
    byte 8, 0, 5, 9
    byte 0, 6, 4, 0

;-------------------------------------------------------------
; SOUND TYPES

soundTypeArray
    byte 4, 6, 7, 8
    byte 15, 12, 1, 14

;-------------------------------------------------------------
; HATS

hatPattern
    byte %10001000
    byte %10001000
    byte %10001000
    byte %10001000

HATSTART equ 9

HATVOLUME equ 5
HATPITCH equ 30
HATSOUND equ 8

;-------------------------------------------------------------
; SONG SEQUENCE

song1
    byte 0

    byte 255    ; end / loop

song2
    byte 128

    byte 255    ; end / loop

;-------------------------------------------------------------
; SONG MEASURES
;

patternArrayH
    word SHARED_Pattern_1T, .Pattern2T, .Pattern2T, .Pattern2T ; 0


; 2. Lower volume patterns (note index starts at 128)

patternArrayL
    word .Pattern2T, SHARED_Pattern_1T, .Pattern2T, .Pattern2T ; 128


;-------------------------------------------------------------
; PATTERNS:

.OPTIMIZED_SHARED_Pattern_1T
    byte %10011110, %10011110
    byte %10011110, %10011110
    byte %10011110, %10011110
    byte %10011110, %10011110

    byte %00000000

.Pattern2T
    byte %01100000, %01100000
    byte %01100000, %01100000
    byte %01100000, %01100000
    byte %01100000, %01100000

    byte %11111111
`;

        const song = SongAssemblyService.disassemble( optimizedSong );

        // expect 8 non-accented kicks and 24 accented hats
        const lChannel = song.patterns[0].channels[0];

        for ( let i = 0; i < 8; ++i ) {
            assert.strictEqual( lChannel[ i ].sound, "KICK" );
            assert.strictEqual( lChannel[ i ].accent, false );
        }

        for ( let i = 8; i < 32; ++i ) {
            assert.strictEqual( lChannel[ i ].sound, "HAT" );
            assert.strictEqual( lChannel[ i ].accent, true );
        }

        // expect 8 accented hats, 8 non-accented kicks and 16 accented hats
        const rChannel = song.patterns[0].channels[1];

        for ( let i = 0; i < 8; ++i ) {
            assert.strictEqual( rChannel[ i ].sound, "HAT" );
            assert.strictEqual( rChannel[ i ].accent, true );
        }

        for ( let i = 8; i < 16; ++i ) {
            assert.strictEqual( rChannel[ i ].sound, "KICK" );
            assert.strictEqual( rChannel[ i ].accent, false );
        }

        for ( let i = 16; i < 32; ++i ) {
            assert.strictEqual( rChannel[ i ].sound, "HAT" );
            assert.strictEqual( rChannel[ i ].accent, true );
        }
    });
});
