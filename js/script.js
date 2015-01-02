(function( $ ){
			
	var methods = {
		
		init: function(obj){
		
			var objects,
			wrapper = $('<div class="wrapper"/>'),
			table = $('<table class="game-field"/>');
			
			//******* GLOBAL VARS *******
			
			map = obj;
			if(obj.next){
				nextStage = obj.next;
			}
			currentLevel = obj.level;
			
			//******* RENDER GAME FIELD *******
			wrapper.insertAfter('.clock');
			table.appendTo(wrapper);
			
			objects = {
				'#': 'wall',
				'p': 'player',
				'!': 'lava',
				'm': 'money',
				'f': 'finish',
				' ': 'space'
			};
			
			for(var i = 0; i < currentLevel.length; i++){
			
				$('<tr/>', {
					'class': 'y-' + (i+1)
				}).appendTo(table);
				
				currentLevel[i].split('');
				
				for(var j = 0; j < currentLevel[i].length; j++){
					
					$('<td/>', {
						'class': 'x-' + (j+1) + ' ' + objects[ currentLevel[i][j] ]
					}).appendTo(table.find('tr:last-child'));
				}
			}
			
			this.runner( '_addBgWrap', {'btnText': 'START', 'btnEvent': 'start', 'timeOut': 0} );
			
			$(document).on('keydown', function(event){
				if(event.keyCode == '13'){
					$('.start-btn').trigger('click');
				}
			});
		},
		
		start: function(){
			
			var self = this,
			notify,
			timer,
			sec = map.time.sec,
			min = map.time.min,
			time,
			sounds;
			
			$('.level-end-wrap').detach();
			
			//********** TIMER **********
				
			timer = {
				'start': function(){
					if(min < 10){
						self.find('.minutes').html('0' + min);
					}
					else{
						self.find('.minutes').html(min);
					}
					
					if(sec < 10){
						self.find('.seconds').html('0' + sec);
					}
					else{
						self.find('.seconds').html(sec);
					}
					
					time = setTimeout(function clock(){
					
						sec--;
						
						if(sec < 10){
							self.find('.seconds').html('0' + sec);
						}
						else{
							self.find('.seconds').html(sec);
						}
						if(min < 10){
						self.find('.minutes').html('0' + min);
						}
						else{
							self.find('.minutes').html(min);
						}
						
						if(sec == 0){;
							if(min == 0){
								self.find('.clock').addClass('time-is-up');
								clearTimeout(time);
								$(document).off('keydown.move');
								notify.timeIsUp();
								self.runner( '_addBgWrap', {'cls': 'level-end-btn', 'btnText': 'Restart', 'btnEvent': 'restart', 'timeOut': 2000} );
							}
							else{
								sec = 60;
								min--;
								time = setTimeout(clock, 1000);
							}
						}
						else{
							time = setTimeout(clock, 1000);
						}
					}, 1000);
				},
				'stop': function(){
						clearTimeout(time);
				}
			};
			
			timer.start();
			
			//************* MOVE **********
			
			function step(x, y){
				var x = '.x-' + x;
				var y = '.y-' + y;
				var nextStepY = $(y);
				var nextCell = nextStepY.find(x);
				
				switch( $(nextCell).attr('class').split(' ')[1] ){
					case 'wall': 
						return false;
					break;
					
					case 'lava': 
						$(self).find('.player').removeClass('player').addClass('space');
						nextCell.removeClass('space').addClass('lava-burn');
						timer.stop();
						$(document).off('keydown.move');
						notify.lava();
						self.runner( '_addBgWrap', {'cls': 'level-end-lava-btn', 'btnText': 'Restart', 'btnEvent': 'restart', 'timeOut': 2000} );
					break;
					
					case 'money': 
						$(self).find('.player').removeClass('player').addClass('space');
						nextCell.removeClass('money').addClass('player');
						notify.money();
						if( !($('.game-field .money').length) ){
							$('.game-field').find('.finish').removeClass('finish').addClass('finish-open');
						}
					break;
					
					case 'space': 
						$(self).find('.player').removeClass('player').addClass('space');
						nextCell.removeClass('space').addClass('player');
					break
					
					case 'finish': 
						notify.finish();
						return false;
					break;
					
					case 'finish-open': 
						var player = $(self).find('.player').removeClass('player').addClass('space');
						nextCell.removeClass('space').addClass('finish-win');
						timer.stop();
						$(document).off('keydown.move');
						
						if(map.next){
							notify.finishOpen();
							self.runner( '_addBgWrap', {'cls': 'level-end-btn', 'btnText': 'Next', 'btnEvent': 'next', 'timeOut': 2000} );
						}
						else{
							notify.finishOpenLast();
							self.runner( '_addBgWrap', {'cls': 'level-end-btn', 'btnText': 'Next', 'btnEvent': 'next', 'timeOut': 2000, 'last': true} );
						}
					break;
				}
			}
			
			function isPossible(x, y){
				if(y > 0 && x > 0 && y <= currentLevel.length && x <= currentLevel[0].length){
					return true;
				}
				else{
					return false;
				}
			}
			
			function checkIsPossible(func){
				function wrapper(x, y){
					if(isPossible(x, y)){
						return func.call(this, x, y);
					}
				}
				return wrapper;
			}
			
			step = checkIsPossible(step);
			
			move = {
				'up': function(){
					var coords = this.getCoords();
					step(coords.x, coords.y - 1);
				},
				'down': function(){
					var coords = this.getCoords();
					step(coords.x, coords.y + 1);
				},
				'left': function(){
					var coords = this.getCoords();
					step(coords.x - 1, coords.y);
				},
				'right': function(){
					var coords = this.getCoords();
					step(coords.x + 1, coords.y);
				},
				'getCoords': function(){
					var player = $(self).find('.player');
					var reg = /x-\d+/;
					var x = +player.prop('class').match(reg)[0].split('-')[1];
					var y = +player.parent().prop('class').split('-')[1];
					
					return {
						'x': x,
						'y': y
					}
				}
			}
			
			//********** NOTIFY ************
			
			notify = {
				'money': function(){
					this.showNotify('Coin!', 'n-money');
				},
				'lava': function(){
					this.showNotify('You burned in lava', 'n-lava');
				},
				'finish': function(){
					this.showNotify('You need more coins', 'n-finish');
				},
				'finishOpen': function(){
					this.showNotify('Level completed', 'n-finish-open');
				},
				'finishOpenLast': function(){
					this.showNotify('YOU WIN', 'n-finish-open-last');
				},
				'timeIsUp': function(){
					this.showNotify('Time is up', 'n-time-is-up');
				},
				'showNotify': function(text, type){
					var notify = $('<div/>', {
						'class': 'notify ' + type
					});
					
					notify.html(text);
					notify.appendTo('.wrapper').fadeIn('fast');
					setTimeout(function(){
						notify.fadeOut('fast', function(){
							notify.remove();
						});
					}, 1500);
				}
			};
			
			$(document).on('keydown.move', function(event){
			
				if(event.keyCode == 38){
					event.preventDefault();
					move.up();
				}
				if(event.keyCode == 40){
					event.preventDefault();
					move.down();
				}
				if(event.keyCode == 37){
					move.left();
				}
				if(event.keyCode == 39){
					move.right();
				}
			});
		},
		
		restart: function(){
			
			$('.wrapper').remove();
			$(document).off('keydown');
			this.find('.clock').removeClass('time-is-up');
			this.runner(map);
		},
		
		next: function(){
			
			$('.wrapper').remove();
			$(document).off('keydown');
			this.find('.clock').removeClass('time-is-up');
			this.runner(nextStage);
		},
		
		_addBgWrap: function(options){
		
			var self = this;
			var def = {
				'cls': options.cls || ' ',
				'btnText': options.btnText || 'START',
				'btnEvent': options.btnEvent || 'start',
				'timeOut': options.timeOut || 0,
				'last': options.last || false
			};
			
			setTimeout(function(){
				var wrap = $('<div class="level-end-wrap"/>'),
				wrapWidth = $('.game-field').css('width'),
				wrapHeight = $('.game-field').css('height'),
				startBtn;
				wrap.appendTo('.wrapper');
				wrap.css({'width': wrapWidth,
							   'height': wrapHeight});
				
				if(!def.last){
					startBtn = $('<a/>',{
						text: def.btnText,
						'href': '#',
						'class': 'start-btn ' + def.cls
					}).appendTo(wrap);
					
					startBtn.on('click', function(){
						self.runner(def.btnEvent);
						return false;
					});
				}
				else{
					$('<h2/>', {
						text: 'Thank you for playing',
						'class': 'thank-you'
					}).appendTo(wrap);
				}
			}, def.timeOut);
		}
	}
	
	$.fn.runner = function(method){
		if ( methods[method] ) {
				return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
				return methods.init.apply( this, arguments );
		} else {
			  $.error( 'метод ' +  method + ' не существует в jQuery.runner' );
		}
	}
})(jQuery);