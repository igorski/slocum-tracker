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

const Config   = require( "../config/Config" );
const Messages = require( "../definitions/Messages" );
const Pubsub   = require( "pubsub-js" );

/* private properties */

let container, slocum, element, iframe, _binaryURL;

const JavatariController = module.exports =
{
    /**
     * initialize JavatariController
     *
     * @param containerRef
     * @param slocumRef
     */
    init( containerRef, slocumRef )
    {
        container = containerRef;
        slocum    = slocumRef;

        slocum.TemplateService.renderAsElement( "javatariView" ).then(( template ) => {

            element = template;

            // grab references to elements in the template

            iframe = element.querySelector( "iframe" );

            // attach event listeners
            iframe.addEventListener( "load", ( e ) => {
                iframe.contentWindow.postMessage({ url: _binaryURL }, document.location.origin );
            });
            element.querySelector( ".close-button" ).addEventListener( "click", handleClose );
        });

        // subscribe to messaging system

        [
            Messages.OPEN_JAVATARI_CONSOLE,
            Messages.CLOSE_OVERLAYS

        ].forEach(( msg ) => Pubsub.subscribe( msg, handleBroadcast ));
    }
};

/* internal methods */

function handleBroadcast( msg, payload )
{
    switch ( msg ) {
        case Messages.OPEN_JAVATARI_CONSOLE:
            _binaryURL = payload;
            handleOpen();
            break;

        case Messages.CLOSE_OVERLAYS:

            if ( payload !== JavatariController )
                handleClose();
            break;
    }
}

/**
 * Load the Javatari emulator in an IFrame (allows easy cleanup)
 * and launch the console for the given binary URL
 */
function handleOpen()
{
    Pubsub.publishSync( Messages.CLOSE_OVERLAYS, JavatariController ); // close open overlays
    Pubsub.publish( Messages.SHOW_BLIND );

    if ( !element.parentNode )
        container.appendChild( element );

    iframe.setAttribute( `src`, `${Config.getBasePath()}assets/html/Javatari.html` );
}

/**
 * Dispose Javatari emulator
 * and close the overlay
 */
function handleClose() {

    if ( element.parentNode ) {

        Pubsub.publishSync( Messages.HIDE_BLIND );

        // unloads emulator
        iframe.setAttribute( "src", "" );

        element.parentNode.removeChild( element );
    }

    // free allocated memory
    if ( _binaryURL ) {
        URL.revokeObjectURL( _binaryURL );
        _binaryURL = null;
    }
}
