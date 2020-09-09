module.exports = {
    dev: {
        options: {
            browserifyOptions: {
                debug: true,
                transform: [
                    ["babelify", {
                        presets: ["@babel/preset-env"]
                    }],
                    "workerify"
                ]
            }
        },
        files: {
            '<%= config.target.dev %><%= pkg.name %>.js' : [ '<%= config.project.js %>**/*.js' ]
        }
    },
    prod: {
        options: {
            browserifyOptions: {
                debug: false,
                transform: [
                    ["babelify", {
                        presets: ["@babel/preset-env"]
                    }],
                    "workerify"
                ]
            }
        },
        files: {
            '<%= config.target.env %><%= pkg.name %>.js' : [ '<%= config.project.js %>**/*.js' ]
        }
    }
};
