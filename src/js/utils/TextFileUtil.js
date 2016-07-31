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

module.exports = {

    /**
     * convert a multi line text into an Array of single lines
     * note tabs are also replaced with four spaces for consistency
     *
     * @param {string} text
     * @returns {Array.<string>}
     */
    textToLineArray( text ){
        const arr = text.replace( /\r\n|\n\r|\n|\r/g,"\n" ).split( "\n" );

        arr.forEach( function( line, index ) {
           arr[ index ] = line.replace( "\t", "    " );
        });
        return arr;
    },

    /**
     * retrieve the line number where the first instance
     * of given textToFind was found in given textArray
     * returns -1 if text cannot be found
     *
     * @public
     * @param {Array.<string>} textArray
     * @param {string} textToFind
     * @return {number}
     */
    getLineNumForText( textArray, textToFind ) {

        for ( let i = 0, l = textArray.length; i < l; ++i ) {

            if ( textArray[ i ].indexOf( textToFind ) > -1 )
                return i;
        }
        return -1;
    },

    /**
     * retrieve the line number where the last instance
     * of given textToFind was found in given textArray
     * returns -1 if text cannot be found
     *
     * @public
     * @param {Array.<string>} textArray
     * @param {string} textToFind
     * @param {boolean=} mustEqual optional, whether the line must
     *        strictly equal given "textToFind" in content, defaults to false
     * @return {number}
     */
    getLastLineNumForText( textArray, textToFind, mustEqual ) {

        let i = textArray.length, line;

        while ( i-- ) {

            line = textArray[ i ];

            if ( mustEqual === true && line === textToFind )
                return i;

            else if ( !mustEqual && line.indexOf( textToFind ) > -1 )
                return i;
        }
        return -1;
    },

    /**
     * get the value for given key within a assembly instruction list
     *
     * @param {Array.<string>} textArray
     * @param {string} key
     * @param {string|number=} fallbackValue optional value to return
     *        if given key is not found
     * @return {string|number}
     */
    getValueForKey( textArray, key, fallbackValue ) {

        let line;
        for ( let i = 0, l = textArray.length; i < l; ++i )
        {
            line = textArray[ i ];
            if ( line.indexOf( key ) > -1 ) {

                if ( typeof fallbackValue === "number" )
                    return parseFloat( line.replace( key, "" ));
                else
                    return line.replace( key, "" );
            }
        }
        return fallbackValue;
    }
};
