/**
 * The MIT License (MIT)
 *
 * Igor Zinken 2016-2018 - http://www.igorski.nl
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

const Time           = require( "../utils/Time" );
const ObjectUtil     = require( "../utils/ObjectUtil" );
const TemplateUtil   = require( "../utils/TemplateUtil" );
const SongFactory    = require( "../factory/SongFactory" );
const PatternFactory = require( "../factory/PatternFactory" );
const NoteUtil       = require( "../utils/NoteUtil" );
const PatternUtil    = require( "../utils/PatternUtil" );
const TextFileUtil   = require( "../utils/TextFileUtil" );
const TIA            = require( "../definitions/TIA" );
const MD5            = require( "md5" );

const DECLARATION_WORD = "    word ",
      DECLARATION_BYTE = "    byte ";

module.exports =
{
    /**
     * @public
     * @param {Object} song JSON song
     * @return {string} song as assembly code for Paul Slocums Sequencer Kit
     */
    assemble( song )
    {
        // clone data as we must modify some properties prior to passing it to the Handlebars template...

        const data = ObjectUtil.clone( song );

        data.meta.created = Time.timestampToDate( data.meta.created );
        data.patterns     = convertPatternToAsm( data.patterns, TIA.table.tunings[ song.meta.tuning ]);
        data.hats.pattern = convertHatPattern( data.hats.pattern );

        return TemplateUtil.render( "asm", data );
    },

    /**
     * @public
     * @param {string} song as assembly code for Paul Slocums Sequencer Kit
     * @return {Object} song JSON song
     */
    disassemble( song )
    {
        let out = null;

        try {
            out = SongFactory.createSong();
            const list = TextFileUtil.textToLineArray( song );

            // 1. collect meta

            const title = TextFileUtil.getValueForKey( list, "; @title" );

            if ( title ) {
                const matches = title.match( /\"(.*)\"/ );
                if ( matches )
                    out.meta.title = matches[ matches.length - 1 ];
            }
            else {
                out.meta.title = "Untitled";
            }

            out.meta.author   = TextFileUtil.getValueForKey( list, "; @author ", "unknown author" );
            out.meta.created  = +new Date( TextFileUtil.getValueForKey( list, "; @created ", new Date().toString() ));
            out.meta.modified = Date.now();
            out.meta.tempo    = TextFileUtil.getValueForKey( list, "TEMPODELAY equ ", out.meta.tempo );
            out.meta.tuning   = TextFileUtil.getValueForKey( list, "; @tuning ", -1 );

            // 2. remove all comments (make parsing errorprone when keywords are mentioned in comments)

            let i = list.length, line;
            while ( i-- ) {
                line = list[ i ].trim();
                if ( line.charAt( 0 ) === ";" || line.length === 0 )
                    list.splice( i, 1 );
            }

            // 3. collect hats

            out.hats.start  = TextFileUtil.getValueForKey( list, "HATSTART equ ",  255 );
            out.hats.volume = TextFileUtil.getValueForKey( list, "HATVOLUME equ ", 5 );
            out.hats.pitch  = TextFileUtil.getValueForKey( list, "HATPITCH equ ",  0 );
            out.hats.sound  = TextFileUtil.getValueForKey( list, "HATSOUND equ ",  8 );
            out.hats.steps  = 16;

            const hatPatternStart = TextFileUtil.getLineNumForText( list, "hatPattern" ) + 1;

            let l;
            for ( i = 0, l = hatPatternStart; l < ( hatPatternStart + 4 ); ++i, ++l ) {

                line = list[ l ];

                if ( line.indexOf( DECLARATION_BYTE + "%" ) > -1 ) {
                    const pattern = line.replace( DECLARATION_BYTE + "%", "" );

                    for ( let li = 0; li < 8; ++li )
                        out.hats.pattern[( i * 8 ) + li ] = parseInt( pattern.charAt( li ), 10 );
                }
            }

            for ( i = 1; i < 32; i += 2 ) {
                if ( out.hats.pattern[ i ] !== 0 ) {
                    out.hats.steps = 32;
                    break;
                }
            }

            // 4. collect patterns

            out.patterns = [];

            const patternH   = TextFileUtil.getLastLineNumForText( list, "patternArrayH" ) + 1;
            const patternL   = TextFileUtil.getLastLineNumForText( list, "patternArrayL" ) + 1;
            const song1start = TextFileUtil.getLineNumForText( list, "song1" ) + 1;
            const song2start = TextFileUtil.getLineNumForText( list, "song2" ) + 1;

            convertAsmToPatterns( list, out.patterns, 0, patternH, patternL, song1start, out.meta.tuning );
            convertAsmToPatterns( list, out.patterns, 1, patternH, patternL, song2start, out.meta.tuning );

            PatternUtil.sanitizePatternPrecision( out.patterns );

            // unknown tuning ? try to determine tuning by most note matches

            if ( out.meta.tuning === -1 )
                out.meta.tuning = determineSongTuning( out.patterns );
        }
        catch ( e ) {
            console.warn( "error occurred during disassembly", e.message );
        }
        return out;
    }
};

/* private methods */

function convertPatternToAsm( patterns, tuning )
{
    const out = {
        channel1sequence : "",
        channel2sequence : "",
        patterns         : "",
        patternArrayH    : "",
        patternArrayL    : ""
    };

    let amountOfSteps, patternString, accents, step, code, idx, increment, attenuate, i, writeOffset;
    let patternWordString, patternId, patternExisted, existingPatternIndex, patternIndex;

    const cachedPatterns = {};
    const patternArrayH  = []; // all high volume patterns
    const patternArrayL  = []; // all low volume patterns

    patterns.forEach(( pattern ) =>
    {
        amountOfSteps = pattern.steps;
        increment     = 32 / amountOfSteps; // sequencer works in 32 steps, Slocum Tracker patterns can be 16 steps

        pattern.channels.forEach(( channel, channelIndex ) =>
        {
            attenuate         = pattern[ "channel" + ( channelIndex + 1 ) + "attenuation" ];
            patternWordString = DECLARATION_WORD;
            patternString     = "";
            idx               = 0;

            for ( i = 0, writeOffset = 0; idx < 32; ++i )
            {
                step = null;

                if ( i % increment === 0 ) {
                    step = channel[ writeOffset ];
                    ++writeOffset;
                }

                code = null;

                if ( step )
                {
                    if ( NoteUtil.isPercussive( step.sound ))
                        code = TIA.getPercussionCode( step.sound );
                    else
                        code = TIA.getCode( tuning, step.sound, step.note, step.octave );

                    // if no sound code was found, we're probably dealing with an imported
                    // song created outside of Slocum Tracker (with less strict tuning restrictions)
                    // try to find a code outside of the determined tuning

                    if ( code === null ) {
                        const tuning = TIA.getTuningBySound( step );

                        if ( tuning )
                            code = TIA.getCode( tuning, step.sound, step.note, step.octave );
                    }
                }

                // at beginning of each quarter measure, prepare accents list

                if ( idx % 8 === 0 )
                    accents = `\n${DECLARATION_BYTE}%`;

                // every two 32nd notes, prefix output with byte declaration

                if ( idx % 2 === 0 )
                    patternString += DECLARATION_BYTE;

                patternString += ( code ) ? code : "255";
                patternString += ( idx % 2 === 0 ) ? ", " : "\n";
                accents       += ( code && step.accent ) ? 1 : 0;

                ++idx;

                if ( idx % 8 === 0 || idx > 31 )
                {
                    patternString += accents + "\n\n";
                    patternId = MD5( patternString.trim() ); // create unique ID for pattern content

                    if ( !cachedPatterns.hasOwnProperty( patternId ))
                        cachedPatterns[ patternId ] = patternId + "\n" + patternString;

                    patternString      = "";
                    patternWordString += patternId;
                    patternWordString += ( idx > 31 ) ? "" : ", ";
                }
            }

            // attenuated patterns go into the lower volume "patternArrayL" (starting at index 128)
            // otherwise patterns go into the higher volume "patternArrayH" (starting at index 0)
            // here we also make sure the word pattern we just created didn't exist before
            // if it did, we'll re-use the existing declaration to save bytes!

            if ( attenuate )
            {
                existingPatternIndex = getPreviousPatternDeclaration( patternArrayL, patternWordString );
                patternExisted       = ( existingPatternIndex > -1 );

                if ( !patternExisted ) {
                    patternIndex = 128 + patternArrayL.length;
                    patternArrayL.push( `${patternWordString} ; ${patternIndex}\n` );
                }
                else
                    patternIndex = 128 + existingPatternIndex;
            }
            else
            {
                existingPatternIndex = getPreviousPatternDeclaration( patternArrayH, patternWordString );
                patternExisted       = ( existingPatternIndex > -1 );

                if ( !patternExisted ) {
                    patternIndex = patternArrayH.length;
                    patternArrayH.push( `${patternWordString} ; ${patternIndex}\n` );
                }
                else
                    patternIndex = existingPatternIndex;
            }

            // write into the channel sequences

            if ( channelIndex === 0 )
                out.channel1sequence += `${DECLARATION_BYTE}${patternIndex}\n`;
            else
                out.channel2sequence += `${DECLARATION_BYTE}${patternIndex}\n`;
        });
    });

    // convert the pattern Arrays into strings

    out.patternArrayH = patternArrayH.join( "" );
    out.patternArrayL = patternArrayL.join( "" );

    // collect all assembled patterns

    let value, replacement;

    Object.keys( cachedPatterns ).forEach(( key, index ) =>
    {
        // replace hashed value with a shorthand (otherwise code won't compile, go figure!)
        // note we use dot notation so the pattern declaration will be local to the file

        // format will be .Pattern{num}T

        replacement = `.Pattern${( index + 1 )}T`;

        // note we add a comment "; DECLARATION {name}" to the pattern definition so our
        // tools can do nifty lookups when replacing contents for compressive duties

        value = cachedPatterns[ key ].replace( key, `${replacement}; DECLARATION ${replacement}` );
        out.patterns += value;

        // replace usages of hashed value with new short hand

        out.patternArrayH = out.patternArrayH.split( key ).join( replacement );
        out.patternArrayL = out.patternArrayL.split( key ).join( replacement );
    });

    return out;
}

function convertHatPattern( pattern )
{
    let asmPattern = "";

    for ( let i = 0, l = pattern.length; i < l; ++i )
    {
        if ( i % 8 === 0 )
        {
            if ( i > 0 )
                asmPattern += "\n";

            asmPattern += ( `${DECLARATION_BYTE}%` );
        }
        asmPattern += pattern[ i ];
    }
    return asmPattern;
}

function getPreviousPatternDeclaration( patternArray, patternString )
{
    let i = patternArray.length;
    while ( i-- )
    {
        if ( patternArray[ i ].indexOf( patternString ) > -1 )
            return i;
    }
    return -1;
}

function convertAsmToPatterns(
    list, patterns, channelNum, patternH, patternL, channelPatternStartIndex, tuning ) {

    let patternIndex = 0, line;

    for ( let l = channelPatternStartIndex; l < ( channelPatternStartIndex + 255 ); ++l ) {

        line = TextFileUtil.stripTrailingComment( list[ l ] );

        if ( line.indexOf( DECLARATION_BYTE ) === -1 || line.charAt( 0 ) === ";" )
            continue;

        const bytes = line.replace( DECLARATION_BYTE, "" ).split( "," );

        for ( let bi = 0; bi < bytes.length; ++bi ) {

            const byte = parseInt( bytes[ bi ], 10 );

            // 255 implies song reached its end
            if ( byte === 255 )
                return;

            if ( patternIndex > ( patterns.length - 1 ))
                patterns.push( PatternFactory.createEmptyPattern( 32 ));

            const pattern = patterns[ patternIndex ];
            const channel = pattern.channels[ channelNum ];
            pattern.steps = 32;

            ++patternIndex;
            const attenuated = ( byte >= 128 );

            if ( channelNum === 0 )
                pattern.channel1attenuation = attenuated;
            else
                pattern.channel2attenuation = attenuated;

            let patternWordList = list[ (( attenuated ) ? patternL : patternH ) + ( byte % 128 )];
            patternWordList = patternWordList.replace( DECLARATION_WORD, "" ).split( "," );
            let patternNoteIndex = 0, event;

            patternWordList.forEach(( patternName, wordIndex ) => {

                const sanitizedName = TextFileUtil.stripTrailingComment( patternName ).trim().split( " " )[ 0 ];
                const patternEvents = TextFileUtil.getLastLineNumForText( list, sanitizedName ) + 1;

                for ( let pi = 0, pl = patternEvents; pl < list.length; ++pi, ++pl ) {

                    const patternLine = list[ pl ];

                    if ( patternLine.indexOf( DECLARATION_BYTE ) === -1 )
                        continue;

                    const notes = patternLine.split( DECLARATION_BYTE )[ 1 ].split( "," );

                    if ( notes.length === 1 ) {

                        const patternStartNoteIndex = patternNoteIndex - 8;
                        let accents;

                        if ( notes[0].trim() === "255" )
                            // "byte 255" can be used to declare an accent list where all notes have accents
                            accents = "11111111";
                        else
                            // binary list defines accents for all the 8 notes in the words 1/4 bar block
                            accents = notes[0].replace( "%", "" ).trim();

                        if ( accents.length === 8 ) {
                            for ( let ai = 0; ai < 8; ++ai ) {
                                event = channel[ patternStartNoteIndex + ai ];
                                if ( event && event.sound )
                                    event.accent = ( accents.charAt( ai ) === "1" );
                            }
                        }
                        break;
                    }
                    else if ( notes.length >= 2 ) {

                        notes.forEach(( unsanitizedNote, noteIndex ) => {

                            let note = unsanitizedNote.trim();

                            if ( note !== "255" ) {

                                const matches = note.match( /(%[0-1])\w+/ );
                                note = ( matches ) ? matches[0] : note;

                                if ( event = TIA.getSoundByCode( note, tuning ))
                                    channel[ patternNoteIndex ] = event;
                            }
                            ++patternNoteIndex;
                        });
                    }
                }
            });
        }
    }
}

function determineSongTuning( patterns ) {

    let tuning0 = 0;
    let tuning1 = 0;
    let tuning2 = 0;

    patterns.forEach(( pattern, patternIndex ) => {

        pattern.channels.forEach(( channel, channelIndex ) => {

            for ( let i = 0; i < pattern.steps; ++i ) {
                switch( TIA.getTuningBySound( channel[ i ] )) {
                    case 0:
                        ++tuning0;
                        break;

                    case 1:
                        ++tuning1;
                        break;

                    case 2:
                        ++tuning2;
                        break;
                }
            }
        });
    });

    switch ( Math.max( tuning0, tuning1, tuning2 )) {

        case tuning0:
            return 0;

        case tuning1:
            return 1;

        case tuning2:
            return 2;

        default:
            return -1;
    }
}
