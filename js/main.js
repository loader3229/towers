

// ------------------------------------------------------------------------------------------ Initialization


let touchPos = null;
let currentRebind = "";
let currentRebindEvent = null;

let inRiftMode = false;

function init() {
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d", { alpha: false });

    initTabs();

    document.body.onresize = (e) => { canvasDirty = true; }
    document.body.onkeydown = (e) => {
        let key = e.key.toLowerCase();
        if (currentRebind) {
            for (let keys in game.options.keys) {
                let index = game.options.keys[keys].indexOf(key);
                if (index >= 0) { 
                    game.options.keys[keys].splice(index, 1);
                    break;
                }
            }
            game.options.keys[currentRebind].push(key);
            game.options.keys[currentRebind].sort();
            currentRebindEvent();
            currentRebind = "";
            currentRebindEvent = null;
        } else if (game.tipStage >= 2) {
                 if (game.options.keys.up.includes(key)) movePlayer([0, 1]);
            else if (game.options.keys.down.includes(key)) movePlayer([0, -1]);
            else if (game.options.keys.right.includes(key)) movePlayer([1, 0]);
            else if (game.options.keys.left.includes(key)) movePlayer([-1, 0]);
        }
    }
    tipbox.onclick = (e) => {
        if (tips[game.tipStage].advClick) {
            game.tipStage++;
            hideTip();
            setTimeout(showTip, 500);
        } else if (tips[game.tipStage].disClick) {
            game.tipShown = false;
            hideTip();
        }
    }

    touchdiv.ontouchstart = /* touchdiv.onmousedown = */ (e) => {
        touchPos = [e.pageX, e.pageY];
        canvasDirty = true;
    }
    touchdiv.ontouchmove = /* touchdiv.onmousemove = */ (e) => {
        if (touchPos) {
            let tPos = [e.pageX - touchPos[0], e.pageY - touchPos[1]];
            if (game.options.touchScheme == 1 && tPos[0] ** 2 + tPos[1] ** 2 > 2500) {
                if (Math.abs(tPos[0]) > Math.abs(tPos[1])) movePlayer([Math.sign(tPos[0]), 0]);
                else movePlayer([0, -Math.sign(tPos[1])]);
                touchPos = [e.pageX, e.pageY];
            } else if (game.options.touchScheme == 2) {
                if (tPos[0] ** 2 + tPos[1] ** 2 > 2500) {
                    if (Math.abs(tPos[0]) > Math.abs(tPos[1])) dPadDir = [Math.sign(tPos[0]), 0];
                    else dPadDir = [0, -Math.sign(tPos[1])];
                } else dPadDir = null;
                canvasDirty = true;
            }
        }
    }
    touchdiv.ontouchend = /* touchdiv.onmouseup = */ (e) => {
        let tPos = [e.pageX - touchPos[0], e.pageY - touchPos[1]];
        if (game.options.touchScheme == 0 && tPos[0] ** 2 + tPos[1] ** 2 > 100) {
            if (Math.abs(tPos[0]) > Math.abs(tPos[1])) movePlayer([Math.sign(tPos[0]), 0]);
            else movePlayer([0, -Math.sign(tPos[1])]);
        }
        touchPos = null;
        dPadDir = null;
        canvasDirty = true;
    }
    
    load();

    if (!game.level || isLevelCompleted()) {
        game.levelBase = makeLevel(1);
        game.level = fixLevel(JSON.parse(JSON.stringify(game.levelBase)));
    } else if (!getPlayerPos()) {
        game.level = fixLevel(JSON.parse(JSON.stringify(game.levelBase)));
    }
    
    powerbox.innerHTML = format(game.power, 0);
    if (game.pointsTotal.gt(0)) {
        famebox.innerHTML = format(game.points, 0);
        famebox.classList.remove("hidden");
    }
    if (game.upgrades.f2_3.gt(0)) {
        lootbox.innerHTML = format(game.loot, 0);
        lootbox.classList.remove("hidden");
    }
    if (game.upgrades.l3_4) {
        brickbox.innerHTML = format(game.bricks, 0);
        brickbox.classList.remove("hidden");
    }
    if (game.manaTotal.gt(0)) {
        manabox.innerHTML = format(game.mana, 0);
        manabox.classList.remove("hidden");
        karmabox.innerHTML = format(game.karma, 0);
        karmabox.classList.remove("hidden");
    }
    if (game.upgrades.m2) {
        elemitebox.innerHTML = format(game.elemite, 0);
        elemitebox.classList.remove("hidden");
    }
    menu.classList.remove("hidden");

    now = Date.now();
    gameLoop();

    if (game.tipShown) showTip();
    updateGUI();

    console.log("Loaded");
}

function makeAddEffect(elem, diff) {
    elem.classList.remove("addEffect");
    elem.offsetWidth;
    elem.setAttribute("diff", diff);
    elem.classList.add("addEffect");

    if (elem.id == "famebox" && game.auto.fameUpg && game.upgrades.k2) buyMaxType("points");
    if (elem.id == "lootbox" && game.auto.lootUpg && game.upgrades.k2_1) buyMaxType("loot");
    if (elem.id == "brickbox" && game.auto.brickUpg && game.upgrades.k2_2) buyMaxType("bricks");
    if (elem.id == "manabox" && game.auto.manaUpg && game.upgrades.k2_3) buyMaxType("mana");
    if (elem.id == "karmabox" && game.auto.karmaUpg && game.upgrades.k2_4) buyMaxType("karma");

    if (currentTab == "grimoire" && tabSubtabs.grimoire == "ritual") updateRitualGUI();
}

function updateGUI() {
    tabButtons.grimoire.style.display = game.upgrades.b4_3 ? "" : "none";
    tabButtons.auto.style.display = game.upgrades.k2 ? "" : "none";
}

// ------------------------------------------------------------------------------------------ Tower Logic

function getPlayerPos() {
    let x = 0;
    for (tower of game.level) {
        let y = 0;
        for (cell of tower) {
            for (obj of cell) {
                if (obj[0] == "player") return [x, y];
            }
            y++;
        }
        x++;
    }
    return null;
}

function getTower(x) {
    if (!game.level[x]) return null;
    return game.level[x];
}

function getTile(pos) {
    if (!game.level[pos[0]] || !game.level[pos[0]][pos[1]]) return null;
    return game.level[pos[0]][pos[1]];
}

function isLevelCompleted() {
    return game.level[game.level.length - 1].length == 1 && getTile([game.level.length - 1, 0])[0][0] == "player";
}

function movePlayer(offset) {
    let pPos = getPlayerPos();
    if (!pPos) return;
    let pTile = getTile(pPos);
    let tile = getTile([pPos[0] + offset[0], pPos[1] + offset[1]]);
    if (!tile) return;

    if (offset[0] == -1) return;
    else if (offset[0] == 1 && getTower(pPos[0]).length > 1) return;

    player = pTile.shift();

    let playerFail = false;

    if (!tile[0]) {
        tile.unshift(player);
    } else if (tile[0][0] == "enemy") {
        if (player[1].gte(tile[0][1]) || game.spells.ice > 0) {
            let gain = tile[0][1].pow(upgEffect("l3_1").add(1)).pow(upgEffect("b4").add(1));
            if (game.upgrades.k3_5.gt(0)) gain = EN.tetr(10, gain.max(1).slog().add(upgEffect("k3_5")));
            if (game.upgrades.l3_7){
				player[1] = player[1].mul(gain);
            makeAddEffect(powerbox, "×" + format(gain, 0));
            }else{
				player[1] = player[1].add(gain);
            makeAddEffect(powerbox, "+" + format(gain, 0));
			}
			game.power = player[1];
            powerbox.innerHTML = format(game.power, 0);
            tile.shift();
            tile.unshift(player);
			if(game.upgrades.fk){
				
		let gain = player[1].max(1).log10().pow(1.5);
		let tetr = upgEffect("k1");
        //if (game.spells.fire > 0) tetr = tetr.mul(upgEffect("e2"));
        if (game.upgrades.k1.gt(0)) {
			if(gain.gte(EN.tetr(10,1e15))){
				gain = EN.tetr(10,gain.slog().add(tetr));
			}else gain = gain.tetr(tetr);
		}
		if(gain.gte(1e100))gain=gain.log10().pow(50);
		if(gain.gte("ee10")){
			gain=gain.slog().pow(10).mul(10/59049);
			if(gain.gte(100))gain=gain.log10().mul(50);
			gain=EN.pow(10,EN.pow(10,gain));
		}
		if(game.upgrades.pow1){
			gain = gain.mul(upgEffect("pow1"));
		}
		if(game.upgrades.pow5){
			gain = gain.mul(upgEffect("pow5"));
		}
        if(gain.gte(0))gain = gain.pow(upgEffect("f1_2")).mul(upgEffect("f1")).mul(upgEffect("l1")).pow(upgEffect("f1_1")).pow(upgEffect("l1_1")).pow(upgEffect("b1"));
		gain = gain.pow(game.misc.fameRitual);

		gain = gain.div(100);
		
		
if(sha512_256(localStorage.supporterCode+"loader3229").slice(2) == '97b4061c3a44e2950549613ba148eff34250441a9b3121698a15fcefdb4f5a')gain = gain.mul(2);

        if (game.upgrades.l3_14) {
            let oldPoints = game.points;
            game.points = game.points.mul(gain).max(gain);
            game.pointsTotal = game.pointsTotal.add(game.points.sub(oldPoints));
            makeAddEffect(famebox, "×" + format(gain, 0));
        } else {
            game.points = game.points.add(gain);
            game.pointsTotal = game.pointsTotal.add(gain);
            makeAddEffect(famebox, "+" + format(gain, 0));
        }
		
        famebox.innerHTML = format(game.points, 0);
			}
			if(game.upgrades.lk){
				let gain=upgEffect("lk");
				
				if (game.upgrades.pow21) {
					let oldLoot = game.loot;
					game.loot = game.loot.mul(gain).max(gain);
					game.lootTotal = game.lootTotal.add(game.loot.sub(oldLoot));
					makeAddEffect(lootbox, "×" + format(gain, 0));
				} else {
					game.loot = game.loot.add(gain);
					game.lootTotal = game.lootTotal.add(gain);
					makeAddEffect(lootbox, "+" + format(gain, 0));
				}
        lootbox.innerHTML = format(game.loot, 0);
			}
			if(game.upgrades.bk){
            let bricks = 0.1;
            if (game.upgrades.b3.gt(0)) {
				let llpower = player[1].max(1e10).log10().log10();
				if(llpower.gte(1000))llpower=llpower.log10().pow(5).div(243).mul(1000).min(1e13);
				bricks = llpower.pow(upgEffect("b3")).mul(bricks);
			}
            if (game.upgrades.b3_1.gt(0)) bricks = game.upgrades.f2.add(1).pow(upgEffect("b3_1")).mul(bricks);
            if (game.upgrades.b3_2.gt(0)) bricks = game.points.max("ee10").iteratedlog(10, EN(3)).pow(upgEffect("b3_2")).mul(bricks);
            if (game.upgrades.b3_3.gt(0)) bricks = game.loot.max(1e10).log10().log10().pow(upgEffect("b3_3")).mul(bricks);
            if (game.upgrades.b3_4.gt(0)) bricks = upgEffect("f1_1").pow(upgEffect("b3_4")).mul(bricks);
            if (game.upgrades.b3_5.gt(0)) bricks = upgEffect("f1_2").pow(upgEffect("b3_5")).mul(bricks);
            if (game.upgrades.b3_6.gt(0)) {
				let b = upgEffect("l2_1");
				if(b.gte("1e10000"))b = b.log10().log10().mul(2.5).pow(10000);
				bricks = b.pow(upgEffect("b3_6")).mul(bricks);
			}
            if (game.upgrades.b3_7.gt(0)) bricks = upgEffect("l2_2").pow(upgEffect("b3_7")).mul(bricks);
            if (game.upgrades.f4.gt(0)) bricks = upgEffect("f4").mul(bricks);
        if (game.upgrades.pow14) bricks = game.misc.powerRitual.mul(bricks);
        if (game.upgrades.pow15) bricks = game.misc.fameRitual.mul(bricks);
            if (game.upgrades.k1_2.gt(0)) bricks = EN.tetr(bricks, upgEffect("k1_2"));
            game.bricks = game.bricks.add(bricks);
            game.bricksTotal = game.bricksTotal.add(bricks);
            brickbox.innerHTML = format(game.bricks, 0);
            makeAddEffect(brickbox, "+" + format(bricks, 0));
			}
			
			
			if (game.upgrades.pow23) {
				let gain = rituals.mana.gain().div(100);
				game.mana = game.mana.add(gain);
				game.manaTotal = game.manaTotal.add(gain);
				manabox.innerHTML = format(game.mana, 0);
				makeAddEffect(manabox, "+" + format(gain, 0));
			}
			if (game.upgrades.pow23) {
				let gain = rituals.elemite.gain().div(100);
				game.misc.elemiteMul = game.misc.elemiteMul.add(gain);
			}
        } else {
            tile[0][1] = tile[0][1].add(player[1]);
            playerFail = true;
        }
    } else if (tile[0][0] == "loot") {
        let gain = tile[0][1].mul(upgEffect("f3")).mul(upgEffect("b2"));
        if (game.upgrades.f3_1) gain = gain.mul(upgEffect("f1_1"));
        if (game.upgrades.f3_2) gain = gain.mul(upgEffect("f1_2"));
        if (game.upgrades.pow3) gain = gain.mul(upgEffect("pow1"));
        if (game.upgrades.pow13) gain = gain.mul(game.misc.powerRitual);
        if (game.upgrades.b4_2) {
            let oldLoot = game.loot;
            game.loot = game.loot.mul(gain).max(gain);
            game.lootTotal = game.lootTotal.add(game.loot.sub(oldLoot));
            makeAddEffect(lootbox, "×" + format(gain, 0));
        } else {
            game.loot = game.loot.add(gain);
            game.lootTotal = game.lootTotal.add(gain);
            makeAddEffect(lootbox, "+" + format(gain, 0));
        }
        lootbox.innerHTML = format(game.loot, 0);
/*
        if (game.upgrades.k3_11) {
            let oldBricks = EN(game.bricks);
            game.bricks = game.loot.tetr(upgEffect("k1_1")).tetr(tile[0][1].max(10).slog(10));
            game.bricksTotal = game.bricksTotal.add(game.bricks.sub(oldBricks));
            brickbox.innerHTML = format(game.bricks, 0);
            makeAddEffect(brickbox, "×" + format(game.bricks.div(oldBricks), 0));
        }*/

        
        if (game.upgrades.m2) {
            let gain = upgEffect("e1").mul(upgEffect("m2_2")).mul(upgEffect("k1_4")).mul(game.misc.elemiteMul);
            if (game.upgrades.pow22) gain = gain.mul(upgEffect("pow22"));
            if (game.upgrades.e1_8) gain = gain.mul(game.mana.max(10).log10().pow(upgEffect("e1_8")));
            if (game.upgrades.e1_9) gain = gain.mul(game.karma.max(10).log10().pow(upgEffect("e1_9")));
            game.elemite = game.elemite.add(gain);
            game.elemiteTotal = game.elemiteTotal.add(gain);
            elemitebox.innerHTML = format(game.elemite, 0);
            makeAddEffect(elemitebox, "+" + format(gain, 0));
        } 

			if(game.upgrades.fl){
				
		let gain = player[1].max(1).log10().pow(1.5);
		let tetr = upgEffect("k1");
        //if (game.spells.fire > 0) tetr = tetr.mul(upgEffect("e2"));
        if (game.upgrades.k1.gt(0)) {
			if(gain.gte(EN.tetr(10,1e15))){
				gain = EN.tetr(10,gain.slog().add(tetr));
			}else gain = gain.tetr(tetr);
		}
		if(gain.gte(1e100))gain=gain.log10().pow(50);
		if(gain.gte("ee10")){
			gain=gain.slog().pow(10).mul(10/59049);
			if(gain.gte(100))gain=gain.log10().mul(50);
			gain=EN.pow(10,EN.pow(10,gain));
		}
		if(game.upgrades.pow1){
			gain = gain.mul(upgEffect("pow1"));
		}
		if(game.upgrades.pow5){
			gain = gain.mul(upgEffect("pow5"));
		}
        if(gain.gte(0))gain = gain.pow(upgEffect("f1_2")).mul(upgEffect("f1")).mul(upgEffect("l1")).pow(upgEffect("f1_1")).pow(upgEffect("l1_1")).pow(upgEffect("b1"));
		gain = gain.pow(game.misc.fameRitual);

if(sha512_256(localStorage.supporterCode+"loader3229").slice(2) == '97b4061c3a44e2950549613ba148eff34250441a9b3121698a15fcefdb4f5a')gain = gain.mul(2);

        if (game.upgrades.l3_14) {
            let oldPoints = game.points;
            game.points = game.points.mul(gain).max(gain);
            game.pointsTotal = game.pointsTotal.add(game.points.sub(oldPoints));
            makeAddEffect(famebox, "×" + format(gain, 0));
        } else {
            game.points = game.points.add(gain);
            game.pointsTotal = game.pointsTotal.add(gain);
            makeAddEffect(famebox, "+" + format(gain, 0));
        }
        famebox.innerHTML = format(game.points, 0);
        if (game.upgrades.f2_1.gt(0)) {
			let gain = upgEffect("f2_1");
			player[1] = player[1].mul(gain);
            makeAddEffect(powerbox, "×" + format(gain, 0));
            powerbox.innerHTML = format(game.power, 0);
        }
			}
			
			if(game.upgrades.ll){
			let gain = tile[0][1];
			player[1] = player[1].pow(gain);
            makeAddEffect(powerbox, "^" + format(gain, 0));
            powerbox.innerHTML = format(game.power, 0);
			}
			if(game.upgrades.bl){
            let bricks = 1;
            if (game.upgrades.b3.gt(0)) {
				let llpower = player[1].max(1e10).log10().log10();
				if(llpower.gte(1000))llpower=llpower.log10().pow(5).div(243).mul(1000).min(1e13);
				bricks = llpower.pow(upgEffect("b3")).mul(bricks);
			}
            if (game.upgrades.b3_1.gt(0)) bricks = game.upgrades.f2.add(1).pow(upgEffect("b3_1")).mul(bricks);
            if (game.upgrades.b3_2.gt(0)) bricks = game.points.max("ee10").iteratedlog(10, EN(3)).pow(upgEffect("b3_2")).mul(bricks);
            if (game.upgrades.b3_3.gt(0)) bricks = game.loot.max(1e10).log10().log10().pow(upgEffect("b3_3")).mul(bricks);
            if (game.upgrades.b3_4.gt(0)) bricks = upgEffect("f1_1").pow(upgEffect("b3_4")).mul(bricks);
            if (game.upgrades.b3_5.gt(0)) bricks = upgEffect("f1_2").pow(upgEffect("b3_5")).mul(bricks);
            if (game.upgrades.b3_6.gt(0)) {
				let b = upgEffect("l2_1");
				if(b.gte("1e10000"))b = b.log10().log10().mul(2.5).pow(10000);
				bricks = b.pow(upgEffect("b3_6")).mul(bricks);
			}
            if (game.upgrades.b3_7.gt(0)) bricks = upgEffect("l2_2").pow(upgEffect("b3_7")).mul(bricks);
            if (game.upgrades.f4.gt(0)) bricks = upgEffect("f4").mul(bricks);
        if (game.upgrades.pow14) bricks = game.misc.powerRitual.mul(bricks);
        if (game.upgrades.pow15) bricks = game.misc.fameRitual.mul(bricks);
            if (game.upgrades.k1_2.gt(0)) bricks = EN.tetr(bricks, upgEffect("k1_2"));
            game.bricks = game.bricks.add(bricks);
            game.bricksTotal = game.bricksTotal.add(bricks);
            brickbox.innerHTML = format(game.bricks, 0);
            makeAddEffect(brickbox, "+" + format(bricks, 0));
			}
		
        let tetr = upgEffect("k1_1");
        if (game.upgrades.k3_9){ player[1] = player[1].tetr(tetr);
            makeAddEffect(powerbox, "↑↑" + format(tetr, 2));
		}
			game.power = player[1];
            powerbox.innerHTML = format(game.power, 0);
        tile.shift();
        tile.unshift(player);
    } else {
        tile.unshift(player);
    }

    if (!pTile.length && pPos[0] > 0 && getTower(pPos[0]).length > 1) {
        getTower(pPos[0]).splice(pPos[1], 1);
        getTower(pPos[0] - 1).unshift([]);
    }

    let karmaAdd = EN(0);
    let levelCompleted = isLevelCompleted();
    let towerCompleted = game.level[pPos[0] + offset[0]].length == 1;

    if (playerFail) {
        addAnimator(function (t) {
            if (!this.gen && t >= 500) {
                /*if (offset[0] == 1) {
                    game.levelBase = makeLevel(game.upgrades.f2.div(upgEffect("b4_4")).min(upgEffect("k3_2")).toNumber() + 1);
                    game.level = fixLevel(JSON.parse(JSON.stringify(game.levelBase)));
                } else */game.level = fixLevel(JSON.parse(JSON.stringify(game.levelBase)));
				for(i = 0;;i++){
					if(game.level[i][0] && game.level[i][0][0] && game.level[i][0][0][0] == "player"){game.level[i][0][0][1] = game.power;break;}
				}
                this.gen = true;
            }
            t = Math.min(1000, t);
            canvasOffset[0] = 10000 / (500 - t) - 20 * Math.sign(500 - t);
            canvasDirty = true;
            return t < 1000;
        })
    } else if (levelCompleted || (game.upgrades.k3 && towerCompleted)) {
		let gain = player[1].max(1).log10().pow(1.5);
		let tetr = upgEffect("k1");
        //if (game.spells.fire > 0) tetr = tetr.mul(upgEffect("e2"));
        if (game.upgrades.k1.gt(0)) {
			if(gain.gte(EN.tetr(10,1e15))){
				gain = EN.tetr(10,gain.slog().add(tetr));
			}else gain = gain.tetr(tetr);
		}
		if(gain.gte(1e100))gain=gain.log10().pow(50);
		if(gain.gte("ee10")){
			gain=gain.slog().pow(10).mul(10/59049);
			if(gain.gte(100))gain=gain.log10().mul(50);
			gain=EN.pow(10,EN.pow(10,gain));
		}
		if(game.upgrades.pow1){
			gain = gain.mul(upgEffect("pow1"));
		}
		
		if(game.upgrades.pow5){
			gain = gain.mul(upgEffect("pow5"));
		}
        if(gain.gte(0))gain = gain.pow(upgEffect("f1_2")).mul(upgEffect("f1")).mul(upgEffect("l1")).pow(upgEffect("f1_1")).pow(upgEffect("l1_1")).pow(upgEffect("b1"));
		gain = gain.pow(game.misc.fameRitual);

        if (game.upgrades.l3_6) {
            let oldPoints = game.points;
            game.points = game.points.mul(gain).max(gain);
            game.pointsTotal = game.pointsTotal.add(game.points.sub(oldPoints));
            makeAddEffect(famebox, "×" + format(gain, 0));
        } else {
            game.points = game.points.add(gain);
            game.pointsTotal = game.pointsTotal.add(gain);
            makeAddEffect(famebox, "+" + format(gain, 0));
        }
		
		
        famebox.innerHTML = format(game.points, 0);
        famebox.classList.remove("hidden");
        if (game.pointsTotal.gte(1500)) menu.classList.remove("hidden");

        if (game.upgrades.l3_4 && (levelCompleted || game.upgrades.k3_1)) {
            let bricks = 0;
            for (tower of game.level) bricks += tower.length;
            if (game.upgrades.b3.gt(0)) {
				let llpower = player[1].max(1e10).log10().log10();
				if(llpower.gte(1000))llpower=llpower.log10().pow(5).div(243).mul(1000).min(1e13);
				bricks = llpower.pow(upgEffect("b3")).mul(bricks);
			}
            if (game.upgrades.b3_1.gt(0)) bricks = game.upgrades.f2.add(1).pow(upgEffect("b3_1")).mul(bricks);
            if (game.upgrades.b3_2.gt(0)) bricks = game.points.max("ee10").iteratedlog(10, EN(3)).pow(upgEffect("b3_2")).mul(bricks);
            if (game.upgrades.b3_3.gt(0)) bricks = game.loot.max(1e10).log10().log10().pow(upgEffect("b3_3")).mul(bricks);
            if (game.upgrades.b3_4.gt(0)) bricks = upgEffect("f1_1").pow(upgEffect("b3_4")).mul(bricks);
            if (game.upgrades.b3_5.gt(0)) bricks = upgEffect("f1_2").pow(upgEffect("b3_5")).mul(bricks);
            if (game.upgrades.b3_6.gt(0)) {
				let b = upgEffect("l2_1");
				if(b.gte("1e10000"))b = b.log10().log10().mul(2.5).pow(10000);
				bricks = b.pow(upgEffect("b3_6")).mul(bricks);
			}
            if (game.upgrades.b3_7.gt(0)) bricks = upgEffect("l2_2").pow(upgEffect("b3_7")).mul(bricks);
            if (game.upgrades.f4.gt(0)) bricks = upgEffect("f4").mul(bricks);
        if (game.upgrades.pow14) bricks = game.misc.powerRitual.mul(bricks);
        if (game.upgrades.pow15) bricks = game.misc.fameRitual.mul(bricks);
            if (game.upgrades.k1_2.gt(0)) bricks = EN.tetr(bricks, upgEffect("k1_2"));
            game.bricks = game.bricks.add(bricks);
            game.bricksTotal = game.bricksTotal.add(bricks);
            brickbox.innerHTML = format(game.bricks, 0);
            makeAddEffect(brickbox, "+" + format(bricks, 0));
        }
        
        if (game.upgrades.m1.gt(0) && levelCompleted) karmaAdd = karmaAdd.add(upgEffect("m1").mul(game.upgrades.f2.add(1).sqrt()));

        if (levelCompleted) {
        if (game.upgrades.f2_1.gt(0)) {
			let gain = upgEffect("f2_1");
			game.power = game.power.mul(gain);
            makeAddEffect(powerbox, "×" + format(gain, 0));
            powerbox.innerHTML = format(game.power, 0);
        }
            for (let spell in spells) {
                if (game.spells[spell] > 0) {
                    game.spells[spell]--;
                    if (game.spells[spell] <= 0) game.spells[spell] = -spells[spell].cooldown();
                } else if (game.spells[spell] < 0) {
                    game.spells[spell]++;
                }
            }
            if (currentTab == "grimoire" && tabSubtabs.grimoire == "elem") updateSpellGUI();

            addAnimator(function (t) {
                if (!this.gen && t >= 500) {
                    game.levelBase = makeLevel(game.upgrades.f2.div(upgEffect("b4_4")).min(upgEffect("k3_2")).toNumber() + 1);
                    game.level = fixLevel(JSON.parse(JSON.stringify(game.levelBase)));
                    this.gen = true;
                }
                t = Math.min(1000, t);
                canvasOffset[0] = 10000 / (500 - t) - 20 * Math.sign(500 - t);
                canvasDirty = true;
                return t < 1000;
            })
        }
    }
    if (towerCompleted) {
        if (game.upgrades.l3) game.levelBase = fixLevel(JSON.parse(JSON.stringify(game.level)));
        if (game.upgrades.m1_1.gt(0)) {
            let gain = upgEffect("m1_1").mul(game.upgrades.f2.add(1).cbrt());
            if (game.upgrades.m1_4.gt(0)) gain = gain.mul(upgEffect("m1").mul(game.upgrades.f2.add(1).sqrt()).sqrt().mul(upgEffect("m1_4")))
            karmaAdd = karmaAdd.add(gain);
        }
        if (game.upgrades.k3_14) {
            let gain = rituals.mana.gain().div(100);
            game.mana = game.mana.add(gain);
            game.manaTotal = game.manaTotal.add(gain);
            manabox.innerHTML = format(game.mana, 0);
            makeAddEffect(manabox, "+" + format(gain, 0));
        }
    }

    if (game.upgrades.m1_2.gt(0)) {
        let gain = upgEffect("m1_2");
        if (game.upgrades.m1_5.gt(0)) gain = gain.mul(upgEffect("m1").mul(game.upgrades.f2.add(1).sqrt()).sqrt().mul(upgEffect("m1_5")));
        karmaAdd = karmaAdd.add(gain);
    }
    
    if (karmaAdd.gt(0)) {
        karmaAdd = karmaAdd.mul(upgEffect("m1_3")).mul(upgEffect("e1_2"));
        if (game.spells.earth > 0) karmaAdd = karmaAdd.mul(upgEffect("e2_2"));
        if (game.upgrades.pow16) karmaAdd = karmaAdd.mul(upgEffect("pow16"));
        if (game.upgrades.pow19) karmaAdd = karmaAdd.mul(upgEffect("pow19"));
        game.karma = game.karma.add(karmaAdd);
        game.karmaTotal = game.karmaTotal.add(karmaAdd);
        karmabox.innerHTML = format(game.karma, 0);
        makeAddEffect(karmabox, "+" + format(karmaAdd));
    } 

    canvasDirty = true;
	game.powerTotal=game.powerTotal.max(game.power);
	updateUpgGUI();
}

function makeLevel(diff) {

    let startAmount = game.power;

    let level = [[[["player", game.power]]]];

    startAmount = startAmount.mul(Math.random() * .3 + .6);

    let towersFactor = Math.log10(diff * .2 + 1);
    let towers = Math.random() * Math.log2(towersFactor + 1) + 1 + towersFactor;

	if(game.power.lte(1e5)){
		towers = 2;
	}
    let tHeight = 0;
    let tHeightFactor = 9 + diff * diff * .5;

    for (let x = 0; x < towers; x++) {
        let tower = [];

        while (Math.random() < tHeightFactor) {
            tHeight++;
            tHeightFactor /= 4;
        }
        tHeightFactor *= 1 + Math.sqrt(diff / 100);

	if(game.power.lte(1e5)){
		tHeight = 1;
	}
        for (let y = 0; y < tHeight; y++) {
            tower.push([]);
        }

        let p = 0;
        let t = 0;

        let lastType = "";

        while (t < 100000) {
            
            let chance = 1;

            if (upgEffect("f2_3").gt(Math.random() * chance) && (game.auto.lootGenSwitch || !game.upgrades.l3_12)) {
                let loot = EN(Math.random()).mul(upgEffect("l2_2")).add(upgEffect("l2_1")).mul(upgEffect("l2"));
                tower[p].push(["loot", loot]);
                lastType = "loot";
            } else {
	if(game.power.lte(1e5) && x == 0){
		startAmount = game.power.pow(0.9);
	}
	if(game.power.lte(1e5) && x == 1){
		startAmount = game.power.pow(0.9).mul(5.5);
	}
                tower[p].push(["enemy", startAmount.max(1).floor()]);
				if (game.upgrades.k3_6.gt(0)) startAmount = EN.tetr(10, startAmount.max(1).slog().add(upgEffect("k3_5").mul(upgEffect("k3_6")).div(100)));
                startAmount = startAmount.mul(upgEffect("f2_2").mul(Math.random()).add(1)).pow(upgEffect("l3_1").add(1).mul(game.upgrades.l3_9?upgEffect("b4").add(1):1).pow(upgEffect("l3_2")).add(upgEffect("l3_8").mul(Math.random())));
	
                //if (game.upgrades.k3_12 && lastType == "loot") startAmount = startAmount.tetr(upgEffect("k1_1"));
                lastType = "enemy";
            }

            
            if (p + 1 >= tower.length) break;
            
            if (p <= 0 || tower[p-1].length >= 3 || Math.random() < Math.max(.9 - (diff - p) / 100, .5)) p++;
            else p--;

            t++;
        }

        level.push(tower);
    }

    return level;
}

function fixLevel(level) {
    for (tower of level) for (cell of tower) for (item of cell) {
        item[1] = EN(item[1]);
    }
    return level;
}

// ------------------------------------------------------------------------------------------ Tip Logic

function showTip() {
    if (!tipbox.classList.contains("hidden")) {
        hideTip();
        setTimeout(showTip, 500);
    } else {
        let tip = tips[game.tipStage];
        tipbox.innerHTML = `<div>${tip.title}</div><div>${tip.desc}</div><div>${tip.desc2}</div>`
        tipbox.classList.remove("hidden");
    }
}
function hideTip() {
    tipbox.classList.add("hidden");
}

// ------------------------------------------------------------------------------------------ Game Loop

let delta, now;
let saveTimer = 0;
let autoTimer = 0;
let dPadDir = null;
let dPadTimer = 0;

function calc_rank(a,b){
	if(a.lte(1))return EN(0);
	let ret=a.slog().pow(2).mul(a.log10().div(a.log10().add(b)));
	if(ret.gte(16))ret=ret.mul(6.25).log10().div(2).slog().pow(2).mul(10).add(16);
	//if(ret.gte(25))ret=ret.mul(4).log10().div(2).slog().add(0.25).mul(100);
	return ret.min(9999/7);
}

function gameLoop() {
    let n = Date.now();
    delta = n - now;
    now = n;

    if (game.spells.wind > 0 && game.auto.windElem) {
        autoTimer += delta;
        if (autoTimer >= upgEffect("e2_8")) {
            let pPos = getPlayerPos();
            if (pPos) {
                if (getTower(pPos[0]).length <= 1) movePlayer([1, 0]);
                else {
                    let tUp = getTile([pPos[0], pPos[1] + 1]);
                    let tDown = getTile([pPos[0], pPos[1] - 1]);
                    if (tDown && (!tUp || tDown[0][1].lt(tUp[0][1]))) movePlayer([0, -1]);
                    else movePlayer([0, 1]);
                }
            }
            autoTimer = 0;
        }
    }

    if (dPadDir) {
        dPadTimer += delta;
        if (dPadTimer >= 200) {
            movePlayer(dPadDir);
            dPadTimer = 0;
        }
    }

    if (canvasDirty) updateCanvas();
    updateAnimator();

    for (tip in tips) {
        if (+tip > +game.tipStage && tips[tip].req && tips[tip].req()) {
            game.tipStage = tip;
            game.tipShown = true;
            showTip();
        }
    }

    if (!inRiftMode) game.playTime += delta;

    saveTimer += delta;
    if (saveTimer >= 10000) {
        save();
        saveTimer = 0;
        console.log("Game saved");
    }

	let rank=EN(1);
	rank=rank.add(calc_rank(game.powerTotal,0).min(31.2)).add(calc_rank(game.pointsTotal,3).min(13.2)).add(calc_rank(game.lootTotal,6).min(10.5)).add(calc_rank(game.bricksTotal,9).min(7.3)).add(calc_rank(game.manaTotal.add(1),0).min(5.6)).add(calc_rank(game.karmaTotal,12).min(5.7)).add(calc_rank(game.elemiteTotal.add(1),0).min(4.5)).add((game.rift**0.5)*21).toNumber();
	if(rank>99.99999)rankbox.innerHTML = "100";else rankbox.innerHTML = Math.floor(rank) + "("+Math.floor((rank-Math.floor(rank))*10000)/100+"%)";
	if (game.upgrades.b5_3)game.misc.powerRitual = game.misc.powerRitual.add(rituals.power.gain());
	if (game.upgrades.b5_4)game.misc.fameRitual = game.misc.fameRitual.add(rituals.fame.gain());
	if (game.upgrades.b5_5)game.misc.lootRitual = game.misc.lootRitual.add(rituals.loot.gain());
    requestAnimationFrame(gameLoop);
}