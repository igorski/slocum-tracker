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

const Config              = require( "../config/Config" );
const SongAssemblyService = require( "../services/SongAssemblyService" );
const Messages            = require( "../definitions/Messages" );
const EncodeUtil          = require( "../utils/EncodeUtil" );
const FileUtil            = require( "../utils/FileUtil" );
const ObjectUtil          = require( "../utils/ObjectUtil" );
const SongUtil            = require( "../utils/SongUtil" );
const Form                = require( "../utils/Form" );
const Pubsub              = require( "pubsub-js" );
const QAjax               = require( "qajax" );

/* private properties */

let container, element, slocum, supportsBinary, keyboardController;
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

        // if a path to an external compiler API has been defined, support binary exporting

        supportsBinary = ( typeof slocumRef.compilerAPI === "string" );

        slocum.TemplateService.renderAsElement( "songExport", {

            "supportsBinary": supportsBinary

        }).then(( template ) => {

            element = template;

            // grab view elements

            firstPattern = element.querySelector( "#exportStartPattern" );
            lastPattern  = element.querySelector( "#exportLastPattern" );

            // add listeners

            element.querySelector( ".close-button" ).addEventListener ( "click", handleClose );
            element.querySelector( ".export-header" ).addEventListener( "click", () => {
                validate( exportHeader );
            });

            if ( supportsBinary ) {
                element.querySelector( ".export-binary" ).addEventListener( "click", () => {
                    validate( exportBinary );
                });
                element.querySelector( ".preview-binary" ).addEventListener( "click", () => {
                    validate( previewBinary );
                });
            }
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
                    validate( supportsBinary ? previewBinary : exportHeader );
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

/**
 * Validates the form input and runs a callback function
 * on validation success
 *
 * @param {!Function} processFn will receive string song (as assembly header strinh)
 */
function validate( processFn ) {

    const song = slocum.activeSong;

    // export requested range (defaults to full song range)

    const first = Math.max( 0, Math.min( num( firstPattern ), song.patterns.length - 1 ));
    const last  = Math.min( song.patterns.length - 1, num( lastPattern ));

    const clone    = ObjectUtil.clone( song );
    clone.patterns = clone.patterns.splice( first, ( last - first ) + 1 );

    if ( clone.hats.start !== 255 )
        clone.hats.start -= first;

    if ( SongUtil.isValid( clone )) {
        processFn( SongAssemblyService.assemble( clone ));
    }
    handleClose();
}

function exportHeader( asm ) {
    FileUtil.download(
        `data:text/plain;charset=utf-8,${encodeURIComponent( asm )}`, `song.h`
    );
}

function exportBinary( asm ) {
    compileASM( asm, ( binaryURL ) => {
        FileUtil.download( binaryURL, "song.bin" );
        URL.revokeObjectURL( binaryURL );
    });
}

function previewBinary( asm ) {
    compileASM( asm, ( binaryURL ) => {
        Pubsub.publish( Messages.OPEN_JAVATARI_CONSOLE, binaryURL );
    });
}

/**
 * Invoke the assembly microservice to compile given
 * assembly program into a standalone Atari binary
 * containing the Music Kit program playing back the song
 *
 * @param {string} asm
 * @param {!Function} callback receiving Blob URL of assembled Binary
 */
function compileASM( asm, callback )
{
    const payload = { asm: asm };
    const ERROR_MESSAGE = "Error occurred during compilation of binary";

    QAjax({ url: slocum.compilerAPI, method: "POST", data: payload })
            .then(( success ) => {

                if ( success ) {
                    try {
                        const data = JSON.parse( success.responseText );
                        if ( data && data.result ) {
                            callback( URL.createObjectURL( EncodeUtil.Base64toBlob(
                                data.result.file, "application/octet-stream", 1024
                            )));
                        }
                    }
                    catch ( e ) {
                        Pubsub.publish( Messages.SHOW_ERROR, ERROR_MESSAGE );
                    }
                }
            },
            ( error ) => {
                Pubsub.publish( Messages.SHOW_ERROR, ERROR_MESSAGE );
            }
        );
}
