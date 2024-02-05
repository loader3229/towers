let tips = [
    {
        title: "Welcome to Towers of Googology!",
        desc: "Let's get started!",
        desc2: "(Click this box to continue)",
        advClick: true,
    },
    {
        title: "Your Goal: Defeat All the Reds",
        desc: "The number shown on them is their Power - you need to have a higher Power than the enemy.",
        desc2: "(Click this box to continue)",
        advClick: true,
    },
    {
        title: "You are Blue",
        desc: "Use WASD or arrow keys to move.",
        desc2: "(For touchscreen users: Swiping the screen should also works)",
    },
    {
        title: "You Have Absorb Powers",
        desc: "You gain all the Power of all defeated enemies.",
        desc2: "(Defeat all remaining reds to continue. You can only go to the next tower when your current tower is cleared. In this version, if you died, you keep your power.)",
        req() { 
            let pPos = getPlayerPos();
            return getTile(pPos)[0][1].gt(1);
        }
    },
    {
        title: "Level Completed!",
        desc: "Each level you beaten will award you with Fame. The more Power you have at the end, the more Fame you'll get.",
        desc2: "(Accumulate 1,500 Fame to unlock something. In this version, if you completed a level, you keep your power.)",
        req() { 
            return game.pointsTotal.gt(0);
        }
    },
    {
        title: "Fame Upgrades Unlocked!",
        desc: "What even is a game without upgrades? Use your Fame to unlock upgrades that, in turn, help you make more Fame!",
        desc2: "(You can now click this box to dismiss it.)",
        disClick: true,
        req() { 
            return game.pointsTotal.gte(1500);
        }
    },
    {
        title: "Buy Max Unlocked!",
        desc: "Hold an upgrade to buy the most that you can buy at once - plus, only the last one is actually priced!",
        desc2: "(Click this box to dismiss)",
        disClick: true,
        req() { 
            return game.pointsTotal.gte(1e64);
        }
    },
    {
        title: "Loot Unlocked!",
        desc: "Loot are spawned on the playfield as yellow and gives their own currency when taken. They also do not require having a higher Power, nor increase yours.",
        desc2: "(Click this box to dismiss)",
        disClick: true,
        req() { 
            return game.upgrades.f2_3.gt(0);
        }
    },
    {
        title: "Bricks Unlocked!",
        desc: "You'll now bulldoze towers when you complete a level, which will give you Bricks based on how large the level is. Brick Upgrades' buy max don't work like other upgrades - all upgrades will be priced!",
        desc2: "(Click this box to dismiss)",
        disClick: true,
        req() { 
            return game.upgrades.l3_4;
        }
    },
    {
        title: "Grimoire Unlocked!",
        desc: "You are now capable of casting dark magic! The first available spell is \"The Ritual\", which allows you to \"reborn\" - reset everything to get a new currency called \"Mana\". Everything will grow very fast from now on, so you'll reach the point before reset in no time.",
        desc2: "(Click this box to dismiss)",
        disClick: true,
        req() { 
            return game.upgrades.b4_3;
        }
    },
    {
        title: "F Notation?",
        desc: "You Power has gone so big it needs to be expresed into a different notation!\n1Fx means 1ee...ee1 with x e's.",
        desc2: "(Click this box to dismiss)",
        disClick: true,
        req() { 
            return game.powerTotal.gte("10^^5");
        }
    },
    {
        title: "Max Active Realm Level Reached!",
        desc: "The generated levels won't become anymore difficult after Realm Level 1,000, but you can still upgrade it to increase your Karma gain!",
        desc2: "(Click this box to dismiss)",
        disClick: true,
        req() { 
            return game.upgrades.f2.gte(999);
        }
    },
    {
        title: "Elemental System Unlocked!",
        desc: "The Elemental system allows you to cast powerful temporary spells with a cost of Elemite, which can be found by getting Loot. These spells can be accessed in the Grimoire tab.",
        desc2: "(Click this box to dismiss)",
        disClick: true,
        req() { 
            return game.upgrades.m2;
        }
    },
    {
        title: "The Rift Unlocked!",
        desc: "⠠⠠⠠⠢⠞⠻⠀⠮⠀⠗⠊⠋⠞⠠⠄<br/>⠠⠠⠠⠞⠗⠁⠝⠎⠉⠢⠙⠀⠔⠞⠕⠀⠁⠀⠓⠊⠣⠻⠀⠸⠺⠠⠄",
        desc2: "(Click this box to dismiss...?)",
        disClick: true,
        req() { 
            return game.upgrades.e3;
        }
    },
]