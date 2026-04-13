import { lib, game, ui, get, ai, _status } from "../../noname.js";

/** @type { importCharacterConfig['skill'] } */
const skills = {
	zhonger: {
		trigger: {
		player: ["useCard","respond"],
		},
		filter: function(event,player){
			return event.card.name=='shan';
		},
		content: function(){
			'step 0'
			player.judge(function(card){
				var suit=get.suit(card);
					if(suit=='spade') return -4;
					if(suit=='hreat') return -2;
					return 0;
			}).judge2=function(result){
				return result.bool==false?true:false;
			};
			'step 1'
			if(result.suit=='heart'){
				player.recover();
				event.finish();
			}
			else if(result.suit=='spade'){
				player.chooseTarget(get.prompt('zhonger'),'选择一名角色，对其造成一点雷电伤害',function(card,player,target){
					return target!=player;
				}).ai=function(target){
					return get.damageEffect(target,_status.event.player,_status.event.player,'thunder');
				};
			}
			'step 2'
			var target=result.targets[0];
			target.damage('thunder');
		},
		ai: {
			useShan: true,
		},
		"_priority": 0,
	},
	gaiming: {
		trigger: {
			player: "judge",
		},
		check: function(event,player){
			return event.judge(player.judging[0])<0;
		},
		content: function(){
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
			// game.delay(2);
		},
		"_priority": 0,
	},
	yeshi: {
		group: ["yeshi_1","yeshi_2","yeshi_3"],
		locked: true,
		subSkill: {
			"1": {
				mod: {
					cardname: function(card,player){
						if(card.name=='tao') return 'sha';
					},
				},
				ai: {
					skillTagFilter: function(player){
						if(!player.countCards('h','tao')) return false;
					},
					respondSha: true,
				},
				audio: 2,
				trigger: {
					player: ["useCard1","respond"],
				},
				firstDo: true,
				forced: true,
				filter: function(event,player){
					return event.card.name=='sha'&&!event.skill&&
					event.cards.length==1&&event.cards[0].name=='tao';
				},
				content: function(){},
				sub: true,
				"_priority": 0,
				sourceSkill: "yeshi",
			},
			"2": {
				mod: {
					maxHandcardBase: function(player,num){
						return player.maxHp;
					},
				},
				sub: true,
				"_priority": 0,
				sourceSkill: "yeshi",
			},
			"3": {
				trigger: {
					global: "dieAfter",
				},
				forced: true,
				content: function(){
					player.recover();
				},
				sub: true,
				"_priority": 0,
				sourceSkill: "yeshi",
			},
		},
		"_priority": 0,
	},
	liangshan: {
		trigger: {
			player: "dying",
		},
		limited: true,
		skillAnimation: true,
		animationColor: "thunder",
		filter: function(event,player){
			return player.hp<1;
		},
		content: function(){
			'step 0'
			player.awakenSkill('liangshan');
			player.recover(4);
			'step 1'
			if(!player.isDying()&&!game.hasPlayer2(function(current){
				return current.name1=='lys'||current.name2=='lys';
			})){
				if(player.name2!=undefined&&player.name2=='sp_hac'){
					player.reinit(player.name2,'lys');
				}
				else player.reinit(player.name1,'lys');
			}
			else event.finish();
			'step 2'
			if(player.name=='lys'&&player.group!='wu') player.changeGroup('wu');
			player.turnOver();
			if(_status.characterlist){
				_status.characterlist.add('sp_hac');
				_status.characterlist.remove('lys');
			}
			event.finish();
		},
		ai: {
			order: 1,
		},
		mark: true,
		intro: {
			content: "limited",
		},
		init: (player, skill) => player.storage[skill] = false,
		"_priority": 0,
	},
	fanjia: {
		trigger: {
			player: "damageEnd",
		},
		filter: function(event,player){
			return (event.source!=undefined&&event.num>0);
		},
		check: function(event,player){
			return (get.attitude(player,event.source)<=0);
		},
		logTarget: "source",
		preHidden: true,
		content: function(){
			"step 0"
			player.judge(function(card){
				if(get.color(card)=='red') return 1;
				return 0;
			});
			"step 1"
			if(result.color=='black'){
				if(trigger.source.countCards('he')){
					trigger.source.chooseToDiscard('he',2,true);
				}
			}
			else if(trigger.source.isIn()){
				trigger.source.damage();
			}
			else{
				event.finish();
			}
		},
		ai: {
			"maixie_defend": true,
			expose: 0.4,
		},
		"_priority": 0,
	},
	doupeng: {
		group: ["doupeng_1","doupeng_2"],
		locked: true,
		subSkill: {
			"1": {
				mod: {
					globalFrom(from,to,distance){
						return distance-1;
					},
				},
				sub: true,
				"_priority": 0,
				sourceSkill: "doupeng",
			},
			"2": {
				mod: {
					globalFrom: function(from,to,current){
						return current-1;
					},
					globalTo: function(from,to,current){
						// if(to.hp<=2) return current+1;
						if(to.getNext().hp>to.hp&&to.getPrevious().hp>to.hp)
							return current+1;
					},
				},
				sub: true,
				"_priority": 0,
				sourceSkill: "doupeng",
			},
		},
		"_priority": 0,
	},
	fengchi: {
		trigger: {
			source: "damageSource",
		},
		direct: true,
		filter: function(event,player){
			if(event._notrigger.includes(event.player)) return false;
			return event.card&&event.card.name=='sha'&&event.cards&&
			get.color(event.cards)=='black'&&event.player.countDiscardableCards(player,'hej');
		},
		content: function(){
			"step 0"
			player.discardPlayerCard(get.prompt('fengchi',trigger.player),'e',trigger.player).set('logSkill',['fengchi',trigger.player]);
			"step 1"
			if(result.bool){
				var card=result.cards[0];
				if(get.position(card)=='d'){
					if(get.subtype(card)=='equip3'||get.subtype(card)=='equip4'){
						player.gain(card,player,'gain2');
					}
				}
			}
		},
		"_priority": 0,
	},
	changyuan: {
		trigger: {
			player: ["damageEnd","phaseUseEnd"],
		},
		frequent: true,
		locked: false,
		notemp: true,
		filter: function(event,player){
			if(event.name=='phaseUse') return player.countCards('h')>player.hp;
			return event.num>0;
		},
		content: function(){
			"step 0"
			event.count=trigger.num||1;
			"step 1"
			event.count--;
			player.draw();
			"step 2"
			if(player.countCards('h')){
				player.chooseCard('将一张手牌置于武将牌上作为“奆”',true);
			}
			else{
				event.goto(4);
			}
			"step 3"
			if(result.cards&&result.cards.length){
				player.addToExpansion(result.cards,player,'give').gaintag.add('changyuan');
			}
			"step 4"
			if(event.count>0&&player.hasSkill(event.name)&&!get.is.blocked(event.name,player)){
				player.chooseBool(get.prompt2('changyuan')).set('frequentSkill',event.name);
			}
			else event.finish();
			"step 5"
			if(result.bool){
				player.logSkill('changyuan');
				event.goto(1);
			}
		},
		marktext: "奆",
		intro: {
			name: "奆",
			content: "expansion",
			markcount: "expansion",
		},
		mod: {
			maxHandcard: function(player,num){
				return num+player.getExpansions('changyuan').length;
			},
		},
		onremove: function(player,skill){
			var cards=player.getExpansions('changyuan');
			if(cards.length) player.loseToDiscardpile(cards);
		},
		ai: {
			maixie: true,
			"maixie_hp": true,
			threaten: 0.8,
			effect: {
				target: function(card,player,target){
					if(get.tag(card,'damage')){
						if(player.hasSkillTag('jueqing',false,target)) return [1,-2];
						if(!target.hasFriend()) return;
						if(target.hp>=4) return [0.5,get.tag(card,'damage')*2];
						if(!target.hasSkill('juanneng')&&target.hp>1) return [0.5,get.tag(card,'damage')*1.5];
						if(target.hp==3) return [0.5,get.tag(card,'damage')*1.5];
						if(target.hp==2) return [1,get.tag(card,'damage')*0.5];
					}
				},
			},
		},
		"_priority": 0,
	},
	juanshi: {
		skillAnimation: true,
		animationColor: "thunder",
		unique: true,
		juexingji: true,
		trigger: {
			player: "phaseZhunbeiBegin",
		},
		forced: true,
		derivation: "juanneng",
		filter: function(event,player){
			return !player.hasSkill('juanneng')&&player.getExpansions('changyuan').length>=3;
		},
		content: function(){
			"step 0"
			player.chooseDrawRecover(2,true,function(event,player){
				if(player.hp==1&&player.isDamaged()) return 'recover_hp';
				return 'draw_card';
			});
			"step 1"
			player.loseMaxHp();
			player.addSkill('juanneng');
			player.awakenSkill('juanshi');
		},
		"_priority": 0,
	},
	juanneng: {
		enable: "phaseUse",
		filter: function(event,player){
			return player.getExpansions('changyuan').length>0&&(!player.hasSkill('juanneng_0')||!player.hasSkill('juanneng_1'))
		},
		chooseButton: {
			check: function(button){
				if(typeof button.link=='object') return 1;
				var player=_status.event.player,num=player.getExpansions('changyuan').length-1;
				if(button.link==1){
					if(game.countPlayer(function(current){
						return get.damageEffect(current,player,player)>0;
					})<num) return 0.5;
					return 2;
				}
				if(num<2) return 0;
				return 1;
			},
			dialog: function(event,player){
				var dialog=ui.create.dialog('场源','hidden');
				var table=document.createElement('div');
				table.classList.add('add-setting');
				table.style.margin='0';
				table.style.width='100%';
				table.style.position='relative';
				var list=['摸牌','造成伤害'];
				dialog.add([list.map((item,i)=>{
					return [i,item];
				}),'tdnodes']);
				dialog.add(player.getExpansions('changyuan'));
				return dialog;
			},
			select: 2,
			filter: function(button,player){
				if(typeof button.link=='number'&&player.hasSkill('juanneng_'+button.link)) return false;
				if(ui.selected.buttons.length) return (typeof ui.selected.buttons[0].link)!=(typeof button.link);
				return true;
			},
			backup: function(links){
				if(typeof links[0]=='object') links.reverse();
				var next=get.copy(lib.skill['juanneng_backup'+links[0]]);
				next.card=links[1];
				return next;
			},
			prompt: function(links,player){
				if(typeof links[0]=='object') links.reverse();
				var num=get.cnNumber(Math.max(1,player.getExpansions('changyuan').length-1)),card=get.translation(links[1]);
				if(links[0]==0) return '移去'+card+'并令一名角色摸2张牌';
				return '移去'+card+'并对至多'+num+'名角色造成1点伤害';
			},
		},
		ai: {
			order: 1,
			result: {
				player: 1,
			},
		},
		subSkill: {
			"0": {
				sub: true,
				"_priority": 0,
				sourceSkill: "juanneng",
			},
			"1": {
				sub: true,
				"_priority": 0,
				sourceSkill: "juanneng",
			},
			"backup0": {
				filterCard: ()=>false,
				selectCard: -1,
				filterTarget: true,
				delay: false,
				content: function(){
					'step 0'
					player.addTempSkill('juanneng_0','phaseUseEnd');
					var card=lib.skill.juanneng_backup.card;
					player.loseToDiscardpile(card);
					'step 1'
					target.draw(2);
				},
				ai: {
					result: {
						target: function(player,target){
							if(target.hasSkill('nogain')) return 0;
							if(player==target&&!player.needsToDiscard()) return 3;
							return 1;
						},
					},
				},
				sub: true,
				"_priority": 0,
				sourceSkill: "juanneng",
			},
			"backup1": {
				filterCard: ()=>false,
				selectCard: -1,
				filterTarget: true,
				delay: false,
				multitarget: true,
				multiline: true,
				selectTarget: function(){
					return [1,Math.max(1,_status.event.player.getExpansions('changyuan').length-1)];
				},
				content: function(){
					'step 0'
					targets.sortBySeat();
					player.addTempSkill('juanneng_1','phaseUseEnd');
					var card=lib.skill.juanneng_backup.card;
					player.loseToDiscardpile(card);
					'step 1'
					for(var i of targets) i.damage();
				},
				ai: {
					tag: {
						damage: 1,
					},
					result: {
						target: -1.5,
					},
				},
				sub: true,
				"_priority": 0,
				sourceSkill: "juanneng",
			},
		},
		"_priority": 0,
	},
	juanchang: {
		mod: {
			cardUsable: function(card){
				if(card.name=='sha') return Infinity;
			},
			targetInRange: function(card,player,target){
				if(card.name=='sha'&&player.getEquips(1).length<4) return true;
			},
		},
		"_priority": 0,
	},
	wzqpozhen: {
		trigger: {
			player: "useCard",
		},
		forced: true,
		filter: function(event){
			return get.type(event.card)=='trick';
		},
		content: function(){
			trigger.nowuxie=true;
		},
		"_priority": 0,
	},
	zhishen: {
		skillAnimation: "epic",
		animationColor: "fire",
		enable: "phaseUse",
		filter: function(event,player){
			return !player.storage.zhishen;
		},
		filterTarget: function(card,player,target){
			return player!=target;
		},
		unique: true,
		limited: true,
		selectTarget: -1,
		multitarget: true,
		multiline: true,
		mark: true,
		line: "fire",
		content: function(){
			"step 0"
			player.awakenSkill('zhishen');
			event.current=player.next;
			event.currented=[];
			"step 1"
			event.currented.push(event.current);
			event.current.addTempClass('target');
			event.current.chooseControl().set('prompt',get.translation(player)+'发动了【至神】，请选择一项').set('choiceList',[
				'摸一张牌，并将武将牌翻面',
				'失去一点体力，并令'+get.translation(player)+'摸一张牌',
			]).ai=function(event,player){
				if(player.hasSkillTag('noturn')) return 0;
				if(player.hp==1&&!player.countCards('hs','tao')&&!player.countCards('hs','jiu')) return 0;
				if(player.hasSkillTag('maixie')) return 0;
				if(player.isTurnedOver()) return 0;
				return 1;
			};
			'step 2'
			if(result.index==0){
				event.current.draw();
				event.current.turnOver();
			}
			else{
				event.current.loseHp();
				player.draw();
			}
			event.current=event.current.next;
			// event.current.chooseToUse('乱武：使用一张杀或失去1点体力',function(card){
			//     if(get.name(card)!='sha') return false;
			//     return lib.filter.cardEnabled.apply(this,arguments)
			// },function(card,player,target){
			//     if(player==target) return false;
			//     var dist=get.distance(player,target);
			//     if(dist>1){
			//         if(game.hasPlayer(function(current){
			//             return current!=player&&get.distance(player,current)<dist;
			//         })){
			//             return false;
			//         }
			//     }
			//     return lib.filter.filterTarget.apply(this,arguments);
			// }).set('ai2',function(){
			//     return get.effect_use.apply(this,arguments)+0.01;
			// }).set('addCount',false);
			// "step 2"
			// if(result.bool==false) event.current.loseHp();
			// event.current=event.current.next;
			if(event.current!=player&&!event.currented.includes(event.current)){
				game.delay(0.5);
				event.goto(1);
			}
		},
		ai: {
			order: 5,
			result: {
				player: function(player){
					if(lib.config.mode=='identity'&&game.zhu.isZhu&&player.identity=='fan'){
						if(game.zhu.hp<3) return 1;
					}
					var num=0;
					var players=game.filterPlayer();
					for(var i=0;i<players.length;i++){
						var att=get.attitude(player,players[i]);
						if(att>0) att=1;
						if(att<0) att=-1;
						if(players[i]!=player&&players[i].hp<=3){
							if(players[i].countCards('h')==0) num+=att/players[i].hp;
							else if(players[i].countCards('h')==1) num+=att/2/players[i].hp;
							else if(players[i].countCards('h')==2) num+=att/4/players[i].hp;
						}
						if(players[i].hp==1) num+=att*1.5;
					}
					if(player.hp==1){
						return -num;
					}
					if(player.hp==2){
						return -game.players.length/4-num;
					}
					return -game.players.length/3-num;
				},
			},
		},
		init: function(player){
			player.storage.zhishen=false;
		},
		intro: {
			content: "limited",
		},
		"_priority": 0,
	},
	"wenjian_ai": {
		charlotte: true,
		ai: {
			filterDamage: true,
			skillTagFilter: function(player,tag,arg){
				if(!player.hasMark('wenjian')) return false;
				if(!game.hasPlayer(function(current){
					return current.hasSkill('sunxun_effect');
				})) return false;
				if(arg&&arg.player){
					if(arg.player.hasSkillTag('jueqing',false,player)) return false;
				}
			},
		},
		"_priority": 0,
	},
	wenjian: {
		marktext: "盾",
		intro: {
			name: "稳健",
			"name2": "盾",
			content: "当前叠了#个“盾”",
		},
		group: ["wenjian_1","wenjian_2","sunxun_effect"],
		subSkill: {
			"1": {
				trigger: {
					global: "phaseBefore",
					player: "enterGame",
				},
				forced: true,
				filter: function(event,player){
					return (event.name!='phase'||game.phaseNumber==0);
				},
				content: function(){
					// player.chat("颤抖吧反贼们，三班杀第一主公在此");
					player.addMark('wenjian',3);
					player.addSkill('wenjian_ai');
				},
				sub: true,
				"_priority": 0,
				sourceSkill: "wenjian",
			},
			"2": {
				enable: "phaseUse",
				position: "he",
				filterCard: {
					type: "equip",
				},
				filter: function(event,player){
					return player.countCards('he',{type:'equip'})
				},
				check: function(card){
					var player=_status.event.player;
					if(player.hp<2) return 4-get.value(card);
					return 6-get.value(card);
				},
				prompt: "弃置一张装备牌并获得一个“盾”",
				content: function(){
					player.addMark("wenjian",1)
				},
				ai: {
					order: 5,
					result: {
						player: 1,
					},
				},
				sub: true,
				"_priority": 0,
				sourceSkill: "wenjian",
			},
		},
		"_priority": 0,
	},
	"sunxun_effect": {
		trigger: {
			global: "damageBegin4",
		},
		forced: true,
		filter: function(event,player){
			return event.player.hasMark('wenjian')&&(event.name=='damage');
		},
		content: function(){
			player.line(trigger.player,'gray');
			trigger.cancel();
			trigger.player.removeMark('wenjian',1);

		},
		"_priority": 0,
	},
	shutong: {
		trigger: {
			player: ["phaseZhunbeiBegin","phaseJieshuBegin"],
		},
		filter: function(event,player){
			return player.hasMark('wenjian');
		},
		direct: true,
		content: function(){
			'step 0'
			player.chooseTarget(get.prompt('shutong'),"你可以将一个【盾】交给一名其他角色",function(card,player,target){
				return target!=player
			}).ai=function(target){
				var player=_status.event.player;
				if(target.hasSkillTag('maixie')&&target.hp>1) return -1;
				if(player.storage.wenjian>1||player.hp>2) return get.attitude(player,target);
				return -1;
			};
			'step 1'
			if(result.bool){
				event.target=result.targets[0];
			}else{
				event.finish();
			}
			'step 2'
			player.logSkill('shutong',target);
			player.removeMark('wenjian',1);
			target.addMark('wenjian',1);
			target.addSkill('wenjian_ai');
		},
		"_priority": 0,
	},
	jingye: {
		unique: true,
		group: "jingye2",
		zhuSkill: true,
		"_priority": 0,
	},
	"jingye2": {
		trigger: {
			global: "judgeEnd",
		},
		filter: function(event,player){
			if(event.player==player||event.player.group!='qun') return false;
			return player.hasZhuSkill('jingye',event.player);
		},
		direct: true,
		content: function(){
			'step 0'
			trigger.player.chooseBool('是否发动【敬业】，令'+get.translation(player)+'摸一张牌？').set('choice',get.attitude(trigger.player,player)>0);
			'step 1'
			if(result.bool){
				player.logSkill('jingye2');
				trigger.player.line(player,'green');
				player.draw();
			}
		},
		"_priority": 0,
	},
	gaowo: {
		enable: "phaseUse",
		usable: 1,
		filterTarget: function(card,player,target){
			return target!=player&&target.inRange(player)&&target.countCards('he')>0;
		},
		content: function(){
			"step 0"
			target.chooseToUse(function(card,player,event){
				if(get.name(card)!='sha') return false;
				return lib.filter.filterCard.apply(this,arguments);
			},'挑衅：对'+get.translation(player)+'使用一张杀，或令其弃置你的一张牌').set('targetRequired',true).set('complexSelect',true).set('filterTarget',function(card,player,target){
				if(target!=_status.event.sourcex&&!ui.selected.targets.includes(_status.event.sourcex)) return false;
				return lib.filter.filterTarget.apply(this,arguments);
			}).set('sourcex',player);
			"step 1"
			if(result.bool==false&&target.countCards('he')>0){
				player.discardPlayerCard(target,'he',true);
			}
			else{
				event.finish();
			}
		},
		ai: {
			order: 4,
			expose: 0.2,
			result: {
				target: -1,
				player: function(player,target){
					if(target.countCards('h')==0) return 0;
					if(target.countCards('h')==1) return -0.1;
					if(player.hp<=2) return -2;
					if(player.countCards('h','shan')==0) return -1;
					return -0.5;
				},
			},
			threaten: 1.1,
		},
		"_priority": 0,
	},
	maipian: {
		skillAnimation: true,
		animationColor: "fire",
		unique: true,
		juexingji: true,
		derivation: ["jingyang","byljiyu"],
		trigger: {
			player: "phaseZhunbeiBegin",
		},
		forced: true,
		filter: function(event,player){
			if(player.storage.maipian) return false;
			return (player.countCards('h')==0)||player.isMinHp();
		},
		content: function(){
			"step 0"
			player.awakenSkill('maipian');
			"step 1"
			player.loseMaxHp();
			player.storage.maipian=true;
			player.addSkill('jingyang');
			player.addSkill('byljiyu');
		},
		"_priority": 0,
	},
	retuidao: {
		enable: "chooseToUse",
		filterCard(card){
			return get.color(card)=='red';
		},
		filter: function(event,player){
			return !player.hasSkill('retuidao3');
		},
		position: "hs",
		viewAs: {
			name: "guohe",
		},
		viewAsFilter(player){
			if(!player.countCards('hs',{color:'red'})) return false;
		},
		prompt: "将一张红色手牌当裂项相消使用",
		check(card){return 4-get.value(card)},
		group: ["retuidao2"],
		ai: {
			wuxie: (target,card,player,viewer,status)=>{
				if(status*get.attitude(viewer,player._trueMe||player)>0 || target.hp>2&&!target.hasCard(i=>{
					let val=get.value(i,target),subtypes=get.subtypes(i);
					if(val<8&&target.hp<2&&!subtypes.includes('equip2')&&!subtypes.includes('equip5')) return false;
					return val>3+Math.min(5,target.hp);
				},'e')&&target.countCards('h')*_status.event.getRand('guohe_wuxie')>1.57) return 0;
			},
			basic: {
				order: 9,
				useful: (card,i)=>10/(3+i),
				value: (card,player)=>{
					let max=0;
					game.countPlayer(cur=>{
						max=Math.max(max,lib.card.guohe.ai.result.target(player,cur)*get.attitude(player,cur));
					});
					if(max<=0) return 5;
					return 0.42*max;
				},
			},
			yingbian: function(card,player,targets,viewer){
				if(get.attitude(viewer,player)<=0) return 0;
				if(game.hasPlayer(function(current){
					return !targets.includes(current)&&lib.filter.targetEnabled2(card,player,current)&&get.effect(current,card,player,player)>0;
				})) return 6;
				return 0;
			},
			button: (button)=>{
				let player = _status.event.player, target = _status.event.target;
				if(!lib.filter.canBeDiscarded(button.link,player,target)) return 0;
				let att = get.attitude(player, target),
					val = get.buttonValue(button),
					pos = get.position(button.link),
					name = get.name(button.link);
				if(pos==='j'){
					if(name==='lebu'){
						let needs=target.needsToDiscard(2);
						val *= 1.08+0.2*needs;
					}
					else if(name=='shandian'||name=='fulei'||name=='plague') val /= 2;
				}
				if(get.attitude(player,get.owner(button.link))>0) val = -val;
				if(pos!=='e') return val;
				let sub = get.subtypes(button.link);
				if(sub.includes('equip1')) return val*Math.min(3.6,target.hp)/3;
				if(sub.includes('equip2')){
					if(name==='baiyin'&&pos==='e'&&target.isDamaged()){
						let by=3-0.6*Math.min(5,target.hp);
						return get.sgn(get.recoverEffect(target,player,player))*by;
					}
					return 1.57*val;
				}
				if(att<=0&&(sub.includes('equip3')||sub.includes('equip4'))&&(player.hasSkill('shouli')||player.hasSkill('psshouli'))) return 0;
				if(sub.includes('equip6')) return val;
				if(sub.includes('equip4')) return val/2;
				if(sub.includes('equip3')&&!game.hasPlayer((cur)=>{
					return !cur.inRange(target)&&get.attitude(cur,target)<0;
				})) return 0.4*val;
				return val;
			},
			result: {
				target: function(player,target){
					let att=get.attitude(player, target),
						hs=target.countCards('h',(card)=>lib.filter.canBeDiscarded(card,player,target)),
						es=target.countCards('e',(card)=>lib.filter.canBeDiscarded(card,player,target)),
						js=target.countCards('j',(card)=>lib.filter.canBeDiscarded(card,player,target)),
						noh=!hs||target.hasSkillTag('noh'),
						noe=!es||target.hasSkillTag('noe'),
						check=[-1,att>0?-1.3:1.3,att>0?-2.5:2.5],
						idx=-1;
					if(hs){
						idx=0;
						if(noh) check[0]=0.7;
					}
					if(es){
						if(idx<0) idx=1;
						if(target.getEquip('baiyin')&&target.isDamaged()&&lib.filter.canBeDiscarded(target.getEquip('baiyin'),player,target)){
							let rec=get.recoverEffect(target,player,target);
							if(es==1||att*rec>0){
								let val=3-0.6*Math.min(5,target.hp);
								if(rec>0) check[1]=val;
								else if(rec<0) check[1]=-val;
							}
						}
						target.countCards('e',function(card){
							let val=get.value(card,target);
							if(card.name=='jinhe'||att*val>=0||!lib.filter.canBeDiscarded(card,player,target)) return false;
							if(att>0){
								check[1]=Math.max(1.3,check[1]);
								return true;
							}
							let sub=get.subtype(card);
							if(sub=='equip2'||sub=='equip5') val+=4;
							else if(sub=='equip1') val*=0.4*Math.min(3.6,target.hp);
							else val*=0.6;
							if(target.hp<3&&sub!='equip2'&&sub!='equip5') val*=0.4;
							check[1]=Math.min(-0.16*val,check[1]);
						});
						if(noe) check[1]+=0.9;
					}
					if(js){
						let func=function(num){
							if(att>0) check[2]=Math.max(check[2],num);
							else check[2]=Math.min(check[2],0.6-num);
						};
						if(idx<0) idx=2;
						target.countCards('j',function(card){
							let cardj=card.viewAs?new lib.element.VCard({name:card.viewAs}):card;
							if(!lib.filter.canBeDiscarded(card,player,target)||att*get.effect(target,cardj,target,target)>=0) return false;
							if(cardj.name=='lebu') func(2.1+0.4*target.needsToDiscard(2));
							else if(cardj.name=='bingliang') func(2.4);
							else if(cardj.name=='shandian'||cardj.name=='fulei'||cardj.name=='plague') func(Math.abs(check[2])/(1+target.hp));
							else func(2.1);
						});
					}
					if(idx<0) return 0;
					for(let i=idx+1;i<3;i++){
						if(i==1&&!es||i==2&&!js) continue;
						if(att>0&&check[i]>check[idx]||att<=0&&check[i]<check[idx]) idx=i;
					}
					return check[idx];
				},
			},
			tag: {
				loseCard: 1,
				discard: 1,
			},
		},
		"_priority": 0,
	},
	"retuidao2": {
		trigger: {
			player: "useCardAfter",
		},
		forced: true,
		filter: function(event,player){
			if(!player.isPhaseUsing()) return false;
			if(!event.card) return false;
			if(event.card.name!='guohe') return false;
			return player.countCards('h')==0;
		},
		content: function(){
			player.damage(1,'nosource');
			player.addTempSkill('retuidao3');
		},
		"_priority": 0,
	},
	"retuidao3": {
		"_priority": 0,
	},
	wywhongyan: {
		trigger: {
			player: "damageEnd",
		},
		filter: function(event,player){
			return event.source&&event.source.isIn()&&!player.getStorage('wywhongyan_effect').includes(event.source)&&event.source.hasSex('male')&&get.translation(event.source)!='界程航';
		},
		check: function(event,player){
			return get.effect(event.source,{name:'losehp'},player,player)>=0;
		},
		forced: true,
		logTarget: "source",
		content: function(){
			trigger.source.addMark('wywhongyan',1,false);
			player.when('phaseUseBegin').then(()=>{
				target.removeMark('wywhongyan');
				player.draw(2);
				
			}).vars({target:trigger.source});
			player.addTempSkill('wywhongyan_effect',{player:'die'});
			player.markAuto('wywhongyan_effect',[trigger.source]);
			game.delayx();
		},
		marktext: "情",
		intro: {
			name: "情伤",
			content: "mark",
		},
		ai: {
			"maixie_defend": true,
			threaten: 0.85,
			effect: {
				target: function (card,player,target){
					if(player.hasSkillTag('jueqing',false,target)) return;
					return 0.9;
				},
			},
		},
		subSkill: {
			effect: {
				trigger: {
					player: "phaseUseBegin",
				},
				charlotte: true,
				forced: true,
				logTarget: function(event,player){
					return player.getStorage('wywhongyan_effect').filter(function(current){
						return current.isIn()&&current.hp>1;
					});
				},
				content: function(){
					'step 0'
					var targets=player.getStorage('wywhongyan_effect');
					player.removeSkill('wywhongyan_effect');
					event.targets=targets.sortBySeat();
					'step 1'
					var target=targets.shift();
					if(target.isIn()&&target.hp>1){
						event._delay=true;
						var num=target.hp-1;
						player.markAuto('wywhongyan_recover',[[target,num]]);
						target.loseHp(num);
					}
					if(targets.length>0) event.redo();
					else if(!event._delay) event.finish();
					'step 2'
					player.addTempSkill('wywhongyan_recover',{player:['phaseUseAfter','phaseAfter']});
					game.delayx();
				},
				onremove: true,
				intro: {
					content: "暗恋王钰雯的人：$",
				},
				sub: true,
				"_priority": 0,
				sourceSkill: "wywhongyan",
			},
			recover: {
				charlotte: true,
				trigger: {
					player: "phaseUseEnd",
				},
				forced: true,
				filter: function(event,player){
					var targets=player.getStorage('wywhongyan_recover');
					for(var i of targets){
						if(i[0].isIn()&&i[0].isDamaged()) return true;
					}
					return false;
				},
				onremove: true,
				logTarget: function(event,player){
					var logs=[],targets=player.getStorage('wywhongyan_recover');
					for(var i of targets){
						if(i[0].isIn()&&i[0].isDamaged()) logs.add(i[0]);
					}
					return logs;
				},
				content: function(){
					'step 0'
					event.list=player.getStorage('wywhongyan_recover').slice(0);
					event.list.sort(function(a,b){
						return lib.sort.seat(a[0],b[0]);
					});
					'step 1'
					var group=event.list.shift();
					if(group[0].isIn()&&group[0].isDamaged()){
						group[0].recover(group[1]);
						event._delay=true;
					}
					if(event.list.length>0) event.redo();
					else if(!event._delay) event.finish();
					'step 2'
					game.delayx();
				},
				sub: true,
				"_priority": 0,
				sourceSkill: "wywhongyan",
			},
		},
		"_priority": 0,
	},
	rouruo: {
		enable: "chooseToUse",
		filterCard: {
			name: "sha",
		},
		position: "h",
		viewAs: {
			name: "jiedao",
		},
		viewAsFilter(player){
			if(!player.countCards('h',{name:'sha'})) return false;
		},
		prompt: "将一张【杀】当除你武器使用",
		check(card){return 10-get.value(card)},
		"_priority": 0,
		ai: {
			wuxie: function(target,card,player,viewer){
				if(player==game.me&&get.attitude(viewer,player._trueMe||player)>0) return 0;
			},
			basic: {
				order: 8,
				value: 2,
				useful: 1,
			},
			result: {
				player: (player,target)=>{
					if(!target.hasSkillTag('noe')&&get.attitude(player,target)>0) return 0;
					return (player.hasSkillTag('noe')?0.32:0.15)*target.getEquips(1).reduce((num,i)=>{
						return num+get.value(i,player);
					},0);
				},
				target: (player,target,card)=>{
					let targets=[].concat(ui.selected.targets);
					if(_status.event.preTarget) targets.add(_status.event.preTarget);
					if(targets.length){
						let preTarget=targets.lastItem,pre=_status.event.getTempCache('jiedao_result',preTarget.playerid);
						if(pre&&pre.card===card&&pre.target.isIn()) return target===pre.target?pre.eff:0;
						return get.effect(target,{name:'sha'},preTarget,player)/get.attitude(player,target);
					}
					let arms=(target.hasSkillTag('noe')?0.32:-0.15)*target.getEquips(1).reduce((num,i)=>{
						return num+get.value(i,target);
					},0);
					if(!target.mayHaveSha(player,'use')) return arms;
					let sha=game.filterPlayer(get.info({name:'jiedao'}).filterAddedTarget),addTar=null;
					sha=sha.reduce((num,current)=>{
						let eff=get.effect(current,{name:'sha'},target,player);
						if(eff<=num) return num;
						addTar=current;
						return eff;
					},-100);
					if(!addTar) return arms;
					sha/=get.attitude(player,target);
					_status.event.putTempCache('jiedao_result',target.playerid,{
						card:card,
						target:addTar,
						eff:sha
					});
					return Math.max(arms,sha);
				},
			},
			tag: {
				gain: 1,
				use: 1,
				useSha: 1,
				loseCard: 1,
			},
		},
	},
	huoshui: {
		limited: true,
		enable: "phaseUse",
		filter: function(event,player){
			return player.countCards('he',{subtype:'equip1'});
		},
		filterTarget: function (card, player, target) {
			return player != target;
		},
		skillAnimation: true,
		animationColor: "thunder",
		position: "he",
		filterCard: function(card){
			return get.subtype(card)=='equip1';
		},
		selectCard: [1,Infinity],
		discard: false,
		lose: false,
		content: function(){
			player.awakenSkill('huoshui');
			target.addToExpansion(cards,player,'give').gaintag.add('huoshui2');
			target.addSkill('huoshui2');
		},
		ai: {
			order: function(){
				var player=_status.event.player,num=0;
				if(player.countCards('he',{subtype:'equip1'})>1) return 9;
				return 0;
			},
			result: {
				target: function(player,target){
					if(target.hasValueTarget({name:'sha',isCard:true})) return ui.selected.cards.length;
					return 0;
				},
			},
		},
		"_priority": 0,
		mark: true,
		intro: {
			content: "limited",
		},
		init: (player, skill) => player.storage[skill] = false,
	},
	"huoshui2": {
		trigger: {
			source: "damageBegin1",
		},
		forced: true,
		charlotte: true,
		filter: function(event,player){
			return player.getExpansions('huoshui2').length>0;
		},
		content: function(){
			'step 0'
			player.chooseCardButton('将一张祸水牌置入弃牌堆',player.getExpansions('huoshui2'),true);
			'step 1'
			if(result.bool){
				trigger.num++;
				player.loseToDiscardpile(result.links);
			}
		},
		marktext: "祸水",
		intro: {
			content: "expansion",
			markcount: "expansion",
			onunmark: function(storage,player){
				player.removeSkill('huoshui2');
			},
		},
		"_priority": 0,
	},
	dijie: {
		trigger: {
			player: "useCardAfter",
		},
		direct: true,
		filter: function(event,player){
			var suit=get.suit(event.card);
			if(!lib.suit.includes(suit)) return false;
			var evt=event.getParent('phaseUse');
			if(!evt||player!=evt.player) return false;
			var list=[],history=player.getHistory('useCard');
			if(history.length<2) return false;
			for(var i of history){
				if(i.getParent('phaseUse')!=evt) continue;
				var suit2=get.suit(i.card);
				if(!lib.suit.includes(suit2)) continue;
				if(i!=event&&suit2==suit) return false;
				if(i.finished) list.add(suit2);
			}
			return list.length>1&&list.length<5;
		},
		content: function(){
			'step 0'
			var suit=get.suit(trigger.card);
			var evt=event.getParent('phaseUse');
			var list=[],history=player.getHistory('useCard');
			for(var i of history){
				if(i.getParent('phaseUse')!=evt) continue;
				var suit2=get.suit(i.card);
				if(!lib.suit.includes(suit2)) continue;
				if(i.finished) list.add(suit2);
			}
			var prompt,filterTarget,ai;
			switch(list.length){
				case 2:
					prompt='令一名角色摸一张牌';
					filterTarget=function(card,player,target){
						return true;
					};
					ai=function(target){
						var player=_status.event.player;
						var att=get.attitude(player,target);
						if(target.hasSkill('nogain')) att/=10;
						return att/Math.sqrt(Math.min(5,1+target.countCards('h')));
					}
					break;
				case 3:
					prompt='弃置一名角色区域内的一张牌';
					filterTarget=function(card,player,target){
						return target.hasCard(function(card){
							return lib.filter.canBeDiscarded(card,player,target);
						},'hej');
					};
					ai=function(target){
						var player=_status.event.player;
						return get.effect(target,{name:'guohe_copy'},player,player);
					}
					break;
				case 4:
					prompt='对一名攻击范围内的其他角色造成1点伤害';
					filterTarget=function(card,player,target){
						return target!=player&&player.inRange(target);
					};
					ai=function(target){
						var player=_status.event.player;
						return get.damageEffect(target,player,player);
					}
					break;
				default:
					event.finish();
					return;
			}
			event.num=list.length;
			player.chooseTarget(get.prompt('dijie'),prompt,filterTarget).set('ai',ai);
			'step 1'
			if(result.bool){
				var target=result.targets[0];
				player.logSkill('dijie',target);
				event.target=target;
				event.goto(num);
			}
			else event.finish();
			'step 2'
			target.draw(1);
			event.finish();
			'step 3'
			player.discardPlayerCard(target,true,'hej');
			event.finish();
			'step 4'
			target.damage();
		},
		"_priority": 0,
	},
	cqwwangwei: {
		trigger: {
			player: "phaseUseBegin",
		},
		check: function (event, player) {
			var nh = player.countCards("h", { type: "sha" }) + player.countCards("h", { type: "trick" });
			if (player.countCards("h", "tao")) return false;
			if (nh > 2) return true;
			return false;
		},
		content: function () {
			player.draw(2);
			player.addTempSkill("cqwwangwei2");
		},
		"_priority": 0,
	},
	"cqwwangwei2": {
		mod: {
			attackRangeBase: function () {
				return Infinity;
			},
			maxHandcardBase: function (player, num) {
				var damage = player.getStat().damage;
				if (typeof damage == "number") return damage;
				return 0;
			},
		},
		"_priority": 0,
	},
	gongzhu: {
		group: ["gongzhu_1","gongzhu_2"],
		locked: true,
		subSkill: {
			"1": {
				trigger: {
					global: "phaseBefore",
					player: "enterGame",
				},
				forced: true,
				filter(event, player) {
					return player.hasEnabledSlot("horse");
				},
				content: function(){
					player.disableEquip(3);
					player.disableEquip(4);
				},
				sub: true,
				"_priority": 0,
				sourceSkill: "gongzhu",
			},
			"2": {
				trigger: {
					player: "damageEnd",
				},
				forced: true,
				filter(event, player) {
					return event.num>0&&player.countCards('he')>0;
				},
				content: function(){
					event.num = trigger.num;
					player.chooseToDiscard("he",true,"共诛：弃置"+ get.cnNumber(event.num)+ "张牌",event.num);
				},
				sub: true,
				"_priority": 0,
				sourceSkill: "gongzhu",
			},
		},
		ai: {
			neg: true,
		},
		"_priority": 0,
	},
	zhuanzhu: {
		trigger: {
			target:"useCardToTargeted",
		},
		direct:true,
		filter:function(event,player){
			return event.card.name=='sha';
		},
		
		"_priority": 0,
	},
	zhtshizhi: {
		"_priority": 0,
	},
	kongshan: {
		trigger: {
			global: "useCard",
		},
		filter: function (event, player) {
			return (
				event.card.name == "shan" &&
				player.inRange(event.player) &&
				(player.hp > 0 ||
					player.hasCard(function (card) {
						return get.type(card) != "basic" && lib.filter.cardDiscardable(card, player, "kongshan");
					}, "eh"))
			);
		},
		logTarget: "player",
		check: function (event, player) {
			if (get.attitude(player, event.player) >= 0) return false;
			if (get.damageEffect(event.player, event.getParent(3).player, player, get.nature(event.card)) <= 0) return false;
			if (
				player.hasCard(function (card) {
					return get.type(card) != "basic" && get.value(card) < 7 && lib.filter.cardDiscardable(card, player, "kongshan");
				}, "eh")
			)
				return true;
			return player.hp > Math.max(1, event.player.hp);
		},
		content: function () {
			"step 0";
			trigger.all_excluded = true;
			var str = "弃置一张非基本牌";
			if (player.hp > 0) str += "，或点「取消」失去1点体力";
			var next = player
				.chooseToDiscard(
					str,
					function (card) {
						return get.type(card) != "basic";
					},
					"he"
				)
				.set("ai", function (card) {
					return 7 - get.value(card);
				});
			if (player.hp <= 0) next.set("forced", true);
			"step 1";
			if (!result.bool) player.loseHp();
			"step 2";
			var cards = trigger.cards.filterInD();
			if (cards.length) player.gain(cards, "gain2");
		},
		"_priority": 0,
	},
	spniming: {
		limited: true,
		skillAnimation: true,
		animationColor: "thunder",
		filter: function(event, player){
			return player.countCards("h")==player.countCards("h",{name:"shan"}) &&
			game.countPlayer(function(current){
				return current != player;
			}) > 0;
		},
		enable: "phaseUse",
		filterTarget: function (card, player, target) {
			return player != target;
		},
		content: function(){
			"step 0"
			player.awakenSkill("spniming");
			var coun = player.countCards("h");
			var car=player.getCards('h');
			player.discard(car);
			player.discardPlayerCard(target, true, "he", [1, coun])
			"step 1"
			if(result.bool){
				// target.discard(result.cards[0]);
				target.damage("thunder");
			}
		},
		ai: {
			order: function(){
				var player = _status.event.player;
				if(player.hp==1&&player.countCards("h",{name:"shan"})==1) return 0;
				return 1;
			},
			result: {
				target: -2,
			},
		},
		"_priority": 0,
		mark: true,
		intro: {
			content: "limited",
		},
		init: (player, skill) => (player.storage[skill] = false),
	},
};

export default skills;
