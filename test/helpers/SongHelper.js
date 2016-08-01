/**
 * The MIT License (MIT)
 *
 * Igor Zinken 2016 - http://www.igorski.nl
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
"use strict";

const SongModel      = require( "../../src/js/model/SongModel" );
const PatternFactory = require( "../../src/js/factory/PatternFactory" );
const TIA            = require( "../../src/js/definitions/TIA" );
const Rand           = require( "./Rand" );

let TUNING_TABLE;

const SongHelper = module.exports = {

    /**
     * creates a Song Object with random proeprties
     *
     * @public
     * @return {Object}
     */
    createRandomSong() {

        const song = new SongModel().createSong();

        // generate random META data

        song.meta.title    = "foo";
        song.meta.author   = "bar";
        song.meta.created  = Date.now();
        song.meta.modified = Date.now();

        // determine a tuning table to use (all notes must come from the same table!)
        song.meta.tuning   = Rand.randomNumber( 0, 2 );
        TUNING_TABLE       = TIA.table.tunings[ song.meta.tuning ];

        // generate random hi hat data

        song.hats.start   = 16;
        song.hats.volume  = 3;
        song.hats.pitch   = 7;
        song.hats.sound   = 12;
        song.hats.steps   = (Rand.randBool()) ? 32 : 16;
        song.hats.pattern = [
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0
        ];

        const increment = ( song.hats.steps === 32 ) ? 1 : 2;

        // generate random hi-hat pattern for given step amount

        for ( let i = 0; i < 32; i += increment )
            song.hats.pattern[ i ] = (Rand.randBool()) ? 1 : 0;

        // generate random note patterns

        // QQQ
        const patternLength = 1;//Rand.randomNumber( 2, 24 );

        for ( let p = 0; p < patternLength; ++p )
            song.patterns[ p ] = SongHelper.createRandomPattern();

        return song;
    },

    /**
     * generate a pattern with random note contents
     *
     * @public
     * @param {number=} stepAmount optional amount of steps, will use
     *                  select either 16 or 32 randomly when undefined
     * @return {PATTERN}
     */
    createRandomPattern( stepAmount ) {

        stepAmount = ( typeof stepAmount === "number" ) ? stepAmount : ( Rand.randBool() ? 32 : 16 );
        const pattern = PatternFactory.createEmptyPattern( stepAmount );

        // apply random channel attenuation properties to pattern

        pattern.channel1attenuation = Rand.randBool();
        pattern.channel2attenuation = Rand.randBool();

        // generate content for each of the patterns channels

        for ( let c = 0; c < 2; ++c ) {

            const channel = pattern.channels[ c ];

            // randomly generate content for each of the channel steps

            for ( let step = 0; step < stepAmount; ++step ) {

                const sound = getRandomSoundFromTIA();
                const isPercussive = ( typeof sound.note === "undefined" );

                if ( isPercussive ) {
                    channel[ step ] = {
                        sound: sound.sound,
                        accent: Rand.randBool()
                    };
                }
                else {
                    channel[ step ] = {
                        sound: sound.sound,
                        note: sound.note,
                        octave: sound.octave,
                        accent: Rand.randBool()
                    };
                }
            }
        }
        return pattern;
    }
};

function getRandomSoundFromTIA() {

    const isPercussive = Rand.randBool();

    if ( isPercussive ) {

        const note = Rand.randomArrayValue( TIA.table.PERCUSSION );
        return {
            sound: note.note
        }
    }
    else {
        const soundKey = Rand.randomArrayValue( Object.keys( TUNING_TABLE ));
        const note = Rand.randomArrayValue( TUNING_TABLE[ soundKey ]);
        return {
            sound: soundKey,
            note: note.note,
            octave: note.octave
        }
    }
}
