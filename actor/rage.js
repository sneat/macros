// 	DISCLAIMER: This macro is a slightly modified version of the original masterwork written by Felix#6196.
//              Original version is on the wiki here: 
//              https://github.com/foundry-vtt-community/wiki/wiki/Script-Macros#rage-toggle-for-inhabited-character
//
//      Differences in my version (Norc#5108, 05/02/2020):
//
//      Biggest change: Changed macro to work for selected token, NOT the user's official character (game.user.character)
//                      This eliminated an error I was getting as a GM that prevented me from using the script.
//
//      Other changes:  1. Fixed Rage icon toggling, for me it was backwards.
//                      2. Added error messages for trying to rage with no token or no barbarian selected
//                      3. Added auto-bear totem detection, with a minor edit to character sheet required.
//                      4. Added resource/usage deduction


//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//!!!   Bonus Tip 1:                                                                                                                       !!!
//!!!   If you chose the Spirit Seeker Primal path, and you chose the Bear totem spirit (resistance to all non-psychic damage).            !!!
//!!!   in your 5E character sheet, edit the name of your Totem Spirit feature to EXACTLY "Totem Spirit (Bear)" instead.                   !!!
//!!!   This allows you to automatically gain the extra Bear Totem Spirit resistances.                                                     !!!
//!!!                                                                                                                                      !!!
//!!!   Bonus Tip 2:                                                                                                                       !!!
//!!!   If you use the Combat Utility Belt module's Condition Lab, add a condition called Raging with the same icon as the optional rage   !!!
//!!!   icon overlay, 'icons/svg/explosion.svg' by default.  See OPTIONAL RAGE ICON section below.                                         !!!
//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

//declarations
let barb = '';
let chatMsg = '';
let bear = '';
let rageIconPath = '';

//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//!!!   OPTIONAL RAGE ICON - Adds this icon to your character when raging only. Comment out following line to disable (add // before)      !!!

rageIconPath = 'icons/svg/explosion.svg'

//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//!!!   OPTIONAL RESOURCE DEDUCTION - Will reduce Resource and Feature Uses if enabled and prevent raging if there are no resources left.
//!!!                                 Set to false if you do not want this.

const deductResource = true;
const preventNegativeResource = true;

//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!



//check to see if Actor exists and is a barbarian
if (actor !== undefined && actor !== null) {
	// get the barbarian class item
	barb = actor.items.find(i => i.name === 'Barbarian');
	if (barb == undefined) {
		ui.notifications.warn("Please select a single barbarian token.");
	}

	if (barb !== undefined && barb !== null) {
		chatMsg = '';
		let enabled = false;
		// store the state of the rage toggle in flags
		if (actor.data.flags.rageMacro !== null && actor.data.flags.rageMacro !== undefined) {
			enabled = true;
		}
		// if rage is active, disable it
		if (enabled) {
			chatMsg = `${actor.name} is no longer raging.`;

			// reset resistances
			let obj = {};
			obj['flags.rageMacro'] = null;
			obj['data.traits.dr'] = actor.data.flags.rageMacro.oldResistances;
			actor.update(obj);

			// reset items
			for (let item of actor.items) {
				if (item.data.flags.rageMacro !== null && item.data.flags.rageMacro !== undefined) {
					// restoring the old value from flags
					let oldDmg = item.data.flags.rageMacro.oldDmg;
					let obj = {};
					obj['data.damage.parts'] = oldDmg;
					obj['flags.rageMacro'] = null;
					item.update(obj);
				}
			}


			// if rage is disabled, enable it
		} else {
			if (deductResource) {
				let hasAvailableResource = false;

				// Look for Resources under the Core actor data
				let resourceKey = Object.keys(actor.data.data.resources).filter(k => actor.data.data.resources[k].label === "Rage").shift();
				if (resourceKey && (actor.data.data.resources[resourceKey].value > 0 || !preventNegativeResource)) {
					hasAvailableResource = true;
					actor.data.data.resources[resourceKey].value--;
				}

				// Look for Rage Feat that has uses
				let items = actor.items.filter(o => o.data.name === "Rage" && o.data.hasUses && (o.data.data.uses.value > 0 || !preventNegativeResource))
				if (items.length > 0) {
					hasAvailableResource = true;
					items.forEach(o => o.data.data.uses.value--);
				}
				if (!hasAvailableResource) {
					ui.notifications.warn(`${actor.name} does not have any rage left, time for a rest!`);
					return;
				}
				if (actor.sheet.rendered) {
					// Update the actor sheet if it is currently open
					actor.render(true);
				}
			}

			chatMsg = `${actor.name} is RAAAAAGING!`;

			// update resistance
			let obj = {};
			// storing old resistances in flags to restore later
			obj['flags.rageMacro.enabled'] = true;
			obj['flags.rageMacro.oldResistances'] = JSON.parse(JSON.stringify(actor.data.data.traits.dr));

			// add bludgeoning, piercing and slashing resistance
			let newResistance = actor.data.data.traits.dr;
			if (newResistance.value.indexOf('bludgeoning') === -1) newResistance.value.push('bludgeoning');
			if (newResistance.value.indexOf('piercing') === -1) newResistance.value.push('piercing');
			if (newResistance.value.indexOf('slashing') === -1) newResistance.value.push('slashing');



			//If bear totem, add bear totem resistances.
			bear = actor.items.find(i => i.name === "Totem Spirit (Bear)")
			if (bear !== undefined && bear) {
				if (newResistance.value.indexOf('acid') === -1) newResistance.value.push('acid');
				if (newResistance.value.indexOf('cold') === -1) newResistance.value.push('cold');
				if (newResistance.value.indexOf('fire') === -1) newResistance.value.push('fire');
				if (newResistance.value.indexOf('force') === -1) newResistance.value.push('force');
				if (newResistance.value.indexOf('lightning') === -1) newResistance.value.push('lightning');
				if (newResistance.value.indexOf('necrotic') === -1) newResistance.value.push('necrotic');
				if (newResistance.value.indexOf('poison') === -1) newResistance.value.push('poison');
				if (newResistance.value.indexOf('radiant') === -1) newResistance.value.push('radiant');
				if (newResistance.value.indexOf('thunder') === -1) newResistance.value.push('thunder');
			}

			obj['data.traits.dr'] = newResistance;
			actor.update(obj);

			// update items
			// determining the barbarian level
			let barblvl = barb.data.data.levels;
			// the formula to determin the rage bonus damage depending on barbarian level
			let ragedmg = 2 + Math.floor(barblvl / 9) - (barblvl === 8 ? 1 : 0);
			for (let item of actor.items) {
				let isMelee = getProperty(item, 'data.data.actionType') === 'mwak';
				if (isMelee && item.data.data.damage.parts.length > 0) {
					console.log('updating ' + item);
					let obj = {};
					let dmg = item.data.data.damage.parts;
					obj['flags.rageMacro.oldDmg'] = JSON.parse(JSON.stringify(dmg));
					dmg[0][0] = `${dmg[0][0]} + ${ragedmg}`;
					obj['data.damage.parts'] = dmg;
					item.update(obj);
				}
			}

		}
		// toggle rage icon
		//  - this is optional and requires you to set the path for the token icon you want to use for rage
		token = canvas.tokens.controlled.find(t => t.actor.id === actor.id);
		token.toggleEffect(rageIconPath);
	}

} else ui.notifications.warn("Please select a token.");

// write to chat if needed:
if (chatMsg !== '') {
	let chatData = {
		user: game.user._id,
		speaker: ChatMessage.getSpeaker(),
		content: chatMsg
	};
	ChatMessage.create(chatData, {});
}
