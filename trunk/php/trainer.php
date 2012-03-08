<?php

//require_once 'Config.php';
//require_once 'class.php';

//训练
class Trainer
{

    var $train_features = array();

    function add_feature($index, $min, $mid, $max, $num)
    {
        $f = new TomoeTrainFeature($index, round($min, PRECISION), round($mid, PRECISION), round($max, PRECISION), $num);
        array_push($this->train_features, $f);
    }

    function train(&$features, &$dict_features)
    {
        if (!isset($features))
        {
            $this->train_features = null;
            return;
        }

        if (!isset($dict_features))
        {
            foreach ($features as $f)
            {
                $this->add_feature(
                        $f->i,
                        $f->v,
                        $f->v,
                        $f->v,
                        1
                );
            }
        }
        else
        {
            foreach ($dict_features as $df)
            {
                $this->add_feature(
                        $df->i,
                        $df->n,
                        $df->d,
                        $df->x,
                        $df->m
                );
            }

            $i = 0;
            $train_features_size = sizeof($this->train_features);

            foreach ($features as $f)
            {
                //字典中独有的特征(忽略)
                while ($f->i > $this->train_features[$i]->i && $i < $train_features_size)
                {
                    ++$i;
                }
                //字典中的特征未全部循环完
                if ($i < $train_features_size)
                {
                    //识别笔迹中独有的特征
                    if ($f->i < $this->train_features[$i]->i)
                    {
                        $this->add_feature(
                                $f->i,
                                $f->v,
                                $f->v,
                                $f->v,
                                1
                        );
                    }
                    else    //字典中和识别笔迹中共有的特征
                    {
                        //最小值
                        $this->train_features[$i]->n = ($this->train_features[$i]->n > $f->v) ? $f->v : $this->train_features[$i]->n;
                        //最大值
                        $this->train_features[$i]->x = ($this->train_features[$i]->x < $f->v) ? $f->v : $this->train_features[$i]->x;
                        //中间值
                        $this->train_features[$i]->d = round(($this->train_features[$i]->d * $this->train_features[$i]->m + $f->v) / ($this->train_features[$i]->m + 1), PRECISION);
                        $this->train_features[$i]->m++;
                    }
                    ++$i;
                }
                else
                {
                    $this->add_feature(
                            $f->i,
                            $f->v,
                            $f->v,
                            $f->v,
                            1
                    );
                }
            }

            /*
              while ($i < sizeof($features) && $j < sizeof($this->train_features))
              {
              //字典中没有的特征
              if ($features[$i]->i < $this->train_features[$j]->i)
              {
              $this->add_feature(
              $features[$i]->i,
              $features[$i]->v,
              $features[$i]->v,
              $features[$i]->v,
              1
              );
              $i++;
              }
              //字典中多余的特征(忽略)
              else if ($features[$i]->i > $this->train_features[$j]->i)
              {
              $j++;
              }
              else
              {
              //最小值
              $this->train_features[$j]->n = ($this->train_features[$j]->n > $features[$i]->v) ? $features[$i]->v : $this->train_features[$j]->n;
              //最大值
              $this->train_features[$j]->x = ($this->train_features[$j]->x < $features[$i]->v) ? $features[$i]->v : $this->train_features[$j]->x;
              //中间值
              $this->train_features[$j]->d = round(($this->train_features[$j]->d * $this->train_features[$j]->m + $features[$i]->v) / ($this->train_features[$j]->m + 1), PRECISION);
              $this->train_features[$j]->m++;
              $i++;
              $j++;
              }
              }
              //如果特征还没循环完
              while ($i < sizeof($features))
              {
              $this->add_feature(
              $features[$i]->i,
              $features[$i]->v,
              $features[$i]->v,
              $features[$i]->v,
              1
              );
              $i++;
              }
             */
            usort($this->train_features, 'feature_node_cmp');
        }
    }

}

?>
