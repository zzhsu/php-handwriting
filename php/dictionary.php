<?php

//require_once 'Config.php';
//require_once 'MySql.php';

//字典类，用于对数据库的通信
class Dictionary
{

    var $db = null;

    public function __construct()
    {
        try
        {
            $this->db = new MySql(DB_HOST, DB_USERNAME, DB_PASSWORD, DB_DB);
        }
        catch (Exception $e)
        {
            throw $e;
        }
    }

    function get_candidates_by_strokes($int_strokes, $first_stroke_type, $rank)
    {
        try
        {
            $sql = "SELECT
                        `id`,
                        `character` AS `ch`,
                        `img`,
                        `src`,
                        `feature`
                    FROM
                        `tomoe_character`
                    WHERE
                        `feature` IS NOT NULL
                    AND `rank` <= ".$rank."
                    AND `min_n_strokes` <= ".$int_strokes."
                    AND `max_n_strokes` >= ".$int_strokes."
                    AND (`first_stroke_type` | ".$first_stroke_type.") != 0;";
            //echo $sql;
            $result = $this->db->query($sql);
            $num = $this->db->num_rows;
            return ($num > 0) ? $result : null;
        }
        catch (Exception $e)
        {
            throw $e;
        }
    }

    function get_chars($type, $char, $unicodeFrom, $unicodeTo)
    {
        try
        {
            switch ($type)
            {
                case TRAINTYPE_CHAR:
                    $sql = "SELECT  c.`id`,
                                    img.`img_src` AS img,
                                    img.`thumbnail_src` AS thumb
                            FROM `tomoe_character` AS c
                            LEFT JOIN `tomoe_char_img` AS img
                                ON img.char_id = c.id
                            WHERE
                                c.character = '" . $char . "'
                            ORDER BY c.unicode;";
                    break;
                case TRAINTYPE_VARIANT:
                    $sql = "SELECT  c.id,
                                    img.img_src AS img,
                                    img.thumbnail_src AS thumb
                            FROM `tomoe_character` AS c
                            LEFT JOIN `tomoe_char_img` AS img
                                ON img.char_id = c.id
                            WHERE
                                c.original_char = '" . $char . "'
                            ORDER BY c.unicode;";
                    break;
                case TRAINTYPE_INTERIOR:
                    $sql = "SELECT  c.id,
                                    img.img_src AS img,
                                    img.thumbnail_src AS thumb
                            FROM `tomoe_character` AS c
                            LEFT JOIN `tomoe_char_img` AS img
                                ON img.char_id = c.id
                            WHERE
                                c.id = '" . $char . "'
                            ORDER BY c.unicode;";
                    break;
                case TRAINTYPE_UNICODE:
                    $sql = "SELECT  c.id,
                                    img.img_src AS img,
                                    img.thumbnail_src AS thumb
                            FROM `tomoe_character` AS c
                            LEFT JOIN `tomoe_char_img` AS img
                                ON img.char_id = c.id
                            WHERE
                                c.unicode >= " . $unicodeFrom . "
                            AND c.unicode <= " . $unicodeTo. "
                            ORDER BY c.unicode;";
                    break;
                case TRAINTYPE_RANDOM:
                    $sql = "SELECT
                                c.id,
                                img.img_src AS img,
                                img.thumbnail_src AS thumb
                            FROM
                            (
                                SELECT id
                                FROM `tomoe_character`
                                WHERE id
                                    NOT IN
                                    (
                                        SELECT char_id
                                        FROM  `tomoe_writing`
                                        GROUP BY char_id
                                        HAVING COUNT( char_id ) > 1
                                    )
                                LIMIT 0 , 1
                            ) AS c
                            LEFT JOIN
                                `tomoe_char_img` AS img
                            ON img.char_id = c.id;";
                    break;
                default:
                    $sql = null;
                    break;
            }
            if (isset($sql))
            {
                $result = $this->db->query($sql);
                $num = $this->db->num_rows;
                return ($num > 0) ? $result : null;
            }
            else
            {
                throw new Exception("无效选项");
            }
        }
        catch (Exception $e)
        {
            throw $e;
        }
    }

    function add_writing($id, &$writing, $user_id)
    {
        try
        {
            $ip = getIP();
            if (!isset($user_id))
            {
                $user_id = "NULL";
            }
            date_default_timezone_set('PRC');
            $sql = "INSERT INTO
                        `tomoe_writing`	(
                        `char_id`,
                        `writing`,
                        `user_id`,
                        `ip`,
                        `add_date`)
                    VALUES(
                        '" . $id . "',
                	'" . json_encode($writing) . "',
                	" . $user_id . ",
                        '" . $ip . "',
                	'" . date("Y-m-d H:i:s") . "');";
            $result = $this->db->insert($sql);

            if ($result == 0)
            {
                throw new Exception("无法添加数据");
            }
        }
        catch (Exception $e)
        {
            throw $e;
        }
    }

    function get_feature($id)
    {
        try
        {
            $sql = "SELECT
                        `feature`
                    FROM
                        `tomoe_character`
                    WHERE
                        `id` = " . $id . ";";
            $result = $this->db->query($sql);
            $num = $this->db->num_rows;

            if ($num == 0)
            {
                throw new Exception("无法获取特征值");
            }
            else
            {
                return $result[0]->feature;
            }
        }
        catch (Exception $e)
        {
            throw $e;
        }
    }

    function update_character($id, &$feature, $int_strokes, $first_stroke_type)
    {
        try
        {
            $sql = "SELECT
                        `min_n_strokes`,
                        `max_n_strokes`
                    FROM
                        `tomoe_character`
                    WHERE
                        `id` = " . $id . ";";
            $result = $this->db->query($sql);
            $num = $this->db->num_rows;
            if ($num == 0)
            {
                throw new Exception("无效ID");
            }

            global $nums_of_stokes;

            if ($int_strokes < sizeof($nums_of_stokes["min"]))
            {
                $min_strokes = $nums_of_stokes["min"][$int_strokes];
            }
            else
            {
                $min_strokes = $nums_of_stokes["min"][0];
            }

            if ($int_strokes < sizeof($nums_of_stokes["max"]))
            {
                $max_strokes = $nums_of_stokes["max"][$int_strokes];
            }
            else
            {
                $max_strokes = $int_strokes + $nums_of_stokes["max"][0];
            }

            if ($result[0]->min_n_strokes != -1 && $result[0]->min_n_strokes < $min_strokes)
            {
                $min_strokes = $result[0]->min_n_strokes;
            }
            if ($result[0]->max_n_strokes != -1 && $result[0]->max_n_strokes > $max_strokes)
            {
                $max_strokes = $result[0]->max_n_strokes;
            }

            $sql = "UPDATE
                        `tomoe_character`
                    SET
                        `feature` = '" . $feature . "',
                        `first_stroke_type` = (`first_stroke_type` | " . $first_stroke_type . "),
                        `min_n_strokes` = " . $min_strokes . ",
                        `max_n_strokes` = " . $max_strokes . "
                    WHERE
                        `id` = " . $id . ";";
            //echo $sql;
            $this->db->update($sql);
        }
        catch (Exception $e)
        {
            throw $e;
        }
    }

}

?>
