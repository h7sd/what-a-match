const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const {
  activeGames,
  sendReward,
  getBalance,
  claimDaily,
  getRandomTrivia,
  checkTriviaAnswer,
  coinFlip,
  generateSecretNumber,
  checkGuess,
  spinSlots,
  rpsChoices,
  rpsEmojis,
  rpsResult,
  getBotRPSChoice,
  createDeck,
  handValue,
  formatHand
} = require('./minigames');

// Cooldowns (prevent spam)
const cooldowns = new Map();
const COOLDOWN_TIME = 5000; // 5 seconds

function isOnCooldown(userId, game) {
  const key = `${userId}-${game}`;
  const now = Date.now();
  if (cooldowns.has(key) && now - cooldowns.get(key) < COOLDOWN_TIME) {
    return true;
  }
  cooldowns.set(key, now);
  return false;
}

// Command definitions
const commands = [
  new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check your UV balance'),
  
  new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Claim your daily UV reward'),
  
  new SlashCommandBuilder()
    .setName('trivia')
    .setDescription('Answer a trivia question to win UV'),
  
  new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Flip a coin to double your bet')
    .addIntegerOption(opt => 
      opt.setName('bet')
        .setDescription('Amount to bet (10-100 UV)')
        .setRequired(true)
        .setMinValue(10)
        .setMaxValue(100))
    .addStringOption(opt =>
      opt.setName('choice')
        .setDescription('Heads or Tails')
        .setRequired(true)
        .addChoices(
          { name: 'Heads', value: 'heads' },
          { name: 'Tails', value: 'tails' }
        )),
  
  new SlashCommandBuilder()
    .setName('guess')
    .setDescription('Guess a number between 1-100 (5 tries)')
    .addIntegerOption(opt =>
      opt.setName('bet')
        .setDescription('Amount to bet (10-100 UV)')
        .setRequired(true)
        .setMinValue(10)
        .setMaxValue(100)),
  
  new SlashCommandBuilder()
    .setName('slots')
    .setDescription('Spin the slot machine!')
    .addIntegerOption(opt =>
      opt.setName('bet')
        .setDescription('Amount to bet (10-100 UV)')
        .setRequired(true)
        .setMinValue(10)
        .setMaxValue(100)),
  
  new SlashCommandBuilder()
    .setName('rps')
    .setDescription('Rock Paper Scissors')
    .addIntegerOption(opt =>
      opt.setName('bet')
        .setDescription('Amount to bet (10-100 UV)')
        .setRequired(true)
        .setMinValue(10)
        .setMaxValue(100))
    .addStringOption(opt =>
      opt.setName('choice')
        .setDescription('Your choice')
        .setRequired(true)
        .addChoices(
          { name: '🪨 Rock', value: 'rock' },
          { name: '📄 Paper', value: 'paper' },
          { name: '✂️ Scissors', value: 'scissors' }
        )),
  
  new SlashCommandBuilder()
    .setName('blackjack')
    .setDescription('Play Blackjack!')
    .addIntegerOption(opt =>
      opt.setName('bet')
        .setDescription('Amount to bet (10-500 UV)')
        .setRequired(true)
        .setMinValue(10)
        .setMaxValue(500)),
  
  new SlashCommandBuilder()
    .setName('link')
    .setDescription('Link your Discord to UserVault')
    .addStringOption(opt =>
      opt.setName('username')
        .setDescription('Your UserVault username')
        .setRequired(true)),
  
  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the UV leaderboard'),
];

// Command handlers
async function handleBalance(interaction, config) {
  const result = await getBalance(interaction.user.id, config.MINIGAME_EDGE_URL, config.DISCORD_WEBHOOK_SECRET);
  
  if (!result.success) {
    return interaction.reply({
      content: `❌ ${result.error || 'Failed to get balance. Make sure your Discord is linked with /link!'}`,
      ephemeral: true
    });
  }
  
  const embed = new EmbedBuilder()
    .setColor(0xFFD700)
    .setTitle('💰 Your UV Balance')
    .setDescription(`**${result.username}**`)
    .addFields(
      { name: '💵 Balance', value: `${result.balance.toLocaleString()} UV`, inline: true },
      { name: '📈 Total Earned', value: `${result.totalEarned.toLocaleString()} UV`, inline: true },
      { name: '📉 Total Spent', value: `${result.totalSpent.toLocaleString()} UV`, inline: true }
    )
    .setFooter({ text: 'UserVault Marketplace' })
    .setTimestamp();
  
  return interaction.reply({ embeds: [embed] });
}

async function handleDaily(interaction, config) {
  const result = await claimDaily(interaction.user.id, config.MINIGAME_EDGE_URL, config.DISCORD_WEBHOOK_SECRET);
  
  if (!result.success) {
    return interaction.reply({
      content: `❌ ${result.error || 'Failed to claim daily. Make sure your Discord is linked!'}`,
      ephemeral: true
    });
  }
  
  const embed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle('🎁 Daily Reward Claimed!')
    .setDescription(`You received **${result.reward} UV**!`)
    .addFields(
      { name: '🔥 Streak', value: `${result.streak} days`, inline: true },
      { name: '💰 New Balance', value: `${result.newBalance.toLocaleString()} UV`, inline: true }
    )
    .setFooter({ text: 'Come back tomorrow for more!' })
    .setTimestamp();
  
  return interaction.reply({ embeds: [embed] });
}

async function handleTrivia(interaction, config) {
  if (isOnCooldown(interaction.user.id, 'trivia')) {
    return interaction.reply({ content: '⏳ Please wait before playing again!', ephemeral: true });
  }
  
  const question = getRandomTrivia();
  const gameKey = `trivia-${interaction.user.id}`;
  
  activeGames.set(gameKey, { question, startTime: Date.now() });
  
  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('🧠 Trivia Time!')
    .setDescription(question.q)
    .addFields({ name: '💰 Reward', value: `${question.reward} UV` })
    .setFooter({ text: 'Reply with your answer within 30 seconds!' });
  
  await interaction.reply({ embeds: [embed] });
  
  // Create message collector
  const filter = m => m.author.id === interaction.user.id;
  const collector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });
  
  collector.on('collect', async (m) => {
    const game = activeGames.get(gameKey);
    if (!game) return;
    
    activeGames.delete(gameKey);
    
    if (checkTriviaAnswer(game.question, m.content)) {
      const result = await sendReward(
        interaction.user.id,
        game.question.reward,
        'trivia',
        'Trivia correct answer',
        config.MINIGAME_EDGE_URL,
        config.DISCORD_WEBHOOK_SECRET
      );
      
      const winEmbed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('✅ Correct!')
        .setDescription(`You won **${game.question.reward} UV**!`)
        .addFields({ name: '💰 New Balance', value: `${result.newBalance?.toLocaleString() || '?'} UV` });
      
      m.reply({ embeds: [winEmbed] });
    } else {
      const loseEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ Wrong!')
        .setDescription(`The correct answer was: **${game.question.a[0]}**`);
      
      m.reply({ embeds: [loseEmbed] });
    }
  });
  
  collector.on('end', (collected) => {
    if (collected.size === 0) {
      activeGames.delete(gameKey);
      interaction.followUp({ content: '⏰ Time\'s up! The trivia has expired.' });
    }
  });
}

async function handleCoinflip(interaction, config) {
  if (isOnCooldown(interaction.user.id, 'coinflip')) {
    return interaction.reply({ content: '⏳ Please wait before playing again!', ephemeral: true });
  }
  
  const bet = interaction.options.getInteger('bet');
  const choice = interaction.options.getString('choice');
  
  // Check balance first
  const balanceResult = await getBalance(interaction.user.id, config.MINIGAME_EDGE_URL, config.DISCORD_WEBHOOK_SECRET);
  if (!balanceResult.success || balanceResult.balance < bet) {
    return interaction.reply({ content: '❌ Insufficient UV balance!', ephemeral: true });
  }
  
  const result = coinFlip();
  const won = result === choice;
  
  const embed = new EmbedBuilder()
    .setTitle('🪙 Coin Flip')
    .setDescription(`The coin landed on **${result.toUpperCase()}**!`);
  
  if (won) {
    const rewardResult = await sendReward(
      interaction.user.id,
      bet,
      'coinflip',
      `Coinflip win (${bet} UV)`,
      config.MINIGAME_EDGE_URL,
      config.DISCORD_WEBHOOK_SECRET
    );
    
    embed.setColor(0x00FF00)
      .addFields(
        { name: '🎉 Result', value: 'You won!', inline: true },
        { name: '💰 Winnings', value: `+${bet} UV`, inline: true },
        { name: '💵 Balance', value: `${rewardResult.newBalance?.toLocaleString() || '?'} UV`, inline: true }
      );
  } else {
    const lossResult = await sendReward(
      interaction.user.id,
      -bet,
      'coinflip',
      `Coinflip loss (${bet} UV)`,
      config.MINIGAME_EDGE_URL,
      config.DISCORD_WEBHOOK_SECRET
    );
    
    embed.setColor(0xFF0000)
      .addFields(
        { name: '😢 Result', value: 'You lost!', inline: true },
        { name: '💸 Lost', value: `-${bet} UV`, inline: true },
        { name: '💵 Balance', value: `${lossResult.newBalance?.toLocaleString() || '?'} UV`, inline: true }
      );
  }
  
  return interaction.reply({ embeds: [embed] });
}

async function handleSlots(interaction, config) {
  if (isOnCooldown(interaction.user.id, 'slots')) {
    return interaction.reply({ content: '⏳ Please wait before playing again!', ephemeral: true });
  }
  
  const bet = interaction.options.getInteger('bet');
  
  // Check balance
  const balanceResult = await getBalance(interaction.user.id, config.MINIGAME_EDGE_URL, config.DISCORD_WEBHOOK_SECRET);
  if (!balanceResult.success || balanceResult.balance < bet) {
    return interaction.reply({ content: '❌ Insufficient UV balance!', ephemeral: true });
  }
  
  // Deduct bet first
  await sendReward(interaction.user.id, -bet, 'slots', 'Slots bet', config.MINIGAME_EDGE_URL, config.DISCORD_WEBHOOK_SECRET);
  
  const { result, payout } = spinSlots();
  const netWin = payout > 0 ? payout : 0;
  
  const embed = new EmbedBuilder()
    .setTitle('🎰 Slot Machine')
    .setDescription(`\n## ${result.join(' | ')}\n`);
  
  if (payout > 0) {
    const rewardResult = await sendReward(
      interaction.user.id,
      payout,
      'slots',
      `Slots jackpot (${payout} UV)`,
      config.MINIGAME_EDGE_URL,
      config.DISCORD_WEBHOOK_SECRET
    );
    
    embed.setColor(0xFFD700)
      .addFields(
        { name: '🎉 JACKPOT!', value: `You won **${payout} UV**!`, inline: true },
        { name: '💵 Balance', value: `${rewardResult.newBalance?.toLocaleString() || '?'} UV`, inline: true }
      );
  } else {
    embed.setColor(0xFF0000)
      .addFields({ name: '😢 No match', value: `You lost ${bet} UV` });
  }
  
  return interaction.reply({ embeds: [embed] });
}

async function handleRPS(interaction, config) {
  if (isOnCooldown(interaction.user.id, 'rps')) {
    return interaction.reply({ content: '⏳ Please wait before playing again!', ephemeral: true });
  }
  
  const bet = interaction.options.getInteger('bet');
  const playerChoice = interaction.options.getString('choice');
  
  // Check balance
  const balanceResult = await getBalance(interaction.user.id, config.MINIGAME_EDGE_URL, config.DISCORD_WEBHOOK_SECRET);
  if (!balanceResult.success || balanceResult.balance < bet) {
    return interaction.reply({ content: '❌ Insufficient UV balance!', ephemeral: true });
  }
  
  const botChoice = getBotRPSChoice();
  const result = rpsResult(playerChoice, botChoice);
  
  const embed = new EmbedBuilder()
    .setTitle('✊ Rock Paper Scissors')
    .setDescription(`You: ${rpsEmojis[playerChoice]} vs Bot: ${rpsEmojis[botChoice]}`);
  
  if (result === 'win') {
    const rewardResult = await sendReward(
      interaction.user.id,
      bet,
      'rps',
      `RPS win (${bet} UV)`,
      config.MINIGAME_EDGE_URL,
      config.DISCORD_WEBHOOK_SECRET
    );
    
    embed.setColor(0x00FF00)
      .addFields(
        { name: '🎉 You Win!', value: `+${bet} UV`, inline: true },
        { name: '💵 Balance', value: `${rewardResult.newBalance?.toLocaleString() || '?'} UV`, inline: true }
      );
  } else if (result === 'lose') {
    const lossResult = await sendReward(
      interaction.user.id,
      -bet,
      'rps',
      `RPS loss (${bet} UV)`,
      config.MINIGAME_EDGE_URL,
      config.DISCORD_WEBHOOK_SECRET
    );
    
    embed.setColor(0xFF0000)
      .addFields(
        { name: '😢 You Lose!', value: `-${bet} UV`, inline: true },
        { name: '💵 Balance', value: `${lossResult.newBalance?.toLocaleString() || '?'} UV`, inline: true }
      );
  } else {
    embed.setColor(0xFFFF00)
      .addFields({ name: '🤝 Tie!', value: 'No UV won or lost' });
  }
  
  return interaction.reply({ embeds: [embed] });
}

async function handleBlackjack(interaction, config) {
  const bet = interaction.options.getInteger('bet');
  const gameKey = `blackjack-${interaction.user.id}`;
  
  // Check if already in a game
  if (activeGames.has(gameKey)) {
    return interaction.reply({ content: '❌ You already have an active Blackjack game!', ephemeral: true });
  }
  
  // Check balance
  const balanceResult = await getBalance(interaction.user.id, config.MINIGAME_EDGE_URL, config.DISCORD_WEBHOOK_SECRET);
  if (!balanceResult.success || balanceResult.balance < bet) {
    return interaction.reply({ content: '❌ Insufficient UV balance!', ephemeral: true });
  }
  
  // Create deck and deal
  const deck = createDeck();
  const playerHand = [deck.pop(), deck.pop()];
  const dealerHand = [deck.pop(), deck.pop()];
  
  const game = { deck, playerHand, dealerHand, bet };
  activeGames.set(gameKey, game);
  
  const playerValue = handValue(playerHand);
  
  // Check for natural blackjack
  if (playerValue === 21) {
    activeGames.delete(gameKey);
    const winAmount = Math.floor(bet * 1.5);
    const rewardResult = await sendReward(
      interaction.user.id,
      winAmount,
      'blackjack',
      `Blackjack! (${winAmount} UV)`,
      config.MINIGAME_EDGE_URL,
      config.DISCORD_WEBHOOK_SECRET
    );
    
    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle('🃏 BLACKJACK!')
      .setDescription(`You got 21! You win **${winAmount} UV**!`)
      .addFields(
        { name: 'Your Hand', value: formatHand(playerHand) + ` (${playerValue})` },
        { name: '💵 Balance', value: `${rewardResult.newBalance?.toLocaleString() || '?'} UV` }
      );
    
    return interaction.reply({ embeds: [embed] });
  }
  
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('bj_hit')
        .setLabel('Hit')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🃏'),
      new ButtonBuilder()
        .setCustomId('bj_stand')
        .setLabel('Stand')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('✋'),
      new ButtonBuilder()
        .setCustomId('bj_double')
        .setLabel('Double Down')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('💰')
    );
  
  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('🃏 Blackjack')
    .setDescription(`Bet: **${bet} UV**`)
    .addFields(
      { name: 'Your Hand', value: formatHand(playerHand) + ` (${playerValue})`, inline: true },
      { name: 'Dealer Shows', value: formatHand([dealerHand[0]]) + ' 🂠', inline: true }
    )
    .setFooter({ text: 'Hit, Stand, or Double Down!' });
  
  return interaction.reply({ embeds: [embed], components: [row] });
}

async function handleLink(interaction, config) {
  const username = interaction.options.getString('username');
  
  // This would need to be implemented - for now just show instructions
  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('🔗 Link Your Account')
    .setDescription(`To link your Discord to UserVault:`)
    .addFields(
      { name: '1️⃣ Go to your Dashboard', value: 'uservault.gg/dashboard' },
      { name: '2️⃣ Go to Profile tab', value: 'Enter your Discord ID in the Discord field' },
      { name: '3️⃣ Your Discord ID', value: `\`${interaction.user.id}\`` },
      { name: '4️⃣ Save', value: 'Click Save Changes!' }
    )
    .setFooter({ text: 'Once linked, you can use minigames!' });
  
  return interaction.reply({ embeds: [embed], ephemeral: true });
}

module.exports = {
  commands,
  handleBalance,
  handleDaily,
  handleTrivia,
  handleCoinflip,
  handleSlots,
  handleRPS,
  handleBlackjack,
  handleLink,
  activeGames
};
