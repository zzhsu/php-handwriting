<?php

//数据库用
define('DB_HOST',                   'localhost');   //主机名
define('DB_USERNAME',               'root');        //数据库用户名
define('DB_PASSWORD',               '');            //数据库密码
define('DB_DB',                     'hdwg');        //数据库名
define('DB_CHARSET',                'utf8');		//字符集（utf8或latin1）

//笔迹识别用
define('TOMOE_WRITING_WIDTH',       1000);                          //字符宽度
define('TOMOE_WRITING_HEIGHT',      1000);                          //字符高度
define('TOMOE_CENTER_X',            (TOMOE_WRITING_WIDTH / 2));     //中心点x坐标
define('TOMOE_CENTER_Y',            (TOMOE_WRITING_HEIGHT / 2));    //中心点y坐标
define('TOMOE_VERTEX_DISTANCE',     (TOMOE_WRITING_WIDTH * 0.06));  //顶点到线段距离的阈值（宽的6%）
define('TOMOE_MAX_VERTEX_POINTS',   20);                            //顶点对的最大对数（修改时只能改小，不能改大）
define('TOMOE_MAX_STROKES',         200);                           //最大笔画数（修改时只能改小，不能改大）

define('PRECISION',               3);   //精度（小数位数）

//笔画特征
define('STROKE_ERR',              0);   //错误笔画
define('STROKE_HENG',             1);   //横（0°）
define('STROKE_SHU',              2);   //竖（90°）
define('STROKE_PIE',              3);   //撇（135°）
define('STROKE_DIAN',             4);   //点（45°）
define('STROKE_ZHE',              5);   //折

//笔画特征（弧度，以左上角为原点）
define('DEGREE_ERR_MIN',          (-180 * M_PI / 180));  //-180°
define('DEGREE_ERR_MAX',          (-90 * M_PI / 180));  //-90°
define('DEGREE_HENG_MIN',         (-34 * M_PI / 180));  //-34°（左下到右上）
define('DEGREE_HENG_MAX',         (9 * M_PI / 180));    //9°（左上到右下）
define('DEGREE_DIAN_MIN',         (34 * M_PI / 180));   //34°（左上到右下）
define('DEGREE_DIAN_MAX',         (74 * M_PI / 180));   //74°（左上到右下）
define('DEGREE_SHU_MIN',          (79 * M_PI / 180));   //79°（左上到右下）
define('DEGREE_SHU_MAX',          (97 * M_PI / 180));   //97°（右上到左下）
define('DEGREE_PIE_MIN',          (114 * M_PI / 180));  //114°（右上到左下）
define('DEGREE_PIE_MAX',          (166 * M_PI / 180));  //166°（右上到左下）

//接收信息用
define('TYPE_UNKNOWN',            -1);  //未知类别（前台程序有问题）
define('TYPE_RECOGNIZE',          1);   //识别
define('TYPE_LEARN',              2);   //学习
define('TYPE_GET_CHARS',          3);   //获取字符
define('TYPE_GET_WRITINGS',       4);   //取得该字的笔迹
define('TYPE_DEL_WRITINGS',       5);   //删除某笔画

//取得汉字用
define('TRAINTYPE_CHAR',          1);   //Unicode汉字
define('TRAINTYPE_VARIANT',       2);   //异体字
define('TRAINTYPE_INTERIOR',      3);   //内部编码
define('TRAINTYPE_UNICODE',       4);   //Unicode区域
define('TRAINTYPE_RANDOM',        5);   //随机

//返回结果用
define('MSG_OK',                  1);
define('MSG_OK_TXT',              '执行完毕');
define('MSG_OK_LEARN',            '学习完毕，谢谢');
define('MSG_ERR',                 0);
define('MSG_ERR_UNKNOWN',         '未知错误');
define('MSG_ERR_DATABASE',        '数据库连接失败');
define('MSG_ERR_NOCAND',          '未找到候选字，请重新输入或进入<a href="#" onclick="changeMode(\"learn\")">学习模式</a>');
define('MSG_ERR_NOINPUT',         '禁止直接访问，请转到<a href="index.htm">手写页面</a>');
define('MSG_ERR_UNKNOWN_REQUEST', '未知请求，请检查前台代码是否有问题');
define('MSG_ERR_NOTFOUND',        '找不到该字。<a target="_blank" href="#">点此</a>将此问题提交管理员。');


//候选字个数
define('CANDS_NO',                20);

$nums_of_stokes = array(
    "min" => array(
        17,     //默认最小值17
        1,      //笔画1，最小值1
        1,      //笔画2，最小值1
        1,      //笔画3，最小值1
        1,      //笔画4，最小值1
        2,      //笔画5，最小值2
        3,      //笔画6，最小值3
        3,      //笔画7，最小值3
        4,      //笔画8，最小值4
        5,      //笔画9，最小值5
        6,      //笔画10，最小值6
        8,      //笔画11，最小值8
        10,     //笔画12，最小值10
        11,     //笔画13，最小值11
        12,     //笔画14，最小值12
        13,     //笔画15，最小值13
        14,     //笔画16，最小值14
        14,     //笔画17，最小值14
        15,     //笔画18，最小值15
        15,     //笔画19，最小值15
        16,     //笔画20，最小值16
        17      //笔画21，最小值17
    ),
    "max" => array(
        2,      //默认最大值，+2
        3,      //笔画1，最大值3
        4,      //笔画2，最大值4
        5,      //笔画3，最大值5
        6,      //笔画4，最大值6
        7,      //笔画5，最大值7
        7,      //笔画6，最大值7
        9,      //笔画7，最大值9
        9,      //笔画8，最大值9
        10,     //笔画9，最大值10
        11,     //笔画10，最大值11
        12,     //笔画11，最大值12
        13,     //笔画12，最大值13
        14,     //笔画13，最大值14
        15,     //笔画14，最大值15
        16,     //笔画15，最大值16
        18,     //笔画16，最大值18
        19,     //笔画17，最大值19
        20,     //笔画18，最大值20
        21,     //笔画19，最大值21
        22,     //笔画20，最大值22
        23      //笔画21，最大值23
    )
);

?>
