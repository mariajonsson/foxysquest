/**
 * Playing Game
 */

/** 
 * Shim layer, polyfill, for requestAnimationFrame with setTimeout fallback.
 * http://paulirish.com/2011/requestanimationframe-for-smart-animating/
 */ 
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       || 
          window.webkitRequestAnimationFrame || 
          window.mozRequestAnimationFrame    || 
          window.oRequestAnimationFrame      || 
          window.msRequestAnimationFrame     || 
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();



/**
 * Shim layer, polyfill, for cancelAnimationFrame with setTimeout fallback.
 */
window.cancelRequestAnimFrame = (function(){
  return  window.cancelRequestAnimationFrame || 
          window.webkitCancelRequestAnimationFrame || 
          window.mozCancelRequestAnimationFrame    || 
          window.oCancelRequestAnimationFrame      || 
          window.msCancelRequestAnimationFrame     || 
          window.clearTimeout;
})();



/**
 * Trace the keys pressed
 * http://nokarma.org/2011/02/27/javascript-game-development-keyboard-input/index.html
 */
window.Key = {
  pressed: {},

  LEFT:   37,
  UP:     38,
  RIGHT:  39,
  DOWN:   40,
  SPACE:  32,
  A:      65,
  S:      83,
  D:      68,
  W:      87,
  
  isDown: function(keyCode, keyCode1) {
    return this.pressed[keyCode] || this.pressed[keyCode1];
  },
  
  onKeydown: function(event) {
    this.pressed[event.keyCode] = true;
  },
  
  onKeyup: function(event) {
    delete this.pressed[event.keyCode];
  }
};
window.addEventListener('keyup',   function(event) { Key.onKeyup(event); },   false);
window.addEventListener('keydown', function(event) { Key.onKeydown(event); }, false);



/**
 * All objects are Vectors
 */
function Vector(x, y) {
  this.x = x || 0;
  this.y = y || 0;
}

Vector.prototype = {
  muls:  function (scalar) { return new Vector( this.x * scalar, this.y * scalar); }, // Multiply with scalar
  imuls: function (scalar) { this.x *= scalar; this.y *= scalar; return this; },      // Multiply itself with scalar
  adds:  function (scalar) { return new Vector( this.x + scalar, this.y + scalar); }, // Multiply with scalar
  iadd:  function (vector) { this.x += vector.x; this.y += vector.y; return this; }   // Add itself with Vector
}



/**
 * The forces around us.
 */
function Forces() {
  this.all = {};
}

Forces.prototype = {

  createAcceleration: function(vector) {
    return function(velocity, td) {
      velocity.iadd(vector.muls(td));
    }
  },

  createDamping: function(damping) {
    return function(velocity, td) {
      velocity.imuls(damping);
    }
  },

  createWind: function(vector) {
    return function(velocity, td) {
      velocity.iadd(vector.adds(td));
    }
  },  

  addAcceleration:  function(name, vector)  { this.all[name] = this.createAcceleration(vector); },
  addDamping:       function(name, damping) { this.all[name] = this.createDamping(damping); },
  addWind:          function(name, vector)  { this.all[name] = this.createWind(vector); },

  update: function(object, td) {
    for(var force in this.all) {
      if (this.all.hasOwnProperty(force)) {
        this.all[force](object, td);
      }
    }
  }

}

window.Forces = new Forces();
window.Forces.addAcceleration('gravity', new Vector(0, 9.82));
window.Forces.addDamping('drag', 0);
window.Forces.addWind('wind', new Vector(0, 0));

/**
 *  GameArea, draws the elements of the levels onto the canvas.
 *
 */

function GameArea(ct, width, height, elements) {
this.ct = ct;
this.height = height || 600;
this.width = width || 900;
this.elements = elements;
//console.log(elements);
}

GameArea.prototype = {

	draw: function(ct) {
		
		for (var i = 0; i < this.elements.length; i++) {
			for (var a = 0; a < this.elements[i].length; a++) {
				this.elements[i][a].draw(ct);	
			}	
		}

	}

}

/*
*  Item. Super object, for items that belong to the game area.
*
*
*/

function Item(id, position, imageSrc, width, height) {
  this.id = id || 0;
  var img = document.createElement("IMG");
  img.src = imageSrc || 'img/tiles/platforms/log-hstl.png';
  this.image = img;
  this.height = height || 32;
  this.width = width || 32;
  this.position   = position  || new Vector();

}

Item.prototype = {
	
    draw: function(ct) {
    ct.save();
    ct.drawImage(this.image, 0, 0,this.width,this.height,this.position.x,this.position.y,this.width,this.height);
    ct.restore();
    },
    collideAction: function (stats) {
    
   //do something
  }
}



/**
 *  Building block. subobject to Item. 
 *  Solid parts of the game area in the levels, platforms, walls, etc.
 *
 */

function BuildingBlock(position, imageSrc, width, height) {
  Item.call(this);
  var img = document.createElement("IMG");
  img.src = imageSrc || 'img/tiles/platforms/log-hstl.png';
  this.image = img;
  this.height = height || 32;
  this.width = width || 128;
  this.position   = position  || new Vector();

}

// subobject BuildingBlock extends superobject
BuildingBlock.prototype = Object.create(Item.prototype);

BuildingBlock.prototype.constructor = BuildingBlock;


/**
*  Collectable item, subobject to Item.
*  The player object can interact with these types of objects.
*
*/

function CollectableItem(id, position, imageSrc, width, height, itemtype) {
  Item.call(this);
  var img = document.createElement("IMG");
  img.src = imageSrc || 'img/tiles/sweet/square-blue.png';
  this.id = id;
  this.image = img;
  this.height = height || 32;
  this.width = width || 32;
  this.position   = position  || new Vector();
  this.itemtype = itemtype || "sweet";

}

// subobject CollectableItem extends superobject
CollectableItem.prototype = Object.create(Item.prototype);

// Detect collisions with otherObject. Objects are presumed to have a rectangular shape.

CollectableItem.prototype.collideWith = function(otherObject, collectables, stats) {
  
  var rect2 = {x: this.position.x, y: this.position.y, width: this.width/2, height: this.height/2},  
  rect1 = {x: otherObject.position.x+10, y: otherObject.position.y, width: otherObject.width, height: otherObject.height};
  if (rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.height + rect1.y > rect2.y) {
      // collision detected!
      if (this.itemtype != "explosive") {
    removeBlock(this.id, collectables, "", stats);
      }
    this.collideAction(collectables, stats);
    
  }

};

//What to do if a collision is detected. Add score, play sound.

CollectableItem.prototype.collideAction = function(collectables, stats) {
	var score = 0;
	var sound = "pop";
	switch (this.itemtype) {
	case "sweet":
		score = 80;
		break;		
	case "fruit":
		score = 50;
		break;
	case "coin":
		score = 100;
		sound = "cash";	
		break;
	case "gem":
		score = 200;
		break;
	case "fire":
	  sound = "";
		stats.addInventory(this);
		break;
	case "key-metal":
	  sound = "";
	  stats.addInventory(this);
	  break;
	case "explosive":
	  sound = "";
	  if (stats.notexploded) {
	   stats.lightExplosives(collectables);
	  }
	  break;
	
	case "life":
	  sound = "";
	  stats.addLife(this);
	  break; 
	} 
	playAudio(sound);
	stats.getPoints(score, true);
}


CollectableItem.prototype.constructor = CollectableItem;


/**
 *  A superobject for all moving/movable game objects
 * 
 */

function MovableObject(id, width, height, position, velocity, speed, direction, accelerateForce, breakForce, dampForce, pushed) {
  this.id = id;
  this.height     = height    || 32;
  this.width      = width     || 32;
  this.position   = position  || new Vector();
  this.velocity   = velocity  || new Vector(3,160);
  this.speed      = speed     || new Vector();
  this.direction  = direction || 0;
  this.accelerateForce  = accelerateForce || Forces.createAcceleration(new Vector(5, 50));
  this.breakForce       = breakForce      || Forces.createDamping(0.97);
  this.dampForce        = dampForce       || Forces.createDamping(0.898);
  this.pushed = false;
  this.floating = false;
  this.falling = false;
  this.jumpOffset = 0;
}


MovableObject.prototype = {
  
  moveForward: function(td) {
    this.dampForce(this.speed, td);
    this.position.x += this.speed.x * Math.cos(this.direction) * td;
    this.position.y += this.speed.y * Math.sin(this.direction) * td;
    this.position.iadd(this.velocity.muls(td));
  },
  
  moveFloating: function(td) {
    this.dampForce(this.speed, td);
    this.position.x += this.speed.x * Math.cos(this.direction) * td;
    this.position.y += this.speed.y * Math.sin(this.direction) * td;
    this.position.iadd(this.velocity.muls(td));
  
  },

  
  //checks if the object has collided with another object type
   collideWith: function(array, stats, otherRadius, thisRadius) {
    var radius1 = thisRadius || this.width/2;
     
     //if object area touches block object area 
    //compare distance from objects within a radius
    if (!this.pushed) {
      for (i=0; i < array.length; i++) {
	var a = this.position.x-array[i].position.x;
	var b = this.position.y-array[i].position.y;
	var radius2 = otherRadius || array[i].width/2;
	var distance = Math.sqrt((a*a)+(b*b))-radius1-radius2;

	if (distance <=0) this.collideAction(stats);
      }
    }
  },
  
  collideAction: function (stats) {
    
   //do something
  },
  
  stayInArea: function(width, height, objectradius, up, right, down, left) {
    var upLimit    = up     || false;
    var downLimit  = down   || true;
    var leftLimit  = left   || true;
    var rightLimit = right  || true;
    var radius = objectradius || this.width/2;
    
    if(upLimit    && this.position.y <= radius)  		this.position.y = radius;
    if(downLimit  && this.position.y+radius >= height) 	this.position.y = height-radius;
    if(rightLimit && this.position.x+radius+64 >= width)     this.position.x = width-radius-64;
    if(leftLimit  && this.position.x <= radius)   	this.position.x = radius;
    //console.log(this.position.x, radius);
  }

  
}

/**
 * A Player as an object.
 */

function Player(id, width, height, position) {
  MovableObject.call(this); // call super constructor.
  this.id = id;
  this.width = width;
  this.height = height;
  this.position = position;
  var img = document.createElement("IMG");
  img.src = 'img/mini-foxy-sprite.png';
  this.imageSprite = img;
  this.floating = false;
  this.onGround = false;
  //this.dampForce    = Forces.createDamping(0.991);
  
}

// subobject Player extends superobject
Player.prototype = Object.create(MovableObject.prototype);
 
Player.prototype.draw = function(ct) {
    var x = this.width/2, y = this.height/2;
    ct.save();
    ct.translate(this.position.x, this.position.y); 
    
    if (Key.isDown(Key.LEFT, Key.A)) {
    //player faces left
      ct.drawImage(this.imageSprite, 32, 0,this.width,this.height,x,y,this.width,this.height);
    }
    else if (Key.isDown(Key.RIGHT, Key.D)) {
    //player faces right
      ct.drawImage(this.imageSprite, 0, 0,this.width,this.height,x,y,this.width,this.height); 
    }
    else {
    //player faces front
      ct.drawImage(this.imageSprite, 64, 0,this.width,this.height,x,y,this.width,this.height);     
    }
    ct.restore();
  };

  
Player.prototype.moveLeft = function() {
  this.position.x -= 1 * this.velocity.x;
  this.direction = 1*Math.PI;
  //console.log('moveLeft '+this.position.x);
};

Player.prototype.moveRight = function() {
  this.position.x += 1 * this.velocity.x;
  this.direction = 0;
  //console.log('moveRight');
};

Player.prototype.moveUp = function() {
  this.position.y -= 1 * this.velocity.y;
  this.direction = 1.5*Math.PI;
  //console.log('moveUp');
  };
  
Player.prototype.jump = function(td, jumpOffset) {

  //this.position.y -= 1 * 1.5*this.velocity.y;
  this.direction = 1.5*Math.PI;
  this.speed = new Vector(600,1400);
  this.floating = true;
  this.jumpOffset = jumpOffset;
  this.moveFloating(td);
  //console.log('jump, start at '+jumpOffset);
  };
  
  Player.prototype.fall = function(td) {

  this.direction = 0.5*Math.PI;
  this.speed = new Vector(300,300);
  this.floating = true;
  this.moveFloating(td);
  };

Player.prototype.moveDown = function() {
  this.position.y += 1 * this.velocity.y;
  this.direction = 0.5*Math.PI;
  //console.log('moveDown');
  };
  
Player.prototype.update = function(td) {
  if (!this.pushed && !this.floating && !this.falling) {
    if (Key.isDown(Key.UP, Key.W))     this.jump(td, this.position.y);
    if (Key.isDown(Key.LEFT, Key.A))   this.moveLeft();
    //if (Key.isDown(Key.DOWN, Key.S))   this.moveDown();
    if (Key.isDown(Key.RIGHT, Key.D))  this.moveRight();
    }
        
    else if (this.floating) {
       if (Key.isDown(Key.LEFT, Key.A))   this.position.x -= 1 * this.velocity.x/2;
       if (Key.isDown(Key.RIGHT, Key.D))  this.position.x += 1 * this.velocity.x/2;
       this.moveFloating(td); 
       //console.log (this.position.y, this.jumpOffset);
       //if (this.position.y >= this.jumpOffset) {
       //console.log('falling');
       //this.floating = false;
       //this.falling = true;
      
      //};
    }
    else if (this.falling) {
      
    this.fall(td);  
      //this.stayInArea(width, height);
    //this.objectIsGone(width, height, 18, baddies, stats, "baddie");
    }
    
};

Player.prototype.stayInArea = function(width, height,stats) {
    var radius = this.width/2;
    
    // if the player falls through the bottom of the screen
    if(this.position.y+radius > height) {
      stats.loseLife();
    }
    
    // if the player exits through the right side
    if(this.position.x >= width-64-radius)  {

      // in level 1 there is an exit in the right wall
      if (stats.checkLevel() === 1)	{
      	  if (this.position.y <= 185 && this.position.y >= 100) {
      	  	  
      	  	  if(this.position.x >= width-32) {
      	  	  Game.stopGame();
      	  	  document.getElementById("tutorial").style.display = "none";
      	  	  document.getElementById("area").style.display = "block";
      	  	  BoardGame.init(1, stats);
      	  	  }
      	  }
      	  else {
      	  	  this.position.x = width-64-radius;
      	  }
      }
      
      //in level 2 you have to explode the wall
      else if (stats.checkLevel() === 2)	{
	
	if (stats.notexploded) {
	  this.position.x = width-64-radius;
	}
	
	else if (stats.notexploded === false) {
	  if (this.position.y >= 96 && this.position.y <= 416) {
      	  	  
      	  	  if(this.position.x >= width-32) {
      	  	  Game.stopGame();
      	  	  document.getElementById("tutorial").style.display = "none";
      	  	  document.getElementById("area").style.display = "block";
      	  	  BoardGame.init(2, stats);
      	  	  }
      	  }
      	  else {
      	  	  this.position.x = width-64-radius;
      	  }
	  
	}
      }
    };
    
    // the left wall, no exit
    if (this.position.x <= radius)   	this.position.x = radius;
    
    //the center wall in level 2
    if (stats.checkLevel() === 2) {
    	//console.log(this.position.x);
      if(this.position.x < 366 && this.position.x > 350 && this.position.y < 390)  {
      this.position.x = 366;
      }
      else if(this.position.x > 304 && this.position.x < 320 && this.position.y < 390)  {
      this.position.x = 304;
      }
    }
  }

// If the player collides with something deadly

Player.prototype.collideAction = function(stats) {
  
      this.pushed = true;
      this.speed = new Vector(4,4);
      this.direction = 0.5*Math.PI;
      this.update(td);
      stats.gameOver(true);
}

// If the player collides with something solid.

Player.prototype.collideBlock = function(blocks) {
    //if player area touches block area 
    //compare distance from player and block
    for (i=0; i < blocks.length; i++) {
   if (!blocks[i].pushed) {  
    var dir = this.direction;
    var a = this.position.x-blocks[i].position.x;
    var b = this.position.y-blocks[i].position.y;
    var distance = Math.sqrt((a*a)+(b*b))-35-50;
    if (distance <=0) {

      var angle = Math.atan2(Math.abs(b),Math.abs(a));
      if (dir === 0) {
	if (b>0) { angle = -angle; };
      }
      else if (dir === 0.5*Math.PI) {
	if (a>0) { angle = -angle; };
      }
      else if (dir === 1*Math.PI) {
	if (b<0) { angle = -angle; };
      }
      else if (dir === 1.5*Math.PI) {
	if (a>0) { angle = -angle; };
      }

      playAudio("pop");
      //console.log(angle+', '+this.direction);
      blocks[i].speed = new Vector(400,200);
      blocks[i].direction = this.direction+angle;
      blocks[i].isPushed();
      blocks[i].update(td);
    }
    }
    }
  };
  
  Player.prototype.collideBBlock = function(blocks) {
     //if player area touches block area 
    //compare distance from player and block
    var baseline = this.position.y+40; 
    var px1 = this.position.x;
    var px2 = this.position.x+32;
    
    for (i=0; i < blocks.length; i++) {
      
    var bx1 = blocks[i].position.x;
    var bx2 = blocks[i].position.x+blocks[i].width;
    var distanceY = blocks[i].position.y-baseline;

    
    if (px1 > bx1-36 && px2 < bx2+16 && distanceY <=7 && distanceY > -2) {
         
      this.falling = false;
      this.floating = false;
      //console.log('stopped falling');
      break;
      
    }
    else {
      this.falling = true;
    }
    
    } 
    
  };

  
Player.prototype.constructor = Player;


/** 
 * Game stats as object
 *
 *
 */
 
function Stats(width, height, score, level, bricks, explosives, msg,  gameover, dead) {
  this.width = width;
  this.msg = msg;
  this.height = height;
  this.score = score || 0;
  this.dead = dead || false;
  this.gameover = gameover || false;
  this.update();
  this.inventory = [];
  this.life = [new CollectableItem(0, new Vector(0,0), 'img/tiles/items/heart2.png',32,32,"life")];
  this.level = level || 0;
  this.chest1Empty = false;
  this.chest2Empty = false;
  this.currentChest = "";
  this.inMenu = false;
  this.HTMLStatusRow = "";
  this.bricks = bricks || [];
  this.explosives = explosives || [];
  this.notexploded = true;
}


Stats.prototype = {
	
	//Draws the status row or messages for the canvas
	
  draw: function(ct) {
    ct.save();
    ct.fillStyle = 'white';
    ct.font = 'bold 18px Courier';
    ct.textAlign = 'left';
    ct.fillText(this.info, this.width-200, 20); 
    ct.fillText('Items: ', this.width-350, 20);
    ct.fillText('Life: ', this.width-500, 20);

    if (this.inventory != 0) {
      var length = this.inventory.length;
      var j = 0; 
      var k = 0;
      for (j = 0; length > 0; j++) {
      ct.drawImage(this.inventory[j].image, 0, 0,32,32,this.width-280+k,2,25,25);
      k = k+25;
      length = length-1;

      }
    }
    if (this.life != 0) {
      var length = this.life.length;
      var j = 0; 
      var k = 0;
      
      for (j = 0; j < length; j++) {
      ct.drawImage(this.life[j].image, 0, 0,32,32,this.width-445+k,2,22,22);
      k = k+25;

      }
    }

    if (this.msg) {
      
      ct.fillRect((this.width/2)-300,(this.height/2-100),600,200);
      ct.rect((this.width/2)-300,(this.height/2-100),600,200);
      ct.strokeStyle = 'black';
      ct.stroke();
      ct.fillStyle = 'black';
      ct.font = 'bold 24px Courier';
      ct.textAlign = 'center';
      ct.fillText(this.msg, this.width/2, this.height/2); 
    }
    ct.restore();
  },
  
  //Draws the status row for the HTML game area  
  drawForBoard: function () {
    var image;
    this.HTMLStatusRow = document.getElementById('message');
    var life = document.getElementById('life');
    life.innerHTML = "Life: ";
    life.style.left = this.width-500 + 'px';
    if (this.life != 0) {
      var length = this.life.length;
      var j = 0; 
      //var k = 0;
      for (j = 0; j < length; j++) {
	image = document.createElement('IMG');
	image.src = this.life[j].image.src; 
	life.appendChild(image);

      }
    }
    
    var items = document.getElementById('items');
    items.style.left = this.width-350 + 'px';
    items.innerHTML = "Items: ";
    
     if (this.inventory != 0) {
      var length = this.inventory.length;
      var j = 0; 
      for (j = 0; j < length; j++) {
	image = document.createElement('IMG');
	image.src = this.inventory[j].image.src; 
	items.appendChild(image);
      }
    }
    
    var score = document.getElementById('score');
    score.style.left = this.width-200 + 'px';
    score.innerHTML = "Score: "+ this.score;

  },

  update: function() {
    this.info = 'Score: ' + this.score;
    if (this.notexploded) {
    this.explode(this.explosives);
    }
     if (Key.isDown(Key.LEFT, Key.UP, Key.RIGHT, Key.DOWN, Key.SPACE)) {
     	 this.msg = null;
     	 this.inMenu = "";
     }
    
  },

  restart: function() {
    if (Key.isDown(Key.SPACE)) {
      if (this.gameover) {
       this.dead = false;
       this.gamover = false;
       this.msg = null;
       
       //this.setNull();
       document.getElementById("tutorial").style.display = "none";
       document.getElementById("area").style.display = "block";
       Game.stopGame();
       BoardGame.init(0);
      }
      
    }
  },

  
  restartLevel: function() {
      this.msg = null;
      stats.inventory = [];
      stats.score = 0;
      Game.init(this.level,stats);
  },
  
  explode: function(item) {
    if (Key.isDown(Key.SPACE)) {
      if (this.inMenu === "lightExplosives" && this.checkInventory('fire')) {
	this.notexploded = false;
       this.msg = "BOOM!";
       
       animateWin = function (bricks, step) {
	
        //console.log('Animate function called.' + bricks);
        if (step > 9) {
         console.log('end animation');
	} else {
	   bricks.splice(0,10);
	   step = 10;
	}
          
        //window.setTimeout(animateWin, 800);
      };
       
      if (item != 0) {
      item.splice(0,1);
      playAudio("boom");
      //console.log('explode!');
      }
      animateWin(this.bricks, 0);
      }
      else if (this.inMenu === "lightExplosives") {
      	  this.msg = "You need fire to light the explosives!";
      }
      
    }
  },
  
  
  checkLevel: function() {
    return this.level;
  },
  
  changeLevel: function(newlevel) {
    this.level = newlevel;
  },
 
  addInventory: function(item) {
    playAudio('drring');
    this.inventory.push(item);
  },
  
  addLife: function(item) {
  	  playAudio('drring');
    this.life.push(item);
  },
  
  lightExplosives: function() {
      // is there fire in the inventory?
      if (this.inMenu != "lightExplosives") {
     this.msg = "Explosives! Press SPACE to light them.";
     this.inMenu = "lightExplosives"; 
     this.explode();
      }
  },

  getPoints: function(points, remaining) {
    this.score += points;
    this.update();
    if (!remaining && !this.dead) {
      this.gameover = true;
      this.msg = 'YOU WIN!!!';
    }
  },

  gameOver: function(dead) {
    if (!this.gameover) {
      this.dead = dead;
      this.gameover = true;
      this.msg = 'GAME OVER \n press SPACE to restart';
    }
  },
  
  loseLife: function() {
    
    //how many lives left
    var lives = this.checkLives();
    
    //if 1 or more, delete one
    if (lives > 0) {
      this.life.splice(-1,1);
      this.restartLevel();
    }
    //if 0, game over
    else {
      this.gameOver(true);
    }
        
  },
  
  checkLives: function() {
   var lives = 0; 
   if (this.life != 0) {    
     lives = this.life.length;
   }
   return lives;
   },
    
  
   isChestEmpty: function(chestname) {
   switch (chestname) {
   case "cell bg-chest":
   	   return this.chest1Empty;
   	   break;
   case "cell bg-chest-2":
   	   return this.chest2Empty;
   	   break;
   default:
   	   return false;
   }
   },
   
   getCompatibleChest: function(key) {
   switch (key) {
   case "key-metal":
   	   return "cell bg-chest";
   	   break;
   case "key-copper":
   	   return "cell bg-chest-2";
   	   break;
   default:
   	   return false;
   }
   },
   
  openChest: function(chestname) {
    var currentchest = chestname; 
 
    if (this.checkInventory("key-metal")) {
    this.tryKey("key-metal", currentchest, this.getCompatibleChest("key-metal"), "silver", this.isChestEmpty(currentchest));
    }
    
    if (this.checkInventory("key-copper")) {
    this.tryKey("key-copper", currentchest, this.getCompatibleChest("key-copper"), "copper", this.isChestEmpty(currentchest));
    }    
    
    //if you don't have any key
   if (!this.checkInventory("key-copper") && !this.checkInventory("key-metal")) {
   	   this.msg = "The chest is locked! You don't have a key!";
	   popUp('popup', this.msg, 220, 64, 600, 100);
	   this.inMenu = "message-over";
  }
        
  },
  
  tryKey: function(typekey, currentchest, compatiblechest, namekey, isempty) {
      closePopUp('popup');
      // if it's the right chest
      if (currentchest === compatiblechest) {
      	  this.msg = "You have opened the chest with the "+namekey+"key!";
	      //popUp('popup', this.msg, 220, 64, 600, 100);
	  
		  // if the chest is already emptied
		  if (isempty) {
		  this.msg += "<br>The chest is empty.";
		  }
	  
		  //else, collect the object inside
		  else {
		  	  
		  	  if(currentchest === "cell bg-chest") {
		  this.addInventory(new CollectableItem(0, new Vector(0,0), 'img/tiles/items/KeyCopper.png',32,32,"key-copper"));
		  this.chest1Empty = true;
		  this.drawForBoard();
		  this.msg += "<br>There is a key inside! You've picked it up.";
		  	  }
		  	  else if (currentchest === "cell bg-chest-2") {
		  	  this.addLife(new CollectableItem(0, new Vector(0,0), 'img/tiles/items/heart2.png',32,32,"life"));
		  this.chest2Empty = true;
		  this.drawForBoard();
		  this.msg += "<br>There is an extra life inside! You've collected it.";
		  	  }
		  }
		  
		  
      	} //end 
      
      //if it's the second chest and you don't have the copper key
      else if (currentchest != compatiblechest && this.inventory.length < 2) {
      	  this.msg = "The key you have doesn't fit :/";

      }
      if (this.msg != null) {
      	popUp('popup', this.msg, 220, 64, 600, 100);
		  this.inMenu = "message-over";
      }
   
},
  
  checkInventory: function(item) {
    
   if (this.inventory != 0) {    
     for(var l = 0; l < this.inventory.length; l++) {
      if (this.inventory[l].itemtype === item) {
	return true;
	break;
      }
      
      }
   }
    
  } 
} 



function isEven(n) {
  return n == parseFloat(n) && !(n % 2);
}

function removeBlock(id, blocks, blocktype, stats) {
  
   for(var i = blocks.length - 1; i >= 0; i--) {
    if(blocks[i].id === id) {
    blocks.splice(i, 1);
    //console.log(blocktype+' '+id+' is cleared');
    }
 }
 if (blocks.length === 0) {
    //console.log('no more blocks in this array');
  }
  
};

function playAudio(audioid) {
	var audio = document.getElementById(audioid);
	if (audio != null) {
		if (!audio.paused && audio.duration != null) {
		audio.pause();
		audio.currentTime = 0;
		}
	audio.play();	  
	}
};


function popUp(name, message, top, left, width, height) {
  var popup = document.getElementById(name);
  popup.style.display = "inline-block";
  
  var p = document.getElementById('text');
  p.innerHTML += message + '</br>';

  popup.style.top = top+'px';
  popup.style.left = left+'px';
  popup.style.width = width+'px';
  popup.style.height = height+'px';
  
}

function closePopUp(name) {

  var p = document.getElementById('text');
  p.innerHTML = "";
  popup.style.display = "none";
}


function createLogs(array) {
	var arr, bBlock;
	var array = array || [[0,110],[0,250],[200,420],[250,330],[370,420],[780,200],[385,220],[510,100],[600,350],[650,350],[20,490],[810,470]];
	var bBlocks = [];
	for (var i = 0; i < array.length; i++) {
		arr = array[i];
		bBlock = new BuildingBlock(new Vector(arr[0], arr[1]), 'img/tiles/platforms/log-hstl.png', 128, 32);
		bBlocks.push(bBlock);
	}
	return bBlocks;
}

function createPlatforms(array) {
	var arr, bBlock;
	//var img = imgSrc;
	var array = array || [[0,100,4],[0,216,8],[200,364,10],[780,200,4],[376,236,4],[200,100,17],[600,364,6],[600,236,4],[20,452,4],[810,480,4],[320,300,1],[130,560,6],[400,560,6],[680,560,6]];
	var bBlocks = [];
	for (var i = 0; i < array.length; i++) {
		arr = array[i];
		bBlock = new createBricksHztl(arr[0], arr[1], arr[2]);
		//console.log(bBlock);
		if (i === 0) bBlocks = bBlock;
		else bBlocks = bBlocks.concat(bBlock);
	}
	//console.log(bBlocks);
	return bBlocks;
}

function createPillars(array, imgSrc) {
  var arr, bBlock;
	var img = imgSrc;
	//var array = array;
	var bBlocks = [];
	for (var i = 0; i < array.length; i++) {
		arr = array[i];
		bBlock = new createBricks(arr[0], arr[1], arr[2], imgSrc);
		//console.log(bBlock);
		if (i === 0) bBlocks = bBlock;
		else bBlocks = bBlocks.concat(bBlock);
	}
	//console.log(bBlocks);
	return bBlocks;
  
}

function createBricks(startPointx, startPointy, numblocks, imgSrc) {
	var bBlock;
	var bBlocks = [];
	for (var i = 0; i < numblocks; i++) {
		bBlock = new BuildingBlock(new Vector(startPointx, startPointy), imgSrc, 32, 32);
		bBlocks.push(bBlock);
		startPointy += 32;
	}
	return bBlocks;
}

function createBricksHztl(startPointx, startPointy, numblocks) {
	var bBlock;
	var bBlocks = [];
	for (var i = 0; i < numblocks; i++) {
		bBlock = new BuildingBlock(new Vector(startPointx, startPointy), 'img/tiles/wall/stone_brick1.png', 32, 32);
		bBlocks.push(bBlock);
		startPointx += 32;
	}
	return bBlocks;
}



function createCollectables(array, itemtype, imgUrl) {
  
  var arr, bBlock;
	var bBlocks = [];
	for (var i = 0; i < array.length; i++) {
		arr = array[i];
		bBlock = new CollectableItem(i, new Vector(arr[0], arr[1]), imgUrl, 32, 32, itemtype);
		bBlocks.push(bBlock);
	}
	return bBlocks;
}



  // Checks if the cell's class name is in the playable array.
  function isPlayable(cellclass) {
    var playable = ['cell bg-grass', 'cell bg-grass-f', 'cell bg-grass-nw', 'cell bg-grass-w', 'cell bg-grass-n', 'cell bg-grass-ne', 'cell bg-grass-s','cell bg-grass-se','cell bg-grass-sw','cell bg-grass-e', 'cell bg-grass-fl-1','cell bg-grass-fl-2','cell bg-grass-fl-3','cell bg-grass-fl-4']; 
     return Maria.arrayContains(playable, cellclass);
  }
  
  function isPushable(cellclass) {
    var pushable = ['cell bg-block']; 
    return Maria.arrayContains(pushable, cellclass);
  }
  
 
  function isOpen(cellclass) {
    var  opendoor = ['cell bg-door', 'cell bg-wood-door'];
    return Maria.arrayContains(opendoor, cellclass);
  }
  
  function isChest(cellclass) {
    var  chest = ['cell bg-chest', 'cell bg-chest-2'];
    return Maria.arrayContains(chest, cellclass);
  }
 
   function isExit(cellid) {
    var  ids = ['block-400', 'block-375', 'block-425'];
    return Maria.arrayContains(ids, cellid);
  }    
  
  /*
   * 
   * "Target": The css sprite Baddie moving around on the map
   * 
   */

function Target(cellstart, width, height) {
  this.width = width;
  this.height = height;
  this.change = 0;
  this.next;
  this.cellid = cellstart;
  this.start = document.getElementById('block-'+this.cellid);
  this.target = document.createElement('div');
  this.target.id = "b1";
  this.target.className = "baddie down";
  this.target.style.left = (this.start.offsetLeft) + 'px';
  this.target.style.top = (this.start.offsetTop) + 'px';
  this.start.appendChild(this.target);
  this.move = true;

  
}

Target.prototype = {
  
    // Move the baddie
  moveIt: function() {

    this.start.appendChild(this.target);
    this.target.style.left = (this.start.offsetLeft) + 'px';
    this.target.style.top = (this.start.offsetTop) + 'px';
  },
  
  tryMove: function(direction, stats) {
     switch (direction) {
     case 'up':
	this.start = document.getElementById('block-'+(this.cellid-this.width));
          this.change = - this.width;
          break;
      case 'down':
	this.start = document.getElementById('block-'+(this.cellid+this.width));
        this.change = this.width;
        break;
    case 'left': 
      this.start = document.getElementById('block-'+(this.cellid-1));
      
      this.change = -1;
      break;
    case 'right': 
      this.start = document.getElementById('block-'+(this.cellid+1));
      this.change = 1;
      break;
    default:
      this.change = 0;
      break;          
      }
      
  if (isPlayable(this.start.className)) {
         this.cellid += this.change;
        this.moveIt(); 
  }
  else if (isPushable(this.start.className)) {
        this.next = document.getElementById('block-'+(this.cellid+this.change+this.change));
        if (isPlayable(this.next.className)) {
        this.start.className = "cell bg-grass";
        this.next.className = "cell bg-block";
        this.cellid += this.change; 
	
        playAudio('push');
        this.moveIt();
	
	//console.log("Moved block");
         }
  }

  
  else if (isChest(this.start.className)) {
    
    var chest = this.start.className;
    
    // If it's the first chest....
    
    if (chest === "cell bg-chest" || chest === "cell bg-chest-2") {
      stats.inMenu = "openChest";
      stats.currentChest = chest;
      var hasKeyChest1 = stats.checkInventory("key-metal");
      var hasKeyChest2 = stats.checkInventory("key-copper");
      if (!hasKeyChest1 && !hasKeyChest2) {
	stats.msg = 'It\'s a chest! But it\'s locked and you don\'t have a key! :(';
      popUp('popup', stats.msg, 220, 64, 600, 100);
      stats.inMenu = "message-over";
      }
      else {
      	  stats.msg = "It\'s a chest! Press SPACE to try opening it.";
	  popUp('popup', stats.msg, 220, 64, 600, 100);
      	  console.log('It\'s a chest! Press SPACE to try opening it.');

      }
    }
  }
  
  else if (isOpen(this.start.className)) {
    this.cellid += this.change;
    this.moveIt();
    //console.log(this.target);
    document.getElementById("area").style.display = "none";
    document.getElementById("tutorial").style.display = "initial";
    this.move = false;
    
    if (this.start.className === "cell bg-door") { 
      var baddie = document.getElementById('b1');
      baddie.parentNode.removeChild(baddie);
      Game.startGame();
      Game.init(2, stats);
      Game.gameLoop();
    };
    
    if (this.start.className === "cell bg-wood-door") { 
      var baddie = document.getElementById('b1');
      baddie.parentNode.removeChild(baddie);
      Game.init(1, stats);
      Game.gameLoop();
    };
  }
  
   else if (isExit(this.start.id)) {
    
    //console.log(this.target);
    this.move = false;

      var baddie = document.getElementById('b1');
      baddie.parentNode.removeChild(baddie);
    };
    
  }
  
} //target


/*
 * The map shown between levels
 * 
 */

window.BoardGame = (function(){
   
  var init = function(fromLevel, newstats) {
  var i, a, board = [], walls = [], cell, offset, start, width, height, target, cellid, next, moveIt = true, tryMove, 
  door = document.getElementsByClassName('cell bg-door'), 
  text = '', 
  message = document.getElementById('message');
  
  var canvas = document.getElementById('tutorial');
  var ct = canvas.getContext('2d');
 
  width = 25;
  height = 20;
  
    board.draw = function () {
    for (a=0; a<(width*height); a+=1) {
    cell = document.getElementById('block-'+a);
    cell.className = "cell bg-" + board[a]; 
      }

    console.log('Drawing table.');
  };
  
  
  board.assignValueToIndex = function(val, nums) {
    for (i=0; i<nums.length; i+=1) {
    this[nums[i]] = val;    
    }
  };
  
  board.fillSequence = function(val, offset, arrlength) {
    var b;
    for (b = offset; b < (arrlength+offset); b+=1) {
      this[b] = val;
    }
  }
  
  
  board.makeColumn = function(val, offset, numcols, numrows) {
    var b;
    for (b = 1; b <= numrows; b+=1) {
      board.assignValueToIndex(val, [offset]);
      offset += numcols;
    }
  }
  
  board.makeColumnEverySecond = function(val, offset, numcols, numrows) {
    var b;
    for (b = 1; b <= numrows; b+=1) {
      board.assignValueToIndex(val, [offset]);
      offset += numcols*2;
    }

  }
  
    board.makeRow = function(val, offset, length) {
      board.fillSequence(val, offset, length);
  }
  board.makeRowEverySecond = function(val, offset, length) {
    var b;
    for (b = length; b >= 0; b-=2) {
      board.assignValueToIndex(val, [offset]);
      offset += 2;
    }
  }
  
  
  board.length = width*height;
  
  //background
  board.fillSequence('grass', 0, width*height);
  
  //top border
  board.makeRowEverySecond('tree-ne', 1, 24);
  board.makeRowEverySecond('tree-nw', 2, 23);
  
  //bottom border
  board.makeRowEverySecond('tree-sw', (width*(height-1)), width);
  board.makeRowEverySecond('tree-se', (width*(height-1)+1), width-2);
  
  //left border
  board.makeColumnEverySecond('tree-nw', 0, width, height);
  board.makeColumnEverySecond('tree-sw', 25, width, height);
  
  //right border
  board.makeColumnEverySecond('tree-nw', (width-1), width, height);
  board.makeColumnEverySecond('tree-sw', (width-1+width), width, height);

  
  board.assignValueToIndex('grass', [478,479,480]);
  board.assignValueToIndex('grass-fl-1', [154,207]);
  board.assignValueToIndex('grass-fl-2', [77,292]);
  board.assignValueToIndex('grass-fl-4', [221]);
  board.assignValueToIndex('grass-fl-4', [278]);
  
  board.makeRow('brick', 328, 5);
  board.makeRow('brick', 353, 5);
  board.assignValueToIndex('wood-door', [355]);
  
  board.assignValueToIndex('chest', [48]);
  board.assignValueToIndex('chest-2', [27]);
  board.assignValueToIndex('block', [70,71,73,83,91,93,95,109,111,112,114,118,121,122,123,135,139,141,159, 161, 162,163,164,165,184,186,189,210,212,217,234,236,238,239,241,265,289]);
  board.assignValueToIndex('tree', [26,143,144,167,168,169,193]);
  
  board.makeColumnEverySecond('tree-ne', 151, width, 13);
  board.makeColumnEverySecond('tree-se', 176, width, 11);
  board.makeColumn('tree', 177, width, 9);
  
  
  board.makeColumnEverySecond('tree-ne', 333, width, 6);
  board.makeColumnEverySecond('tree-se', 333+25, width, 4);
  board.makeColumnEverySecond('tree-ne', 309, width, 7);
  board.makeColumnEverySecond('tree-se', 309+25, width, 5);
  board.makeColumnEverySecond('tree-se', 310, width, 5);
  board.makeColumnEverySecond('tree-ne', 310+25, width, 3);
  board.makeColumnEverySecond('tree-nw', 286, width, 6);
  board.makeColumnEverySecond('tree-sw', 286+25, width, 4);
  board.makeColumnEverySecond('tree-ne', 287, width, 6);
  board.makeColumnEverySecond('tree-se', 287+25, width, 4);
  board.makeColumnEverySecond('tree-sw', 313, width, 4);
  board.makeColumnEverySecond('tree-se', 313+25, width, 4);
  board.makeColumnEverySecond('tree-se', 364, width, 3);
  board.makeColumnEverySecond('tree-sw', 364+25, width, 2);

  
  board.makeRowEverySecond('tree-se', 32, 13);
  board.makeRowEverySecond('tree-sw', 33, 13);
  board.makeRowEverySecond('tree-nw', 58, 11);
  board.makeRowEverySecond('tree-ne', 59, 9);
  
  board.assignValueToIndex('grasstree-se', [3,5,21,45,51,65,67,69,85, 87,89,101, 169,177, 177+50, 277,339, 377,441,377+50, 477]);
  board.assignValueToIndex('grasstree-ne', [76,126,144,152,202,252,262,288,302,314,364,390,402,416,452,466,492,494,496]);
  board.assignValueToIndex('grasstree-nw', [99,143,149,457,481,173,223,273,323,261,285,309,333,383,407,473,493,495,497]);
  board.assignValueToIndex('grasstree-sw', [4,6,22,32,58,66,68,74,124,168,84,86,88,198,248,298,358,432]);
  board.assignValueToIndex('tree-se', [26,352]);
  board.assignValueToIndex('tree-sw', [415,465]);
  board.assignValueToIndex('tree-nw', [440]);
  board.assignValueToIndex('tree-ne', [327]);
  board.assignValueToIndex('stump', [260,167,193,391]);
 
  
  board.makeColumn('wall', 348, width, 5);
  board.makeColumn('wall', 347, width, 5);
  board.makeColumn('wall', 346, width, 5);
  board.makeColumn('wall', 345, width, 5);
  board.makeColumn('wall', 344, width, 5);
  board.assignValueToIndex('door', [446]);
  
  
  
  if (fromLevel === 0) { 
    cellid = 480;  
    board.makeColumn('metal', 374, width, 3);
  }
  if (fromLevel === 1) {
    cellid = 305;
    board.makeColumn('metal', 374, width, 3);
  }
  if (fromLevel === 2) {
    cellid = 399;
    board.makeColumn('grass-f', 374, width, 3);
  }
  
    board.draw();
    
  if (newstats) {
    stats = newstats;
    stats.width = 768;
    stats.height = 640;
    stats.changeLevel(0);
   
    }
  else stats = new Stats(768, 640, 0);
  stats.drawForBoard();
  
  target = new Target(cellid, width, height);
 
    document.onkeydown = function(event) {
      
      if(stats.inMenu === "message-over" || stats.inMenu === "openChest" || stats.inMenu === "start") {
	closePopUp('popup');
	//console.log('closed popup');
      }
      
           
    if (target.move != false) {
    var key;
    key = event.keyCode || event.which;
    switch(key) {
      case 37:  // ascii value for arrow left 
        target.target.className='baddie left'; 
        
        target.tryMove('left', stats);   
	
        break;
      case 39:  // ascii value for arrow right 
        target.target.className='baddie right'; 
         
         target.tryMove('right', stats); 
        break;
      case 38:  // arrow up
        target.target.className='baddie up';
         
         target.tryMove('up', stats); 
        break;
      case 40:  // arrow down
        target.target.className='baddie down';
        
         target.tryMove('down', stats);
        break;
      default:
        target.target.className='baddie down';
        break;
    }    
    //console.log('Keypress: ' + event + ' key: ' + key + ' new pos: ' + target.target.offsetLeft + ', ' + target.target.offsetTop + ' Cell-id: '+ target.cellid);
    
    if (key === 32 && stats.inMenu === "openChest") {
	  
	  stats.msg = null;
	  console.log('SPACE');
	  stats.inMenu = "message-over";
	  //run key check
	  stats.openChest(stats.currentChest, ct);
	}
	
      }
     

      };
      if (fromLevel === 0) {
  stats.inMenu = "start";
  var message = "Welcome to Foxy's Quest! Your goal is to leave the forest.<br><br>You move around with the key arrows. Begin game by pressing any key.";
  popUp('popup', message, 220, 64, 600, 100);
  console.log('Current position: ' + target.target.offsetLeft + ', ' + target.target.offsetTop);
  console.log('Everything is ready.');
  	  }
  	  
   if (fromLevel === 2) {
     playAudio("ta-da");
      stats.inMenu = "end";
      var message = "CONGRATULATIONS!!!<br><br>You finished Foxy\'s Quest! Foxy can now leave the forest!<br><br>Your total score: "+stats.score+"<br><br>Play again? Press Ctrl+R";
       popUp('popup', message, 170, 64, 600, 200)
    }
   

  };
  
 return {
    'init': init
  }
})();

/**
 * Game, the Game
 */
window.Game = (function(){
  var canvas1, canvas, ct, player, lastGameTick, blocks, baddies, stats, gamearea, logs, coins, gems, fire, explosive, sweets, heart, fruits, areaElements, level, area, stoppedGame = false, stats, areaHouse, areaCastle;

  var init = function(newlevel, newstats) {
    
    level = newlevel;
    canvas1 = "tutorial";
    stoppedGame = false;
    canvas = document.getElementById(canvas1);
    ct = canvas.getContext('2d');
    width = canvas.width;
    height = canvas.height;
    removablepillars = createPillars([[width-32,96,10]], 'img/tiles/wall/dngn_metal_wall.png');
    explosive = createCollectables([[832,169]], "explosive", 'img/tiles/items/tnt.png');
    
    if (level === 1) {
    //game objects for level 1
    walls = createPillars([[0,0,20],[width-32,0,3],[width-32,200,15]],'img/tiles/platforms/brick-wall.png'),
    logs = createLogs(),
    sweets = createCollectables([[220,120],[220,156],[220,192],[220,228],[342, 300],[384, 280],[426,280],[468, 300],[420, 80]], "sweet", 'img/tiles/sweet/candy-green.png'), 
    fruits = createCollectables([[40,450],[40,414],[40,378],[40,342],[530,20],[570,20]], "fruit", 'img/tiles/sweet/cherry.png'),
    key1 = createCollectables([[40,180]], "key-metal", 'img/tiles/items/KeyMetal.png'),
    heart = createCollectables([[820,430]], "life", 'img/tiles/items/heart2.png'),
    areaHouse = [logs, walls, sweets, heart, fruits, key1];
    }
    
    if (level === 2) {
    // game objects for level 2
    pillars = createPillars([[352,-4,12],[200,396,2],[width-32,0,3],[width-32,416,7],[0,0,19]], 'img/tiles/wall/stone_brick1.png'),
    
    platforms = createPlatforms(),
    fire = createCollectables([[835,520]], "fire", 'img/tiles/items/fire.png'),
    
    gems = createCollectables([[410,180], [410,320]], "gem", 'img/tiles/items/emerald.png'),
    coins = createCollectables([[70,300],[70,335],[70,370],[310,450],[335,430], [370,430],[395,450],[590,450],[615,430],[650,430], [675,450],[420,50],[455,50],[490,50],[525,50],[560,50], [595,50],[630,50]], "coin", 'img/tiles/items/coin.png'),
    areaCastle = [platforms, pillars, removablepillars, coins, gems, fire, explosive];
    }
    
    // create gamearea at starting point
    //if (level > 0) {
    gamearea = new GameArea(ct, width, height, areaHouse),
    player = new Player(1, 32, 32, new Vector(0, -10));
    //}
    if (newstats) {
    stats = newstats;
    stats.msg = null;
    stats.width = width;
    stats.height = height;
    stats.changeLevel(level);
    stats.bricks = removablepillars;
    stats.explosives = explosive;
    }
    else stats = new Stats(width, height, 0, level, removablepillars, explosive);
    
  };
  

  var update = function(td) {
   
    //if (level > 0) {
    player.update(td, width, height);
    player.stayInArea(width, height, stats);
    //}
    level = stats.checkLevel();
    
    if (level === 1) {
    player.collideBBlock(logs, stats);
    sweets.forEach(collidewith, sweets);
    fruits.forEach(collidewith, fruits);
    key1.forEach(collidewith, key1);
    heart.forEach(collidewith, heart);
    
    }
    else if (level === 2) {
      player.collideBBlock(platforms, stats);
      coins.forEach(collidewith, coins);
      gems.forEach(collidewith, gems);
      fire.forEach(collidewith, fire);
      explosive.forEach(collidewith, explosive);
    }
    stats.update();
    stats.restart();
    
  };

  var render = function() {
    
    ct.clearRect(0,0,canvas.width,canvas.height);
    
    if (level === 1) {    
      area = areaHouse;
      
    }
    else if (level === 2) {
      area = areaCastle;
      
    }

    gamearea.ct = ct;
    gamearea.elements = area;
    gamearea.draw(ct);
    player.draw(ct); 
    stats.draw(ct);
    
  };

  function collidewith(item) {
    item.collideWith(player, this, stats); 
  };
  
  function drawmany(item) {
    item.draw(ct); 
  };

  var gameLoop = function() {
    
    if (!stoppedGame) {
    var now = Date.now();
    td = (now - (lastGameTick || now)) / 1000; // Timediff since last frame / gametick
    lastGameTick = now;
    requestAnimFrame(gameLoop);
    update(td);
    render();
    }
  };
  
  var stopGame = function() {
    stoppedGame = true;
    
  };
  
  var startGame = function() {
    stoppedGame = false;
    
  };

  return {
    'init': init,
    'gameLoop': gameLoop,
    'stopGame': stopGame,
    'startGame': startGame
  }
})();



// On ready
$(function(){
  'use strict';

  BoardGame.init(0);
  
  console.log('Ready to play.');  
});
