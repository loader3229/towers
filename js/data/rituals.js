let rituals = {
    levelrestart: {
        title: "Level/Tower Restarter",
        gain() { return EN(1); },
        gainText(x) { return game.upgrades.l3?"Restart Tower":"Restart Level"; },
        inv(x) { return "" },
        invText(x) { return "" },
        onRitual() {
			game.level = fixLevel(JSON.parse(JSON.stringify(game.levelBase)));
			for(i = 0;;i++){
				if(game.level[i][0] && game.level[i][0][0] && game.level[i][0][0][0] == "player"){game.level[i][0][0][1] = game.power;break;}
			}
            canvasDirty = true;
        },
    },
    levelregenerate: {
        title: "Level Generator",
        req: ["l3_13"],
        gain() { return EN(1); },
        gainText(x) { return "Generate a new level"; },
        inv(x) { return "" },
        invText(x) { return "" },
        onRitual() {
			game.levelBase = makeLevel(game.upgrades.f2.div(upgEffect("b4_4")).min(upgEffect("k3_2")).toNumber() + 1);
            game.level = fixLevel(JSON.parse(JSON.stringify(game.levelBase)));
			for(i = 0;;i++){
				if(game.level[i][0] && game.level[i][0][0] && game.level[i][0][0][0] == "player"){game.level[i][0][0][1] = game.power;break;}
			}
			if(game.spells.wind == 1)game.spells.wind=-upgEffect("e2_7");
			else if(game.spells.wind > 0)game.spells.wind--;
            canvasDirty = true;
        },
    },
    power: {
        title: "Power Ritual (Resets Power)",
        gain() { 
			if(game.power.lte(1e100))return EN(0);
			let gain=game.power.log10().log10().log10().div(EN.log10(2)).pow(3);
			if(gain.gte(1e10))gain=EN.pow(1e5,gain.slog());
			if(gain.gte("1e1000"))gain=gain.log10().pow(1000/3);
			gain=gain.mul(game.misc.fameRitual).sub(game.misc.powerRitual).max(0);
			return gain;
		},
        gainText(x) { return format(game.misc.powerRitual) + " -> " + format(game.misc.powerRitual.add(x)) + "<br>Raise 'Power Multiplier' to a power, and multiply 'Absorb Bonus'.<br>"; },
        inv(x) {
			let ret=game.misc.powerRitual.div(game.misc.fameRitual);
			if(ret.gte("1e1000"))ret=EN.pow(10, ret.pow(3/1000));
			if(ret.gte(1e10))ret=EN.tetr(10, ret.log10().div(5));
			ret=EN.pow(10, EN.pow(10, EN.pow(2, ret.cbrt())))
			return ret;
		},
        invText(x) { return "Req: " + format(x) +" Power"; },
        onRitual() {
            let gain = this.gain();
            game.misc.powerRitual = game.misc.powerRitual.add(gain);
            if (game.upgrades.b5_3)return;
            game.power = EN(1e100);
			powerbox.innerHTML = "1.0000e100";
			game.levelBase = makeLevel(game.upgrades.f2.div(upgEffect("b4_4")).min(upgEffect("k3_2")).toNumber() + 1);
            game.level = fixLevel(JSON.parse(JSON.stringify(game.levelBase)));

            canvasDirty = true;
            setTab("");
        },
    },
    fame: {
        title: "Fame Ritual (Resets Power, Fame and Fame Upgrades)",
        req: ["b5"],
        gain() { 
			if(game.points.lte(1e100))return EN(0);
			let gain=game.points.max(1e100).log10().log10().log10().div(EN.log10(2)).pow(2).mul(game.misc.lootRitual).sub(game.misc.fameRitual).max(0);
			return gain;
		},
        gainText(x) { return format(game.misc.fameRitual) + " -> " + format(game.misc.fameRitual.add(x)) + "<br>Raise fame gain to a power, and multiply Power Ritual.<br>"; },
        inv(x) { return EN.pow(10, EN.pow(10, EN.pow(2, game.misc.fameRitual.div(game.misc.lootRitual).sqrt()))) },
        invText(x) { return "Req: " + format(x) +" Fame"; },
        onRitual() {
            let gain = this.gain();
            game.misc.fameRitual = game.misc.fameRitual.add(gain);
            game.misc.powerRitual = game.misc.powerRitual.add(rituals.power.gain());
            if (game.upgrades.b5_4)return;

            game.power = EN(1e100);
			powerbox.innerHTML = "1.0000e100";
			game.points = EN(0);
            famebox.innerHTML = format(0, 0);
            for (let upg in upgrades) {
                let data = upgrades[upg];
                if (["points"].includes(data.costType)) {
                    game.upgrades[upg] = data.isBool ? false : EN(0);
                }
            }
            if (game.upgrades.k3_4) game.upgrades.l3_5 = game.upgrades.k2 = true;
            if (game.upgrades.k3_8) game.upgrades.b4_1 = game.upgrades.k2_1 = true;
			game.levelBase = makeLevel(1);
            game.level = fixLevel(JSON.parse(JSON.stringify(game.levelBase)));

            canvasDirty = true;
            setTab("");
        },
    },
    loot: {
        title: "Loot Ritual (Resets Power, Fame, Loot, Fame Upgrades and Loot Upgrades)",
        req: ["b5_1"],
        gain() { 
			if(game.loot.lte(1e100))return EN(0);
			let gain=game.loot.max(1e100).log10().log10().log10().div(EN.log10(2)).pow(3).sub(game.misc.lootRitual).max(0);
			return gain;
		},
        gainText(x) { return format(game.misc.lootRitual) + " -> " + format(game.misc.lootRitual.add(x)) + "<br>Raise Base Loot to a power, and multiply Fame Ritual.<br>"; },
        inv(x) { return EN.pow(10, EN.pow(10, EN.pow(2, game.misc.lootRitual.cbrt()))) },
        invText(x) { return "Req: " + format(x) +" Loot"; },
        onRitual() {
            let gain = this.gain();
            game.misc.lootRitual = game.misc.lootRitual.add(gain);
            game.misc.fameRitual = game.misc.fameRitual.add(rituals.fame.gain());
            game.misc.powerRitual = game.misc.powerRitual.add(rituals.power.gain());
            if (game.upgrades.b5_5)return;

            game.power = EN(1e100);
			powerbox.innerHTML = "1.0000e100";
			game.points = EN(0);
			game.loot = EN(0);
            famebox.innerHTML = lootbox.innerHTML = format(0, 0);
            for (let upg in upgrades) {
                let data = upgrades[upg];
                if (["points", "loot"].includes(data.costType)) {
                    game.upgrades[upg] = data.isBool ? false : EN(0);
                }
            }
            if (game.upgrades.k3_4) game.upgrades.l3_5 = game.upgrades.k2 = true;
            if (game.upgrades.k3_8) game.upgrades.b4_1 = game.upgrades.k2_1 = true;
			game.levelBase = makeLevel(1);
            game.level = fixLevel(JSON.parse(JSON.stringify(game.levelBase)));

            lootbox.classList.add("hidden");

            canvasDirty = true;
            setTab("");
        },
    },
    mana: {
        title: "Mana Ritual (Resets Everything before Mana)",
        req: ["b5_2"],
        gain() { return game.points.gte("ee10") ? game.points.max(10).slog(10).pow(5).div(243).mul(upgEffect("k1_3")).mul(upgEffect("e1_1")).mul(game.upgrades.pow17?upgEffect("pow17"):1).floor() : EN(0); },
        inv(x) { return EN.tetr(10, x.div(upgEffect("e1_1")).div(upgEffect("k1_3")).div(game.upgrades.pow17?upgEffect("pow17"):1).mul(243).pow(1/5)).max("ee10"); },
        invText(x) { return "<br>Next at " + format(x) +" Fame"; },
        onRitual() {
            let gain = this.gain();
            game.misc.lootRitual = game.misc.lootRitual.add(rituals.loot.gain());
            game.misc.fameRitual = game.misc.fameRitual.add(rituals.fame.gain());
            game.misc.powerRitual = game.misc.powerRitual.add(rituals.power.gain());
			game.mana = game.mana.add(gain);
            game.manaTotal = game.manaTotal.add(gain);
            manabox.innerHTML = format(game.mana, 0);
            manabox.classList.remove("hidden");
            makeAddEffect(manabox, "+" + format(gain, 0));

            game.power = EN(1e100);
			powerbox.innerHTML = "1.0000e100";
			game.points = game.loot = game.bricks = EN(0);
            famebox.innerHTML = lootbox.innerHTML = brickbox.innerHTML = format(0, 0);
            for (let upg in upgrades) {
                let data = upgrades[upg];
                if (["points", "loot", "bricks", (game.upgrades.k3_7?"":"power")].includes(data.costType)) {
                    game.upgrades[upg] = data.isBool ? false : EN(0);
                }
            }
            // game.upgrades.f2_3 = EN(1);
            // game.upgrades.l3_4 = true;
            game.upgrades.b4_3 = true;
            game.upgrades.b5 = true;
            game.upgrades.b5_1 = true;
            game.upgrades.b5_2 = true;
            if (game.upgrades.k3_4) game.upgrades.l3_5 = game.upgrades.k2 = true;
            if (game.upgrades.k3_8) game.upgrades.b4_1 = game.upgrades.k2_1 = true;
            game.levelBase = makeLevel(1);
            game.level = fixLevel(JSON.parse(JSON.stringify(game.levelBase)));

            lootbox.classList.add("hidden");
            brickbox.classList.add("hidden");

            canvasDirty = true;
            setTab("");
        },
    },
    elemite: {
        title: "Elemite Ritual",
        req: ["e3"],
        gain() { return game.power.gte("10^^e15") ? game.power.max(10).slog(10).log10().div(14).log10().mul(10).pow(upgEffect("e1_3")).mul(upgEffect("e1_4")) : EN(0); },
        gainText(x) { return "×" + format(game.misc.elemiteMul) + " -> ×" + format(game.misc.elemiteMul.add(x)); },
        inv(x) { return "" },
        onRitual() {
            let gain = this.gain();
            game.misc.lootRitual = game.misc.lootRitual.add(rituals.loot.gain());
            game.misc.fameRitual = game.misc.fameRitual.add(rituals.fame.gain());
            game.misc.powerRitual = game.misc.powerRitual.add(rituals.power.gain());
            game.misc.elemiteMul = game.misc.elemiteMul.add(gain);

            game.power = EN(1e100);
			powerbox.innerHTML = "1.0000e100";
            game.points = game.loot = game.bricks = game.mana = game.karma = EN(0);
            famebox.innerHTML = lootbox.innerHTML = brickbox.innerHTML = manabox.innerHTML = karmabox.innerHTML = format(0, 0);
            for (let upg in upgrades) {
                let data = upgrades[upg];
                if (["points", "loot", "bricks", "mana", "karma"].includes(data.costType)) {
                    game.upgrades[upg] = data.isBool ? false : EN(0);
                }
            }

            game.upgrades.b4_3 = game.upgrades.m2 = game.upgrades.m2_1 = game.upgrades.l3_5 = game.upgrades.b4_1 = true;
            game.upgrades.f2_3 = game.upgrades.k1 = game.upgrades.k1_1 = EN(10);
            if (game.upgrades.e3_1) game.upgrades.k3_13 = game.upgrades.k2_3 = true;
            if (game.upgrades.e3_2) game.upgrades.k3_15 = game.upgrades.k2_4 = true;
            game.levelBase = makeLevel(1);
            game.level = fixLevel(JSON.parse(JSON.stringify(game.levelBase)));

            canvasDirty = true;
            setTab("");
        },
    },
}