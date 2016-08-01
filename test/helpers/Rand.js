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
 *
 * helper functions for use in unit tests
 */
"use strict";

const Rand = module.exports = {

    /**
     * generate a random true-false boolean value
     *
     * @return {boolean}
     */
    randBool() {
        return ( Math.random() > .5 );
    },

    /**
     * generate a random number in the given range
     *
     * @param {number} min minimum value for the range
     * @param {number} max maximum value for the range
     * @return {number}
     */
    randomNumber( min, max ) {
        return Math.round( Math.random() * max ) + min;
    },

    /**
     * returns a random value from the given Array
     *
     * @param {Array} array
     * @return {*}
     */
    randomArrayValue( array ) {
        return array[ Rand.randomNumber( 0, array.length - 1 )];
    }
};
