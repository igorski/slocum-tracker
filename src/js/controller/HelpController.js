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

/* private properties */

let container, slocum;
let contentContainer, currentSection;

module.exports =
{
    /**
     * initialize HelpController, attach HelpView template into give container
     *
     * @param containerRef
     * @param slocumRef
     */
    init( containerRef, slocumRef )
    {
        container = containerRef;
        slocum    = slocumRef;

        // prepare view

        slocum.TemplateService.render( "helpView", container, null, true ).then(() => {

            // cache view elements

            contentContainer = container.querySelector( ".content" );

            // add listeners

            Pubsub.subscribe( Messages.DISPLAY_HELP, handleBroadcast );

            // show default content

            Pubsub.publish( Messages.DISPLAY_HELP, "helpTopicGeneral" );

        });
    }
};

/* private methods */

function handleBroadcast( type, payload )
{
    switch( type )
    {
        // payload is Handlebars filename

        case Messages.DISPLAY_HELP:

            if ( currentSection !== payload )
            {
                slocum.TemplateService.render( payload, contentContainer, payload, false, false ).then(( template ) => {

                    if ( template.length > 0 )
                        contentContainer.innerHTML = template;

                    currentSection = payload;
                });
            }
            break;
    }
}
