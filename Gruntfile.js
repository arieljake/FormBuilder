module.exports = function(grunt)
{

    grunt.initConfig(
    {
        pkg: grunt.file.readJSON('package.json'),
        jshint:
        {
            options:
            {
                esnext: true
            },
            all: ['Gruntfile.js', 'src/js/**/*.js']
        },
        sass:
        {
            dist:
            { 
                options:
                { 
                    style: 'expanded'
                },
                files:
                {
                    'build/formBuilder.css': 'src/css/formBuilder.scss'
                }
            }
        },
        traceur:
        {
            options:
            {
                modules: "amd"
            },
            custom:
            {
                files:
                {
                    'build/formBuilder.js': [
                        'deps/EventEmitter.js',
                        'deps/async.js',
                        'deps/tv4.js',
                        'src/js/Utils.js',
                        'src/js/ObjectDesc.js',
                        'src/js/Field.js',
                        'src/js/Form.js',
                        'src/js/FormBuilder.js',
                        'src/js/FormConfig.js',
                        'src/js/FormLoader.js',
                        'src/js/FieldValidator.js',
                        'src/js/SchemaValidator.js',
                        'src/js/FormValidatorFactory.js'
                    ]
                }
            },
        },
        copy:
        {
            main:
            {
                files: [
                {
                    expand: true,
                    flatten: true,
                    cwd: 'build',
                    src: ['formBuilder.js'],
                    dest: 'examples/public/js',
                    filter: 'isFile'
                },
                {
                    expand: true,
                    flatten: true,
                    cwd: 'build',
                    src: 'formBuilder.css',
                    dest: 'examples/public/css'
                },
                {
                    expand: true,
                    flatten: true,
                    cwd: 'samples',
                    src: 'form.json',
                    dest: 'examples/public/data'
                }]
            }
        },
        replace:
        {
            main:
            {
                src: ['build/formBuilder.js'],
                dest: 'build/formBuilder.js',
                replacements: [
                {
                    from: "//# sourceMappingURL=formBuilder.js.map",
                    to: ''
                }]
            }
        },
        watch:
        {
            options:
            {
                spawn: false,
                interrupt: true
            },
            main:
            {
                files: ["Gruntfile.js", "src/**/*", "examples/**/*", "samples/form.json"],
                tasks: [
                    "compile"
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-traceur');
    grunt.loadNpmTasks('grunt-newer');
    grunt.loadNpmTasks('grunt-text-replace');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-rename');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['watch']);
    grunt.registerTask('compile', ['jshint:all', 'sass:dist', 'traceur', 'replace:main', 'copy:main']);

};