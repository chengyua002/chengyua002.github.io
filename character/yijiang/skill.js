import { lib, game, ui, get, ai, _status } from "../../noname.js";

/** @type { importCharacterConfig['skill'] } */
const skills = {
	ouhuang:{
		trigger:{
		global:"judge",
		},
		content:function(){
			"step 0"
			var card=get.cards()[0];
			event.card=card;
			game.cardsGotoOrdering(card).relatedEvent=trigger;
			"step 1"
			player.$throw(card);
			if(trigger.player.judging[0].clone){
				trigger.player.judging[0].clone.classList.remove('thrownhighlight');
				game.broadcast(function(card){
					if(card.clone){
						card.clone.classList.remove('thrownhighlight');
					}
				},trigger.player.judging[0]);
				game.addVideo('deletenode',player,get.cardsInfo([trigger.player.judging[0].clone]));
			}
			game.cardsDiscard(trigger.player.judging[0]);
			trigger.player.judging[0]=card;
			game.log(trigger.player,'的判定牌改为',card);
			game.delay(2);
		},
		ai:{
			rejudge:true,
			tag:{
				rejudge:1,
			},
		},
		"_priority":0,
	},
	beishu:{
		group:["beishu_1","beishu_2"],
		locked:true,
		subSkill:{
			"1":{
				mod:{
					canBeDiscarded:function(card){    //不可弃置宝物和防具
						if(get.position(card)=='e'&&['equip2','equip5'].contains(get.subtype(card))) return false;
					},
				},
				sub:true,
				"_priority":0,
			},
			"2":{
				trigger:{
					player:"turnOverBegin",
				},
				forced:true,
				filter:function(event,player){
					return !player.isTurnedOver();
				},
				content:function(){
					trigger.cancel();
				},
				sub:true,
				"_priority":0,
			},
		},
		ai:{
			noturn:true,
		},
		"_priority":0,
	},
	"wq_duanchang":{
		audio:"ext:三班杀1:2",
		forbid:["boss"],
		trigger:{
			player:"die",
		},
		forced:true,
		forceDie:true,
		skillAnimation:true,
		animationColor:"gray",
		filter:function(event){
			return event.source&&event.source.isIn();
		},
		content:function(){
			trigger.source.clearSkills();
		},
		logTarget:"source",
		ai:{
			threaten:function(player,target){
				if(target.hp==1) return 0.2;
				return 1.5;
			},
			effect:{
				target:function(card,player,target,current){
		if(!target.hasFriend()) return;
		if(target.hp<=1&&get.tag(card,'damage')) return [1,0,0,-2];
	},
			},
		},
		"_priority":0,
	},
	"wq_beige":{
		audio:"ext:三班杀1:2",
		trigger:{
			global:"damageEnd",
		},
		filter:function(event,player){
return (event.card&&event.card.name=='sha'&&event.source&&
	event.player.isIn()&&player.countCards('he'));
},
		direct:true,
		checkx:function(event,player){
var att1=get.attitude(player,event.player);
var att2=get.attitude(player,event.source);
return att1>0&&att2<=0;
},
		preHidden:true,
		content:function(){
"step 0"
var next=player.chooseToDiscard('he',get.prompt2('beige',trigger.player));
var check=lib.skill.beige.checkx(trigger,player);
next.set('ai',function(card){
	if(_status.event.goon) return 8-get.value(card);
	return 0;
});
next.set('logSkill','beige');
next.set('goon',check);
next.setHiddenSkill('beige');
"step 1"
if(result.bool){
	trigger.player.judge();
}
else{
	event.finish();
}
"step 2"
switch(result.suit){
	case 'heart':trigger.player.recover();break;
	case 'diamond':trigger.player.draw(2);break;
	case 'club':trigger.source.chooseToDiscard('he',2,true);break;
	case 'spade':trigger.source.turnOver();break;
}
},
		ai:{
			expose:0.3,
		},
		"_priority":0,
	},
	"cs_yingzi":{
		audio:"ext:三班杀1:2",
		trigger:{
			player:"phaseDrawBegin2",
		},
		frequent:true,
		filter:function(event,player){
			return !event.numFixed;
		},
		content:function(){
			trigger.num++;
		},
		ai:{
			threaten:1.3,
		},
		"_priority":0,
	},
	"cs_niuzhi":{
		audio:"ext:三班杀1:2",
		trigger:{
			player:"phaseJieshuBegin",
		},
		frequent:true,
		content:function(){
			player.draw();
		},
		"_priority":0,
	},
	"lyh_tanhua":{
		trigger:{
			source:"damageSource",
		},
		check:function(event,player){
			if(event.player.isTurnedOver()) return get.attitude(player,event.player)>0;
			if(event.player.hasSkill('beishu')) return get.attitude(player,event.player)>0;
			if(event.player.hp<3){
				return get.attitude(player,event.player)<0;
			}
			return get.attitude(player,event.player)>0;
		},
		filter:function(event){
			if(event._notrigger.contains(event.player)) return false;
			return event.card&&event.card.name=='sha'&&event.player.isIn()&&get.color(event.card)=='black';
		},
		logTarget:"player",
		content:function(){
			"step 0"
			trigger.player.draw(Math.min(5,trigger.player.hp));
			"step 1"
			trigger.player.turnOver();
		},
		"_priority":0,
	},
	yinwei:{
		skillAnimation:"epic",
		animationColor:"fire",
		enable:"phaseUse",
		filter:function(event,player){
			return !player.storage.yinwei;
		},
		filterTarget:function(card,player,target){
			return player!=target;
		},
		unique:true,
		limited:true,
		selectTarget:-1,
		multitarget:true,
		multiline:true,
		mark:true,
		line:"fire",
		content:function(){
			"step 0"
			player.storage.yinwei=true;
			player.awakenSkill('yinwei');
			event.num=1;
			event.targets=targets.slice(0);
			event.targets.sort(lib.sort.seat);
			"step 1"
			if(event.targets.length){
				var target=event.targets.shift();
				event.target=target;
				var res=get.damageEffect(target,player,target,'fire');
				target.chooseToDiscard('h','弃置至少'+get.cnNumber(event.num)+'张手牌或受到2点火焰伤害',[num,Infinity]).set('ai',function(card){
					if(ui.selected.cards.length>=_status.event.getParent().num) return -1;
					if(_status.event.player.hasSkillTag('nofire')) return -1;
					if(_status.event.res>=0) return 6-get.value(card);
					if(get.type(card)!='basic'){
						return 10-get.value(card);
					}
					return 8-get.value(card);
				}).set('res',res);
			}
			else{
				event.finish();
			}
			"step 2"
			if(!result.bool){
				event.target.damage(2,'fire');
				event.num=1;
			}
			else{
				event.num=result.cards.length+1;
			}
			event.goto(1);
		},
		ai:{
			order:1,
			result:{
				player:function(player){
					var num=0,eff=0,players=game.filterPlayer(function(current){
						return current!=player;
					}).sortBySeat(player);
					for(var target of players){
						if(get.damageEffect(target,player,target,'fire')>=0){num=0;continue}
						var shao=false;
						num++;
						if(target.countCards('h',function(card){
							if(get.type(card)!='basic'){
								return get.value(card)<10;
							}
							return get.value(card)<8;
						})<num) shao=true;
						if(shao){
							eff-=4*(get.realAttitude||get.attitude)(player,target);
							num=0;
						}
						else eff-=num*(get.realAttitude||get.attitude)(player,target)/4;
					}
					if(eff<4) return 0;
					return eff;
				},
			},
		},
		init:function(player){
			player.storage.yinwei=false;
		},
		intro:{
			content:"limited",
		},
		"_priority":0,
	},
	songge:{
		enable:"phaseUse",
		usable:1,
		position:"h",
		filterCard:{
			color:"red",
		},
		selectCard:2,
		selectTarget:[1,2],
		complexCard:true,
		filter:function(event,player){
			if(player.countCards('hs',{color:'red'})<2) return false;
			for(var i=0;i<game.players.length;i++){
				if(game.players[i].isDamaged()){
					return true;
				}
			}
			return false;
		},
		filterTarget(card,player,target){
			if(target.hp>=target.maxHp) return false;
			return true;
		},
		check:function(card){
			var player=_status.currentPhase;
			if(player.countCards('h')>player.hp) return 8-get.value(card);
			if(player.hp<player.maxHp) return 6-get.value(card);
			return 4-get.value(card);
		},
		content:function(){
			target.recover();
		},
		ai:{
			order:9,
			result:{
				target(player,target){
					if(target.hp==1) return 5;
					if(player==target&&player.countCards('h')>player.hp) return 5;
					return 2;
				},
			},
			threaten:2,
		},
		"_priority":0,
	},
	shuangwen:{
		enable:"phaseUse",
		usable:1,
		filter:function(event,player){
			return player.countCards('h',{type:'equip'})>0;
		},
		filterCard:function(card){
			return get.type(card)=='equip';
		},
		check:function(card){
			var player=_status.currentPhase;
			if(player.countCards('he',{subtype:get.subtype(card)})>1){
				return 11-get.equipValue(card);
			}
			return 6-get.value(card);
		},
		filterTarget:function(card,player,target){
			if(target.isMin()) return false;
			return player!=target&&target.canEquip(card);
		},
		content:function(){
			'step 0'
			target.equip(cards[0]);
			'step 1'
			if(game.hasPlayer(function(player){
					return player!=target&&target.inRange(player);
				})){
					player.chooseTarget('请选择一名该角色与其计算距离为1的角色，视为对其使用【杀】',1,function(card,player,target){
						var source=_status.event.source;
						return target!=source&&source.inRange(target);
					},true).set('ai',function(target){
						return get.damageEffect(target,_status.event.source,player);
					}).set('source',target);
				}
			else{
				event.finish();
			}
			'step 2'
			if(result.bool&&result.targets&&result.targets.length){
				target.line(result.targets[0],'green');
				target.useCard({name:'sha',isCard:true},result.targets[0],false);
			}
			
		},
		discard:false,
		lose:false,
		prepare:function(cards,player,targets){
			player.$give(cards,targets[0],false);
		},
		ai:{
			basic:{
				order:10,
			},
			result:{
				target:function(player,target){
					var card=ui.selected.cards[0];
					if(card) return get.effect(target,card,target,target);
					return 0;
				},
			},
			threaten:1.3,
		},
		"_priority":0,
	},
	shuike:{
		enable:"phaseUse",
		filter:function(event,player){
			var num;
			var mode=get.mode();
			if(mode=='identity'){
				if(_status.mode=='purple') num=player.getEnemies().length;
				else num=game.countPlayer(function(current){
					if(current.group=='qun') return 1;
				});
			}
			else if(mode=='versus'){
				if(!_status.mode||_status.mode!='two') num=player.getEnemies().length;
				else{
					var target=game.findPlayer(x=>{
						var num=x.getFriends().length;
						return !game.hasPlayer(y=>{
							return x!=y&&y.getFriends().length>num;
						});
					});
					num=(target?target.getFriends(true).length:1);
				}
			}
			else{
				num=1;
			}
			if((player.getStat().skill.shuike||0)>=num) return false;
			return true;
		},
		filterTarget:function(card,player,target){
			return target.countCards('e')>0;
		},
		content:function(){
			'step 0'
			target.draw();
			'step 1'
			var goon=get.damageEffect(target,player,target)>=0;
			if(!goon&&target.hp>=4&&get.attitude(player,target)<0){
				var es=target.getCards('e');
				for(var i=0;i<es.length;i++){
					if(get.equipValue(es[i],target)>=8){
						goon=true;break;
					}
				}
			}
			target.chooseControl(function(){
				if(_status.event.goon) return '选项二';
				return '选项一';
			}).set('goon',goon).set('prompt','水课').set('choiceList',['令'+get.translation(player)+'弃置你装备区里的一张牌','收回装备区内的所有牌并受到1点伤害']);
			'step 2'
			if(result.control=='选项一'){
				player.discardPlayerCard(target,true,'e');
				event.finish();
			}
			else{
				target.gain(target.getCards('e'),'gain2');
			}
			'step 3'
			game.delay(0.5);
			target.damage();
		},
		ai:{
			order:7,
			result:{
				target:function(player,target){
					if(get.damageEffect(target,player,target)>=0) return 2;
					var att=get.attitude(player,target);
					if(att==0) return 0;
					var es=target.getCards('e');
					if(att>0&&(target.countCards('h')>2||target.needsToDiscard(1))) return 0;
					if(es.length==1&&att>0) return 0;
					for(var i=0;i<es.length;i++){
						var val=get.equipValue(es[i],target);
						if(val<=4){
							if(att>0){
								return 1;
							}
						}
						else if(val>=7){
							if(att<0){
								return -1;
							}
						}
					}
					return 0;
				},
			},
		},
		"_priority":0,
	},
	caizui:{
		trigger:{
			player:"useCardToPlayer",
		},
		logTarget:"target",
		locked:false,
		check:function(event,player){
			return get.attitude(player,event.target)<=0;
		},
		"prompt2":function(event){
			return '令'+get.translation(event.card)+'不能被响应'
		},
		filter:function(event,player){
			if(event.targets.length>1||event.target.countCards('h')>player.countCards('h')) return false;
			var card=event.card;
			if(card.name=='sha') return true;
			if(get.type(card)=='trick') return true;
			return false;
		},
		content:function(){
			trigger.nowuxie=true;
			trigger.directHit.addArray(game.players);
		},
		"_priority":0,
	},
	spjaocai:{
		group:["spjaocai_1","spjaocai_2","spjaocai_3"],
		locked:true,
		ai:{
			effect:{
				target:function(card){
					if(card.name=='tiesuo') return 'zeroplayertarget';
				},
			},
		},
		subSkill:{
			"1":{
				trigger:{
					player:"linkBegin",
				},
				forced:true,
				filter:function(event,player){
					return !player.isLinked();
				},
				content:function(){
					trigger.cancel();
				},
				sub:true,
				"_priority":0,
			},
			"2":{
				mod:{
					targetEnabled:function(card,player,target){
						if(get.type(card)=='delay') return false;
					},
				},
				sub:true,
				"_priority":0,
			},
			"3":{
				ai:{
					noCompareTarget:true,
				},
				sub:true,
				"_priority":0,
			},
		},
		"_priority":0,
	},
	sijin:{
		trigger:{
			global:"die",
		},
		filter:function(event,player){
			return event.player.getStockSkills("太美丽啦三班","哎呀这不张以欣吗").filter(function(skill){
				var info=get.info(skill);
				return info&&!info.juexingji&&!info.hiddenSkill&&!info.zhuSkill&&!info.charlotte&&!info.dutySkill&&!(info.limited&&event.player.awakenedSkills.includes(info));
			}).length>0;
		},
		check:function(event,player){
			var list=event.player.getStockSkills('太美丽啦三班','哎呀这不张以欣吗').filter(function(skill){
				var info=get.info(skill);
				return info&&!info.juexingji&&!info.hiddenSkill&&!info.zhuSkill&&!info.charlotte&&!info.dutySkill&&!(info.limited&&event.player.awakenedSkills.includes(info));
			});
			if(list.length>1) return true;
			return false;
		},
		logTarget:"player",
		skillAnimation:true,
		limited:true,
		animationColor:"thunder",
		content:function(){
			'step 0'
			player.awakenSkill('sijin');
			var list=trigger.player.getStockSkills("太美丽啦三班","哎呀这不张以欣吗").filter(function(skill){
				var info=get.info(skill);
				return info&&!info.juexingji&&!info.hiddenSkill&&!info.zhuSkill&&!info.charlotte&&!info.dutySkill&&!(info.limited&&event.player.awakenedSkills.includes(info));
			});
			player.chat('获得'+list.length+'个技能')
			for(var i=0;i<list.length;i++){
				player.addSkillLog(list[i]);
			}
		},
		ai:{
			threaten:1.9,
		},
		"_priority":0,
		mark:true,
		intro:{
			content:"limited",
		},
		init:(player, skill) => player.storage[skill] = false,
	},
	pinjian:{
		enable:["chooseToUse","chooseToRespond"],
		hiddenCard:function(player,name){
			if(player!=_status.currentPhase&&get.type(name)=='basic'&&lib.inpile.includes(name)) return true;
		},
		filter:function(event,player){
			if(player.hasSkill('pinjian4')) return false;
			if(event.responded||player==_status.currentPhase||event.pinjian) return false;
			for(var i of lib.inpile){
				if(get.type(i)=='basic'&&event.filterCard({name:i},player,event)) return true;
			}
			return false;
		},
		delay:false,
		content:function(){
			'step 0'
			var evt=event.getParent(2);
			evt.set('pinjian',true);
			var cards=get.cards(2);
			for(var i=cards.length-1;i>=0;i--){
				ui.cardPile.insertBefore(cards[i].fix(),ui.cardPile.firstChild);
			}
			var aozhan=player.hasSkill('aozhan');
			player.chooseButton(['品鉴：选择要'+(evt.name=='chooseToUse'?'使用':'打出')+'的牌',cards]).set('filterButton',function(button){
				return _status.event.cards.includes(button.link);
			}).set('cards',cards.filter(function(card){
				if(aozhan&&card.name=='tao'){
					return evt.filterCard({
						name:'sha',isCard:true,cards:[card],
					},evt.player,evt)||evt.filterCard({
						name:'shan',isCard:true,cards:[card],
					},evt.player,evt);
				}
				return evt.filterCard(card,evt.player,evt);
			})).set('ai',function(button){
				var evt=_status.event.getParent(3);
				if(evt&&evt.ai){
					var tmp=_status.event;
					_status.event=evt;
					var result=(evt.ai||event.ai1)(button.link,_status.event.player,evt);
					_status.event=tmp;
					return result;
				}
				return 1;
			});
			'step 1'
			var evt=event.getParent(2);
			if(result.bool&&result.links&&result.links.length){
				player.addTempSkill('pinjian4');
				var card=result.links[0];
				var name=card.name,aozhan=(player.hasSkill('aozhan')&&name=='tao');
				if(aozhan){
					name=evt.filterCard({
						name:'sha',isCard:true,cards:[card],
					},evt.player,evt)?'sha':'shan';
				}
				if(evt.name=='chooseToUse'){
					game.broadcastAll(function(result,name){
						lib.skill.pinjian_backup.viewAs={name:name,cards:[result],isCard:true};
					},card,name);
					evt.set('_backupevent','pinjian_backup');
					evt.set('openskilldialog',('请选择'+get.translation(card)+'的目标'))
					evt.backup('pinjian_backup');
				}
				else{
					delete evt.result.skill;
					delete evt.result.used;
					evt.result.card=get.autoViewAs(result.links[0]);
					if(aozhan) evt.result.card.name=name;
					evt.result.cards=[result.links[0]];
					evt.redo();
					return;
				}
			}
			evt.goto(0);
		},
		ai:{
			effect:{
				target:function(card,player,target,effect){
					if(get.tag(card,'respondShan')) return 0.7;
					if(get.tag(card,'respondSha')) return 0.7;
				},
			},
			order:11,
			respondShan:true,
			respondSha:true,
			result:{
				player:function(player){
					if(_status.event.dying) return get.attitude(player,_status.event.dying);
					return 1;
				},
			},
		},
		"_priority":0,
	},
	"pinjian_backup":{
		sourceSkill:"pinjian",
		precontent:function(){
			delete event.result.skill;
			var name=event.result.card.name,cards=event.result.card.cards.slice(0);
			event.result.cards=cards;
			var rcard=cards[0],card;
			if(rcard.name==name) card=get.autoViewAs(rcard);
			else card=get.autoViewAs({name,isCard:true});
			event.result.card=card;
		},
		filterCard:function(){return false},
		selectCard:-1,
		"_priority":0,
	},
	"pinjian4":{
		"_priority":0,
	},
	nvshen:{
		trigger:{
			target:"useCardToTargeted",
		},
		direct:true,
		filter:function(event,player){
			return event.card.name=='sha'&&player.countCards('h')>0;
		},
		content:function(){
			"step 0"
			var next=player.chooseCard(get.prompt2('nvshen'));
			next.set('ai',function(card){
				if(get.type(card)=='basic') return 1;
				return Math.abs(get.value(card))+1;
			});
			"step 1"
			if(result.bool){
				player.logSkill('nvshen');
				player.showCards(result.cards);
				var type=get.type(result.cards[0],'trick');
				if(trigger.player){
					trigger.player.chooseToDiscard('弃置一张不为'+get.translation(type)+'牌的手牌或令此【杀】无效',function(card){
						return get.type(card,'trick')!=_status.event.type;
					}).set('ai',function(card){
						if(_status.event.att<0){
							return 10-get.value(card);
						}
						return 0;
					}).set('type',type).set('att',get.attitude(trigger.player,player));
				}
			}
			else{
				event.finish();
			}
			"step 2"
			if(result.bool==false){
				trigger.excluded.push(player);
			}
		},
		ai:{
			effect:{
				target:function(card,player,target,current){
					if(card.name=='sha'&&get.attitude(player,target)<0){
						return 0.3;
					}
				},
			},
		},
		"_priority":0,
	},
	xiangjie:{
		trigger:{
			player:"phaseUseEnd",
		},
		check:function(event,player){
			if(game.hasPlayer(function(current){
				return current!=player&&current.isMinHandcard()&&get.attitude(player,current)>0;
			})){
				return true;
			}
			if(player.countCards('h')==0&&!game.hasPlayer(function(current){
				return current!=player&&!current.countCards('h')&&get.attitude(player,current)<0;
			})) return true;
			return false;
		},
		filter:function(event,player){
			var num=0;
			player.getHistory('sourceDamage',function(evt){
				if(evt.getParent('phaseUse')==event) num+=evt.num;
			});
			return !num;
		},
		content:function(){
			'step 0'
			player.draw();
			if(!player.isMinHandcard(true)){
				var list=game.filterPlayer(function(current){
					return current.isMinHandcard();
				});
				if(list.length==1){
					if(list[0]!=player){
						player.line(list[0],'green');
						player.swapHandcards(list[0]);
					}
					event.finish();
				}
				else{
					player.chooseTarget(true,'详解：选择一名手牌最少的角色与其交换手牌',function(card,player,target){
						return target.isMinHandcard();
					}).set('ai',function(target){
						return get.attitude(_status.event.player,target);
					});
				}
			}
			'step 1'
			if(result.bool){
				var target=result.targets[0];
				if(target!=player){
					player.line(target,'green');
					player.swapHandcards(target);
				}
			}
		},
		"_priority":0,
	},
	shusheng:{
		locked:true,
		subSkill:{
			discard:{
				trigger:{
					global:"phaseEnd",
				},
				forced:true,
				filter:function(event,player){
					if(_status.currentPhase!=player){
						var he=player.getCards('h');
						var bool=false;
						player.getHistory('gain',function(evt){
							if(!bool&&evt&&evt.cards){
								for(var i=0;i<evt.cards.length;i++){
									if(he.includes(evt.cards[i])) bool=true;break;
								}
							}
						});
						return bool;
					}
					return false;
				},
				content:function(){
					var he=player.getCards('h');
					var list=[];
					player.getHistory('gain',function(evt){
						if(evt&&evt.cards){
							for(var i=0;i<evt.cards.length;i++){
								if(he.includes(evt.cards[i])) list.add(evt.cards[i]);
							}
						}
					});
					player.$throw(list,1000);
					player.lose(list,ui.discardPile,'visible');
					game.log(player,'将',list,'置入弃牌堆');
				},
				sub:true,
				"_priority":0,
			},
			mark:{
				trigger:{
					player:"gainBegin",
					global:"phaseBeginStart",
				},
				silent:true,
				filter:function(event,player){
					return event.name!='gain'||player!=_status.currentPhase;
				},
				content:function(){
					if(trigger.name=='gain') trigger.gaintag.add('shusheng');
					else player.removeGaintag('shusheng');
				},
				sub:true,
				forced:true,
				popup:false,
				"_priority":1,
			},
			draw:{
				trigger:{
					player:"gainAfter",
					global:"loseAsyncAfter",
				},
				forced:true,
				filter:function(event,player){
					if(_status.currentPhase!=player||event.getg(player).length==0) return false;
					return event.getParent(2).name!='shusheng_draw';
				},
				content:function(){
					player.draw('nodelay');
				},
				sub:true,
				"_priority":0,
			},
		},
		ai:{
			threaten:1.2,
			nogain:1,
			skillTagFilter:function(player){
				return player!=_status.currentPhase;
			},
		},
		group:["shusheng_draw","shusheng_discard","shusheng_mark"],
		"_priority":0,
	},
	yjckuangcai:{
		trigger:{
			player:"loseAfter",
			global:"loseAsyncAfter",
		},
		filter:function(event,player){
			if(event.type!='discard'||event.getlx===false) return;
			var evt=event.getl(player);
			for(var i=0;i<evt.cards2.length;i++){
				if(get.position(evt.cards2[i])=='d'){
					return true;
				}
			}
			return false;
		},
		check:function(trigger,player){
			if(trigger.getParent(3).name!='phaseDiscard'||!game.hasPlayer(function(current){
				return current.isDamaged()&&get.recoverEffect(current,player,player)>0;
			})) return false;
			var evt=trigger.getl(player);
			for(var i=0;i<evt.cards2.length;i++){
				if(get.position(evt.cards2[i],true)=='d'&&get.type(evt.cards2[i],false)=='equip'){
					return true;
				}
			}
			return false;
		},
		content:function(){
			"step 0"
			var cards=[];
			var evt=trigger.getl(player);
			for(var i=0;i<evt.cards2.length;i++){
				if(get.position(evt.cards2[i],true)=='d'){
					cards.push(evt.cards2[i]);
				}
			}
			var next=player.chooseToMove('狂才：将任意张牌置于牌堆顶',true);
			next.set('list',[
				['本次弃置的牌',cards],
				['牌堆顶'],
			]);
			next.set('filterOk',function(moved){
				return moved[1].length>0;
			});
			next.set('processAI',function(list){
				var cards=list[0][1].slice(0),cards2=cards.filter(function(i){
					return get.type(i,false)=='equip';
				}),cards3;
				if(cards2.length){
					cards3=cards2.randomGet();
				}
				else cards3=cards.randomGet();
				return [[],[cards3]];
			})
			'step 1'
			if(result.bool){
				var cards=result.moved[1];
				game.log(player,'将',cards,'置于了牌堆顶');
				while(cards.length) ui.cardPile.insertBefore(cards.pop().fix(),ui.cardPile.firstChild)
			}
		},
		"_priority":0,
	},
	huachi:{
		locked:false,
		mod:{
			aiOrder:function(player,card,num){
				if(num>0&&_status.event&&_status.event.type==='phase'&&get.tag(card,'recover')){
					if(player.needsToDiscard()) return num/3;
					return 0;
				}
			},
		},
		trigger:{
			player:"phaseZhunbeiBegin",
		},
		filter:function(event,player){
			return player.hp<player.maxHp;
		},
		content:function(){
			"step 0"
			event.num=player.getDamagedHp();
			player.draw(event.num);
			"step 1"
			var check=player.countCards('h')-event.num;
			player.chooseCardTarget({
				selectCard:event.num,
				filterTarget:function(card,player,target){
					return player!=target;
				},
				ai1:function(card){
					var player=_status.event.player;
					if(player.maxHp-player.hp==1&&card.name=='du') return 30;
					var check=_status.event.check;
					if(check<1) return 0;
					if(player.hp>1&&check<2) return 0;
					return get.unuseful(card)+9;
				},
				ai2:function(target){
					var att=get.attitude(_status.event.player,target);
					if(ui.selected.cards.length==1&&ui.selected.cards[0].name=='du') return 1-att;
					return att-2;
				},
				prompt:'将'+get.cnNumber(event.num)+'张手牌交给一名其他角色',
			}).set('check',check);
			"step 2"
			if(result.bool){
				player.give(result.cards,result.targets[0]);
				player.line(result.targets,'green');
			}
		},
		ai:{
			threaten:function(player,target){
				return 0.6+0.7*target.getDamagedHp();
			},
			effect:{
				target:function(card,player,target){
					if(target.hp<=2&&get.tag(card,'damage')){
						var num=1;
						if(get.itemtype(player)=='player'&&player.hasSkillTag('damageBonus',false,{
							target:target,
							card:card
						})&&!target.hasSkillTag('filterDamage',null,{
							player:player,
							card:card
						})) num=2;
						if(target.hp>num) return [1,1];
					}
				},
			},
		},
		"_priority":0,
	},
	wzqquyi:{
		unique:true,
		enable:"chooseToUse",
		mark:true,
		skillAnimation:true,
		limited:true,
		animationColor:"wood",
		init:function(player){
			player.storage.wzqquyi=false;
		},
		filter:function(event,player){
			if(player.storage.wzqquyi) return false;
			if(event.type=='dying'){
				if(player!=event.dying) return false;
				return true;
			}
			return false;
		},
		content:function(){
			'step 0'
			player.awakenSkill('wzqquyi');
			player.storage.wzqquyi=true;
			player.discard(player.getCards('hej'));
			'step 1'
			player.link(false);
			'step 2'
			player.turnOver(false);
			'step 3'
			player.draw(3);
			'step 4'
			player.recover(3);
		},
		ai:{
			order:1,
			skillTagFilter:function(player,arg,target){
				if(player!=target||player.storage.wzqquyi) return false;
			},
			save:true,
			result:{
				player:function(player){
					if(player.hp<=0) return 10;
					if(player.hp<=2&&player.countCards('he')<=1) return 10;
					return 0;
				},
			},
			threaten:function(player,target){
				if(!target.storage.wzqquyi) return 0.6;
			},
		},
		intro:{
			content:"limited",
		},
		"_priority":0,
	},
	gaoshi:{
		enable:"phaseUse",
		filter:function(event,player){
			return player.hasCard(card=>lib.skill.gaoshi.filterCard(card,player),'h');
		},
		filterCard:(card,player)=>get.name(card)=='sha'&&player.canRecast(card),
		prompt:"重铸一张【杀】，然后可以横置一名角色",
		discard:false,
		lose:false,
		delay:false,
		content:function(){
			"step 0"
			player.recast(cards);
			"step 1"
			player.chooseTarget(false,'选择一名角色令其横置',1,function(card,player,target){
				return !target.isLinked();
			}).set('ai',function(target){
				return -get.attitude(_status.event.player,target);
			});
			"step 2"
			if(result.bool){
				result.targets[0].link();
				event.finish();
			}
			else{event.finish();}
		},
		ai:{
			basic:{
				order:5,
			},
			result:{
				player:1,
			},
		},
		group:["gaoshi2"],
		"_priority":0,
	},
	"gaoshi2":{
		trigger:{
			player:"phaseJieshuBegin",
		},
		forced:true,
		filter:function(event,player){
			return player.isLinked();
		},
		prompt:"请弃置所有连环状态的角色各一张牌",
		logTarget:function(event,player){
			return game.filterPlayer(function(current){
				if(current.isLinked()&&current.countCards('he')){
					return true;
				}
			});
		},
		content:function(){
			"step 0"
			event.targets=game.filterPlayer(function(current){
				if(current.isLinked()&&current.countCards('he')){
					return true;
				}
			});
			event.num=0;
			event.targets.sort(lib.sort.seat);
			"step 1"
			if(event.num<event.targets.length){
				var target=event.targets[event.num];
				if(player==target){
					player.chooseToDiscard(true,'he');
				}
				else{
					player.discardPlayerCard(true,'he',target);
				}
				event.num++;
				event.redo();
			}
		},
		"_priority":0,
	},
	jyxlianhuo:{
		trigger:{
			player:"damageBegin3",
		},
		forced:true,
		filter:function(event,player){
			return player.isLinked()&&event.notLink()&&event.hasNature('fire');
		},
		content:function(){
			trigger.num++;
		},
		"_priority":0,
	},
	sailao:{
		trigger:{
			player:"phaseJieshuBegin",
		},
		direct:true,
		filter:function(event,player){
			return player.countCards('h')>0&&(_status.connectMode||player.countCards('h','sha')>0)&&!player.getExpansions('sailao').length;
		},
		intro:{
			content:"expansion",
			markcount:"expansion",
		},
		content:function(){
			'step 0'
			player.chooseCard([1,Math.max(1,player.countCards('h','sha'))],get.prompt('sailao'),{name:'sha'}).set('ai',function(){
				return 1;
			});
			'step 1'
			if(result.bool){
				player.logSkill('sailao');
				player.addToExpansion(result.cards,player,'giveAuto').gaintag.add('sailao');
			}
		},
		ai:{
			effect:{
				player:function(card,player,target){
					if(_status.currentPhase!=player) return;
					if(card.name=='sha'&&!player.needsToDiscard()&&!player.getExpansions('sailao').length&&target.hp>1){
						return 'zeroplayertarget';
					}
				},
			},
			threaten:1.4,
		},
		group:"sailao2",
		"_priority":0,
	},
	"sailao2":{
		enable:"chooseToUse",
		filter:function(event,player){
			return event.type=='dying'&&event.dying&&event.dying.hp<=0&&player.getExpansions('sailao').length>0;
		},
		filterTarget:function(card,player,target){
			return target==_status.event.dying;
		},
		direct:true,
		clearTime:true,
		delay:false,
		selectTarget:-1,
		content:function(){
			"step 0"
			player.chooseCardButton(get.translation('sailao'),player.getExpansions('sailao'),true);
			"step 1"
			if(result.bool){
				player.logSkill('sailao',target);
				player.loseToDiscardpile(result.links);
				event.type='dying';
				target.useCard({name:'jiu',isCard:true},target);
			}
		},
		ai:{
			order:6,
			skillTagFilter:function(player){
				return player.getExpansions('sailao').length>0;
			},
			save:true,
			result:{
				target:3,
			},
			threaten:1.6,
		},
		"_priority":0,
	},
	pengsha:{
		trigger:{
			source:"damageSource",
			player:"damageEnd",
		},
		frequent:true,
		filter:function(event,player){
			if(!(event.hasNature('thunder')||event.hasNature('fire'))) return false;
			return event.num>0;
		},
		content:function(){
			var card=get.cardPile(function(card){
				return card.name=='sha';
			});
			if(card) player.gain(card,'gain2');
		},
		"_priority":0,
	},
	jyhzuzhou:{
		group:["jyhzuzhou_1","jyhzuzhou_2"],
		locked:true,
		subSkill:{
			"1":{
				mod:{
					targetInRange:function(card,player,target,now){
						var type=get.type(card);
						if(type=='delay') return true;
					},
				},
				sub:true,
				"_priority":0,
			},
			"2":{
				mod:{
					targetEnabled:function(card,player,target){
						if(get.type(card)=='delay') return false;
					},
				},
				sub:true,
				"_priority":0,
			},
		},
		"_priority":0,
	},
	shourong:{
		filter(event,player){
			return (player.countCards('hs',{suit:'diamond'})+player.countCards('hs',{suit:'club'}))>0;
		},
		filterTarget:function(card,player,target){
			return player!=target&&target.countCards('j')==0;
		},
		enable:"phaseUse",
		usable:1,
		filterCard(card){
			return get.suit(card)=='diamond'||get.suit(card)=='club';
		},
		position:"hs",
		prompt:"将一张方片手牌当智选假日使用，或梅花手牌当饭卡遗失使用",
		check(card){return 6-get.value(card)},
		content:function(){
			target.addJudge({name:get.color(cards)=='red'?'lebu':'bingliang'},cards);
		},
		ai:{
			order:8,
			result:{
				target:-2,
			},
			threaten:1.5,
		},
		"_priority":0,
	},
	jiqu:{
		trigger:{
			global:["phaseDrawSkipped","phaseDrawCancelled","phaseUseSkipped","phaseUseCancelled"],
		},
		audio:"ext:一赛成名:2",
		frequent:true,
		filter:function(event,player){
			return event.player!=player;
		},
		content:function(){
			player.draw();
		},
		"_priority":0,
	},
	// wanbian:{
	// 	unique:true,
	// 	trigger:{
	// 		player:"damageEnd",
	// 	},
	// 	frequent:true,
	// 	content() {
	// 		"step 0";
	// 		event.num = trigger.num;
	// 		"step 1";
	// 		lib.skill.nhuanhua.addHuashens(player, 1);
	// 		"step 2";
	// 		if (--event.num > 0 && player.hasSkill(event.name) && !get.is.blocked(event.name, player)) {
	// 			player.chooseBool(get.prompt2("wanbian")).set("frequentSkill", event.name);
	// 		} else event.finish();
	// 		"step 3";
	// 		if (result.bool && player.hasSkill("wanbian")) {
	// 			player.logSkill("wanbian");
	// 			event.goto(1);
	// 		}
	// 	},
	// 	ai:{
	// 		combo:"nhuanhua",
	// 	},
	// 	"_priority":0,
	// },
	// nhuanhua:{
	// 	unique:true,
	// 	init(player) {
	// 		if (!player.storage.nhuanhua) {
	// 			player.storage.nhuanhua = {
	// 				owned: {},
	// 			};
	// 		}
	// 		player.when("dieBegin").then(() => {
	// 			const name = player.name ? player.name : player.name1;
	// 			if (name) {
	// 				const sex = get.character(name, 0);
	// 				const group = get.character(name, 1);
	// 				if (player.sex != sex) {
	// 					game.broadcastAll(
	// 						(player, sex) => {
	// 							player.sex = sex;
	// 						},
	// 						player,
	// 						sex
	// 					);
	// 					game.log(player, "将性别变为了", "#y" + get.translation(sex) + "性");
	// 				}
	// 				if (player.group != group) player.changeGroup(group);
	// 			}
	// 		});
	// 	},
	// 	intro:{
	// 		content(storage, player) {
	// 			var str = "";
	// 			var list = Object.keys(storage.owned);
	// 			if (list.length) {
	// 				str += get.translation(list[0]);
	// 				for (var i = 1; i < list.length; i++) {
	// 					str += "、" + get.translation(list[i]);
	// 				}
	// 			}
	// 			var skill = player.storage.nhuanhua.current2;
	// 			if (skill) {
	// 				str += "<p>当前技能：" + get.translation(skill);
	// 			}
	// 			return str;
	// 		},
	// 		onunmark(storage, player) {
	// 			_status.characterlist.addArray(Object.keys(storage.owned));
	// 			storage.owned = [];
	// 		},
	// 		mark(dialog, content, player) {
	// 			var list = Object.keys(content.owned);
	// 			if (list.length) {
	// 				var skill = player.storage.nhuanhua.current2;
	// 				var character = player.storage.nhuanhua.current;
	// 				if (skill && character) {
	// 					dialog.addSmall([[character], (item, type, position, noclick, node) => lib.skill.renhuanhua.$createButton(item, type, position, noclick, node)]);
	// 					dialog.add('<div><div class="skill">【' + get.translation(lib.translate[skill + "_ab"] || get.translation(skill).slice(0, 2)) + "】</div>" + "<div>" + get.skillInfoTranslation(skill, player) + "</div></div>");
	// 				}
	// 				if (player.isUnderControl(true)) {
	// 					dialog.addSmall([list, (item, type, position, noclick, node) => lib.skill.renhuanhua.$createButton(item, type, position, noclick, node)]);
	// 				} else {
	// 					dialog.addText("共有" + get.cnNumber(list.length) + "张“幻化牌”");
	// 				}
	// 			} else {
	// 				return "没有幻化牌";
	// 			}
	// 		},
	// 	},
	// 	addHuashen(player) {
	// 		if (!player.storage.nhuanhua) return;
	// 		if (!_status.characterlist) {
	// 			lib.skill.pingjian.initList();
	// 		}
	// 		_status.characterlist.randomSort();
	// 		for (var i = 0; i < _status.characterlist.length; i++) {
	// 			let name = _status.characterlist[i];
	// 			if (name.indexOf("nxq") != -1 || name.indexOf("key_") == 0 || name.indexOf("sp_key_") == 0 || lib.skill.renhuanhua.banned.includes(name) || player.storage.nhuanhua.owned[name]) continue;
	// 			let skills = lib.character[name][3].filter(skill => {
	// 				const categories = get.skillCategoriesOf(skill);
	// 				return !categories.some(type => lib.skill.renhuanhua.bannedType.includes(type));
	// 			});
	// 			if (skills.length) {
	// 				player.storage.nhuanhua.owned[name] = skills;
	// 				_status.characterlist.remove(name);
	// 				return name;
	// 			}
	// 		}
	// 	},
	// 	addHuashens(player, num) {
	// 		var list = [];
	// 		for (var i = 0; i < num; i++) {
	// 			var name = lib.skill.nhuanhua.addHuashen(player);
	// 			if (name) list.push(name);
	// 		}
	// 		if (list.length) {
	// 			player.syncStorage("nhuanhua");
	// 			player.markSkill("nhuanhua");
	// 			game.log(player, "获得了", get.cnNumber(list.length) + "张", "#g幻化");
	// 			lib.skill.renhuanhua.drawCharacter(player, list);
	// 		}
	// 	},
	// 	trigger:{
	// 		global:"phaseBefore",
	// 		player:["enterGame","phaseBegin","phaseEnd"],
	// 	},
	// 	filter(event, player, name) {
	// 		if (event.name != "phase") return true;
	// 		if (name == "phaseBefore") return game.phaseNumber == 0;
	// 		return !get.is.empty(player.storage.nhuanhua.owned);
	// 	},
	// 	direct:true,
	// 	content() {
	// 		"step 0";
	// 		var name = event.triggername;
	// 		if (trigger.name != "phase" || (name == "phaseBefore" && game.phaseNumber == 0)) {
	// 			player.logSkill("nhuanhua");
	// 			lib.skill.nhuanhua.addHuashens(player, 3);
	// 			event.logged = true;
	// 		}
	// 		var cards = [];
	// 		var skills = [];
	// 		for (var i in player.storage.nhuanhua.owned) {
	// 			cards.push(i);
	// 			skills.addArray(player.storage.nhuanhua.owned[i]);
	// 		}
	// 		var cond = event.triggername == "phaseBegin" ? "in" : "out";
	// 		skills.randomSort();
	// 		skills.sort(function (a, b) {
	// 			return get.skillRank(b, cond) - get.skillRank(a, cond);
	// 		});
	// 		if (player.isUnderControl()) {
	// 			game.swapPlayerAuto(player);
	// 		}
	// 		var switchToAuto = function () {
	// 			_status.imchoosing = false;
	// 			var skill = skills[0],
	// 				character;
	// 			for (var i in player.storage.nhuanhua.owned) {
	// 				if (player.storage.nhuanhua.owned[i].includes(skill)) {
	// 					character = i;
	// 					break;
	// 				}
	// 			}
	// 			event._result = {
	// 				bool: true,
	// 				skill: skill,
	// 				character: character,
	// 			};
	// 			if (event.dialog) event.dialog.close();
	// 			if (event.control) event.control.close();
	// 		};
	// 		var chooseButton = function (player, list, forced) {
	// 			var event = _status.event;
	// 			player = player || event.player;
	// 			if (!event._result) event._result = {};
	// 			var prompt = forced ? "幻化：选择获得一项技能" : get.prompt("nhuanhua");
	// 			var dialog = ui.create.dialog(prompt, [list, (item, type, position, noclick, node) => lib.skill.renhuanhua.$createButton(item, type, position, noclick, node)]);
	// 			event.dialog = dialog;
	// 			event.forceMine = true;
	// 			event.button = null;
	// 			for (var i = 0; i < event.dialog.buttons.length; i++) {
	// 				event.dialog.buttons[i].classList.add("pointerdiv");
	// 				event.dialog.buttons[i].classList.add("selectable");
	// 			}
	// 			event.dialog.open();
	// 			event.custom.replace.button = function (button) {
	// 				if (!event.dialog.contains(button.parentNode)) return;
	// 				if (event.control) event.control.style.opacity = 1;
	// 				if (button.classList.contains("selectedx")) {
	// 					event.button = null;
	// 					button.classList.remove("selectedx");
	// 					if (event.control) {
	// 						event.control.replacex(["cancel2"]);
	// 					}
	// 				} else {
	// 					if (event.button) {
	// 						event.button.classList.remove("selectedx");
	// 					}
	// 					button.classList.add("selectedx");
	// 					event.button = button;
	// 					if (event.control && button.link) {
	// 						event.control.replacex(player.storage.nhuanhua.owned[button.link]);
	// 					}
	// 				}
	// 				game.check();
	// 			};
	// 			event.custom.replace.window = function () {
	// 				if (event.button) {
	// 					event.button.classList.remove("selectedx");
	// 					event.button = null;
	// 				}
	// 				event.control.replacex(["cancel2"]);
	// 			};

	// 			event.switchToAuto = function () {
	// 				var cards = [];
	// 				var skills = [];
	// 				for (var i in player.storage.nhuanhua.owned) {
	// 					cards.push(i);
	// 					skills.addArray(player.storage.nhuanhua.owned[i]);
	// 				}
	// 				var cond = event.triggername == "phaseBegin" ? "in" : "out";
	// 				skills.randomSort();
	// 				skills.sort(function (a, b) {
	// 					return get.skillRank(b, cond) - get.skillRank(a, cond);
	// 				});
	// 				_status.imchoosing = false;
	// 				var skill = skills[0],
	// 					character;
	// 				for (var i in player.storage.nhuanhua.owned) {
	// 					if (player.storage.nhuanhua.owned[i].includes(skill)) {
	// 						character = i;
	// 						break;
	// 					}
	// 				}
	// 				event._result = {
	// 					bool: true,
	// 					skill: skill,
	// 					character: character,
	// 				};
	// 				if (event.dialog) event.dialog.close();
	// 				if (event.control) event.control.close();
	// 			};
	// 			var controls = [];
	// 			event.control = ui.create.control();
	// 			event.control.replacex = function () {
	// 				var args = Array.from(arguments)[0];
	// 				if (args.includes("cancel2") && forced) {
	// 					args.remove("cancel2");
	// 					this.style.opacity = "";
	// 				}
	// 				args.push(function (link) {
	// 					var result = event._result;
	// 					if (link == "cancel2") result.bool = false;
	// 					else {
	// 						if (!event.button) return;
	// 						result.bool = true;
	// 						result.skill = link;
	// 						result.character = event.button.link;
	// 					}
	// 					event.dialog.close();
	// 					event.control.close();
	// 					game.resume();
	// 					_status.imchoosing = false;
	// 				});
	// 				return this.replace.apply(this, args);
	// 			};
	// 			if (!forced) {
	// 				controls.push("cancel2");
	// 				event.control.style.opacity = 1;
	// 			}
	// 			event.control.replacex(controls);
	// 			game.pause();
	// 			game.countChoose();
	// 		};
	// 		if (event.isMine()) {
	// 			chooseButton(player, cards, event.logged);
	// 		} else if (event.isOnline()) {
	// 			event.player.send(chooseButton, event.player, cards, event.logged);
	// 			event.player.wait();
	// 			game.pause();
	// 		} else {
	// 			switchToAuto();
	// 		}
	// 		"step 1";
	// 		var map = event.result || result;
	// 		if (map.bool) {
	// 			if (!event.logged) player.logSkill("nhuanhua");
	// 			var skill = map.skill,
	// 				character = map.character;
	// 			if (character != player.storage.nhuanhua.current) {
	// 				const old = player.storage.nhuanhua.current;
	// 				player.storage.nhuanhua.current = character;
	// 				player.markSkill("nhuanhua");
	// 				game.broadcastAll(
	// 					function (player, character, old) {
	// 						player.tempname.remove(old);
	// 						player.tempname.add(character);
	// 						player.sex = lib.character[character][0];
	// 						//player.group=lib.character[character][1];
	// 						//player.node.name.dataset.nature=get.groupnature(player.group);
	// 						var mark = player.marks.nhuanhua;
	// 						if (mark) {
	// 							mark.style.transition = "all 0.3s";
	// 							setTimeout(function () {
	// 								mark.style.transition = "all 0s";
	// 								ui.refresh(mark);
	// 								mark.setBackground(character, "character");
	// 								if (mark.firstChild) {
	// 									mark.firstChild.remove();
	// 								}
	// 								setTimeout(function () {
	// 									mark.style.transition = "";
	// 									mark.show();
	// 								}, 50);
	// 							}, 200);
	// 						}
	// 					},
	// 					player,
	// 					character,
	// 					old
	// 				);
	// 				game.log(player, "将性别变为了", "#y" + get.translation(lib.character[character][0]) + "性");
	// 				player.changeGroup(lib.character[character][1]);
	// 			}
	// 			player.storage.nhuanhua.current2 = skill;
	// 			if (!player.additionalSkills.nhuanhua || !player.additionalSkills.nhuanhua.includes(skill)) {
	// 				player.addAdditionalSkills("nhuanhua", skill);
	// 				player.flashAvatar("nhuanhua", character);
	// 				player.syncStorage("nhuanhua");
	// 				player.updateMarks("nhuanhua");
	// 				// lib.skill.renhuanhua.createAudio(character,skill,'zuoci');
	// 			}
	// 		}
	// 	},
	// 	"_priority":0,
	// },
	huashen: {
		audio: "huashen2",
		unique: true,
		init(player) {
			if (!player.storage.huashen) {
				player.storage.huashen = {
					owned: {},
				};
			}
			player.when("dieBegin").then(() => {
				const name = player.name ? player.name : player.name1;
				if (name) {
					const sex = get.character(name, 0);
					const group = get.character(name, 1);
					if (player.sex != sex) {
						game.broadcastAll(
							(player, sex) => {
								player.sex = sex;
							},
							player,
							sex
						);
						game.log(player, "将性别变为了", "#y" + get.translation(sex) + "性");
					}
					if (player.group != group) player.changeGroup(group);
				}
			});
		},
		intro: {
			content(storage, player) {
				let str = "";
				const list = Object.keys(storage.owned);
				if (list.length) {
					str += get.translation(list[0]);
					for (let i = 1; i < list.length; i++) {
						str += "、" + get.translation(list[i]);
					}
				}
				const skill = player.storage.huashen.current2;
				if (skill) {
					str += "<p>当前技能：" + get.translation(skill);
				}
				return str;
			},
			onunmark(storage, player) {
				_status.characterlist.addArray(Object.keys(storage.owned));
				storage.owned = [];
			},
			mark(dialog, content, player) {
				const list = Object.keys(content.owned);
				if (list.length) {
					const skill = player.storage.huashen.current2;
					const character = player.storage.huashen.current;
					if (skill && character) {
						dialog.addSmall([[character], (item, type, position, noclick, node) => lib.skill.rehuashen.$createButton(item, type, position, noclick, node)]);
						dialog.add('<div><div class="skill">【' + get.translation(lib.translate[skill + "_ab"] || get.translation(skill).slice(0, 2)) + "】</div>" + "<div>" + get.skillInfoTranslation(skill, player) + "</div></div>");
					}
					if (player.isUnderControl(true)) {
						dialog.addSmall([list, (item, type, position, noclick, node) => lib.skill.rehuashen.$createButton(item, type, position, noclick, node)]);
					} else {
						dialog.addText("共有" + get.cnNumber(list.length) + "张“幻化牌”");
					}
				} else {
					return "没有幻化牌";
				}
			},
		},
		addHuashen(player) {
			if (!player.storage.huashen) return;
			if (!_status.characterlist) {
				lib.skill.pingjian.initList();
			}
			_status.characterlist.randomSort();
			for (let i = 0; i < _status.characterlist.length; i++) {
				let name = _status.characterlist[i];
				if (name.indexOf("zuoci") != -1 || name.indexOf("key_") == 0 || name.indexOf("sp_key_") == 0 || lib.skill.rehuashen.banned.includes(name) || player.storage.huashen.owned[name]) continue;
				let skills = lib.character[name][3].filter(skill => {
					const categories = get.skillCategoriesOf(skill, player);
					return !categories.some(type => lib.skill.rehuashen.bannedType.includes(type));
				});
				if (skills.length) {
					player.storage.huashen.owned[name] = skills;
					_status.characterlist.remove(name);
					return name;
				}
			}
		},
		addHuashens(player, num) {
			const list = [];
			for (let i = 0; i < num; i++) {
				const name = lib.skill.huashen.addHuashen(player);
				if (name) list.push(name);
			}
			if (list.length) {
				player.syncStorage("huashen");
				player.markSkill("huashen");
				game.log(player, "获得了", get.cnNumber(list.length) + "张", "#g幻化牌");
				lib.skill.rehuashen.drawCharacter(player, list);
			}
		},
		trigger: {
			global: "phaseBefore",
			player: ["enterGame", "phaseBegin", "phaseEnd"],
		},
		filter(event, player, name) {
			if (event.name != "phase") return true;
			if (name == "phaseBefore") return game.phaseNumber == 0;
			return !get.is.empty(player.storage.huashen.owned);
		},
		log: false,
		async cost(event, trigger, player) {
			const name = event.triggername;
			if (trigger.name != "phase" || (name == "phaseBefore" && game.phaseNumber == 0)) {
				player.logSkill("huashen");
				lib.skill.huashen.addHuashens(player, 3);
				event.logged = true;
			}
			await Promise.all(event.next); // await logSkill 防止被 paused
			// 因为化身内置了一个 chooseButtonControl 需要特殊处理一下
			const cards = [];
			const skills = [];
			for (const i in player.storage.huashen.owned) {
				cards.push(i);
				skills.addArray(player.storage.huashen.owned[i]);
			}
			const cond = event.triggername == "phaseBegin" ? "in" : "out";
			skills.randomSort();
			skills.sort(function (a, b) {
				return get.skillRank(b, cond) - get.skillRank(a, cond);
			});
			if (player.isUnderControl()) {
				game.swapPlayerAuto(player);
			}
			const switchToAuto = function () {
				_status.imchoosing = false;
				let skill = skills[0],
					character;
				for (const i in player.storage.huashen.owned) {
					if (player.storage.huashen.owned[i].includes(skill)) {
						character = i;
						break;
					}
				}
				if (event.dialog) event.dialog.close();
				if (event.control) event.control.close();
				return Promise.resolve({
					bool: true,
					skill: skill,
					character: character,
				});
			};
			const chooseButton = function (player, list, forced) {
				const { promise, resolve } = Promise.withResolvers();
				const event = _status.event;
				player = player || event.player;
				if (!event._result) event._result = {};
				const prompt = forced ? "幻化：选择获得一项技能" : get.prompt("huashen");
				const dialog = ui.create.dialog(prompt, [list, (item, type, position, noclick, node) => lib.skill.rehuashen.$createButton(item, type, position, noclick, node)]);
				event.dialog = dialog;
				event.forceMine = true;
				event.button = null;
				for (let i = 0; i < event.dialog.buttons.length; i++) {
					event.dialog.buttons[i].classList.add("pointerdiv");
					event.dialog.buttons[i].classList.add("selectable");
				}
				event.dialog.open();
				event.custom.replace.button = function (button) {
					if (!event.dialog.contains(button.parentNode)) return;
					if (event.control) event.control.style.opacity = 1;
					if (button.classList.contains("selectedx")) {
						event.button = null;
						button.classList.remove("selectedx");
						if (event.control) {
							event.control.replacex(["cancel2"]);
						}
					} else {
						if (event.button) {
							event.button.classList.remove("selectedx");
						}
						button.classList.add("selectedx");
						event.button = button;
						if (event.control && button.link) {
							event.control.replacex(player.storage.huashen.owned[button.link]);
						}
					}
					game.check();
				};
				event.custom.replace.window = function () {
					if (event.button) {
						event.button.classList.remove("selectedx");
						event.button = null;
					}
					event.control.replacex(["cancel2"]);
				};
				event.switchToAuto = function () {
					const cards = [];
					const skills = [];
					for (const i in player.storage.huashen.owned) {
						cards.push(i);
						skills.addArray(player.storage.huashen.owned[i]);
					}
					const cond = event.triggername == "phaseBegin" ? "in" : "out";
					skills.randomSort();
					skills.sort(function (a, b) {
						return get.skillRank(b, cond) - get.skillRank(a, cond);
					});
					_status.imchoosing = false;
					let skill = skills[0],
						character;
					for (const i in player.storage.huashen.owned) {
						if (player.storage.huashen.owned[i].includes(skill)) {
							character = i;
							break;
						}
					}
					resolve({
						bool: true,
						skill: skill,
						character: character,
					});
					if (event.dialog) event.dialog.close();
					if (event.control) event.control.close();
				};
				const controls = [];
				event.control = ui.create.control();
				event.control.replacex = function () {
					const args = Array.from(arguments)[0];
					if (args.includes("cancel2") && forced) {
						args.remove("cancel2");
						this.style.opacity = "";
					}
					args.push(function (link) {
						const result = event._result;
						if (link == "cancel2") result.bool = false;
						else {
							if (!event.button) return;
							result.bool = true;
							result.skill = link;
							result.character = event.button.link;
						}
						event.dialog.close();
						event.control.close();
						game.resume(); // 不再 game.resume 防止 game.loop 被重复执行
						_status.imchoosing = false;
						resolve(result);
					});
					return this.replace.apply(this, args);
				};
				if (!forced) {
					controls.push("cancel2");
					event.control.style.opacity = 1;
				}
				event.control.replacex(controls);
				game.pause(); // 暂停 game.loop 防止 game.resume2
				game.countChoose();
				return promise;
			};
			let next;
			if (event.isMine()) {
				next = chooseButton(player, cards, event.logged);
			} else if (event.isOnline()) {
				const { promise, resolve } = Promise.withResolvers();
				event.player.send(chooseButton, event.player, cards, event.logged);
				event.player.wait(async result => {
					if (result == "ai") result = await switchToAuto();

					resolve(result);
				}); // 不再 game.resume 防止 game.loop 被重复执行
				game.pause(); // 暂停 game.loop 防止 game.resume2
				next = promise;
			} else {
				next = switchToAuto();
			}
			const result = await next;
			// _status.paused = false; // 恢复 game.loop 但不立刻执行
			game.resume();
			result.logged = event.logged;
			event.result = {
				bool: result.bool,
				cost_data: result,
			};
		},
		async content(event, trigger, player) {
			const map = event.cost_data;
			if (!map.logged) player.logSkill("huashen");
			const skill = map.skill,
				character = map.character;
			if (character != player.storage.huashen.current) {
				const old = player.storage.huashen.current;
				player.storage.huashen.current = character;
				player.markSkill("huashen");
				game.broadcastAll(
					function (player, character, old) {
						player.tempname.remove(old);
						player.tempname.add(character);
						player.sex = lib.character[character].sex;
						//player.group=lib.character[character][1];
						//player.node.name.dataset.nature=get.groupnature(player.group);
						const mark = player.marks.huashen;
						if (!mark) return;
						mark.style.transition = "all 0.3s";
						setTimeout(function () {
							mark.style.transition = "all 0s";
							ui.refresh(mark);
							mark.setBackground(character, "character");
							if (mark.firstChild) {
								mark.firstChild.remove();
							}
							setTimeout(function () {
								mark.style.transition = "";
								mark.show();
							}, 50);
						}, 200);
					},
					player,
					character,
					old
				);
				get.character().group;
				game.log(player, "将性别变为了", "#y" + get.translation(lib.character[character].sex) + "性");
				await player.changeGroup(lib.character[character].group);
			}
			player.storage.huashen.current2 = skill;
			if (!player.additionalSkills.huashen || !player.additionalSkills.huashen.includes(skill)) {
				player.flashAvatar("huashen", character);
				player.syncStorage("huashen");
				player.updateMarks("huashen");
				await player.addAdditionalSkills("huashen", skill);
				// lib.skill.rehuashen.createAudio(character,skill,'zuoci');
			}
		},
	},
	huashen2: { audio: 2 },
	xinsheng: {
		audio: 2,
		unique: true,
		trigger: { player: "damageEnd" },
		frequent: true,
		getIndex(event, player) {
			return event.num;
		},
		async content(event, trigger, player) {
			lib.skill.huashen.addHuashens(player, 1);
		},
		ai: {
			combo: "huashen",
		},
	},
	rehuashen: {
		unique: true,
		audio: 2,
		trigger: {
			global: "phaseBefore",
			player: ["enterGame", "phaseBegin", "phaseEnd", "rehuashen"],
		},
		filter: function (event, player, name) {
			if (event.name != "phase") return true;
			if (name == "phaseBefore") return game.phaseNumber == 0;
			return player.storage.rehuashen && player.storage.rehuashen.character.length > 0;
		},
		direct: true,
		content: function () {
			"step 0";
			var name = event.triggername;
			if (trigger.name != "phase" || (name == "phaseBefore" && game.phaseNumber == 0)) {
				player.logSkill("rehuashen");
				lib.skill.rehuashen.addHuashens(player, 3);
				event.logged = true;
			}
			_status.noclearcountdown = true;
			event.videoId = lib.status.videoId++;
			var cards = player.storage.rehuashen.character.slice(0);
			var skills = [];
			var sto = player.storage.rehuashen;
			for (var i in player.storage.rehuashen.map) {
				skills.addArray(player.storage.rehuashen.map[i]);
			}
			var cond = "out";
			if (event.triggername == "phaseBegin") {
				cond = "in";
			}
			skills.randomSort();
			skills.sort(function (a, b) {
				return get.skillRank(b, cond) - get.skillRank(a, cond);
			});
			event.aiChoice = skills[0];
			var choice = "更换技能";
			if (event.aiChoice == player.storage.rehuashen.current2 || get.skillRank(event.aiChoice, cond) < 1) choice = "弃置幻化牌";
			if (player.isOnline2()) {
				player.send(
					function (cards, id) {
						var dialog = ui.create.dialog("是否发动【幻化】？", [cards, (item, type, position, noclick, node) => lib.skill.rehuashen.$createButton(item, type, position, noclick, node)]);
						dialog.videoId = id;
					},
					cards,
					event.videoId
				);
			}
			event.dialog = ui.create.dialog(get.prompt("rehuashen"), [cards, (item, type, position, noclick, node) => lib.skill.rehuashen.$createButton(item, type, position, noclick, node)]);
			event.dialog.videoId = event.videoId;
			if (!event.isMine()) {
				event.dialog.style.display = "none";
			}
			if (event.logged) event._result = { control: "更换技能" };
			else
				player
					.chooseControl("弃置幻化牌", "更换技能", "cancel2")
					.set("ai", function () {
						return _status.event.choice;
					})
					.set("choice", choice);
			"step 1";
			event.control = result.control;
			if (event.control == "cancel2") {
				if (player.isOnline2()) {
					player.send("closeDialog", event.videoId);
				}
				delete _status.noclearcountdown;
				if (!_status.noclearcountdown) {
					game.stopCountChoose();
				}
				event.dialog.close();
				event.finish();
				return;
			}
			if (!event.logged) {
				player.logSkill("rehuashen");
				event.logged = true;
			}
			var next = player.chooseButton(true).set("dialog", event.videoId);
			if (event.control == "弃置幻化牌") {
				next.set("selectButton", [1, 2]);
				next.set("filterButton", function (button) {
					return button.link != _status.event.current;
				});
				next.set("current", player.storage.rehuashen.current);
			} else {
				next.set("ai", function (button) {
					return player.storage.rehuashen.map[button.link].includes(_status.event.choice) ? 2.5 : 1 + Math.random();
				});
				next.set("choice", event.aiChoice);
			}
			var prompt = event.control == "弃置幻化牌" ? "选择制衡至多两张幻化牌" : "选择要切换的幻化牌";
			var func = function (id, prompt) {
				var dialog = get.idDialog(id);
				if (dialog) {
					dialog.content.childNodes[0].innerHTML = prompt;
				}
			};
			if (player.isOnline2()) {
				player.send(func, event.videoId, prompt);
			} else if (event.isMine()) {
				func(event.videoId, prompt);
			}
			"step 2";
			if (result.bool && event.control != "弃置幻化牌") {
				event.card = result.links[0];
				var func = function (card, id) {
					var dialog = get.idDialog(id);
					if (dialog) {
						for (var i = 0; i < dialog.buttons.length; i++) {
							if (dialog.buttons[i].link == card) {
								dialog.buttons[i].classList.add("selectedx");
							} else {
								dialog.buttons[i].classList.add("unselectable");
							}
						}
					}
				};
				if (player.isOnline2()) {
					player.send(func, event.card, event.videoId);
				} else if (event.isMine()) {
					func(event.card, event.videoId);
				}
				var list = player.storage.rehuashen.map[event.card].slice(0);
				list.push("返回");
				player
					.chooseControl(list)
					.set("choice", event.aiChoice)
					.set("ai", function () {
						return _status.event.choice;
					});
			} else {
				lib.skill.rehuashen.removeHuashen(player, result.links.slice(0));
				lib.skill.rehuashen.addHuashens(player, result.links.length);
			}
			"step 3";
			if (result.control == "返回") {
				var func = function (id) {
					var dialog = get.idDialog(id);
					if (dialog) {
						for (var i = 0; i < dialog.buttons.length; i++) {
							dialog.buttons[i].classList.remove("selectedx");
							dialog.buttons[i].classList.remove("unselectable");
						}
					}
				};
				if (player.isOnline2()) {
					player.send(func, event.videoId);
				} else if (event.isMine()) {
					func(event.videoId);
				}
				event._result = { control: "更换技能" };
				event.goto(1);
				return;
			}
			if (player.isOnline2()) {
				player.send("closeDialog", event.videoId);
			}
			event.dialog.close();
			delete _status.noclearcountdown;
			if (!_status.noclearcountdown) {
				game.stopCountChoose();
			}
			if (event.control == "弃置幻化牌") return;
			if (player.storage.rehuashen.current != event.card) {
				const old = player.storage.rehuashen.current;
				player.storage.rehuashen.current = event.card;
				game.broadcastAll(
					function (player, character, old) {
						player.tempname.remove(old);
						player.tempname.add(character);
						player.sex = lib.character[character][0];
					},
					player,
					event.card,
					old
				);
				game.log(player, "将性别变为了", "#y" + get.translation(lib.character[event.card][0]) + "性");
				player.changeGroup(lib.character[event.card][1]);
			}
			var link = result.control;
			player.storage.rehuashen.current2 = link;
			if (!player.additionalSkills.rehuashen || !player.additionalSkills.rehuashen.includes(link)) {
				player.addAdditionalSkills("rehuashen", link);
				player.flashAvatar("rehuashen", event.card);
				player.syncStorage("rehuashen");
				player.updateMarks("rehuashen");
				// lib.skill.rehuashen.createAudio(event.card,link,'re_zuoci');
			}
		},
		init: function (player, skill) {
			if (!player.storage[skill])
				player.storage[skill] = {
					character: [],
					map: {},
				};
			player.when("dieBegin").then(() => {
				const name = player.name ? player.name : player.name1;
				if (name) {
					const sex = get.character(name).sex;
					const group = get.character(name).group;
					if (player.sex != sex) {
						game.broadcastAll(
							(player, sex) => {
								player.sex = sex;
							},
							player,
							sex
						);
						game.log(player, "将性别变为了", "#y" + get.translation(sex) + "性");
					}
					if (player.group != group) player.changeGroup(group);
				}
			});
		},
		banned: ["lisu", "sp_xiahoudun", "xushao", "jsrg_xushao", "zhoutai", "old_zhoutai", "shixie", "xin_zhoutai", "dc_shixie", "old_shixie"],
		bannedType: ["Charlotte", "主公技", "觉醒技", "限定技", "隐匿技", "使命技"],
		addHuashen: function (player) {
			if (!player.storage.rehuashen) return;
			if (!_status.characterlist) {
				lib.skill.pingjian.initList();
			}
			_status.characterlist.randomSort();
			for (let i = 0; i < _status.characterlist.length; i++) {
				let name = _status.characterlist[i];
				if (name.indexOf("zuoci") != -1 || name.indexOf("key_") == 0 || name.indexOf("sp_key_") == 0 || get.is.double(name) || lib.skill.rehuashen.banned.includes(name) || player.storage.rehuashen.character.includes(name)) continue;
				let skills = lib.character[name][3].filter(skill => {
					const categories = get.skillCategoriesOf(skill, player);
					return !categories.some(type => lib.skill.rehuashen.bannedType.includes(type));
				});
				if (skills.length) {
					player.storage.rehuashen.character.push(name);
					player.storage.rehuashen.map[name] = skills;
					_status.characterlist.remove(name);
					return name;
				}
			}
		},
		addHuashens: function (player, num) {
			var list = [];
			for (var i = 0; i < num; i++) {
				var name = lib.skill.rehuashen.addHuashen(player);
				if (name) list.push(name);
			}
			if (list.length) {
				player.syncStorage("rehuashen");
				player.updateMarks("rehuashen");
				game.log(player, "获得了", get.cnNumber(list.length) + "张", "#g幻化牌");
				lib.skill.rehuashen.drawCharacter(player, list);
			}
		},
		removeHuashen: function (player, links) {
			player.storage.rehuashen.character.removeArray(links);
			_status.characterlist.addArray(links);
			game.log(player, "移去了", get.cnNumber(links.length) + "张", "#g幻化牌");
		},
		drawCharacter: function (player, list) {
			game.broadcastAll(
				function (player, list) {
					if (player.isUnderControl(true)) {
						var cards = [];
						for (var i = 0; i < list.length; i++) {
							var cardname = "huashen_card_" + list[i];
							lib.card[cardname] = {
								fullimage: true,
								image: "character:" + list[i],
							};
							lib.translate[cardname] = get.rawName2(list[i]);
							cards.push(game.createCard(cardname, "", ""));
						}
						player.$draw(cards, "nobroadcast");
					}
				},
				player,
				list
			);
		},
		$createButton: function (item, type, position, noclick, node) {
			node = ui.create.buttonPresets.character(item, "character", position, noclick);
			const info = lib.character[item];
			const skills = info[3].filter(function (skill) {
				const categories = get.skillCategoriesOf(skill, get.player());
				return !categories.some(type => lib.skill.rehuashen.bannedType.includes(type));
			});
			if (skills.length) {
				const skillstr = skills.map(i => `[${get.translation(i)}]`).join("<br>");
				const skillnode = ui.create.caption(`<div class="text" data-nature=${get.groupnature(info[1], "raw")}m style="font-family: ${lib.config.name_font || "xinwei"},xinwei">${skillstr}</div>`, node);
				skillnode.style.left = "2px";
				skillnode.style.bottom = "2px";
			}
			node._customintro = function (uiintro, evt) {
				const character = node.link,
					characterInfo = get.character(node.link);
				let capt = get.translation(character);
				if (characterInfo) {
					capt += `&nbsp;&nbsp;${get.translation(characterInfo.sex)}`;
					let charactergroup;
					const charactergroups = get.is.double(character, true);
					if (charactergroups) charactergroup = charactergroups.map(i => get.translation(i)).join("/");
					else charactergroup = get.translation(characterInfo.group);
					capt += `&nbsp;&nbsp;${charactergroup}`;
				}
				uiintro.add(capt);

				if (lib.characterTitle[node.link]) {
					uiintro.addText(get.colorspan(lib.characterTitle[node.link]));
				}
				for (let i = 0; i < skills.length; i++) {
					if (lib.translate[skills[i] + "_info"]) {
						let translation = lib.translate[skills[i] + "_ab"] || get.translation(skills[i]).slice(0, 2);
						if (lib.skill[skills[i]] && lib.skill[skills[i]].nobracket) {
							uiintro.add('<div><div class="skilln">' + get.translation(skills[i]) + "</div><div>" + get.skillInfoTranslation(skills[i]) + "</div></div>");
						} else {
							uiintro.add('<div><div class="skill">【' + translation + "】</div><div>" + get.skillInfoTranslation(skills[i]) + "</div></div>");
						}
						if (lib.translate[skills[i] + "_append"]) {
							uiintro._place_text = uiintro.add('<div class="text">' + lib.translate[skills[i] + "_append"] + "</div>");
						}
					}
				}
			};
			return node;
		},
		// createAudio:(character,skillx,name)=>{
		// 	var skills=game.expandSkills([skillx]);
		// 	skills=skills.filter(skill=>get.info(skill));
		// 	if(!skills.length) return;
		// 	var skillss=skills.filter(skill=>get.info(skill).derivation);
		// 	if(skillss.length){
		// 		skillss.forEach(skill=>{
		// 			var derivationSkill=get.info(skill).derivation;
		// 			skills[Array.isArray(derivationSkill)?'addArray':'add'](derivationSkill);
		// 		});
		// 	}
		// 	skills.forEach(skill=>{
		// 		var info=lib.skill[skill];
		// 		if(info){
		// 			if(!info.audioname2) info.audioname2={};
		// 			if(info.audioname&&info.audioname.includes(character)){
		// 				if(info.audio){
		// 					if(typeof info.audio=='string') skill=info.audio;
		// 					if(Array.isArray(info.audio)) skill=info.audio[0];
		// 				}
		// 				if(!lib.skill[skill+'_'+character]) lib.skill[skill+'_'+character]={audio:2};
		// 				info.audioname2[name]=(skill+'_'+character);
		// 			}
		// 			else if(info.audioname2[character]){
		// 				info.audioname2[name]=info.audioname2[character];
		// 			}
		// 			else{
		// 				if(info.audio){
		// 					if(typeof info.audio=='string') skill=info.audio;
		// 					if(Array.isArray(info.audio)) skill=info.audio[0];
		// 				}
		// 				info.audioname2[name]=skill;
		// 			}
		// 		}
		// 	});
		// },
		mark: true,
		intro: {
			onunmark: function (storage, player) {
				_status.characterlist.addArray(storage.character);
				storage.character = [];
			},
			mark: function (dialog, storage, player) {
				if (storage && storage.current) dialog.addSmall([[storage.current], (item, type, position, noclick, node) => lib.skill.rehuashen.$createButton(item, type, position, noclick, node)]);
				if (storage && storage.current2) dialog.add('<div><div class="skill">【' + get.translation(lib.translate[storage.current2 + "_ab"] || get.translation(storage.current2).slice(0, 2)) + "】</div><div>" + get.skillInfoTranslation(storage.current2, player) + "</div></div>");
				if (storage && storage.character.length) {
					if (player.isUnderControl(true)) {
						dialog.addSmall([storage.character, (item, type, position, noclick, node) => lib.skill.rehuashen.$createButton(item, type, position, noclick, node)]);
					} else {
						dialog.addText("共有" + get.cnNumber(storage.character.length) + "张“幻化牌”");
					}
				} else {
					return "没有幻化牌";
				}
			},
			content: function (storage, player) {
				return "共有" + get.cnNumber(storage.character.length) + "张“幻化牌”";
			},
			markcount: function (storage, player) {
				if (storage && storage.character) return storage.character.length;
				return 0;
			},
		},
	},
	rexinsheng: {
		unique: true,
		audio: 2,
		trigger: { player: "damageEnd" },
		frequent: true,
		content: function () {
			"step 0";
			event.num = trigger.num;
			"step 1";
			lib.skill.rehuashen.addHuashens(player, 1);
			"step 2";
			if (--event.num > 0 && player.hasSkill(event.name) && !get.is.blocked(event.name, player)) {
				player.chooseBool(get.prompt2("rexinsheng")).set("frequentSkill", event.name);
			} else event.finish();
			"step 3";
			if (result.bool && player.hasSkill("rexinsheng")) {
				player.logSkill("rexinsheng");
				event.goto(1);
			}
		},
		ai: {
			combo: "rehuasheng",
		},
	},
};

export default skills;
