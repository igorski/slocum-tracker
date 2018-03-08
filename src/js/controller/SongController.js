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

const SongAssemblyService = require( "../services/SongAssemblyService" );
const Time                = require( "../utils/Time" );
const SongUtil            = require( "../utils/SongUtil" );
const Pubsub              = require( "pubsub-js" );
const Messages            = require( "../definitions/Messages" );
const EventHandler        = require( "zjslib" ).EventHandler;

/* private properties */

let container, slocum, keyboardController, list, handler;

const SongController = module.exports =
{
    /**
     * initialize SongController, attach SongView template into give container
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

        const canImportExport = ( typeof window.FileReader !== "undefined" );

        // prepare view

        const viewData = {
            canImportExport: canImportExport
        };

        slocum.TemplateService.render( "songView", container, viewData, true ).then(() => {

            // grab references to elements in the template

            container.querySelector( "#songLoad"   ).addEventListener( "click", handleLoad );
            container.querySelector( "#songSave"   ).addEventListener( "click", handleSave );
            container.querySelector( "#songReset"  ).addEventListener( "click", handleReset );
            container.querySelector( "#songExport" ).addEventListener( "click", handleExport );

            if ( canImportExport ) {

                containerRef.querySelector( "#songImport" ).addEventListener( "click", handleImport );
                containerRef.querySelector( "#songExport" ).addEventListener( "click", handleExport );
            }

            // create a list container to show the songs when loading

            list = document.createElement( "ul" );
            list.setAttribute( "id", "songList" );
            document.body.appendChild( list ); // see CSS for visibility toggles
        });

        // add message listeners
        Pubsub.subscribe( Messages.CLOSE_OVERLAYS, ( type, payload ) => {
            if ( payload !== SongController )
                handleClose()
        });
    },

    handleKey( type, keyCode, event )
    {
        if ( type === "down" && keyCode === 27 )
        {
            // close on escape key
            handleClose();
        }
    }
};

/* private methods */

function handleLoad( aEvent )
{
    Pubsub.publish( Messages.CLOSE_OVERLAYS, SongController ); // close open overlays

    let songs = slocum.SongModel.getSongs(), li;
    list.innerHTML = "";

    if ( songs.length === 0 ) {
        Pubsub.publish( Messages.SHOW_ERROR, "There are currently no songs available to load. Why not create one?" );
        return;
    }

    // create an EventHandler to hold references to all listeners (allows easy instant cleanup)
    disposeHandler();
    handler = new EventHandler();

    songs.forEach(( song ) => {
        li = document.createElement( "li" );
        li.setAttribute( "data-id", song.id );
        li.innerHTML = "<span class='title'>" + song.meta.title + ", by " + song.meta.author + "</span>" +
            "<span class='date'>" + Time.timestampToDate( song.meta.modified ) + "</span>" +
            "<span class='delete'>x</span>";

        list.appendChild( li );

        handler.addEventListener( li, "click", handleSongOpenClick );
        handler.addEventListener( li.querySelector( ".delete" ), "click", handleSongDeleteClick );
    });

    list.classList.add( "active" );

    keyboardController.setListener( SongController );
}

function handleSave( aEvent )
{
    let song = slocum.activeSong;

    if ( SongUtil.isValid( song )) {
        slocum.SongModel.saveSong( song );
        Pubsub.publish( Messages.SHOW_FEEDBACK, "Song '" + song.meta.title + "' saved" );
    }
}

function handleSongOpenClick( aEvent )
{
    if ( aEvent.target.nodeName === "LI" )
    {
        let id = aEvent.target.getAttribute( "data-id" );
        Pubsub.publish( Messages.LOAD_SONG, id );
        list.classList.remove( "active" );
    }
}

function handleReset( aEvent )
{
    Pubsub.publish( Messages.CONFIRM, {
        message:  "Are you sure you want to reset, you will lose all changes and undo history",
        confirm: () => {
            slocum.activeSong = slocum.SongModel.createSong();
            Pubsub.publish( Messages.SONG_LOADED, slocum.activeSong );
        }
    });
}

function handleImport( aEvent )
{
    // inline handler to overcome blocking of the file select popup by the browser

    const fileBrowser = document.createElement( "input" );
    fileBrowser.setAttribute( "type",   "file" );
    fileBrowser.setAttribute( "accept", ".h" );

    const simulatedEvent = document.createEvent( "MouseEvent" );
    simulatedEvent.initMouseEvent( "click", true, true, window, 1,
                                   0, 0, 0, 0, false,
                                   false, false, false, 0, null );

    fileBrowser.dispatchEvent( simulatedEvent );
    fileBrowser.addEventListener( "change", ( fileBrowserEvent ) =>
    {
        const reader = new FileReader();

        reader.onerror = ( readerEvent ) =>
        {
            Pubsub.publish( Messages.SHOW_ERROR, Copy.get( "ERROR_FILE_LOAD" ));
        };

        reader.onload = ( readerEvent ) =>
        {
            const fileData = readerEvent.target.result;
            const song     = SongAssemblyService.disassemble( /** @type {string} */ ( fileData ));

            // rudimentary check if we're dealing with a valid song

            if ( SongUtil.isValid( song ))
            {
                slocum.SongModel.saveSong( song );
                slocum.activeSong = song;
                Pubsub.publish( Messages.SONG_LOADED, song );
            }
        };
        // start reading file contents
        reader.readAsText( fileBrowserEvent.target.files[ 0 ] );
    });
}

function handleExport( aEvent )
{
    if ( SongUtil.isValid( slocum.activeSong ))
        Pubsub.publish( Messages.OPEN_EXPORT_WINDOW );
}

function handleSongDeleteClick( aEvent )
{
    const id        = aEvent.target.parentNode.getAttribute( "data-id"),
          songModel = slocum.SongModel,
          song      = songModel.getSongById( id );

    if ( !song )
        return;

    Pubsub.publish( Messages.CONFIRM, {
        message: `Are you sure you want to delete "${song.meta.title}"? This cannot be undone!`,
        confirm: () => {
            songModel.deleteSong( song );
            handleLoad( null ); // refreshes view
        }
    });
}

function handleClose()
{
    list.classList.remove( "active" );
}

/**
 * frees all event handlers attached to the created
 * SongBrowser DOM elements so they can be garbage collected
 */
function disposeHandler()
{
    if ( handler ) {
        handler.dispose();
        handler = null;
    }
}
