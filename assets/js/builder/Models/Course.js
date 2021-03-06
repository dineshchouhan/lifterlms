/**
 * Course Model
 * @since    3.13.0
 * @version  [version]
 */
define( [ 'Collections/Sections', 'Models/_Relationships', 'Models/_Utilities' ], function( Sections, Relationships, Utilities ) {

	return Backbone.Model.extend( _.defaults( {

		relationships: {
			children: {
				sections: {
					class: 'Sections',
					model: 'section',
					type: 'collection',
				},
			}
		},

		/**
		 * New Course Defaults
		 * @return   obj
		 * @since    3.13.0
		 * @version [version]
		 */
		defaults: function() {
			return {
				edit_url: '',
				sections: [],
				title: 'New Course',
				type: 'course',
				view_url: '',
			}
		},

		initialize: function() {

			this.startTracking();
			this.init_relationships();

			// Sidebar "New Section" button broadcast
			Backbone.pubSub.on( 'add-new-section', this.add_section, this );

			// Sidebar "New Lesson" button broadcast
			Backbone.pubSub.on( 'add-new-lesson', this.add_lesson, this );

			Backbone.pubSub.on( 'lesson-search-select', this.add_existing_lesson, this );

		},

		add_existing_lesson: function( lesson ) {

			var data = lesson.data;

			if ( 'clone' === lesson.action ) {

				delete data.id;

			} else {

				data._forceSync = true;

			}

			delete data.order;
			delete data.parent_course;
			delete data.parent_section;

			this.add_lesson( data );

 	   	 	// var added = this.add_lesson( data ),
 	   	 	// 	temp = _.clone( added.attributes );

 	   	 	// _.each( [ 'order', 'parent_course', 'parent_section' ], function( key ) {

 	   	 	// 	console.log( key );

 	   	 	// 	added.unset( key );
 	   	 	// 	added.set( key, temp[key] );

 	   	 	// } );

 	   	 	// console.log( added );


		},

		add_lesson: function( data ) {

			data = data || {};
			var options = {},
				section;

			if ( ! data.parent_section ) {
				section = this.get_selected_section();
				if ( ! section ) {
					section = this.get( 'sections' ).last();
				}
			} else {
				section = this.get( 'sections' ).get( data.parent_section );
			}

			data._selected = true;

			data.parent_course = this.get( 'id' );

			var lesson = section.add_lesson( data, options );
			Backbone.pubSub.trigger( 'new-lesson-added', lesson );

			// expand the section
			section.set( '_expanded', true );

			return lesson;

		},

		add_section: function( data ) {

			data = data || {};
			var sections = this.get( 'sections' ),
				options = {},
				selected = this.get_selected_section();

			// if a section is selected, add the new section after the currently selected one
			if ( selected ) {
				options.at = sections.indexOf( selected ) + 1;
			}

			sections.add( data, options );

		},

		/**
		 * Retrieve the currently selected section in the course
		 * @return   obj|undefined
		 * @since    [version]
		 * @version  [version]
		 */
		get_selected_section: function() {

			return this.get( 'sections' ).find( function( model ) {
				return model.get( '_selected' );
			} );

		},

	}, Relationships, Utilities ) );

} );
