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
const SongModel                       = require( "./model/SongModel" );
const DialogWindowController          = require( "./controller/DialogWindowController" );
const HatController                   = require( "./controller/HatController" );
const HelpController                  = require( "./controller/HelpController" );
const KeyboardController              = require( "./controller/KeyboardController" );
const MenuController                  = require( "./controller/MenuController" );
const MetaController                  = require( "./controller/MetaController" );
const NoteEntryController             = require( "./controller/NoteEntryController" );
const NotificationController          = require( "./controller/NotificationController" );
const PatternController               = require( "./controller/PatternController" );
const AdvancedPatternEditorController = require( "./controller/AdvancedPatternEditorController" );
const SongController                  = require( "./controller/SongController" );
const SongExportController            = require( "./controller/SongExportController" );
const JavatariController              = require( "./controller/JavatariController" );
const ObjectUtil                      = require( "./utils/ObjectUtil" );
const TemplateService                 = require( "./services/TemplateService" );
const Messages                        = require( "./definitions/Messages" );
const Pubsub                          = require( "pubsub-js" );

/* initialize */

(function( ref )
{
    let slocum = ref.slocum = ( ref.slocum || {});

    // prepare application model

    slocum = Object.assign( slocum, {
        SongModel       : new SongModel(),
        TemplateService : new TemplateService()
    });

    // create new empty song or load last available song

    slocum.activeSong = slocum.SongModel.createSong();

    // prepare view

    const container = document.querySelector( "#application" );

    slocum.TemplateService.render( "index", container, null, true ).then(() => {

        // initialize application controllers

        KeyboardController.init( slocum );
        MenuController.init();
        DialogWindowController.init( container, slocum );
        SongController.init( container.querySelector( "#songSection" ), slocum, KeyboardController );
        MetaController.init( container.querySelector( "#metaSection" ), slocum, KeyboardController );
        NoteEntryController.init( container, slocum, KeyboardController );
        NotificationController.init( container );
        PatternController.init(
            container.querySelector( "#patternContainer" ), slocum,
            KeyboardController, NoteEntryController
        );
        AdvancedPatternEditorController.init( container, slocum, KeyboardController );
        HelpController.init( container.querySelector( "#helpSection" ), slocum );
        HatController.init( container.querySelector( "#hatSection" ), slocum, KeyboardController );
        SongExportController.init( container, slocum, KeyboardController );
        JavatariController.init( container, slocum );
    });

    // subscribe to pubsub system to receive and broadcast messages across the application

    Pubsub.subscribe( Messages.LOAD_SONG,  handleBroadcast );
    Pubsub.subscribe( Messages.HIDE_BLIND, handleBroadcast );
    Pubsub.subscribe( Messages.SHOW_BLIND, handleBroadcast );

})( self );

/* private handlers */

function handleBroadcast( type, payload )
{
    switch ( type )
    {
        case Messages.LOAD_SONG:

            const song = slocum.SongModel.getSongById( payload );
            if ( song ) {
                slocum.activeSong = ObjectUtil.clone( song );
                Pubsub.publish( Messages.SONG_LOADED, song );
            }
            break;

        case Messages.SHOW_BLIND:
            document.body.classList.add( "blind" );
            break;

        case Messages.HIDE_BLIND:
            document.body.classList.remove( "blind" );
            break;
    }
}
