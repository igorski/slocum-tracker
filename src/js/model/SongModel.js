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

const Fixtures       = require( "../definitions/Fixtures" );
const PatternFactory = require( "../factory/PatternFactory" );

module.exports = SongModel;

function SongModel()
{
    /* instance properties */

    /**
     * @private
     * @type {Array.<Object>}
     */
    this._songs = [];

    /* upon initialization, get all locally stored songs */

    let songs = window.localStorage.getItem( 'songs' );

    // no songs available ? load fixtures with "factory content"

    if ( typeof songs !== "string" )
        songs = Fixtures.songs;

    try {
        this._songs = JSON.parse( songs );
    }
    catch ( e ) {}
}

/* public methods */

/**
 * get all songs stored in the model
 *
 * @public
 * @return {Array.<Object>}
 */
SongModel.prototype.getSongs = function()
{
    return this._songs;
};

/**
 * get a song from the model by its unique identifier
 *
 * @param {string} id
 * @return {Object}
 */
SongModel.prototype.getSongById = function( id )
{
    let i = this._songs.length, song;

    while ( i-- )
    {
        song = this._songs[ i ];

        if ( song.id === id )
            return song;
    }
    return null;
};

/**
 * create the outline of a new song with default
 * parameters
 *
 * @public
 * @return {Object}
 */
SongModel.prototype.createSong = function()
{
    return {

        // unique identifier

        id : Date.now() + Math.floor(( 1 + Math.random()) * 0x10000 ).toString( 16 ),

        // outline of meta data

        meta : {
            title    : "",
            author   : "",
            created  : Date.now(),
            modified : Date.now(),
            tempo    : 4, // 1 - 10
            tuning   : 0  // 0 - 2 the tuning setup to use in the TIA table
        },

        // data lists

        /**
         * this type definition states what a pattern Object looks like
         *
         * @typedef {Array.<Object>}
         */
        patterns : [
            PatternFactory.createEmptyPattern( 16 )
        ],

        hats : {
            start   : 255, // is measure num, 255 == never use auto hi-hat
            volume  : 5,   // 0 - 15
            pitch   : 0,   // 0 - 31
            sound   : 8,   // 1, 4, 6, 7, 8, 12, 14, 15
            steps   : 16,  // 16 or 32
            pattern : [
                0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0
            ]
        }
    };
};

/**
 * save given song into the model
 *
 * @public
 * @param {Object} aSong
 */
SongModel.prototype.saveSong = function( aSong )
{
    this.deleteSong( aSong );         // remove duplicate song if existed
    aSong.meta.modified = Date.now(); // update timestamp

    this._songs.push( aSong );

    this.persist();
};

/**
 * delete given song from the model
 *
 * @public
 * @param {Object} aSong
 *
 * @return {boolean} whether song was deleted
 */
SongModel.prototype.deleteSong = function( aSong )
{
    let deleted = false;
    let i = this._songs.length, song;

    // remove duplicate song if existed

    while ( i-- )
    {
        song = this._songs[ i ];

        if ( song.id === aSong.id )
        {
            if ( song.meta.title === aSong.meta.title )
            {
                // song existed, name is equal, remove old song so we can fully replace it
                this._songs.splice( i, 1 );
                deleted = true;
            }
            else {
                // song existed, but was renamed, make id unique for renamed song (will be treated as new entry)
                aSong.id += "b";
            }
            break;
        }
    }

    if ( deleted )
        this.persist();

    return deleted;
};

/* private methods */

/**
 * save the state of the model in local storage
 *
 * @private
 */
SongModel.prototype.persist = function(  )
{
    window.localStorage.setItem( 'songs', JSON.stringify( this._songs ));
};
