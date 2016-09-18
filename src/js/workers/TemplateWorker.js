/**
 * TemplateWorker leverages the creation of HTML templates
 * using Handlebars off the main execution thread
 */
var data, html;

self.addEventListener('message', function( aEvent ) {

    data = aEvent.data;

    if ( data !== undefined ) {

        switch ( data.cmd )
        {
            case "init":

                var scripts = data.scripts;

                if ( Array.isArray( scripts )) {
                    scripts.forEach( function( script ) {
                        importScripts( script );
                    });
                    if ( Handlebars !== undefined )
                        registerHelpers();
                }
                break;

            case "render":

                html = "";

                if ( typeof self.slocumTemplates[ data.template ] === "function" ) {
                    html = self.slocumTemplates[ data.template ]( data.data );
                }
                self.postMessage({ cmd: "ready", template: data.template, html: html });
                break;
        }
    }

}, false );

function registerHelpers() {

    /**
     * use in template like:
     * {{toLowerCase propertyName}}
     */
    Handlebars.registerHelper( "toLowerCase", function( string ) {

        if ( typeof string === "string" )
            return string.toLowerCase();

        return "";
    });

    /**
     * use in template like:
     * {{loop 10}}
     */
    Handlebars.registerHelper( "loop", function( n, block ) {

        var out = "";

        for( var i = 0; i < n; ++i )
            out += block.fn( i );

        return out;
    });

    /**
     * comparison functions for templates, use like:
     * {{#if (eq variable "value")}} ... {{/if}}
     *
     * multiple conditionals:
     *
     * {{#if (and
     *           (eq variable "value")
     *           (eq variable2 "value"))}}
     */
    Handlebars.registerHelper({

        eq: function (v1, v2) {
            return v1 === v2;
        },/*
        ne: function (v1, v2) {
            return v1 !== v2;
        },
        lt: function (v1, v2) {
            return v1 < v2;
        },
        gt: function (v1, v2) {
            return v1 > v2;
        },
        lte: function (v1, v2) {
            return v1 <= v2;
        },
        gte: function (v1, v2) {
            return v1 >= v2;
        },
        */
        and: function (v1, v2) {
            return v1 && v2;
        },
        or: function (v1, v2) {
            return v1 || v2;
        }
    });
}
