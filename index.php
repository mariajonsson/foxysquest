<!doctype html>
<html lang='en' class='no-js'>
<head>
<meta charset='utf-8' />
<title><?=isset($title) ? $title : 'Foxy\'s Quest'?></title>
<link rel="stylesheet/less" type="text/css" href="js/style.less">
<script src="js/less.min.js"></script>
<script src="js/modernizr.js"></script>

</head>
<body>
 
<div id='area'>
<div id="board">

   
   <?php 
   $rows = 20;
   $cols = 25;
   // add rows
   for ($i=0; $i<$rows; $i+=1):?>     
      <div class="row">    
      <?php 
      // add each cell
      $start = $i*$cols;
      for ($a=$start; $a<($start+$cols); $a++):?><div id="block-<?=$a?>" class="">
	  </div>
      <?php endfor?>
      </div>     
    <?php endfor?>
</div>

<div id="message" >
  <span id='life'></span>
  <span id='items'></span>
  <span id='score'></span>
</div>
<div id="popup">
  <p id="text"></p>
</div>

</div>

<canvas id="tutorial" width="900" height="591">
  <img src="img/screen1.png">
</canvas>

<audio id="pop">
<source src="sounds/drop-2.mp3" type="audio/mpeg">
</audio>
<audio id="cash">
<source src="sounds/chaching.mp3" type="audio/mpeg">
</audio>
<audio id="drring">
<source src="sounds/magic-2.mp3" type="audio/mpeg">
</audio> 
<audio id="push">
<source src="sounds/push-3.mp3" type="audio/mpeg">
</audio> 
<audio id="boom">
<source src="sounds/boom.mp3" type="audio/mpeg">
</audio> 
<audio id="ta-da">
<source src="sounds/fanfare.mp3" type="audio/mpeg">
</audio> 


<footer id='footer'>

</footer>
<script src="js/jquery.js"></script>
<script src="js/maria.js"></script>
<script src="js/main.js"></script>
</body>
</html>