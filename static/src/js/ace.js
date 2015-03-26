/*---------------------------------------------------------
 * OpenERP web_code_mirror
 *---------------------------------------------------------*/

(function (instance) {
    var _t = instance.web._t,
        _lt = instance.web._lt;
    var QWeb = instance.web.qweb;

    instance.ace = {};

    function include_script(scriptPath, scriptLoaded) {
        var scriptId = 'ace-script-' + scriptPath.replace(/\//g, '_');

        if ($('#' + scriptId).length) return false; //script already loaded

        var c = document.createElement('script');
        c.type = 'text/javascript';
        c.id = scriptId;
        c.src = '/web_ace_editor/static/' + scriptPath + '.js';
        c.async = false;

        var myload = (function (loadscript) {
            return function () {
                loadscript.onload = loadscript.onreadystatechange = null;
                scriptLoaded(loadscript)
            }
        })(c);
        c.onload = function () {
            myload()
        };
        c.onreadystatechange = function () {
            if (this.readyState == 'loaded' || this.readyState == 'complete')myload()
        };

        return document.getElementsByTagName('head')[0].appendChild(c);
    }

    include_script('lib/require', function () {
        require.config({paths: {"ace": "/web_ace_editor/static/lib/ace"}});
    });

    instance.web.form.widgets.add('ace', 'instance.ace.AceEditor');

    instance.ace.AceEditor = instance.web.form.AbstractField.extend(instance.web.form.ReinitializeFieldMixin, {
        template: "AceFormWidget",

        initialize_content: function() {
            var self = this;
            if (! this.get("effective_readonly")) {
                this.$el = this.$el;
                this.auto_sized = false;
                this.default_height = this.$el.css('height');
                if (this.get("effective_readonly")) {
                    this.$el.attr('disabled', 'disabled');
                }
                this.setupFocus(this.$el);
            } else {
                this.$el = this.$el;
            }
        },
        commit_value: function () {
            if (! this.get("effective_readonly") && this.$el) {
                this.store_dom_value();
            }
            return this._super();
        },

        init: function (view, code) {

            var self = this;
            this._super.apply(this, arguments);

            this.mode = code.attrs.mode || this.options.mode || 'javascript';
            this.theme = code.attrs.theme || this.options.theme || 'monokai';
            this.filename = false;
            this.ace = false;

            self.addons = instance.web.py_eval(code.attrs.addons || '[]');

            if (code.attrs.bind) {
                code.attrs.bind = instance.web.py_eval(code.attrs.bind || '{}');

                _.each(code.attrs.bind, function (field, option) {
                    self.options[option] = self.field_manager.get_field_value(field);

                    self.field_manager.on("field_changed:" + field, self, function () {
                        self.options[option] = self.field_manager.get_field_value(field);
                        //TODO: set options in editor
                    });

                });
            }

            if (code.attrs.filename){
                self.filename = self.field_manager.get_field_value(code.attrs.filename);

                self.field_manager.on("field_changed:" + code.attrs.filename, self, function () {
                    self.filename = self.field_manager.get_field_value(code.attrs.filename);
                    self.set_mode_from_filename();
                });
            }

        },

        render_value: function() {
            if (! this.get("effective_readonly")) {
                var show_value = instance.web.format_value(this.get('value'), this, '');
                if (show_value === '') {
                    this.$el.css('height', parseInt(this.default_height, 10)+"px");
                }
                this.$el.text(show_value);
                if (! this.auto_sized) {
                    this.auto_sized = true;
                    this.$el.autosize();
                } else {
                    this.$el.trigger("autosize");
                }
                this.create_editor();
            } else {
                var txt = this.get("value") || '';
                this.$el.text(txt);
                this.create_highlighter();
            }
        },

        create_editor: function () {
            var self = this;

            self.addons.unshift('ace/ext/settings_menu');
            self.addons.unshift('ace/lib/dom');
            if (self.filename){
                self.addons.unshift("ace/ext/modelist");
            }
            self.addons.unshift('ace/ace');

            require(self.addons, function (ace) {

                self.ace = ace;

                var dom = require("ace/lib/dom");

                require("ace/commands/default_commands").commands.push({
                    name: "Toggle Fullscreen",
                    bindKey: "F11",
                    exec: function(editor) {
                        var fullScreen = dom.toggleCssClass(document.body, "fullScreen");
                        dom.setCssClass(editor.container, "fullScreen", fullScreen);
                        editor.setAutoScrollEditorIntoView(!fullScreen);
                        editor.resize()
                    }
                });

                self.editor = ace.edit(self.$el[0]);
                ace.require('ace/ext/settings_menu').init(self.editor);

                if (self.filename){
                    self.set_mode_from_filename();
                }else{
                    self.editor.session.setMode("ace/mode/" + self.mode);
                }
                self.editor.setTheme("ace/theme/" + self.theme);
                self.editor.setOptions(self.options);
                self.editor.on('change', function (){
                    self.editor.off('blur');
                    self.editor.on('blur', function (){
                            self.store_dom_value();
                            self.editor.off('blur');
                        });
                });
            });

        },

        set_mode_from_filename: function(){
            if (this.editor){
                var modelist = this.ace.require("ace/ext/modelist");
                var mode = modelist.getModeForPath(this.filename).mode;
                this.editor.session.setMode(mode);
            }
        },

        create_highlighter: function () {
            var self = this;
            var modules = ["ace/ace", "ace/ext/static_highlight"];

            if (self.filename){
                modules.push("ace/ext/modelist");
            }
            require(modules, function(ace) {
                var highlight = ace.require("ace/ext/static_highlight");
                var dom = ace.require("ace/lib/dom");

                var mode = 'ace/mode/' + self.mode;
                if (self.filename){
                    var modelist = ace.require("ace/ext/modelist");
                    mode = modelist.getModeForPath(self.filename).mode;
                }

                highlight(self.$el[0], {
                        mode: mode,
                        theme: "ace/theme/" + self.theme,
                        startLineNumber: 1,
                        showGutter: true,
                        trim: true
                    }, function (highlighted) {

                    });
            })
        },

        is_false: function() {
            return this.get('value') === '' || this._super();
        },

        focus: function($el) {
            return this.editor.focus();
        },

        store_dom_value: function () {
            this.internal_set_value(instance.web.parse_value(this.editor.getValue(), this));
        }
    });
})(openerp);