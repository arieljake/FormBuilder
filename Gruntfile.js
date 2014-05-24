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
            all: ['Gruntfile.js', 'src/**/*.js']
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
                        'src/ObjectDesc.js',
                        'src/Field.js', 
                        'src/Form.js', 
                        'src/FormBuilder.js', 
                        'src/FormLoader.js',
                        'src/FormValidator.js'
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
                    dest: 'examples/js/',
                    filter: 'isFile'
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
                files: ["src/**/*"],
                tasks: [
                    "compile"
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-traceur');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-newer');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-text-replace');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.registerTask('default', ['watch']);
    grunt.registerTask('compile', ['jshint:all', 'traceur', 'replace:main', 'copy:main']);

};