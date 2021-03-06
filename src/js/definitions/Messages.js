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

module.exports =
{
    SHOW_ERROR                   : 0,
    SHOW_FEEDBACK                : 1,
    LOAD_SONG                    : 2,
    SONG_LOADED                  : 3,
    REFRESH_SONG                 : 4,
    PATTERN_AMOUNT_UPDATED       : 5,
    DISPLAY_HELP                 : 6,
    CLOSE_OVERLAYS               : 7,  // payload is optional Controller that should not close its overlay
    OPEN_ADVANCED_PATTERN_EDITOR : 8,
    SHOW_BLIND                   : 9,
    HIDE_BLIND                   : 10,
    SHOW_DIALOG                  : 11, // payload is Object {{ message: string, title: string }}
    CONFIRM                      : 12, // payload is Object {{ message: string, title: string, confirm: Function, cancel: Function }}
    OPEN_EXPORT_WINDOW           : 13,
    OPEN_JAVATARI_CONSOLE        : 14  // payload is string Blob URL (to Atari binary)
};
