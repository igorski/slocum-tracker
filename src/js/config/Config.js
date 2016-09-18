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

const Bowser = require( "bowser" );

module.exports =
{
    /**
     * return the path that the application is running in, this can
     * differ dependent on the production environment
     *
     * @public
     * @return {string}
     */
    getBasePath(){
        return ( typeof window.slocumPath === "string" ) ? window.slocumPath : window.location.origin + window.location.pathname;
    },

    /**
     * whether the application is running in local development mode
     *
     * @public
     * @return {boolean}
     */
    isDevMode(){
        // simple check whether we're running through the connect plugin
        return ( window.location.hostname === "localhost" || window.location.port === "3000" );
    },

    /**
     * queries whether hover states (for help topics) are
     * supported in the current environment
     *
     * @return {boolean}
     */
    canHover() {
        // no hover on iOS as it ensures we have weird behaviour where you have
        // to click links and buttons twice (once for hover/focus, second for click)
        return !Bowser.ios;
    }
};
