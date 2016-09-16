	// local data
	function materialLaserSetting(mlsName,mlsSpeed,mlsPower){
		this.name=ko.observable(mlsName);
		this.speed=ko.observable(mlsSpeed);
		this.power=ko.observable(mlsPower);
	};
	function materialType(mtName) {
		var self = this;
		this.materialName = mtName;
		this.materialName = ko.observable(mtName);
		this.materialSettings=ko.observableArray([new materialLaserSetting("cut",10,100)]);

		this.addLaserSetting = function() {
			self.materialSettings.push(new materialLaserSetting("cut",10,100));
		};
		this.removeLaserSetting = function(setting) {
			self.materialSettings.remove(setting);
		};
	};

	// knockoutjs view model
	function materialViewModel(){
		var self = this;
		this.materialList = ko.observableArray([new materialType("paper")]);

		this.addMaterial = function() {
			self.materialList.push(new materialType("paper"));
		};
	};

;(function(lw) {

    /**
    * LaserWeb materials module.
    *
    * Description...
    */
    lw.add_module('layout.panes.materials', {

        // Autoload the module ?
        autoload: true,

        // Module version
        version: '0.0.1',

        // Module title
        title: 'Materials',

        // Module icon
        icon: 'bookmark',

        // Extends
        extends: ['layout.pane'],

        // Has template (null, false, true or template path)
        has_template: true,


//	var materialList = [ {name: "paper", settingsList: [ {name: "cut", speed: 10, power: 100} ] } ];
	

        // Module initialization
        // Called once when all modules are setup.
        init: function() {
            // Add the dock entry
            this.add_dock();

            // Add the pane
            this.add_pane();

	    // load template
	    this.load_pane_template();

            // setup knockout.js bindings
            this.bind_model();

            // Notify module init is done.
            this.pub('module.init.done');
        },

        // Load the module pane template
        load_pane_template: function() {
            // Get module pane template
            var pane_template = lw.get_template('layout-materials-pane');
            // Add pane template to pane container
            this.$.pane.append(pane_template());
        },

	bind_model: function() {
		ko.applyBindings(new materialViewModel(), this.$.pane[0] );
	},

    });

})(laserweb);
