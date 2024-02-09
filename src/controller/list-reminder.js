import pkg from "grammy";

const { InlineKeyboard } = pkg;

export default async function listReminders(ctx) {
  let message = "Your Reminders:";
  const inlineKeyboard = new InlineKeyboard();

  ctx.session.reminders.forEach((reminder, index) => {
    message += `\n${index + 1}. ${reminder}`;
    inlineKeyboard.text(`${index + 1}`, `edit_${index}`).row();
  });

  if (ctx.session.reminders.length === 0) {
    message = "You have no reminders.";
  }

  await ctx.reply(`${message} \n \n Choose number to edit:`, {
    reply_markup: inlineKeyboard,
  });
}
