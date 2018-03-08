slocum-tracker
==============

What is it ?
------------

Slocum Tracker is a JavaScript-based application that allows you to compose music for the Atari 2600 using a
tracker style interface. Slocum Tracker gets its name from the fact that it exports its output into assembly
code which can be fed to Paul Slocums Sequencer Kit (an audio driver that allows you to sequence sounds within
a musical context). Slocum Tracker as such outputs no sound by itself, but rather the instructions that can be compiled
alongside Slocums audio driver so you can listen to the results in an emulator / actual Atari 2600. Slocum Tracker
basically leverages the fact that having to write music directly into assembly language can be a tad annoyi...
er, _slows down the creative juices_.

Feature list
------------

- Directly edit the Atari 2600's two available output channels using the pattern editor
- Quickly select from all available waveforms / sound types using convenient keyboard shortcuts
- Copy / clone patterns for nice and easy arranging
- Save songs locally and continue working on them later (just don't clear the browsers local storage!)
- Generate assembly instructions when ready
- Duplicate patterns are declared only once to minimize program size

Sounds cool, but I don't want to build from source, I just want to tinker with this!!
-------------------------------------------------------------------------------------

Of course, it was made to allow for easy composition, so let's cut the chatter!
You can use the application right now from  your web browser by visiting [this link](http://www.igorski.nl/experiment/slocum-tracker).

Do pay heed to the "How to create an Atari ROM for my composition"-section below to understand how
to get the generated output from Slocum Tracker to play back sweet, pristine music on an Atari 2600 (emulator).

How to create an Atari ROM for my composition
---------------------------------------------

You will need to create a binary file that can run on an Atari 2600 (emulator). This sounds like a hassle, but merely implies
you need to download the files listed here and follow these instructions. It's quite painless really. For the ease
of the experiment (not trying to insult anyone's intelligence here!) extract all downloaded files into the same folder.

The programs you will need:

You will require an assembler such as [DASM](https://sourceforge.net/projects/dasm-dillon/files/) to compile the
assembly code into an executable program as well as [Paul Slocum's Sequencer Kit](http://www.qotile.net/files/music_kit_2.zip).

Once you have created a pattern/song that you'd like to hear, you hit the "export"-button within Slocum Tracker and download
the generated assembly file (_song.h_) to the folder that contains the assembler and Sequencer Kit mentioned above.

Depending on your operating system, execute the appropriate of the following commands:

In *Windows* from the Command Prompt:

    dasm songmain.asm -f3 -osong.bin
    
On *Mac OS X* from Terminal command line:

    ./dasm.Darwin.x86 songmain.asm -f3 -osong.bin
    
On *Linux* from Terminal command line:

    ./dasm.Linux.x86 songmain.asm -f3 -osong.bin
    
And behold, a file "_song.bin_" containing your awesome track ready for playback has been generated!

You can use an emulator such as the excellent [Stella](http://stella.sourceforge.net/downloads.php) to play your song.
If you want to run it on an actual Atari 2600, you might want to shop around [AtariAge](https://www.atariage.com/) to find
out how to get your code on a cartridge! 

Build instructions
------------------

To build slocum-tracker first resolve all dependencies using Node:

    npm install
    
After which a development mode can be started (which conveniently opens your browser and points it to the correct
location) using the following Grunt command:

    grunt dev
    
A production build (minimizes CSS and JS output size) can be created using the following Grunt command:

    grunt build
    
After which the build output is available in the _./dist/prod_-folder.
    
Unit testing
------------

Unit tests are run via Mocha, which is installed as a dependency. You can run the tests by using:

    npm test
    
Unit tests go in the _./test_-folder. The file name for a unit test must be equal to the file it is testing, but contain
the suffix "_.test_", e.g. _Functions.js_ will have a test file _Functions.test.js_.

Tools for using Slocum Tracker music in your Atari 2600 project
---------------------------------------------------------------

If you wish to use multiple Slocum Tracker songs within an Atari 2600 project and you
want to avoid pattern duplication across tracks, you can use the utility called _optimizer.js_
in the _./tools/_-folder.

The utility will scan a input folders for _.h_-files which should be
exported Slocum Tracker songs. It will read all pattern declarations within
each song and compare them with other songs to detect whether there are
duplicate patterns defined across songs.

The duplicate patterns are extracted and stored in a separate file, and
the input song pattern names are transformed to reference the shared file's
pattern names.

You can run the utility via CLI using Node.js. Example usage:

```
node optimizer.js i=/path/to/folder_containing_exported_slocum_tracker_files
```

Where the output will be created in a directory called _./out_ which will
contain generated file _shared.h_ (describing the patterns that were
duplicated across all input files), as well as all the transformed input songs.

If you wish to use these files in your project:

 * copy the contents of the _./out_-folder into your project source
 * include _shared.h_ in your custom Music Kit code
 * include all individual tracks
 
Presto. This is the approach taken in the UT2600 game. Note that the
transformed songs can safely be imported again into Slocum Tracker without
loss of data.

ROADMAP
-------

Slocum Trackers core should merge with [Efflux Tracker](https://github.com/igorski/efflux-tracker). This will enable the synthesis of actual sound (though it should not attempt to mimic the TIA!!), optimized interface and support for Web MIDI.
