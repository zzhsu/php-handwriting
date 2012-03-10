var TYPE_UNKNOWN = -1;
var TYPE_RECOGNIZE = 1;
var TYPE_LEARN = 2;
var TYPE_GET_CHARS = 3;
var TYPE_GET_WRITINGS = 4;
var TYPE_DEL_WRITINGS = 5;
var TRAINTYPE_UNICODE = 4;
var TRAINTYPE_RANDOM = 5;
var MSG_OK = 1;
var canvas, context, tool, canvasOffset;
var writing; //笔迹

//类声明
//字符类
var Character = function (strokes)
{
    this.s = new Array();
    this.width = 0;
    this.height = 0;
    this.left = 0;
    this.top = 0;

    if (typeof(s) !== "undefined")
    {
        this.s = this.s.concat(strokes);
    }

    //添加笔画
    this.addStroke = function()
    {
        var stroke = new Stroke();
        this.s.push(stroke);
        return (stroke);
    }
    //添加点
    this.addXY = function(x,y)
    {
        this.s[this.s.length-1].addXY(x,y);
    }

    //计算长宽位置
    this.makePosition = function()
    {
        var minX = Number.MAX_VALUE;
        var maxX = -1;
        var minY = Number.MAX_VALUE;
        var maxY = -1;

        for(var stroke_i in this.s)
        {
            var stroke = this.s[stroke_i];
            for(var point_i in stroke.p)
            {
                var point = stroke.p[point_i];
                maxX = ( point.x > maxX)? point.x: maxX;
                minX = ( point.x < minX)? point.x: minX;
                maxY =  ( point.y > maxY)? point.y: maxY;
                minY =  ( point.y < minY)? point.y: minY;
            }
        }
        this.left = minX;
        this.top = minY;
        this.width = maxX-minX +1;
        this.height = maxY-minY +1;
    }
}

//笔画类
var Stroke = function (points)
{
    this.p = new Array();

    if (typeof(p) !== "undefined")
    {
        this.p = this.p.concat(points);
    }

    //加入点（坐标方式）
    this.addXY = function(x, y)
    {
        this.p.push(new Point(x, y));
    }

    //加入点
    this.addPoint = function()
    {
        var point = new Point();
        this.p.push(point);
        return point;
    }
}

//点类
var Point = function (x, y)
{
    this.x = -1;
    this.y = -1;

    if (typeof(x) !== "undefined")
    {
        this.x = x;
        this.y = y;
    }
}

//画笔类
var tool_pencil =function ()
{
    var tool = this;
    //是否在书写
    this.isWriting = false;
    //是否需要提交数据
    this.needSubmit = false;

    //mousedown事件
    this.vmousedown = function (ev)
    {
        //开始路径
        context.beginPath();
        //不保留笔迹地移动（提笔）
        context.moveTo(ev._x, ev._y);
        //添加笔画
        writing.addStroke();
        //正在书写
        tool.isWriting = true;
    };

    //mousemove事件
    this.vmousemove = function (ev)
    {
        //正在书写
        if (tool.isWriting == true)
        {
            //画直线
            context.lineTo(ev._x, ev._y);
            //显示笔迹
            context.stroke();
            //最后的笔画添加点
            writing.addXY(ev._x, ev._y);
        }
    };

    //mouseup事件
    this.vmouseup = function (ev)
    {
        //正在书写
        if (tool.isWriting == true)
        {
            //显示笔迹
            tool.vmousemove(ev);
            //停止书写
            tool.isWriting = false;
        }
    };

    //mouseout事件
    this.vmouseout = function ()
    {
        //停止书写
        tool.isWriting = false;
        writing.makePosition();
    };
}

//end 类声明



//入口函数
function xcanvas()
{
    try
    {
        //获取Canvas元素
        canvasOffset = $('#writing-canvas').offset();
        canvas = document.getElementById('writing-canvas');
        context = canvas.getContext('2d');
    }
    catch (e)
    {
        //alert("此浏览器不支持HTML5");
        return;
    }

    context.lineWidth = 4;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle  = "orange";

    //初始化画笔
    tool = new tool_pencil();
    //初始化笔迹
    writing = new Character();

    //添加mousedown, mousemove, mouseup, mouseout等事件
    //同时支持触摸设备的touch事件
    $('#writing-canvas').bind('vmousedown', ev_canvas);
    $('#writing-canvas').bind('vmousemove', ev_canvas);
    $('#writing-canvas').bind('vmouseup', ev_canvas);
    $('#writing-canvas').bind('vmouseout', ev_canvas);

    //禁止选中绘图区
    $('#writing-canvas').bind('select', function(){
        return false;
    });
    //防止网页滑动
    $(document).bind('touchmove', function(e){
        e.preventDefault();
    })

}

//事件句柄
function ev_canvas (ev)
{
    //取得位置
    var pos = GetPosition(ev);

    //触发事件
    var func = tool[ev.type];
    if (func)
    {
        func(pos);
    }
}

//获取事件的坐标
function GetPosition(e)
{
    e._x = e.pageX - canvasOffset.left;
    e._y = e.pageY - canvasOffset.top;
    return e;
}

//开始执行代码
$(document).ready(function()
{
    //尝试初始化
    xcanvas();
    //初始化失败，浏览器不支持Canvas
    if (!context)
    {
        //加载兼容js脚本
        var js = document.createElement('script');
        js.type = 'text/javascript';
        js.charset = 'utf-8';
        if (document.uniqueID)
        {
            js.onreadystatechange = function()
            {
                if (/loaded|complete/.test(this.readyState))
                {
                    uu.canvas.init();
                    //再次尝试初始化
                    xcanvas();
                }
            };
        }
        else
        {
            js.onload = function()
            {
                uu.canvas.init();
                //再次尝试初始化
                xcanvas();
            };
        }
        js.setAttribute('src', 'js/uuCanvas.js');
        document.getElementsByTagName('head')[0].appendChild(js);
    }
});

