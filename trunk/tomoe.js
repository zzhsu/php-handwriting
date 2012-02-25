/*
 * Ajax-based hand written recognition
 *
 * Copyright (C) 2005-2007 Taku Kudo <taku@chasen.org>
 * This is free software with ABSOLUTELY NO WARRANTY.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA
 * 02111-1307, USA
 *
 */

//类声明
function Character(strokes)
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
}

function Stroke(points)
{
    this.p = new Array();

    if (typeof(p) !== "undefined")
    {
        this.p = this.p.concat(points);
    }
}

function Point(x, y)
{
    this.x = -1;
    this.y = -1;

    if (typeof(x) !== "undefined")
    {
        this.x = x;
        this.y = y;
    }
}
//end 类声明

var TYPE_UNKNOWN = -1;
var TYPE_RECOGNIZE = 1;
var TYPE_LEARN = 2;
var TYPE_GET_CHARS = 3;
var TYPE_GET_WRITINGS = 4;
var TYPE_DEL_WRITINGS = 5;
var TRAINTYPE_UNICODE = 4;
var TRAINTYPE_RANDOM = 5;
var MSG_OK = 1;

var mode = TYPE_UNKNOWN;
var tomoe = null;
var intervalProcess = null;

function startCheckSubmitPool()
{
    if(intervalProcess == null)
    {
        //每秒钟检查提交池
        intervalProcess = setInterval(checkSubmitPool, 1000);
    }
}

function stopCheckSubmitPool()
{
    clearInterval(intervalProcess);
    intervalProcess = null;
}

function checkSubmitPool()
{
    if(tomoe && mode == TYPE_RECOGNIZE)
    {
        if(tomoe.needSubmit == true)
        {
            if(tomoe.isWriting == false)
            {
                tomoe.sendStroke();
            }
        }
        else
        {
            stopCheckSubmitPool();
        }
    }
}

function clearAllNode(parentNode)
{
    while(parentNode.firstChild)
    {
        var oldNode = parentNode.removeChild(parentNode.firstChild);
        oldNode = null;
    }
}

function getPosition(e)
{
    evt = (e) ? e : ((event) ? event : null);
    var left = 0;
    var top = 0;
    var scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft || 0;
    var scrollTop = document.documentElement.scrollTop || document.body.scrollTop || 0;

    if (evt.pageX)
    {
        left = evt.pageX;
        top = evt.pageY;
    }
    else
    {
        left = evt.clientX + scrollLeft;
        top = evt.clientY + scrollTop;
    }

    return {
        x: left,
        y: top
    };
}

function createXmlHttp()
{
    var xmlhttp = false;

    try
    {
        xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
    }
    catch (e)
    {
        try
        {
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }
        catch (E)
        {
            xmlhttp = false;
        }
    }
    if (!xmlhttp && typeof XMLHttpRequest != 'undefined')
    {
        xmlhttp = new XMLHttpRequest();
    }

    return xmlhttp;
}

//ws,hs为原始长宽，wd,hd为变更后的长宽
function resize(ch, left, top, ws, hs, wd, hd)
{
    var w = (ws == 0) ? 1 : ws;
    var h = (hs == 0) ? 1 : hs;
    var i;
    var j;
    var point;

    for (i in ch.s)
    {
        for (j in ch.s[i].p)
        {
            point = ch.s[i].p[j];
            point.x = Math.round((point.x - left) * wd / w);
            point.y = Math.round((point.y - top) * hd / h);
        }
    }
}

//TOMOE类
function TOMOE()
{
    //是否需要提交数据
    this.needSubmit = false;
    //是否在手写
    this.isWriting = false;

    var canvas = document.getElementById("tomoe-canvas");
    canvas.className = "tomoe-canvas";
    this.canvas = canvas;

    var self = this;
    canvas.onmouseup = function (e)
    {
        self.mouseup(e);
        canvas.onmousemove = null;
    }

    canvas.onmousedown = function (e)
    {
        self.mousedown(e);

        canvas.onmousemove = function (e)
        {
            self.mousemove(e);
        }
    }

    //撤销按钮
    var undo_button = document.getElementById("tomoe-undo-button");
    if(undo_button)
    {
        undo_button.onclick = function (e)
        {
            self.undo();
            if(mode == TYPE_RECOGNIZE)
            {
                self.sendStroke();
            }
        }
    }

    //获取汉字按钮
    var getChars_button = document.getElementById("tomoe-getChars-button");
    if(getChars_button)
    {
        getChars_button.onclick = function (e)
        {
            self.getChars();
        }
    }

    var getWritings_button = document.getElementById("tomoe-getWritings-button");
    if(getWritings_button)
    {
            getWritings_button.onclick = function (e)
            {
                self.getWritings();
            }
    }

    //清除按钮
    var clear_button = document.getElementById("tomoe-clear-button");
    if(clear_button)
    {
        clear_button.onclick = function (e)
        {
            self.clearAll();
        }
    }

    //学习按钮
    var learn_button = document.getElementById("tomoe-learn-button");
    if(learn_button)
    {
        learn_button.onclick = function (e)
        {
            self.learn();
        }
    }

    //加载图片
    var showImg_checkbox = document.getElementById("tomoe-showImg-checkbox");
    if(showImg_checkbox)
    {
        showImg_checkbox.onclick = function (e)
        {
            self.showImg();
        }
    }

    //学习文本框
    var char_text = document.getElementById("tomoe-char-text");
    if(char_text)
    {
        char_text.onblur = function (e)
        {
            self.getChars();
        }
        char_text.onkeypress = function (e)
        {
            var evt = e ? e : (event ? event : null);
            if(evt.keyCode == 13)
            {
                //self.getChars();
                this.blur();
            }
        }
    }
	
    var trainType_select = document.getElementById("tomoe-trainType-select");
    if(trainType_select)
    {
        trainType_select.onchange = function (e)
        {
            self.showTrainArea(e);
            self.getChars();
        }
    }

    this.resultArea = document.getElementById("tomoe-result");
    this.resultArea.className = "tomoe-result";

    this.msgArea = document.getElementById("tomoe-msg");
    this.msgArea.className = "tomoe-msg";

    this.textInput = document.getElementById("tomoe-text");
    if(this.textInput)
    {
        this.textInput.className = "tomoe-text";
    }

    var left = 0;
    var top = 0;
    for (var o = canvas; o; o = o.offsetParent)
    {
        left += (o.offsetLeft - o.scrollLeft);
        top += (o.offsetTop - o.scrollTop);
    }

    this.offsetLeft = left; //边框偏移量
    this.offsetTop = top;

    var point = document.getElementById("tomoe-point");
    this.offsetPointLeft = Math.round(parseInt(point.clientWidth) / 2); //点偏移量
    this.offsetPointTop = Math.round(parseInt(point.clientHeight) / 2);

    this.clearAll();

//  this.read(input);
//  this.getExample();
}

TOMOE.prototype.showMsgAndGetChars = function(str)
{
    try
    {
        var obj = JSON.parse(str);
        this.msgArea.innerHTML = obj.msg;
        this.getChars();
    }
    catch(e)
    {
        this.msgArea.innerHTML = str;
    }
}

TOMOE.prototype.showMsg = function(str)
{
    try
    {
        var obj = JSON.parse(str);
        this.msgArea.innerHTML = obj.msg;
    }
    catch(e)
    {
        this.msgArea.innerHTML = str;
    }
}

TOMOE.prototype.showTrainArea = function()
{
    var unicodeFrom = document.getElementById("tomoe-unicode-from");
    var unicodeTo = document.getElementById("tomoe-unicode-to");
    var unicodeLabel = document.getElementById("tomoe-unicode-label");
    var textArea = document.getElementById("tomoe-char-text");
    var select = document.getElementById("tomoe-trainType-select");
    var trainType = select.options[select.selectedIndex].value;

    if(trainType == TRAINTYPE_RANDOM)
    {
        unicodeFrom.style.display = "none";
        unicodeTo.style.display = "none";
        unicodeLabel.style.display = "none";
        textArea.style.display="none";
    }
    else if(trainType == TRAINTYPE_UNICODE)
    {
        unicodeFrom.style.display = "inline";
        unicodeTo.style.display = "inline";
        unicodeLabel.style.display = "inline";
        textArea.style.display="none";
    }
    else
    {
        unicodeFrom.style.display = "none";
        unicodeTo.style.display = "none";
        unicodeLabel.style.display = "none";
        textArea.style.display = "inline";
    }
}

TOMOE.prototype.addPointXY = function(stroke, x, y)
{
    stroke.p.push(new Point(x, y));
}

TOMOE.prototype.addStroke = function(writing, stroke)
{
    writing.s.push(stroke);
}

TOMOE.prototype.checkXmlHttp = function()
{
    if (! this.xmlhttp)
    {
        this.xmlhttp = createXmlHttp();
    }
    if (
        ! this.xmlhttp
        || this.xmlhttp.readyState == 1
        || this.xmlhttp.readyState == 2
        || this.xmlhttp.readyState == 3
        )
        {
        return false;
    }
    return true;
}

TOMOE.prototype.getXmlHttp = function(url, para, callback, func)
{
    var self = this;
    if (!this.checkXmlHttp())
    {
        this.needSubmit = true;
        startCheckSubmitPool();
        return;
    }

    this.needSubmit = false;
    this.xmlhttp.open("POST", url, true);

    this.xmlhttp.onreadystatechange = function ()
    {
        if (self.xmlhttp.readyState == 4 && self.xmlhttp.status == 200)
        {
            if (func)
            {
                callback(self, func, self.xmlhttp.responseText);
            }
            else
            {
                callback(self.xmlhttp.responseText);
            }
        }
    }

    this.xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    this.xmlhttp.send(para);
}

TOMOE.prototype.clearTrainChars = function ()
{
    var trainChars = document.getElementById("tomoe-train-chars");
    if(trainChars)
    {
        clearAllNode(trainChars);
    }
    var charId = document.getElementById("tomoe-charId");
    if(charId)
    {
        charId.value = "";
    }
    var imgSrc = document.getElementById("tomoe-imgSrc");
    if(imgSrc)
    {
        imgSrc.value = "";
    }
    this.canvas.style.backgroundImage="none";
}

TOMOE.prototype.setCharInfo = function(id, src)
{
    var id_txt = document.getElementById("tomoe-charId");
    var src_txt = document.getElementById("tomoe-imgSrc");
    id_txt.value = id;
    src_txt.value = src;
    if(src != "")
    {
        this.showImg();
    }
}

TOMOE.prototype.getChars = function ()
{
    var select = document.getElementById("tomoe-trainType-select");
    var character = document.getElementById("tomoe-char-text");
    var unicodeFrom = document.getElementById("tomoe-unicode-from");
    var unicodeTo = document.getElementById("tomoe-unicode-to");
    var trainType = select.options[select.selectedIndex].value;
    var para = "";
    var self = this;
    
    if(trainType == TRAINTYPE_RANDOM)
    {
        para = "type=" + TYPE_GET_CHARS;
        para += "&trainType=" + trainType;
        self.clearTrainChars();
        this.getXmlHttp("handwriting.php", para, self.callback,"showTrainChars");
    }
    else if(trainType == TRAINTYPE_UNICODE)
    {
        if(unicodeFrom.value != "" && unicodeTo.value != "")
        {
            para = "type=" + TYPE_GET_CHARS;
            para += "&trainType=" + trainType;
            para += "&unicodeFrom=" + parseInt(unicodeFrom.value, 16);
            para += "&unicodeTo=" + parseInt(unicodeTo.value, 16);
            self.clearTrainChars();
            this.getXmlHttp("handwriting.php", para, self.callback,"showTrainChars");
        }
        else
        {
            this.showMsg("请输入汉字或编码");
        }
    }
    else
    {
        if(character.value != "")
        {
            para = "type=" + TYPE_GET_CHARS;
            para += "&trainType=" + trainType;
            para += "&c=" + encodeURIComponent(character.value);
            self.clearTrainChars();
            this.getXmlHttp("handwriting.php", para, self.callback,"showTrainChars");
        }
        else
        {
            this.showMsg("请输入编码");
        }
    }
}

TOMOE.prototype.getWritings = function ()
{
    var character = document.getElementById("tomoe-char-text");
    var para = "";
    var self = this;

    para = "type=" + TYPE_GET_WRITINGS;
    para += "&c=" + character.value;
    this.getXmlHttp("handwriting.php", para, self.callback,"showWritings");
}

TOMOE.prototype.showTrainChars = function (msg)
{
    try
    {
        var self = this;
        var ret = JSON.parse(msg);
        if(ret)
        {
            if(ret.msgno == MSG_OK)
            {
                var trainChars = document.getElementById("tomoe-train-chars");
                if(ret.res.length == 1)	//结果为1个的时候
                {
                    self.setCharInfo(ret.res[0].id, ret.res[0].img);
                }
                else	//结果为多个的时候
                {
                    var ul = document.createElement("ul");
                    ul.className = "tomoe-ul";

                    for(i in ret.res)
                    {
                        var li = document.createElement("li");
                        var a = document.createElement("a");
                        a.href = "javascript:void(0)";
                        a.onclick = function (id, src)
                        {
                            return function()
                            {
                                self.setCharInfo(id, src);
                            }
                        }(ret.res[i].id, ret.res[i].img);

                        var img = document.createElement("img");
                        img.src = ret.res[i].thumb;

                        a.appendChild(img);
                        li.appendChild(a);
                        ul.appendChild(li);
                    }
                    trainChars.appendChild(ul);
                }

            }
            else
            {
                this.showMsg(ret.msg);
            }
        }
    }
    catch(e)
    {
        this.showMsg(msg);
    }
}

TOMOE.prototype.showWritings = function(msg)
{
    try
    {
        var self = this;
        var ret = JSON.parse(msg);
        if(ret)
        {
            if(ret.msgno == MSG_OK)
            {
                
            }
        }
    }
    catch(e)
    {
        this.showMsg(msg);
    }
}

TOMOE.prototype.showImg = function()
{
    var src = document.getElementById("tomoe-imgSrc");
    var show = document.getElementById("tomoe-showImg-checkbox");
    if(src && show)
    {
        if(show.checked && src.value != "")
        {
            this.canvas.style.backgroundPosition = "center";
            this.canvas.style.backgroundRepeat = "no-repeat";
            this.canvas.style.backgroundImage = "url('" + src.value + "')";
        }
        else
        {
            this.canvas.style.backgroundImage="none";
        }
    }
    else
    {
        this.showMsg("未知错误");
    }
}

//学习
TOMOE.prototype.learn = function ()
{
    var id = document.getElementById("tomoe-charId");
    var select = document.getElementById("tomoe-trainType-select");
    var trainType = select.options[select.selectedIndex].value;

    if(id && id.value != "")
    {
        if(this.writing.s.length > 0)
        {
            var para = "type=" + TYPE_LEARN;
            para += "&id=" + id.value;
            para += "&c=" + JSON.stringify(this.writing);
            var self = this;
            if(trainType == TRAINTYPE_RANDOM)
            {
                this.getXmlHttp("handwriting.php", para, self.callback, "showMsgAndGetChars");
            }
            else
            {
                this.getXmlHttp("handwriting.php", para, self.callback, "showMsg");
            }
            this.showMsg("正在学习，请稍候...");
            this.clearAll();
        }
        else
        {
            this.showMsg("请描绘笔迹");
        }
    }
    else
    {
        this.showMsg("请输入汉字，并点击图片");
    }
}



TOMOE.prototype.read = function ()
{
    var s = '{"strokes":[{"points":[{"x":113,"y":93},{"x":164,"y":210}]},{"points":[{"x":0,"y":393},{"x":268,"y":322},{"x":131,"y":902},{"x":319,"y":860}]},{"points":[{"x":451,"y":47},{"x":535,"y":182}]},{"points":[{"x":972,"y":61},{"x":793,"y":196}]},{"points":[{"x":690,"y":0},{"x":502,"y":402},{"x":390,"y":411}]},{"points":[{"x":601,"y":248},{"x":840,"y":416}]},{"points":[{"x":446,"y":598},{"x":606,"y":748}]},{"points":[{"x":1000,"y":589},{"x":850,"y":706}]},{"points":[{"x":742,"y":551},{"x":596,"y":850},{"x":441,"y":939}]},{"points":[{"x":662,"y":771},{"x":812,"y":1000}]}],"width":1000,"height":1000,"left":0,"top":0}';

    var ch = eval("(" + s + ")");
    if (ch)
    {
        resize(ch, ch.left, ch.top, ch.width, ch.height, this.canvas.clientWidth, this.canvas.clientHeight);
        this.showChar(ch);
    }
}

TOMOE.prototype.showChar = function (ch)
{
    for (var i = 0; i < ch.s.length; i++)
    {
        for (var j = 0; j < ch.s[i].p.length; j++)
        {
            var point = ch.s[i].p[j];
            this.addPoint(point.x + this.offsetLeft, point.y + this.offsetTop);
        }
        this.finishStroke();
    }
    this.setInfo();
    this.showdebug(JSON.stringify(this.writing));
}

TOMOE.prototype.clearAll = function ()
{
    this.clear();
//this.setCharInfo("", "");
//this.textInput.value = "";
}

TOMOE.prototype.clear = function ()
{
    //this.xmlhttp = null;
    this.point_num = 0;
    this.writing = new Character();
    this.stroke = new Stroke();
    this.prev_x = -1;
    this.prev_y = -1;
    this.resultArea.innerHTML = "";
    this.resultArea.style.display = "none";
    this.resultNum = 0;
    this.dotint = 0;
    this.minX = Number.MAX_VALUE;
    this.maxX = -Number.MAX_VALUE;
    this.minY = Number.MAX_VALUE;
    this.maxY = -Number.MAX_VALUE;

    var o = this.canvas;
    clearAllNode(o);
}

TOMOE.prototype.showDebug = function(msg)
{
    document.getElementById("debug").innerHTML = msg;
}

TOMOE.prototype.showResult = function (str)
{
    this.resultArea.style.display = "block";
    this.resultArea.innerHTML = "";
    this.resultNum = 0;
    try
    {
        var obj = JSON.parse(str);
        if(obj.msgno == MSG_OK)
        {
            this.showCandidate(obj.res);
            this.showDebug(obj.debug);
        }
        this.showMsg(obj.msg);
    }
    catch(e)
    {
        this.showMsg(str);
    }
}

TOMOE.prototype.showCandidate = function(arr)
{
    var self = this;
    var ui = document.createElement("ui");
    ui.className = "tomoe-list";
    for(var i = 0; i < arr.length; i++)
    {
        var li = document.createElement("li");
        var txt = document.createTextNode(arr[i].ch);
        var span = document.createElement("span");
        span.className = "tomoe-char";
        span.appendChild(txt);

        var txt2 = document.createTextNode(arr[i].score);
        var span2 = document.createElement("span");
        span2.appendChild(txt2);
        span2.className = "tomoe-prob";

        li.appendChild(span);
        li.appendChild(span2);

        var idx = this.resultNum;
        li.onclick = function (e)
        {
            //self.sendFeedback(c);
            self.textInput.value += arr[i].ch;
        //self.clear();
        }

        this.resultNum++;
        ui.appendChild(li);
    }
    this.resultArea.appendChild(ui);
}

/*
            TOMOE.prototype.addResult = function (c, p)
            {
                var div = document.createElement("div");
                var txt = document.createTextNode(c);
                var span = document.createElement("span");
                span.className = "tomoe-char";
                span.appendChild(txt);

                var txt2 = document.createTextNode(p);
                var span2 = document.createElement("span");
                span2.appendChild(txt2);
                span2.className = "tomoe-prob";

                div.appendChild(span);
                div.appendChild(span2);

                var self = this;
                var idx = this.resultNum;
                div.onmouseover = function (event)
                {
                    self.highlight(idx);
                }
                div.onclick = function (event)
                {
                    self.sendFeedback(c);
                    self.textInput.value += c;
                    self.clear();
                }

                this.resultNum++;
                this.resultArea.appendChild(div);
            }
         */

TOMOE.prototype.highlight = function (idx)
{
    var divs = this.resultArea.getElementsByTagName('div');
    for (var i = 0; i < divs.length; i++)
    {
        if (i == idx)
        {
            divs[i].className = 'tomoe-srs';
        }
        else
        {
            divs[i].className = 'tomoe-sr';
        }
    }
}

/*
            TOMOE.prototype.getExample = function (c)
            {
                if (!this.checkXmlHttp()) return;
                this.xmlhttp.open("POST", "tomoeajax.cgi", true);

                var self = this;
                this.xmlhttp.onreadystatechange = function ()
                {
                    //    var r = self.xmlhttp.responseText;
                    //    if (r == "") {
                    //      alert("データがありません");
                    //      return;
                    //    }

                    self.readExample(input);
                    //    self.read(r);
                    self.showResult();
                    self.addResult(self.resultChar, "1.0");

                    var ok = self.createButton("正解");
                    ok.onclick = function ()
                    {
                        //      self.sendFeedback2(self.resultChar + " # correct");
                        self.clearAll();
                        self.getExample();
                    }
                    self.resultArea.appendChild(ok);

                    var progress = self.createButton("書きかけ");
                    progress.onclick = function ()
                    {
                        //      self.sendFeedback2(self.resultChar + " # in_stroke");
                        self.clearAll();
                        self.getExample();
                    }
                    self.resultArea.appendChild(progress);

                    var pending = self.createButton("保留");
                    pending.onclick = function ()
                    {
                        //      self.sendFeedback2(self.resultChar + " # pending");
                        self.clearAll();
                        self.getExample();
                    }
                    self.resultArea.appendChild(pending);
                };
                this.xmlhttp.send("");
            }
         */

TOMOE.prototype.sendFeedback = function (c)
{
    }

TOMOE.prototype.sendStroke = function ()
{
    if(this.writing.s.length >0)
    {
        var para = "type=" + TYPE_RECOGNIZE;
        para += "&c=" + JSON.stringify(this.writing);
        var self = this;
        this.showMsg("正在提交数据…");
        this.getXmlHttp("handwriting.php", para, self.callback, "showResult");
    }
}

TOMOE.prototype.callback = function(obj, func, msg)
{
    if( typeof(obj) == "object")
    {
        eval("obj." + func + "(msg)");
    }
}

TOMOE.prototype.mouseup = function (e)
{
    this.trace(e);
    this.finishStroke();
    this.setInfo();
    this.isWriting = false;
    if(mode == TYPE_RECOGNIZE)
    {
        this.sendStroke();
    }
}

//设置识别边框信息
TOMOE.prototype.setInfo = function ()
{
    this.writing.left = this.minX; //左上角的顶点坐标
    this.writing.top = this.minY;
    this.writing.width = this.maxX - this.minX;
    this.writing.height = this.maxY - this.minY;
}

TOMOE.prototype.mousemove = function (e)
{
    this.trace(e);
}

TOMOE.prototype.mousedown = function (e)
{
    this.isWriting = true;
    this.trace(e);
}

TOMOE.prototype.finishStroke = function ()
{
    this.point_num = 0;
    this.dotint = 0;
    this.addStroke(this.writing, this.stroke);
    this.prev_x = -1;
    this.prev_y = -1;
}

TOMOE.prototype.addPoint = function (x, y)
{
    var x1 = x - this.offsetPointLeft;
    var y1 = y - this.offsetPointTop;
    var x2 = x - this.offsetLeft;
    var y2 = y - this.offsetTop;

    if (this.point_num == 0)
    {
        this.stroke = new Stroke();
    }

    this.addPointXY(this.stroke, x2, y2);
    this.point_num++;

    this.minX = (x2 < this.minX) ? x2 : this.minX;
    this.maxX = (x2 > this.maxX) ? x2 : this.maxX;
    this.minY = (y2 < this.minY) ? y2 : this.minY;
    this.maxY = (y2 > this.maxY) ? y2 : this.maxY;

    if (this.prev_x != -1)
    {
        this.drawLine(this.prev_x, this.prev_y, x1, y1);
    }
    else
    {
        this.drawDot(x1, y1);
    }

    this.prev_x = x1;
    this.prev_y = y1;
}

TOMOE.prototype.trace = function (e)
{
    var pos = getPosition(e);
    this.addPoint(pos.x, pos.y);
}

TOMOE.prototype.drawDot = function (x, y)
{
    if (this.dotint == 0)
    {
        var dot = document.createElement("span");
        if(this.point_num <=1)
        {
            dot.id =  this.writing.s.length+"_"+this.point_num;
        }
        dot.style.left = x + "px";
        dot.style.top = y + "px";
        
        if(mode == TYPE_LEARN)
        {
            dot.className = "tomoe-dot-train";
        }
        else
        {
            dot.className = "tomoe-dot";
        }
        this.canvas.appendChild(dot);
        this.dotint = 4;
    }
    this.dotint--;
}

TOMOE.prototype.drawLine = function (x1, y1, x2, y2)
{
    if (x1 == x2 && y1 == y2) return;

    var x_move = x2 - x1;
    var y_move = y2 - y1;
    var x_diff = x_move < 0 ? 1 : -1;
    var y_diff = y_move < 0 ? 1 : -1;

    if (Math.abs(x_move) >= Math.abs(y_move))
    {
        for (var i = x_move; i != 0; i += x_diff)
        {
            this.drawDot(x2 - i, y2 - Math.round(y_move * i / x_move));
        }
    }
    else
    {
        for (i = y_move; i != 0; i += y_diff)
        {
            this.drawDot(x2 - Math.round(x_move * i / y_move), y2 - i);
        }
    }
}

TOMOE.prototype.undo = function()
{
    if(this.writing.s.length > 0)
    {
        this.writing.s.pop();
        this.delDots(this.writing.s.length);
    }
}

TOMOE.prototype.delDots = function(stroke_number)
{
    while(this.canvas.lastChild && this.canvas.lastChild.id.indexOf(stroke_number + "_") < 0)
    {
        this.canvas.removeChild(this.canvas.lastChild);
    }
    if(this.canvas.lastChild)
    {
        this.canvas.removeChild(this.canvas.lastChild);
    }
}

window.onload = function ()
{
    tomoe = new TOMOE();
}