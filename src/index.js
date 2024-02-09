import pkg from "grammy";

import botError from "./bot-error.js";
import dotenv from "dotenv";
import listReminders from "./controller/list-reminder.js";

const { Bot, InlineKeyboard, Keyboard, session } = pkg;

// .env
dotenv.config();
// define bot
const bot = new Bot(process.env.TOKEN);
// error
botError(bot);

bot.use(session({ initial: () => ({ state: "start", reminders: [] }) }));

const commands = [{ command: "start", description: "Start You Reminder" }];

try {
  await bot.api.setMyCommands(commands);
  console.log("Bot commands set successfully!");
} catch (error) {
  console.error("Failed to set bot commands:", error.description);
}

bot.command("start", (ctx) => {
  ctx.session.state = "main";
  return ctx.reply("What should I remind you about?", {
    reply_markup: {
      keyboard: [["➕ Add", "List"], ["Settings"]],
      resize_keyboard: true,
    },
  });
});

bot.hears("➕ Add", (ctx) => {
  ctx.session.state = "adding";
  return ctx.reply(
    "Please type your reminder (e.g., 'Call someone at 9 PM'):",
    {
      reply_markup: {
        keyboard: [["❌ Cancel"]],
        resize_keyboard: true,
      },
    }
  );
});

bot.hears("List", (ctx) => listReminders(ctx));

// Handling callback query for editing
bot.callbackQuery(/^edit_\d+$/, async (ctx) => {
  const index = parseInt(ctx.callbackQuery.data.split("_")[1]);
  const reminder = ctx.session.reminders[index];

  ctx.session.editingIndex = index;
  ctx.session.state = "editing";

  await ctx.answerCallbackQuery();

  return ctx.reply(`Editing Reminder:\n${reminder}`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Delete", callback_data: `delete_${index}` }],
        [{ text: "Back", callback_data: "back_to_list" }],
      ],
    },
  });
});

// Handle 'Delete' and 'Back' actions
bot.callbackQuery(/^delete_\d+$/, async (ctx) => {
  const index = parseInt(ctx.callbackQuery.data.split("_")[1]);
  ctx.session.reminders.splice(index, 1); // Remove the reminder

  await ctx.answerCallbackQuery(); // Always respond to callback queries
  return ctx.reply("Reminder deleted.", {
    reply_markup: {
      keyboard: [["➕ Add", "List"], ["Settings"]],
      resize_keyboard: true,
    },
  });
});

bot.callbackQuery("back_to_list", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.state = "main";
  await listReminders(ctx);
});

bot.on("message:text", (ctx) => {
  if (ctx.session.state === "adding") {
    const reminder = ctx.message.text;
    ctx.session.reminders.push(reminder);
    ctx.session.state = "main";
    return ctx.reply("✅ Reminder added ", {
      reply_markup: {
        keyboard: [["➕ Add", "List"], ["Settings"]],
        resize_keyboard: true,
      },
    });
  }
});

// Handle 'Cancel' button
bot.hears("❌ Cancel", (ctx) => {
  ctx.session.state = "main";
  return ctx.reply("Cancelled.", {
    reply_markup: {
      keyboard: [["➕ Add", "List"], ["Settings"]],
      resize_keyboard: true,
    },
  });
});

bot.start();
