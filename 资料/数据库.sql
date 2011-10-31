-- phpMyAdmin SQL Dump
-- version 3.2.0.1
-- http://www.phpmyadmin.net
--
-- 主机: localhost
-- 生成日期: 2009 年 10 月 08 日 04:19
-- 服务器版本: 5.1.36
-- PHP 版本: 5.3.0

SET character_set_connection=latin1, character_set_results=latin1, character_set_client=binary;
SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";

--
-- 数据库: `hdwg`
--
CREATE DATABASE IF NOT EXISTS `hdwg` DEFAULT CHARACTER SET utf8 COLLATE utf8_bin;
use `hdwg`;
-- --------------------------------------------------------

--
-- 表的结构 `tomoe_character`
--

DROP TABLE IF EXISTS `tomoe_character`;
CREATE TABLE IF NOT EXISTS `tomoe_character` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键，自增',
  `character` varchar(6) COLLATE utf8_bin DEFAULT NULL COMMENT '字符名称',
  `src` varchar(500) COLLATE utf8_bin DEFAULT NULL COMMENT '汉字解释的路径',
  `original_char` varchar(6) COLLATE utf8_bin DEFAULT NULL COMMENT '对应的正字',
  `feature` longtext COLLATE utf8_bin DEFAULT NULL COMMENT '特征值',
  `first_stroke_type` int(3) NOT NULL DEFAULT '0' COMMENT '首笔类型（横竖撇点折，可能有多种首笔），以二进制方式存储',
  `min_n_strokes` int(11) NOT NULL DEFAULT '-1' COMMENT '只有写满这么多笔画才会显示该字，为了减小数据库负荷，请慎重设置',
  `max_n_strokes` int(11) NOT NULL DEFAULT '-1' COMMENT '超过这个数字时，不会显示该字',
  `rank` int(11) DEFAULT '0' COMMENT '级别，未分类:0，3500常用字:1，GB2312:2，Ext-A:3，Ext-B:4，Ext-C:5',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='汉字信息表' AUTO_INCREMENT=1 ;
-- ALTER TABLE `tomoe_character` CHANGE `img_src` `img_src` varchar( 500 ) COLLATE utf8_bin DEFAULT NULL COMMENT '汉字图片的路径';
-- ALTER TABLE `tomoe_character` CHANGE `src` `src` varchar( 500 ) COLLATE utf8_bin DEFAULT NULL COMMENT '汉字解释的路径';
-- ALTER TABLE `tomoe_character` ADD `thumb_src` varchar( 500 ) COLLATE utf8_bin DEFAULT NULL COMMENT '缩略图路径' AFTER `character`;
-- ALTER TABLE `tomoe_character` ADD `feature` longtext COLLATE utf8_bin DEFAULT NULL COMMENT '特征值' AFTER `original_char`;
-- --------------------------------------------------------

-- INSERT INTO `tomoe_character` (`character`,`src`, `original_char`, `feature`, `first_stroke_type`, `min_n_strokes`, `max_n_strokes`, `rank`) VALUES
-- ( '谈', 'http://www.zdic.net/zd/zi/ZdicE8ZdicB0Zdic88.htm', '谈', NULL, 0, -1, -1, 0),
-- ( '𪚥', 'http://www.zdic.net/zd/zi3/ZdicF0ZdicAAZdic9AZdicA5.htm', '谈', NULL, 0, -1, -1, 0);

DROP TABLE IF EXISTS `tomoe_char_img`;
CREATE TABLE IF NOT EXISTS `tomoe_char_img` (
	`id` INT( 11 ) NOT NULL AUTO_INCREMENT COMMENT '主键，自增',
	`char_id` INT( 11 ) NOT NULL COMMENT '字符ID',
	`description` VARCHAR( 500 ) COLLATE utf8_bin DEFAULT NULL COMMENT '描述',
	`img_src` VARCHAR( 500 ) COLLATE utf8_bin DEFAULT NULL COMMENT '汉字图片的路径',
	`thumbnail_src` VARCHAR( 500 ) DEFAULT NULL COMMENT '缩略图路径',
	PRIMARY KEY ( `id` ) 
) ENGINE = MYISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT = '汉字图片表' AUTO_INCREMENT=1 ;


-- INSERT INTO `tomoe_char_img` (`char_id`, `img_src`, `thumbnail_src`) VALUES
-- ( 1, 'http://www.zdic.net/pic/1b/8C08.gif', 'http://www.zdic.net/zd/2s/46B1.gif' ),
-- ( 2, 'http://www.zdic.net/pic/3b/2A6A5.gif', 'http://www.zdic.net/zd/3s/2A6A5.gif' );


--
-- 表的结构 `tomoe_writing`
--

DROP TABLE IF EXISTS `tomoe_writing`;
CREATE TABLE IF NOT EXISTS `tomoe_writing` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键，自增',
  `char_id` int(11) NOT NULL COMMENT '字符名称',
  `writing` longtext COLLATE utf8_bin NOT NULL COMMENT '笔迹',
  `user_id` int(11) DEFAULT NULL COMMENT '用户ID',
  `add_date` datetime DEFAULT NULL COMMENT '添加时间',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='笔迹表' AUTO_INCREMENT=1;

--
-- 转存表中的数据 `tomoe_writing`
--

-- --------------------------------------------------------

--
-- 表的结构 `user_info`
--

DROP TABLE IF EXISTS `user_info`;
CREATE TABLE IF NOT EXISTS `user_info` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键，自增',
  `user_id` int(11) DEFAULT NULL COMMENT '用户ID',
  `user_name` varchar(200) DEFAULT NULL COMMENT '用户名',
  `password` varchar(200) DEFAULT NULL COMMENT '密码',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='用户信息表' AUTO_INCREMENT=1;

