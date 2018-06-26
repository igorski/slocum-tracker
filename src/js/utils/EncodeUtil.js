/**
 * The MIT License (MIT)
 *
 * Igor Zinken 2018 - http://www.igorski.nl
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
     * Create a Blob of binary data from a given base64 encoded string
     *
     * @public
     * @param {string} base64string
     * @param {string=} contentType
     * @param {number=} sliceSize
     * @returns {Blob}
     */
    Base64toBlob( base64string, contentType = "", sliceSize = 1024 ) {

        const byteCharacters = atob( base64string );
        const byteArrays = [];

        for ( let offset = 0; offset < byteCharacters.length; offset += sliceSize ) {
            const slice = byteCharacters.slice( offset, offset + sliceSize );

            const byteNumbers = new Array(slice.length);
            for ( let i = 0; i < slice.length; i++ ) {
                byteNumbers[ i ] = slice.charCodeAt( i );
            }
            byteArrays.push( new Uint8Array( byteNumbers ));
        }

        return new Blob( byteArrays, { type: contentType });
    }
};
