<?php
include './Config.php';
include './class.php';
include './feature.php';
include './recognizer.php';
include './character.php';
include './MySql.php';
include './dictionary.php';
include './trainer.php';
include './debug.php';

//主函数
function main()
{
    $ret = new TomoeReturn();   //返回客户端的信息
    $type = isset($_POST['type']) ? $_POST['type'] : null;
    //$type = TYPE_RECOGNIZE; //debug

    if (!isset($type))  //没有笔画时（比如直接打开此页面）
    {
        $ret->msgno = MSG_ERR;      //提示没有输入
        $ret->msg = MSG_ERR_NOINPUT;
    }
    else
    {
        switch($type)
        {
            case TYPE_RECOGNIZE:                //识别
                $writing = isset($_POST['c']) ? json_decode($_POST['c']) : null;;  //获取客户端传过来的笔画
                $rank = isset($_POST['rank']) ? $_POST['rank'] : 100;
                //$rank = 10;   //debug
                //$writing = debug_getInput();  //debug
                recognize($ret, $writing, $rank);
                break;
            case TYPE_GET_CHARS:
                $trainType = isset($_POST['trainType']) ? $_POST['trainType'] : null;
                $char = isset($_POST['c']) ? $_POST['c'] : null;
                $unicodeFrom = isset($_POST['unicodeFrom']) ? $_POST['unicodeFrom'] : null;
                $unicodeTo = isset($_POST['unicodeTo']) ? $_POST['unicodeTo'] : null;
                get_chars($ret, $trainType, $char, $unicodeFrom, $unicodeTo);
                break;
            case TYPE_LEARN:                    //学习
                $writing = isset($_POST['c']) ? json_decode($_POST['c']) : null;;  //获取客户端传过来的笔画
                $id = isset($_POST['id']) ? $_POST['id'] : null;
                $user_id = isset($_POST['user_id']) ? $_POST['user_id'] : null;
                //$id = 1;    //debug;
                //$writing = debug_getInput();//debug;
                learn($ret, $writing, $id, $user_id);
                //debug_train($writing, $ret);
                break;
            case TYPE_GET_WRITINGS:             //获取笔画数组（用于管理）
                //getWritings($writing, $ret);
                break;
            case TYPE_DEL_WRITING:              //删除某笔画
                //delWriting($writing, $ret);
                break;
            case TYPE_UNKNOWN:                  //未知请求
            default:
                $ret->msgno = MSG_ERR;
                $ret->msg = MSG_ERR_UNKNOWN_REQUEST;
                break;
        }
    }

echo json_encode($ret);    
}

//识别
function recognize(&$ret, &$writing, $rank)
{
    try
    {
$debug_start = microtime(true);
        $c = new Character();
        $w = $c->create_sparse_writing($writing);    //骨架化笔画
        $first_stroke_type = $c->get_first_stroke_type($w);        //首笔的笔画类型（横竖撇点折）
        $int_strokes = sizeof($w->s);           //笔画数

        $f = new Feature();
        $features = $f->make_feature($w);               //获取特征
$debug_end = microtime(true);
$ret->debug .="计算特征所需的时间：".debug_time($debug_start,$debug_end)."<br>";

$debug_start = microtime(true);
        $dic = new Dictionary();
        $cands = $dic->get_candidates_by_strokes($int_strokes, $first_stroke_type, $rank);  //初步获取候选字
$debug_end = microtime(true);
$ret->debug .= "获取候选字所需的时间：".debug_time($debug_start,$debug_end)."<br>";

$debug_start = microtime(true);
        $rec = new Recognizer();
        $res = $rec->get_results($cands, $features, $debug_msg); //获取结果
$debug_end = microtime(true);
$ret->debug .="匹配候选字所需的时间：".debug_time($debug_start,$debug_end)."<br>";

        $ret->msgno = MSG_OK;
        $ret->msg = MSG_OK_TXT;
        $ret->res = $res;
    }
    catch(Exception $e)
    {
        $ret->msgno = MSG_ERR;
        $ret->msg = $e->getMessage();
    }
}

//获取汉字（用于学习）
function get_chars(&$ret, $trainType, $char, $unicodeFrom, $unicodeTo)
{
    try
    {
        $dic = new Dictionary();
        $chars = $dic->get_chars($trainType, $char, $unicodeFrom, $unicodeTo);  //初步获取候选字

        if(isset($chars))
        {
            $ret->res = $chars;
            $ret->msgno = MSG_OK;
            $ret->msg = MSG_OK_TXT;
        }
        else
        {
            $ret->msgno = MSG_ERR;
            $ret->msg = MSG_ERR_NOTFOUND;
        }
    }
    catch(Exception $e)
    {
        $ret->msgno = MSG_ERR;
        $ret->msg = $e->getMessage();
    }

    //var_dump($ret);
}

//学习模式
function learn(&$ret, &$writing, $char_id, $user_id)
{
    try
    {
        $c = new Character();
        $w = $c->create_sparse_writing($writing);    //骨架化笔画

        $f = new Feature();
        $features = $f->make_feature($w);          //获取特征

        $dic = new Dictionary();
        $dic->add_writing($char_id, $w, $user_id);    //添加笔迹
        $dict_feature = $dic->get_feature($char_id);        //获取数据库中已存的特征值
        $dict_feature = isset($dict_feature) ? json_decode($dict_feature) : null;

        $t = new Trainer();
        $t->train($features, $dict_feature);

        $first_stroke_type = $c->get_first_stroke_type($w);        //首笔的笔画类型（横竖撇点折）
        $int_strokes = sizeof($w->s);           //笔画数

        $dic->update_character($char_id, json_encode($t->train_features), $int_strokes, $first_stroke_type);
        
        $ret->msgno = MSG_OK;
        $ret->msg = MSG_OK_LEARN;
    }
    catch(Exception $e)
    {
        $ret->msgno = MSG_ERR;
        $ret->msg = $e->getMessage();
    }
}

//取得指定字符的所有不同的笔画图形
function getWritings(&$ret, &$writing)
{
    //待补充
}

//删除指定的笔画图形
function delWriting(&$ret, &$writing)
{
    //待补充
}

main();

?>
