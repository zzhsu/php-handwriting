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
var writing; //笔迹对象
var result; //结果对象
var intervalProcess = null; //定时对象

//类声明
//字符类
var Character = function (strokes)
{
    var self = this;
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
    this.AddStroke = function()
    {
        var stroke = new Stroke();
        this.s.push(stroke);
        return (stroke);
    };

    //添加点
    this.AddXY = function(x,y)
    {
        this.s[this.s.length-1].AddXY(x,y);
    };

    //撤销
    this.Undo = function()
    {
        if(this.s.length > 0)
        {
            this.s.pop();
            //识别模式
            if(tool.mode == TYPE_RECOGNIZE)
            {
                //准备提交笔迹
                this.ReadyToSendWriting();
            }
        }
    };
    //清除
    this.Clear = function()
    {
        this.s = new Array();
        this.width = 0;
        this.height = 0;
        this.left = 0;
        this.top = 0;
    };

    //计算长宽位置
    this.MakePosition = function()
    {
        var minX = Number.MAX_VALUE;
        var maxX = -1;
        var minY = Number.MAX_VALUE;
        var maxY = -1;

        for(var stroke_i = 0; stroke_i < this.s.length; stroke_i++)
        {
            var stroke = this.s[stroke_i];
            for(var point_i=0; point_i < stroke.p.length; point_i++)
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
    };

    //缩放
    this.Resize = function( targetWidth, targetHeight)
    {
        var sourceWidth = (this.width == 0) ? 1 : this.width;
        var sourceHeight = (this.height == 0) ? 1 : this.height;

        for (var stroke_i = 0; stroke_i < this.s.length; stroke_i++)
        {
            var stroke = this.s[stroke_i];
            for (var point_i =0; point_i< stroke.p.length; point_i++)
            {
                var point = stroke.p[point_i];
                point.x = Math.round((point.x - this.left+1) * targetWidth / sourceWidth);
                point.y = Math.round((point.y - this.top+1) * targetHeight /sourceHeight);
            }
        }
    };

    //发送笔迹前的准备
    this.ReadyToSendWriting = function ()
    {
        //需要提交
        tool.needSubmit = true;
        //正在等待结果
        if (tool.isWaiting == true)
        {
            if(intervalProcess == null)
            {
                //每秒钟检查提交池
                intervalProcess = setInterval('CheckSubmitPool()', 1000);
            }
        }
        //提交池空闲
        else
        {
            //提交笔迹
            this.SendWriting();
            //不需要提交
            tool.needSubmit = false;
            //清除定时查询
            clearInterval(intervalProcess);
            intervalProcess = null;
        }
    };

    //发送笔迹
    this.SendWriting = function ()
    {
        if(this.s.length >0)
        {
            //等待结果
            tool.isWaiting = true;

            //显示信息
            result.ShowMsg('正在提交数据…');

            //提交数据
            $.post('php/handwriting.php',
            {
                type: TYPE_RECOGNIZE,
                c: $.toJSON(this)
            },
            function (data)
            {
                try
                {
                    //转换成对象
                    var obj = $.parseJSON( data );
                    //空闲状态
                    tool.isWaiting = false;
                    //显示候选字
                    result.ShowCandidate(obj);
                }
                catch (err)
                {
                    //显示错误文字
                    result.ShowMsg(data);
                }
            });

        }
    };
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
    this.AddXY = function(x, y)
    {
        this.p.push(new Point(x, y));
    };

    //加入点
    this.AddPoint = function(point)
    {
        this.p.push(point);
        return point;
    };
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
var Pencil = function ()
{
    var self = this;
    //是否在书写
    this.isWriting = false;
    //是否需要提交数据
    this.needSubmit = false;
    //是否正在等待结果
    this.isWaiting = false;
    //识别模式
    this.mode = TYPE_RECOGNIZE

    //mousedown事件
    this.vmousedown = function (ev)
    {
        //开始路径
        context.beginPath();
        //不保留笔迹地移动（提笔）
        context.moveTo(ev._x, ev._y);
        //添加笔画
        writing.AddStroke().AddXY(ev._x, ev._y);

        //正在书写
        self.isWriting = true;
    };

    //mousemove事件
    this.vmousemove = function (ev)
    {
        //防止网页滑动
        ev.preventDefault();
        //正在书写
        if (self.isWriting == true)
        {
            //画直线
            context.lineTo(ev._x, ev._y);
            //显示笔迹
            context.stroke();
            //最后的笔画添加点
            writing.AddXY(ev._x, ev._y);
        }
    };

    //mouseup事件
    this.vmouseup = function (ev)
    {
        //正在书写
        if (self.isWriting == true)
        {
            //显示笔迹
            self.vmousemove(ev);
            //停止书写
            self.isWriting = false;
            //计算位置
            writing.MakePosition();
            //识别模式
            if(self.mode == TYPE_RECOGNIZE)
            {
                //准备提交笔迹
                writing.ReadyToSendWriting();
            }
        }

    };

    //mouseout事件
    this.vmouseout = function ()
    {
        //正在书写
        if (self.isWriting == true)
        {
            //停止书写
            self.isWriting = false;
            //计算位置
            writing.MakePosition();
            //识别模式
            if(self.mode == TYPE_RECOGNIZE)
            {
                //准备提交笔迹
                writing.ReadyToSendWriting();
            }
        }

    };

    //重绘（撤销事件）
    this.Repaint = function()
    {
        //清除
        this.Clear();
        //不缩放重绘
        this.Paint(writing, false);
    };

    //绘图
    this.Paint = function(writing, scale)
    {
        if(scale == true)
        {
            //缩放到现在绘图区域大小
            writing.Resize(canvas.width, canvas.height);
        }

        for(var stroke_i =0; stroke_i < writing.s.length; stroke_i++)
        {
            var stroke = writing.s[stroke_i];
            for (var point_i =0; point_i < stroke.p.length; point_i++)
            {
                var point = stroke.p[point_i];
                if (point_i == 0)
                {
                    //开始路径
                    context.beginPath();
                    //不保留笔迹地移动（提笔）
                    context.moveTo(point.x, point.y);
                }
                else
                {
                    //画直线
                    context.lineTo(point.x, point.y);
                }
            }
            //显示笔迹
            context.stroke();
        }
    };


    //清除事件
    this.Clear = function()
    {
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    }
}

var Result = function()
{
    var self = this;
    //显示候选字
    this.ShowCandidate = function (obj)
    {
        //成功完成
        if( obj.msgno == MSG_OK)
        {
            //清除候选字区域
            $('#result-area').html('');
            //显示信息
            this.ShowMsg('完成');
            //新建ui元素
            var ui =$('<ui />').addClass('result-list');

            for(var i = 0; i < obj.res.length; i++)
            {
                var character = obj.res[i];
                var li = $('<li />').text(character.ch).addClass('result-char');
                li.bind('click', function()
                {
                    $('#result-text').val($('#result-text').val()+$(this).text());
                });
                ui.append(li);
            }
            $('#result-area').append(ui);

            //用于调试
            if(obj.debug)
            {
                this.ShowDebug(obj.debug);
            }
        }
        else
        {
            this.ShowMsg(obj.msg);
        }
    };
    //显示结果
    this.ShowMsg = function(msg)
    {
        $('#msg-area').html(msg);
    }
    //显示调试信息
    this.ShowDebug = function(msg)
    {
        $('#debug-area').html(msg);
    }
}
//end 类声明



//入口函数
function xcanvas()
{
    try
    {
        //获取Canvas元素
        canvas = document.getElementById('writing-canvas');
        canvasOffset = $(canvas).offset();
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
    tool = new Pencil();
    //初始化笔迹
    writing = new Character();
    //初始化结果类
    result = new Result();

    //添加mousedown, mousemove, mouseup, mouseout等事件
    //同时支持触摸设备的touch事件
    $(canvas).bind('vmousedown', ev_canvas);
    $(canvas).bind('vmousemove', ev_canvas);
    $(canvas).bind('vmouseup', ev_canvas);
    $(canvas).bind('vmouseout', ev_canvas);

    //禁止选中绘图区
    $(canvas).bind('select', function()
    {
        return false;
    });
    //“撤销”按钮事件
    $('#undo-button').bind('click', function()
    {
        writing.Undo();
        tool.Repaint();
    });
    //“清除”按钮事件
    $('#clear-button').bind('click', function()
    {
        writing.Clear();
        tool.Clear();
    });

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

//检查提交池
function CheckSubmitPool()
{
    //如需要提交，且现在空闲
    if(
        (tool.needSubmit == true)
        && (tool.isWaiting == false)
        && (tool.isWriting == false)
    )
        {
        //准备提交
        writing.ReadyToSendWriting();
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
    //移动设备初始化
    $(document).bind('mobileinit', function()
    {
        $.mobile.loadingMessage = false;
        $.mobile.metaViewportContent = 'width=480';
    });
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

