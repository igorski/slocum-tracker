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

const Config   = require( "../config/Config" );
const Form     = require( "../utils/Form" );
const Pubsub   = require( "pubsub-js" );
const Messages = require( "../definitions/Messages" );

/* private properties */

let container, slocum, keyboardController;
let start, volume, pitch, steps, patternContainer;
let lastStepAmount = 0;

const HatController = module.exports =
{
    /**
     * initialize HatController, attach HatEditor template into give container
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

        // prepare view

        slocum.TemplateService.render( "hatEditor", container ).then(() => {

            // cache view elements

            start  = container.querySelector( "#hatStart" );
            volume = container.querySelector( "#hatVolume" );
            steps  = container.querySelector( "#hatSteps" );
            pitch  = container.querySelector( "#hatPitch" );
            patternContainer = container.querySelector( ".pattern ul" );

            // synchronize with model

            HatController.update();

            // add listeners

            start.addEventListener           ( "change", handleStartChange );
            volume.addEventListener          ( "change", handleVolumeChange );
            pitch.addEventListener           ( "change", handlePitchChange );
            steps.addEventListener           ( "change", handleStepsChange );
            patternContainer.addEventListener( "click",  handlePatternClick );

            if ( Config.canHover() )
                container.addEventListener( "mouseover", handleMouseOver );

        });

        Pubsub.subscribe( Messages.PATTERN_AMOUNT_UPDATED, handleBroadcast );
        Pubsub.subscribe( Messages.SONG_LOADED,            handleBroadcast );
    },

    /**
     * synchronize MetaView contents with
     * the current state of the model
     */
    update()
    {
        let song = slocum.activeSong,
            hats = song.hats;

        let amountOfPatterns = song.patterns.length;
        // title, value

        let options = [{ title: "Never", value: 255 }];
        let i = amountOfPatterns, j, button;

        while ( i-- )
        {
            options.push({
                title: "Measure " + ( i + 1 ),
                value: i.toString()
            });
        }
        Form.setOptions( start, options );

        // keep hat start in range in case pattern amount has changed

        if ( hats.start !== 255 && hats.start >= amountOfPatterns )
            hats.start = amountOfPatterns - 1;

        Form.setSelectedOption( start, hats.start );

        volume.value = hats.volume;
        pitch.value  = hats.pitch;

        // pattern step amount changed? update button amount

        if ( lastStepAmount !== hats.steps )
        {
            i = patternContainer.childNodes.length;
            while ( i-- )
                patternContainer.removeChild( patternContainer.childNodes[ i ]);

            for ( i = 0; i < hats.steps; ++i ) {
                button = document.createElement( "li" );
                patternContainer.appendChild( button );
            }
            lastStepAmount = hats.steps;

            Form.setSelectedOption( steps, hats.steps );
        }

        // update pattern buttons

        let pattern   = hats.pattern;
        let buttons   = patternContainer.querySelectorAll( "li" );
        let increment = ( pattern.length / buttons.length );

        for ( i = 0, j = 0; i < buttons.length; ++i, j += increment ) {
            button = buttons[ i ];
            if ( pattern[ j ] === 1 )
                button.classList.add( "active" );
            else
                button.classList.remove( "active" );
        }
    },

    /* event handlers */

    handleKey( type, keyCode, event )
    {
        // nothing (yet?)...
    }
};

/* private methods */

function handleBroadcast( type, payload )
{
    switch( type )
    {
        case Messages.SONG_LOADED:
        case Messages.PATTERN_AMOUNT_UPDATED:
            HatController.update();
            break;
    }
}

function handleStartChange( aEvent )
{
    slocum.activeSong.hats.start = parseInt( Form.getSelectedOption( start ), 10 );
}

function handleVolumeChange( aEvent )
{
    slocum.activeSong.hats.volume = parseInt( volume.value, 10 );
}

function handlePitchChange( aEvent )
{
    slocum.activeSong.hats.pitch = parseInt( pitch.value, 10 );
}

function handleStepsChange( aEvent )
{
    // pattern amount changed ?

    let hats      = slocum.activeSong.hats;
    let newAmount = parseInt( steps.value, 10 );
    hats.steps    = newAmount;

    // if the new step amount is less precise than the last, sanitize
    // the now out-of-range values

    if ( newAmount !== lastStepAmount )
    {
        let pattern     = hats.pattern;
        let transformed = new Array( pattern.length );

        if ( newAmount < lastStepAmount )
        {
            let increment = lastStepAmount / newAmount;

            for ( let i = 0; i < transformed.length; ++i )
                transformed[ i ] = ( i % increment === 0 ) ? pattern[ i ] : 0;

            hats.pattern = transformed;
        }
        // sync with model creates correct button amount and updates lastStepAmount
        HatController.update();
    }
}

function handleMouseOver( aEvent )
{
    Pubsub.publish( Messages.DISPLAY_HELP, "helpTopicHats" );
}

function handlePatternClick( aEvent )
{
    let element = aEvent.target;

    if ( element.tagName === "LI" )
    {
        element.classList.toggle( "active" );

        // update model

        let pattern   = slocum.activeSong.hats.pattern;
        let buttons   = patternContainer.querySelectorAll( "li" );
        let increment = ( pattern.length / buttons.length );

        for ( let i = 0, j = 0; i < buttons.length; ++i, j += increment )
            pattern[ j ] = buttons[ i ].classList.contains( "active" ) ? 1 : 0;
    }
}
