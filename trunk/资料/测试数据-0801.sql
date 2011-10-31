SET character_set_connection=latin1, character_set_results=latin1, character_set_client=binary;


INSERT INTO `tomoe_character` (`character`,`src`, `original_char`, `feature`, `first_stroke_type`, `min_n_strokes`, `max_n_strokes`, `rank`) VALUES
( '谈', 'http://www.zdic.net/zd/zi/ZdicE8ZdicB0Zdic88.htm', '谈', NULL, 0, -1, -1, 0),
( '𪚥', 'http://www.zdic.net/zd/zi3/ZdicF0ZdicAAZdic9AZdicA5.htm', '谈', NULL, 0, -1, -1, 0);
INSERT INTO `tomoe_char_img` (`char_id`, `img_src`, `thumbnail_src`) VALUES
( 1, 'http://www.zdic.net/pic/1b/8C08.gif', 'http://www.zdic.net/zd/2s/46B1.gif' ),
( 1, 'http://www.zdic.net/pic/zx/old2/8C08.gif', 'http://www.zdic.net/pic/zx/old2/8C08.gif' ),
( 2, 'http://www.zdic.net/pic/3b/2A6A5.gif', 'http://www.zdic.net/zd/3s/2A6A5.gif' );
