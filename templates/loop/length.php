<?php
if ( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly

global $course;
?>

<?php if ( $length_html = $course->get_lesson_length() ) : ?>
	<span class="llms-price"><?php echo $length_html; ?></span>
<?php endif; ?>