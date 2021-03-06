/**
 * Lesson Model
 * @since    3.13.0
 * @version  [version]
 */
define( [ 'Models/Quiz', 'Models/_Relationships', 'Models/_Utilities' ], function( Quiz, Relationships, Utilities ) {

	return Backbone.Model.extend( _.defaults( {

		/**
		 * Model relationships
		 * @type  {Object}
		 */
		relationships: {
			parents: {
				model: 'lesson',
				type: 'model',
			},
			children: {
				quiz: {
					class: 'Quiz',
					conditional: function( model ) {
						// if quiz is enabled OR not enabled but we have some quiz data as an obj
						return ( 'yes' === model.get( 'quiz_enabled' ) || ! _.isEmpty( model.get( 'quiz' ) ) );
					},
					model: 'llms_quiz',
					type: 'model',
				},
			},
		},

		/**
		 * New lesson defaults
		 * @return   obj
		 * @since    3.13.0
		 * @version  [version]
		 */
		defaults: function() {
			return {
				id: _.uniqueId( 'temp_' ),
				title: LLMS.l10n.translate( 'New Lesson' ),
				type: 'lesson',
				order: this.collection ? this.collection.length + 1 : 1,
				parent_course: window.llms_builder.course.id,
				parent_section: '',

				// urls
				edit_url: '',
				view_url: '',

				// editable fields
				content: '',
				audio_embed: '',
				video_embed: '',
				free_lesson: '',

				// other fields
				quiz: {}, // quiz model/data
				quiz_enabled: 'no',

				_forceSync: false,

			};
		},

		/**
		 * Initializer
		 * @return   void
		 * @since    [version]
		 * @version  [version]
		 */
		initialize: function() {

			this.startTracking();
			this.init_relationships();

		},

		/**
		 * Retrieve a reference to the parent course of the lesson
		 * @return   obj
		 * @since    [version]
		 * @version  [version]
		 */
		get_course: function() {
			return this.get_parent().get_parent();
		},

		/**
		 * Add a new quiz to the lesson
		 * @param    obj   data   object of quiz data used to construct a new quiz model
		 * @return   obj          model for the created quiz
		 * @since    [version]
		 * @version  [version]
		 */
		add_quiz: function( data ) {

			data = data || {};

			data.lesson_id = this.id;

			if ( ! data.title ) {

				data.title = this.get( 'title' ) + ' Quiz';

			}

			this.set( 'quiz', data );
			this.init_relationships();

			var quiz = this.get( 'quiz' );
			this.set( 'quiz_enabled', 'yes' );

			return quiz;

		},

	}, Relationships, Utilities ) );

} );
