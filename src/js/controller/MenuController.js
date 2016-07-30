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

const Pubsub   = require( "pubsub-js" );
const Messages = require( "../definitions/Messages" );

/* variables */

let header, menu, toggle;
let menuOpened = false; // whether menu is opened (mobile hamburger menu)

module.exports =
{
    init()
    {
        menu   = document.getElementById( "menu" );
        header = document.getElementById( "header" );
        toggle = menu.querySelector( ".toggle" );

        toggle.addEventListener( "click",     handleToggle );
        menu.addEventListener  ( "mouseover", handleMouseOver );

        Pubsub.subscribe( Messages.CLOSE_OVERLAYS, handleBroadcast );
    }
};

/* event handlers */

function handleToggle( e )
{
    menuOpened = !menuOpened;

    if ( menuOpened )
    {
        menu.classList.add( "opened" );
        header.classList.add( "expanded" );

        document.body.style.overflow = "hidden"; // prevent scrolling main body when scrolling menu list
    }
    else {
        menu.classList.remove( "opened" );
        header.classList.remove( "expanded" );
        document.body.style.overflow = "auto";
    }
}

function handleBroadcast( type, payload )
{
    switch ( type )
    {
        case Messages.CLOSE_OVERLAYS:

            if ( menuOpened )
                handleToggle( null );
            break;
    }
}

function handleMouseOver( aEvent )
{
    Pubsub.publish( Messages.DISPLAY_HELP, "helpTopicSong" );
}
