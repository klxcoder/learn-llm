// Train the model: Build an n-gram to frequency map.
function trainModel(text, n = 2) {
  const words = text.split(/\s+/);
  const model = {};
  for (let i = 0; i <= words.length - n; i++) {
    const gram = words.slice(i, i + n).join(" ");
    const nextWord = words[i + n];
    if (!model[gram]) {
      model[gram] = {};
    }
    if (nextWord) {
      model[gram][nextWord] = (model[gram][nextWord] || 0) + 1;
    }
  }
  return model;
}

// Weighted random selection from a frequency map.
function weightedRandomChoice(freqMap) {
  let total = 0;
  for (let word in freqMap) {
    total += freqMap[word];
  }
  let rand = Math.random() * total;
  for (let word in freqMap) {
    rand -= freqMap[word];
    if (rand < 0) return word;
  }
  return null;
}

// Generate text using the weighted n-gram model.
function generateText(model, startGram, numWords = 50, n = 2) {
  let currentGram = startGram;
  let result = currentGram;
  for (let i = 0; i < numWords; i++) {
    const freqMap = model[currentGram];
    if (!freqMap) break;
    const nextWord = weightedRandomChoice(freqMap);
    if (!nextWord) break;
    result += " " + nextWord;
    const gramWords = currentGram.split(" ");
    gramWords.shift();
    gramWords.push(nextWord);
    currentGram = gramWords.join(" ");
  }
  return result;
}

// Example training text.
const trainingText = "The dog likes eating food. The dog likes eating fish. The cat likes eating food. The cat likes eating fish. The dog is friendly and playful. The cat is graceful and curious. The fish is swimming in clear water. The fish is colorful and lively. The food is delicious and nutritious. The food is served with care. The fish like to swim together in a school. The fish like to explore their surroundings.";

const n = 2;
const words = trainingText.split(/\s+/);
const startGram = words.slice(0, n).join(" ");
const model = trainModel(trainingText, n);
console.log(model)

// Start generating text from the starting n-gram.
const generatedParagraph = generateText(model, startGram, 30, n);
console.log(generatedParagraph);
