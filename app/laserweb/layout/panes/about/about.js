;(function(lw) {

    /**
    * LaserWeb about module.
    *
    * Description...
    */
    lw.add_module('layout.panes.about', {

        // Autoload the module ?
        autoload: true,

        // Module version
        version: '0.0.1',

        // Module title
        title: 'About',

        // Module icon
        icon: 'question',

        // Has template (null, false, true or template path)
        has_template: true,


        // Extends
        extends: ['layout.pane'],

	init: function() {
            // Add the dock entry
            this.add_dock();

            // Add the pane
            this.add_pane();

            // load template
            this.load_pane_template();

            // Notify module init is done.
            this.pub('module.init.done');
        },

        // Load the module pane template
        load_pane_template: function() {
            // Get module pane template
            var pane_template = lw.get_template('layout-about-pane');
            // Add pane template to pane container
            this.$.pane.append(pane_template());
        },



    });

})(laserweb);
