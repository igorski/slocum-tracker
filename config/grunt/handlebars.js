module.exports =
{
    // one output file goes into the distribution folder (will be loaded async by Worker)

    compileForWorkers: {
        options: {
            namespace: "slocumTemplates",
            commonjs: false,
            processName: function (filePath) {
                // template name is the filename without the suffix
                var snippets = filePath.split("/");
                return snippets[snippets.length - 1].replace(".hbs", "");
            }
        },
        files: {
            "<%= config.target.env %>/handlebars/templates.js": "src/templates/**/*.hbs",
            "src/js/handlebars/templates.js": "src/templates/**/*.hbs"
        }
    },

    // the other goes into the source folder (used by SongAssemblyService which is synchronous)

    compileForSync: {
        options: {
            namespace: "slocum",
            commonjs: true,
            processName: function (filePath) {
                // template name is the filename without the suffix
                var snippets = filePath.split("/");
                return snippets[snippets.length - 1].replace(".hbs", "");
            }
        },
        files: {
            "src/js/handlebars/templates.js": "src/templates/**/*.hbs"
        }
    }
};
