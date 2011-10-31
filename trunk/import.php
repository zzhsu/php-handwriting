<?php

require_once 'MySql.php';
require_once 'Config.php';
require_once 'class.php';
require_once 'feature.php';
require_once 'recognizer.php';
require_once 'character.php';
require_once 'dictionary.php';
require_once 'trainer.php';
require_once 'utf8.inc';
require_once 'debug.php';

function del_feature()
{
    $db = new MySql(DB_HOST, DB_USERNAME, DB_PASSWORD, DB_DB);
    $sql = "UPDATE tomoe_character
            SET feature = null,
                first_stroke_type = 0,
                min_n_strokes = -1,
                max_n_strokes = -1
            WHARE feature IS NOT NULL;";
    $db->update($sql);
}

function get_writing($page)
{
    $db = new MySql(DB_HOST, DB_USERNAME, DB_PASSWORD, DB_DB);
    $sql = "SELECT
                `char_id`,
                `writing`
            FROM
                `tomoe_writing`
            LIMIT ".($page*100).", 100;";
    echo $sql;
    $result = $db->query($sql);
    return $result;
}

function import()
{
    try
    {
        $page = isset($_GET['page']) ? $_GET['page'] : null;
        if($page == 0)
        {
            del_feature();
        }
        $results = get_writing($page);
        $size = sizeof($results);
        foreach ($results as $r)
        {
            $f = new Feature();
            $w = json_decode($r->writing);
            $char_id = $r->char_id;
            $features = $f->make_feature($w);          //获取特征

            $dic = new Dictionary();
            $dict_feature = $dic->get_feature($char_id);        //获取数据库中已存的特征值
            $dict_feature = isset($dict_feature) ? json_decode($dict_feature) : null;

            $t = new Trainer();
            $t->train($features, $dict_feature);

            $c = new Character();
            $first_stroke_type = $c->get_first_stroke_type($w);        //首笔的笔画类型（横竖撇点折）
            $int_strokes = sizeof($w->s);           //笔画数

            $dic->update_character($char_id, json_encode($t->train_features), $int_strokes, $first_stroke_type);
        }
        if ($size > 0)
        {
            echo "<meta HTTP-EQUIV=REFRESH CONTENT='5;URL=import.php?page=".($page+1)."'>";
        }
        else
        {
            echo "导入完成";
        }
    }
    catch (Exception $e)
    {
        echo $e->getMessage();
    }
}

function updateUnicode()
{
    $db = new MySql(DB_HOST, DB_USERNAME, DB_PASSWORD, DB_DB);
    $sql = "SELECT
                `id`,
                `character`
            FROM
                `tomoe_character`
            WHERE
                `unicode` = 0
            LIMIT 0,5000;";
    $result = $db->query($sql);
    $num_before = $db->num_rows;
    if ($num_before > 0)
    {
        $usc_4 = 0;

        foreach ($result as $r)
        {
            $usc_4 = utf8ToUnicode($r->character);
            $sql = " UPDATE
                tomoe_character
            SET
                unicode = $usc_4[0]
        WHERE id = $r->id;";
            //echo $sql;
            $db->update($sql);
        }
        echo "请刷新页面。" . time();
    }
    else
    {
        echo "Unicode字段更新完毕";
    }
}

import();
//echo "此功能已禁用";
?>
