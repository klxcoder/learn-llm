// Train the model using an n-gram (default n=2 for bigrams).
function trainModel(text, n = 2) {
  const words = text.split(/\s+/);
  const model = {};
  for (let i = 0; i <= words.length - n; i++) {
    const gram = words.slice(i, i + n).join(" ");
    const nextWord = words[i + n];
    if (!model[gram]) {
      model[gram] = [];
    }
    if (nextWord) {
      model[gram].push(nextWord);
    }
  }
  return model;
}

function generateText(model, startGram, numWords = 50, n = 2) {
  let currentGram = startGram;
  let result = currentGram;
  for (let i = 0; i < numWords; i++) {
    const nextWords = model[currentGram];
    if (!nextWords || nextWords.length === 0) break;  // Check for empty array too.
    const nextWord = nextWords[Math.floor(Math.random() * nextWords.length)];
    result += " " + nextWord;
    // Update the gram by removing the first word and adding the new word.
    const gramWords = currentGram.split(" ");
    gramWords.shift();
    gramWords.push(nextWord);
    currentGram = gramWords.join(" ");
  }
  return result;
}

// Example training text.
const trainingText = "This is a simple example text for our language model. It demonstrates how a basic Markov chain can generate text. Enjoy experimenting with this toy model!";
const n = 2;
const words = trainingText.split(/\s+/);
const startGram = words.slice(0, n).join(" ");
const model = trainModel(trainingText, n);

console.log(model)

// Start generating from the chosen starting gram.
const generatedParagraph = generateText(model, startGram, 30, n);
console.log(generatedParagraph);
