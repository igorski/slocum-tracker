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

const NoteUtil   = require( "../utils/NoteUtil" );
const Messages   = require( "../definitions/Messages" );
const Select     = require( "../ui/Select" );
const SelectList = require( "../ui/SelectList" );
const TIA        = require( "../definitions/TIA" );
const Pubsub     = require( "pubsub-js" );

/* private properties */

let container, element, slocum, keyboardController;
let selectList, soundSelect, noteSelect, octaveSelect, accentSelect, data, callback;

const NoteEntryController = module.exports =
{
    /**
     * initialize NoteEntryController
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

        element = document.createElement( "div" );
        element.setAttribute( "id", "noteEntry" );

        // prepare view

        slocum.TemplateService.render( "noteEntry", element ).then(() => {

            soundSelect  = new Select( element.querySelector( "#sound" ),  handleSoundSelect );
            noteSelect   = new Select( element.querySelector( "#note" ),   handleNoteSelect );
            octaveSelect = new Select( element.querySelector( "#octave" ), handleOctaveSelect );
            accentSelect = new Select( element.querySelector( "#accent" ));

            accentSelect.setOptions([
                { title: "ACC", value: true },
                { title: "No",  value: false }
            ]);

            selectList = new SelectList(
                [ soundSelect, noteSelect, octaveSelect, accentSelect ],
                this, keyboardControllerRef
            );

            // add listeners

            element.querySelector( ".close-button" ).addEventListener  ( "click", handleClose );
            element.querySelector( ".confirm-button" ).addEventListener( "click", handleReady );
        });

        Pubsub.subscribe( Messages.CLOSE_OVERLAYS, ( type, payload ) =>
        {
            if ( payload !== NoteEntryController )
                handleClose();
        } );
    },

    /**
     * open note entry pane
     *
     * @param {Object} options
     * @param {Function} completeCallback
     */
    open( options, completeCallback )
    {
        Pubsub.publish( Messages.CLOSE_OVERLAYS, NoteEntryController ); // close open overlays

        data     = options || { sound: "", note: "", octave: "", accent: false };
        callback = completeCallback;

        keyboardController.setBlockDefaults( false );

        setSelectOptions();

        if ( data.sound !== 0 )
            soundSelect.setValue( data.sound );

        handleSoundSelect( null );

        if ( !NoteUtil.isPercussive( data.sound ))
        {
            noteSelect.setValue( data.note );
            handleNoteSelect( null );
            octaveSelect.setValue( data.octave );
        }
        updateSelectStates();

        accentSelect.setValue( data.accent );

        keyboardController.setListener( NoteEntryController );

        if ( !element.parentNode )
            container.appendChild( element );

        selectList.focus( 0, true );
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
                    handleReady();
                    break;
            }
        }
    }
};

/* private methods */

function handleClose()
{
    if ( typeof callback === "function" )
        callback( null );

    dispose();
}

function handleReady()
{
    if ( typeof callback === "function" )
    {
        data.sound  = soundSelect.getValue();
        data.note   = noteSelect.getValue();
        data.octave = parseInt( octaveSelect.getValue(), 10 );
        data.accent = ( accentSelect.getValue() === true );

        callback( data );
    }
    dispose();
}

function setSelectOptions()
{
    let tuning = slocum.activeSong.meta.tuning;
    let values = TIA.table.tunings[ tuning ];
    let perc   = TIA.table.PERCUSSION;

    let soundOptions = [];

    perc.forEach(( p ) => {
        soundOptions.push({ title: p.note, value: p.note });
    });

    Object.keys( values ).forEach(( key ) => {
        soundOptions.push({ title: key, value: key });
    });

    soundSelect.setOptions ( soundOptions );
    noteSelect.setOptions  ( [{ title: "----" }] );
    octaveSelect.setOptions( [{ title: "----" }] );
}

function handleSoundSelect()
{
    let sound  = soundSelect.getValue();
    let tuning = slocum.activeSong.meta.tuning;
    let values = TIA.table.tunings[ tuning ][ sound ];
    let noteOptions = [], collectedNotes = [], note;

    if ( values ) {
        Object.keys( values ).forEach(( key ) =>
        {
            note = values[ key ].note;
            if ( collectedNotes.indexOf( note ) === - 1 ) {
                noteOptions.push({ title: note, value: note });
                collectedNotes.push( note );
            }
        });
    }
    noteSelect.setOptions( noteOptions );
    updateSelectStates();
    handleNoteSelect();
}

function handleNoteSelect()
{
    let sound  = soundSelect.getValue();
    let note   = noteSelect.getValue();
    let tuning = slocum.activeSong.meta.tuning;
    let values = TIA.table.tunings[ tuning ][ sound ];
    let octaveOptions = [], entry;

    if ( values )
    {
        for ( let i = 0; i < values.length; ++i )
        {
            entry = values[ i ];
            if ( entry.note === note )
                octaveOptions.push({ title: entry.octave, value: entry.octave });
        }
    }
    octaveSelect.setOptions( octaveOptions );
}

function handleOctaveSelect()
{

}

function updateSelectStates()
{
    if ( NoteUtil.isPercussive( soundSelect.getValue() )) {
        noteSelect.setEnabled( false );
        octaveSelect.setEnabled( false );
    }
    else {
        noteSelect.setEnabled( true );
        octaveSelect.setEnabled( true );
    }
}

function dispose()
{
    keyboardController.setBlockDefaults( true );

    if ( element.parentNode ) {
        element.parentNode.removeChild( element );
    }
    callback = null;
}
