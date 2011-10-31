<?php

require_once 'Config.php';
require_once 'class.php';
require_once 'debug.php';

function recognizer_node_cmp($a, $b)
{
    return ($a->score < $b->score) ? -1 : 1;    //从小到大排序
}

//识别类
class Recognizer
{

    //获取候选字
    //参数：候选字，笔迹特征
    function get_results(&$cands, &$feature)
    {
        $results = array();
        if (!isset($feature))
        {
            return null;    //参数为空，则返回null
        }

        foreach ($cands as $c)
        {
            $res = new TomoeResult();
            $res->ch = $c->ch;
            $res->src = $c->src;
            $res->img = $c->img;
            $res->desc = $c->desc;
            $dict_feature = isset($c->feature) ? json_decode($c->feature) : null;
            $res->score = $this->calc_score($dict_feature, $feature);
            array_push($results, $res);
        }
        usort($results, 'recognizer_node_cmp');
        $nbest = min(CANDS_NO, sizeof($results));
        return array_slice($results, 0, $nbest);
    }

    //计算得分
    //参数：字典特征数组（一个字），识别笔迹特征数组（一个字）
    function calc_score(&$dict_fs, &$features)
    {
        if (!isset($dict_fs))
        {
            return PHP_INT_MAX;
        }

        $score = 0;
        $i = 0;
        $dict_fs_size = sizeof($dict_fs);

        foreach ($features as $f)
        {
            //字典中独有的特征，不计分
            while ($f->i > $dict_fs[$i]->i && $i < $dict_fs_size)
            {
                $i++;
            }

            //字典中的特征未全部循环完
            if ($i < $dict_fs_size)
            {
                //识别笔迹中独有的特征
                if ($f->i < $dict_fs[$i]->i)
                {
                    $score += abs($f->v);
                }
                else    //字典中和识别笔迹中共有的特征
                {
                    //与中心点的距离
                    $dif = abs($f->v - $dict_fs[$i]->d);
                    //最大距离=最大值-最小值
                    $dis = abs($dict_fs[$i]->x - $dict_fs[$i]->n);
                    if ($dis == 0)
                    {
                        $score += $dif;
                    }
                    else
                    {
                        $score += $dif / $dis;
                    }
                    $i++;
                }
            }
            else
            {
                $score += abs($f->v);
            }
        }

        return $score;
    }

}

?>
