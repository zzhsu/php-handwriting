<?php

//require_once 'Config.php';
//require_once 'class.php';
//require_once 'debug.php';

function feature_node_cmp($a, $b)
{
    if ($a->i == $b->i)
        return 0;
    return ($a->i < $b->i) ? -1 : 1;    //从小到大排序
}

//求两点间的距离
function distance($p1, $p2)
{
    return sqrt(($p2->y - $p1->y) * ($p2->y - $p1->y) + ($p2->x - $p1->x) * ($p2->x - $p1->x));
}

//主函数
class Feature
{

    function make_feature(&$writing)
    {
        $features = array();
        if (!isset($writing))
        {
            return null;    //参数为空，则返回null
        }

        $prev = null;   //前一笔画的最后一点
        $stroke_num = 0;        //笔画数
        foreach ($writing->s as $stroke)
        {
            //设置顶点对特征
            $this->make_vertex_feature($features, $stroke_num, $stroke->p);
            if (isset($prev))
            {
                //设置空笔画（提笔）的特征
                $this->make_move_feature($features, $stroke_num, $prev, $stroke->p[0]);
            }
            $prev = end($stroke->p);
            $stroke_num++;
        }

        $this->add_feature($features, 200000, sizeof($writing->s));  //笔画数
        $this->add_feature($features, 200000 + sizeof($writing->s), 10);

        usort($features, 'feature_node_cmp');
        return $features;
    }

    function make_vertex_feature(&$features, $stroke_num, &$points)
    {
        $vertex_num = 0;
        $first = null;
        $last = null;
        if ($stroke_num < TOMOE_MAX_STROKES)
        {
            foreach ($points as $point)
            {
                //特征太多时，舍去
                if ($vertex_num >= TOMOE_MAX_VERTEX_POINTS)
                {
                    break;
                }
                $first = $last; //前一个点
                $last = $point; //当前点
                //两个点任意一个为空，则继续下次循环
                if (!isset($first) || !isset($last))
                {
                    continue;
                }
                //假定  1汉字=200笔画
                //      1笔画=20顶点对
                //      1顶点对=20个特征（目前是12个特征）
                //最大offset=79,600+380=79,980
                $offset = $stroke_num * 400 + $vertex_num * 20;
                $this->make_basic_feature($features, $offset, $first, $last);
                $vertex_num++;
            }
        }
    }

    function make_move_feature(&$features, $stroke_num, &$first, &$last)
    {
        if ($stroke_num < TOMOE_MAX_STROKES)
        {
            //假定  1汉字=200笔画
            //      1笔画=20顶点对
            //      1顶点对=20个特征（目前是12个特征）
            //最大offset=80,000+79,600=159,600
            $offset = 80000 + $stroke_num * 400;
            $this->make_basic_feature(&$features, $offset, $first, $last);
        }
    }

    //设置特征
    function make_basic_feature(&$features, $offset, &$first, &$last)
    {
        //distance
        $this->add_feature($features, $offset + 1, distance($first, $last));

        //degree
        $this->add_feature($features, $offset + 2, atan2($last->y - $first->y, $last->x - $first->x));

        //absolute position
        $this->add_feature($features, $offset + 3, $first->x - TOMOE_CENTER_X);
        $this->add_feature($features, $offset + 4, $first->y - TOMOE_CENTER_Y);
        $this->add_feature($features, $offset + 5, $last->x - TOMOE_CENTER_X);
        $this->add_feature($features, $offset + 6, $last->y - TOMOE_CENTER_Y);

        //absolute degree
        $this->add_feature($features, $offset + 7, atan2($first->y - TOMOE_CENTER_Y, $first->x - TOMOE_CENTER_X));
        $this->add_feature($features, $offset + 8, atan2($last->y - TOMOE_CENTER_Y, $last->x - TOMOE_CENTER_X));

        //absolute distance
        $this->add_feature($features, $offset + 9, distance($first, new TomoePoint(TOMOE_CENTER_X, TOMOE_CENTER_Y)));
        $this->add_feature($features, $offset + 10, distance($last, new TomoePoint(TOMOE_CENTER_X, TOMOE_CENTER_Y)));

        //diff
        $this->add_feature($features, $offset + 11, $last->x - $first->x);
        $this->add_feature($features, $offset + 12, $last->y - $first->y);
    }

    function add_feature(&$features, $index, $value)
    {
        $f = new TomoeFeature($index, round($value, PRECISION));
        array_push($features, $f);
    }

}

?>
