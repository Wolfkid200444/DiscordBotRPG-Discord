const GModule = require("../GModule");
const Globals = require("../../Globals");
const Translator = require("../../Translator/Translator");
const ItemShow = require("../../Drawings/ItemShow");
const Inventory = require("../../Drawings/Inventory");
const Emojis = require("../../Drawings/Emojis");


class InventoryModule extends GModule {
    constructor() {
        super();
        this.commands = ["item", "itemfav", "itemunfav", "inv", "inventory", "sell", "sellall", "sendmoney"];
        this.startLoading("Inventory");
        this.init();
        this.endLoading("Inventory");
    }

    async run(message, command, args) {
        let msg = "";
        let mentions = message.mentions.users;
        let firstMention;
        let data;
        let axios = Globals.connectedUsers[message.author.id].getAxios();

        switch (command) {
            case "item":
                data = await axios.get("/game/inventory/item/" + args[0]);
                data = data.data;
                if (data.error == null) {
                    let itemmsg;
                    if (data.equippedStats != null) {
                        itemmsg = ItemShow.showInInventoryItem(data);
                    } else {
                        itemmsg = ItemShow.showEquippedItem(data);
                    }

                    let sellEmoji = Emojis.getID("money_bag");
                    let favoEmoji = data.item.isFavorite == false ? Emojis.getID("star") : Emojis.getID("eight_pointed_black_star");
                    let itemmsgsent = await message.channel.send(itemmsg).catch(() => null);

                    await Promise.all([
                        itemmsgsent.react(sellEmoji),
                        itemmsgsent.react(favoEmoji)
                    ]).catch(() => null);

                    const filter = (reaction, user) => {
                        return [sellEmoji, favoEmoji].includes(reaction.emoji.name) && user.id === message.author.id;
                    };


                    const collected = await itemmsgsent.awaitReactions(filter, {
                        max: 1,
                        time: 22000
                    });
                    const reaction = collected.first();
                    if (reaction != null) {
                        switch (reaction.emoji.name) {
                            case sellEmoji:
                                data = await axios.post("/game/inventory/sell", {
                                    idItem: args[0],
                                    number: 1,
                                });
                                data = data.data;
                                if (data.error == null) {
                                    msg = data.success;
                                } else {
                                    msg = data.error;
                                }

                                break;

                            case favoEmoji:
                                if (data.item.isFavorite == false) {
                                    data = await axios.post("/game/inventory/itemfav", {
                                        idItem: args[0]
                                    });
                                } else {
                                    data = await axios.post("/game/inventory/itemunfav", {
                                        idItem: args[0]
                                    });
                                }
                                data = data.data;
                                if (data.error == null) {
                                    msg = data.success;
                                } else {
                                    msg = data.error;
                                }
                                break;
                        }
                    }
                } else {
                    msg = data.error;
                }
                break;

            case "itemfav":
                data = await axios.post("/game/inventory/itemfav", {
                    idItem: args[0]
                });
                data = data.data;
                if (data.error == null) {
                    msg = data.success;
                } else {
                    msg = data.error;
                }
                break;

            case "itemunfav":
                data = await axios.post("/game/inventory/itemunfav", {
                    idItem: args[0]
                });
                data = data.data;
                if (data.error == null) {
                    msg = data.success;
                } else {
                    msg = data.error;
                }
                break;

            case "inv":
            case "inventory":
                let idRarity, idType, level, page = 1;;
                if (args.length > 0) {
                    if (args.length > 1) {
                        if (args[0] != null) {
                            switch (args[0]) {
                                case "rarity":
                                    idRarity = args[1];
                                    break;
                                case "type":
                                    idType = args[1];
                                    break;
                                case "level":
                                    level = args[1];
                                    break;
                            }
                        }
                        page = args[3] != null ? args[3] : 1;
                    } else {
                        page = args[0];
                    }
                }

                data = await axios.get("/game/inventory/show/" + page, {
                    params: {
                        idRarity: idRarity,
                        idType: idType,
                        level: level
                    }
                });
                data = data.data;
                if (data.error == null) {
                    msg = Inventory.ciDisplay(data);
                } else {
                    msg = data.error;
                }

                break;

            case "sell":
                data = await axios.post("/game/inventory/sell", {
                    idItem: args[0],
                    number: args[1],
                });
                data = data.data;
                if (data.error == null) {
                    msg = data.success;
                } else {
                    msg = data.error;
                }
                break;

            case "sellall":
                data = await axios.post("/game/inventory/sellall");
                data = data.data;
                if (data.error == null) {
                    msg = data.success;
                } else {
                    msg = data.error;
                }
                break;

            case "sendmoney":
                firstMention = mentions.first();
                let isMention = false;
                let mId = 0;
                if (firstMention) {
                    args[0] = firstMention.id;
                    isMention = true;
                }
                data = await axios.post("/game/inventory/sendmoney", {
                    id: args[0],
                    isMention: isMention,
                    amount: args[1]
                });
                data = data.data;
                if (data.error == null) {
                    msg = data.success;
                } else {
                    msg = data.error;
                }
                break;
        }

        this.sendMessage(message, msg);
    }
}

module.exports = InventoryModule;