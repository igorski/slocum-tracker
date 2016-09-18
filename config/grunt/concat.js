module.exports =
{
    // copy handlebars runtime and templates

    handlebars : {
        src: [
            "<%= config.project.modules %>/handlebars/dist/handlebars.runtime.min.js",
            "<%= config.target.env %>/handlebars/templates.js"
        ],
        dest: "<%= config.target.env %>/handlebars/handlebars.js"
    }
};
