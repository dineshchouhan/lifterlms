/**
 * Handles UX and Events for inline editing of views
 * Use with a Model's View
 * Allows editing model.title field via .llms-editable-title elements
 * @type     {Object}
 * @since    [version]
 * @version  [version]
 */
define( [], function() {

	return {

		media_lib: null,

		/**
		 * DOM Events
		 * @type  {Object}
		 * @since    3.13.0
		 * @version  3.13.0
		 */
		events: {
			'click .llms-add-image': 'open_media_lib',
			'click a[href="#llms-remove-image"]': 'remove_image',
			'change .llms-editable-select select': 'on_select',
			'change .llms-switch input[type="checkbox"]': 'toggle_switch',
			'focusout .llms-input': 'on_blur',
			'keydown .llms-input': 'on_keydown',
		},

		/**
		 * Retrieve a list of allowed tags for a given element
		 * @param    obj   $el  jQuery selector for the element
		 * @return   array
		 * @since    [version]
		 * @version  [version]
		 */
		get_allowed_tags: function( $el ) {

			return [ 'b', 'i', 'u', 'strong', 'em' ];

		},

		/**
		 * Retrieve the content of an element
		 * @param    obj   $el  jQuery object of the element
		 * @return   string
		 * @since    [version]
		 * @version  [version]
		 */
		get_content: function( $el ) {

			if ( 'INPUT' === $el[0].tagName ) {
				return $el.val();
			}

			if ( ! $el.attr( 'data-formatting' ) && ! $el.hasClass( 'ql-editor' ) ) {
				return $el.text();
			}

			var $html = $( '<div>' + $el.html() + '</div>' );

			$html.find( '*' ).not( this.get_allowed_tags( $el ).join( ',' ) ).each( function( ) {

				$( this ).replaceWith( this.innerHTML );

			} );

			return $html.html();

		},

		/**
		 * Determine if changes have been made to the element
		 * @param    {[obj]}   event  js event object
		 * @return   {Boolean}        true when changes have been made, false otherwise
		 * @since    3.13.0
		 * @version  [version]
		 */
		has_changed: function( event ) {
			var $el = $( event.target );
			return ( $el.attr( 'data-original-content' ) !== this.get_content( $el ) );
		},

		/**
		 * Ensure that new content is at least 1 character long
		 * @param    obj   event  js event object
		 * @return   boolean
		 * @since    [version]
		 * @version  [version]
		 */
		is_valid: function( event ) {

			var self = this,
				$el = $( event.target ),
				content = this.get_content( $el ),
				type = $el.attr( 'data-type' );

			if ( content.length < 1 ) {
				return false;
			}

			if ( 'url' === type || 'video' === type ) {
				if ( ! this._validate_url( this.get_content( $el ) ) ) {
					return false;
				}

			}

			return true;

		},

		/**
		 * Initialize elements that allow inline formatting
		 * @return   void
		 * @since    [version]
		 * @version  [version]
		 */
		init_formatting_els: function() {

			var self = this;

			this.$el.find( '.llms-input-formatting[data-formatting]' ).each( function() {

				var formatting = $( this ).attr( 'data-formatting' ).split( ',' ),
					attr = $( this ).attr( 'data-attribute' );

				var ed = new Quill( this, {
					modules: {
						toolbar: [ formatting ],
						keyboard: {
							bindings: {
								tab: {
									key: 9,
									handler: function( range, context ) {
										return true;
									},
								},
								13: {
									key: 13,
									handler: function( range, context ) {
										ed.root.blur();
										return false;
									},
								},
							},
						},
					},
					placeholder: $( this ).attr( 'data-placeholder' ),
					theme: 'bubble',
				} );

				ed.on( 'text-change', function( delta, oldDelta, source ) {
					self.model.set( attr, self.get_content( $( ed.root ) ) );
				} );

				Backbone.pubSub.trigger( 'formatting-ed-init', ed, $( this ), self );

			} );

		},

		/**
		 * Initialize editable select elements
		 * @return   void
		 * @since    [version]
		 * @version  [version]
		 */
		init_selects: function() {

			this.$el.find( '.llms-editable-select select' ).llmsSelect2( {
				width: '100%',
			} );

		},

		/**
		 * Blur/focusout function for .llms-editable-title elements
		 * Automatically saves changes if changes have been made
		 * @param    obj   event  js event object
		 * @return   void
		 * @since    3.14.1
		 * @version  3.14.1
		 */
		on_blur: function( event ) {

			event.stopPropagation();

			var self = this,
				$el = $( event.target ),
				changed = this.has_changed( event );

			if ( changed ) {

				if ( ! self.is_valid( event ) ) {
					self.revert_edits( event );
				} else {
					this.save_edits( event );
				}

			}

		},

		/**
		 * Change event for selectables
		 * @param    obj   event  js event object
		 * @return   void
		 * @since    [version]
		 * @version  [version]
		 */
		on_select: function( event ) {

			var $el = $( event.target ),
				multi = ( $el.attr( 'multiple' ) ),
				attr = $el.attr( 'name' ),
				$selected = $el.find( 'option:selected' ),
				val;

			if ( multi ) {
				val = [];
				val = $selected.map( function() {
					return this.value;
				} ).get();
			} else {
				val = $selected[0].value;
			}

			this.model.set( attr, val );

		},

		/**
		 * Keydown function for .llms-editable-title elements
		 * Blurs
		 * @param    {obj}   event  js event object
		 * @return   void
		 * @since    3.13.0
		 * @version  [version]
		 */
		on_keydown: function( event ) {

			event.stopPropagation();

			var self = this,
				key = event.which || event.keyCode,
				ctrl = event.metaKey || event.ctrlKey;

			switch ( key ) {

				case 13: // enter
					event.preventDefault();
					event.target.blur();
				break;

				case 27: // escape
					event.preventDefault();
					this.revert_edits( event );
					event.target.blur();
				break;

			}

		},

		/**
		 * Open the WP media lib
		 * @param    obj   event  js event object
		 * @return   void
		 * @since    [version]
		 * @version  [version]
		 */
		open_media_lib: function( event ) {

			event.stopPropagation();

			var self = this,
				$el = $( event.currentTarget );

			if ( self.media_lib ) {

				self.media_lib.uploader.uploader.param( 'post_id', self.model.get( 'id' ) );

			} else {

				wp.media.model.settings.post.id = self.model.get( 'id' );

				self.media_lib = wp.media.frames.file_frame = wp.media( {
					title: LLMS.l10n.translate( 'Select an image' ),
					button: {
						text: LLMS.l10n.translate( 'Use this image' ),
					},
					multiple: false	// Set to true to allow multiple files to be selected
				} );

				self.media_lib.on( 'select', function() {

					var size = $el.attr( 'data-image-size' ),
						attachment = self.media_lib.state().get( 'selection' ).first().toJSON(),
						image = self.model.get( $el.attr( 'data-attribute' ) ),
						url;

					if ( size && attachment.sizes[ size ] ) {
						url = attachment.sizes[ size ].url;
					} else {
						url = attachment.url;
					}

					image.set( {
						id: attachment.id,
						src: url,
					} );

				} );

			}

			self.media_lib.open();


		},

		/**
		 * Click event to remove an image
		 * @param    obj   event  js event obj
		 * @return   voids
		 * @since    [version]
		 * @version  [version]
		 */
		remove_image: function( event ) {

			event.preventDefault();

			this.model.get( $( event.currentTarget ).attr( 'data-attribute' ) ).set( {
				id: '',
				src: '',
			} );

		},

		/**
		 * Helper to undo changes
		 * Bound to "escape" key via on_keydwon function
		 * @param    obj   event  js event object
		 * @return   void
		 * @since    3.13.0
		 * @version  [version]
		 */
		revert_edits: function( event ) {
			var $el = $( event.target ),
				val = $el.attr( 'data-original-content' );
			$el.html( val );
		},

		/**
		 * Sync chages to the model and DB
		 * @param    {obj}   event  js event object
		 * @return   void
		 * @since    3.13.0
		 * @version  [version]
		 */
		save_edits: function( event ) {

			var $el = $( event.target ),
				val = this.get_content( $el );
			this.model.set( $el.attr( 'data-attribute' ), val );

		},

		/**
		 * Change event for a switch element
		 * @param    obj   event  js event object
		 * @return   void
		 * @since    [version]
		 * @version  [version]
		 */
		toggle_switch: function( event ) {

			event.stopPropagation();
			var $el = $( event.target ),
				attr = $el.attr( 'name' ),
				val;

			if ( $el.is( ':checked' ) ) {
				val = $el.attr( 'data-on' ) ? $el.attr( 'data-on' ) : 'yes';
			} else {
				val = $el.attr( 'data-off' ) ? $el.attr( 'data-off' ) : 'no';
			}

			if ( -1 !== attr.indexOf( '.' ) ) {

				var split = attr.split( '.' );

				if ( 'parent' === split[0] ) {
					this.model.get_parent().set( split[1], val );
				} else {
					this.model.get( split[0] ).set( split[1], val );
				}


			} else {

				this.model.set( attr, val );

			}

			this.trigger( attr.replace( '.', '-' ) + '_toggle', val );
			this.render();

		},

		/**
		 * Initializes a WP Editor on a textarea
		 * @param    string   id        CSS ID of the editor (don't include #)
		 * @param    obj      settings  optional object of settings to pass to wp.editor.initialize()
		 * @return   void
		 * @since    [version]
		 * @version  [version]
		 */
		init_editor: function( id, settings ) {

			settings = settings || {};

			wp.editor.remove( id );

			wp.editor.initialize( id, $.extend( true, wp.editor.getDefaultSettings(), {
				mediaButtons: true,
				tinymce: {
					toolbar1: 'bold,italic,strikethrough,bullist,numlist,blockquote,hr,alignleft,aligncenter,alignright,link,unlink,wp_adv',
					toolbar2: 'formatselect,underline,alignjustify,forecolor,pastetext,removeformat,charmap,outdent,indent,undo,redo,wp_help',
					setup: _.bind( this.on_editor_ready, this ),
				}
			}, settings ) );

		},

		/**
		 * Callback function called after initialization of an editor
		 * Updates UI if a label is present
		 * Binds a change event to ensure editor changes are saved to the model
		 * @param    obj   editor  wp.editor instance
		 * @return   void
		 * @since    [version]
		 * @version  [version]
		 */
		on_editor_ready: function( editor ) {

			var self = this,
				$ed = $( '#' + editor.id ),
				$parent = $ed.closest( '.llms-editable-editor' ),
				$label = $parent.find( '.llms-label' );

			if ( $label.length ) {
				$label.prependTo( $parent.find( '.wp-editor-tools' ) );
			}

			// save changes to the model
			editor.on( 'change', function( event ) {
				self.model.set( $( '#' + editor.id ).attr( 'data-attribute' ), wp.editor.getContent( editor.id ) );
			} );

		},

		_validate_url: function( str ) {

			var a = document.createElement( 'a' );
			a.href = str;
			return ( a.host && a.host !== window.location.host );

		}

	};

} );
