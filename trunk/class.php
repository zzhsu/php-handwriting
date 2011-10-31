<?php

//字符类
class TomoeChar
{
    var $s = array();         //strokes，该字的笔画类（TomoeStroke）

    function addStroke($s)
    {
        array_push($this->s, $s);
    }
}

//笔画类
class TomoeStroke
{
    var $p = array();      //该笔画的点数组

    function __construct($point)
    {
        $this->addPoint($point);
    }

    function addPoint($point)
    {
        array_push($this->p, $point);
    }

    function addPoints($points)
    {
        $this->p = array_merge($this->p, $points);
    }
}

//点类
class TomoePoint
{
    var $x = 0;                 //该点的横坐标
    var $y = 0;                 //该点的纵坐标

    function __construct($x, $y)
    {
        $this->x = $x;
        $this->y = $y;
    }
}

//节点对
class TomoeNodePair
{
    var $first = null;
    var $last = null;

    function __construct($first, $last)
    {
        $this->first = $first;
        $this->last = $last;
    }

}

//特征类
class TomoeFeature
{
    var $i = -1;
    var $v = 0.0;

    function __construct($index, $value)
    {
        $this->i = $index;
        $this->v = $value;
    }
}

//训练后的特征类
class TomoeTrainFeature
{
    var $i = -1;    //index，维度
    var $n = 0.0;   //min，最小值
    var $d = 0.0;   //mid，平均值
    var $x = 0.0;   //max，最大值
    var $m = 0;     //num，笔迹数量

    function __construct($index, $min, $mid, $max, $num)
    {
        $this->i = $index;
        $this->n = $min;
        $this->d = $mid;
        $this->x = $max;
        $this->m = $num;
    }
}

//返回结果类
class TomoeReturn
{
    var $res;                   //TomoeResult的集合
    var $msgno = -1;            //提示信息代号
    var $msg = '';              //提示信息内容
    var $debug = '';
}

//返回的结果类
class TomoeResult
{
    var $id = -1;
    var $ch = '';
    var $img = '';
    var $src = '';
    var $showImg = false;
    var $score = PHP_INT_MAX;
}

function getIP()
{
    if (
         getenv("HTTP_CLIENT_IP")
      && strcasecmp(getenv("HTTP_CLIENT_IP"), "unknown")
       )
    {
        $ip = getenv("HTTP_CLIENT_IP");
    }
    else if (
              getenv("HTTP_X_FORWARDED_FOR")
           && strcasecmp(getenv("HTTP_X_FORWARDED_FOR"), "unknown")
            )
    {
        $ip = getenv("HTTP_X_FORWARDED_FOR");
    }
    else if (
              getenv("REMOTE_ADDR")
           && strcasecmp(getenv("REMOTE_ADDR"), "unknown")
            )
    {
        $ip = getenv("REMOTE_ADDR");
    }
    else if (
               isset($_SERVER['REMOTE_ADDR'])
            && $_SERVER['REMOTE_ADDR']
            && strcasecmp($_SERVER['REMOTE_ADDR'], "unknown")
            )
    {
        $ip = $_SERVER['REMOTE_ADDR'];
    }
    else
    {
        $ip = "unknown";
    }
   return($ip);
}

?>
