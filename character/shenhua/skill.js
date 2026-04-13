import { lib, game, ui, get, ai, _status } from "../../noname.js";

/** @type { importCharacterConfig['skill'] } */
const skills = {
	duanliu:{
			trigger:{
			player:"useCard2",
		},
		direct:true,
		filter:function(event,player){
			return event.targets.length>1;
		},
		content:function(){
			'step 0'
			player.chooseTarget(get.prompt('duanliu'),'为'+get.translation(trigger.card)+'减少一个目标',function(card,player,target){
				return _status.event.targets.contains(target)
			}).set('targets',trigger.targets).set('ai',function(target){
				var player=_status.event.player;
				return -get.effect(target,_status.event.getTrigger().card,player,player)
			});
			'step 1'
			if(result.bool){
				player.logSkill('duanliu',result.targets);
				trigger.targets.remove(result.targets[0]);
				result.targets[0].draw();
			}
		},
		"_priority":0,
	},
	xyywuji:{
		trigger:{
			player:"damageEnd",
		},
		direct:true,
		preHidden:true,
		content:function(){
			"step 0"
			var draw=player.getDamagedHp();
			player.chooseTarget(get.prompt('xyywuji'),'令一名其他角色翻面'+(draw>0?'并摸'+get.cnNumber(draw)+'张牌':''),function(card,player,target){
				return player!=target
			}).setHiddenSkill('xyywuji').set('ai',target=>{
				if(target.hasSkillTag('noturn')) return 0;
				if(target.hasSkill('beishu')) return 0;
				var player=_status.event.player;
				var current=_status.currentPhase;
				var dis=current?get.distance(current,target,'absolute'):1;
				var draw=player.getDamagedHp();
				var att=get.attitude(player,target);
				if(att==0) return target.hasJudge('lebu')?Math.random()/3:Math.sqrt(get.threaten(target))/5+Math.random()/2;
				if(att>0){
					if(target.isTurnedOver()) return att+draw;
					if(draw<4) return -1;
					if(current&&target.getSeatNum()>current.getSeatNum()) return att+draw/3;
					return 10*Math.sqrt(Math.max(0.01,get.threaten(target)))/(3.5-draw)+dis/(2*game.countPlayer());
				}
				else{
					if(target.isTurnedOver()) return att-draw;
					if(draw>=5) return -1;
					if(current&&target.getSeatNum()<=current.getSeatNum()) return -att+draw/3;
					return (4.25-draw)*10*Math.sqrt(Math.max(0.01,get.threaten(target)))+2*game.countPlayer()/dis;
				}
			});
			"step 1"
			if(result.bool){
				player.logSkill('xyywuji',result.targets);
				var draw=player.getDamagedHp();
				if(draw>0) result.targets[0].draw(draw);
				result.targets[0].turnOver();
			}
		},
		ai:{
			maixie:true,
			"maixie_hp":true,
			effect:{
				target:function(card,player,target){
		if(get.tag(card,'damage')){
			// if(player.hasSkillTag('jueqing',false,target)) return [1,-2];
			if(target.hp<=1) return;
			if(!target.hasFriend()) return;
			var hastarget=false;
			var turnfriend=false;
			var players=game.filterPlayer();
			for(var i=0;i<players.length;i++){
				if(get.attitude(target,players[i])<0&&!players[i].isTurnedOver()){
					hastarget=true;
				}
				if(get.attitude(target,players[i])>0&&players[i].isTurnedOver()){
					hastarget=true;
					turnfriend=true;
				}
			}
			if(get.attitude(player,target)>0&&!hastarget) return;
			if(turnfriend||target.hp==target.maxHp) return [0.5,1];
			if(target.hp>1) return [1,0.5];
		}
	},
			},
		},
		"_priority":0,
	},
	yhyluoyan:{
		trigger:{
			global:"phaseDiscardAfter",
		},
		filter:function(event,player){
			if(event.player==player||!event.player.isIn()) return false;
			var history=event.player.getHistory('useCard');
			for(var i=0;i<history.length;i++){
				if(!history[i].targets) continue;
				for(var j=0;j<history[i].targets.length;j++){
					if(history[i].targets[j]!=event.player) return false;
				}
			}
			return true;
		},
		check:function(event,player){
			return get.attitude(player,event.player)>0;
		},
		"prompt2":function(event,player){
			return '令'+get.translation(event.player)+'摸一张牌';
		},
		content:function(){
			trigger.player.draw();
		},
		"_priority":0,
	},
	jiangwen:{
		trigger:{
			player:"phaseJieshuBegin",
		},
		frequent:true,
		filter:function(event,player){
			return player.hp<player.maxHp;
		},
		content:function(){
			event.num=player.getDamagedHp();
			player.drawTo(player.maxHp);
		},
		ai:{
			effect:{
				target:function(card,player,target){
					if(get.tag(card,'recover')&&target.hp==target.maxHp-1) return [0,0];
					if(target.hasFriend()){
						if((get.tag(card,'damage')==1||get.tag(card,'loseHp'))&&target.hp==target.maxHp) return [0,1];
					}
				},
			},
			threaten:function(player,target){
				if(target.hp==1) return 3;
				if(target.hp==2) return 2;
				return 1.3;
			},
		},
		"_priority":0,
	},
	sizhai:{
		marktext:"宅",
		intro:{
			name:"宅",
			content:"当前有#个“宅”",
		},
		unique:true,
		trigger:{
			player:"damageBegin4",
		},
		forced:true,
		filter:function (event,player){
			return event.num>0;
		},
		content:function (){
			'step 0'
			trigger.cancel();
			'step 1'
			player.addMark('sizhai',trigger.num);
		},
		group:["sizhai_effect"],
		ai:{
			threaten:0.8,
		},
		"_priority":0,
	},
	"sizhai_effect":{
		trigger:{
			player:"phaseJieshuBegin",
		},
		forced:true,
		content:function(){
			if(player.storage.sizhai){
				var damn=player.storage.sizhai
				player.removeMark('sizhai',player.storage.sizhai);
				player.loseHp(damn);
			}
		},
		ai:{
			maixie:true,
		},
		"_priority":0,
	},
	haoji:{
		trigger:{
			source:"damageBegin1",
		},
		filter:function(event,player){
			return event.getParent().name=='sha'&&player.hasMark('sizhai')&&event.player.hasSex('male');
		},
		content:function(){
			'step 0'
			player.chooseControlList(get.prompt('haoji'),'移去一个“宅”标记','令此次伤害值+1',false).set('ai',function(event,player){
				if(get.attitude(player,event.player)>0||player.countMark('sizhai')>player.hp) return 0;
				// else if(get.attitude(player,event.player)<0&&event.player.isDamaged()) return 1;
				else return 1;
			});
			'step 1'
			if(result.index==0){
				player.removeMark('sizhai',1);
				event.finish();
			}
			else if(result.index==1){
				trigger.num++;
				event.finish();
			}
			else event.finish();
		},
		"_priority":0,
	},
	xuzhi:{
		enable:"phaseUse",
		usable:1,
		filterTarget:function(card,player,target){
			return player!=target;
		},
		filter:function(event,player){
			return player.countCards('h')>0;
		},
		filterCard:true,
		selectCard:-1,
		discard:false,
		lose:false,
		delay:false,
		content:function(){
			player.give(cards,target);
			target.addTempSkill('xuzhi2',{player:'phaseAfter'});
			target.storage.xuzhi2++;
			target.updateMarks('xuzhi2');
		},
		ai:{
			order:1,
			result:{
				target:function(player,target){
					if(target.hasSkillTag('nogain')) return 0;
					if(player.countCards('h')==player.countCards('h','du')) return -1;
					if(target.hasJudge('lebu')) return 0;
					if(get.attitude(player,target)>3){
						var basis=get.threaten(target);
						if(player==get.zhu(player)&&player.hp<=2&&player.countCards('h','shan')&&!game.hasPlayer(function(current){
							return get.attitude(current,player)>3&&current.countCards('h','tao')>0;
						})) return 0;
						if(target.countCards('h')+player.countCards('h')>target.hp+2) return basis*0.8;
						return basis;
					}
					return 0;
				},
			},
		},
		"_priority":0,
	},
	"xuzhi2":{
		charlotte:true,
		mark:true,
		intro:{
			content:"手牌上限+#，出杀次数+#",
		},
		init:function(player,skill){
			if(!player.storage[skill]) player.storage[skill]=0;
		},
		onremove:true,
		mod:{
			maxHandcard:function(player,num){
				return num+player.storage.xuzhi2;
			},
			cardUsable:function(card,player,num){
				if(card.name=='sha') return num+player.storage.xuzhi2;
			},
		},
		"_priority":0,
	},
	qiaotun:{
		trigger:{
			player:"damageEnd",
		},
		content:function(){
			'step 0'
			player.judge(function(card){
				return get.color(card)=='red'?1:-1;
			}).judge2=function(result){
				return result.bool;
			};
			'step 1'
			if(result.bool&&player.maxHp>player.hp){
				player.recover();
			}
			else{
				event.finish();
			}
		},
		ai:{
			effect:{
				player:function(card,player){
					if(card.color=='red') return [1,0];
					else return 0;
				},
			},
		},
		"_priority":0,
	},
	foxi:{
		unique:true,
		zhuSkill:true,
		group:"foxi2",
		"_priority":0,
	},
	"foxi2":{
		trigger:{
			global:"damageSource",
		},
		filter:function(event,player){
			if(!event.card) return false;
			if(event.card.name!='sha') return false;
			if(!event.source) return false;
			if(!event.source.isPhaseUsing()) return false;
			if(player.hasSkill('foxi3')) return false;
			if(player==event.source||!event.source||event.source.group!='wei') return false;
			// if(!game.hasPlayer(function(target){
			//     return player!=target&&target.hasZhuSkill('foxi',player);
			// })) return false;
			// for(var i=0;i<event.cards.length;i++){
			//     if(get.position(event.cards[i],true)=='o'){
			//         return true;
			//     }
			// }
			// return false;
			return player.hasZhuSkill('foxi',event.source);
		},
		direct:true,
		content:function(){
			'step 0'
			trigger.source.chooseBool('是否响应【佛系】，令'+get.translation(player)+'摸一张牌？').set('choice',get.attitude(trigger.source,player)>0);
			'step 1'
			if(result.bool){
				player.logSkill('foxi2');
				trigger.source.line(player,'green');
				player.draw();
				player.addTempSkill('foxi3');
			}
		},
		"_priority":0,
	},
	"foxi3":{
		charlotte:true,
		"_priority":0,
	},
	caiqi:{
		mark:true,
		locked:false,
		zhuanhuanji:true,
		marktext:"☯",
		intro:{
			content:function(storage,player,skill){
				var str=player.storage.caiqi?'出牌阶段开始时，你可以摸两张牌，然后弃置一张手牌。本阶段你第一次使用与弃置牌相同花色的手牌时，可以摸一张牌':'出牌阶段限一次，你可以摸一张牌，然后弃置两张手牌。本阶段你第一次使用与弃置牌相同花色的手牌时，可以摸一张牌';
				if(player.storage.caiqi1){
					str+='<br><li>当前花色：';
					str+=get.translation(player.storage.caiqi1);
				}
				return str;
			},
		},
		trigger:{
			player:"phaseUseBegin",
		},
		content:function(){
			'step 0'
			if(player.storage.caiqi==true){
				player.draw(2);
				player.chooseToDiscard('h',true);
			}
			else{
				player.draw();
				player.chooseToDiscard('h',2,true);
			}
			player.changeZhuanhuanji('caiqi')
			'step 1'
			if(result.bool){
				player.storage.caiqi1=[];
				for(var i=0;i<result.cards.length;i++){
					player.storage.caiqi1.add(get.suit(result.cards[i],player));
				}
				player.markSkill('caiqi');
				player.addTempSkill('caiqi1');
			}
		},
		ai:{
			result:{
				player:function(player){
					if(!player.storage.caiqi&&player.countCards('h')<3) return 0;
					return 1;
				},
			},
		},
		"_priority":0,
	},
	"caiqi1":{
		trigger:{
			player:"loseEnd",
		},
		locked:false,
		direct:true,
		filter:function(event,player){
			if(event.getParent().name!='useCard'||player!=_status.currentPhase) return false;
			var list=player.getStorage('caiqi1');
			for(var i of event.cards){
				if(list.includes(get.suit(i,player))) return true;
			}
			return false;
		},
		content:function(){
			for(var i of trigger.cards) player.storage.caiqi1.remove(get.suit(i,player));
			player.draw();
		},
		"_priority":0,
	},
	liushang:{
		trigger:{
			player:"useCardAfter",
		},
		filter:function(event,player){
			if(!player.isPhaseUsing()) return false;
			if(player.hasSkill('liushang2')) return false;
			return (event.card.name=='jiu'||get.type(event.card)=='trick')&&game.hasPlayer(function(current){
				return current!=player;
			});
		},
		direct:true,
		content:function(){
			'step 0'
			player.chooseTarget(get.prompt('liushang'),'你可以将'+get.translation(trigger.cards)+'交给一名其他角色',function(card,player,target){
				return player!=target;
			}).ai=function(target){
			return get.attitude(_status.event.player,target);
			};
			'step 1'
			if(!result.bool) event.finish();
			else{
				player.logSkill('liushang');
				var list=[];
				for(var i=0;i<trigger.cards.length;i++){
					if(get.position(trigger.cards[i],true)=='o'){
						list.push(trigger.cards[i]);
					}
				}
				result.targets[0].gain(list,'gain2').giver=player
				player.addTempSkill('liushang2')
			}
		},
		"_priority":0,
	},
	"liushang2":{
		charlotte:true,
		"_priority":0,
	},
	wylfangquan:{
		skillAnimation:true,
		animationColor:"thunder",
		trigger:{
			target:"taoBegin",
		},
		zhuSkill:true,
		filter:function(event,player){
			if(player.hp>0) return false;
			if(event.player==player) return false;
			if(!player.hasZhuSkill('wylfangquan')) return false;
			if(event.player.group!='qun') return false;
			return true;
		},
		content:function(){
			'step 0'
			player.chooseBool('是否发动【放权】，回复体力+1，然后'+get.translation(trigger.player)+'将开始一个额外的回合？').set('choice',get.attitude(player,trigger.player)>0);
			'step 1'
			if(result.bool){
				player.awakenSkill('wylfangquan');
				trigger.baseDamage++;
				// var tar=event.player;
				player.line(trigger.player,'fire');
				trigger.player.markSkillCharacter('wylfangquan',player,'放权','吴亚岚请假了，特派的临时数学课代表');
				trigger.player.insertPhase();
				trigger.player.addSkill('wylfangquan2');
			}

		},
		mark:true,
		unique:true,
		limited:true,
		"_priority":0,
		intro:{
			content:"limited",
		},
		init:(player, skill) => player.storage[skill] = false,
	},
	"wylfangquan2":{
		trigger:{
			player:["phaseAfter","phaseCancelled"],
		},
		forced:true,
		popup:false,
		audio:"ext:奆神再临:false",
		content:function(){
			player.unmarkSkill('wylfangquan');
			player.removeSkill('wylfangquan2');
		},
		"_priority":0,
	},
	junyi:{
		trigger:{
			player:"phaseDrawEnd",
		},
		direct:true,
		content:function(){
			"step 0"
			var list=['弃牌','摸牌','取消'];
			if(!player.countCards('he')) list.remove('弃牌');
			player.chooseControl(list,function(){
				var player=_status.event.player;
				if(list.includes('弃牌')){
					if(player.countCards('h')>3&&player.countCards('h','sha')>1){
						return '弃牌';
					}
					if(player.countCards('h','sha')>2){
						return '弃牌';
					}
				}
				if(!player.countCards('h','sha')||player.hp<2){
					return '摸牌';
				}
				return 'cancel2';
			}).set('prompt',get.prompt2('junyi'));
			"step 1"
			if(result.control=='弃牌'){
				player.chooseToDiscard(true,'he');
				player.addTempSkill('junyi2','phaseUseEnd');
				player.addTempSkill('junyi4');
				player.logSkill('junyi');
			}
			else if(result.control=='摸牌'){
				player.draw();
				player.addTempSkill('junyi3');
				player.logSkill('junyi');
			}
		},
		"_priority":0,
	},
	"junyi2":{
		mod:{
			cardUsable:function(card,player,num){
				if(card.name=='sha') return num+1;
			},
		},
		"_priority":0,
	},
	"junyi3":{
		mod:{
			maxHandcard:function(player,num){
				return num+2;
			},
			cardEnabled:function(card){
				if(card.name=='sha') return false;
			},
		},
		"_priority":0,
	},
	"junyi4":{
		charlotte:true,
		trigger:{
			player:"useCard2",
		},
		filter:function(event,player){
			var type=get.type(event.card);
			return type=='basic'||type=='trick';
		},
		direct:true,
		content:function(){
			'step 0'
			player.removeSkill('junyi4');
			var goon=false;
			var info=get.info(trigger.card);
			if(trigger.targets&&!info.multitarget){
				var players=game.filterPlayer();
				for(var i=0;i<players.length;i++){
					if(lib.filter.targetEnabled2(trigger.card,player,players[i])&&!trigger.targets.includes(players[i])){
						goon=true;break;
					}
				}
			}
			if(goon){
				player.chooseTarget('俊逸：是否额外指定一名'+get.translation(trigger.card)+'的目标？',function(card,player,target){
					var trigger=_status.event;
					if(trigger.targets.includes(target)) return false;
					return lib.filter.targetEnabled2(trigger.card,_status.event.player,target);
				}).set('ai',function(target){
					var trigger=_status.event.getTrigger();
					var player=_status.event.player;
					return get.effect(target,trigger.card,player,player);
				}).set('targets',trigger.targets).set('card',trigger.card);
			}
			else{
				if(!info.multitarget&&trigger.targets&&trigger.targets.length>1){
					event.finish();
				}
			}
			'step 1'
			if(result.bool){
				if(!event.isMine()) game.delayx();
				event.target=result.targets[0];
			}
			else{
				event.finish();
			}
			'step 2'
			if(event.target){
				player.logSkill('junyi4',event.target);
				trigger.targets.add(event.target);
			}
			event.finish();
		},
		"_priority":0,
	},
	touxue:{
		trigger:{
			player:"phaseBegin",
		},
		content:function(){
			'step 0'
			player.draw();
			'step 1'
			trigger.phaseList.splice(trigger.num,0,'phaseUse|touxue');
			player.addTempSkill('touxue2','phaseDrawBefore');
		},
		"_priority":0,
	},
	"touxue2":{
		trigger:{
			player:"phaseJudgeBefore",
		},
		forced:true,
		filter:function(event,player){
			var damage=player.getStat().damage;
			if(typeof damage=='number'&&damage>0) return true;
			return false;
		},
		content:function(){
			trigger.cancel();
			// player.logSkill('touxue2')
			game.log(player,'跳过了判定阶段')
		},
		"_priority":0,
	},
	ningmou:{
		enable:"phaseUse",
		usable:1,
		filterTarget:function(card,player,target){
			return player.canCompare(target);
		},
		filter:function(event,player){
			return player.countCards('h')>0;
		},
		content:function(){
			"step 0"
			player.chooseToCompare(target);
			"step 1"
			if(result.bool&&target.countCards('h')>0){
				player.discardPlayerCard(target,false,'h','visible');
				event.finish();
			}
			else if(!result.bool&&player.countCards('h')>0){
				player.chooseCard(true).ai=function(card){
					if(_status.event.getRand()<0.5) return Math.random();
					return get.value(card);
				};
			}
			else{
				event.finish();
			}
			'step 2'
			player.showCards(result.cards);
			event.finish();
		},
		ai:{
			order:8,
			result:{
				player:-1,
				target:function(player,target){
					var num=target.countCards('h');
					if(num==1) return -1;
					if(num==2) return -1.3;
					return -1.1;
				},
			},
			threaten:1.2,
		},
		"_priority":0,
	},
	guogai:{
		trigger:{
			player:"damageBegin4",
		},
		forced:true,
		filter:function (event,player){
			if(player.hasSkill('guogai2')) return false;
			return _status.currentPhase!=player;
		},
		content:function (){
			trigger.cancel();
			player.addTempSkill('guogai2',{player:'phaseBegin'});
		},
		"_priority":0,
	},
	"guogai2":{
		"_priority":0,
	},
	guaiqiao:{
		trigger:{
			source:"damageSource",
		},
		check:function(event,player){
			return get.attitude(player,event.player)<=0;
		},
		content:function(){
			"step 0"
			player.draw();
			var cards=Array.from(ui.ordering.childNodes);
			while(cards.length){
				cards.shift().discard();
			}
			"step 1"
			var evt=_status.event.getParent('phase');
			if(evt){
				game.resetSkills();
				_status.event=evt;
				_status.event.finish();
				_status.event.untrigger(true);
			}
		},
		ai:{
			jueqing:true,
		},
		"_priority":0,
	},
	tianle:{
		trigger:{
			global:["equipAfter","addJudgeAfter","loseAfter","gainAfter","loseAsyncAfter","addToExpansionAfter"],
		},
		direct:true,
		filter:function(event,player){
			return game.hasPlayer(function(current){
				if(current!=_status.currentPhase) return false;
				if(current==player) return false;
				if(current.hasSkill('tianle2')) return false;
				var evt=event.getl(current);
				return evt&&evt.hs&&evt.hs.length&&current.countCards('h')==0;
			});
		},
		content:function(){
			"step 0"
			event.list=game.filterPlayer(function(current){
				if(current!=_status.currentPhase) return false;
				if(current.hasSkill('tianle2')) return false;
				var evt=trigger.getl(current);
				return evt&&evt.hs&&evt.hs.length;
			}).sortBySeat(_status.currentPhase);
			"step 1"
			var target=event.list.shift();
			event.target=target;
			if(target.isIn()&&target.countCards('h')==0){
				player.chooseBool(get.prompt2('tianle',target)).set('ai',function(){
					return get.attitude(_status.event.player,_status.event.getParent().target)>0;
				});
			}
			else event.goto(3);
			"step 2"
			if(result.bool){
				player.logSkill(event.name,target);
				target.addTempSkill('tianle2');
				target.draw();
			}
			"step 3"
			if(event.list.length) event.goto(1);
		},
		ai:{
			threaten:1.2,
			expose:0.2,
			noh:true,
		},
		"_priority":0,
	},
	"tianle2":{
		"_priority":0,
	},
	hunmeng:{
		trigger:{
			player:"phaseUseBefore",
		},
		filter:function(event,player){
			return player.countCards('he')>0;
		},
		direct:true,
		content:function(){
			"step 0"
			var check,str='弃置一张牌并跳过出牌阶段，本回合手牌上限+2，并可以移动场上的一张牌';
			if(!player.canMoveCard(true)){
				check=false;
			}
			else{
				check=game.hasPlayer(function(current){
					return get.attitude(player,current)>0&&current.countCards('j');
				});
				if(!check){
					if(player.countCards('h')>player.hp+1){
						check=false;
					}
					else if(player.countCards('h',{name:'wuzhong'})){
						check=false;
					}
					else{
						check=true;
					}
				}
			}
			player.chooseToDiscard(get.prompt('hunmeng'),str,lib.filter.cardDiscardable).set('ai',card=>{
				if(!_status.event.check) return -1;
				return 7-get.value(card);
			}).set('check',check).set('logSkill','hunmeng').setHiddenSkill('hunmeng');
			"step 1"
			if(result.bool){
				trigger.cancel();
				game.log(player,'跳过了出牌阶段');
				if(player.canMoveCard()) player.moveCard();
				player.addTempSkill("hunmeng2");
				event.finish();
			}
			else event.finish();
		},
		ai:{
			threaten:1.8,
		},
		"_priority":0,
	},
	"hunmeng2":{
		mod:{
			maxHandcard:function(player,num){
				return num+2;
			},
		},
		"_priority":0,
	},
	jiepi:{
		trigger:{
			player:["loseAfter","damageEnd"],
			global:"loseAsyncAfter",
		},
		forced:true,
		filter:function(event,player){
			if(_status.currentPhase==player) return false;
			if(event.name=='damage') return true;
			return event.type=='discard'&&event.getl(player).cards2.length>0;
		},
		content:function(){
			player.addTempSkill('jiepi2',['phaseAfter','phaseBefore']);
		},
		"_priority":0,
	},
	"jiepi2":{
		trigger:{
			target:"useCardToBefore",
		},
		forced:true,
		charlotte:true,
		priority:15,
		filter:function(event,player){
			return get.type(event.card)=='trick'||event.card.name=='sha';
		},
		content:function(){
			game.log(player,'触发了洁癖，',trigger.card,'对',trigger.target,'失效')
			trigger.cancel();
		},
		mark:true,
		intro:{
			content:"杀或普通锦囊牌对你无效",
		},
		ai:{
			effect:{
				target:function(card,player,target,current){
					if(get.type(card)=='trick'||card.name=='sha') return 'zeroplayertarget';
				},
			},
		},
		"_priority":1500,
	},
	ykhmengjin:{
		shaRelated:true,
		trigger:{
			player:"useCardToTargeted",
		},
		logTarget:"target",
		locked:false,
		check:function(event,player){
			return get.attitude(player,event.target)<=0;
		},
		filter:function(event,player){
			if(event.card.name!='sha') return false;
			if(event.target.countCards('h')<player.countCards('h')) return true;
			if(event.target.hp>player.hp) return true;
			return false;
		},
		content:function(){
			if(trigger.target.countCards('h')<player.countCards('h')) trigger.getParent().directHit.push(trigger.target);
			if(trigger.target.hp>player.hp){
				var id=trigger.target.playerid;
				var map=trigger.getParent().customArgs;
				if(!map[id]) map[id]={};
				if(typeof map[id].extraDamage!='number'){
					map[id].extraDamage=0;
				}
				map[id].extraDamage++;
			}
		},
		ai:{
			"directHit_ai":true,
			skillTagFilter:function(player,tag,arg){
				if(get.attitude(player,arg.target)<=0&&arg.card.name=='sha'&&player.countCards('h',function(card){
					return card!=arg.card&&(!arg.card.cards||!arg.card.cards.contains(card));
				})>=arg.target.countCards('h')) return true;
				return false;
			},
		},
		"_priority":0,
	},
	daiqiu:{
		mod:{
			globalFrom:function(from,to,distance){
				return distance-1;
			},
		},
		"_priority":0,
	},
	zmyliandui:{
		group:["zmyliandui_1","zmyliandui_2"],
		locked:true,
		subSkill:{
			"1":{
				trigger:{
					source:"damageBefore",
				},
				forced:true,
				check:function(){return false;},
				content:function(){
					trigger.cancel();
					trigger.player.loseHp(trigger.num);
				},
				sub:true,
				"_priority":0,
			},
			"2":{
				trigger:{
					global:"dieAfter",
				},
				forced:true,
				filter:function(event,player){
					if(_status.currentPhase==player) return true;
					// return game.hasPlayer2(function(current){
					//     return current==_status.currentPhase;
					// });
					return event.player==_status.currentPhase;
				},
				content:function(){
					player.draw(2);
				},
				sub:true,
				"_priority":0,
			},
		},
		ai:{
			jueqing:true,
		},
		"_priority":0,
	},
	kuangre:{
		trigger:{
			global:"phaseUseBegin",
		},
		filter:function(event,player){
			return event.player.isIn()&&player.countCards('h')>0;
		},
		direct:true,
		content:function(){
			"step 0"
			var nono=(Math.abs(get.attitude(player,trigger.player))<3);
			if(player==trigger.player||get.damageEffect(trigger.player,player,player)<=0){
				nono=true
			}
			else if(trigger.player.hp>2){
				nono=true;
			}
			else if(trigger.player.hp>1&&player.countCards('h')<3&&(trigger.player.canUse('sha',player)&&!player.countCards('h','shan')&&trigger.player.countCards('h')>=3)){
				nono=true;
			}
			var next=player.chooseToDiscard(get.prompt2('kuangre',trigger.player));
			next.set('ai',function(card){
				if(_status.event.nono) return -1;
				return 7-get.useful(card);
			});
			next.set('logSkill',['kuangre',trigger.player]);
			next.set('nono',nono);
			next.setHiddenSkill('kuangre');
			"step 1"
			if(result.bool){
				trigger.player.addTempSkill("kuangre2");
			}
			else{
				event.finish();
			}
			"step 2"
			if(result.bool&&trigger.player!=player) trigger.player.loseHp();
		},
		ai:{
			threaten:1.8,
			expose:0.3,
		},
		"_priority":0,
	},
	"kuangre2":{
		trigger:{
			player:"useCardToTargeted",
		},
		logTarget:"target",
		locked:true,
		filter:function(event,player){
			return event.card.name=='sha'&&!player.hasSkill('kuangre3');
		},
		forced:true,
		content:function(){
			var id=trigger.target.playerid;
			var map=trigger.getParent().customArgs;
			if(!map[id]) map[id]={};
			if(typeof map[id].extraDamage!='number'){
				map[id].extraDamage=0;
			}
			map[id].extraDamage++;
			player.addTempSkill('kuangre3');
		},
		"_priority":0,
	},
	"kuangre3":{
		"_priority":0,
	},
	boai:{
		trigger:{
			player:"useCard2",
		},
		filter:function(event,player){
			if(!player.isPhaseUsing()) return false;
			if(player.hasSkill('boai2')) return false;
			var type=get.type(event.card);
			if(!((type=='basic'||type=='trick')&&get.color(event.card)=='red')) return false;
			return game.hasPlayer(function(current){
				return !event.targets.includes(current);
			});
		},
		direct:true,
		content:function(){
			'step 0'
			// player.chooseTarget(get.prompt('boai'),'为'+get.translation(trigger.card)+'增加一个目标',function(card,player,target){
			//     return !_status.event.sourcex.includes(target)&&player.canUse(_status.event.card,target);
			// }).set('sourcex',trigger.targets).set('card',trigger.card).set('ai',function(target){
			//     var player=_status.event.player;
			//     return get.effect(target,_status.event.card,player,player);
			// });
			player.chooseTarget(get.prompt('boai'),'为'+get.translation(trigger.card)+'增加一个目标',function(card,player,target){
				var trigger=_status.event;
				if(trigger.targets.includes(target)) return false;
				return lib.filter.targetEnabled2(trigger.card,_status.event.player,target);
			}).set('ai',function(target){
				var trigger=_status.event.getTrigger();
				var player=_status.event.player;
				return get.effect(target,trigger.card,player,player);
			}).set('targets',trigger.targets).set('card',trigger.card);
			'step 1'
			if(result.bool){
				if(!event.isMine()&&!_status.connectMode) game.delayx();
				event.target=result.targets[0];
			}
			else{
				event.finish();
			}
			'step 2'
			player.addTempSkill('boai2');
			player.logSkill('boai',event.target);
			trigger.targets.push(event.target);
		},
		ai:{
			threaten:1.2,
		},
		"_priority":0,
	},
	"boai2":{
		charlotte:true,
		"_priority":0,
	},
	zhanan:{
		mod:{
			globalFrom:function(from,to,distance){
				return distance-game.countPlayer(function(current){
					return current.hasSex('female');
				});
			},
		},
		"_priority":0,
	},
	kemian:{
		enable:"phaseUse",
		usable:1,
		filterTarget:function (card,player,target){
			return player!=target&&target.countCards('h');
		},
		content:function(){
			"step 0"
			if(!target.countCards('h')){
				event.finish();
				return;
			}
			else target.chooseCard(true,'h').set('ai',function(card){
				return Math.max(1,20-get.value(card));
			}).set('prompt','请扣置一张手牌');
			"step 1"
			if(result.cards&&result.cards.length){
				// target.addToExpansion(result.cards,'giveAuto',target).gaintag.add('kemian');
				game.cardsGotoPile(result.cards,'insert');
			}
			else{
				event.finish();
			}
			"step 2"
			player.chooseControl('basic','trick','equip',function(){
				if(event.target.countCards('h')==0) return 'basic';
				if(event.target.countCards('h')>2) return 'trick';
				else return 'basic';
			}).set('prompt','猜测'+get.translation(target)+'扣置的牌');
			"step 3"
			var control=result.control;
			player.chat('我猜是'+get.translation(control)+'牌！');
			game.log(player,'猜测为','#y'+control);
			event.card=get.cards()[0];
			game.cardsGotoOrdering(event.card);
			target.showCards(event.card);
			if(get.type(event.card)==control){
				target.chat('你妈的，猜对了！');
				game.log(player,'猜测正确，获得这张牌');
				player.gain(event.card);
			}
			else{
				target.chat('煞笔，猜错了！');
				game.log(player,'猜测错误，弃掉这张牌');
				event.card.discard();
				event.getParent(3).skipped=true;
			}
			game.delay();
		},
		ai:{
			order:1,
			result:{
				player:0.5,
				target:-1,
			},
			threaten:1.8,
		},
		"_priority":0,
	},
	baogan:{
		trigger:{
			player:"phaseJieshuBegin",
		},
		direct:true,
		filter:function (event,player){
			return player.countCards('h')>0;
		},
		content:function(){
			"step 0"
			player.chooseTarget(get.prompt2('baogan'),function(card,player,target){
				return player.canCompare(target);
			}).set('ai',function(target){
				return -get.attitude(_status.event.player,target)/target.countCards('h');
			});
			"step 1"
			if(result.bool){
				var target=result.targets[0];
				event.target=target;
				player.logSkill('baogan',result.targets[0]);
				player.chooseToCompare(result.targets[0]);
				// player.chooseToCompare(result.targets[0]).callback=lib.skill.baogan.callback;
			}
			else{
				event.finish();
			}
			"step 2"
			if(result.num1<=result.num2){
				player.chooseToDiscard('he','弃置一张牌，或摸一张牌').set('ai',function(){return -1;});
				player.storage.baogan1 = result.num1;
				player.storage.baogan2 = result.num2;
			}
			else{
				player.storage.baogan1 = result.num1;
				player.storage.baogan2 = result.num2;
				event.goto(4);
			} 
			'step 3'
			if(!result.bool){
				player.draw();
			}
			'step 4'
			if(player.storage.baogan1>=player.storage.baogan2){
				target.chooseToDiscard('he','弃置一张牌，或令'+get.translation(player)+'摸一张牌').set('ai',function(card){
					if(_status.event.goon) return 6-get.value(card);
					return 0;
				}).set('goon',get.attitude(target,player)<0);

			}
			else event.goto(6);
			'step 5'
			if(!result.bool) player.draw();
			"step 6"
			if(Math.abs(player.storage.baogan1-player.storage.baogan2)<2){
				var targets=game.filterPlayer(target=>target!=player);
				event.targets=targets;
			}
			else event.finish();
			"step 7"
			var tar=targets.shift();
			tar.turnOver()
			if(targets.length) event.redo();
		},
		ai:{
			expose:0.4,
		},
		"_priority":0,
	},
	goushu:{
		trigger:{
			player:"phaseDiscardBegin",
		},
		limited:true,
		filter:function(event,player){
			return !event.numFixed&&player.countCards('h')>0;
		},
		skillAnimation:true,
		animationColor:"gray",
		check:function(event,player){
			if(player.countCards('h')>3||player.hp==player.maxHp){
				return false;
			}
			if(player.countCards('h',{name:'tao'})&&player.hp<player.maxHp){
				return false;
			}
			return true;
		},
		content:function(){
			"step 0"
			player.awakenSkill('goushu');
			player.addTempSkill('goushu2');              
			var car=player.getCards('h');
			player.discard(car);
			event.cards=get.cards(4+car.length);
			event.gains=[]
			event.discards=[]
			var content=['牌堆顶的'+event.cards.length+'张牌',event.cards];
			game.log(player,'观看了','#y牌堆顶的'+event.cards.length+'张牌');
			player.chooseControl('ok').set('dialog',content);
			"step 1"
			if(get.type(event.cards[0])!="basic"){
				event.gains.push(event.cards[0]);
				event.cards.remove(event.cards[0]);
			}
			else{
				var bool=game.hasPlayer(function(current){
					return player.canUse(event.cards[0],current);
				});
				if(bool){
					player.chooseUseTarget(event.cards[0],true,false);
				}
				else event.discards.push(event.cards[0]);
				event.cards.remove(event.cards[0]);
			}
			"step 2"
			if(event.cards.length) event.goto(1);
			else{
				if(event.gains.length) player.gain(event.gains,'gain2');
				if(event.discards.length){
					player.$throw(event.discards);
					game.cardsDiscard(event.discards);
				}
			}
		},
		mark:true,
		intro:{
			content:"limited",
		},
		init:(player, skill) => player.storage[skill] = false,
		"_priority":0,
	},
	"goushu2":{
		charlotte:true,
		onremove:true,
		mod:{
			maxHandcard:function(player,num){
				return num+100;
			},
		},
		"_priority":0,
	},
	hongwu:{
		trigger:{
			global:"phaseZhunbeiBegin",
		},
		filter:function(event,player){
			return player!=event.player&&(player.hp>=event.player.hp||player.countCards('h')>=event.player.countCards('h'))&&player.countCards('he')>0;
		},
		direct:true,
		content:function(){
			"step 0"
			var laj=get.attitude(player,trigger.player)>0;
			if(get.effect(trigger.player,{name:'sha'},player)<=0||get.effect(trigger.player,{name:'huogong'},player)<=0){
				laj=true;
			}
			var next=player.chooseCard("he",get.prompt2('hongwu',trigger.player));
			next.set('ai',function(card){
				if(_status.event.laj) return -1;
				return 7-get.useful(card);
			});
			next.set('logSkill',['hongwu',trigger.player]);
			next.set('laj',laj);
			"step 1"
			if(result.bool){
				player.give(result.cards,trigger.player,'give');
				player.storage.c1 = get.color(result.cards[0]);
			}
			else{
				event.finish();
			}
			"step 2"
			player.discardPlayerCard(trigger.player,'he',true);
			"step 3"
			if(result.bool){
				var c2 = get.color(result.cards[0]);
				if(c2==player.storage.c1){
					player.useCard({name:'sha',isCard:true},trigger.player,'hongwu');
				}
				else if(c2!=player.storage.c1&&player.canUse({name:'huogong'},trigger.player)){
					player.useCard({name:'huogong',isCard:true},trigger.player,'hongwu');
				}
				else{
					event.finish();
				}
			}
		},
		ai:{
			threaten:1.4,
			expose:0.5,
		},
		"_priority":0,
	},
	lajmingshi:{
		trigger:{
			player:"phaseJieshuBegin",
		},
		direct:true,
		filter:function(event,player){
			return game.hasPlayer(function(target){
				return target.countCards('h')>0&&target!=player;
			});
		},
		content:function(){
			'step 0'
			player.chooseTarget(get.prompt('lajmingshi'),'观看一名角色的手牌',function(card,player,target){
				return target!=player&&target.countCards('h')>0;
			}).set('ai',function(target){
				return -get.attitude(_status.event.player,target)*target.countCards('h');
			});
			'step 1'
			if(result.bool){
				player.logSkill('lajmingshi',result.targets[0]);
				player.viewHandcards(result.targets[0]);
				var cards=result.targets[0].getCards('h');
				var card=get.cardPile(function(card){
					return card.suit==get.suit(cards[0]);
				});
				if(card) player.gain(card,'gain2');
			}
		},
		ai:{
			effect:{
				player:1,
			},
		},
		"_priority":0,
	},
};

export default skills;
