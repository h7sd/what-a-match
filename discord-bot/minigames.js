const crypto = require('crypto');

// Trivia Questions
const triviaQuestions = [
  { q: "What is the capital of France?", a: ["paris"], reward: 25 },
  { q: "How many planets are in our solar system?", a: ["8", "eight"], reward: 20 },
  { q: "What year did the Titanic sink?", a: ["1912"], reward: 30 },
  { q: "What is the chemical symbol for gold?", a: ["au"], reward: 25 },
  { q: "Who painted the Mona Lisa?", a: ["leonardo da vinci", "da vinci", "leonardo"], reward: 30 },
  { q: "What is the largest ocean on Earth?", a: ["pacific", "pacific ocean"], reward: 20 },
  { q: "In what year did World War II end?", a: ["1945"], reward: 25 },
  { q: "What is the square root of 144?", a: ["12", "twelve"], reward: 20 },
  { q: "Who wrote Romeo and Juliet?", a: ["shakespeare", "william shakespeare"], reward: 25 },
  { q: "What is the capital of Japan?", a: ["tokyo"], reward: 20 },
  { q: "How many continents are there?", a: ["7", "seven"], reward: 15 },
  { q: "What is the largest mammal?", a: ["blue whale", "whale"], reward: 25 },
  { q: "What color do you get mixing blue and yellow?", a: ["green"], reward: 15 },
  { q: "What is H2O commonly known as?", a: ["water"], reward: 10 },
  { q: "How many sides does a hexagon have?", a: ["6", "six"], reward: 15 },
];

// Slots symbols
const slotSymbols = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎', '7️⃣'];
const slotPayouts = {
  '💎💎💎': 500,
  '7️⃣7️⃣7️⃣': 300,
  '⭐⭐⭐': 150,
  '🍇🍇🍇': 100,
  '🍊🍊🍊': 75,
  '🍋🍋🍋': 50,
  '🍒🍒🍒': 25,
};

// Blackjack deck
const suits = ['♠️', '♥️', '♦️', '♣️'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// Active games storage
const activeGames = new Map();

// Generate HMAC signature
function generateSignature(payload, secret) {
  const timestamp = Date.now().toString();
  const message = `${timestamp}.${JSON.stringify(payload)}`;
  const signature = crypto.createHmac('sha256', secret).update(message).digest('hex');
  return { signature, timestamp };
}

// Send reward to backend
async function sendReward(discordUserId, amount, gameType, description, edgeFunctionUrl, webhookSecret) {
  const payload = {
    action: 'add_uv',
    discordUserId,
    amount,
    gameType,
    description
  };
  
  const { signature, timestamp } = generateSignature(payload, webhookSecret);
  
  try {
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-signature': signature,
        'x-webhook-timestamp': timestamp
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending reward:', error);
    return { success: false, error: error.message };
  }
}

// Get user balance
async function getBalance(discordUserId, edgeFunctionUrl, webhookSecret) {
  const payload = {
    action: 'get_balance',
    discordUserId
  };
  
  const { signature, timestamp } = generateSignature(payload, webhookSecret);
  
  try {
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-signature': signature,
        'x-webhook-timestamp': timestamp
      },
      body: JSON.stringify(payload)
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error getting balance:', error);
    return { success: false, error: error.message };
  }
}

// Claim daily reward
async function claimDaily(discordUserId, edgeFunctionUrl, webhookSecret) {
  const payload = {
    action: 'daily_reward',
    discordUserId
  };
  
  const { signature, timestamp } = generateSignature(payload, webhookSecret);
  
  try {
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-signature': signature,
        'x-webhook-timestamp': timestamp
      },
      body: JSON.stringify(payload)
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error claiming daily:', error);
    return { success: false, error: error.message };
  }
}

// Trivia game
function getRandomTrivia() {
  return triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
}

function checkTriviaAnswer(question, answer) {
  return question.a.some(a => a.toLowerCase() === answer.toLowerCase().trim());
}

// Coin flip
function coinFlip() {
  return Math.random() < 0.5 ? 'heads' : 'tails';
}

// Number guess (1-100)
function generateSecretNumber() {
  return Math.floor(Math.random() * 100) + 1;
}

function checkGuess(secret, guess) {
  if (guess === secret) return 'correct';
  if (guess < secret) return 'higher';
  return 'lower';
}

// Slots
function spinSlots() {
  const result = [
    slotSymbols[Math.floor(Math.random() * slotSymbols.length)],
    slotSymbols[Math.floor(Math.random() * slotSymbols.length)],
    slotSymbols[Math.floor(Math.random() * slotSymbols.length)]
  ];
  
  const resultStr = result.join('');
  let payout = 0;
  
  // Check for jackpot
  if (slotPayouts[resultStr]) {
    payout = slotPayouts[resultStr];
  } else if (result[0] === result[1] || result[1] === result[2]) {
    // Two in a row
    payout = 10;
  }
  
  return { result, payout };
}

// Rock Paper Scissors
const rpsChoices = ['rock', 'paper', 'scissors'];
const rpsEmojis = { rock: '🪨', paper: '📄', scissors: '✂️' };

function rpsResult(playerChoice, botChoice) {
  if (playerChoice === botChoice) return 'tie';
  if (
    (playerChoice === 'rock' && botChoice === 'scissors') ||
    (playerChoice === 'paper' && botChoice === 'rock') ||
    (playerChoice === 'scissors' && botChoice === 'paper')
  ) {
    return 'win';
  }
  return 'lose';
}

function getBotRPSChoice() {
  return rpsChoices[Math.floor(Math.random() * rpsChoices.length)];
}

// Blackjack helpers
function createDeck() {
  const deck = [];
  for (const suit of suits) {
    for (const value of values) {
      deck.push({ suit, value });
    }
  }
  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function cardValue(card) {
  if (card.value === 'A') return 11;
  if (['K', 'Q', 'J'].includes(card.value)) return 10;
  return parseInt(card.value);
}

function handValue(hand) {
  let total = 0;
  let aces = 0;
  
  for (const card of hand) {
    total += cardValue(card);
    if (card.value === 'A') aces++;
  }
  
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  
  return total;
}

function formatCard(card) {
  return `${card.value}${card.suit}`;
}

function formatHand(hand) {
  return hand.map(formatCard).join(' ');
}

module.exports = {
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
  formatHand,
  triviaQuestions
};
