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

const AssemblerFactory = require( "../factory/AssemblerFactory" );
const Time             = require( "../utils/Time" );
const TemplateUtil     = require( "../utils/TemplateUtil" );
const SongUtil         = require( "../utils/SongUtil" );
const Pubsub           = require( "pubsub-js" );
const Messages         = require( "../definitions/Messages" );

/* private properties */

let container, slocum, keyboardController, list;

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

        container.innerHTML += TemplateUtil.render( "songView" );

        // grab references to elements in the template

        container.querySelector( "#songLoad"   ).addEventListener( "click", handleLoad );
        container.querySelector( "#songSave"   ).addEventListener( "click", handleSave );
        container.querySelector( "#songReset"  ).addEventListener( "click", handleReset );
        container.querySelector( "#songExport" ).addEventListener( "click", handleExport );

        // create a list container to show the songs when loading

        list = document.createElement( "ul" );
        list.setAttribute( "id", "songList" );
        document.body.appendChild( list ); // see CSS for visibility toggles

        list.addEventListener( "click", handleSongClick );

        // add message listeners
        Pubsub.subscribe( Messages.CLOSE_OVERLAYS, function( type, payload )
        {
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

    songs.forEach( function( song )
    {
        li = document.createElement( "li" );
        li.setAttribute( "data-id", song.id );
        li.innerHTML = "<span class='title'>" + song.meta.title + "</span><span class='date'>" + Time.timestampToDate( song.meta.created ) + "</span>";

        list.appendChild( li );
    });

    list.classList.add( "active" );

    keyboardController.setListener( SongController );
}

function handleSave( aEvent )
{
    let song = slocum.activeSong;

    if ( isValid( song )) {
        slocum.SongModel.saveSong( song );
        Pubsub.publish( Messages.SHOW_FEEDBACK, "Song '" + song.meta.title + "' saved" );
    }
}

function handleSongClick( aEvent )
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
    if ( confirm( "Are you sure you want to reset, you will lose all changes and undo history" )) {
        slocum.activeSong = slocum.SongModel.createSong();
        Pubsub.publish( Messages.SONG_LOADED, slocum.activeSong );
    }
}

function handleExport( aEvent )
{
    let song = slocum.activeSong;

    if ( isValid( song ))
    {
        let asm = AssemblerFactory.assemble( song );

        // download file to disk

        let pom = document.createElement( "a" );
        pom.setAttribute( "href", "data:text/plain;charset=utf-8," + encodeURIComponent( asm ));
        pom.setAttribute( "download", "song.h" );

        if ( document.createEvent ) {
            let event = document.createEvent( "MouseEvents" );
            event.initEvent( "click", true, true );
            pom.dispatchEvent( event );
        }
        else {
            pom.click();
        }
    }
}

/**
 * validates whether the current state of the song is
 * eligible for saving / exporting
 *
 * @private
 * @param song
 */
function isValid( song )
{
    let hasContent = SongUtil.hasContent( song );

    if ( !hasContent ) {
        Pubsub.publish( Messages.SHOW_ERROR, "Song has no pattern content!" );
        return false;
    }

    if ( song.meta.author.length === 0 || song.meta.title.length === 0 )
        hasContent = false;

    if ( !hasContent )
        Pubsub.publish( Messages.SHOW_ERROR, "Song has no title or author name, take pride in your work!" );

    return hasContent;
}

function handleClose()
{
    list.classList.remove( "active" );
}
