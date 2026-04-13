import { lib, game, ui, get, ai, _status } from "../../noname.js";

/** @type { importCharacterConfig['skill'] } */
const skills = {
	huahe:{
		enable:"phaseUse",
		filter:function(event,player){
			return player.countCards('hes')>=2;
		},
		usable:1,
		chooseButton:{
			dialog:function(player){
				var list=[];
				for(var i=0;i<lib.inpile.length;i++){
					if(get.type(lib.inpile[i])=='trick') list.push(['锦囊','',lib.inpile[i]]);
				}
				return ui.create.dialog(get.translation('huahe'),[list,'vcard']);
			},
			filter:function(button,player){//选按钮的限制条件
				return lib.filter.filterCard({name:button.link[2]},player,_status.event.getParent());
				//你能选择现在能使用的牌的虚拟按钮
			},
			check:function(button){
				var player=_status.event.player;
				var recover=0,lose=1,players=game.filterPlayer();
				for(var i=0;i<players.length;i++){
					if(players[i].hp==1&&get.damageEffect(players[i],player,player)>0&&!players[i].hasSha()){
						return (button.link[2]=='juedou')?2:-1;
					}
					if((get.attitude(player,players[i]<0))&&(players[i].countCards('e')>0)&&(players[i].hasCard(card=>lib.filter.canBeGained(card,players[i],player)))){
						return (button.link[2]=='shunshou')?2:-1;
					}
					if(!players[i].isOut()){
						if(players[i].hp<players[i].maxHp){
							if(get.attitude(player,players[i])>0){
								if(players[i].hp<2){
									lose--;
									recover+=0.5;
								}
								lose--;
								recover++;
							}
							else if(get.attitude(player,players[i])<0){
								if(players[i].hp<2){
									lose++;
									recover-=0.5;
								}
								lose++;
								recover--;
							}
						}
						else{
							if(get.attitude(player,players[i])>0){
								lose--;
							}
							else if(get.attitude(player,players[i])<0){
								lose++;
							}
						}
					}
				}
				if(lose>recover&&lose>0) return (button.link[2]=='nanman')?1:-1;
				if(lose<recover&&recover>0) return (button.link[2]=='taoyuan')?1:-1;
				return (button.link[2]=='wuzhong')?1:-1;
			},
			backup:function(links,player){
				return {
					filterCard:true,
					selectCard:2,
					check:function(card,player,target){
						return 5-get.value(card);
					},
					position:'he',
					popname:true,
					viewAs:{name:links[0][2]},
				}
			},
			prompt:function(links,player){
				return '将两张牌当作'+get.translation(links[0][2])+'使用';
			},
		},
		ai:{
			order:function(name,player){
				if(player.hasSkill('keni')) return 5;
					else return 1;
			},
			result:{
				player:function(player){
					if(player.hasSkill('keni')) return 1;
					else return 0;
				},
			},
			threaten:1.5,
		},
		"_priority":0,
	},
	keni:{
		group:["keni_1","keni_2"],
		locked:true,
		subSkill:{
			"1":{
				trigger:{
					player:"damageBegin4",
				},
				forced:true,
				filter:function(event,player){
					if(event.num<=1) return false;
					return true;
				},
				content:function(){
					trigger.num=1;         //伤害值改为1
				},
				sub:true,
				"_priority":0,
			},
			"2":{
				trigger:{
					player:"loseAfter",
				},
				forced:true,
				filter:function(event,player){
					if(event.num<=1) return false;
					return true; 
				},
				content:function(){
					player.draw();
				},
				sub:true,
				"_priority":0,
			},
		},
		"_priority":0,
	},
	mopai:{
		enable:"phaseUse",
		content:function(){
			player.draw();
		},
		"_priority":0,
	},
	qipai:{
		enable:"phaseUse",
		position:"he",
		filterCard:true,
		selectCard:2,
		prompt:"弃置2牌并摸1牌",
		content:function(){
			player.draw();
		},
		"_priority":0,
	},
	faguang:{
		enable:"phaseUse",
		filter:function(event,player){
			return player.countCards('hs')>=1&&player.countCards('hs')<=player.maxHp;
		},
		usable:1,
		content:function(){
			'step 0'
			player.showHandcards();
			'step 1'
			var cards;
			cards = player.getCards('h',{suit:'club'});
			event.num=cards.length;
			'step 2'
			if(event.num){
				player.chooseTarget('请选择至多'+get.cnNumber(event.num)+'名角色，令这些角色各摸一张牌。',[1,event.num],function(card,player,target){
					return true;
				}).set('ai',function(target){
					return get.attitude(_status.event.player,target);
				});
			}
			'step 3'
			if(result.bool&&result.targets){
				event.targets=result.targets;
			}
			else{
				event.finish();
			}
			'step 4'
			if(targets&&targets.length){
				player.line(targets,'green');
				targets.sortBySeat();
				game.asyncDraw(targets);
			}
		},
		ai:{
			order:function(item,player){
				if(player.countCards('h',{suit:'club'})==1) return 10;
				return 0;
			},
			result:{
				player:1,
			},
		},
		"_priority":0,
	},
	jieli:{
		unique:true,
		zhuSkill:true,
		trigger:{
			player:["chooseToRespondBefore","chooseToUseBefore"],
		},
		filter:function(event,player){
			if(event.responded) return false;
			if(player.storage.jieliing) return false;
			if(!player.hasZhuSkill('jieli')) return false;
			if(!event.filterCard({name:'shan'},player,event)) return false;
			return game.hasPlayer(function(current){
				return current!=player&&current.group=='wu';
			});
		},
		check:function(event,player){
			if(get.damageEffect(player,event.player,player)>=0) return false;
			return true;
		},
		content:function(){
			"step 0"
			if(event.current==undefined) event.current=player.next;
			if(event.current==player){
				event.finish();
			}
			else if(event.current.group=='wu'){
				if((event.current==game.me&&!_status.auto)||(
					get.attitude(event.current,player)>2)||
					event.current.isOnline()){
					player.storage.jieliing=true;
					var next=event.current.chooseToRespond('是否替'+get.translation(player)+'打出一张闪？',{name:'shan'});
					next.set('ai',function(){
						var event=_status.event;
						return (get.attitude(event.player,event.source)-2);
					});
					next.set('skillwarn','替'+get.translation(player)+'打出一张闪');
					next.autochoose=lib.filter.autoRespondShan;
					next.set('source',player);
				}
			}
			"step 1"
			player.storage.jieliing=false;
			if(result.bool){
				event.finish();
				trigger.result={bool:true,card:{name:'shan',isCard:true}};
				trigger.responded=true;
				trigger.animate=false;
				if(typeof event.current.ai.shown=='number'&&event.current.ai.shown<0.95){
					event.current.ai.shown+=0.3;
					if(event.current.ai.shown>0.95) event.current.ai.shown=0.95;
				}
			}
			else{
				event.current=event.current.next;
				event.goto(0);
			}
		},
		ai:{
			respondShan:true,
			skillTagFilter:function(player){
				if(player.storage.jieliing) return false;
				if(!player.hasZhuSkill('jieli')) return false;
				return game.hasPlayer(function(current){
					return current!=player&&current.group=='wu';
				});
			},
		},
		"_priority":0,
	},
	mengshi:{
		marktext:"曜",
		unique:true,
		trigger:{
			source:"damageSource",
			player:"damageEnd",
		},
		filter:function(event,player){
			return event.num>0;
		},
		forced:true,
		content:function(){
			'step 0'
			player.addMark('mengshi',1);
			'step 1'
			player.draw();
		},
		intro:{
			name:"曜",
			content:"mark",
		},
		"_priority":0,
	},
	tianjiang:{
		skillAnimation:true,
		animationColor:"thunder",
		unique:true,
		juexingji:true,
		trigger:{
			player:"phaseZhunbeiBegin",
		},
		forced:true,
		derivation:"jiashang",
		filter:function(event,player){
			return !player.hasSkill('jiashang')&&player.storage.mengshi>=4;
		},
		content:function(){
			"step 0"
			player.gainMaxHp();
			player.chooseDrawRecover(2,true,function(event,player){
				if(player.hp==1&&player.isDamaged()) return 'recover_hp';
				return 'draw_card';
			});
			"step 1"
			player.removeSkill('mengshi');
			player.addSkill('jiashang');
			// player.addTempSkill(('mengshi2','gameDrawAfter'))
			player.awakenSkill('tianjiang');
		},
		"_priority":0,
	},
	jiashang:{
		trigger:{
			source:"damageBegin1",
		},
		filter:function(event,player){
			return event.num>0;
		},
		forced:true,
		content:function(){
			trigger.num++;
		},
		"_priority":0,
	},
	beiguo:{
		unique:true,
		global:"beiguo2",
		zhuSkill:true,
		"_priority":0,
	},
	"beiguo2":{
		enable:"phaseUse",
		discard:false,
		lose:false,
		delay:false,
		line:true,
		prepare:function(cards,player,targets){
			targets[0].logSkill('beiguo');
		},
		prompt:function(){
			var player=_status.event.player;
			var list=game.filterPlayer(function(target){
				return target!=player&&target.hasZhuSkill('beiguo',player);
			});
			var str='请选择场上的'+get.translation(list);
			return str;
		},
		filter:function(event,player){
			if(player.group!='shu') return false;
			if(player.countCards('h','sha')==0) return 0;
			return game.hasPlayer(function(target){
				return target!=player&&target.hasZhuSkill('beiguo',player)&&!target.hasSkill('beiguo3');
			});
		},
		log:false,
		visible:true,
		filterTarget:function(card,player,target){
			return target!=player&&target.hasZhuSkill('beiguo',player)&&!target.hasSkill('beiguo3');
		},
		content:function(){
			// 'syep 0'
			// player.chooseTarget('正在发动【背锅】','请选择王皓天',false,function(card,player,target){
			//         return target!=player&&target.hasZhuSkill('beiguo',player)&&!target.hasSkill('beiguo3');
			//     })
			'step 0'
			player.chooseCard('h',true,'请选择一张【杀】',{name:'sha'});
			'step 1'
			if(result.bool){
				player.give(result.cards,target);
				target.addTempSkill('beiguo3','phaseUseEnd');
				target.chooseToUse('是否使用这张【杀】？',result.cards[0]);

			}
			
		},
		ai:{
			expose:0.3,
			order:10,
			result:{
				target:5,
			},
		},
		"_priority":0,
	},
	"beiguo3":{
		"_priority":0,
	},
	tiaojiao:{
		trigger:{
			player:"phaseUseBegin",
		},
		content:function(){
			'step 0'
			player.judge(function(card){
				return get.color(card)=="red"?1:-1;
			});
			'step 1'
			if(result.judge==1){
				player.addTempSkill('tiaojiao2');
			}
			else player.addTempSkill('tiaojiao3');
		},
		"_priority":0,
	},
	"tiaojiao2":{
		trigger:{
			player:"useCardToPlayered",
		},
		forced:true,
		filter:function(event,player){
			return event.card.name=='sha'&&!event.getParent().directHit.contains(event.target);
		},
		logTarget:"target",
		content:function(){
			var id=trigger.target.playerid;
			var map=trigger.getParent().customArgs;
			if(!map[id]) map[id]={};
			if(typeof map[id].shanRequired=='number'){
				map[id].shanRequired++;
			}
			else{
				map[id].shanRequired=2;
			}
		},
		"_priority":0,
	},
	"tiaojiao3":{
		mod:{
			selectTarget:function(card,player,range){
				if(card.name=='sha'&&range[1]!=-1) range[1]++;
			},
		},
		charlotte:true,
		"_priority":0,
	},
	xiangshan:{
		trigger:{
			player:["loseAfter","gainAfter"],
			global:["equipAfter","addJudgeAfter","gainAfter","loseAsyncAfter","addToExpansionAfter"],
		},
		direct:true,
		filter:function(event,player){
			var num=event.getl(player).cards2.length;
			if(event.getg) num=Math.max(num,event.getg(player).length)
				return num>1;
		},
		content:function(){
			'step 0'
			player.chooseTarget(get.prompt('xiangshan'),'令一名其他角色摸一张牌',function(card,player,target){
				return target!=player;
			}).set('ai',function(target){
				return get.attitude(player,target);
			});
			'step 1'
			if(result.bool){
				player.logSkill('xiangshan',result.targets);
				result.targets[0].draw();
			}
		},
		ai:{
			expose:0.5,
		},
		"_priority":0,
	},
	weicao:{
		trigger:{
			player:"phaseUseEnd",
		},
		direct:true,
		filter:function(event,player){
			return (player.getHistory('useCard',function(evt){
				return evt.getParent('phaseUse')==event;
			}).length>=3);
		},
		content:function(){
			'step 0'
			player.chooseTarget("请选择〖微操〗的目标","对攻击范围内一名角色造成一点伤害",false,function(card,player,target){
				return player.inRange(target);
			}).ai=function(target){
				return -get.attitude(player,target);
			};
			'step 1'
			if(result.bool){
				player.line(result.targets);
				result.targets[0].damage();
			};
			
		},
		ai:{
			threaten:1.4,
			result:{
				target:-2,
			},
		},
		"_priority":0,
	},
	shugui:{
		trigger:{
			player:"compare",
			target:"compare",
		},
		filter:function(event){
			return !event.iwhile;
		},
		content:function(){
			'step 0'
			player.chooseControl('点数+2','点数-2','cancel2').set('prompt',get.prompt2('shugui')).set('ai',function(){
				if(_status.event.small) return 1;
				else return 0;
			}).set('small',trigger.small);
			'step 1'
			if(result.index!=2){
				player.logSkill('shugui');
				if(result.index==0){
					game.log(player,'拼点牌点数+2');
					if(player==trigger.player){
						trigger.num1+=2;
						if(trigger.num1>13) trigger.num1=13;
					}
					else{
						trigger.num2+=2;
						if(trigger.num2>13) trigger.num2=13;
					}
				}
				else{
					game.log(player,'拼点牌点数-2');
					if(player==trigger.player){
						trigger.num1-=2;
						if(trigger.num1<1) trigger.num1=1;
					}
					else{
						trigger.num2-=2;
						if(trigger.num2<1) trigger.num2=1;
					}
				}
			}

		},
		"_priority":0,
	},
	huanka:{
		mod:{
			suit:function(card,suit){
				if(suit=='spade') return 'heart';
			},
		},
		"_priority":0,
	},
	chuti:{
		enable:"phaseUse",
		position:"hs",
		viewAs:{
			name:"nanman",
		},
		filterCard:function(card,player){
			if(ui.selected.cards.length){
				return get.suit(card)==get.suit(ui.selected.cards[0]);
			}
			var cards=player.getCards('hs');
			for(var i=0;i<cards.length;i++){
				if(card!=cards[i]){
					if(get.suit(card)==get.suit(cards[i])) return true;
				}
			}
			return false;
		},
		selectCard:2,
		complexCard:true,
		check:function(card){
			var player=_status.event.player;
			var targets=game.filterPlayer(function(current){
				return player.canUse('nanman',current);
			});
			var num=0;
			for(var i=0;i<targets.length;i++){
				var eff=get.sgn(get.effect(targets[i],{name:'nanman'},player,player));
				if(targets[i].hp==1){
					eff*=1.5;
				}
				num+=eff;
			}
			if(!player.needsToDiscard(-1)){
				if(targets.length>=7){
					if(num<2) return 0;
				}
				else if(targets.length>=5){
					if(num<1.5) return 0;
				}
			}
			return 6-get.value(card);
		},
		ai:{
			basic:{
				order:8.5,
				useful:1,
				value:5,
			},
			wuxie:function(target,card,player,viewer){
				if(get.attitude(viewer,target)>0&&target.countCards('h','sha')){
					if(!target.countCards('h')||target.hp==1||Math.random()<0.7) return 0;
				}
			},
			result:{
				"target_use":function(player,target){
					if(player.hasUnknown(2)&&get.mode()!='guozhan') return 0;
					var nh=target.countCards('h');
					if(get.mode()=='identity'){
						if(target.isZhu&&nh<=2&&target.hp<=1) return -100;
					}
					if(nh==0) return -2;
					if(nh==1) return -1.7
					return -1.5;
				},
				target:function(player,target){
					var nh=target.countCards('h');
					if(get.mode()=='identity'){
						if(target.isZhu&&nh<=2&&target.hp<=1) return -100;
					}
					if(nh==0) return -2;
					if(nh==1) return -1.7
					return -1.5;
				},
				player(player, target) {
					if (player._nanman_temp || player.hasSkillTag("jueqing", false, target)) return 0;
					player._nanman_temp = true;
					let eff = get.effect(
						target,
						new lib.element.VCard({ name: "nanman" }),
						player,
						target
					);
					delete player._nanman_temp;
					if (eff >= 0) return 0;
					if (
						target.hp > 2 ||
						(target.hp > 1 &&
							!target.isZhu &&
							target != game.boss &&
							target != game.trueZhu &&
							target != game.falseZhu)
					)
						return 0;
					if (target.hp > 1 && target.hasSkillTag("respondSha", true, "respond", true))
						return 0;
					let known = target.getKnownCards(player);
					if (
						known.some((card) => {
							let name = get.name(card, target);
							if (name === "sha" || name === "hufu" || name === "yuchanqian")
								return lib.filter.cardRespondable(card, target);
							if (name === "wuxie")
								return lib.filter.cardEnabled(card, target, "forceEnable");
						})
					)
						return 0;
					if (
						target.hp > 1 ||
						target.countCards("hs", (i) => !known.includes(i)) >
							4.67 - (2 * target.hp) / target.maxHp
					)
						return 0;
					let res = 0,
						att = get.sgnAttitude(player, target);
					res -= att * (0.8 * target.countCards("hs") + 0.6 * target.countCards("e") + 3.6);
					if (get.mode() === "identity" && target.identity === "fan") res += 2.4;
					if (
						(get.mode() === "guozhan" &&
							player.identity !== "ye" &&
							player.identity === target.identity) ||
						(get.mode() === "identity" &&
							player.identity === "zhu" &&
							(target.identity === "zhong" || target.identity === "mingzhong"))
					)
						res -= 0.8 * player.countCards("he");
					return res;
				},
			},
			tag:{
				respond:1,
				respondSha:1,
				damage:1,
				multitarget:1,
				multineg:1,
			},
		},
		"_priority":0,
	},
	baquan:{
		trigger:{
			player:"phaseDiscardBefore",
		},
		forced:true,
		firstDo:true,
		filter:function(event,player){
			return player.hasZhuSkill('baquan')&&game.hasPlayer(function(current){
				return current.group=='shu';
			})&&player.countCards('h')>player.hp;
		},
		content:function(){},
		mod:{
			maxHandcard:function(player,num){
				if(player.hasZhuSkill('baquan')){
					return num+game.countPlayer(function(current){
						if(current.group=='shu') return 2;
					});
				}
				return num;
			},
		},
		zhuSkill:true,
		"_priority":0,
	},
	dzhchaoyong:{
		trigger:{
			player:"phaseZhunbeiBegin",
		},
		direct:true,
		filter:function(event,player){
			return player.countCards('h')>0;
		},
		content:function(){
			"step 0"
			player.chooseTarget(get.prompt2('dzhchaoyong'),function(card,player,target){
				return player.canCompare(target);
			}).set('ai',function(target){
				return -get.attitude(_status.event.player,target)/target.countCards('h');
			});
			"step 1"
			if(result.bool){
				event.target=result.targets[0];
				player.logSkill('dzhchaoyong',result.targets[0]);
				player.chooseToCompare(result.targets[0]);
			}
			else{
				event.finish();
			}
			"step 2"
			if(result.bool){
				player.storage.dzhchaoyong=event.target;
				player.addTempSkill('dzhchaoyong2');
				event.target.addTempSkill('dzhchaoyong_targeted');
			}
		},
		ai:{
			expose:0.5,
			threaten:1.3,
		},
		subSkill:{
			targeted:{
				charlotte:true,
				ai:{
					"unequip2":true,
				},
				sub:true,
				"_priority":0,
			},
			ai:{
				ai:{
					unequip:true,
				},
				sub:true,
				"_priority":0,
			},
		},
		"_priority":0,
	},
	"dzhchaoyong2":{
		charlotte:true,
		trigger:{
			player:"phaseDrawBegin2",
		},
		forced:true,
		filter:function(event,player){
			return !event.numFixed;
		},
		content:function(){
			trigger.num++;
		},
		mod:{
			maxHandcard:function(player,num){
				return num+1;
			},
			targetInRange:function(card,player,target){
				if(target==player.storage.dzhchaoyong) return true;
			},
		},
		"_priority":0,
	},
	danqie:{
		trigger:{
			player:["chooseToCompareAfter","compareMultipleAfter"],
			target:["chooseToCompareAfter","compareMultipleAfter"],
		},
		filter:function(event,player){
			if(event.preserve) return false;
			if(player==event.player){
				if(event.num1<=event.num2){
					return !get.owner(event.card1);
				}
			}
			else{
				if(event.num1>=event.num2){
					return !get.owner(event.card2);
				}
			}
		},
		check:function(event,player){
			if(player==event.player){
				if(event.num1<=event.num2){
					return event.card1.name!='du';
				}
			}
			else{
				if(event.num1>=event.num2){
					return event.card2.name!='du';
				}
			}
		},
		content:function(){
			if(player==trigger.player){
				if(trigger.num1<=trigger.num2){
					player.gain(trigger.card1,'gain2','log');
				}
			}
			else{
				if(trigger.num1>=trigger.num2){
					player.gain(trigger.card2,'gain2','log');
				}
			}
		},
		"_priority":0,
	},
	haoren:{
		enable:"phaseUse",
		filter:function(event,player){
			return (player.countCards('he',{type:'trick'})>=1)||(player.countCards('he',{type:'equip'})>=1);
		},
		usable:1,
		check:function(card){return 7-get.value(card);},
		position:"he",
		filterCard:function(card){
			return !(get.type(card)=="basic");
		},
		content:function(){
			'step 0'
			player.chooseTarget(false).set('ai',function(target){
				if(target.hp==1&&target.countCards('h')==0) return 10;
				if(target.hasSkillTag('maixie')&&(target.maxHp-target.hp)>0) return 8;
				if(target.hasSkillTag('maixie')) return 6;
				if(target.isDamaged())
					return (target.maxHp/target.hp)*Math.abs(get.attitude(_status.event.player,target))/10;
				else return 1;
			})
			'step 1'
			var list=['选项一','选项二'];
			var name=get.translation(result.targets[0]);
			event.target=result.targets[0];
			player.chooseControl(list).set('prompt','好人：请选择一项').set('choiceList',[name+'失去一点体力，然后摸一张牌',name+'弃一张牌，然后回复一点体力']).set('ai',function(){
				if(get.attitude(_status.event.player,event.target)>0) return list[1];
				return list[0];
			});
			'step 2'
			if(result.control=='选项一'){
				event.target.loseHp();
				event.target.draw();
				
			}
			else{
				if(event.target.countCards('hes')==0)
					event.target.recover();
				else{
					event.target.chooseToDiscard('he',true);
					event.target.recover();
				}
			}
		},
		ai:{
			threaten:1.4,
			order:function(item,player){
				if(player.countCards('he',{type:'equip'})+player.countCards('h',{type:'trick'})>1)
					return 1;
				else return 10;
			},
			result:{
				player:1,
			},
		},
		"_priority":0,
	},
	suoshi:{
		trigger:{
			player:"useCardAfter",
		},
		filter:function(event,player){
			if(!player.isPhaseUsing()) return false;
			if(player.countCards('h')==0) return false;
			return true;
		},
		content:function(){
			'step 0'
			player.showHandcards();
			'step 1'
			var cards=player.countCards('h',{type:'basic'})
			if(cards==0){
				player.draw();
			}
			else{
				player.chooseToDiscard('h',1,false,'你可以弃置一张手牌，或点击取消')
			}
		},
		"_priority":0,
	},
	wzrpaoxiao:{
		audio:"ext:三班杀:2",
		firstDo:true,
		trigger:{
			player:"useCard1",
		},
		forced:true,
		filter(event,player){
			return event.card.name=='sha'&&player.countUsed('sha',true)>1&&event.getParent().type=='phase';
		},
		async content(event,trigger,player){
			trigger.audioed=false;
		},
		mod:{
			cardUsable(card,player,num){
				if(card.name=='sha') return Infinity;
			},
		},
		ai:{
			unequip:true,
			skillTagFilter(player,tag,arg){
				if(!get.zhu(player,'shouyue')) return false;
				if(arg&&arg.name=='sha') return true;
				return false;
			},
		},
		"_priority":0,
	},
	shuaiqi:{
		trigger:{
			player:"phaseDrawBegin2",
		},
		direct:true,
		filter:function(event,player){
			return !event.numFixed;
		},
		content:function(){
			'step 0'
			player.chooseBool('是否发动【帅气】，多摸一张牌？','或点击取消，本回合手牌上限+1').ai=function(){
				if(player.hp==player.maxHp) return true;
				return player.countCards('h')<=player.hp;
			}
			'step 1'
			if(result.bool){
				trigger.num++;
			}
			else{
				player.addTempSkill('shuaiqi2');
			}
		},
		"_priority":0,
	},
	"shuaiqi2":{
		mod:{
			maxHandcard:function(player,num){
				return num+1;
			},
		},
		"_priority":0,
	},
	jianshen:{
		trigger:{
			player:["useCard","respond"],
		},
		forced:true,
		filter:function(event,player){
			return player.storage.jianshen==2
		},
		content:function(){
			'step 0'
			if(player.hp==player.maxHp){
				event.type=0;
				player.chooseBool(get.prompt('jianshen'),'摸一张牌',function(){
					return true;
				});
			}
			else{
				event.type=1;
				player.chooseControlList(get.prompt('jianshen'),'摸一张牌','回复一点体力',function(){
					if(player.hp==1||player.countCards('h')==0) return 1;
					return 0;
				});
			}
			'step 1'
			if(event.type){
				if(result.control!='cancel2'){
					player.logSkill('jianshen');
					if(result.index==0){
						player.draw();
					}
					else if(result.index==1){
						player.recover();
					}
				}
			}
			else{
				if(result.bool){
					player.draw();
				}
			}
		},
		group:["jianshen_clear","jianshen_count"],
		intro:{
			content:"仅仅是用来统计【健身】的玩意",
		},
		"_priority":0,
	},
	"jianshen_count":{
		trigger:{
			player:["useCard1","respond"],
		},
		silent:true,
		firstDo:true,
		init:function(player){
			player.storage.jianshen=0;
		},
		filter:function(event,player){
			return _status.currentPhase!=player;
		},
		content:function(){
			player.storage.jianshen+=1;
			player.markSkill('jianshen');
		},
		forced:true,
		popup:false,
		"_priority":1,
	},
	"jianshen_clear":{
		trigger:{
			player:"phaseBegin",
		},
		silent:true,
		content:function(){
			player.storage.jianshen=0;
			player.unmarkSkill('jianshen');
		},
		forced:true,
		popup:false,
		"_priority":1,
	},
	kaigua:{
		trigger:{
			player:"phaseZhunbeiBegin",
		},
		frequent:true,
		preHidden:true,
		content:function(){
			"step 0"
			var num=3;
			var cards=get.cards(num);
			game.cardsGotoOrdering(cards);
			var next=player.chooseToMove();
			next.set('list',[
				['牌堆顶',cards],
				['牌堆底'],
			]);
			next.set('prompt','开挂：点击将牌移动到牌堆顶或牌堆底');
			next.processAI=function(list){
				var cards=list[0][1],player=_status.event.player;
				var top=[];
				var judges=player.getCards('j');
				var stopped=false;
				if(!player.hasWuxie()){
					for(var i=0;i<judges.length;i++){
						var judge=get.judge(judges[i]);
						cards.sort(function(a,b){
							return judge(b)-judge(a);
						});
						if(judge(cards[0])<0){
							stopped=true;break;
						}
						else{
							top.unshift(cards.shift());
						}
					}
				}
				var bottom;
				if(!stopped){
					cards.sort(function(a,b){
						return get.value(b,player)-get.value(a,player);
					});
					while(cards.length){
						if(get.value(cards[0],player)<=5) break;
						top.unshift(cards.shift());
					}
				}
				bottom=cards;
				return [top,bottom];
			}
			"step 1"
			var top=result.moved[0];
			var bottom=result.moved[1];
			top.reverse();
			for(var i=0;i<top.length;i++){
				ui.cardPile.insertBefore(top[i],ui.cardPile.firstChild);
			}
			for(i=0;i<bottom.length;i++){
				ui.cardPile.appendChild(bottom[i]);
			}
			player.popup(get.cnNumber(top.length)+'上'+get.cnNumber(bottom.length)+'下');
			game.log(player,'将'+get.cnNumber(top.length)+'张牌置于牌堆顶');
			game.updateRoundNumber();
			game.delayx();
		},
		ai:{
			threaten:1.2,
		},
		"_priority":0,
	},
	jueding:{
		enable:"phaseUse",
		usable:1,
		filterTarget:function(card,player,target){
			return player.countCards('he')>=target.hp;
		},
		content:function(){
			'step 0'
			player.chooseToDiscard('he',target.hp,true);
			'step 1'
			if(target.isDamaged()){
				var num = target.maxHp-target.hp;
				target.draw(num);
			}
			target.turnOver();
		},
		ai:{
			threaten:1.4,
			order:function(item,player){
				if(player.countCards('hs')>player.hp) return 2;
				return 0;
			},
			result:{
				target:function(player,target){
					if(target.isTurnedOver()){
						return 3+target.maxHp-target.hp
					}
					if(target.hasSkillTag('noturn')) return target.maxHp-target.hp
					return target.maxHp-target.hp-4
				},
			},
		},
		"_priority":0,
	},
	fuse:{
		trigger:{
			global:"useCard1",
		},
		audio:"ext:三班杀:2",
		forced:true,
		firstDo:true,
		filter:function(event,player,card){
			if(get.color(event.card)!='black') return false;
			return event.card.name=='nanman'&&player!=event.player||event.card.name=='wanjian'&&player!=event.player||event.card.name=='taoyuan'&&player.hp<player.maxHp||event.card.name=='wugu';
		},
		content:function(){},
		mod:{
			targetEnabled:function(card){
				if((get.type(card)=='trick'||get.type(card)=='delay')&&
					get.color(card)=='black') return false;
			},
		},
		"_priority":0,
	},
	mdxjiushi:{
		group:["mdxjiushi_jiu","mdxjiushi_hui"],
		subSkill:{
			jiu:{
				enable:"chooseToUse",
				filterCard:{
					name:"tao",
				},
				viewAs:{
					name:"jiu",
				},
				viewAsFilter(player){
					if(!player.countCards('hs','tao')) return false;
				},
				position:"hs",
				prompt:"将一张桃当酒使用",
				check(){return 1},
				ai:{
					order:function(item,player){
						if(player.countCards('hs','tao')>(player.maxHp-player.hp)) return 5
						return 0
					},
					basic:{
						useful:(card,i)=>{
					if(_status.event.player.hp>1){
						if(i===0) return 4;
						return 1;
					}
					if(i===0) return 7.3;
					return 3;
				},
						value:(card,player,i)=>{
					if(player.hp>1){
						if(i===0) return 5;
						return 1;
					}
					if(i===0) return 7.3;
					return 3;
				},
					},
					result:{
						target:(player,target,card)=>{
					if(target&&target.isDying()) return 2;
					if(!target || target._jiu_temp || !target.isPhaseUsing()) return 0;
					let usable=target.getCardUsable('sha');
					if(!usable || lib.config.mode==='stone'&&!player.isMin()&&player.getActCount()+1>=player.actcount ) return 0;
					let effs={order:0},temp;
					target.getCards('hs',i=>{
						if(get.name(i)!=='sha' || ui.selected.cards.includes(i)) return false;
						temp=get.order(i,target);
						if(temp<effs.order) return false;
						if(temp>effs.order) effs={order:temp};
						effs[i.cardid]={
							card:i,
							target:null,
							eff:0
						};
					});
					delete effs.order;
					for(let i in effs){
						if(!lib.filter.filterCard(effs[i].card,target)) continue;
						game.filterPlayer(current=>{
							if(get.attitude(target,current)>=0 || !target.canUse(effs[i].card,current,null,true) || current.hasSkillTag('filterDamage',null,{
								player:target,
								card:effs[i].card,
								jiu:true
							})) return false;
							temp=get.effect(current,effs[i].card,target,player);
							if(temp<=effs[i].eff) return false;
							effs[i].target=current;
							effs[i].eff=temp;
							return false;
						});
						if(!effs[i].target) continue;
						if(target.hasSkillTag('directHit_ai',true,{
							target:effs[i].target,
							card:i
						},true) || usable===1&&(target.needsToDiscard()>Math.max(0,3-target.hp) || !effs[i].target.mayHaveShan(player,'use',effs[i].target.getCards(i=>{
							return i.hasGaintag('sha_notshan');
						})))){
							delete target._jiu_temp;
							return 1;
						}
					}
					delete target._jiu_temp;
					return 0;
				},
					},
					tag:{
						save:1,
						recover:0.1,
					},
				},
				sub:true,
				"_priority":0,
			},
			hui:{
				trigger:{
					player:"useCard",
				},
				direct:true,
				filter:function(event,player){
					return event.card.name=='jiu'&&(player.maxHp>player.hp)
				},
				content:function(){
					'step 0'
					player.chooseBool('是否发动【酒诗】，回复一点体力并翻面？').ai=function(){
						if(player.isTurnedOver()) return true;
						return player.hp<2&&(player.countCards('hs','tao')==0);
					};
					'step 1'
					if(result.bool){
						player.recover();
						player.turnOver();
					}
				},
				sub:true,
				"_priority":0,
			},
		},
		"_priority":0,
	},
	ranjin:{
		usable:1,
		trigger:{
			player:"useCardEnd",
		},
		check:function(event,player){
			return get.value(event.cards)+player.maxHp*2-18>0;
		},
		"prompt2":function(event,player){
			return '你可以减1点体力上限，然后获得'+get.translation(event.cards.filterInD())+'。';
		},
		filter:function(event,player){
			return get.type(event.card)=='trick'&&event.cards.filterInD().length>0;
		},
		content:function(){
			player.loseMaxHp();
			player.gain(trigger.cards.filterInD(),'gain2','log');
		},
		"_priority":0,
	},
	hxljiuchi:{
		enable:"chooseToUse",
		filterCard:function(card){
			return get.suit(card)=='club';
		},
		viewAs:{
			name:"jiu",
		},
		viewAsFilter:function(player){
			if(!player.countCards('hs',{suit:'club'})) return false;
			return true;
		},
		prompt:"将一张梅花手牌当酒使用",
		check:function(card){
			if(_status.event.type=='dying') return 1/Math.max(0.1,get.value(card));
			return 4-get.value(card);
		},
		ai:{
			threaten:1.3,
			basic:{
				useful:(card,i)=>{
					if(_status.event.player.hp>1){
						if(i===0) return 4;
						return 1;
					}
					if(i===0) return 7.3;
					return 3;
				},
				value:(card,player,i)=>{
					if(player.hp>1){
						if(i===0) return 5;
						return 1;
					}
					if(i===0) return 7.3;
					return 3;
				},
			},
			order:()=>{
				if(_status.event.dying) return 9;
				let sha=get.order({name:'sha'});
				if(sha>0) return sha+0.2;
				return 0;
			},
			result:{
				target:(player,target,card)=>{
					if(target&&target.isDying()) return 2;
					if(!target || target._jiu_temp || !target.isPhaseUsing()) return 0;
					let usable=target.getCardUsable('sha');
					if(!usable || lib.config.mode==='stone'&&!player.isMin()&&player.getActCount()+1>=player.actcount) return 0;
					let effs={order:0},temp;
					target.getCards('hs',i=>{
						if(get.name(i)!=='sha' || ui.selected.cards.includes(i)) return false;
						temp=get.order(i,target);
						if(temp<effs.order) return false;
						if(temp>effs.order) effs={order:temp};
						effs[i.cardid]={
							card:i,
							target:null,
							eff:0
						};
					});
					delete effs.order;
					for(let i in effs){
						if(!lib.filter.filterCard(effs[i].card,target)) continue;
						game.filterPlayer(current=>{
							if(get.attitude(target,current)>=0 || !target.canUse(effs[i].card,current,null,true) || current.hasSkillTag('filterDamage',null,{
								player:target,
								card:effs[i].card,
								jiu:true
							})) return false;
							temp=get.effect(current,effs[i].card,target,player);
							if(temp<=effs[i].eff) return false;
							effs[i].target=current;
							effs[i].eff=temp;
							return false;
						});
						if(!effs[i].target) continue;
						if(target.hasSkillTag('directHit_ai',true,{
							target:effs[i].target,
							card:i
						},true) || usable===1&&(target.needsToDiscard()>Math.max(0,3-target.hp) || !effs[i].target.mayHaveShan(player,'use',effs[i].target.getCards(i=>{
							return i.hasGaintag('sha_notshan');
						})))){
							delete target._jiu_temp;
							return 1;
						}
					}
					delete target._jiu_temp;
					return 0;
				},
			},
			tag:{
				save:1,
				recover:0.1,
			},
		},
		"_priority":0,
	},
	jingyang:{
		trigger:{
			player:"phaseUseBegin",
		},
		check:function(event,player){
			if(player.hp==1&&!player.countCards('h','tao')==0) return true;
			return player.hp+player.countCards('h')<4;
		},
		content:function(){
			'step 0'
			player.draw(2);
			player.recover();
			player.turnOver();
			'step 1'
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
			result:{
				player:1,
			},
		},
		"_priority":0,
	},
	byljiyu:{
		trigger:{
			player:"turnOverEnd",
		},
		direct:true,
		filter:function(event,player){
			if(player.isTurnedOver()) return false;
			return game.hasPlayer(function(current){
				return current.countCards('h')>0&&current!=player;
			});
		},
		content:function(){
			'step 0'
			player.chooseTarget(get.prompt('byljiyu'),'观看一名其他角色的手牌',function(card,player,target){
				return target!=player&&target.countCards('h')>0;
			}).set('ai',function(target){
				return -get.attitude(player,target);
			});
			'step 1'
			if(result.bool){
				player.logSkill('byljiyu',result.targets);
				player.viewHandcards(result.targets[0]);
			}
		},
		"_priority":0,
	},
	guxin:{
		skillAnimation:true,
		animationColor:"fire",
		unique:true,
		limited:true,
		enable:"phaseUse",
		filter(event,player){
			return game.countPlayer(current=>current!=player)>1;
		},
		filterCard:false,
		filterTarget(card,player,target){
			if(player==target) return false;
			// if(!target.hasSex('male')) return false;
			if(ui.selected.targets.length==1){
				return target.canUse({name:'juedou'},ui.selected.targets[0]);
			}
			return true;
		},
		targetprompt:["先出杀","后出杀"],
		selectTarget:2,
		multitarget:true,
		content:function(){
			player.awakenSkill('guxin');
			targets[0].addTempSkill("jiashangxian");
			targets[1].addTempSkill("jiashangxian");
			targets[1].useCard({name:'juedou',isCard:true},'nowuxie',targets[0],'noai');
			game.delay(0.5);
		},
		ai:{
			order:1,
			result:{
				target(player,target){
					if(ui.selected.targets.length==0){
						return -3;
					}
					else{
						return get.effect(target,{name:'juedou'},ui.selected.targets[0],target);
					}
				},
			},
			expose:0.4,
		},
		mark:true,
		intro:{
			content:"limited",
		},
		init:(player, skill) => player.storage[skill] = false,
		"_priority":0,
	},
	jiashangxian:{
		trigger:{
			source:"damageBefore",
		},
		forced:true,
		filter:function(event,player){
			// if(event._notrigger.includes(event.player)) return false;
			return (event.card&&event.card.name=='juedou'&&event.getParent().name=='juedou');
		},
		content:function(){
			player.gainMaxHp();
		},
		"_priority":0,
	},
	mingwang:{
		trigger:{
			player:"damageBegin4",
		},
		forced:true,
		filter:function (event,player){
			if(!player.hasEmptySlot(2)) return false;
			if(event.nature) return true;
			return get.type(event.card,'trick')=='trick'&&get.color(event.card)=='black';
		},
		content:function (){
			trigger.cancel();
		},
		ai:{
			notrick:true,
			nofire:true,
			nothunder:true,
			effect:{
				target:function (card,player,target,current){
					if(player==target&&get.subtype(card)=='equip2'){
						if(get.equipValue(card)<=8) return 0;
					}
					if(!target.hasEmptySlot(2)) return;
					if(get.tag(card,'natureDamage')) return 'zerotarget';
					if(get.type(card)=='trick'&&get.color(card)=='black'&&get.tag(card,'damage')){
						return 'zeroplayertarget';
					}
				},
			},
		},
		"_priority":0,
	},
	lunhui:{
		trigger:{
			player:["useCard","respond"],
		},
		frequent:true,
		filter:function(event,player){
			var using=player.storage.lunhui;
			return using%2==0&&get.type(event.card,false)=='basic';
		},
		content:function(){
			var using=player.storage.lunhui;
			if(using%2==0){
				player.draw();
			}
		},
		group:"lunhui_count",
		intro:{
			content:function(num){
				var str='<li>总次数：';
				str+=num;
				str+='<br><li>下一次摸牌：';
				str+=num%2;
				str+='/2';
				return str;
			},
		},
		"_priority":0,
	},
	"lunhui_count":{
		trigger:{
			player:["useCard1","respond"],
		},
		filter:function(event,player){
			return get.type(event.card,false)=='basic';
		},
		silent:true,
		firstDo:true,
		noHidden:true,
		init:function(player,skill){
			player.storage.lunhui=0;
		},
		content:function(){
			player.storage.lunhui+=1;
			player.markSkill('lunhui');
		},
		forced:true,
		popup:false,
		"_priority":1,
	},
	wenhao:{
		trigger:{
			source:"damageSource",
		},
		filter:function(event,player){
			return event.wenhaoCheck&&event.num>0;
		},
		direct:true,
		preHidden:true,
		content:function(){
			'step 0'
			event.num=trigger.num;
			'step 1'
			var choice;
			if(player.isDamaged()&&get.recoverEffect(player)>0&&(player.countCards('hs',function(card){
					return card.name=='sha'&&player.hasValueTarget(card);
				})>=player.getCardUsable('sha'))){
				choice='recover_hp';
			}
			else{
				choice='draw_card';
			}
			var next=player.chooseDrawRecover('###'+get.prompt(event.name)+'###摸一张牌或回复1点体力').set('logSkill',event.name);
			next.set('choice',choice);
			next.set('ai',function(){
				return _status.event.getParent().choice;
			});
			next.setHiddenSkill('wenhao');
			'step 2'
			if(result.control!='cancel2'){
				event.num--;
				if(event.num>0&&player.hasSkill('wenhao')){
					event.goto(1);
				}
			}
		},
		group:"wenhao_check",
		subSkill:{
			check:{
				charlotte:true,
				trigger:{
					source:"damage",
				},
				filter:function(event,player){
					return get.distance(player,event.player)<=1;
				},
				firstDo:true,
				silent:true,
				content:function(){
					trigger.wenhaoCheck=true;
				},
				sub:true,
				forced:true,
				popup:false,
				"_priority":1,
			},
		},
		"_priority":0,
	},
	toubi:{
		unique:true,
		limited:true,
		enable:"phaseUse",
		filter:function(event,player){
			return !player.storage.toubi;
		},
		init:function(player){
			player.storage.toubi=false;
		},
		mark:true,
		intro:{
			content:"limited",
		},
		skillAnimation:true,
		animationColor:"gray",
		content:function(){
			'step 0'
			var shas=player.getCards('h','sha');
			var num;
			if(player.hp>=4&&shas.length>=3){
				num=3;
			}
			else if(player.hp>=3&&shas.length>=2){
				num=2;
			}
			else{
				num=1
			}
			var map={};
			var list=[];
			for(var i=1;i<=player.hp;i++){
				var cn=get.cnNumber(i,true);
				map[cn]=i;
				list.push(cn);
			}
			event.map=map;
			player.awakenSkill('toubi');
			player.storage.toubi=true;
			player.chooseControl(list,function(){
				return get.cnNumber(_status.event.goon,true);
			}).set('prompt','失去任意点体力').set('goon',num);
			'step 1'
			var num=event.map[result.control]||1;
			player.storage.toubi2=num;
			player.loseHp(num);
			player.addTempSkill('toubi2');
		},
		ai:{
			order:2,
			result:{
				player:function(player){
					if(player.hp==1) return 0;
					var shas=player.getCards('h','sha');
					if(!shas.length) return 0;
					var card=shas[0];
					if(!lib.filter.cardEnabled(card,player)) return 0;
					if(lib.filter.cardUsable(card,player)) return 0;
					var mindist;
					if(player.hp>=4&&shas.length>=3){
						mindist=4;
					}
					else if(player.hp>=3&&shas.length>=2){
						mindist=3;
					}
					else{
						mindist=2;
					}
					if(game.hasPlayer(function(current){
						return (current.hp<=mindist-1&&
							get.distance(player,current,'attack')<=mindist&&
							player.canUse(card,current,false)&&
							get.effect(current,card,player,player)>0);
					})){
						return 1;
					}
					return 0;
				},
			},
		},
		"_priority":0,
	},
	"toubi2":{
		onremove:true,
		mod:{
			cardUsable:function(card,player,num){
				if(typeof player.storage.toubi2=='number'&&card.name=='sha'){
					return num+player.storage.toubi2;
				}
			},
			globalFrom:function(from,to,distance){
				if(typeof from.storage.toubi2=='number'){
					return distance-from.storage.toubi2;
				}
			},
		},
		"_priority":0,
	},
	lieshou:{
		trigger:{
			player:"damageEnd",
		},
		filter(event,player){
			return (event.source!=undefined);
		},
		check(event,player){
			return (get.attitude(player,event.source)<=0);
		},
		logTarget:"source",
		content:function(){
			player.useCard({name:'sha',isCard:true},trigger.source,false);
		},
		ai:{
			"maixie_defend":true,
			effect:{
				target(card,player,target){
					if(player.hasSkillTag('jueqing',false,target)) return [1,-1];
					return 0.8;
					// if(get.tag(card,'damage')&&get.damageEffect(target,player,player)>0) return [1,0,0,-1.5];
				},
			},
		},
		"_priority":0,
	},
	longzhan:{
		trigger:{
			player:"useCard1",
		},
		filter:function(event,player){
			if(!player.hasEmptySlot(1)) return false;
			return (event.card.name=='sha'&&!game.hasNature(event.card))
		},
		check:function(event,player){
			var eff=0;
			for(var i=0;i<event.targets.length;i++){
				var target=event.targets[i];
				var eff1=get.damageEffect(target,player,player);
				var eff2=get.damageEffect(target,player,player,'fire');
				eff+=eff2;
				eff-=eff1;
			}
			return eff>=0;
		},
		content:function(){
			game.setNature(trigger.card,'fire');
			if(get.itemtype(trigger.card)=='card'){
				var next=game.createEvent('zhuque_clear');
				next.card=trigger.card;
				event.next.remove(next);
				trigger.after.push(next);
				next.setContent(function(){
					game.setNature(trigger.card,[]);
				});
			}
		},
		"_priority":0,
	},
	juanqi:{
		trigger:{
			player:"damageEnd",
		},
		direct:true,
		content:function(){
			"step 0"
			event.count=trigger.num;
			"step 1"
			event.count--;
			player.chooseTarget(get.prompt2('juanqi'),function(card,player,target){
				return true;//target.countCards('h')<Math.min(target.maxHp,5);
			}).set('ai',function(target){
				var att=get.attitude(_status.event.player,target);
				if(target.hasSkillTag('nogain')) att/=6;
				if(att>2){
					return Math.max(0,Math.min(5,target.maxHp)-target.countCards('h'));
				}
				return att/3;
			});
			"step 2"
			if(result.bool){
				player.logSkill('juanqi',result.targets);
				for(var i=0;i<result.targets.length;i++){
					result.targets[i].drawTo(Math.min(5,result.targets[i].maxHp));
				}
				if(event.count&&player.hasSkill('juanqi')) event.goto(1);
			}
		},
		ai:{
			maixie:true,
			"maixie_hp":true,
			effect:{
				target:function(card,player,target,current){
					if(get.tag(card,'damage')&&target.hp>1){
						if(player.hasSkillTag('jueqing',false,target)) return [1,-2];
						var max=0;
						var players=game.filterPlayer();
						for(var i=0;i<players.length;i++){
							if(get.attitude(target,players[i])>0){
								max=Math.max(Math.min(5,players[i].hp)-players[i].countCards('h'),max);
							}
						}
						switch(max){
							case 0:return 2;
							case 1:return 1.5;
							case 2:return [1,2];
							default:return [0,max];
						}
					}
					if((card.name=='tao'||card.name=='caoyao')&&
						target.hp>1&&target.countCards('h')<=target.hp) return [0,0];
				},
			},
		},
		"_priority":0,
	},
	tuidao:{
		enable:"phaseUse",
		usable:1,
		content:function(){
			"step 0"
			player.judge();
			"step 1"
			// player.storage.tuidao1=result.number;
			// player.storage.tuidao2=result.color;
			player.chooseToDiscard('h',false,'弃置一张与判定牌相同点数或花色的手牌',function(card){
				return get.suit(card)==result.suit||get.number(card)==result.number;
			}).ai=function(card){
				return 4-get.value(card);
			};
			"step 2" 
			if(result.bool){
				player.chooseDrawRecover(2,true,function(event,player){
					if(player.hp==1&&player.isDamaged()) return 'recover_hp';
					return 'draw_card';
				});
			}
		},
		ai:{
			order:7,
			result:{
				player:1,
			},
		},
		"_priority":0,
	},
	saoqi:{
		trigger:{
			target:"useCardToTargeted",
		},
		check:function(event,player){
			// return get.effect(player,event.card,event.player,player)<0;
			return get.attitude(player,event.player)<0;
		},
		filter:function(event,player){
			return event.card.name=='sha'&&event.player.countCards('h')>0;
		},
		content:function(){
			player.discardPlayerCard(trigger.player,'h',true).set('ai',function(button){
				if(!_status.event.att) return 0;
				return 1;
			}).set('att',get.attitude(player,trigger.target)<=0);
		},
		ai:{
			threaten:0.7,
			effect:{
				target:function(card,player,target){
					if(player.countCards('he')>1&&get.tag(card,'damage')){
						if(get.attitude(target,player)<0) return [1,0.8];
					}
				},
			},
		},
		"_priority":0,
	},
	tiangou:{
		enable:"phaseUse",
		usable:1,
		filter:function(event,player){
			return player.countCards('h',{color:'red'});
		},
		filterCard:function(card){
			return get.color(card)=='red';
		},
		filterTarget:function(card,player,target){
			return player!=target;
		},
		check:function(card){
			return 10-get.value(card);
		},
		content:function(){
			"step 0"
			player.give(cards,target);
			"step 1"
			// target.addTempSkill("tiangou2",{player:'phaseBefore'});
			// target.addMark('tiangou2');
			target.addSkill('tiangou2');
			target.addMark('tiangou2',1,false);
			player.when(['phaseBegin','dieBegin']).then(()=>{
				target.removeMark('tiangou2',1,false);
				if(!target.hasMark('tiangou2')) target.removeSkill('tiangou2');
			}).vars({target:target});
		},
		ai:{
			order:8,
			result:{
				target:function (player,target){
					if(target.hp==1) return 3;
					return 2;
				},
			},
		},
		"_priority":0,
	},
	"tiangou2":{
		trigger:{
			target:"useCardToTarget",
		},
		direct:true,
		filter(event,player){
			if(event.card.name!='sha') return false;
			return game.hasPlayer(current=>{
				return current!=event.player&&
					current!=player&&current.hasSkill('tiangou');
			});
		},
		content:function(){
			"step 0"
			player.chooseTarget(get.prompt('tiangou2'),'转移此【杀】的目标',function(card,player,target){
				return target.hasSkill('tiangou');
			}).set('ai',function(target){
				var player=_status.event.player;
				if(player.hp==player.maxHp) return 0;
				if(player.hasSkillTag('maixie')&&player.hp!=1) return 0;
				if(target.hp>1&&target.hasSkill('tiangou')) return 10;
				return 1;
			});
			"step 1"
			if(result.bool){
				// const evt=trigger.getParent();
				// evt.triggeredTargets2.remove(player);
				// evt.targets.remove(player);
				// evt.targets.push(result.target[0]);
				// player.chat("童志成是傻逼");
				result.targets[0].logSkill('tiangou');
				var target=result.targets[0];
				var evt=trigger.getParent();
				evt.triggeredTargets2.remove(player);
				evt.targets.remove(player);
				evt.targets.push(target);
			}
		},
		intro:{
			content:"可以把【杀】的目标转移给童志成",
		},
		"_priority":0,
	},
	haodu:{
		enable:"phaseUse",
		usable:1,
		filterTarget:function (card,player,target){
			return player!=target&&target.countCards('he');
		},
		content:function(){
			"step 0"
			target.judge()
			"step 1"
			player.storage.haodu = result.number
			player.judge()
			"step 2"
			var her = result.number
			// player.chat("判定结果为"+typeof(player.storage.haodu))
			if(her>player.storage.haodu&&target.countGainableCards(player,'he')){
				player.gainPlayerCard(target,true,'he');
			}
		},
		ai:{
			order:9,
			result:{
				target:-0.5,
				player:0.5,
			},
		},
		"_priority":0,
	},
	qianwang:{
		trigger:{
			global:"judge",
		},
		direct:true,
		filter:function(event,player){
			return player.countCards('hes')>0;
		},
		content:function(){
			"step 0"
			player.chooseCard(get.translation(trigger.player)+'的'+(trigger.judgestr||'')+'判定为'+
			get.translation(trigger.player.judging[0])+'，'+get.prompt('qianwang'),'hes',function(card){
				var player=_status.event.player;
				var mod2=game.checkMod(card,player,'unchanged','cardEnabled2',player);
				if(mod2!='unchanged') return mod2;
				var mod=game.checkMod(card,player,'unchanged','cardRespondable',player);
				if(mod!='unchanged') return mod;
				return true;
			}).set('ai',function(card){
				var trigger=_status.event.getTrigger();
				var player=_status.event.player;
				var judging=_status.event.judging;
				var result=trigger.judge(card)-trigger.judge(judging);
				var attitude=get.attitude(player,trigger.player);
				if(attitude==0||result==0) return 0;
				if(attitude>0){
					return result-get.value(card)/2;
				}
				else{
					return -result-get.value(card)/2;
				}
			}).set('judging',trigger.player.judging[0]);
			"step 1"
			if(result.bool){
				player.respond(result.cards,'qianwang','highlight','noOrdering');
			}
			else{
				event.finish();
			}
			"step 2"
			if(result.bool){
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
				trigger.player.judging[0]=result.cards[0];
				trigger.orderingCards.addArray(result.cards);
				game.log(trigger.player,'的判定牌改为',result.cards[0]);
				game.delay(2);
			}
		},
		ai:{
			rejudge:true,
			tag:{
				rejudge:1,
			},
		},
		"_priority":0,
	},
	guangchi:{
		unique:true,
		zhuSkill:true,
		group:"guangchi2",
		"_priority":0,
	},
	"guangchi2":{
		trigger:{
			global:"phaseDiscardAfter",
		},
		filter:function(event,player){
			if(event.player!=player&&event.player.isIn()&&event.player.group=='wu'){
				return event.player.getHistory('lose',function(evt){
					return evt.type=='discard'&&evt.getParent('phaseDiscard')==event&&evt.hs.someInD('d');
				}).length>0;
			}
			return false;
		},
		direct:true,
		content:function(){
			'step 0'
			trigger.player.chooseBool('是否响应【逛吃】，令'+get.translation(player)+'获得你弃置的牌？').set('choice',get.attitude(trigger.player,player)>0);
			'step 1'
			if(result.bool){
				player.logSkill('guangchi2');
				trigger.player.line(player,'green');
				var cards=[],cards2=[];
				var target=trigger.player;
				game.getGlobalHistory('cardMove',function(evt){
					if(evt.name=='cardsDiscard'){
						if(evt.getParent('phaseDiscard')==trigger){
							var moves=evt.cards.filterInD('d');
							cards.addArray(moves);
							cards2.removeArray(moves);
						}
					}
					if(evt.name=='lose'){
						if(evt.type!='discard'||evt.position!=ui.discardPile||evt.getParent('phaseDiscard')!=trigger) return;
						var moves=evt.cards.filterInD('d');
						cards.addArray(moves);
						if(evt.player==target) cards2.addArray(moves);
						else cards2.removeArray(moves);
					}
				});
				if(!cards2.length) event.finish();
				else{
					player.gain(cards,'gain2')
				}
			}
		},
		"_priority":0,
	},
	kongqiu:{
		trigger:{
			player:"useCardToPlayered",
		},
		direct:true,
		filter:function(event,player){
			if(!event.isFirstTarget) return false;
			if(!['basic','trick'].includes(get.type(event.card))) return false;
			if(get.tag(event.card,'damage')) return game.hasPlayer(function(current){
				return event.targets.includes(current)&&current.countCards('h')>=player.countCards('h')&&current.countCards('he')>0;
			});
			return false;
		},
		content:function(){
			'step 0'
			player.chooseTarget(get.prompt('kongqiu'),'将一名手牌数不小于你的目标角色的一张牌置于你的武将牌上，称为「球」',function(card,player,target){
				return _status.event.targets.includes(target)&&target.countCards('h')>=player.countCards('h')&&target.countCards('he')>0;
			}).set('ai',function(target){
				return (1-get.attitude(_status.event.player,target))/target.countCards('he');
			}).set('targets',trigger.targets);
			'step 1'
			if(result.bool){
				var target=result.targets[0];
				event.target=result.targets[0];
				player.logSkill('kongqiu',target);
				player.choosePlayerCard(target,'he',true).ai=get.buttonValue;
			}
			else event.finish();
			'step 2'
			if(result.bool){
				var card=result.links[0];
				player.addToExpansion(card,'give','log',target).gaintag.add('kongqiu');
			}
		},
		onremove:function(player,skill){
			var cards=player.getExpansions(skill);
			if(cards.length) player.loseToDiscardpile(cards);
		},
		marktext:"球",
		intro:{
			content:"expansion",
			markcount:"expansion",
		},
		"_priority":0,
	},
	chongci:{
		trigger:{
			player:"phaseZhunbeiBegin",
		},
		forced:true,
		unique:true,
		juexingji:true,
		skillAnimation:true,
		animationColor:"thunder",
		derivation:"zjhshemen",
		filter:function(event,player){
			return player.getExpansions('kongqiu').length>=3;
		},
		content:function(){
			'step 0'
			player.awakenSkill('chongci');
			var cards=player.getExpansions('kongqiu');
			if(!cards.length||!player.countCards('h')){
				event.goto(2);
				return;
			}
			var next=player.chooseToMove('控球：是否交换“球”和手牌？');
			next.set('list',[
				[get.translation(player)+'（你）的“球”',cards],
				['手牌区',player.getCards('h')],
			]);
			next.set('filterMove',function(from,to){
				return typeof to!='number';
			});
			next.set('processAI',function(list){
				var player=_status.event.player,cards=list[0][1].concat(list[1][1]).sort(function(a,b){
					return get.value(a)-get.value(b);
				}),cards2=cards.splice(0,player.getExpansions('kongqiu').length);
				return [cards2,cards];
			});
			'step 1'
			if(result.bool){
				var pushs=result.moved[0],gains=result.moved[1];
				pushs.removeArray(player.getExpansions('kongqiu'));
				gains.removeArray(player.getCards('h'));
				if(!pushs.length||pushs.length!=gains.length) return;
				player.addToExpansion(pushs).gaintag.add('kongqiu');
				player.gain(gains,'gain2','log');
			}
			'step 2'
			player.addSkills('zjhshemen');
			game.log(player,'获得了技能','#g【射门】');
			player.loseMaxHp();
		},
		"_priority":0,
	},
	zjhshemen:{
		enable:"phaseUse",
		filter:function(event,player){
			return player.getExpansions('kongqiu').length>0;
		},
		filterTarget:function(card,player,target){
			return target.countDiscardableCards(player,'he')>0;
		},
		content:function(){
			'step 0'
			player.chooseCardButton(player.getExpansions('kongqiu'),1,'请选择需要弃置的“球”',true).ai=function(button){
				return 6-get.value(button.link);
			};
			'step 1'
			if(result.bool){
				var cards=result.links;
				player.loseToDiscardpile(cards);
				player.discardPlayerCard(target,'he',1,true);
				target.addTempSkill('zjhshemen2');
				player.addTempSkill('zjhshemen3');
			}
		},
		ai:{
			order:10,
			result:{
				target:-1,
			},
		},
		"_priority":0,
	},
	"zjhshemen2":{
		charlotte:true,
		"_priority":0,
	},
	"zjhshemen3":{
		onremove:true,
		mod:{
			globalFrom:function(from,to){
				if(to.hasSkill('zjhshemen2')) return -Infinity;
			},
		},
		"_priority":0,
	},
	lingdui:{
		unique:true,
		global:"lingdui2",
		zhuSkill:true,
		"_priority":0,
	},
	"lingdui2":{
		enable:"phaseUse",
		prompt:function(){
			var player=_status.event.player;
			var list=game.filterPlayer(function(target){
				return target.hasZhuSkill('lingdui',player)&&player.canCompare(target);
			});
			var str='和'+get.translation(list);
			if(list.length>1) str+='中的一人';
			str+='进行拼点。若你没赢，其可以将两张拼点牌作为【球】。';
			return str;
		},
		filter:function(event,player){
			if(player.group!='wei'||player.countCards('h')==0) return false;
			return game.hasPlayer(function(target){
				return target.hasZhuSkill('lingdui',player)&&player.canCompare(target);
			});
		},
		filterTarget:function(card,player,target){
			return target.hasZhuSkill('lingdui',player)&&player.canCompare(target);
		},
		log:false,
		prepare:function(cards,player,targets){
			targets[0].logSkill('lingdui');
		},
		usable:1,
		content:function(){
			"step 0"
			if(target.storage.chongci){
				target.chooseControl('拒绝','不拒绝').set('prompt','是否拒绝【领队】拼点？').set('choice',get.attitude(target,player)<=0);
			}
			else{
				event.forced=true;
			}
			"step 1"
			if(!event.forced&&result.control=='拒绝'){
				game.log(target,'拒绝了拼点');
				target.chat('拒绝');
				event.finish();
				return;
			}
			player.chooseToCompare(target,function(card){
				if(card.name=='du') return 20;
				var player=get.owner(card);
				var target=_status.event.getParent().target;
				if(player!=target&&get.attitude(player,target)>0){
					return -get.number(card);
				}
				return get.number(card);
			}).set('preserve','lose');
			"step 2"
			if(result.bool==false){
				var list=[];
				if(get.position(result.player)=='d') list.push(result.player);
				if(get.position(result.target)=='d') list.push(result.target);
				if(!list.length) event.finish();
				else{
					event.list=list;
					target.addToExpansion(event.list,'gain2').gaintag.add('kongqiu');
				}
			}
			else event.finish();
		},
		ai:{
			basic:{
				order:1,
			},
			expose:0.2,
			result:{
				target:function(player,target){
					if(player.countCards('h','du')&&get.attitude(player,target)<0) return -1;
					if(player.countCards('h')<=player.hp) return 0;
					var maxnum=0;
					var cards2=target.getCards('h');
					for(var i=0;i<cards2.length;i++){
						if(get.number(cards2[i])>maxnum){
							maxnum=get.number(cards2[i]);
						}
					}
					if(maxnum>10) maxnum=10;
					if(maxnum<5&&cards2.length>1) maxnum=5;
					var cards=player.getCards('h');
					for(var i=0;i<cards.length;i++){
						if(get.number(cards[i])<maxnum) return 1;
					}
					return 0;
				},
			},
		},
		"_priority":0,
	},
};

export default skills;
