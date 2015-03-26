/*---------------------------------------------------------
 * OpenERP web_code_mirror
 *---------------------------------------------------------*/

(function (instance) {
    var _t = instance.web._t,
        _lt = instance.web._lt;
    var QWeb = instance.web.qweb;

    instance.ace = {};

    function include_script(scriptPath, scriptLoaded){
        var  scriptId = 'ace-script-' + scriptPath.replace(/\//g, '_');

        if ($('#'+scriptId).length) return false; //script already loaded

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

    include_script('lib/require', function(){
        require.config({paths: { "ace" : "/web_ace_editor/static/lib/ace"}});
    });

    instance.web.form.widgets.add('ace', 'instance.ace.AceEditor');

    instance.ace.AceEditor = instance.web.form.FieldText.extend({
      init: function (view, code) {

            var self = this;
            this._super.apply(this, arguments);

            this.mode =  code.attrs.mode || this.options.mode || 'javascript';
            this.theme = code.attrs.theme || this.options.theme || 'monokai';

            self.addons = instance.web.py_eval(code.attrs.addons || '[]');

            if (code.attrs.bind){
                code.attrs.bind = instance.web.py_eval(code.attrs.bind || '{}');

                _.each(code.attrs.bind, function(field, option){
                    self.options[option] = self.field_manager.get_field_value(field);

                    self.field_manager.on("field_changed:" + field, self, function() {
                        self.options[option] = self.field_manager.get_field_value(field);
                        //TODO: set options in editor
                    });

                });
            }

        },

        render_value: function () {
            this._super();
            this.create_editor();
        },

        create_editor: function () {
            var self = this;
            if (this.$textarea && this.$textarea.length) {

                self.addons.unshift('ace/ext/settings_menu');
                self.addons.unshift('ace/ace');

                require(self.addons, function(ace) {
                    self.editor = ace.edit(self.$textarea[0]);
                    ace.require('ace/ext/settings_menu').init(self.editor);
                    self.editor.setTheme("ace/theme/" + self.theme );
                    self.editor.session.setMode("ace/mode/" + self.mode );
                    self.editor.setOptions(self.options);
                });

            }
        },
        commit_value: function () {
            //this.editor.save();
            return this._super();
        }
    });
})(openerp);