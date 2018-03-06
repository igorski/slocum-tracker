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

const SongAssemblyService = require( "../services/SongAssemblyService" );
const Messages            = require( "../definitions/Messages" );
const SongUtil            = require( "../utils/SongUtil" );
const ObjectUtil          = require( "../utils/ObjectUtil" );
const Form                = require( "../utils/Form" );
const Pubsub              = require( "pubsub-js" );

/* private properties */

let container, element, slocum, keyboardController;
let firstPattern, lastPattern;

const SongExportController = module.exports =
{
    /**
     * initialize ModuleParamController
     *
     * @param containerRef
     * @param slocumRef
     * @param keyboardControllerRef
     */
    init( containerRef, slocumRef, keyboardControllerRef )
    {
        container          = containerRef;
        slocum             = slocumRef;
        keyboardController = keyboardControllerRef;

        slocum.TemplateService.renderAsElement( "songExport" ).then(( template ) => {

            element = template;

            // grab view elements

            firstPattern = element.querySelector( "#exportStartPattern" );
            lastPattern  = element.querySelector( "#exportLastPattern" );

            // add listeners

            element.querySelector( ".close-button" ).addEventListener  ( "click", handleClose );
            element.querySelector( ".confirm-button" ).addEventListener( "click", handleConfirm );
        });

        // subscribe to messaging system

        [
            Messages.OPEN_EXPORT_WINDOW,
            Messages.CLOSE_OVERLAYS

        ].forEach(( msg ) => Pubsub.subscribe( msg, handleBroadcast ));
    },

    /* event handlers */

    handleKey( type, keyCode, event )
    {
        if ( type === "down" )
        {
            switch ( keyCode )
            {
                case 27: // escape
                    handleClose();
                    break;

                case 13: // enter
                    handleConfirm();
                    break;
            }
        }
    }
};

/* private methods */

function handleBroadcast( type, payload ) {

    switch ( type ) {

        case Messages.OPEN_EXPORT_WINDOW:
            handleOpen();
            break;

        case Messages.CLOSE_OVERLAYS:

            if ( payload !== SongExportController )
                handleClose();
            break;
    }
}

/**
 * open advanced pattern editor
 */
function handleOpen() {

    Pubsub.publishSync( Messages.CLOSE_OVERLAYS, SongExportController ); // close open overlays
    Pubsub.publish( Messages.SHOW_BLIND );

    const song             = slocum.activeSong;
    const amountOfPatterns = song.patterns.length;

    firstPattern.setAttribute( "max", amountOfPatterns );
    lastPattern.setAttribute ( "max", amountOfPatterns );

    firstPattern.value = 0;
    lastPattern.value  = amountOfPatterns - 1;

    Form.focus( firstPattern );

    keyboardController.setBlockDefaults( false );
    keyboardController.setListener( SongExportController );

    if ( !element.parentNode )
        container.appendChild( element );
}

function handleClose() {

    if ( element.parentNode ) {

        Pubsub.publishSync( Messages.HIDE_BLIND );
        keyboardController.reset();
        element.parentNode.removeChild( element );
    }
}

function handleConfirm() {

    const song  = slocum.activeSong;
    const first = Math.max( 0, Math.min( num( firstPattern ), song.patterns.length - 1 ));
    const last  = Math.min( song.patterns.length - 1, num( lastPattern ));

    const clone    = ObjectUtil.clone( song );
    clone.patterns = clone.patterns.splice( first, ( last - first ) + 1 );

    if ( SongUtil.isValid( clone ))
    {
        const asm = SongAssemblyService.assemble( clone );

        // download file to disk

        const pom = document.createElement( "a" );
        pom.setAttribute( "href", "data:text/plain;charset=utf-8," + encodeURIComponent( asm ));
        pom.setAttribute( "download", "song.h" );

        if ( document.createEvent ) {
            const event = document.createEvent( "MouseEvents" );
            event.initEvent( "click", true, true );
            pom.dispatchEvent( event );
        }
        else {
            pom.click();
        }
    }
    handleClose();
}

/**
 * retrieve the numerical value from an input element
 *
 * @private
 * @param {Element} inputElement
 * @return {number}
 */
function num( inputElement ) {
    return parseInt( inputElement.value, 10 );
}
