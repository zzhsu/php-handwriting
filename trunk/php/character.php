<?php
//require_once './Config.php';
//require_once './class.php';

//字符类
class Character
{
    var $writing = null;

    function create_sparse_writing(&$writing)
    {
        if(!isset($writing))
        {
            return null;
        }

        //缩放为TOMOE_WRITING_WIDTH*TOMOE_WRITING_HEIGHT的图形
        $this->resize_writing($writing, TOMOE_WRITING_WIDTH, TOMOE_WRITING_HEIGHT);

        $sparsed_writing = new TomoeChar();

        foreach($writing->s as $stroke)
        {
            $end = sizeof($stroke->p) - 1;
            $new_points = $this->get_vertex($stroke->p, 0, $end);

            $new_stroke = new TomoeStroke($stroke->p[0]); //添加第一个点
            $new_stroke->addPoints($new_points);            //添加其他顶点
            $sparsed_writing->addStroke($new_stroke);       //添加这一笔画
        }

        return $sparsed_writing;
    }

    //$width，目标宽度
    //$height，目标高度
    function resize_writing(&$writing, $width, $height)
    {
        if(!isset($writing))
        {
            return null;
        }

        //原始长宽
        $ws = ($writing->width == 0) ? 1 : $writing->width;
        $hs = ($writing->height == 0) ? 1 : $writing->height;
        $left = $writing->left;
        $top = $writing->top;

        foreach($writing->s as $stroke)
        {
            foreach($stroke->p as $point)
            {
                //$point为指针
                $point->x = round(($point->x - $left) * $width / $ws, PRECISION);
                $point->y = round(($point->y - $top) * $height / $hs, PRECISION);
            }
        }
    }

    function get_vertex(&$points, $start, $end)
    {
        $points_ret = array();

        /* 距离的阈值 */
        $error = TOMOE_VERTEX_DISTANCE * TOMOE_VERTEX_DISTANCE;

        $index = -1;

        $distance = $this->get_distance($points, $start, $end, $index);
        if($distance > $error)
        {
            $points_ret = array_merge($points_ret, $this->get_vertex($points, $start, $index));
            $points_ret = array_merge($points_ret, $this->get_vertex($points, $index, $end));
        }
        else
        {
            array_push($points_ret, $points[$end]);
        }
        return $points_ret;
    }

    //求距离起点和终点直线最远的点
    //返回值：最大距离
    function get_distance(&$points, $start, $end, &$index)
    {
        /* Getting distance
        * MAX( |aw - bv + c| )
        * a = x-p : b = y-q : c = py - qx
        * first = (p, q) : last = (x, y) : other = (v, w)
        */
        $first = $points[$start];
        $last = $points[$end];
        $distance = 0;
        $dist = 0;
        $max = 0;

        if($start == $end)
        {
            $index = -1;
            return 0;
        }

        $a = $last->x - $first->x;
        $b = $last->y - $first->y;
        $c = $last->y * $first->x - $last->x * $first->y;

        $denom = $a * $a + $b * $b;
        if($denom == 0)
        {
            $index = -1;
            return 0;
        }

        for($i = $start; $i <= $end; $i++)
        {
            $p = $points[$i];
            $dist = abs($a * $p->y - $b * $p->x + $c);
            if($dist > $max)
            {
                $max = $dist;
                $index = $i;
            }
        }

        $distance = $max * $max / $denom;
        return $distance;
    }

    function get_first_stroke_type($writing)    //取得首笔画的类型（横竖撇点折）
    {
        if(!isset($writing))
        {
            return -1;
        }

        $ret = 0;
        $firstStroke = $writing->s[0];
        switch(sizeof($firstStroke->p))
        {
            case 2:
                $ret = $this->get_dir($firstStroke->p[0], $firstStroke->p[1]);
                break;
            case 3:
                $dir1 = $this->get_dir($firstStroke->p[0], $firstStroke->p[1]);
                $dir2 = $this->get_dir($firstStroke->p[1], $firstStroke->p[2]);
                if($dir1 == $dir2)
                {
                    $ret = $dir1;
                }
                else
                {
                    if(($dir2 & STROKE_ERR) != 0) //第二折是勾的话（亅）
                    {
                        $ret = $dir1;
                    }
                    else if(($dir1 & STROKE_PIE) != 0 && ($dir2 & STROKE_SHU) != 0)   //第一折是撇，第二折是竖（如白）
                    {
                        $ret = $dir1;
                    }
                    else if(($dir1 & STROKE_SHU) != 0 && ($dir2 & STROKE_PIE) != 0)     //丿
                    {
                        $ret = (1 << STROKE_PIE);
                    }
                    else
                    {
                        $ret = (1 << STROKE_ZHE);  //折
                    }
                }
                break;
            default:
                $ret = (1 << STROKE_ZHE);  //折
                break;
        }

        return $ret;
    }

    //确定方向
    function get_dir($first, $last)
    {
        $d = atan2($last->y - $first->y, $last->x - $first->x);
        $ret = 0;

        if(($d >= DEGREE_ERR_MIN) && ($d <= DEGREE_ERR_MAX))
        {
            $ret = (1 << STROKE_ERR);  //错误笔画
        }
        else if(($d > DEGREE_ERR_MAX) && ($d <= DEGREE_HENG_MAX))
        {
            $ret = (1 << STROKE_HENG); //横
        }
        else if(($d > DEGREE_HENG_MAX) && ($d <= DEGREE_DIAN_MIN))
        {
            $ret = (1 << STROKE_HENG) | (1 << STROKE_DIAN);  //横或点
        }
        else if(($d > DEGREE_DIAN_MIN) && ($d <= DEGREE_DIAN_MAX))
        {
            $ret = (1 << STROKE_DIAN); //点
        }
        else if(($d > DEGREE_DIAN_MAX) && ($d <= DEGREE_SHU_MIN))
        {
            $ret = (1 << STROKE_DIAN) | (1 << STROKE_SHU);   //点或竖
        }
        else if(($d > DEGREE_SHU_MIN) && ($d <= DEGREE_SHU_MAX))
        {
            $ret = (1 << STROKE_SHU);  //竖
        }
        else if(($d > DEGREE_SHU_MAX) && ($d <= DEGREE_PIE_MIN))
        {
            $ret = (1 << STROKE_SHU) | (1 << STROKE_PIE);    //竖或撇
        }
        else if(($d > DEGREE_PIE_MIN) && ($d <= DEGREE_PIE_MAX))
        {
            $ret = (1 << STROKE_PIE);  //撇
        }
        else
        {
            $ret = (1 << STROKE_PIE);  //撇
        }
        return $ret;
    }


}

?>
