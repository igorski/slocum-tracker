"use strict";

const fs               = require( "fs" );
const LineByLineReader = require( "line-by-line" );
const async            = require( "async" );
const path             = require( "path" );
const TextFileUtil     = require( "../src/js/utils/TextFileUtil" );

const INPUT_FOLDER_KEY   = "i=";
const PATTERN_DECLARATOR = ".Pattern";
const PATTERN_CONTENT    = "    byte ";
const OUTPUT_FOLDER      = `${process.cwd()}/out`;
let INPUT_FOLDER;

process.argv.forEach(( val, index, array ) => {
    if ( val.indexOf( INPUT_FOLDER_KEY ) > -1 ) {
        INPUT_FOLDER = val.split( INPUT_FOLDER_KEY )[ 1 ];
    }
});

if ( !INPUT_FOLDER ) {
    throw new Error( "no input folder specified, usage: node optimizer i=/path/to/song-files/" );
}

if ( !fs.existsSync( OUTPUT_FOLDER )) {
    fs.mkdirSync( OUTPUT_FOLDER );
}

// collect all .h files in the input folder recursively

const songFiles    = getFiles( INPUT_FOLDER ).filter(( file ) => isValidSongFile( file ));
const songContents = [];

// collect all pattern contents of each song

async.eachSeries( songFiles, ( song, next ) => {
    const lr    = new LineByLineReader( song );
    const lines = [];

    lr.on('error', ( err ) => {
        console.warn( `Error "${err}" occurred during reading of "${song}"` );
    });

    lr.on('line', ( line ) => {
        lines.push(line);
    });

    lr.on('end', () => {
        console.warn(`${lines.length} lines read from "${song}"`);
        songContents.push( collectPatterns( song, lines ));
        next();
    });

}, ( err ) => {
    if ( !err ) {
        console.log( `Done iterating through ${songFiles.length} song files(s)` );
        comparePatterns( songContents );
    }
});

/* internal methods */

/**
 * collect all patterns within a single song
 *
 * @param {Array<string>} lines all lines in the songs header
 * @return {Object}
 */
function collectPatterns( filename, lines ) {
    const patterns = [];
    let pattern;

    for ( let i = 0; i < lines.length; ++i ) {
        const line = lines[ i ];

        // is new pattern declaration ?
        if ( line.indexOf( PATTERN_DECLARATOR ) === 0 ) {
            pattern = {
                id: line,
                contents: []
            };
            patterns.push( pattern );
        }
        else if ( pattern && line.indexOf( PATTERN_CONTENT ) === 0 ) {
            pattern.contents.push( line );
        }
    }
    return {
        file: filename,
        patterns: patterns
    };
}

/**
 * compares the pattern contents across several song files.
 * If duplicate patterns are found, these are added to a list
 * so we can optimize the songs to use a shared file to minimize
 * consumption
 *
 * @param {Array<{ file: string, patterns: Array<Object>}>} songContents
 */
function comparePatterns( songContents ) {

    const duplicates = [];

    songContents.forEach(( song ) => {

        song.patterns.forEach(( pattern ) => {

            const stringifiedPattern = JSON.stringify( pattern.contents );

            songContents.forEach(( compareSong ) => {

                if ( compareSong === song )
                    return;

                compareSong.patterns.forEach(( comparePattern ) => {

                    if ( JSON.stringify( comparePattern.contents ) === stringifiedPattern) {

                        // we have a duplicate, check if this was already registered before

                        let duplicate;
                        duplicates.forEach(( compareDuplicate ) => {
                            if ( compareDuplicate.uid === stringifiedPattern )
                                duplicate = compareDuplicate;
                        });
                        if ( !duplicate ) {
                            duplicates.push( duplicate = {
                                uid: stringifiedPattern,
                                pattern: pattern.contents,
                                songs: []
                            });
                        }
                        // add duplicates from both songs into the list (if they didn't exit yet)
                        addSongToDuplicateList( duplicate, song.file,        pattern.id );
                        addSongToDuplicateList( duplicate, compareSong.file, comparePattern.id );
                    }
                });
            });
        });
    });

    if ( duplicates.length ) {
        console.log( `${duplicates.length} duplicate pattern(s) found across ${songContents.length} songs` );
        processDuplicates( duplicates );
    }
    else {
        console.log( `No duplicate patterns found across ${songContents.length} songs` );
    }
}

/**
 * adds a song to the list of duplicates, listing the name of the pattern that is duplicated elsewhere
 * this also verifies whether the song had already been registered (no double addition)
 *
 * @param {Array<{ uid: string, pattern: Array<string>, songs: Array<Object>}>} duplicate
 * @param {string} songFilename
 * @param {string} patternName
 */
function addSongToDuplicateList( duplicate, songFilename, patternName ) {
    let hadSong = false;
    duplicate.songs.forEach(( compareSong ) => {
        if ( compareSong.file === songFilename )
            hadSong = true;
    });

    // song existed, don't do anything
    if ( hadSong )
        return;

    duplicate.songs.push({
        file: songFilename,
        patternName: patternName
    });
}

/**
 * process all duplicates to generate a header file that can be
 * shared across the input files
 *
 * @param {Array<{
 *          uid: string,
 *          pattern: Array<string>,
 *          songs: Array<{ file: string, patternName: string}>
 *        }>} duplicates
 */
function processDuplicates( duplicates ) {

    // create a header file that contains the duplicate
    // contents so it can be shared across all song files

    let sharedHeader = "";

    duplicates.forEach(( duplicate, index ) => {

        const NEW_NAME = getNameForSharedPattern( index );

        sharedHeader += `${NEW_NAME}\n`;

        duplicate.pattern.forEach(( patternLine ) => {
            sharedHeader += `${patternLine}\n`;
        });
        sharedHeader += `\n`;
    });

    fs.writeFileSync( `${OUTPUT_FOLDER}/shared.h`, sharedHeader );

    console.log( `Shared header file for ${duplicates.length} created.` );

    transformDuplicateInputs( duplicates );
}

/**
 * renames all duplicate patterns within the input files to reference
 * the new pattern name in the shared header file
 *
 * @param {Array<{
 *          uid: string,
 *          pattern: Array<string>,
 *          songs: Array<{ file: string, patternName: string}>
 *        }>} duplicates
 */
function transformDuplicateInputs( duplicates ) {
    console.log( `Transforming ${duplicates.length} input files and writing to output folder.` );

    const transformed = {};
    let processed = 0;

    async.eachSeries( duplicates, ( duplicate, next ) => {

        const NEW_NAME = getNameForSharedPattern( processed );

        async.eachSeries( duplicate.songs, ( song, next ) => {

            if ( !transformed[ song.file ]) {

                fs.readFile( song.file, 'utf8', ( err, data ) => {
                    if ( !err )
                        transformed[ song.file ] = data;

                    transformed[ song.file ] = updatePatternName(
                        transformed[ song.file ], song.patternName, NEW_NAME
                    );
                    next();
                });
            }
            else {
                transformed[ song.file ] = updatePatternName(
                    transformed[ song.file ], song.patternName, NEW_NAME
                );
                next();
            }
        }, ( err ) => {
            ++processed;
            next();
        });
    }, ( err ) => {

        Object.keys( transformed ).forEach(( key ) => {

            const nameArray  = key.split( path.sep );
            const targetFile = `${OUTPUT_FOLDER}/${nameArray[ nameArray.length - 1 ]}`;

            console.log( `Writing transformed song file ${targetFile}` );

            fs.writeFileSync( targetFile, transformed[ key ], ( err ) => {
                if ( err )
                    return console.error( err );
            });
        });
    });
}

function updatePatternName( fileContents, patternNameToReplace, newPatternName ) {
    return fileContents.split( patternNameToReplace ).join( newPatternName );
}

/**
 * @param {number} index
 * @return {string}
 */
function getNameForSharedPattern( index ) {
    return `SHARED_PATTERN_${index}`;
}

/**
 * gets all files recursively for given directory
 *
 * @param {string} path
 * @param {string=} filter optional filter for the file extension
 *                  if not specified, all files are returned
 * @param {Array=} files_ optional output Array that will contain
 *        the found file list (used only by method for internal recursion)
 * @param {string=} org_ optional root folder of this search (when recursing)
 * @return {Array<string>}
 */
function getFiles( path, filter, files_, org_ ) {
    files_ = files_ || [];
    org_   = org_   || path;
    const files = fs.readdirSync( path );
    for ( let i in files ) {
        const name = path + '/' + files[ i ];
        if ( fs.statSync( name ).isDirectory()) {
            getFiles( name, filter, files_, org_ );
        } else if ( !filter || files[ i ].indexOf( filter ) > -1 ) {
            files_.push( path/*.replace( org_,"" )*/ + "/" + files[ i ]);
        }
    }
    return files_;
}

function isValidSongFile( file ) {
    // TODO: not very elaborate is it ;)
    return ( file.indexOf( ".h" ) > -1 );
}
