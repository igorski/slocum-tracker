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

module.exports =
{
    /**
     * check whether given pattern contains any 32nd notes
     * this method can be used to query whether a 32 step pattern
     * could in fact be a 16 step pattern instead
     *
     * @param {PATTERN} pattern
     * @return {boolean}
     */
    has32ndNotes( pattern ) {

        if ( pattern.steps === 16 )
            return false;

        let has32ndNotes = false;
        let i, note;

        pattern.channels.forEach(( channelPattern, channelIndex ) => {

            for ( i = 1; i < channelPattern.length; i += 2 ) {
                note = channelPattern[ i ];

                if ( typeof note.sound === "string")
                    has32ndNotes = true;
            }
        });
        return has32ndNotes;
    },

    /**
     * shrink a 32 step pattern to a 16 step pattern
     *
     * @param {PATTERN} pattern
     */
    shrink( pattern ) {

        if ( pattern.steps !== 32 )
            throw new Error( "cannot shrink 16 step pattern" );

        pattern.channels.forEach(( channelPattern, channelIndex ) => {

            const notes = [];

            for ( let i = 0; i < channelPattern.length; i += 2 ) {
                notes.push( channelPattern[ i ]);
            }
            pattern.channels[ channelIndex ] = notes;
        });
        pattern.steps = 16;
    }
};
